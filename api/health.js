const { sendJSON } = require("./_http");
const { hasBlobStorage } = require("./_store");

module.exports = function handler(req, res) {
  sendJSON(res, 200, {
    ok: true,
    checks: {
      adminToken: Boolean(process.env.ADMIN_TOKEN),
      blobStorage: hasBlobStorage(),
      domain: "Connect rmbtsdonations.com in Vercel project settings.",
    },
  });
};
