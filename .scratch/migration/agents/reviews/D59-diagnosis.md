# Diagnosis: D59 part (7), text larger under a rice theme than under a VS Code theme

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. If the same step is diagnosed again later, that diagnosis is appended below under its own heading, at the same level as the title above (`# Diagnosis: <the symptom in a few words>`), and the heading names its finding or quotes its part.

Diagnosis agent: ac259ac1e1fc1d63d, claude-opus-5-5, 321,726 tokens, 118 tool uses, 55.9 min

## Symptom

From `tools/oculus/.scratch/migration/plan.md:740`, D59 part (7). This is the only part of D59 that asks for a cause:

"under a rice theme some text reads larger than under a VS Code theme although `body.rice` (`src/lib/themes/themes.css:732`) sets each of the seven `--fs-*` steps one step below `tokens.css:132-138`: it is most visible in the Files view (the user); find why, for each place it happens, and end it, so no text under a rice theme is larger than the same text under a VS Code theme"

The user's words, as the brief of this diagnosis quotes them: "check font sizes of the rice themes compared to vscode themes. rice themes seem to have larger font sizes for (some) things" and "Its very visible in FIles view".

The step's tag names a ruling, at `plan.md:1692`: "Rice font sizes (2026-10-10): text that reads larger under a rice theme than under a VS Code theme is found and ended in D59 (the user)."

D59 has no Step 0 line: `sed -n 740,741p plan.md` shows the step line followed by R2's line.

Read before the run:
- the skill text;
- `tools/oculus/.scratch/migration/agents/spec.md`, the rules file named at `.agents/plan.yaml:7` (`standards: []` at `:8`).

No `docs/glossary.md` exists (`ls` of both candidate paths: no such file). No `docs/adr` folder exists (`ls` exit 1).

## Where the probes run

**The scratch tree.**
- A detached scratch worktree at main's HEAD `c184158209eb54fe8816dd93469bdd06da344c26` ("Serve the engine's guides on every hub").
- Made from the main checkout with `git worktree add --detach "$tmp/tree" HEAD`, where `$tmp` = `$TMPDIR/diagnose.xtI1OW`.
- Sparse to `tools/oculus docs`, with `npm ci` run in `$tmp/tree/tools/oculus` under Node v24.21.0.
- Nothing was applied to it (premise form).

**The dev server.**
- One oculus dev server ran from the scratch tree: `npm run dev`, pid 48206, with its vite child 48582, on port 8811.
- Its `config/local.yml` was the scratch tree's own (`hub: $tmp/hub`, `port: 8811`).
- The hub was a copy of `tools/oculus/demo/` at `$tmp/hub`.
- The probes added one app folder to that copy, `$tmp/hub/.oculus/apps/nudge/`, so the app approval panel could be drawn. It holds the `app.yml` from the worked example of `docs/apps.md` and a one-line `index.html`.

**The browser.**
- Headless Chrome (`--headless=new`, a fresh `--user-data-dir` under `$tmp` per run, debugging port 9311, window 1600x1000, device scale 1).
- Driven through the DevTools protocol over Node's own WebSocket.
- No port 8787 or 8790, no tab of the user's Chrome, no Electron.

The paths redirected under `$TMPDIR`: HOME (`$tmp/home`) and TMUX_TMPDIR (`$tmp/tmux`). ORDO_STABLE and ORDO_SKILL_DIRS were not needed, since the run touches no skill or pinned checkout.

## Red command

```
"$T/probe/red-all.sh" "$T"        # T=$TMPDIR/diagnose.<x>, the scratch copy's parent; dev server of the scratch tree on 8811
```

What the command does:
- It loads each state listed in `views.txt` under the rice theme `mocha` and then under the VS Code theme `vscode-dark-2026`, in a fresh headless Chrome per theme.
- It sets the theme through the page's own saved record `oculus.ui.v1`, `{version: 2, theme}`. That record is read by `src/lib/state/workbench/ui.svelte.ts:55-69` and applied by `applyTheme` (`src/lib/ui/theme.ts:81-101`), which sets the body class and the derived tokens.
- For every visible text node it records the computed font-size and font-family of the parent element, and the width and height of the text's own rendered box (`Range.getBoundingClientRect`).
- For a text input with a placeholder, it records the input's font and the placeholder's width.
- It pairs the same text of the same element under both themes and reports every text whose size under rice is not below its size under the VS Code theme. It marks LARGER the ones whose rendered box is also wider.
- It exits 1 when any such text exists.

Why the red asserts "not below" rather than "larger": the step's text says `body.rice` sets every size one step below the VS Code size. A text that keeps the VS Code size under rice is therefore one the step-down missed, and it is drawn in the wider monospace face (`body.rice` sets `--font-ui: var(--font-mono)`, `themes.css:744-745`).

The sources, as the last runs used them, so the brief can carry the command.

`views.txt` holds one state per line. A plain name presses the rail button with that `aria-label`; `text:<words>` presses the element holding a text node of exactly those words.

```
Explorer
text:hub
text:CAREER.yml
text:Repositories
text:Search
Focus
Projects
Incoming
Sessions
Academic Life
Pillars
References
Present
Apps
System
text:Nudge
Help
```

`red-all.sh`:

```sh
#!/bin/sh
# red-all.sh: the red command over every rail view, the Files view's states, an open file and an app's approval panel.
T=$1; cd "$T/probe" || exit 2
tr '\n' '\0' < views.txt | xargs -0 ./red.sh "$T"
```

`red.sh`:

```sh
#!/bin/sh
# red.sh: measure the named views under a rice theme and under a VS Code theme, each in a fresh headless Chrome, then compare.
T=$1; shift
export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
cd "$T/probe" || exit 2
node measure.mjs "$T" "${RICE:-mocha}" "$T/probe/mocha.json" "$@" || exit 2
node measure.mjs "$T" "${VS:-vscode-dark-2026}" "$T/probe/vs.json" "$@" || exit 2
node compare.mjs "$T/probe/mocha.json" "$T/probe/vs.json"
```

