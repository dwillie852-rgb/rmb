const { defaultConfig, normalizeConfig } = require("./_defaults");
const { readJsonBody, requireAdmin, sendError, sendJSON } = require("./_http");
const { readJSON, writeJSON } = require("./_store");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const config = normalizeConfig(await readJSON("config.json", defaultConfig));
      sendJSON(res, 200, { ok: true, config });
      return;
    }

    if (req.method === "PUT" || req.method === "POST") {
      if (!(await requireAdmin(req, res))) {
        return;
      }

      const body = await readJsonBody(req);
      const config = normalizeConfig(body.config || body);
      await writeJSON(req, "config.json", config);
      sendJSON(res, 200, { ok: true, config });
      return;
    }

    sendError(res, 405, "Method not allowed.");
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || "Config API failed.");
  }
};
