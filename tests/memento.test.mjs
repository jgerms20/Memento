import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Memento is an AgencyThings cultural planner with a server-side AI boundary', async () => {
  const [app, service, api, config, html] = await Promise.all([
    readFile(new URL('../App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../services/geminiService.ts', import.meta.url), 'utf8'),
    readFile(new URL('../api/memento.ts', import.meta.url), 'utf8'),
    readFile(new URL('../vite.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8')
  ]);
  for (const label of ['Memento', 'Cultural Moments Finder', 'Find moments', 'Creativity flex', 'Activation territory']) assert.match(app, new RegExp(label));
  assert.match(service, /fetch\('\/api\/memento'/);
  assert.match(api, /process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(config, /GEMINI_API_KEY|process\.env/);
  assert.doesNotMatch(html, /tailwindcss|importmap|API_KEY/);
});

test('verified starter moments retain direct official sources and future 2026 dates', async () => {
  const [data, app] = await Promise.all([
    readFile(new URL('../momentData.ts', import.meta.url), 'utf8'),
    readFile(new URL('../App.tsx', import.meta.url), 'utf8')
  ]);
  for (const source of ['comic-con.org', 'usopen.org', 'artbasel.com']) assert.match(data, new RegExp(source));
  assert.doesNotMatch(app, /target="_blank"(?![^>]*rel="noreferrer")/);
});

test('starter moments use distinct local visual treatments and calendar dates', async () => {
  const [data, types] = await Promise.all([
    readFile(new URL('../momentData.ts', import.meta.url), 'utf8'),
    readFile(new URL('../types.ts', import.meta.url), 'utf8')
  ]);
  assert.match(data, /MOMENT_IMAGE_LIBRARY/);
  assert.match(data, /getMomentImage/);
  assert.match(data, /upcomingMoments/);
  const assetRefs = [...data.matchAll(/['"](\/moment-[^'"]+\.(?:svg|png|jpg|webp))['"]/g)].map((match) => match[1]);
  assert.ok(new Set(assetRefs).size >= 4, 'expected four distinct local moment assets');
  assert.match(types, /startDate\?: string/);
  assert.match(types, /imageTreatment\?: string/);
});

test('active planner exposes the complete planning workflow and honest calendar import', async () => {
  const [app, css, service, api] = await Promise.all([
    readFile(new URL('../App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../services/geminiService.ts', import.meta.url), 'utf8'),
    readFile(new URL('../api/memento.ts', import.meta.url), 'utf8')
  ]);
  for (const hook of ['Suggest moments', 'type="date"', 'Sean', 'memento:theme', 'prefers-color-scheme', 'customLocation', 'datalist']) assert.match(`${app}\n${css}`, new RegExp(hook));
  assert.match(app, /dateRange|timeframe/);
  assert.match(app, /Import|import/);
  assert.match(service, /timeframe/);
  assert.match(api, /customLocation/);
  assert.match(api, /timeframe/);
  assert.match(app, /localStorage/);
});
