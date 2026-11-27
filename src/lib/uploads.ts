import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put, get, del } from "@vercel/blob";
import { MAX_RESUME_BYTES } from "./constants";

// Where resumes live:
// - When a Vercel Blob store is connected: a *private* Vercel Blob store.
//   Private blobs can't be opened by URL, so files stay reachable only through the
//   authorised download route.
// - Locally without a store: uploads/resumes/ on disk (outside /public, same reason).
// - On Vercel without a Blob store (demo mode): /tmp, the only writable folder. Temporary.
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads", "resumes")
  : path.join(process.cwd(), "uploads", "resumes");
// A connected Blob store sets BLOB_STORE_ID (private stores, OIDC auth) or BLOB_READ_WRITE_TOKEN.
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const blobPath = (storedName: string) => `resumes/${storedName}`;

const ALLOWED: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function startsWith(buf: Buffer, bytes: number[]) {
  return bytes.every((b, i) => buf[i] === b);
}

/** Check the file's real content, not just its name. */
function matchesSignature(ext: string, buf: Buffer): boolean {
  if (ext === ".pdf") return startsWith(buf, [0x25, 0x50, 0x44, 0x46]); // %PDF
  if (ext === ".docx") return startsWith(buf, [0x50, 0x4b, 0x03, 0x04]); // ZIP (PK..)
  if (ext === ".doc") return startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0]); // OLE2
  return false;
}

export type SavedResume = { storedName: string; originalName: string; mime: string; size: number };

export async function saveResume(file: File | null): Promise<{ ok: true; resume: SavedResume } | { ok: false; error: string }> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please attach your resume." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: `Resume must be ${MAX_RESUME_BYTES / (1024 * 1024)} MB or smaller.` };
  }
  const ext = path.extname(file.name).toLowerCase();
  const mime = ALLOWED[ext];
  if (!mime) {
    return { ok: false, error: "Resume must be a PDF, DOC or DOCX file." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(ext, buffer)) {
    return { ok: false, error: "That file doesn't look like a valid PDF/DOC/DOCX document." };
  }

  const storedName = `${crypto.randomUUID()}${ext}`;
  if (useBlob()) {
    await put(blobPath(storedName), buffer, { access: "private", contentType: mime, addRandomSuffix: false });
  } else {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  }

  const originalName = path.basename(file.name).replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  return { ok: true, resume: { storedName, originalName, mime, size: file.size } };
}

function checkName(storedName: string) {
  // storedName is always "<uuid>.<ext>" — reject anything else to prevent path traversal
  if (!/^[0-9a-f-]{36}\.(pdf|docx?)$/i.test(storedName)) throw new Error("Invalid file name");
}

function safePath(storedName: string) {
  checkName(storedName);
  return path.join(UPLOAD_DIR, storedName);
}

export async function readResume(storedName: string): Promise<Buffer> {
  if (useBlob()) {
    checkName(storedName);
    const res = await get(blobPath(storedName), { access: "private" });
    if (!res || res.statusCode !== 200) throw new Error("File missing");
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  return readFile(safePath(storedName));
}

export async function deleteResume(storedName: string): Promise<void> {
  try {
    if (useBlob()) {
      checkName(storedName);
      await del(blobPath(storedName));
    } else {
      await unlink(safePath(storedName));
    }
  } catch {
    // file already gone — nothing to do
  }
}
