//! SQLite persistence. Open and use a store on a blocking worker thread.

use std::{fs, io, path::Path, time::Duration};

use chrono::{DateTime, Utc};
use dejavu_core::{Moment, TextNote};
use rusqlite::{Connection, OptionalExtension, Row, TransactionBehavior, params, types::Type};
use thiserror::Error;
use uuid::Uuid;

const SCHEMA_VERSION: i64 = 1;

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
        transaction.commit()?;
        connection.pragma_update(None, "journal_mode", "WAL")?;
        Ok(Self { connection })
    }

    pub fn list(&self) -> Result<Vec<Moment>, StoreError> {
        let mut statement = self.connection.prepare(
            "SELECT id, body, created_at, updated_at FROM moments ORDER BY created_at DESC, id DESC",
        )?;
        let rows = statement.query_map([], read_moment)?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    pub fn create(&self, body: &TextNote) -> Result<Moment, StoreError> {
        let now = Utc::now().timestamp_millis();
        Ok(self.connection.query_row(
            "INSERT INTO moments (id, body, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)
             RETURNING id, body, created_at, updated_at",
            params![Uuid::new_v4().to_string(), body.as_str(), now],
            read_moment,
        )?)
    }

    /// Match the previous revision to avoid overwriting a concurrent edit.
    pub fn update(
        &self,
        id: Uuid,
        body: &TextNote,
        expected_updated_at: DateTime<Utc>,
    ) -> Result<Moment, StoreError> {
        let moment = self
            .connection
            .query_row(
                "UPDATE moments SET body = ?1, updated_at = MAX(?2, updated_at + 1)
             WHERE id = ?3 AND updated_at = ?4
             RETURNING id, body, created_at, updated_at",
                params![
                    body.as_str(),
                    Utc::now().timestamp_millis(),
                    id.to_string(),
                    expected_updated_at.timestamp_millis()
                ],
                read_moment,
            )
            .optional()?;
        moment.ok_or_else(|| self.missing_or_conflict(id))
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

fn read_moment(row: &Row<'_>) -> rusqlite::Result<Moment> {
    let id: String = row.get(0)?;
    let body: String = row.get(1)?;
    Ok(Moment {
        id: Uuid::parse_str(&id).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(0, Type::Text, Box::new(error))
        })?,
        body: TextNote::new(body).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(1, Type::Text, Box::new(error))
        })?,
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
