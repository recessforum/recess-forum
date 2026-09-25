import { createClient } from "./supabase/client";

/* One optional photo or video, shared by posts, replies and circles. Files go
   in the existing public post-images / post-videos buckets under the
   uploader's own uid folder (the buckets' insert policies require that). */

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, the Supabase free-tier per-file cap
const IMAGE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const VIDEO_EXT: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
export const MEDIA_ACCEPT = [...Object.keys(IMAGE_EXT), ...Object.keys(VIDEO_EXT)].join(",");

export type MediaKind = "image" | "video";

/** Returns the file's kind, or a message saying why it can't be used. */
export function checkMedia(f: File): { kind: MediaKind } | { error: string } {
  if (VIDEO_EXT[f.type]) return f.size > MAX_VIDEO_BYTES ? { error: "Video is too large (50MB max)." } : { kind: "video" };
  if (IMAGE_EXT[f.type]) return f.size > MAX_IMAGE_BYTES ? { error: "Image is too large (8MB max)." } : { kind: "image" };
  return { error: "Choose a JPG, PNG, or WEBP photo, or an MP4, MOV, or WEBM video." };
}

export async function uploadMedia(userId: string, file: File): Promise<{ imageUrl: string | null; videoUrl: string | null }> {
  const isVideo = !!VIDEO_EXT[file.type];
  const bucket = isVideo ? "post-videos" : "post-images";
  const path = `${userId}/${Date.now()}.${isVideo ? VIDEO_EXT[file.type] : IMAGE_EXT[file.type]}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return isVideo ? { imageUrl: null, videoUrl: url } : { imageUrl: url, videoUrl: null };
}

/** Server-side check that a submitted media URL is the caller's own upload,
 *  not an arbitrary link. */
export function isOwnMediaUrl(url: string, userId: string, kind: MediaKind): boolean {
  const bucket = kind === "video" ? "post-videos" : "post-images";
  return url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${userId}/`);
}