`cdp.mjs`:

```js
// Minimal Chrome DevTools Protocol driver over Node's global WebSocket, headless Chrome under $T.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export async function launch(T, port = 9311) {
    const dir = mkdtempSync(join(T, 'chrome-'));
    const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
        '--window-size=1600,1000', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'],
        { stdio: 'ignore' });
    let targets = null;
    for (let i = 0; i < 100 && !targets; i++) {
        await new Promise((r) => setTimeout(r, 100));
        try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {}
    }
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0; const pending = new Map();
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result?.result?.value; };
    await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
    const close = async () => { try { ws.close(); } catch {} proc.kill('SIGTERM'); await new Promise((r) => proc.once('exit', r)); };
    return { send, evaluate, close, pid: proc.pid };
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
```

`measure.mjs`:

```js
// Usage: node measure.mjs <T> <theme> <out.json> <view>...
import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const [T, theme, out, ...views] = process.argv.slice(2);
const keep = setInterval(() => {}, 1000);
const b = await launch(T);
const result = { theme, body: '', views: {} };
try {
    await b.send('Page.navigate', { url: 'http://127.0.0.1:8811/' });
    await sleep(4000);
    await b.evaluate(`localStorage.setItem('oculus.ui.v1', JSON.stringify({version: 2, theme: ${JSON.stringify(theme)}, ...${process.env.UIEXTRA || "{}"}})); 1`);
    await b.send('Page.reload');
    await sleep(5000);
    result.body = await b.evaluate('document.body.className');
    // Every font-size token of tokens.css and slide.css as body and a slide frame resolve it.
    result.tokens = await b.evaluate(`(() => { const out = {}; const cs = getComputedStyle(document.body);
        for (const n of ['--fs-xs','--fs-sm','--fs-md','--tree-font','--tree-heading-font','--tree-badge-font','--status-text','--button-font','--rail-badge-text']) out[n] = cs.getPropertyValue(n).trim();
        const f = document.createElement('div'); f.className = 'slide-frame'; document.body.append(f); const fs = getComputedStyle(f);
        for (const n of ['--slide-fs-title','--slide-fs-h','--slide-fs-sub','--slide-fs-body','--slide-fs-small']) out[n] = fs.getPropertyValue(n).trim();
        f.remove(); return out; })()`);
    for (const view of views) {
        if (view.startsWith('text:')) await b.evaluate(`(() => { const want = ${JSON.stringify(view.slice(5))};
            const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let n = w.nextNode(); n; n = w.nextNode()) if (n.textContent.trim() === want) { n.parentElement.click(); return 1; }
            throw new Error('no text ' + want); })()`);
        else await b.evaluate(`document.querySelector('button[aria-label=${JSON.stringify(view)}]').click(); 1`);
        await sleep(view.startsWith('text:') ? 4000 : 2500);
        result.views[view] = await b.evaluate(`(() => {
            const rows = []; const seen = {};
            const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let n = walk.nextNode(); n; n = walk.nextNode()) {
                const text = n.textContent.replace(/\\s+/g, ' ').trim();
                if (!text || !n.parentElement) continue;
                const r = document.createRange(); r.selectNodeContents(n);
                const box = r.getBoundingClientRect();
                if (box.width === 0 || box.height === 0 || box.y > 1000) continue;
                const cs = getComputedStyle(n.parentElement);
                const tag = n.parentElement.tagName.toLowerCase() + '.' + [...n.parentElement.classList].filter(c => !c.startsWith('svelte-')).join('.');
                const key = text.slice(0, 60) + ' @' + tag; seen[key] = (seen[key] || 0) + 1;
                rows.push({ key: key + '#' + seen[key], tag,
                    fs: parseFloat(cs.fontSize), ff: cs.fontFamily.split(',')[0], w: +box.width.toFixed(2), h: +box.height.toFixed(2), x: Math.round(box.x), y: Math.round(box.y) });
            }
            for (const el of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]), textarea')) {
                const box = el.getBoundingClientRect(); if (box.width === 0 || !el.placeholder) continue;
                const cs = getComputedStyle(el); const key = 'INPUT ' + (el.placeholder || el.getAttribute('aria-label') || '').slice(0, 50);
                seen[key] = (seen[key] || 0) + 1;
                const c = document.createElement('canvas').getContext('2d'); c.font = cs.font;
                rows.push({ key: key + '#' + seen[key], tag: el.tagName.toLowerCase(), fs: parseFloat(cs.fontSize), ff: cs.fontFamily.split(',')[0], w: +c.measureText(el.placeholder || '').width.toFixed(2), h: +box.height.toFixed(2), x: Math.round(box.x), y: Math.round(box.y) });
            }
            return rows;
        })()`);
    }
} finally { await b.close(); clearInterval(keep); }
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(theme, result.body, Object.fromEntries(Object.entries(result.views).map(([k, v]) => [k, v.length])));
```

`compare.mjs`:

