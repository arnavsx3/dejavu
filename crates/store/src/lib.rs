//! SQLite persistence. Open and use a store on a blocking worker thread.

use std::{fs, io, path::Path, time::Duration};

use chrono::{DateTime, Utc};
use dejavu_core::{MAX_MOMENT_PHOTOS, Moment, Photo, TextNote};
use rusqlite::{Connection, OptionalExtension, Row, TransactionBehavior, params, types::Type};
use thiserror::Error;
use uuid::Uuid;

const SCHEMA_VERSION: i64 = 2;

#[derive(Debug, Error)]
pub enum StoreError {
    #[error("could not access the local memory database")]
    Io(#[from] io::Error),
    #[error("could not read or write the local memory database")]
    Database(#[from] rusqlite::Error),
    #[error("this database needs a newer version of dejavu (schema {0})")]
    NewerSchema(i64),
    #[error("this moment no longer exists")]
    NotFound,
    #[error("this moment changed since you opened it; refresh before trying again")]
    Conflict,
    #[error("{0}")]
    Validation(String),
}

#[derive(Debug)]
pub struct MomentStore {
    connection: Connection,
}

impl MomentStore {
    /// Open a private database, creating its parent directory and schema if needed.
    /// Failures are surfaced; an unreadable database is never replaced or reset.
    pub fn open(path: &Path) -> Result<Self, StoreError> {
        if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
            let mut builder = fs::DirBuilder::new();
            builder.recursive(true);
            #[cfg(unix)]
            {
                use std::os::unix::fs::DirBuilderExt;
                builder.mode(0o700);
            }
            builder.create(parent)?;
        }

        let mut options = fs::OpenOptions::new();
        options.read(true).write(true).create(true).truncate(false);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let file = options.open(path)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            file.set_permissions(fs::Permissions::from_mode(0o600))?;
        }
        drop(file);

        let mut connection = Connection::open(path)?;
        connection.pragma_update(None, "foreign_keys", true)?;
        connection.pragma_update(None, "secure_delete", true)?;
        connection.busy_timeout(Duration::from_secs(5))?;
        let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let version: i64 =
            transaction.pragma_query_value(None, "user_version", |row| row.get(0))?;
        if version > SCHEMA_VERSION {
            return Err(StoreError::NewerSchema(version));
        }
        if version == 0 {
            transaction.execute_batch(include_str!("../migrations/001_moments.sql"))?;
        }
        if version < 2 {
            transaction.execute_batch(include_str!("../migrations/002_photos.sql"))?;
        }
        transaction.commit()?;
        connection.pragma_update(None, "journal_mode", "WAL")?;
        Ok(Self { connection })
    }

