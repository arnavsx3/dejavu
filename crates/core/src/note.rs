use serde::Serialize;
use thiserror::Error;

/// Limit notes by Unicode scalar values rather than encoded byte length.
pub const MAX_NOTE_CHARACTERS: usize = 16_000;

/// A validated text fragment. Construction is the validation boundary.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(transparent)]
pub struct TextNote(String);

impl TextNote {
    /// Trim surrounding whitespace, preserving the content's internal spacing.
    pub fn new(body: impl AsRef<str>) -> Result<Self, NoteError> {
        let body = body.as_ref().trim();
        if body.is_empty() {
            return Err(NoteError::Empty);
        }
        if body.chars().take(MAX_NOTE_CHARACTERS + 1).count() > MAX_NOTE_CHARACTERS {
            return Err(NoteError::TooLong);
        }
        Ok(Self(body.to_owned()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Error)]
pub enum NoteError {
    #[error("a note must contain some text")]
    Empty,
    #[error("a note cannot exceed {MAX_NOTE_CHARACTERS} characters")]
    TooLong,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trims_edges_and_preserves_internal_whitespace() -> Result<(), NoteError> {
        let note = TextNote::new("  walked home\n  in the rain  ")?;
        assert_eq!(note.as_str(), "walked home\n  in the rain");
        Ok(())
    }

    #[test]
    fn rejects_blank_notes_including_unicode_whitespace() {
        for body in ["", " \n\t", "\u{2003}"] {
            assert_eq!(TextNote::new(body), Err(NoteError::Empty));
        }
    }

    #[test]
    fn accepts_unicode_at_the_limit() -> Result<(), NoteError> {
        let body = "🌧".repeat(MAX_NOTE_CHARACTERS);
        assert_eq!(TextNote::new(&body)?.as_str(), body);
        Ok(())
    }

    #[test]
    fn rejects_notes_over_the_limit() {
        let body = "a".repeat(MAX_NOTE_CHARACTERS + 1);
        assert_eq!(TextNote::new(body), Err(NoteError::TooLong));
    }
}
