use chrono::Utc;
use dejavu_core::TextNote;
use dejavu_store::{MomentStore, StoreError};
use rusqlite::Connection;
use tempfile::tempdir;
use uuid::Uuid;

type TestResult = Result<(), Box<dyn std::error::Error>>;

#[test]
fn create_edit_and_delete_survive_reopening_the_database() -> TestResult {
    let directory = tempdir()?;
    let path = directory.path().join("nested/moments.sqlite3");
    let store = MomentStore::open(&path)?;
    assert!(store.list()?.is_empty());
    let created = store.create(&TextNote::new("  A synthetic memory 🌧\nsecond line  ")?)?;
    assert_eq!(created.body.as_str(), "A synthetic memory 🌧\nsecond line");
    drop(store);

    let store = MomentStore::open(&path)?;
    assert_eq!(store.list()?, vec![created.clone()]);
    let edited = store.update(
        created.id,
        &TextNote::new("Edited test memory")?,
        created.updated_at,
    )?;
    assert_eq!(edited.id, created.id);
    assert_eq!(edited.created_at, created.created_at);
    assert!(edited.updated_at > created.updated_at);
    drop(store);

    let store = MomentStore::open(&path)?;
    assert_eq!(store.list()?, vec![edited.clone()]);
    store.delete(edited.id, edited.updated_at)?;
    drop(store);
    assert!(MomentStore::open(&path)?.list()?.is_empty());
    Ok(())
}

#[test]
fn stale_views_cannot_overwrite_or_delete_newer_edits() -> TestResult {
    let directory = tempdir()?;
    let path = directory.path().join("moments.sqlite3");
    let first = MomentStore::open(&path)?;
    let second = MomentStore::open(&path)?;
    let original = first.create(&TextNote::new("Original test")?)?;
    let updated = second.update(
        original.id,
        &TextNote::new("Newer test")?,
        original.updated_at,
    )?;

    assert!(matches!(
        first.update(
            original.id,
            &TextNote::new("Stale edit")?,
            original.updated_at
        ),
        Err(StoreError::Conflict)
    ));
    assert!(matches!(
        first.delete(original.id, original.updated_at),
        Err(StoreError::Conflict)
    ));
    assert_eq!(first.list()?, vec![updated]);
    Ok(())
}

#[test]
fn missing_moments_are_reported() -> TestResult {
    let directory = tempdir()?;
    let store = MomentStore::open(&directory.path().join("moments.sqlite3"))?;
    let id = Uuid::new_v4();
    assert!(matches!(
        store.update(id, &TextNote::new("test")?, Utc::now()),
        Err(StoreError::NotFound)
    ));
    assert!(matches!(
        store.delete(id, Utc::now()),
        Err(StoreError::NotFound)
    ));
    Ok(())
}

#[test]
fn orders_by_creation_newest_first_without_moving_edited_moments() -> TestResult {
    let directory = tempdir()?;
    let path = directory.path().join("moments.sqlite3");
    let store = MomentStore::open(&path)?;
    let older = store.create(&TextNote::new("Older test")?)?;
    let newer = store.create(&TextNote::new("Newer test")?)?;
    let connection = Connection::open(&path)?;
    connection.execute(
        "UPDATE moments SET created_at = created_at - 1000 WHERE id = ?1",
        [older.id.to_string()],
    )?;
    store.update(
        older.id,
        &TextNote::new("Edited older test")?,
        older.updated_at,
    )?;
    let moments = store.list()?;
    assert_eq!(moments[0].id, newer.id);
    assert_eq!(moments[1].id, older.id);
    Ok(())
}

#[test]
fn refuses_a_future_schema_without_resetting_data() -> TestResult {
    let directory = tempdir()?;
    let path = directory.path().join("moments.sqlite3");
    let store = MomentStore::open(&path)?;
    store.create(&TextNote::new("Preserve this test")?)?;
    drop(store);
    let connection = Connection::open(&path)?;
    connection.pragma_update(None, "user_version", 99)?;
    drop(connection);
    assert!(matches!(
        MomentStore::open(&path),
        Err(StoreError::NewerSchema(99))
    ));
    let connection = Connection::open(&path)?;
    assert_eq!(
        connection.query_row("SELECT COUNT(*) FROM moments", [], |row| row
            .get::<_, i64>(0))?,
        1
    );
    Ok(())
}

#[test]
fn invalid_saved_data_is_reported_instead_of_silently_discarded() -> TestResult {
    let directory = tempdir()?;
    let path = directory.path().join("moments.sqlite3");
    let store = MomentStore::open(&path)?;
    store.create(&TextNote::new("Synthetic fixture")?)?;
    Connection::open(&path)?.execute("UPDATE moments SET body = '   '", [])?;
    assert!(matches!(store.list(), Err(StoreError::Database(_))));
    Ok(())
}

#[cfg(unix)]
#[test]
fn database_is_private_to_its_owner() -> TestResult {
    use std::os::unix::fs::PermissionsExt;
    let directory = tempdir()?;
    let path = directory.path().join("moments.sqlite3");
    let _store = MomentStore::open(&path)?;
    assert_eq!(std::fs::metadata(path)?.permissions().mode() & 0o777, 0o600);
    Ok(())
}