```js
// Usage: node compare.mjs <rice.json> <vscode.json>
// For each text present in both runs of the same view: a text whose rice font-size is not below its
// VS Code font-size has not taken the rice step down and keeps VS Code's size in the rice monospace
// face; LARGER marks one whose rendered box is also wider. Exits 1 when any text has not taken it.
import { readFileSync } from 'node:fs';
const [ricePath, vsPath] = process.argv.slice(2);
const rice = JSON.parse(readFileSync(ricePath)); const vs = JSON.parse(readFileSync(vsPath));
let red = 0;
for (const [name, value] of Object.entries(rice.tokens ?? {})) {
    const other = vs.tokens?.[name];
    console.log(`token ${name}: rice ${value} | vscode ${other}${value === other ? ' | SAME' : ''}`);
}
for (const view of Object.keys(rice.views)) {
    const vsRows = new Map(vs.views[view].map((r) => [r.key, r]));
    const rows = rice.views[view].filter((r) => vsRows.has(r.key)).map((r) => [r, vsRows.get(r.key)]);
    const unstepped = rows.filter(([r, v]) => r.fs >= v.fs - 0.01);
    const larger = unstepped.filter(([r, v]) => r.w > v.w + 0.5);
    console.log(`== ${view}: ${rows.length} texts in both | rice font-size not below vscode: ${unstepped.length} | of those wider under rice: ${larger.length}`);
    for (const [r, v] of unstepped) console.log(`  ${r.w > v.w + 0.5 ? 'LARGER' : 'same  '} ${JSON.stringify(r.key.slice(0, 40))} ${r.tag} | rice ${r.fs}px ${r.ff} ${r.w}x${r.h} | vscode ${v.fs}px ${v.ff} ${v.w}x${v.h}`);
    red += unstepped.length;
}
console.log(red ? `RED: ${red} texts under ${rice.theme} not below their size under ${vs.theme}` : `GREEN: every text under ${rice.theme} is below its size under ${vs.theme}`);
process.exit(red ? 1 : 0);
```

### Runs before the tightening

The first form of the command differed from the one above in four ways:
- it measured the rail views and three Files states only;
- it skipped the rail column (`x < 50`);
- it keyed a text by its words and occurrence only;
- it had no token readout.

It was run three times in a row over `Explorer text:hub text:Repositories text:Search Focus Projects Incoming Sessions "Academic Life" Pillars References Present Apps Help System`:

```
run 1 exit=1
== Explorer: 43 texts in both | rice font-size not below vscode: 19 | of those wider under rice: 8
== text:hub: 56 texts in both | rice font-size not below vscode: 32 | of those wider under rice: 18
== text:Repositories: 31 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== text:Search: 30 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Focus: 120 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Projects: 165 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Incoming: 36 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Sessions: 59 texts in both | rice font-size not below vscode: 16 | of those wider under rice: 11
== Academic Life: 65 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Pillars: 77 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== References: 68 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Present: 32 texts in both | rice font-size not below vscode: 12 | of those wider under rice: 7
== Apps: 19 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== Help: 60 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
== System: 792 texts in both | rice font-size not below vscode: 8 | of those wider under rice: 4
RED: 170 texts under mocha not below their size under vscode-dark-2026
run 2 exit=1
(the same fifteen lines; System: 791 texts in both)
RED: 170 texts under mocha not below their size under vscode-dark-2026
run 3 exit=1
(the same fifteen lines; System: 791 texts in both)
RED: 170 texts under mocha not below their size under vscode-dark-2026
rows identical over three runs        # diff of the row lines of run 1 against runs 2 and 3
```

The Explorer rows of that command, from its first run. The Explorer is the Files view, the place the user names.

```
  same   "Open Editors#1" span.name | rice 11px ui-monospace 79.48x13 | vscode 11px -apple-system 84.25x13
  same   "Configured roots#1" span.name | rice 11px ui-monospace 105.97x13 | vscode 11px -apple-system 118x13
  same   "hub#1" span.name | rice 13px ui-monospace 23.48x15 | vscode 13px -apple-system 23x16
  LARGER "engine#1" span.name | rice 13px ui-monospace 46.97x15 | vscode 13px -apple-system 40.7x16
  same   "Outline#1" span.name | rice 11px ui-monospace 46.36x13 | vscode 11px -apple-system 50.08x13
  LARGER "The active editor cannot provide outline" span.name | rice 13px ui-monospace 414.83x15 | vscode 13px -apple-system 316.67x16
  same   "Timeline#1" span.name | rice 11px ui-monospace 52.98x13 | vscode 11px -apple-system 53.44x13
  same   "Bookmarks#1" span.name | rice 11px ui-monospace 59.61x13 | vscode 11px -apple-system 73.95x13
  LARGER "No bookmark yet. The star on a file adds" span.name | rice 13px ui-monospace 352.2x15 | vscode 13px -apple-system 275x16
  same   "Notes#1" span.name | rice 11px ui-monospace 33.13x13 | vscode 11px -apple-system 38.7x13
  LARGER "No note yet.#1" span.name | rice 13px ui-monospace 93.92x15 | vscode 13px -apple-system 73.88x16
  LARGER "0#6" span.label | rice 12px ui-monospace 14.45x14 | vscode 12px -apple-system 10.94x15
  LARGER "0#7" span.label | rice 12px ui-monospace 14.45x14 | vscode 12px -apple-system 10.94x15
  LARGER "11#1" span.label | rice 12px ui-monospace 14.45x14 | vscode 12px -apple-system 11.14x15
  LARGER "unreachable#2" span.label | rice 12px ui-monospace 79.48x14 | vscode 12px -apple-system 69.55x15
  same   "down#1" span.label | rice 12px ui-monospace 28.91x14 | vscode 12px -apple-system 30.53x15
  same   "up#1" span.label | rice 12px ui-monospace 14.45x14 | vscode 12px -apple-system 14.33x15
  same   "0#8" span.label | rice 12px ui-monospace 7.23x14 | vscode 12px -apple-system 7.56x15
  same   "0#9" span.label | rice 12px ui-monospace 7.23x14 | vscode 12px -apple-system 7.56x15
```

The same Explorer run also shows texts that do take the step:
- the tab label "Files" (`span.label`): rice 12px, 36.13x14, against vscode 13px, 27.8x16;
- the view title "Files" (`h2.title`): 10px against 11px;
- the filter box (`input`): 12px against 13px;
- the count "0" (`span.count`): 11px against 12px.

### Runs after the tightening

The tightening:
- the rail column is measured too;
- an open file (`text:hub`, `text:CAREER.yml`) and an app's approval panel (`Apps`, `System`, `text:Nudge`) were added;
- a text is keyed by its words, its element and its occurrence, so an extra text under one theme no longer shifts the pairing of the next. An unpaired "Status" in the System view had paired a 12px tab label with an 11px heading.
- an input or textarea with no placeholder is left out. The one found is Monaco's `textarea.ime-text-area`, which holds no text and has the browser default 13.333px monospace under both themes.
- the command waits 4 s after a `text:` press, so the editor has drawn;
- the token readout was added.

