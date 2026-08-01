// Zero-dependency static server for previewing carousel.html on localhost.
// Use this instead of `python3 -m http.server` (works even when Python is broken).
// Run from your carousel folder:  node path/to/serve.mjs [port]
// Then open  http://localhost:8765/carousel.html  in your browser.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.argv[2]) || 8765;
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".mp4": "video/mp4", ".json": "application/json",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent((req.url || "/").split("?")[0]);
    if (path === "/") path = "/carousel.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end("forbidden"); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
}).listen(PORT, () => console.log(`Preview server: http://localhost:${PORT}/carousel.html`));
