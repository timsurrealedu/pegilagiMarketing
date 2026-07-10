import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { officialAssets } from "./assets.js";
import { buildVoiceTrack, synthesizeSceneAudio } from "./tts.js";

const ffmpeg = process.env.FFMPEG || "ffmpeg";
const W = 1080;
const H = 1920;

export function buildRenderPlan(item) {
  return {
    id: item.id,
    source: officialAssets.source,
    aspectRatio: "9:16",
    background: officialAssets.files.appSlide,
    overlays: [
      officialAssets.files.logo,
      officialAssets.files.pegiJekIcon,
      officialAssets.files.character
    ],
    voice: item.assets.voiceover,
    video: item.assets.video,
    captions: `out/render-work/${item.id}/captions.ass`,
    tts: process.env.PEGILAGI_TTS_CMD ? "command" : process.env.PEGILAGI_KOKORO === "1" ? "kokoro" : "silent-review"
  };
}

export async function renderItem({ id, outDir = "out" }) {
  const item = JSON.parse(await readFile(path.join(outDir, "content", `${id}.json`), "utf8"));
  const workDir = path.join(outDir, "render-work", item.id);
  await mkdir(workDir, { recursive: true });
  await mkdir(path.join(outDir, "videos"), { recursive: true });
  await mkdir(path.join(outDir, "audio"), { recursive: true });

  const clips = await synthesizeSceneAudio(item, workDir);
  const voice = await buildVoiceTrack(clips, workDir);
  const ass = path.join(workDir, "captions.ass");
  await writeFile(ass, buildAss(item, clips), "utf8");

  const outVideo = path.join(outDir, "videos", `${item.id}.mp4`);
  await run(ffmpeg, buildFfmpegArgs({ item, voice, ass, outVideo }));

  item.assets.status = "rendered";
  item.assets.voiceover = voice;
  item.assets.video = outVideo;
  item.assets.renderPlan = buildRenderPlan(item);
  item.status = "rendered_needs_approval";
  await writeFile(path.join(outDir, "content", `${id}.json`), `${JSON.stringify(item, null, 2)}\n`, "utf8");
  return item;
}

export async function renderNext({ outDir = "out" } = {}) {
  const manifest = JSON.parse(await readFile(path.join(outDir, "upload-manifest.json"), "utf8"));
  const next = manifest.items.find((item) => item.status === "needs_approval" || item.status === "render_pending") ?? manifest.items[0];
  if (!next) throw new Error("no content items to render");
  return renderItem({ id: next.id, outDir });
}

function buildFfmpegArgs({ item, voice, ass, outVideo }) {
  const total = Math.max(8, item.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0) + 1);
  const safeAss = slash(ass).replace(/:/g, "\\:");
  return [
    "-y",
    "-loglevel",
    "warning",
    "-loop",
    "1",
    "-t",
    String(total),
    "-i",
    officialAssets.files.appSlide,
    "-i",
    officialAssets.files.logo,
    "-i",
    officialAssets.files.pegiJekIcon,
    "-i",
    officialAssets.files.character,
    "-i",
    voice,
    "-filter_complex",
    [
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,boxblur=18:1,eq=brightness=-0.18:saturation=0.85[bg]`,
      `[bg]drawbox=x=0:y=0:w=${W}:h=${H}:color=black@0.34:t=fill[dim]`,
      `[1:v]scale=150:-1[logo]`,
      `[2:v]scale=120:-1[ijek]`,
      `[3:v]scale=420:-1[pegi]`,
      `[dim][logo]overlay=54:52[v1]`,
      `[v1][ijek]overlay=W-w-54:62[v2]`,
      `[v2][pegi]overlay=(W-w)/2:1010[v3]`,
      `[v3]subtitles='${safeAss}'[vout]`
    ].join(";"),
    "-map",
    "[vout]",
    "-map",
    "4:a",
    "-r",
    "30",
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    process.env.PEGILAGI_FFMPEG_PRESET || "veryfast",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "-shortest",
    outVideo
  ];
}

function buildAss(item, clips) {
  let t = 0;
  const lines = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV",
    "Style: Hook,Arial,86,&H00FFFFFF,&H00282828,&H00000000,1,1,4,0,5,70,70,240",
    "Style: Cap,Arial,78,&H00FFFFFF,&H001A1A1A,&H00000000,1,1,5,0,2,76,76,260",
    "Style: CTA,Arial,82,&H00FFFFFF,&H002828F6,&H00000000,1,1,5,0,2,76,76,118",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
  ];
  lines.push(`Dialogue: 1,${ts(0)},${ts(Math.min(3.2, clips[0]?.durationSeconds ?? 2))},Hook,,0,0,0,,${esc(item.hook)}`);
  for (const clip of clips) {
    const start = t;
    const end = t + clip.durationSeconds;
    const style = clip.scene === clips.length ? "CTA" : "Cap";
    lines.push(`Dialogue: 0,${ts(start)},${ts(end)},${style},,0,0,0,,${esc(clip.text)}`);
    t = end + 0.18;
  }
  return `${lines.join("\n")}\n`;
}

function ts(seconds) {
  const csTotal = Math.round(seconds * 100);
  const cs = csTotal % 100;
  const totalSeconds = Math.floor(csTotal / 100);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function esc(text) {
  return String(text).replace(/[{}]/g, "").replace(/\n/g, " ");
}

function slash(value) {
  return String(value).replace(/\\/g, "/");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}