Three runs in a row of `red-all.sh`:

```
run 1 exit=1
RED: 281 texts under mocha not below their size under vscode-dark-2026
run 2 exit=1
RED: 292 texts under mocha not below their size under vscode-dark-2026
run 3 exit=1
RED: 292 texts under mocha not below their size under vscode-dark-2026
```

How the three runs compare:
- Runs 2 and 3 have identical rows (`diff` of their row lines: no difference).
- Run 1 differs from run 2 only in one live status bar item. From text:Search to System, run 1 has one text fewer per state and lacks the row `same "down @span.label#1" span.label | rice 12px ui-monospace 28.91x14 | vscode 12px -apple-system 30.53x15`; the item's text was another word at that moment.
- The element groups of the red rows are the same in all three runs (`diff` of the grouped lists of run 1 and run 2: no difference).

Below are the per-state lines of run 2 that the `diff` against run 1 printed. The lines for Explorer, text:hub, text:CAREER.yml, text:Repositories, text:Nudge and Help were equal in both runs, so the diff did not print them. The gruvbox run of the shrink, made with this same command, printed `== Explorer: 46 texts in both | rice font-size not below vscode: 22 | of those wider under rice: 9`.

```
== text:Search: 72 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Focus: 123 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Projects: 168 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Incoming: 39 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Sessions: 62 texts in both | rice font-size not below vscode: 19 | of those wider under rice: 12
== Academic Life: 65 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Pillars: 80 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== References: 71 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== Present: 35 texts in both | rice font-size not below vscode: 15 | of those wider under rice: 8
== Apps: 22 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
== System: 252 texts in both | rice font-size not below vscode: 11 | of those wider under rice: 5
RED: 292 texts under mocha not below their size under vscode-dark-2026
```

The red rows of run 2, grouped by element and by size under each theme (count, element, rice size, vscode size, an example):

```
161  span.label      | rice 12px   | vscode 12px     e.g. "YQ530VVFGK" (status bar item)
 67  span.name       | rice 13px   | vscode 13px     e.g. "hub" (tree row)
 34  span.badge      | rice 9px    | vscode 9px      e.g. "7" (rail badge)
 17  span.name       | rice 11px   | vscode 11px     e.g. "Open Editors" (tree section head)
  4  span.file-icon  | rice 19.5px | vscode 19.5px   (Seti glyph of a tree row, 150% of the row)
  3  p.meta          | rice 12px   | vscode 12px     e.g. LARGER "Name: nudge" (app approval panel)
  1  h2.             | rice 14px   | vscode 14px     LARGER "Approve this app" (app approval panel)
  1  h3.title        | rice 16px   | vscode 16px     "Nudge" (app approval panel)
  1  span.inline     | rice 56px   | vscode 56px     LARGER "A synthetic research hub" (slide title)
  1  p.              | rice 28px   | vscode 28px     LARGER "2 project slides, found by the deck itse" (slide)
  1  span.inline     | rice 18px   | vscode 18px     "Demo hub" (slide)
  1  p.keys          | rice 18px   | vscode 18px     LARGER "Arrow keys or Space move through the dec" (slide)
```

The token readout of the same command before any change. It comes from the gruvbox run of the shrink; the readout under mocha is identical.

```
token --fs-xs: rice calc(10px * 1) | vscode calc(11px * 1)
token --fs-sm: rice calc(11px * 1) | vscode calc(12px * 1)
token --fs-md: rice calc(12px * 1) | vscode calc(13px * 1)
token --tree-font: rice 13px | vscode 13px | SAME
token --tree-heading-font: rice 11px | vscode 11px | SAME
token --tree-badge-font: rice 11px | vscode 11px | SAME
token --status-text: rice 12px | vscode 12px | SAME
token --button-font: rice 12px | vscode 12px | SAME
token --rail-badge-text: rice 9px | vscode 9px | SAME
token --slide-fs-title: rice calc(56px * 1) | vscode calc(56px * 1) | SAME
token --slide-fs-h: rice calc(36px * 1) | vscode calc(36px * 1) | SAME
token --slide-fs-sub: rice calc(28px * 1) | vscode calc(28px * 1) | SAME
token --slide-fs-body: rice calc(24px * 1) | vscode calc(24px * 1) | SAME
token --slide-fs-small: rice calc(18px * 1) | vscode calc(18px * 1) | SAME
```

### The places

The places were found in two ways:
- a script that walked each red text's ancestors under mocha and listed the stylesheet rules that match it and set `font-size`;
- the grep `grep -rnE "font-size:" src | grep -v "var(--fs-"`, whose 72 lines were each read.

1. **The trees.** This covers the Files view's trees and every other tree: the Repositories view's tree, the Sessions view's Customizations tree and the Outline section.
   - Rules: `.item` uses `font-size: calc(var(--tree-font) * var(--text-scale, 1))` (`src/lib/ui/tree/TreeItem.svelte:266`); `.heading` uses `calc(var(--tree-heading-font) ...)` (`:504`); the count pill uses `calc(var(--tree-badge-font) ...)` (`:489`).
   - The same `--tree-font` is used in `src/lib/ui/tree/NameField.svelte:110`, `src/lib/ui/forms/TextArea.svelte:127`, `src/lib/views/sources/repositories/changes/ChangeRow.svelte:263,283`, `src/lib/views/sources/repositories/graph/CommitRow.svelte:241` and `src/lib/views/sources/repositories/diff/FileHeader.svelte:113`.
   - The tokens are px values of their own: `--tree-font: 13px`, `--tree-heading-font: 11px`, `--tree-badge-font: 11px` (`src/lib/themes/tokens.css:179,181,187`).
   - The Seti icons of a row follow the row's size (`src/lib/ui/display/FileIcon.svelte:46`, `font-size: 150%`).
