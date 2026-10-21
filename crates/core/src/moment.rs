use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

use crate::TextNote;

/// A saved moment. Adapters supply identity and timestamps on persistence.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Moment {
    pub id: Uuid,
    pub body: TextNote,
    pub photos: Vec<Photo>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Metadata only. Image bytes are fetched separately when needed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Photo {
    pub id: Uuid,
    pub width: u32,
    pub height: u32,
}

pub const MAX_MOMENT_PHOTOS: usize = 6;
