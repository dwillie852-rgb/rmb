const crypto = require("crypto");
const { readJsonBody, requireAdmin, sendError, sendJSON } = require("./_http");
const { readJSON, writeJSON, writeProofFile } = require("./_store");

const allowedStatuses = new Set(["new", "pending", "verified", "rejected"]);
const maxProofFileBytes = 3 * 1024 * 1024;

function cleanText(value, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

function publicProof(proof) {
  return {
    id: proof.id,
    createdAt: proof.createdAt,
    status: proof.status,
  };
}

async function getProofs() {
  const proofs = await readJSON("proofs.json", []);
  return Array.isArray(proofs) ? proofs : [];
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      sendJSON(res, 200, { ok: true, proofs: await getProofs() });
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      if (body.manual) {
        if (!(await requireAdmin(req, res))) {
          return;
        }

        const record = {
          id: cleanText(body.id, 80) || `manual-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
          createdAt: body.createdAt || new Date().toISOString(),
          status: allowedStatuses.has(body.status) ? body.status : "new",
          method: cleanText(body.method, 40),
          methodKey: cleanText(body.methodKey, 30),
          amount: cleanText(body.amount, 30),
          network: cleanText(body.network, 80),
          donorName: cleanText(body.donorName || "Manual admin entry", 80),
          contact: cleanText(body.contact, 120),
          reference: cleanText(body.reference, 160),
          note: cleanText(body.note || "Created from admin dashboard.", 400),
        };

        const proofs = await getProofs();
        proofs.unshift(record);
        await writeJSON(req, "proofs.json", proofs);
        sendJSON(res, 201, { ok: true, proof: record });
        return;
      }

      const file = body.file || {};
      const declaredSize = Number(file.size || 0);

      if (!cleanText(body.reference, 120)) {
        sendError(res, 400, "Transaction hash or bank reference is required.");
        return;
      }

      if (!file.data || !file.name) {
        sendError(res, 400, "Proof file is required.");
        return;
      }

      if (declaredSize > maxProofFileBytes) {
        sendError(res, 413, "Proof file must be 3MB or smaller.");
        return;
      }

      const id = `proof-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      const storedFile = await writeProofFile(req, id, file);
      const record = {
        id,
        createdAt: new Date().toISOString(),
        status: "new",
        method: cleanText(body.method, 40),
        methodKey: cleanText(body.methodKey, 30),
        amount: cleanText(body.amount, 30),
        network: cleanText(body.network, 80),
        donorName: cleanText(body.donorName || "Anonymous", 80),
        contact: cleanText(body.contact, 120),
        reference: cleanText(body.reference, 160),
        note: cleanText(body.note, 400),
        file: storedFile,
      };

      const proofs = await getProofs();
      proofs.unshift(record);
      await writeJSON(req, "proofs.json", proofs);
      sendJSON(res, 201, { ok: true, proof: publicProof(record) });
      return;
    }

    if (req.method === "PATCH") {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const body = await readJsonBody(req);
      if (!body.id || !allowedStatuses.has(body.status)) {
        sendError(res, 400, "A valid proof id and status are required.");
        return;
      }

      const proofs = (await getProofs()).map((proof) =>
        proof.id === body.id
          ? { ...proof, status: body.status, reviewedAt: new Date().toISOString() }
          : proof,
      );
      await writeJSON(req, "proofs.json", proofs);
      sendJSON(res, 200, { ok: true, proofs });
      return;
    }

    if (req.method === "DELETE") {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      await writeJSON(req, "proofs.json", []);
      sendJSON(res, 200, { ok: true, proofs: [] });
      return;
    }

    sendError(res, 405, "Method not allowed.");
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || "Proof API failed.");
  }
};
