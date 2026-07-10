#!/usr/bin/env node
import { createVariants, exportLifeOS, generateBatch, generateSchedule, validateAll } from "./studio.js";
import { buildRenderPlan, renderItem, renderNext } from "./render.js";

const [command = "help", ...args] = process.argv.slice(2);
const opts = parseArgs(args);

try {
  if (command === "generate") {
    const items = await generateBatch({ count: numberOpt(opts.count, 10) });
    console.log(`Generated ${items.length} content items in out/.`);
  } else if (command === "schedule") {
    const schedule = await generateSchedule({ days: numberOpt(opts.days, 30), perDay: numberOpt(opts["per-day"], 3) });
    console.log(`Scheduled ${schedule.length} uploads in out/.`);
  } else if (command === "variants") {
    const items = await createVariants({ top: numberOpt(opts.top, 5), variants: numberOpt(opts.variants, 10) });
    console.log(`Created ${items.length} variants in out/.`);
  } else if (command === "export-lifeos") {
    const payload = await exportLifeOS();
    console.log(`Exported ${payload.calendar.length} items to out/lifeos-export.json.`);
  } else if (command === "safety") {
    const results = await validateAll();
    const failed = results.filter((result) => !result.ok);
    console.log(JSON.stringify({ ok: failed.length === 0, failed }, null, 2));
    process.exitCode = failed.length === 0 ? 0 : 1;
  } else if (command === "render") {
    if (!opts.id) throw new Error("render requires --id <content-id>");
    const item = await renderItem({ id: opts.id });
    console.log(`Rendered ${item.assets.video}`);
  } else if (command === "render-next") {
    const item = await renderNext();
    console.log(`Rendered ${item.assets.video}`);
  } else if (command === "render-plan") {
    if (!opts.id) throw new Error("render-plan requires --id <content-id>");
    console.log(JSON.stringify(buildRenderPlan({ id: opts.id, assets: { voiceover: `out/audio/${opts.id}.wav`, video: `out/videos/${opts.id}.mp4` } }), null, 2));
  } else {
    console.log("Usage: npm run studio -- <generate|schedule|variants|export-lifeos|safety|render|render-next> [--count 10] [--days 30] [--per-day 3] [--id content-id]");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function parseArgs(values) {
  const opts = {};
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[i + 1];
    opts[key] = next && !next.startsWith("--") ? values[++i] : true;
  }
  return opts;
}

function numberOpt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
