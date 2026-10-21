use std::path::PathBuf;

use chrono::{DateTime, Utc};
use dejavu_core::{Moment, NoteError, TextNote};
use dejavu_store::{MomentStore, StoreError};
use serde::Serialize;
use tauri::State;
use uuid::Uuid;

#[derive(Debug)]
pub struct StorePath(pub PathBuf);

/// Stable, content-free errors for the interface. Database details stay private.
#[derive(Debug, Serialize)]
pub struct CommandError {
    code: &'static str,
    message: String,
}

impl From<NoteError> for CommandError {
    fn from(error: NoteError) -> Self {
        Self {
            code: "validation",
            message: error.to_string(),
        }
    }
}

impl From<StoreError> for CommandError {
    fn from(error: StoreError) -> Self {
        let (code, message) = match error {
            StoreError::Conflict => (
                "conflict",
                "This moment changed since you opened it. Refresh your shelf before trying again.",
            ),
            StoreError::NotFound => (
                "not_found",
                "This moment no longer exists. Refresh your shelf to see the latest moments.",
            ),
            StoreError::NewerSchema(_) => (
                "newer_schema",
                "Your memories need a newer version of dejavu. Please update the app.",
            ),
            StoreError::Io(_) | StoreError::Database(_) => (
                "storage",
                "Your moments couldn't be opened or saved. Check that your data folder is available, then try again.",
            ),
        };
        Self {
            code,
            message: message.to_owned(),
        }
    }
}

async fn with_store<T, F>(path: PathBuf, operation: F) -> Result<T, CommandError>
where
    T: Send + 'static,
    F: FnOnce(&MomentStore) -> Result<T, StoreError> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(move || {
        let store = MomentStore::open(&path)?;
        operation(&store)
    })
    .await
    .map_err(|_| CommandError {
        code: "internal",
        message: "Something interrupted that action. Please try again.".to_owned(),
    })?
    .map_err(Into::into)
}

#[tauri::command]
pub async fn list_moments(state: State<'_, StorePath>) -> Result<Vec<Moment>, CommandError> {
    with_store(state.inner().0.clone(), MomentStore::list).await
}

#[tauri::command]
pub async fn create_moment(
    body: String,
    state: State<'_, StorePath>,
) -> Result<Moment, CommandError> {
    let note = TextNote::new(body)?;
    with_store(state.inner().0.clone(), move |store| store.create(&note)).await
}

#[tauri::command]
pub async fn update_moment(
    id: Uuid,
    body: String,
    expected_updated_at: DateTime<Utc>,
    state: State<'_, StorePath>,
) -> Result<Moment, CommandError> {
    let note = TextNote::new(body)?;
    with_store(state.inner().0.clone(), move |store| {
        store.update(id, &note, expected_updated_at)
    })
    .await
}

#[tauri::command]
pub async fn delete_moment(
    id: Uuid,
    expected_updated_at: DateTime<Utc>,
    state: State<'_, StorePath>,
) -> Result<(), CommandError> {
    with_store(state.inner().0.clone(), move |store| {
        store.delete(id, expected_updated_at)
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn worker_operations_persist_across_separate_connections()
    -> Result<(), Box<dyn std::error::Error>> {
        let directory = tempfile::tempdir()?;
        let path = directory.path().join("moments.sqlite3");
        let note = TextNote::new("Synthetic worker test")?;
        let created = with_store(path.clone(), move |store| store.create(&note)).await;
        let created = created.map_err(|error| std::io::Error::other(error.message))?;
        let listed = with_store(path, MomentStore::list)
            .await
            .map_err(|error| std::io::Error::other(error.message))?;
        assert_eq!(listed, vec![created]);
        Ok(())
    }

    #[test]
    fn storage_errors_do_not_expose_database_details() {
        let error = CommandError::from(StoreError::Io(std::io::Error::other(
            "private path or content",
        )));
        assert_eq!(error.code, "storage");
        assert!(!error.message.contains("private path or content"));
    }
}