2. **The status bar.** `font-size: var(--status-text)` at `src/lib/shell/status/StatusBar.svelte:311`, `src/lib/ui/controls/ToolButton.svelte:232,252` and `src/lib/ui/menu/MenuOpener.svelte:246,260`. The token is `--status-text: 12px` (`tokens.css:118`).
3. **The rail's badges.** `font-size: var(--rail-badge-text)` at `src/lib/shell/rail/RailPages.svelte:263`. The token is `--rail-badge-text: 9px` (`tokens.css:112`).
4. **A form's action button, the joined menu opener and a graph row's ref pills.**
   - Rules: `calc(var(--button-font) * var(--text-scale, 1))` at `ToolButton.svelte:308` (`.tool.primary`), `MenuOpener.svelte:187` (`body.rice .opener.primary`) and `CommitRow.svelte:261,280`. The token is `--button-font: 12px` (`tokens.css:219`).
   - Users of `primary`: `src/lib/views/shared/changes/CommitBox.svelte:200,217,226,235` and `src/lib/shell/rail/ScheduleDialog.svelte:190`.
   - Not rendered: the demo hub draws none of these controls without a git repository or a schedule dialog. This place's red is therefore the token readout (`--button-font ... SAME`), not a rendered text.
   - The same holds for `--tree-badge-font` (a tree row's count pill) and for the repository rows of item 1. Those need a git repository in the hub copy, and a `git init` there was outside the git commands this diagnosis may run.
5. **The Present deck.** The slide scale, from `--slide-fs-title: calc(56px ...)` down to `--slide-fs-small: calc(18px ...)`, is declared on `.slide-frame` itself (`src/lib/themes/slide.css:5-10`). Every slide part under `src/lib/views/academic/present/` reads it. Because the frame declares the tokens on its own element, no `body.rice` declaration reaches them.
6. **The app approval panel.** Literal px: `h2 { font-size: 14px }`, `.title { font-size: 16px }`, `.meta { font-size: 12px }` (`src/lib/views/apps/frame/ApprovalPanel.svelte:108,115,130`). These are the only literal px font sizes in `src` outside `tokens.css`.

The comment at `tokens.css:125-131` says the opposite of items 1 to 6: "Every font-size resolves through these seven steps, VS Code's own sizes, so a theme rescales the whole UI by overriding them here and no rule carries its own px value."

Places checked that are not larger:
- **The terminal grid and the debug console.** Both draw in `--font-mono` under every theme, at the configured `terminal.font_px: 12.5` (`config/appearance.yml`). When that key is left out, `src/lib/views/sessions/terminal/terminal-list.ts:128-135` reads `--fs-md` off `document.body`, so the size then follows the rice step.
- **The open file's code text in Monaco.** It is stepped: no Monaco text row is red in `text:CAREER.yml`.
- **Sizes in `%` or `em`.** These follow their parent and step with it: `TabFace.svelte:399`, `Breadcrumb.svelte:95`, `ChangeGroups.svelte:325`, `FileRow.svelte:179`, `OpenEditors.svelte:307`, `FileHeader.svelte:143,149`, `MathPreview.svelte:95`, `FileIcon.svelte:46`.

## No red command

not applicable

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| Every state but Explorer (first form of the command, `./red.sh $T Explorer`) | red: `== Explorer: 43 texts in both \| rice font-size not below vscode: 19 \| of those wider under rice: 8`, `RED: 19 texts` | cut: the tree rows and the status bar need only the Files view |
| Every state but Present (`./red.sh $T Present`) | red: `== Present: 32 texts in both \| rice font-size not below vscode: 12 \| of those wider under rice: 7`, `RED: 12 texts` | cut: the slide rows need only the Present view |
| The wallpaper (`UIEXTRA='{"wallpaper":false}' ./red.sh $T Explorer`, body class `rice mocha` without `wall`) | red: `RED: 19 texts under mocha not below their size under vscode-dark-2026` | cut |
| The palette class `mocha`, with `gruvbox` in its place (`RICE=gruvbox ./red.sh $T Explorer`, after the tightening) | red: `== Explorer: 46 texts in both \| rice font-size not below vscode: 22 \| of those wider under rice: 9`, `RED: 22 texts under gruvbox` | cut: any rice palette shows it |

The shrunk case, as it stands:
- a page under any rice theme (`body.rice`) against the same page under a VS Code theme;
- for each place, the one view that draws it: the Files view for the trees, the status bar and the rail badges; the Present view for the slide; an unapproved app's tab for the approval panel;
- for the button font and the tree count pill, the token readout on `body`.

The rice class is needed, since the seven steps differ only under it.

## Hypotheses

After the red, the code read left four causes standing, one per kind of size source that the red rows resolve to. Every font-size declaration in `src` was read (the 72-line grep above) and no other kind of source exists, so the list holds four.

1. If the trees size their text from `--tree-font`, `--tree-heading-font` and `--tree-badge-font`, which are px tokens outside the seven steps that `body.rice` does not set, then `body.rice` setting each one 1px down turns every tree row of the red command green (`span.name`, and the Seti icons that follow it). Falsified by: a `span.name` row still red with the tokens set, which would mean another rule sizes the rows.
2. If the status bar, the rail badges and the form button size their text from `--status-text`, `--rail-badge-text` and `--button-font`, which are fixed px tokens that `body.rice` does not set, then `body.rice` setting each one 1px down turns every `span.label` row of the status bar and every `span.badge` row of the rail green, and steps `--button-font` in the token readout. Falsified by: a status bar or rail badge row still red with the tokens set.
3. If the slide text keeps its size because `.slide-frame` declares the slide scale on its own element, where no `body.rice` declaration reaches it, then a `body.rice .slide-frame` rule that steps the five slide tokens turns every slide row of the Present view green. Falsified by: a slide row still red with that rule, or the frame's tokens unchanged in the readout.
4. If the approval panel keeps its size because its three rules carry literal px, then having those rules read `--fs-lg`, `--fs-xl` and `--fs-sm` turns every approval panel row green. Under a VS Code theme those steps are the same 14, 16 and 12 px. Falsified by: an approval panel row still red with the steps read.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `src/lib/themes/themes.css`, in `body.rice` after `--fs-3xl`: `+    --tree-font: 12px;` `+    --tree-heading-font: 10px;` `+    --tree-badge-font: 10px;` | `./red.sh $T Explorer text:hub text:CAREER.yml Sessions`: `token --tree-font: rice 12px \| vscode 13px`, `token --tree-heading-font: rice 10px \| vscode 11px`, `token --tree-badge-font: rice 10px \| vscode 11px`; `== Explorer: 46 texts in both \| rice font-size not below vscode: 11`, `== text:hub: 59 ... 11`, `== text:CAREER.yml: 143 ... 18`, `== Sessions: 62 ... 11`, `RED: 51 texts`; `grep -c "span.name"` over the output: `0` (run 2 of the tightened command, over all seventeen states, had 84 `span.name` rows); every row left is a `span.label` or `span.badge` | still standing |
| 2 | `src/lib/themes/themes.css`, in `body.rice` after `--fs-3xl`: `+    --status-text: 11px;` `+    --rail-badge-text: 8px;` `+    --button-font: 11px;` | `./red.sh $T Explorer text:hub text:CAREER.yml Sessions`: `token --status-text: rice 11px \| vscode 12px`, `token --button-font: rice 11px \| vscode 12px`, `token --rail-badge-text: rice 8px \| vscode 9px`; `RED: 85 texts`; rows that are `span.label` or `span.badge`: `0`; the rows left: 81 `span.name` and 4 `span.file-icon` | still standing |
| 3 | `src/lib/themes/slide.css`, appended: `body.rice .slide-frame { --slide-fs-title: calc(52px * var(--text-scale, 1)); --slide-fs-h: calc(33px * ...); --slide-fs-sub: calc(26px * ...); --slide-fs-body: calc(22px * ...); --slide-fs-small: calc(17px * ...); }` | `./red.sh $T Present`: `token --slide-fs-title: rice calc(52px * 1) \| vscode calc(56px * 1)` and the four others stepped; `== Present: 35 texts in both \| rice font-size not below vscode: 11 \| of those wider under rice: 5`, `RED: 11 texts`; rows other than `span.label` and `span.badge`: none (the four slide rows were red before) | still standing |
| 4 | `src/lib/views/apps/frame/ApprovalPanel.svelte`: `-        font-size: 14px;` `+        font-size: var(--fs-lg);` (h2), `-        font-size: 16px;` `+        font-size: var(--fs-xl);` (.title), `-        font-size: 12px;` `+        font-size: var(--fs-sm);` (.meta) | `./red.sh $T Apps System text:Nudge`: `== Apps: 21 ... 10`, `== System: 252 ... 10`, `== text:Nudge: 35 texts in both \| rice font-size not below vscode: 11 \| of those wider under rice: 6`, `RED: 31 texts`; rows other than `span.label` and `span.badge`: none (before the change, the approval panel's `h2` "Approve this app", `h3.title` "Nudge" and three `p.meta` rows were red in run 2 of the tightened command) | still standing |

Each change was undone after its run by copying back the file saved before it. `cmp` checked each restore and printed `restored` each time. No probe added logging, so no `DIAG-` tag was used.

## Cause

There are four causes. Each is a size source of its own that the rice step-down at `themes.css:732-739` does not reach. Each probe turns its own rows green while the other rows stay red.

1. **The trees.** Their text sizes come from `--tree-font: 13px`, `--tree-heading-font: 11px` and `--tree-badge-font: 11px` (`tokens.css:179,181,187`). These are px tokens outside the seven steps, and `body.rice` does not set them.
   - The Files view holds the most of these rows: 22 of the Explorer's 46 paired texts in the tightened command's gruvbox run, against 11 in each view without a tree in run 2.
   - Probe 1: 84 tree rows were red without the change (run 2); none were red in the probe's run with it.
2. **The status bar, the rail badges and the form button.** Their text sizes come from the fixed tokens `--status-text: 12px` (`tokens.css:118`), `--rail-badge-text: 9px` (`:112`) and `--button-font: 12px` (`:219`), which `body.rice` does not set. Probe 2: every status bar and rail badge row was red without the change and none with it; `--button-font` stepped in the readout.
3. **The slide scale.** It is declared on `.slide-frame` itself (`slide.css:5-10`), so no `body.rice` declaration reaches it. Probe 3: the four slide rows were red without the change and none with it.
4. **The app approval panel.** It carries literal px (`ApprovalPanel.svelte:108,115,130`). Probe 4: its rows were red without the change and none with it.

The common root: `tokens.css:125-131` promises one type scale with no other px value. In fact six size tokens, the slide scale and one component carry px values of their own, and `body.rice` steps only the seven `--fs-*` tokens.

Why the fix keeps each separate token and has the rice block set it, instead of deriving the tokens from `--fs-*`:
- Each token has its own reason. The status bar and rail badge sizes are fixed so that a larger text scale leaves the bar alone (`tokens.css:109-118`). The tree and button sizes are scaled where a row is drawn, so an ancestor's `--text-scale` applies (`:175-177`).
- Deriving them would not work. A custom property on `:root` that holds `var(--fs-md)` is resolved at `:root`, so it keeps 13px under `body.rice`. It would also scale the tree twice.

## Fix and test

Test, run on the tree without the fix:

```
No test is written; see the two lines at the end of this section. The red command on the tree without the fix is run 2 of "Runs after the tightening" above: RED: 292 texts under mocha not below their size under vscode-dark-2026, exit 1.
```

Fix:

```diff
--- src/lib/themes/tokens.css
+++ src/lib/themes/tokens.css
@@ -122,13 +122,16 @@
     --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
     --font-num: var(--font-mono); /* counts, dates, ids - mono in every theme */
     --text-scale: 1;
-    /* Type scale. Every font-size resolves through these seven steps, VS Code's own sizes, so a
-       theme rescales the whole UI by overriding them here and no rule carries its own px value. A
-       text takes its step by its role: the main words of a row, a paragraph or a card `--fs-md`,
-       secondary words (a detail, a date, a caption, a control's words) `--fs-sm`, a label, a badge
-       or an uppercase heading `--fs-xs`, a page or document title `--fs-xl` and above. Every focus
-       ring is `1px solid var(--accent)` at an offset of -1 px, or 1 px for plain words with no box,
-       and a link has no underline at rest. */
+    /* Type scale. Every font-size resolves through these seven steps, VS Code's own sizes, or
+       through one of the size tokens below that a step cannot carry (the rail badge's and the
+       status bar's fixed text, a tree's and a form button's text, which a row scales where it is
+       drawn, and the slide scale of themes/slide.css), and no rule carries its own px value, so a
+       theme rescales the whole UI by overriding the steps and those tokens together. A text takes
+       its step by its role: the main words of a row, a paragraph or a card `--fs-md`, secondary
+       words (a detail, a date, a caption, a control's words) `--fs-sm`, a label, a badge or an
+       uppercase heading `--fs-xs`, a page or document title `--fs-xl` and above. Every focus ring
+       is `1px solid var(--accent)` at an offset of -1 px, or 1 px for plain words with no box, and
+       a link has no underline at rest. */
     --fs-xs: calc(11px * var(--text-scale, 1));
     --fs-sm: calc(12px * var(--text-scale, 1));
     --fs-md: calc(13px * var(--text-scale, 1));
--- src/lib/themes/themes.css
+++ src/lib/themes/themes.css
@@ -727,7 +727,9 @@
 
 /* --- Rice: the shape the thirteen terminal palettes share ---------------- */
 /* Terminal-ish rather than pixel-art: square corners, hairline borders, no shadows, monospace
-   chrome, the seven type scale steps one step down. The palette classes above carry the colour;
+   chrome, and every text one size down: the seven type scale steps one step down, each size token
+   outside them 1px down (themes/slide.css steps the slide scale), so no text keeps the size the
+   other themes draw it at in the wider monospace face. The palette classes above carry the colour;
    this carries the shape, and a component reads both through the tokens. */
 body.rice {
     --fs-xs: calc(10px * var(--text-scale, 1));
@@ -737,6 +739,12 @@
     --fs-xl: calc(14px * var(--text-scale, 1));
     --fs-2xl: calc(16px * var(--text-scale, 1));
     --fs-3xl: calc(20px * var(--text-scale, 1));
+    --rail-badge-text: 8px;
+    --status-text: 11px;
+    --tree-font: 12px;
+    --tree-heading-font: 10px;
+    --tree-badge-font: 10px;
+    --button-font: 11px;
     --radius: 3px;
     --radius-sm: 2px;
     --radius-pill: 3px;
--- src/lib/themes/slide.css
+++ src/lib/themes/slide.css
@@ -17,3 +17,14 @@
     color: var(--ink-txt, var(--ink));
     font-size: var(--slide-fs-body);
 }
+
+/* A rice theme draws text one size down in its monospace face (themes.css), and the slide scale
+   with it: each step is the design size times 12/13, the ratio of the rice body step to the
+   default one, rounded to a whole px. */
+body.rice .slide-frame {
+    --slide-fs-title: calc(52px * var(--text-scale, 1));
+    --slide-fs-h: calc(33px * var(--text-scale, 1));
+    --slide-fs-sub: calc(26px * var(--text-scale, 1));
+    --slide-fs-body: calc(22px * var(--text-scale, 1));
+    --slide-fs-small: calc(17px * var(--text-scale, 1));
+}
--- src/lib/views/apps/frame/ApprovalPanel.svelte
+++ src/lib/views/apps/frame/ApprovalPanel.svelte
@@ -105,14 +105,14 @@
 
     h2 {
         margin: 0 0 4px;
-        font-size: 14px;
+        font-size: var(--fs-lg);
         color: var(--muted-txt, var(--muted));
         font-weight: 600;
     }
 
     .title {
         margin: 0 0 6px;
-        font-size: 16px;
+        font-size: var(--fs-xl);
     }
 
     .description {
@@ -127,7 +127,7 @@
     .meta {
         margin: 0;
         color: var(--muted-txt, var(--muted));
-        font-size: 12px;
+        font-size: var(--fs-sm);
     }
 
     .question {
```

Two notes on where the fix sits:
- The slide rule goes in `slide.css`, beside the scale it steps. In `themes.css` the parser would skip a `body.rice .slide-frame` block anyway: `src/lib/themes/parse.ts:17` has `SELECTOR = /^(?::root|body\.[a-z0-9-]+)$/`.
- The size tokens added to `body.rice` are tokens that `:root` already declares.

For `premise`, the test's source as written, since `/spec` carries it into the brief after the scratch copy is removed:

```
No test source: see "No test reaches it" and "No test is written" below. The brief carries the red command above (its five source files) as the step's check, run by the orchestrator at the look on landing or by a scratch server on a port of its own; spec.md lets no builder run a page.
```

Runs after the fix:

```
$ ./red-all.sh $T                     # the original, unshrunk case: every state of views.txt, mocha against vscode-dark-2026
after fix, full case exit=0
== Explorer: 46 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:hub: 59 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:CAREER.yml: 143 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:Repositories: 72 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:Search: 72 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Focus: 123 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Projects: 168 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Incoming: 39 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Sessions: 62 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Academic Life: 65 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Pillars: 80 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== References: 71 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Present: 35 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Apps: 22 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== System: 238 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:Nudge: 36 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Help: 63 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
GREEN: every text under mocha is below its size under vscode-dark-2026
token --fs-xs: rice calc(10px * 1) | vscode calc(11px * 1)
token --fs-sm: rice calc(11px * 1) | vscode calc(12px * 1)
token --fs-md: rice calc(12px * 1) | vscode calc(13px * 1)
token --tree-font: rice 12px | vscode 13px
token --tree-heading-font: rice 10px | vscode 11px
token --tree-badge-font: rice 10px | vscode 11px
token --status-text: rice 11px | vscode 12px
token --button-font: rice 11px | vscode 12px
token --rail-badge-text: rice 8px | vscode 9px
token --slide-fs-title: rice calc(52px * 1) | vscode calc(56px * 1)
token --slide-fs-h: rice calc(33px * 1) | vscode calc(36px * 1)
token --slide-fs-sub: rice calc(26px * 1) | vscode calc(28px * 1)
token --slide-fs-body: rice calc(22px * 1) | vscode calc(24px * 1)
token --slide-fs-small: rice calc(17px * 1) | vscode calc(18px * 1)

$ RICE=latte VS=vscode-light-2026 ./red.sh $T Explorer text:hub Present        # a light pair
latte vs vscode-light-2026 exit=0
== Explorer: 46 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== text:hub: 59 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
== Present: 35 texts in both | rice font-size not below vscode: 0 | of those wider under rice: 0
GREEN: every text under latte is below its size under vscode-light-2026

$ npx vitest run tests/checks/look/contrast.test.ts --reporter=dot      # the one test that parses themes.css (G26)
 Test Files  1 passed (1)
      Tests  40 passed (40)

$ npx prettier --check src/lib/themes/tokens.css src/lib/themes/themes.css src/lib/themes/slide.css src/lib/views/apps/frame/ApprovalPanel.svelte
All matched files use Prettier code style!

$ LC_ALL=C grep -n '[^ -~]' <the four files>
(no output)
```

After the fix, many rice texts still draw a wider box than their VS Code counterparts:
- 681 of the 1394 texts paired across all states render wider under mocha than under vscode-dark-2026. The count is over the after-fix measurement files and counts any text whose rice width exceeds its vscode width by more than 0.5 px.
- The widest is a wrapped Help paragraph, at 4.72 times.
- Every one of these texts is one size down. The extra width comes from the monospace face at one size down.

See open decision 1 below.

No test reaches it:
- The defect is a rendered size, which needs a browser's layout and cascade.
- `agents/spec.md` has no browser suite ("there is no browser suite and no revert directive, and a step adds neither"), and a builder runs no page.
- The unit suite renders to a string. An assertion over the CSS source text proves nothing, so it is not written.
- A unit test could resolve the sheets through `src/lib/ui/theme.ts` and `src/lib/themes/parse.ts` and check every size token under `body.rice` against `:root`. But a test exists only as the test of an entry in `agents/guarded.md`, and no entry covers sizes (`grep -n -i "theme\|tokens.css\|font" agents/guarded.md` finds only G26, contrast). A new entry is Axel's to rule.

No test is written: the failure costs nothing in the sense the rules hold a test to (no lost work, no broken installation, no wrong configuration accepted). The check is the red command plus the look on landing.

### Open decisions for the session to raise

None of these is taken in the scratch tree beyond what the fix diff shows. The fix was never made in the main checkout.

1. **What "larger" means in the step's goal.**
   - (a) The size reading, taken here: every rice text is one size below its VS Code size. This is the expectation the step's own text states ("although `body.rice` sets each of the seven `--fs-*` steps one step below"). The fix meets it in every state measured.
   - (b) The rendered-width reading: no rice text draws a wider box. Measured after the fix, 681 of 1394 texts still do. Only dropping the monospace chrome (`themes.css:744-745`), or a step-down near 25%, would end that. Both would change the rice look in ways the user did not ask for.
   - Recommendation: (a). Neither option is the lazy one here: (a) fully fixes what the step names, and (b) would replace the theme's design.
2. **The rice slide scale.**
   - (a) The design sizes times 12/13, rounded (52, 33, 26, 22, 17 px). 12/13 is the ratio of the rice body step to the default one. This is what the fix does.
   - (b) Leave the slide frame out of the rice step-down. This is the lazy option: it leaves the slide rows red against the step's goal.
   - (c) Keep the slide frame in the UI sans face under rice, so the same px draws the same text.
   - The print route applies the saved theme, so a deck printed from `/present/print` under a rice theme prints at the sizes of (a), or in the face of (c).
   - Recommendation: (a), so one rule covers chrome and slides; (c) changes what a rice deck looks like.
3. **The rail badge under rice at 8px**, against 9px under every other theme.
   - It is the smallest text in the app. The red flags it because its 9px is not below 9px, but its box under rice was already no wider: 5.42x10 against 5.52x11 for "7".
   - (a) 8px, as in the fix.
   - (b) 9px, accepting an equal size drawn in narrower monospace digits.
   - Recommendation: (a), to follow the step's rule; (b) is a reasonable exception only if 8px reads badly at the look.

## Cleanup

```
$ grep -rn "DIAG-" $T/tree/tools/oculus/src $T/tree/tools/oculus/tests $T/tree/tools/oculus/config
grep exit=1        (no output)
$ kill 48582 48206; curl -s -o /dev/null -w '%{http_code}\n' --max-time 3 http://127.0.0.1:8811/
000
$ tmux -S $T/tmux/tmux-502/default kill-server
no server running on .../tmux/tmux-502/default
$ git worktree remove --force "$T/tree"          (from /Users/axelfaes/workspace/research-hub)
removed
$ git worktree list | grep -c diagnose.xtI1OW
0
$ rm -rf "$T"; ls -d "$T"
ls: .../diagnose.xtI1OW: No such file or directory
```

Everything under `$T` is gone: the scratch copy, the hub copy with its test app, the scratch HOME and tmux folder, the headless Chrome profiles, and the probe scripts and outputs. No credential or `.env` file was copied.

Not touched: the main checkout, its `config/local.yml`, `~/.oculus`, ports 8787 and 8790, and the user's Chrome.

The brief carries the red command above as its check: run against the step's built tree, it must be green with exit 0 and the token readout stepped.