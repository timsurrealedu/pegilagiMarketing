import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { channels, persona, pillars, safetyRules } from "./contentPlan.js";

const OUT = "out";

export async function generateBatch({ count = 10, startDate = todayISO(), outDir = OUT } = {}) {
  await ensureDirs(outDir);
  const items = [];
  for (let i = 0; i < count; i++) {
    const day = addDays(startDate, Math.floor(i / 3));
    const pillar = pickPillar(i);
    const item = buildContent({ pillar, index: i, scheduledDate: day });
    const safety = validateContent(item);
    item.safety = safety;
    await writeContentFiles(outDir, item);
    items.push(item);
  }
  await writeJson(path.join(outDir, "upload-manifest.json"), buildUploadManifest(items));
  await exportLifeOS({ outDir });
  return items;
}

export async function generateSchedule({ days = 30, perDay = 3, outDir = OUT } = {}) {
  const items = await generateBatch({ count: days * perDay, outDir });
  return items.map((item, index) => ({
    id: item.id,
    date: addDays(todayISO(), Math.floor(index / perDay)),
    slot: (index % perDay) + 1,
    pillar: item.pillar.id,
    channels
  }));
}

export async function validateAll({ outDir = OUT } = {}) {
  const items = await readContent(outDir);
  return items.map((item) => ({ id: item.id, ...validateContent(item) }));
}

export async function exportLifeOS({ outDir = OUT } = {}) {
  await ensureDirs(outDir);
  const items = await readContent(outDir).catch(() => []);
  const payload = {
    project: "pegilagi-studio",
    updatedAt: new Date().toISOString(),
    calendar: items.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.scheduledDate,
      channels: item.channels,
      status: item.status
    })),
    approvalQueue: items.filter((item) => item.status === "needs_approval"),
    backlog: pillars.map((pillar) => ({
      pillar: pillar.id,
      title: pillar.title,
      stage: pillar.stage,
      hookType: pillar.hookType,
      emotionalLever: pillar.emotionalLever
    })),
    recommendations: rankRecommendations(items)
  };
  await writeJson(path.join(outDir, "lifeos-export.json"), payload);
  return payload;
}

export async function createVariants({ top = 5, variants = 10, outDir = OUT } = {}) {
  const items = await readContent(outDir);
  const winners = [...items].sort((a, b) => score(b.analytics) - score(a.analytics)).slice(0, top);
  const created = [];
  for (let i = 0; i < variants; i++) {
    const base = winners[i % winners.length] ?? items[i % items.length];
    if (!base) break;
    const pillar = pillars.find((p) => p.id === base.pillar.id) ?? pillars[0];
    const item = buildContent({
      pillar,
      index: items.length + i,
      scheduledDate: addDays(todayISO(), Math.floor(i / 3)),
      variantOf: base.id
    });
    item.hook = `Versi baru: ${item.hook}`;
    item.safety = validateContent(item);
    await writeContentFiles(outDir, item);
    created.push(item);
  }
  await writeJson(path.join(outDir, "upload-manifest.json"), buildUploadManifest([...items, ...created]));
  await exportLifeOS({ outDir });
  return created;
}

function buildContent({ pillar, index, scheduledDate, variantOf = null }) {
  const fare = rupiah(12000 + (index % 6) * 2500);
  const saving = rupiah(18000 + (index % 5) * 6000);
  const driverTake = fare;
  const lines = pillar.template({ fare, saving, driverTake });
  const script = lines.join(" ");
  const id = `${scheduledDate}-${String(index + 1).padStart(3, "0")}-${pillar.id}`;
  return {
    id,
    title: `${pillar.title}: ${lines[0]}`,
    pillar: {
      id: pillar.id,
      title: pillar.title,
      stage: pillar.stage
    },
    hook: lines[0],
    hookType: pillar.hookType,
    emotionalLever: pillar.emotionalLever,
    targetAudience: persona.audience,
    persona,
    script,
    scenes: lines.map((text, sceneIndex) => ({
      scene: sceneIndex + 1,
      durationSeconds: sceneIndex === 0 ? 2 : sceneIndex === lines.length - 1 ? 5 : 8,
      text,
      visualPrompt: visualPrompt(pillar, sceneIndex)
    })),
    subtitles: toSrt(lines),
    cta: persona.cta,
    channels,
    scheduledDate,
    status: "needs_approval",
    claims: ["100% tarif perjalanan untuk driver", "dibuat agar pengguna bisa lebih hemat"],
    assets: {
      status: "spec-only",
      aspectRatio: "9:16",
      voiceover: `out/audio/${id}.mp3`,
      video: `out/videos/${id}.mp4`,
      storyboard: `out/storyboards/${id}.html`
    },
    analytics: {
      retention: 0,
      shares: 0,
      commentSentiment: 0,
      downloadClicks: 0
    },
    variantOf
  };
}

function validateContent(item) {
  const text = `${item.title} ${item.script}`.toLowerCase();
  const violations = safetyRules.bannedTerms.filter((term) => text.includes(term.toLowerCase()));
  if (!text.includes("100%") || !text.includes("driver") || !item.script.includes(persona.cta)) {
    violations.push("missing required 100%, driver, or CTA claim");
  }
  return { ok: violations.length === 0, violations, note: safetyRules.claimNote };
}

