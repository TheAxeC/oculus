# O115 report

Everything in the brief is done, except that page cases 10 to 18 are not run: a builder runs no page, so each is the orchestrator's look at landing (section "Before and after").

Two premises of the brief do not reproduce:

- "No file under `docs/diagrams/` is expected to change." `npm run diagrams` changes four: `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg`. `git diff -U0 docs/diagrams/layers.dot` shows the import counts on the edges moving: "views to state" 1527 to 1530, "views to ui" 1097 to 1099. The new imports of `TranscriptBody.svelte` and `turn-rows.ts` are the cause, and the regenerated files are in the diff so the committed diagrams match the source.
- Item 5 says `.frame` padding rises so the words stand clear of the pane's edge "as the pane's other bodies do". They already stood at that inset: `Terminal.svelte:463` `.terminal` is `padding: 4px 6px 6px`, and with `.frame`'s `6px 6px 4px` that made 10px and 12px, equal to `Pane.svelte:238` `padding: 10px 12px`. Decision 2 says what was built.

## First run of the reading cases, on the unchanged tree

No case the brief's rules get wrong appeared.

Cases 1 and 8 ran through `readTurns` with the case-run program at the end of this report, on the unchanged tree:

```
case 1 {"query":"x"} => ""
case 1 {"url":"http://a"} => ""
case 1 {"skill":"spec","args":"y"} => ""
case 1 {"file_path":"a","query":"b"} => "a"
case 1 {} => ""
case 1 {"summary":"s","to":"t"} => ""
case 1 {"reason":"r"} => ""
case 1 {"task_id":"t1"} => ""
case 1 {"action":"publish","text":"z"} => ""
case 8 {"type":"FileChange","status":"completed","changes":{"a.ts":{}}} => {"id":"","name":"FileChange","summary":"a.ts","ok":null}
case 8 {"type":"McpToolCall","status":"failed","server":"s","tool":"t"} => {"id":"","name":"McpToolCall","summary":"","ok":null}
case 8 {"type":"Extension","query":"q"} => {"id":"","name":"Extension","summary":"","ok":null}
case 8 {"type":"CommandExecution","command":"ls","exit_code":2} => {"id":"","name":"CommandExecution","summary":"ls","ok":false}
case 8 {"type":"CommandExecution","command":"ls","exit_code":0} => {"id":"","name":"CommandExecution","summary":"ls","ok":true}
case 8 {"type":"WebSearch","name":"n","query":"q2"} => {"id":"","name":"WebSearch","summary":"n","ok":null}
```

Cases 2 to 7 and 9 have no code on the unchanged tree (`turn-rows.ts` did not exist), so their first run was a read of the rule against the code it stands on:

| Case | Read against | Result |
| --- | --- | --- |
| 2, 3 | item 3's rules | each input gives the stated output by the rule |
| 4 | `transcript.svelte.ts:154-161`, `merged` | a read from a non-zero offset only appends and patches, so a first index holds |
| 5 | same lines | a patched result makes a new turn in a new list, so a later result reaches the run |
| 6 | item 4's rule | each name gives the stated output |
| 7 | item 2's rule, `format.ts:95` | `clock` drops the day, so the comparison on the stamp is what separates two days |
| 9 | `Terminal.svelte:375-381` | one `TranscriptBody` across a change of target, so its states need clearing |

## Results of the reading cases on the changed tree

Run by the same programs after the last change.

| Case | Output | Holds |
| --- | --- | --- |
| 1 | `x`, `http://a`, `spec`, `a`, the empty text; and `s`, `r`, `t1`, `publish` for `summary`, `reason`, `task_id`, `action` | yes |
| 2 | `user@0, run@1x2, assistant@3, run@4x1`; `[]`; `run@0x3`; `run@0x1, assistant@1` | yes |
| 3 | `3 tools: WebSearch 2, Write`; `17 tools: WebSearch 15, Write, Bash`; an empty name: `3 tools: Tool 2, b` | yes |
| 4 | first index 1 and 1, calls 2 and 3 | yes |
| 5 | not chosen and failed: open; not chosen, none failed: closed; closed by a press and failed: closed, `runHolds(fail, false)` true | yes |
| 6 | `computer`, `Bash`, `mcp__x`, `mcp__a__`; `mcp__a__b__c` gives `c`; an empty name gives `Tool` | yes |
| 7 | heads 1, 2, 2, 2; a person's turn then an answer in the same minute: 1 | yes |
| 8 | `FileChange`: `ok` true. `McpToolCall`: `ok` false, summary `s.t`. `Extension`: summary `q`, `ok` true. `exit_code` 2: false; 0: true. `name` with `query`: `q2` | yes |
| 9 | by reading: the `$effect.pre` in `TranscriptBody.svelte` clears `chosen` when `JSON.stringify([session, agent])` changes. It needs a component and a flush, so it is not run; the look can confirm it | by reading |

