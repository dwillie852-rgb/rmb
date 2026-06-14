const crypto = require("crypto");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error("Firebase admin init error:", err);
  }
}

function setCommonHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function sendJSON(res, statusCode, payload) {
  setCommonHeaders(res);
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, details) {
  sendJSON(res, statusCode, {
    ok: false,
    error: message,
    ...(details ? { details } : {}),
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function isLocalRequest(req) {
  const host = String(req.headers.host || "");
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
}

async function requireAdmin(req, res) {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : String(req.headers["x-admin-token"] || "");

  if (!token) {
    sendError(res, 401, "Admin authentication required.");
    return false;
  }

  if (isLocalRequest(req) && token === "local-dev-admin" && !process.env.FIREBASE_PROJECT_ID) {
    return true;
  }

  try {
    await admin.auth().verifyIdToken(token);
    return true;
  } catch (error) {
    sendError(res, 401, "Invalid or expired admin token.");
    return false;
  }
}

module.exports = {
  isLocalRequest,
  readJsonBody,
  requireAdmin,
  sendError,
  sendJSON,
};
