# Oracle A1-Flex Deployment Notes

Pegilagi Studio is intentionally light: Node stdlib only, no database, no browser renderer, no resident worker required.

## Pull

```bash
cd ~
git clone git@github.com:timsurrealedu/pegilagiMarketing.git
cd pegilagiMarketing
npm test
```

## Daily Generation

Use cron instead of a long-running service on the free-tier box:

```cron
15 5 * * * cd ~/pegilagiMarketing && /usr/bin/npm run studio -- generate --count 3 >> studio.log 2>&1
30 5 * * 0 cd ~/pegilagiMarketing && /usr/bin/npm run studio -- variants --top 5 --variants 10 >> studio.log 2>&1
45 5 * * * cd ~/pegilagiMarketing && /usr/bin/npm run studio -- export-lifeos >> studio.log 2>&1
```

## A1-Flex Constraints

- Keep video rendering, voice generation, and uploads as queued jobs or external API calls.
- Do not run a headless browser continuously.
- Avoid committing generated media; `out/audio` and `out/videos` are ignored except `.gitkeep`.
- Keep `out/lifeos-export.json` as the handoff file for lifeOS until a direct API is added.
