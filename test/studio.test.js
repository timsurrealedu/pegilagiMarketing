import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { exportLifeOS, generateBatch, generateSchedule, validateAll } from "../src/studio.js";
import { buildRenderPlan } from "../src/render.js";
import { buildConcatRows } from "../src/tts.js";

test("generateBatch creates safe content assets", async () => {
  const dir = await tempDir();
  try {
    const items = await generateBatch({ count: 10, outDir: dir });
    assert.equal(items.length, 10);
    assert.ok(items.every((item) => item.channels.includes("tiktok")));
    assert.ok(items.every((item) => item.script.includes("Download Pegilagi")));
    assert.ok(items.every((item) => item.safety.ok));
    const safety = await validateAll({ outDir: dir });
    assert.ok(safety.every((result) => result.ok));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("generateSchedule follows 30 day multi upload shape", async () => {
  const dir = await tempDir();
  try {
    const schedule = await generateSchedule({ days: 30, perDay: 3, outDir: dir });
    assert.equal(schedule.length, 90);
    assert.deepEqual(schedule[0].channels, ["tiktok", "instagram_reels", "youtube_shorts"]);
    assert.equal(schedule[3].slot, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("exportLifeOS contains calendar and approval queue", async () => {
  const dir = await tempDir();
  try {
    await generateBatch({ count: 3, outDir: dir });
    const payload = await exportLifeOS({ outDir: dir });
    assert.equal(payload.calendar.length, 3);
    assert.equal(payload.approvalQueue.length, 3);
    assert.ok(payload.backlog.length >= 7);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("buildRenderPlan uses official Pegilagi website assets", () => {
  const plan = buildRenderPlan({
    id: "demo",
    assets: {
      voiceover: "out/audio/demo.wav",
      video: "out/videos/demo.mp4"
    }
  });
  assert.equal(plan.source, "https://pegilagi.com/");
  assert.equal(plan.aspectRatio, "9:16");
  assert.ok(plan.overlays.some((asset) => asset.includes("logo-circle.png")));
  assert.ok(plan.overlays.some((asset) => asset.includes("pegi.svg")));
});

test("buildConcatRows writes absolute paths for ffmpeg concat files", () => {
  const rows = buildConcatRows([{ wav: "out/render-work/demo/line_01.wav" }], "out/render-work/demo/gap.wav");
  assert.match(rows[0], /^file '([A-Za-z]:\/|\/)/);
});

test("render plan points at ignored media output paths", () => {
  const plan = buildRenderPlan({
    id: "demo",
    assets: {
      voiceover: "out/audio/demo.wav",
      video: "out/videos/demo.mp4"
    }
  });
  assert.equal(plan.voice, "out/audio/demo.wav");
  assert.equal(plan.video, "out/videos/demo.mp4");
});

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), "pegilagi-studio-"));
}
