import { upload } from '@vercel/blob/client';
import { TOKEN_KEY } from '../api/client.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Uploads a file straight from the browser to Vercel Blob (bypassing our server's
// body-size limit) and returns the public URL. `kind` is 'signature' or 'report' —
// it tells the server which content types / size limit to allow (see uploadController.js).
export async function uploadFile(file, kind) {
  const token = localStorage.getItem(TOKEN_KEY);
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: `${API_BASE}/uploads`,
    clientPayload: JSON.stringify({ kind }),
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return blob.url;
}