Also printed: `doc held per turn object true between components false`; `relativeLink` true for `foo.md`, `../x`, `/abs`, false for `#a`, `https://a`, `//a`, `mailto:a@b`.

## DONE / NOT DONE

Full-list runs: 2. The first was red on eslint over `TranscriptBody.svelte` and on `tests/checks/source/html-sites.test.ts`; both were fixed, each rerun alone, and the second run passed. No whole-suite command was run. Every line below is from the second run, after the last change to any file except this report.

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. One document rule set | DONE | `npm run test:quick`: `ok svelte-check (16.1 s): ... 579 FILES 0 ERRORS 0 WARNINGS`. Case-run line `doc held per turn object true`. Tables, Copy, the menu and the scroll are the look's, cases 10, 11 |
| 2. Who said what | DONE | `groupTurns` heads: case 7 above. The drawing is the look's, case 14 |
| 3. A run of tool calls is one line | DONE | cases 2 to 5 above. The press and the foot are the look's, cases 12, 13, 16 |
| 4. Every call says what it was about | DONE | cases 1, 6, 8 above. The export reads `turn.tool.name` and `turn.tool.summary` (`transcript-routes.ts:155-156`), so it gains the summaries with no change and keeps the full name |
| 5. Readable | DONE | read: `line-height: 1.5` (`TranscriptBody.svelte:343`), `max-width: 80ch` (lines 406, 436), `padding: 6px 10px 4px` (line 323), `padding-right: 8px` (line 334). The look's, case 14 |
| 6. The font buttons work here | DONE | `gridFontZoom` in `terminal-list.ts`, `style:zoom` at `TranscriptBody.svelte:220`. The look's, case 15 |
| 7. Words and docs | DONE | `grep -rn "turn_ok" src tests config docs` prints nothing. `vitest checks` passed, which holds `tests/checks/source/keys.test.ts` |
| Reading cases | DONE | sections above |
| Page cases 10 to 18 | NOT DONE, the look's | a builder runs no page |
| `npx vitest run tests/server/sessions/transcripts.test.ts` | DONE | `Test Files  1 passed (1)`, `Tests  15 passed (15)` |
| `npm run test:quick` | DONE | `test:quick: 65.6 s; every command passed` |

Lines of that run:

```
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (15.9 s)
ok      svelte-check (16.1 s): 1793614511050 COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (42.7 s): Duration  24.81s
ok      vitest slow (45.5 s): Duration  27.59s
ok      vitest checks (62.8 s): Duration  44.77s
test:quick: 65.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files
```

## Files changed

The brief names no base copy, so the table is from `git status --short`, `git diff --stat` and `wc -l`.

