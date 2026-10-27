# O94 report: Mark posted dates the post and sets publish, and the LinkedIn task keeps only its drafting steps

Everything in the brief is done, as ruled in `agents/briefs/O94-cases.md` (case 7 dropped, the read-back parses with `uniqueKeys: false`).

## Open items of the state file, verbatim

The section `## Open items` of `.scratch/migration/orchestrator-state.md` (lines 191-195) holds no entry; its text is:

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run

Each row was run on the unchanged source before any change to `src` or `config`. Command: `npx vitest run tests/server/edit/feeds.test.ts -t "marks an idea posted|promotes an idea" --reporter=verbose`, which printed `Tests 10 failed | 1 passed | 9 skipped (20)`. The refusal rows were rerun with the folder check first: `npx vitest run tests/server/edit/feeds.test.ts -t "no front matter|never closes|target that exists" --reporter=verbose`.

1. The fixture's idea. Red: `- date: 2026-10-27`, `- publish: True`, `+ date: 2026-09-12`. The record and the sidecar: 'promotes an idea past 01-A and moves its same-basename sidecar' passed (`2924ms`).
2. The stub with `publish: False`. Red: `- publish: True`, `+ publish: False`, `- date: 2026-10-27`, `+ date: 2026-08-04`.
3. A quoted date. Red: `- date: 2026-10-27`, `+ date: "2025-02-12"`.
4. A date line in the body. Red on the front matter part: `- date: 2026-10-27`, `+ date: 2026-09-12`; the body line `date: 2020-01-01` stayed.
5. No front matter. Red, the idea was renamed: `+ "02-easy-problems.jpeg"`, `+ "02-easy-problems.md"`, `- "xx-easy-problems.jpeg"`, `- "xx-easy-problems.md"`.
6. Already `publish: True` and the day. Green on the unchanged source, text byte-identical (`368ms`).
7. A target that exists. The brief's rules got it wrong. Rule: the next number is the highest `NN-` of the folder plus one (`feeds.ts`, the `highest` reduce). Result: with `02-easy-problems.md` planted, the write renamed the idea to `03-easy-problems.md` and `03-easy-problems.jpeg` (`"after": ["03-easy-problems.jpeg", "03-easy-problems.md"]`, `"refused": []`). Ruling A (`agents/briefs/O94-cases.md`): case 7 is dropped; the `post_exists` check and its catalog line stay as the guard against a file made between the listing of the folder and the rename. No test row reaches it, since no planted file can carry the next number without raising the highest number itself.
8. Neither key. Red: received `'---\ntitle: "T"\n---\n'`.
9. A front matter that never closes. Red, renamed to `02-` as in case 5.
10. `xx-leadingAIinHealth.md`. Red: `"reason": "A LinkedIn post must name an xx-*.md idea."`.
11. `published: false` beside the date. Red: `- date: 2026-10-27`, `- publish: True`, `+ date: 2025-02-12`.
12. The route rows. `npx vitest run tests/routes/hubs/hub-writes.test.ts -t "LinkedIn idea" --reporter=verbose` on the unchanged source: `Tests 5 passed | 42 skipped (47)`, among them "'a LinkedIn idea posted' changes the second hub only, is logged by path and is undone".
13. The look on landing; the builder runs no page. By reading, on the unchanged tree `config/text/views/feeds/linkedin.yml:18` read `markpost_tip: mark posted - rename xx- to the next number`.

Ruling B (`agents/briefs/O94-cases.md`): the rule "each such line when there are two" and the read-back with `yaml` clashed, since `yaml` 2.9.1 throws `YAMLParseError: Map keys must be unique` on a key written twice. The read-back parses with `parse(front, { uniqueKeys: false })`, and the row 'a date line written twice' was added. Its first run on the unchanged source (`npx vitest run tests/server/edit/feeds.test.ts -t "date line written twice" --reporter=verbose`): red, `- date: 2026-10-27`, `+ date: 2025-02-12`, `- publish: True`, `+ publish: False`, `- date: 2026-10-27`, `+ date: 2025-02-12`.

