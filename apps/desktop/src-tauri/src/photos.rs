//! Decode only supported raster formats; keep normalized, metadata-free JPEG copies.
use std::io::Cursor;

use base64::{Engine, engine::general_purpose::STANDARD};
use dejavu_store::{NewPhoto, StoreError};
use image::{
    DynamicImage, ImageDecoder, ImageFormat, ImageReader, Limits, codecs::jpeg::JpegEncoder,
};

const MAX_BYTES: usize = 10 * 1024 * 1024;
const MAX_PIXELS: u64 = 24_000_000;

fn invalid(message: &str) -> StoreError {
    StoreError::Validation(message.to_owned())
}

pub fn import(encoded: &str) -> Result<NewPhoto, StoreError> {
    if encoded.len() > MAX_BYTES.div_ceil(3) * 4 {
        return Err(invalid("Each photo must be 10 MB or smaller."));
    }
    let bytes = STANDARD
        .decode(encoded)
        .map_err(|_| invalid("That photo could not be read."))?;
    if bytes.len() > MAX_BYTES {
        return Err(invalid("Each photo must be 10 MB or smaller."));
    }
    let mut reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|_| invalid("That photo could not be read."))?;
    if !matches!(
        reader.format(),
        Some(ImageFormat::Jpeg | ImageFormat::Png | ImageFormat::WebP)
    ) {
        return Err(invalid("Choose a JPEG, PNG, or WebP photo."));
    }
    let mut limits = Limits::default();
    limits.max_image_width = Some(12_000);
    limits.max_image_height = Some(12_000);
    limits.max_alloc = Some(128 * 1024 * 1024);
    reader.limits(limits);
    let mut decoder = reader
        .into_decoder()
        .map_err(|_| invalid("That photo could not be decoded. Try another image."))?;
    let (width, height) = decoder.dimensions();
    if width == 0 || height == 0 || u64::from(width) * u64::from(height) > MAX_PIXELS {
        return Err(invalid("Choose a photo up to 24 megapixels."));
    }
    let orientation = decoder
        .orientation()
        .map_err(|_| invalid("That photo's orientation could not be read."))?;
    let mut image = DynamicImage::from_decoder(decoder)
        .map_err(|_| invalid("That photo could not be decoded. Try another image."))?;
    image.apply_orientation(orientation);
    // JPEG has no alpha channel. Composite transparent pixels onto paper white.
    let mut rgba = image.into_rgba8();
    for pixel in rgba.pixels_mut() {
        let alpha = u32::from(pixel[3]);
        for channel in &mut pixel.0[..3] {
            *channel = ((u32::from(*channel) * alpha + 255 * (255 - alpha)) / 255) as u8;
        }
        pixel[3] = 255;
    }
    let image = DynamicImage::ImageRgba8(rgba).into_rgb8();
    let (width, height) = image.dimensions();
    let image = DynamicImage::ImageRgb8(image);
    let mut full = Vec::new();
    JpegEncoder::new_with_quality(&mut full, 90)
        .encode_image(&image)
        .map_err(|_| invalid("That photo could not be prepared."))?;
    let mut thumbnail = Vec::new();
    JpegEncoder::new_with_quality(&mut thumbnail, 80)
        .encode_image(&image.thumbnail(640, 640))
        .map_err(|_| invalid("That photo could not be prepared."))?;
    Ok(NewPhoto {
        width,
        height,
        image: full,
        thumbnail,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_invalid_unsupported_and_oversized_files() {
        assert!(import("invalid base64!").is_err());
        assert!(import(&STANDARD.encode(b"<svg></svg>")).is_err());
        assert!(import(&"a".repeat(MAX_BYTES.div_ceil(3) * 4 + 1)).is_err());
    }
    #[test]
    fn normalizes_a_transparent_png_and_produces_separate_thumbnail()
    -> Result<(), Box<dyn std::error::Error>> {
        let image = DynamicImage::new_rgba8(800, 400);
        let mut png = Cursor::new(Vec::new());
        image.write_to(&mut png, ImageFormat::Png)?;
        let imported = import(&STANDARD.encode(png.into_inner()))?;
        assert_eq!((imported.width, imported.height), (800, 400));
        let full = image::load_from_memory(&imported.image)?.into_rgb8();
        assert!(full.get_pixel(0, 0).0.iter().all(|channel| *channel > 250));
        assert_eq!(image::load_from_memory(&imported.thumbnail)?.width(), 640);
        Ok(())
    }
    #[test]
    fn applies_exif_orientation_and_drops_source_metadata() -> Result<(), Box<dyn std::error::Error>>
    {
        let source = DynamicImage::new_rgb8(30, 10);
        let mut jpeg = Vec::new();
        JpegEncoder::new(&mut jpeg).encode_image(&source)?;
        // Minimal little-endian EXIF: orientation 6, clockwise quarter turn.
        let exif: &[u8] =
            b"Exif\0\0II\x2a\0\x08\0\0\0\x01\0\x12\x01\x03\0\x01\0\0\0\x06\0\0\0\0\0\0\0";
        let mut oriented = vec![0xff, 0xd8, 0xff, 0xe1];
        oriented.extend_from_slice(&u16::try_from(exif.len() + 2)?.to_be_bytes());
        oriented.extend_from_slice(exif);
        oriented.extend_from_slice(&jpeg[2..]);
        let imported = import(&STANDARD.encode(oriented))?;
        assert_eq!((imported.width, imported.height), (10, 30));
        assert!(!imported.image.windows(4).any(|bytes| bytes == b"Exif"));
        Ok(())
    }
}
