const fs = require("fs/promises");
const path = require("path");
const { isLocalRequest } = require("./_http");

const storagePrefix = process.env.RMBTS_STORAGE_PREFIX || "rmbtsdonations";
const localDataDir = path.join(process.cwd(), ".data");

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function storagePath(name) {
  return `${storagePrefix}/${name}`;
}

async function getBlobClient() {
  return import("@vercel/blob");
}

async function readBlobJSON(name, fallback) {
  const { list } = await getBlobClient();
  const pathname = storagePath(name);
  const result = await list({ prefix: pathname, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === pathname);

  if (!blob) {
    return fallback;
  }

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) {
    return fallback;
  }

  return response.json();
}

async function writeBlobJSON(name, value) {
  const { put } = await getBlobClient();
  await put(storagePath(name), JSON.stringify(value, null, 2), {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readLocalJSON(name, fallback) {
  try {
    const filepath = path.join(localDataDir, name);
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function writeLocalJSON(name, value) {
  await fs.mkdir(localDataDir, { recursive: true });
  const filepath = path.join(localDataDir, name);
  await fs.writeFile(filepath, JSON.stringify(value, null, 2));
}

async function readJSON(name, fallback) {
  if (hasBlobStorage()) {
    return readBlobJSON(name, fallback);
  }

  return readLocalJSON(name, fallback);
}

async function writeJSON(req, name, value) {
  if (hasBlobStorage()) {
    await writeBlobJSON(name, value);
    return;
  }

  if (!isLocalRequest(req)) {
    const error = new Error("BLOB_READ_WRITE_TOKEN is not configured for persistent production storage.");
    error.statusCode = 503;
    throw error;
  }

  await writeLocalJSON(name, value);
}

function safeFileName(name) {
  return String(name || "proof-file")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function writeProofFile(req, id, file) {
  const fileName = safeFileName(file.name);
  const contentType = file.type || "application/octet-stream";
  const buffer = Buffer.from(file.data, "base64");

  if (hasBlobStorage()) {
    const { put } = await getBlobClient();
    const result = await put(`${storagePrefix}/uploads/${id}-${fileName}`, buffer, {
      access: "public",
      contentType,
    });

    return {
      name: file.name,
      size: buffer.byteLength,
      type: contentType,
      url: result.url,
      pathname: result.pathname,
    };
  }

  if (!isLocalRequest(req)) {
    const error = new Error("BLOB_READ_WRITE_TOKEN is not configured for proof uploads.");
    error.statusCode = 503;
    throw error;
  }

  const uploadsDir = path.join(localDataDir, "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const relativePath = path.join("uploads", `${id}-${fileName}`);
  const filepath = path.join(localDataDir, relativePath);
  await fs.writeFile(filepath, buffer);

  return {
    name: file.name,
    size: buffer.byteLength,
    type: contentType,
    url: `/.data/${relativePath}`,
    pathname: filepath,
  };
}

module.exports = {
  hasBlobStorage,
  readJSON,
  writeJSON,
  writeProofFile,
};
