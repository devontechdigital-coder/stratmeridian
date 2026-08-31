import { Storage } from '@google-cloud/storage';

const bucketName = process.env.GCP_BUCKET_NAME;

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return trimmed.length >= 2 && ((first === '"' && last === '"') || (first === "'" && last === "'"))
    ? trimmed.slice(1, -1).trim()
    : trimmed;
}

function extractPrivateKey(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return trimmed;

  try {
    const credentials = JSON.parse(trimmed);
    return credentials.private_key || credentials.privateKey || trimmed;
  } catch {
    return trimmed;
  }
}

function decodePrivateKey(value) {
  const candidate = value.startsWith('base64:') ? value.slice(7) : value;
  if (value.includes('PRIVATE KEY') || !/^[A-Za-z0-9+/=\s]+$/.test(candidate)) return value;

  try {
    const decoded = Buffer.from(candidate.replace(/\s/g, ''), 'base64').toString('utf8').trim();
    return decoded.includes('PRIVATE KEY') || decoded.startsWith('{') ? decoded : value;
  } catch {
    return value;
  }
}

export function normalizePrivateKey(rawValue = '') {
  let key = stripWrappingQuotes(String(rawValue));
  key = extractPrivateKey(decodePrivateKey(key));
  key = stripWrappingQuotes(key);

  // Deployment dashboards may preserve one or more escaping layers.
  for (let index = 0; index < 3 && /\\[nr]/.test(key); index += 1) {
    key = key.replace(/\\r/g, '').replace(/\\n/g, '\n');
  }

  key = key.replace(/\r/g, '').trim();
  const pem = key.match(/-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/);
  if (!pem) {
    throw new Error('GCP_PRIVATE_KEY is not a valid PEM private key. Paste the service-account private_key value or its base64 encoding.');
  }

  // Rebuild canonical PEM formatting in case the hosting provider collapsed lines.
  const body = pem[2].replace(/\s/g, '');
  if (!body) {
    throw new Error('GCP_PRIVATE_KEY contains an empty PEM private key.');
  }
  const lines = body.match(/.{1,64}/g) || [];
  return `-----BEGIN ${pem[1]}-----\n${lines.join('\n')}\n-----END ${pem[1]}-----\n`;
}

function getPrivateKey() {
  return normalizePrivateKey(process.env.GCP_PRIVATE_KEY);
}

function assertGcsConfig() {
  const missing = [
    ['GCP_PROJECT_ID', process.env.GCP_PROJECT_ID],
    ['GCP_CLIENT_EMAIL', process.env.GCP_CLIENT_EMAIL],
    ['GCP_PRIVATE_KEY', process.env.GCP_PRIVATE_KEY],
    ['GCP_BUCKET_NAME', process.env.GCP_BUCKET_NAME],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Google Cloud Storage environment variables are missing: ${missing.join(', ')}`);
  }
}

function getBucket() {
  assertGcsConfig();

  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: getPrivateKey(),
    },
  });

  return storage.bucket(bucketName);
}

export function normalizeGcsPath(path = '') {
  return String(path)
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');
}

function withTrailingSlash(path = '') {
  const normalized = normalizeGcsPath(path);
  return normalized ? `${normalized}/` : '';
}

function publicUrl(name) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(name).replace(/%2F/g, '/')}`;
}

export async function listFiles(prefix = '') {
  const bucket = getBucket();
  const normalizedPrefix = withTrailingSlash(prefix);
  const [files, , apiResponse] = await bucket.getFiles({
    prefix: normalizedPrefix,
    delimiter: '/',
    autoPaginate: true,
  });

  const folders = (apiResponse?.prefixes || []).sort((a, b) => a.localeCompare(b));
  const visibleFiles = files
    .filter((file) => file.name !== normalizedPrefix && !file.name.endsWith('/'))
    .map((file) => ({
      name: file.name,
      publicId: file.name,
      displayName: file.name.split('/').pop(),
      url: publicUrl(file.name),
      contentType: file.metadata?.contentType || '',
      size: Number(file.metadata?.size || 0),
      updatedAt: file.metadata?.updated || null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return { files: visibleFiles, folders };
}

export async function uploadFile(file, folder = '') {
  const bucket = getBucket();
  const targetFolder = withTrailingSlash(folder);
  const fileName = `${targetFolder}${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const gcsFile = bucket.file(fileName);

  await gcsFile.save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type || 'application/octet-stream',
    },
  });

  return {
    name: fileName,
    publicId: fileName,
    displayName: file.name,
    url: publicUrl(fileName),
    contentType: file.type || 'application/octet-stream',
    size: file.size || buffer.length,
  };
}

export async function generateV4UploadSignedUrl(filename, contentType) {
  const bucket = getBucket();
  const [url] = await bucket.file(normalizeGcsPath(filename)).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  return url;
}

export async function createFolder(folderPath) {
  const bucket = getBucket();
  const folderName = withTrailingSlash(folderPath);
  if (!folderName) throw new Error('Folder path is required');

  await bucket.file(folderName).save('', {
    resumable: false,
    metadata: { contentType: 'application/x-directory' },
  });
}

export async function deleteFile(name) {
  const bucket = getBucket();
  const isFolder = String(name).endsWith('/');

  if (isFolder) {
    const [files] = await bucket.getFiles({ prefix: withTrailingSlash(name), autoPaginate: true });
    await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })));
    return;
  }

  await bucket.file(normalizeGcsPath(name)).delete({ ignoreNotFound: true });
}

export async function renameFile(oldName, newName) {
  const bucket = getBucket();
  const oldIsFolder = String(oldName).endsWith('/');

  if (oldIsFolder) {
    const oldPrefix = withTrailingSlash(oldName);
    const newPrefix = withTrailingSlash(newName);
    const [files] = await bucket.getFiles({ prefix: oldPrefix, autoPaginate: true });

    await Promise.all(files.map(async (file) => {
      const targetName = `${newPrefix}${file.name.slice(oldPrefix.length)}`;
      await file.copy(bucket.file(targetName));
      await file.delete({ ignoreNotFound: true });
    }));
    return;
  }

  await bucket.file(normalizeGcsPath(oldName)).move(normalizeGcsPath(newName));
}

export async function setupCors() {
  const bucket = getBucket();
  await bucket.setCorsConfiguration([
    {
      origin: ['*'],
      method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      responseHeader: ['Content-Type', 'Authorization'],
      maxAgeSeconds: 3600,
    },
  ]);
}