    pub fn list(&self) -> Result<Vec<Moment>, StoreError> {
        let mut statement = self.connection.prepare(
            "SELECT id, body, created_at, updated_at FROM moments ORDER BY created_at DESC, id DESC",
        )?;
        let rows = statement.query_map([], |row| read_moment(row, &self.connection))?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn create(&self, body: &TextNote) -> Result<Moment, StoreError> {
        self.save(None, body.as_str(), &[], &[])
    }

    pub fn update(
        &self,
        id: Uuid,
        body: &TextNote,
        revision: DateTime<Utc>,
    ) -> Result<Moment, StoreError> {
        let photos = self.photo_ids(id)?;
        self.save(Some((id, revision)), body.as_str(), &photos, &[])
    }

    /// Save caption and attachments in one transaction. Existing photos must belong
    /// to this moment; revision failure rolls back all image changes as well.
    pub fn save(
        &self,
        existing: Option<(Uuid, DateTime<Utc>)>,
        body: &str,
        keep: &[Uuid],
        added: &[NewPhoto],
    ) -> Result<Moment, StoreError> {
        if keep.len() + added.len() > MAX_MOMENT_PHOTOS {
            return Err(StoreError::Validation(
                "Keep up to six photos in one moment.".into(),
            ));
        }
        let body = TextNote::for_moment(body, !keep.is_empty() || !added.is_empty())
            .map_err(|error| StoreError::Validation(error.to_string()))?;
        let tx = self.connection.unchecked_transaction()?;
        let now = Utc::now().timestamp_millis();
        let id = existing.map_or_else(Uuid::new_v4, |(id, _)| id);
        if let Some((_, revision)) = existing {
            let changed = tx.execute(
                "UPDATE moments SET body = ?1, updated_at = MAX(?2, updated_at + 1) WHERE id = ?3 AND updated_at = ?4",
                params![body.as_str(), now, id.to_string(), revision.timestamp_millis()],
            )?;
            if changed == 0 {
                return Err(self.missing_or_conflict(id));
            }
        } else {
            tx.execute(
                "INSERT INTO moments (id, body, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                params![id.to_string(), body.as_str(), now],
            )?;
        }
        let owned = self.photo_ids(id)?;
        let unique: std::collections::HashSet<_> = keep.iter().collect();
        if unique.len() != keep.len() || keep.iter().any(|photo| !owned.contains(photo)) {
            return Err(StoreError::Validation(
                "Those photos do not belong to this moment.".into(),
            ));
        }
        // Remove omitted photos, then reorder retained photos without unique collisions.
        for photo in &owned {
            if !keep.contains(photo) {
                tx.execute("DELETE FROM photos WHERE id = ?1", [photo.to_string()])?;
            }
        }
        // Retained order stays fixed. New prints are appended to the remaining prints.
        let mut position = 0;
        for photo in &owned {
            if keep.contains(photo) {
                tx.execute(
                    "UPDATE photos SET position = ?1 WHERE id = ?2",
                    params![position, photo.to_string()],
                )?;
                position += 1;
            }
        }
        for photo in added {
            tx.execute("INSERT INTO photos (id, moment_id, position, width, height, image, thumbnail) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![Uuid::new_v4().to_string(), id.to_string(), position, photo.width, photo.height, photo.image, photo.thumbnail])?;
            position += 1;
        }
        let moment = tx.query_row(
            "SELECT id, body, created_at, updated_at FROM moments WHERE id = ?1",
            [id.to_string()],
            |row| read_moment(row, &tx),
        )?;
        tx.commit()?;
        Ok(moment)
    }

    fn photo_ids(&self, id: Uuid) -> Result<Vec<Uuid>, StoreError> {
        Ok(read_photos(&self.connection, id)?
            .into_iter()
            .map(|photo| photo.id)
            .collect())
    }

    pub fn photo(&self, id: Uuid, thumbnail: bool) -> Result<Vec<u8>, StoreError> {
        let sql = if thumbnail {
            "SELECT thumbnail FROM photos WHERE id = ?1"
        } else {
            "SELECT image FROM photos WHERE id = ?1"
        };
        self.connection
            .query_row(sql, [id.to_string()], |row| row.get(0))
            .optional()?
            .ok_or(StoreError::NotFound)
    }

    pub fn delete(&self, id: Uuid, expected_updated_at: DateTime<Utc>) -> Result<(), StoreError> {
        let changed = self.connection.execute(
            "DELETE FROM moments WHERE id = ?1 AND updated_at = ?2",
            params![id.to_string(), expected_updated_at.timestamp_millis()],
        )?;
        if changed == 0 {
            return Err(self.missing_or_conflict(id));
        }
        Ok(())
    }

    fn missing_or_conflict(&self, id: Uuid) -> StoreError {
        match self
            .connection
            .query_row(
                "SELECT 1 FROM moments WHERE id = ?1",
                [id.to_string()],
                |_| Ok(()),
            )
            .optional()
        {
            Ok(Some(())) => StoreError::Conflict,
            Ok(None) => StoreError::NotFound,
            Err(error) => StoreError::Database(error),
        }
    }
}

fn read_moment(row: &Row<'_>, connection: &Connection) -> rusqlite::Result<Moment> {
    let id: String = row.get(0)?;
    let body: String = row.get(1)?;
    let id = parse_id(&id)?;
    let photos = read_photos(connection, id)?;
    Ok(Moment {
        id,
        body: TextNote::for_moment(body, !photos.is_empty()).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(1, Type::Text, Box::new(error))
        })?,
        photos,
        created_at: read_timestamp(row, 2)?,
        updated_at: read_timestamp(row, 3)?,
    })
}

fn read_timestamp(row: &Row<'_>, index: usize) -> rusqlite::Result<DateTime<Utc>> {
    DateTime::from_timestamp_millis(row.get(index)?).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            index,
            Type::Integer,
            Box::new(io::Error::new(
                io::ErrorKind::InvalidData,
                "invalid saved timestamp",
            )),
        )
    })
}

/// Encoded, normalized JPEGs supplied by the native image importer.
#[derive(Debug)]
pub struct NewPhoto {
    pub width: u32,
    pub height: u32,
    pub image: Vec<u8>,
    pub thumbnail: Vec<u8>,
}

fn parse_id(value: &str) -> rusqlite::Result<Uuid> {
    Uuid::parse_str(value)
        .map_err(|error| rusqlite::Error::FromSqlConversionFailure(0, Type::Text, Box::new(error)))
}

fn read_photos(connection: &Connection, id: Uuid) -> rusqlite::Result<Vec<Photo>> {
    let mut statement = connection
        .prepare("SELECT id, width, height FROM photos WHERE moment_id = ?1 ORDER BY position")?;
    statement
        .query_map([id.to_string()], |row| {
            Ok(Photo {
                id: parse_id(&row.get::<_, String>(0)?)?,
                width: row.get(1)?,
                height: row.get(2)?,
            })
        })?
        .collect()
}
