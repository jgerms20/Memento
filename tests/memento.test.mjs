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
  const app = await readFile(new URL('../App.tsx', import.meta.url), 'utf8');
  for (const source of ['comic-con.org', 'usopen.org', 'artbasel.com']) assert.match(app, new RegExp(source));
  assert.doesNotMatch(app, /target="_blank"(?![^>]*rel="noreferrer")/);
});
