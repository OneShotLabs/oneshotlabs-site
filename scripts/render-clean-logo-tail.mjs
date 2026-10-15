import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [endCardPath, outputDirectory] = process.argv.slice(2);
if (!endCardPath || !outputDirectory) {
  console.error("usage: node render-clean-logo-tail.mjs END_CARD OUTPUT_DIR");
  process.exit(2);
}

const width = 1920;
const height = 1080;
const fps = 30;
const frameCount = 127;
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profilePath = "/private/tmp/oneshot-clean-logo-chrome";
const port = 9331;

await mkdir(outputDirectory, { recursive: true });
const endCard = await readFile(endCardPath);
const endCardUrl = `data:image/jpeg;base64,${endCard.toString("base64")}`;

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profilePath}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "inherit"] });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    page = pages.find(candidate => candidate.type === "page");
    if (page) break;
  } catch {}
  await delay(100);
}
if (!page) {
  chrome.kill();
  throw new Error("Chrome DevTools did not become ready");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: width,
  screenHeight: height,
});

const documentSource = `<!doctype html>
<meta charset="utf-8">
<style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#1d2f4e}canvas{display:block}</style>
<canvas id="frame" width="${width}" height="${height}"></canvas>
<script>
const canvas = document.getElementById("frame");
const context = canvas.getContext("2d", { alpha: false });
const endCard = new Image();
endCard.src = ${JSON.stringify(endCardUrl)};
const blade = [[53.5,2],[55.8,20],[50,46],[41.5,20.6]];
const clamp = value => Math.min(1, Math.max(0, value));
const smoothstep = value => { const x = clamp(value); return x*x*(3-2*x); };
const easeOutCubic = value => { const x = clamp(value); return 1-Math.pow(1-x,3); };

function drawBlade(index, time, centerX, centerY, scale) {
  const start = .10 + index * .055;
  const arrival = start + 1.03;
  const progress = easeOutCubic((time-start)/(arrival-start));
  if (progress <= 0) return;
  const angle = index * Math.PI / 4;
  const radialAngle = -Math.PI / 2 + angle;
  const startRadius = 720 + (index % 2) * 90;
  const radius = startRadius * (1-progress);
  const offsetX = Math.cos(radialAngle) * radius;
  const offsetY = Math.sin(radialAngle) * radius;
  context.beginPath();
  blade.forEach(([x,y], pointIndex) => {
    const localX = (x-50)*scale;
    const localY = (y-50)*scale;
    const rotatedX = localX*Math.cos(angle)-localY*Math.sin(angle);
    const rotatedY = localX*Math.sin(angle)+localY*Math.cos(angle);
    const px = centerX + offsetX + rotatedX;
    const py = centerY + offsetY + rotatedY;
    if (pointIndex === 0) context.moveTo(px,py); else context.lineTo(px,py);
  });
  context.closePath();
  context.globalAlpha = smoothstep(progress);
  context.fillStyle = "#fffdf8";
  context.fill();
  context.globalAlpha = 1;
}

window.drawFrame = time => {
  context.fillStyle = "#1d2f4e";
  context.fillRect(0,0,canvas.width,canvas.height);
  const move = smoothstep((time-1.32)/.52);
  const centerX = 960 + (520-960)*move;
  const centerY = 540;
  const scale = 4.65 + (3.15-4.65)*move;
  for (let index=0; index<8; index+=1) drawBlade(index,time,centerX,centerY,scale);
  const endCardAlpha = smoothstep((time-1.72)/.55);
  if (endCardAlpha > 0) {
    context.globalAlpha = endCardAlpha;
    context.drawImage(endCard,0,0,canvas.width,canvas.height);
    context.globalAlpha = 1;
  }
};
endCard.onload = () => { window.ready = true; window.drawFrame(0); };
</script>`;

await command("Page.navigate", { url: `data:text/html;base64,${Buffer.from(documentSource).toString("base64")}` });
for (let attempt = 0; attempt < 100; attempt += 1) {
  const state = await command("Runtime.evaluate", { expression: "Boolean(window.ready)", returnByValue: true });
  if (state.result.value) break;
  await delay(50);
}

for (let frame = 0; frame < frameCount; frame += 1) {
  await command("Runtime.evaluate", { expression: `window.drawFrame(${frame / fps})` });
  const capture = await command("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const fileName = `frame-${String(frame).padStart(4, "0")}.png`;
  await writeFile(path.join(outputDirectory, fileName), Buffer.from(capture.data, "base64"));
}

socket.close();
chrome.kill();