Two rows were added beyond the brief's cases (see the judgment calls). Their first run on the unchanged source was taken with a case-run program that imported the base copy's `markLinkedinPosted` and wrote only under the system temporary directory; it was removed from the scratchpad before this report. Its source:

```ts
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2];
const ideaText = process.argv[3].replaceAll('\\n', '\n');
const { markLinkedinPosted } = await import(`${base}/src/lib/server/edit/feeds/feeds.ts`);
const { portfolioConfigFrom } = await import(`${base}/src/lib/data/index.ts`);
const { engineDir, loadConfig } = await import(`${base}/src/lib/data/sources/config.ts`);

const hub = mkdtempSync(join(tmpdir(), 'o94-case-'));
const folder = join(hub, 'linkedin');
mkdirSync(folder);
writeFileSync(join(folder, '01-A-reflection.md'), '---\ndate: 2026-08-01\n---\n');
writeFileSync(join(folder, 'xx-easy-problems.md'), ideaText);
const loaded = loadConfig(engineDir()).config;
const config = { ...portfolioConfigFrom(loaded), feeds: { linkedin: 'linkedin' } };
console.log(JSON.stringify(markLinkedinPosted(hub, config, 'xx-easy-problems.md')));
console.log(JSON.stringify(readdirSync(folder).sort()));
for (const name of readdirSync(folder).filter((one) => one.startsWith('02-'))) {
    console.log(name, JSON.stringify(readFileSync(join(folder, name), 'utf8')));
}
```

Run as `node o94-case-run.ts ~/workspace/oculus/.agents/worktrees/O94-base '<text>'`:

- 'a front matter that does not parse' (`---\ntitle: "T\ndate: 2025-02-12\n---\n\nBody.\n`): `{"found":true,"changed":["file"],"refused":[],...}`, folder `["01-A-reflection.md","02-easy-problems.md"]`, the post's text unchanged. The row expects the refusal `post_not_dated` and the folder as it was, so it is red there.
- 'a quoted date key' (`---\ntitle: "T"\n"publish": False\n"date": 2025-02-12\n---\n\nBody.\n`): renamed, the post's text `"---\ntitle: \"T\"\n\"publish\": False\n\"date\": 2025-02-12\n---\n\nBody.\n"`. The row expects `publish: True` and `date: 2026-10-27`, so it is red there.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. Mark posted dates the post, sets `publish: True`, renames | DONE | `npx vitest run tests/server/edit/feeds.test.ts tests/routes/hubs/hub-writes.test.ts --reporter=dot`: `Test Files  2 passed (2)`, `Tests  69 passed (69)` |
| 2. The words | DONE | `git diff config` shows the four apps lines, `markpost_tip` and `ontrack` as the brief gives them; `test:quick` green |
| 3. The documents | DONE | `git diff docs` shows `docs/HELP.md:332` and the template; read below |
| 4. The hub task file's text | DONE | "Doc text" below; nothing written in the hub |
| Verify 1: `npm run diagrams && npm run test:quick` | DONE | last line of the final run: `test:quick: 122.0 s; every command passed` |
| Verify 2: ASCII gate over the changed files | DONE | printed nothing, `ascii exit 0` |
| Verify 3: the two test files | DONE | `Tests  69 passed (69)` |
| Verify 4: `wc -l src/lib/server/edit/feeds/feeds.ts` | DONE | `742 src/lib/server/edit/feeds/feeds.ts` |
| Verify 5: `grep -n " - " config/text/views/feeds/linkedin.yml` | DONE | printed nothing, `hyphen grep exit 1` |
| Verify 6: prose of each new sentence | DONE | read below |
| Unused exports | DONE | `diff O94-base/unused-exports.txt <after>`: no output, exit 0 |

