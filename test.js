const handler = require("./api/config.js");

const req = {
  method: "POST",
  headers: {
    authorization: "Bearer local-dev-admin",
    host: "localhost",
  },
  body: { config: {} }
};

const res = {
  setHeader: (k, v) => console.log("Header:", k, v),
  statusCode: 200,
  end: (payload) => console.log("Response:", payload),
};

handler(req, res).catch(console.error);
