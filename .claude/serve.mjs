import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = process.cwd(); const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); res.end("not found"); return; } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" }); res.end(data); });
}).listen(Number(process.env.PORT) || 8765, function () { console.log("listening " + this.address().port); });