The verify list ran three times. The first run was red in `tests/checks/source/keys.test.ts`: 'uses literals except at the documented computed prefixes' (`lib/server/edit/feeds/feeds.ts: words(config.text, key) }]);`) and 'has a reader for every catalog key' (`server.feeds.post_exists`, `server.feeds.post_no_front_matter`, `server.feeds.post_not_dated`). It was also red in `tests/checks/source/history.test.ts` ('names no package id, date or session in any comment', on a date in a test comment). Both are now fixed: each refusal passes a literal key to `words`, and the comment names the constant `PRESSED`. The second run was red in `tests/checks/source/comment-width.test.ts` (`tests/server/edit/feeds.test.ts:110`). It passed alone after the fix (`Tests  2 passed (2)`). The third run printed:

```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (13.3 s)
ok      svelte-check (13.5 s): 1793058087928 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (65.6 s): Duration  55.22s (transform 28.87s, setup 0ms, import 84.61s, tests 55.80s, environment 2ms)
ok      vitest (78.4 s): Duration  67.91s (transform 104.51s, setup 0ms, import 207.51s, tests 40.33s, environment 16.58s)
ok      vitest checks (119.8 s): Duration  109.03s (transform 65.18s, setup 0ms, import 190.57s, tests 187.25s, environment 4ms)
test:quick: 122.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

`npm run diagrams` rewrote no diagram (`git status --short` lists no file under `docs/diagrams`). No whole-suite command was run.

One run of the brief's two-file command, taken at a load average of 18.91, was red in `tests/routes/hubs/hub-writes.test.ts`. 32 rows failed, each after 5 to 24 seconds, among them rows of leads, Lit Watch and decks that do not reach the changed code. The same file alone then passed (`Tests  47 passed (47)`), and so did the two-file command once more (`Tests  69 passed (69)`).

The rows of the table, from the verbose run of the two files:

```
PASS ... marks an idea posted with the day pressed and publish: True, or refuses and moves nothing: 'the fixture\'s idea, its date replace<ellipsis>'
PASS ... 'the stub\'s front matter with publish<ellipsis>'
PASS ... 'a quoted date'
PASS ... 'a quoted date key'
PASS ... 'a date line in the body'
PASS ... 'no front matter'
PASS ... 'a front matter that holds publish: Tr<ellipsis>'
PASS ... 'a date line written twice'
PASS ... 'a front matter with neither key'
PASS ... 'a front matter that never closes'
PASS ... 'a front matter that does not parse'
PASS ... 'an idea name with capitals'
PASS ... 'a published: key beside the date'
PASS ... promotes an idea past 01-A and moves its same-basename sidecar
PASS ... 'a LinkedIn idea posted' changes the second hub only, is logged by path and is undone
PASS ... sends a LinkedIn idea of the primary hub, which lab also holds, to the primary hub
```

(The "..." above stands for the file and describe path `tests/server/edit/feeds.test.ts > feed writes >`; the printed lines carry it whole.)

## The new tests

- `tests/server/edit/feeds.test.ts`, the table 'marks an idea posted with the day pressed and publish: True, or refuses and moves nothing: $name', 13 rows. It belongs to G8 and is a proof. Each row fixes the day with `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime(PRESSED)`, then checks the folder's sorted names. A post row checks the whole text of the numbered file with `toBe`. A refusal row checks the outcome with the catalog sentence and the idea's text unchanged.
- No existing assertion was edited. `diff O94-base/tests/server/edit/feeds.test.ts tests/server/edit/feeds.test.ts | grep "^<"` printed only the two import lines, which gained `readdirSync` and `vi`.

## Files

From `diff -rq` against the base copy over `src tests config utils`, and from `git diff --numstat` (added, removed):

| File | Lines now | +/- |
| --- | --- | --- |
| `src/lib/server/edit/feeds/feeds.ts` | 742 | 80/13 |
| `tests/server/edit/feeds.test.ts` | 642 | 192/2 |
| `src/lib/state/client/writes.svelte.ts` | 877 | 2/1 |
| `src/lib/state/shared/stores/shapes.ts` | 529 | 4/1 |
| `config/text/server.yml` | 544 | 2/0 |
| `config/text/views/feeds/linkedin.yml` | 34 | 2/2 |
| `config/text/views/apps/apps.yml` | 202 | 4/4 |
| `docs/HELP.md` | 584 | 1/1 |
| `docs/templates.md` | 1524 | 7/9 |

Every path is on the write list. `shapes.ts` line 375 grew from one comment line to four (375-378), and `writes.svelte.ts` lines 519-520 grew to 519-521, each the same comment. `writes.svelte.ts` is at 877 lines, three under the 880 the rules file sets.

## Judgment calls the brief left open

1. A quoted key, `"date":` or `'publish':`, counts as the key `date` or `publish` (`POST_KEY = /^(["']?)(date|publish)\1[ \t]*:(?=[ \t]|$)/`). Without this, a quoted old date would stay beside an added `date: <day>`, and the read-back with `uniqueKeys: false` would then accept a file that holds both. Row 'a quoted date key' covers it.
2. A key line is a line whose key is followed by a colon and then a space, a tab or the end of the line. `date:2026` is a plain scalar in YAML, not a key, so it is left as it is.
3. The post's text is written with `writeTextAtomic` only when it differs from the idea's. Case 6 (both lines already right) renames only, and its text stays byte-identical, mtime included.
4. Row 'a front matter that does not parse' was added. It is the one input that reaches `post_not_dated`, and the rules file asks for one row per outcome (spec.md:59).
5. The `refusal` helper takes the sentence and not the key, because the keys check requires a literal key at each `words` call.
6. In `docs/templates.md` I changed two sentences. One is the sentence under the `### .oculus/tasks/linkedin.md` heading (line 666), which said the task "says whether a post is due"; that became false once the nudge step was gone. The other is the last sentence of the template's opening paragraph (line 671). Both now say the task drafts and the view's Mark posted records the post. The brief's "opening sentence under the heading" could mean either line, so both say it.
7. In the hub's task file, I reworded the cadence sentence to "Helps Axel draft LinkedIn posts; the LinkedIn view's Mark posted records a post once it is made." It now points to where the removed step 5 went. Step 5's closing "NEVER publish to LinkedIn." goes with that step. The rule is still in the kept sentence "There is **no LinkedIn connector**: this drafts; it never posts." A `diff` of the hub file against the Doc text below shows only line 1, line 5, the steps and the Finish line changed.

## Host- and user-visible changes, for the look on landing

- LinkedIn view, an idea's card. Hover Mark posted (in the strip, and in the menu's Status submenu). Before, the tip read `mark posted - rename xx- to the next number`. After, it reads `rename to the next number, set date to today and publish to True`.
- LinkedIn view, Mark posted on a scratch hub's idea. Before, the file moved under Posted with its old `date:`, so the card showed the old day. After, it moves under Posted with today's date, and the file's front matter holds `date: <today>` and `publish: True`.
- LinkedIn view, Mark posted on an idea whose name has capitals, such as `xx-leadingAIinHealth.md`. Before, it was refused with "A LinkedIn post must name an xx-*.md idea." After, it is promoted.
- LinkedIn view, Mark posted on an idea with no front matter. Before, it was renamed. After, the view shows the refusal "The LinkedIn idea has no front matter between two --- lines." and nothing moves.
- LinkedIn view, the cadence chip while on track. Before: `last post {0}d ago - on track`. After: `last post {0}d ago, on track`.
- Apps, the approval page of an app that asks for these writes. `linkedin-idea` reads "Add a LinkedIn idea, asking you first." / "add a LinkedIn idea". `linkedin-post` reads "Mark a LinkedIn idea as posted, asking you first." / "mark a LinkedIn idea as posted". Before, they said "Move".
- Help page, LinkedIn bullet: it gains the Mark posted sentence.

## Prose of the new sentences

- `post_no_front_matter` holds `---`. That is the file's own delimiter, quoted as the brief gives it, and not a dash in prose.
- `post_not_dated` holds `publish: True`, the literal value. It is double-quoted in the YAML because of its `: `.
- The tip begins in lower case, as its siblings do (brief decision 6).
- Each other new sentence was read against the rules file's prose rules and departs from none of them.

## Wrong or impossible in the brief

- Case 7 could not be reached; Ruling A drops it.
- "each such line when there are two" clashed with the `yaml` read-back; Ruling B settles it.

## Limitations and sharp edges

- A sidecar is any name that starts with the idea's name without `.md` followed by a dot, as the brief keeps it. So with ideas `xx-a.md` and `xx-a.b.md` in one folder, Mark posted on `xx-a.md` also renames `xx-a.b.md`, as a sidecar. The brief fixes the sidecar rule "as now", so I have not changed it. It needs a ruling if it matters.
- The name rule accepts `xx-.md`, which becomes `NN-.md`, since the view offers the button on every file that starts with `xx-`.
- A replaced line drops a carriage return of its own. Only a file whose first line is `---` without one, but with a CR on later lines, gets this far; brief decision 9 leaves CR files unhandled.
- After the rename, a throw from `writeTextAtomic` leaves a numbered post with its old text and the sidecars under their old names. The thrown error names the failure. The rename has no inverse writer (the record's `undo: 'none'`).
- The `post_exists` guard is reached by no test (Ruling A).
- The two-file test command was red once, under a load average of 18.91; see above.
- The history-word grep over the added comment and code lines (`git diff -U0 src tests | grep "^+" | grep -inE "before|used to|no longer|still|..."`) hit `before` five times. Two hits are comments: "added before the closing `---`" and "decided before any file moves". Three are code: the variables `before` and `after` in `markLinkedinPosted`. Each names an order or a value and records no history.
- The comments and documents that describe the write were re-read:
  - Rewritten: the doc comment of `markLinkedinPosted`, `writes.svelte.ts:518-521`, `shapes.ts:375-378`, `docs/HELP.md:332`, `docs/templates.md` lines 666-689.
  - Still true: the head comment of `feeds.ts` ("Reads and edits the generated YAML feeds and the LinkedIn Markdown folder"), the head comment of `PostCard.svelte`, and `docs/apps.md:451` (`linkedin-post`, "yes, no undo").
- The grep for the changed names and words over `src config docs README.md tests` was `grep -rn --exclude=local.yml -i "post nudge\|nudge and draft\|Mark posted\|markpost\|rename xx-\|markLinkedinPosted\|linkedin-post\|post_needs_idea\|post_exists\|next numbered post"`. It left no stale text: every hit is a call site, a type or one of the lines rewritten above.

## Doc text

The new text of `~/workspace/research-hub/.oculus/tasks/linkedin.md`, whole:

```markdown
# LinkedIn: draft a post

This file is the whole instruction for one run of the LinkedIn update task: oculus starts a Claude Code session in the hub root and asks it to follow this file step by step. Run on demand only (from the Update tray or a schedule).

Helps Axel draft LinkedIn posts; the LinkedIn view's Mark posted records a post once it is made. The pipeline lives in the **website repo** `side-projects/theaxec.github.io/_linkedin/` (the `linkedin_dir` key of `.oculus/config.yml`, which oculus's LinkedIn view draws): `NN-*.md` = posted (front-matter `title`/`date`/`category`/`publish`), `xx-*.md` = ideas. There is **no LinkedIn connector**: this drafts; it never posts.

## Steps

1. **Pick a topic:** the most timely `xx-` idea, OR a fresh one from a real project milestone (read the project's `project.yml` manifest / its `README.md`, e.g. a new result, an accepted paper, the Self-Explaining-Hospital vision). Tie it to something genuine; never invent results.
2. **Draft in Axel's voice** (study the existing `NN-*.md`: a hook, personal + technical, concrete, a few emoji, a soft "let's connect" CTA, ~3 hashtags, ~150-250 words). Present the draft for review.
3. **Save** (on request): write/refresh an `xx-<slug>.md` in `_linkedin/` (`publish: False`). This is in the **public website repo**, so keep it public-safe (no nulls/dead-ends; honest claims only). Don't commit unless asked.

Public-safe (website repo).

## Finish

End with the path of any file written or refreshed.
```

The line for G8's Test entry in `agents/guarded.md`, to sit after 'promotes an idea past 01-A and moves its same-basename sidecar':

`tests/server/edit/feeds.test.ts`, 'marks an idea posted with the day pressed and publish: True, or refuses and moves nothing: $name', every row