| File | Lines now | In the write list |
| --- | --- | --- |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 513 | yes |
| `src/lib/views/sessions/terminal/transcript/turn-rows.ts` (new) | 136 | yes |
| `src/lib/views/sessions/terminal/terminal-list.ts` | 746 | yes |
| `src/lib/views/sessions/terminal/bar/TerminalFontTools.svelte` | 40 | yes |
| `src/lib/views/shared/prose/Markdown.svelte` | 411 | yes |
| `src/lib/views/shared/prose/RenderedMarkdown.svelte` | 195 | yes |
| `src/lib/ui/controls/RowButton.svelte` | 64 | yes |
| `src/lib/state/system/docs.svelte.ts` | 416 | yes |
| `src/lib/server/sessions/stores/turns.ts` | 336 | yes |
| `config/text/views/sessions/transcript.yml` | 3 keys added, 1 removed | yes |
| `config/options/appearance.yml`, `config/defaults/appearance.yml` | 1 line changed in each | yes |
| `docs/HELP.md` | 3 lines added | yes |
| `tests/checks/source/html-sites.test.ts` | 1 line changed | NO: the test counts `{@html}` sites and the step removes one, see below |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg` | counts on edges | NO: output of `npm run diagrams`, see the first section |

`TranscriptBody.svelte` is at 513 of 520. A later step that adds to it needs the split the size rule asks for.

## Edits to an existing assertion, allow list or predicate

| File | Before | After |
| --- | --- | --- |
| `tests/checks/source/html-sites.test.ts:242` | `expect(counted.length).toBeGreaterThanOrEqual(33);` | `expect(counted.length).toBeGreaterThanOrEqual(32);` |

This is a lowered floor and is reported as such, for the orchestrator to judge. The floor is what keeps the count from being vacuous; item 1 removes the `{@html}` site of `TranscriptBody.svelte`, the count falls to 32, and the first run printed `expected 32 to be greater than or equal to 33`. The rule the test exists for, `unfilteredSites(LIB)` equal to `[]`, is not touched. The test is held under G5 (`agents/guarded.md:428`) and ran: `Tests  19 passed (19)`.

The step adds no test. The one changed line passes on the unchanged tree as well, since 33 is at least 32, so it has no failing line there.

## Judgment calls the brief did not cover, each reversible

1. `docOf` is a closure. The brief says `docOf(turn)` in `turn-rows.ts` holds a `WeakMap`. A module-level map is module-level mutable state, which the principle "No globals" forbids, so `turn-rows.ts` exports `turnDocs()` and the component holds `const docOf = turnDocs()`. Each component holds its own map.
2. Padding. `.frame` rises to `6px 10px 4px`, so the words stand 16px from the pane's edge against a pane body's 12px, since the brief asks for a rise from a value already at 12px. The scrollbar is `.chat`'s and sits inside any `.frame` padding, so `.chat` also takes `padding-right: 8px`, which is what keeps words off it.
3. Titles. The whole name is the `title` of the name's own span, drawn only when `displayName` differs from it. The summary's `title` is on the summary span, which an empty summary does not draw. So an `mcp__a__b` with an empty summary keeps one title, the whole name; item 3 read alone says no title, item 4 read alone says the title holds the whole name, and I kept item 4's.
4. Codex summary order: command, changes, `path`, `query`, `server.tool`, `name`, `description`. `query` and `server.tool` stand before `name`, so an item carrying both draws what it was about (`{"name":"n","query":"q2"}` gives `q2`). What real items carry beside `query` was not read.
5. An answer in the same minute as the person's turn above it draws no head, as item 2 words it: the person's head is the last head drawn. Case 7's run prints 1.
6. Hover on a closed run turns its words to full ink and paints nothing, since item 2 forbids a surface behind a turn over a wallpaper and one rule reads simpler than two.
7. The zoom is `$state`, taken in an effect and again one frame later, in place of a `$derived`. `drawTheme` (`appearance.svelte.ts`) runs from an effect and writes the body's class after this component's effect, so a read in the same flush sees the old theme's `--fs-md`. `gridFontZoom`'s second read is a frame later, which is how `grid-look.ts` reflows a grid.
8. Headings: `h5` and `h6` take `--fs-lg` with `h1` to `h4`, since `Markdown.svelte` sets no size for them.
9. The 80ch cap is on `h1` to `h6`, `p`, `ul`, `ol`, `blockquote`. A `pre` keeps the pane's width like a table, since the brief caps prose.
10. An open run's own line draws no `error` or `running`, since the rows under it do.
11. The disclosure mark is `Glyph name="disclosure"` turned a quarter while closed. A call's row holds an empty mark column, so clocks line up under a closed run's.
12. `relativeLink` reuses `OUTWARD_SCHEME` (`ui/html.ts:147`). `/abs` counts as relative, since it would leave the page for an address of the app.
13. New keys: `sessions.turn_run`, `sessions.turn_run_count`, `sessions.turn_run_separator`. `{@render}` carries the same `eslint-disable-next-line` as `Terminal.svelte`, which is why two comment lines pass 100 columns.

## Limitations and sharp edges

- Size at the default: `terminal.font_px` is 12.5 and `--fs-md` 13px, so the zoom is 12.5/13 and prose draws at 12.5px and tool rows at about 11.5px (computed, not measured). A theme with another type scale differs: under `body.rice`, 12.5/12.
- The text scale setting no longer changes the transcript's size while `font_px` is set, which it is by default: `gridFontSize` answers the configured size whatever the scale, and the zoom divides the scale away. It follows from item 6 and matches a grid.
- A theme whose type scale arrives from an app's file later than one frame leaves the zoom on the old scale until the next change of theme, font or text scale. Not measured.
- `gridFontZoom` reads `--fs-md` from the body; its fallback of 1 is not exercised by a run.
- Two tools with one drawn name count apart, as "counted by whole name" says: `mcp__a__x` and `mcp__b__x` draw `x, x`.
- A turn with `role: 'tool'` and `tool: null`, which the server never writes but `turnShape` allows, draws `Tool` with no outcome.
- `accent-txt` on `--chip` for the person's label: `contrast.test.ts` passed and lists `--chip` among its surfaces (line 49); whether it measures this pair was not read.
- `status` is compared with `failed` exactly, on the brief's count that it reads completed or failed. Real rollouts were not read.
- Each answer now mounts a `ContextMenu` and a Copy control per code block. Cost over 200 turns is case 17's measurement.
- Agent changes in one session: the foot effect's `shown` compares the session only, as it did, so opening another agent of the same session while away from the foot does not go to the foot.

## Before and after, for the look

Terminal view, a tab on Transcript, on a session with a person's turns, answers and runs of tool calls.

| State | Before | Should be seen |
| --- | --- | --- |
| Table in an answer (10) | no borders, words broken ("Ra / nk") | borders, padding, whole words; a wide table scrolls alone |
| Code block (11) | painted, no Copy | painted, Copy works |
| 17 tool calls (12) | 17 rows, each "ok" | one row `17 tools: ...`; pressed, 17 rows and no "ok"; a failed call seen with no press |
| Long summary with `error` (13) | tag cut to "o" | the word whole, the summary cut |
| Dark, light, wallpaper; 548px and wide (14) | three kinds look alike | accent bar and line on a person's turn, chip behind it off a wallpaper only, answers at full ink, tools muted; a wide pane holds prose to 80ch; `#` no larger than `--fs-lg` |
| A and reset (15) | no change in Transcript | turns and grid grow; reset returns them |
| Live append (16) | | follows at the foot, holds away from it; a result that opens a failed run keeps the foot; a press moves nothing |
| 200 turns (17) | | time measured; a marker on an older answer's node survives an append |
| Subagent tab, Codex session (18) | Codex calls with "running" | no person's turn draws the same; Codex calls show summaries and no tag when ended |
| Right-click on an answer | browser menu | prose menu; Copy over a selection that starts in that answer |
| Relative link in an answer | leaves the page | the page stays |

