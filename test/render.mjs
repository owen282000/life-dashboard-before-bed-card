// Serves the repository over a throwaway local port and drives headless Chrome:
// runs the in-browser checks, then writes screenshots. Usage: node test/render.mjs <outdir>
import { execFile } from "node:child_process";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(process.argv[2] || join(root, "test/out"));
const chrome =
  process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
mkdirSync(outDir, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".png": "image/png" };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname)).replace(/^\/+/, "");
  const file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
});

await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}/test/harness.html`;

// The first four are the README's pictures: copy them into docs/ when the card's look changes.
const shots = [
  ["readme-hero", "?theme=dark&one=interactive&width=520", 568, 560],
  ["readme-hero-light", "?theme=light&one=interactive&width=520", 568, 560],
  ["readme-hero-phone", "?theme=dark&one=interactive&width=360", 408, 600],
  ["readme-hero-phone-light", "?theme=light&one=interactive&width=360", 408, 600],
  ["estimate-dark", "?theme=dark&one=counter&width=520", 568, 590],
  ["estimate-light", "?theme=light&one=counter&width=520", 568, 590],
  ["apps-dark", "?theme=dark&one=slots&width=520", 568, 600],
  ["apps-light", "?theme=light&one=slots&width=520", 568, 600],
  ["gallery-light", "?theme=light", 920, 4700],
  ["gallery-dark", "?theme=dark", 920, 4700],
  ["gallery-ha-dark", "?theme=ha-dark", 920, 4700],
  ["picked-night", "?theme=dark&one=interactive&width=520&pick=2", 568, 560],
  ["dutch-twelve-hour", "?theme=light&one=interactive&width=420&lang=nl&hours=12", 468, 580],
  ["rtl-arabic", "?theme=dark&one=slots&width=420&dir=rtl&lang=ar", 500, 640],
  ["japanese", "?theme=light&one=counter&width=420&lang=ja", 468, 620],
  ["narrow-240", "?theme=light&one=interactive&width=240", 288, 760],
];

const flags = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=6000"];
let failed = 0;
try {
  for (const theme of ["light", "dark"]) {
    const { stdout } = await run(chrome, [...flags, "--dump-dom", `${base}?theme=${theme}&check=1`], {
      maxBuffer: 64 * 1024 * 1024,
    });
    const text = /<pre id="results">([\s\S]*?)<\/pre>/.exec(stdout)?.[1] ?? "NO RESULTS";
    const decoded = text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
    console.log(`--- browser checks, ${theme} theme ---`);
    console.log(decoded);
    failed += decoded === "NO RESULTS" ? 1 : (decoded.match(/^FAIL/gm) || []).length;
  }
  for (const [name, query, width, height] of shots) {
    const path = join(outDir, `${name}.png`);
    await run(chrome, [
      ...flags,
      "--force-device-scale-factor=2",
      `--screenshot=${path}`,
      `--window-size=${width},${height}`,
      `${base}${query}`,
    ]);
    console.log("wrote", path);
  }
} finally {
  server.close();
}
process.exit(failed ? 1 : 0);
