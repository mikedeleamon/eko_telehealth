import * as DocumentPicker from 'expo-document-picker';
import type { PickedFile } from '../api/types';

/** Refused by every upload path — big enough for a phone photo, small enough to send. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class FileTooLargeError extends Error {}

/**
 * The camera and photo library, for SOW 1.6 — a patient photographing a rash
 * or a swollen ankle, not hunting for a file they already saved.
 *
 * expo-image-picker is a NATIVE module, so it's loaded with a dynamic import()
 * only when someone actually reaches for the camera. Two things follow from
 * that, both deliberate: mock and chat-only builds never link it, and a dev
 * client that predates the dependency (no `expo prebuild` run yet) still boots
 * — the camera options simply report themselves unavailable while the file
 * picker keeps working. `null` means the user cancelled.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<PickedFile | null> {
  const ImagePicker = await import('expo-image-picker');

  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      source === 'camera'
        ? 'Camera access is off for Eko Telehealth. Turn it on in Settings to take a photo.'
        : 'Photo access is off for Eko Telehealth. Turn it on in Settings to choose a picture.',
    );
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, exif: false })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          exif: false,
        });

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const size = asset.fileSize ?? 0;
  if (size > MAX_UPLOAD_BYTES) throw new FileTooLargeError();

  // Cameras hand back a uri with no file name; a stable, dated one beats
  // "image.jpg" repeated across a patient's whole upload list.
  const fallbackName = `photo-${new Date().toISOString().slice(0, 10)}.jpg`;
  return {
    uri: asset.uri,
    name: asset.fileName ?? fallbackName,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size,
  };
}

/** A PDF or image already saved on the device (a discharge summary, a scan). */
export async function pickDocument(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const size = asset.size ?? 0;
  if (size > MAX_UPLOAD_BYTES) throw new FileTooLargeError();
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size,
  };
}

/** "482 KB" / "1.2 MB" from a byte count. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