## Checks

Comment and title words, over the added lines of `git diff -U0` and `turn-rows.ts`, grep `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`:

```
+ * nearest what a call acts on before the ones that only describe it.             order of fields
+/** The `--fs-md` step before the reader's text scale, read off the body ...       order of a calculation
+    // change of the session or the agent empties the choices before the new ...   order at run time
+        // was at the foot before. A result that opens a run grows the column ...  order at run time
```

Each hit is an order at run time and compares with no earlier state of the code.

`LC_ALL=C grep -n '[^ -~]'` over the touched files prints only `config/defaults/appearance.yml`'s existing "Frappe" and "Rose Pine" names with their accents, lines this step does not touch; the ASCII gate passed.

Reuse grep before writing: `grep -rn "groupTurns\|runWords\|docOfHtml\|gridFontZoom\|turnDocs\|relativeLink\|runOpen\|runHolds\|toolWord" src tests` finds no earlier helper of these names for this concern; `RecoverProgress.svelte:38` holds an unrelated local `runWords`. `new WeakMap` and `SvelteMap` follow existing use.

Name grep after the change: `grep -rn "turn_ok\|summaryShape\|codexOk" src tests config docs README.md` names only `turns.ts`.

`sh utils/unused-exports.sh | grep -c "turn-rows\|gridFontZoom\|docOfHtml"` prints 0. The brief names no base list, so nothing else was compared.

