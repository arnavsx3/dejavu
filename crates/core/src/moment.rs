use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::TextNote;

/// A saved text moment. Adapters supply identity and timestamps on persistence.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Moment {
    pub id: Uuid,
    pub body: TextNote,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
