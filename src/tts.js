import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const ffmpeg = process.env.FFMPEG || "ffmpeg";

export async function synthesizeSceneAudio(item, workDir) {
  await mkdir(workDir, { recursive: true });
  const clips = [];
  for (const scene of item.scenes) {
    const wav = path.join(workDir, `line_${String(scene.scene).padStart(2, "0")}.wav`);
    const textFile = path.join(workDir, `line_${String(scene.scene).padStart(2, "0")}.txt`);
    await writeFile(textFile, scene.text, "utf8");
    if (process.env.PEGILAGI_TTS_CMD) {
      await runShell(process.env.PEGILAGI_TTS_CMD, {
        PEGILAGI_TTS_TEXT: scene.text,
        PEGILAGI_TTS_TEXT_FILE: textFile,
        PEGILAGI_TTS_OUT: wav,
        PEGILAGI_TTS_VOICE: process.env.PEGILAGI_TTS_VOICE || "af_heart"
      });
    } else if (process.env.PEGILAGI_KOKORO === "1") {
      await run(process.env.PEGILAGI_PYTHON || "python3", [
        "tools/kokoro_tts.py",
        "--text-file",
        textFile,
        "--out",
        wav,
        "--voice",
        process.env.PEGILAGI_TTS_VOICE || "af_heart"
      ]);
    } else {
      await synthesizeSilence(wav, scene.durationSeconds);
    }
    clips.push({ ...scene, wav, durationSeconds: scene.durationSeconds });
  }
  return clips;
}

export async function buildVoiceTrack(clips, workDir) {
  const silence = path.join(workDir, "gap.wav");
  await synthesizeSilence(silence, 0.18);
  const concat = path.join(workDir, "concat.txt");
  const rows = buildConcatRows(clips, silence);
  await writeFile(concat, `${rows.join("\n")}\n`, "utf8");
  const voice = path.join(workDir, "voice.wav");
  await run(ffmpeg, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", voice]);
  return voice;
}

export function buildConcatRows(clips, silence) {
  const rows = [];
  clips.forEach((clip, index) => {
    rows.push(`file '${slash(path.resolve(clip.wav))}'`);
    if (index < clips.length - 1) rows.push(`file '${slash(path.resolve(silence))}'`);
  });
  return rows;
}

async function synthesizeSilence(out, seconds) {
  await run(ffmpeg, [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=22050:cl=mono",
    "-t",
    String(seconds),
    "-c:a",
    "pcm_s16le",
    out
  ]);
}

function runShell(command, env) {
  return run(command, [], { shell: true, env: { ...process.env, ...env } });
}

function run(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}

function slash(value) {
  return String(value).replace(/\\/g, "/").replace(/'/g, "'\\''");
}