Comments and documents re-read:

| Text | State |
| --- | --- |
| `TranscriptBody.svelte` head and the foot effect's comment | rewritten |
| `turn-rows.ts` head | new |
| `turns.ts` head, the Markdown paragraph | rewritten |
| `turns.ts` `summaryShape`, `codexSummary`, `codexOk` | rewritten |
| `docs.svelte.ts` head | rewritten, names `docOfHtml` |
| `Markdown.svelte` head | rewritten, names the transcript |
| `RenderedMarkdown.svelte` head | still true |
| `RowButton.svelte` head | rewritten |
| `TerminalFontTools.svelte` head | rewritten |
| `terminal-list.ts` head, `gridFontSize` | head rewritten, `gridFontSize` still true |
| `Terminal.svelte:25-28` | still true |
| `config/options/appearance.yml`, `config/defaults/appearance.yml` | rewritten |
| `config/text/views/sessions/terminal.yml` font button labels | still true |
| `docs/HELP.md` | three bullets added; lines 454-456 still true |
| `docs/apps.md` | does not describe this |

## Case-run programs

Files in the scratchpad, gone before this report. `server-cases.ts` runs with `node server-cases.ts <worktree>`; `row-cases.ts` with `O115_ROOT=<worktree> node --import ./lib-hook.mjs row-cases.ts`.

`lib-hook.mjs`:

```js
import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.env.O115_ROOT;
const rune = (value) => value;
rune.raw = rune;
rune.by = (make) => make();
Object.assign(globalThis, { $state: rune, $derived: rune, $effect: () => undefined });
const isFile = (one) => existsSync(one) && statSync(one).isFile();
registerHooks({
    resolve(specifier, context, next) {
        if (specifier.startsWith('$lib/')) {
            const base = `${root}/src/lib/${specifier.slice(5)}`;
            const file = [base, `${base}.ts`].find(isFile);
            return { url: pathToFileURL(file ?? base).href, shortCircuit: true };
        }
        return next(specifier, context);
    }
});
```

`server-cases.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2];
const { readTurns } = await import(join(root, 'src/lib/server/sessions/stores/turns.ts'));
const dir = import.meta.dirname;
const inputs = [
    { query: 'x' }, { url: 'http://a' }, { skill: 'spec', args: 'y' }, { file_path: 'a', query: 'b' }, {},
    { summary: 's', to: 't' }, { reason: 'r' }, { task_id: 't1' }, { action: 'publish', text: 'z' }
];
const claude = join(dir, 'claude.jsonl');
writeFileSync(claude, inputs.map((input, at) => JSON.stringify({
    type: 'assistant', timestamp: '2026-11-02T10:00:00.000Z',
    message: { content: [{ type: 'tool_use', id: `c${at}`, name: 'T', input }] }
})).join('\n') + '\n');
for (const [at, turn] of readTurns(claude, 'claude').turns.entries()) {
    console.log('case 1', JSON.stringify(inputs[at]), '=>', JSON.stringify(turn.tool.summary));
}
const items = [
    { type: 'FileChange', status: 'completed', changes: { 'a.ts': {} } },
    { type: 'McpToolCall', status: 'failed', server: 's', tool: 't' },
    { type: 'Extension', query: 'q' },
    { type: 'CommandExecution', command: 'ls', exit_code: 2 },
    { type: 'CommandExecution', command: 'ls', exit_code: 0 },
    { type: 'WebSearch', name: 'n', query: 'q2' }
];
const codex = join(dir, 'codex.jsonl');
writeFileSync(codex, items.map((item) => JSON.stringify({
    type: 'event_msg', timestamp: '2026-11-02T10:00:00.000Z',
    payload: { type: 'item_completed', item }
})).join('\n') + '\n');
for (const [at, turn] of readTurns(codex, 'codex').turns.entries()) {
    console.log('case 8', JSON.stringify(items[at]), '=>', JSON.stringify(turn.tool));
}
```