function buildUploadManifest(items) {
  return {
    mode: "approval-assisted",
    channels,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      scheduledDate: item.scheduledDate,
      status: item.status,
      channels: item.channels,
      files: {
        metadata: `out/content/${item.id}.json`,
        script: `out/scripts/${item.id}.txt`,
        subtitles: `out/subtitles/${item.id}.srt`,
        storyboard: item.assets.storyboard,
        video: item.assets.video
      }
    }))
  };
}

async function writeContentFiles(outDir, item) {
  await writeJson(path.join(outDir, "content", `${item.id}.json`), item);
  await writeFile(path.join(outDir, "scripts", `${item.id}.txt`), item.script, "utf8");
  await writeFile(path.join(outDir, "subtitles", `${item.id}.srt`), item.subtitles, "utf8");
  await writeFile(path.join(outDir, "storyboards", `${item.id}.html`), storyboardHtml(item), "utf8");
}

async function readContent(outDir) {
  const dir = path.join(outDir, "content");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  const items = await Promise.all(files.map(async (file) => JSON.parse(await readFile(path.join(dir, file), "utf8"))));
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

async function ensureDirs(outDir) {
  await Promise.all(["content", "scripts", "subtitles", "storyboards", "audio", "videos"].map((dir) => mkdir(path.join(outDir, dir), { recursive: true })));
}

function pickPillar(index) {
  const cycle = ["uangmu-ke-mana", "lebih-murah-tanpa-jahat", "ojol-dapat-100", "uangmu-ke-mana", "cerita-jalanan-indonesia", "gerakan-pilih-adil", "lebih-murah-tanpa-jahat", "tantangan-7-hari", "mitos-ojol-murah", "ojol-dapat-100"];
  return pillars.find((pillar) => pillar.id === cycle[index % cycle.length]) ?? pillars[0];
}

function storyboardHtml(item) {
  const scenes = item.scenes.map((scene) => `<section><b>${scene.scene}</b><p>${escapeHtml(scene.text)}</p><small>${escapeHtml(scene.visualPrompt)}</small></section>`).join("");
  return `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(item.title)}</title><style>body{margin:0;background:#101820;color:#fff;font-family:Arial,sans-serif}main{width:min(420px,100vw);aspect-ratio:9/16;margin:auto;background:#f4d35e;color:#101820;display:grid;grid-template-rows:auto 1fr auto;padding:24px;box-sizing:border-box}h1{font-size:30px;line-height:1.05;margin:0}section{border-top:2px solid #101820;padding:14px 0}p{font-size:22px;line-height:1.2;margin:6px 0}small{display:block;font-size:13px}.cta{font-weight:700;font-size:26px}</style><main><h1>${escapeHtml(item.pillar.title)}</h1><div>${scenes}</div><div class="cta">Download Pegilagi</div></main></html>`;
}

function toSrt(lines) {
  let cursor = 0;
  return lines.map((line, index) => {
    const duration = index === 0 ? 2 : index === lines.length - 1 ? 5 : 8;
    const start = srtTime(cursor);
    cursor += duration;
    return `${index + 1}\n${start} --> ${srtTime(cursor)}\n${line}\n`;
  }).join("\n");
}

function visualPrompt(pillar, sceneIndex) {
  const base = {
    "uangmu-ke-mana": ["close-up app fare receipt", "split fare to driver", "smiling driver receives full fare", "Pegilagi download screen"],
    "ojol-dapat-100": ["driver waiting after rain", "helmet and fuel meter", "family dinner table", "driver accepts Pegilagi order"],
    "lebih-murah-tanpa-jahat": ["commuter compares fares", "wallet savings", "driver payout notification", "phone with Pegilagi CTA"],
    "mitos-ojol-murah": ["myth stamp", "simple fee diagram", "driver payout card", "clear Pegilagi brand frame"],
    "tantangan-7-hari": ["seven day tracker", "weekly savings meter", "driver support badge", "challenge CTA"],
    "cerita-jalanan-indonesia": ["rainy Indonesian street", "busy traffic", "kind passenger greeting driver", "city moving at night"],
    "gerakan-pilih-adil": ["community of riders", "fair choice text", "driver and passenger handshake", "Pegilagi app download"]
  };
  return (base[pillar.id] ?? base["gerakan-pilih-adil"])[sceneIndex] ?? "Pegilagi vertical video frame";
}

function rankRecommendations(items) {
  return [...items]
    .sort((a, b) => score(b.analytics) - score(a.analytics))
    .slice(0, 5)
    .map((item) => ({
      from: item.id,
      action: "buat variasi dari konten yang menang",
      reason: `score ${score(item.analytics)}`
    }));
}

function score(analytics = {}) {
  return Math.round((analytics.retention ?? 0) * 100 + (analytics.shares ?? 0) * 2 + (analytics.commentSentiment ?? 0) * 20 + (analytics.downloadClicks ?? 0) * 5);
}

function rupiah(value) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateISO, days) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function srtTime(seconds) {
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss},000`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
