const { createServer } = require("node:http");
const next = require("next");

process.env.NODE_ENV ||= "production";

const dev = process.env.NODE_ENV === "development";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({
  dev,
  hostname,
  port,
  dir: "./frontend",
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`Huachipato app listening on http://${hostname}:${port}`);
  });
});