`row-cases.ts`:

```ts
import { join } from 'node:path';
const root = process.env.O115_ROOT as string;
const rows = await import(join(root, 'src/lib/views/sessions/terminal/transcript/turn-rows.ts'));
const { groupTurns, runWords, runOpen, runHolds, displayName, toolWord, relativeLink, turnDocs } = rows;
const words: Record<string, string> = {
    'sessions.turn_run': '{0} tools: {1}', 'sessions.turn_run_count': '{0} {1}',
    'sessions.turn_run_separator': ', ', 'sessions.turn_tool': 'Tool'
};
const t = (key: string, ...args: (string | number)[]) =>
    words[key].replace(/\{(\d+)\}/g, (_, at) => String(args[Number(at)]));
const said = (role: string, at: string | null = null) =>
    ({ at, role, text: 'x', html: '<p>x</p>', cut: false, tool: null });
const tool = (name = 'Bash', ok: boolean | null = true, at: string | null = null) =>
    ({ at, role: 'tool', text: '', html: '', cut: false, tool: { id: '', name, summary: '', ok } });
const shape = (list: any[]) => groupTurns(list).map((row: any) =>
    row.kind === 'run' ? `run@${row.first}x${row.calls.length}` : `${row.turn.role}@${row.first}`);
console.log('case 2 mixed ', shape([said('user'), tool(), tool(), said('assistant'), tool()]));
console.log('case 2 empty ', shape([]));
console.log('case 2 tools ', shape([tool(), tool(), tool()]));
console.log('case 2 opens ', shape([tool(), said('assistant')]));
console.log('case 3 words ', runWords([tool('WebSearch'), tool('WebSearch'), tool('Write')], t));
console.log('case 3 ask   ', runWords([...Array(15)].map(() => tool('WebSearch')).concat(tool('Write'), tool('Bash')), t));
console.log('case 3 empty ', runWords([tool(''), tool(''), tool('mcp__a__b')], t));
const base = [said('user'), tool(), tool()];
const before = groupTurns(base).at(-1);
const after = groupTurns([...base, tool()]).at(-1);
console.log('case 4 first ', before.first, after.first, 'calls', before.calls.length, after.calls.length);
const fail = [tool('A', true), tool('B', false)];
console.log('case 5 not chosen, failed      ', runOpen(undefined, fail));
console.log('case 5 not chosen, none failed ', runOpen(undefined, [tool('A', true), tool('B', null)]));
console.log('case 5 closed by press, failed ', runOpen('closed', fail), 'says failed', runHolds(fail, false));
console.log('case 5 opened by press, clean  ', runOpen('opened', [tool('A', true)]));
for (const name of ['mcp__claude-in-chrome__computer', 'Bash', 'mcp__x', 'mcp__a__', 'mcp__a__b__c', '']) {
    console.log('case 6', JSON.stringify(name), '=>', JSON.stringify(displayName(name)), JSON.stringify(toolWord(name, t)));
}
const heads = (list: any[]) => groupTurns(list).filter((row: any) => row.kind === 'said' && row.head).length;
const a = (stamp: string | null) => said('assistant', stamp);
console.log('case 7 10:00, tool, 10:00      ', heads([a('2026-11-02T10:00:01Z'), tool(), a('2026-11-02T10:00:59Z')]));
console.log('case 7 10:00, 10:01            ', heads([a('2026-11-02T10:00:01Z'), a('2026-11-02T10:01:00Z')]));
console.log('case 7 same minute, two days   ', heads([a('2026-11-02T10:00:01Z'), a('2026-11-03T10:00:01Z')]));
console.log('case 7 no stamps               ', heads([a(null), a(null)]));
console.log('case 7 person then same minute ', heads([said('user', '2026-11-02T10:00:01Z'), a('2026-11-02T10:00:30Z')]));
const docOf = turnDocs();
const answer = a('2026-11-02T10:00:01Z');
console.log('doc held per turn object', docOf(answer) === docOf(answer), 'between components', turnDocs()(answer) === docOf(answer));
for (const href of ['foo.md', '../x', '/abs', '#a', 'https://a', '//a', 'mailto:a@b']) {
    console.log('link', href, relativeLink(href));
}
```
