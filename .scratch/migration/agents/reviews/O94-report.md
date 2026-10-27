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

## Round 1

Everything in the round brief `agents/briefs/O94-round1.md` is done. Two points supersede what the sections above say. First, the round-0 sharp edges "`xx-.md` is accepted", "an idea `xx-a.b.md` is moved as a sidecar" and "a throw after the rename leaves a numbered post with its old text" are fixed. Second, the round-0 rule "first line exactly `---`, closing line exactly `---`, CR refused" is replaced by the tree's split.

### Items

1. **The tree's front matter rule. DONE.**
   - The reuse grep was `grep -rn "splitFrontmatter\|FRONTMATTER\b\|FRONT_MATTER\|parseFrontmatter" src tests`. Its hits:
     - `src/lib/data/sources/documents/docs.ts:58` (`FRONTMATTER`) and `:64` (`splitFrontmatter`).
     - `src/lib/data/sources/documents/docs.ts:116` (`parseFrontmatter`).
     - `src/lib/data/prose/markdown/note-links.ts:37` (`FRONT_MATTER`, which takes no `...` closer and no blanks after a fence).
     - `src/lib/views/shared/prose/RenderedMarkdown.svelte:83`.
     - The callers `deck/split.ts:115`, `deck/outline.ts:61`, `lint/writing/folder.ts:112` and `lint/writing/markdown.ts:403`.
   - What is reused: `postedText` and `readsPosted` in `src/lib/server/edit/feeds/feeds.ts` call `splitFrontmatter` and are built on its block. `docs.ts` is unchanged and exports nothing new. The opening fence is the text up to the first line feed. The closing fence is what lies between the block and the body. The block is replaced line by line: each line keeps its own line end, and an added line takes the opening fence's line end.
   - What is not reused: `parseFrontmatter`. It parses without `uniqueKeys: false` and would refuse a key written twice (Ruling B). `readsPosted`'s doc comment says so.
   - A byte order mark is still refused, since `splitFrontmatter` finds no block behind one.
2. **An idea is never another idea's sidecar. DONE.** `moving` in `markLinkedinPosted` keeps a name that starts with the stem and a dot only when `isLinkedinIdea(name)` is false. The doc comment of `markLinkedinPosted` says so.
3. **`xx-.md` is no idea, one rule for the view and the server. DONE.**
   - `isLinkedinIdea` in `feeds.ts` is `/^xx-[^/\\]+\.[mM][dD]$/`: at least one character after `xx-`, then `.md` in any case.
   - It is used in three places in `feeds.ts`: by `markLinkedinPosted`, by `isLinkedinFile` (which lists the folder and which the portfolio watcher reads), and by `readLinkedinFolder`, which marks each entry `idea`.
   - `splitPosts` (`src/lib/state/feeds/linkedin.ts:106`) now reads that mark (`entry.idea === true`) in place of `file.startsWith('xx-')`. The button and the write therefore decide by the one function.
   - A shared module was not used. `tests/checks/tree/boundaries.test.ts` does not let `state/` import `data/prose/linkedin-idea`; the run of the list printed `"state/feeds/linkedin.ts imports data/prose/linkedin-idea"`. Allowing it would mean an edit to the check's allow list, so the view reads the server's mark instead.
   - The view part has no unit test: G8 is the only entry the change touches, and it covers writes (spec.md:59). Its proof is the look on landing.
4. **A throw after the rename renames back. DONE.** `writeTextAtomic` runs in a `try`. On a throw, `renameSync(post, source)` runs and the error is thrown on. The doc comment of `markLinkedinPosted` says so in place of the old sentence.
5. **The case-run program's folders. DONE.**
   - `rm -rf` of the three folders. `ls -d` of each then printed `No such file or directory`, `ls exit 1`.
   - This round's only extra run used the base copy (item 6). The files placed there are all removed: links to `node_modules`, `vite.config.ts`, `package.json`, `tsconfig.json` and `.svelte-kit`, and the test file `tests/server/edit/o94-rows.test.ts`. `ls -a` of the base copy then printed `. .. config src tests unused-exports.txt utils`.
6. **The report. DONE.** See the sections below.

### The cases' first run on the round's starting tree

The rows were added to the table before any change to `src`. The command was `npx vitest run tests/server/edit/feeds.test.ts -t "marks an idea posted" --reporter=verbose`, and its count line was `Tests  7 failed | 13 passed | 9 skipped (29)`. The 13 passing rows were the 13 rows of the step and its cases ruling. The seven new rows:

1. 'fence lines with trailing blanks' (`---<tab>` opening, `--- ` closing): FAIL, refused, the folder unchanged: `- "02-easy-problems.jpeg"`, `- "02-easy-problems.md"`, `+ "xx-easy-problems.jpeg"`, `+ "xx-easy-problems.md"`.
2. 'a front matter closed by ...': FAIL, the same folder diff (refused).
3. 'CRLF line ends': FAIL, the same folder diff (refused). I added 'CRLF line ends and neither key' for the added lines of item 1. It also failed, with the same diff.
4. 'an idea beside another idea whose name starts with its own': FAIL, `+ "02-a.b.md"`, `- "xx-a.b.md"`.
5. 'xx-.md, which names no idea': FAIL, `+ "02-.md"`, `- "xx-.md"`.
6. 'a text that cannot be written after the rename': FAIL, `+ "02-easy-problems.md"`, `- "xx-easy-problems.md"`. The post stayed numbered with its old text.
7. The step's rows: all 13 passed, as quoted.

### The first run on the unchanged tree, from the base copy

I copied the current test file into the base copy as `tests/server/edit/o94-rows.test.ts` and linked in the worktree's `node_modules`, `vite.config.ts`, `package.json`, `tsconfig.json` and `.svelte-kit`. I then ran `npx vitest run tests/server/edit/o94-rows.test.ts -t "marks an idea posted|promotes an idea" --reporter=verbose` from the base copy, against the base source, and removed the files afterwards (item 5). Its count line, whole:

```
      Tests  18 failed | 3 passed | 8 skipped (29)
```

The 21 tests that ran are 'promotes an idea past 01-A and moves its same-basename sidecar' and the table's 20 rows. Each row's result:

- PASS 'promotes an idea past 01-A and moves its same-basename sidecar'
- FAIL 'the fixture's idea, its date replaced and publish added'
- FAIL 'the stub's front matter with publish: False'
- FAIL 'a quoted date'
- FAIL 'a quoted date key'
- FAIL 'a date line in the body'
- FAIL 'no front matter' (renamed: `+ "02-easy-problems.jpeg"`, `+ "02-easy-problems.md"`)
- PASS 'a front matter that holds publish: True and the day'
- FAIL 'a date line written twice'
- FAIL 'a front matter with neither key'
- FAIL 'a front matter that never closes' (renamed)
- FAIL 'a front matter that does not parse' (renamed)
- FAIL 'an idea name with capitals'
- FAIL 'a published: key beside the date'
- FAIL 'fence lines with trailing blanks'
- FAIL 'a front matter closed by ...'
- FAIL 'CRLF line ends'
- FAIL 'CRLF line ends and neither key'
- FAIL 'an idea beside another idea whose name starts with its own'
- PASS 'xx-.md, which names no idea' (the base name rule `[a-z0-9]+` already refused it; the round-0 rule accepted it)
- FAIL 'a text that cannot be written after the rename' (`expected [Function] to throw an error`)

### Results

| Case | Result | Proof |
| --- | --- | --- |
| 1. closing `--- ` | met | PASS 'fence lines with trailing blanks' |
| 2. `...` closer | met | PASS 'a front matter closed by ...' |
| 3. CRLF | met | PASS 'CRLF line ends', PASS 'CRLF line ends and neither key' |
| 4. `xx-a.b.md` keeps its name | met | PASS 'an idea beside another idea whose name starts with its own' |
| 5. `xx-.md` refused | met for the write; the view part by reading `splitPosts` and `readLinkedinFolder`, and the look on landing | PASS 'xx-.md, which names no idea' |
| 6. throw after the rename | met | PASS 'a text that cannot be written after the rename' |
| 7. the step's rows | met | all 13 PASS, run below |

Row 6 makes the next `writeTextAtomic` throw through a pass-through `vi.mock` of `src/lib/server/core/json.ts` at the head of the test file. It is the one module mock of the file, and every other call goes to the real writer.

### Verification

I ran the list twice this round. The first run was red in `tests/checks/tree/boundaries.test.ts` (`"state/feeds/linkedin.ts imports data/prose/linkedin-idea"`). After the change of item 3, `npx vitest run tests/server/edit/feeds.test.ts tests/checks/tree/boundaries.test.ts` printed `Tests  40 passed (40)`, and then the list ran once more.

`npm run diagrams && npm run test:quick`:

```
test:quick: 17 changed file(s), from git since HEAD
test:quick: 66 test file(s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      ASCII gate (2.4 s)
ok      svelte-kit sync (6.9 s): /Users/axelfaes/workspace/research-hub/.oculus/local.yml: ignoring unknown key(s) self
ok      vitest slow (46.0 s): Duration  36.56s (transform 15.69s, setup 0ms, import 43.38s, tests 43.43s, environment 1ms)
ok      eslint (76.7 s)
ok      svelte-check (93.7 s): 1793061452302 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (112.1 s): Duration  102.87s (transform 85.90s, setup 0ms, import 209.73s, tests 160.97s, environment 4ms)
ok      vitest (115.8 s): Duration  106.58s (transform 197.52s, setup 0ms, import 369.59s, tests 21.83s, environment 9.95s)
test:quick: 122.9 s; every command passed
```

The line `ignoring unknown key(s) self` is printed by the tree's own reader (`src/lib/data/sources/config/local.ts:642`) while `svelte-kit sync` loads the config. No file of this step calls that reader (`grep -n "loadLocal\|local.ts"` over `feeds.ts`, `json.ts`, `docs.ts` and the test file finds none), and I did not read the file it names.

`npm run diagrams` rewrote `docs/diagrams/layers.dot`/`.svg` and `layer-server.dot`/`.svg`. The counts of server-to-data imports moved from 128 to 129 and from 550 to 551, for the new import of `docs.ts`.

`npx vitest run tests/server/edit/feeds.test.ts tests/routes/hubs/hub-writes.test.ts --reporter=verbose`: `Test Files  2 passed (2)`, `Tests  76 passed (76)`. Every row of the table passed, as did 'promotes an idea past 01-A and moves its same-basename sidecar' and the five LinkedIn rows of `hub-writes.test.ts`.

The ASCII gate over the round's changed files and this report printed nothing; its exit status is in the hand-back.

Other checks:
- `sh utils/unused-exports.sh 2>/dev/null | diff O94-base/unused-exports.txt -`: no output, `unused diff exit 0`. `isLinkedinIdea` is module-local.
- `wc -l`: `766 src/lib/server/edit/feeds/feeds.ts`, `156 src/lib/state/feeds/linkedin.ts`, `741 tests/server/edit/feeds.test.ts`.
- The history-word grep over the added lines hit `before` six times, each naming an order or a variable ("before the closing fence", "before any file moves", "as it was before the press", and the variables `before` and `after`).
- No existing assertion was edited: the only base lines the test file changes are its two import lines.

### Files

`git diff --numstat` (added, removed):
- `src/lib/server/edit/feeds/feeds.ts`: 110, 19
- `src/lib/state/feeds/linkedin.ts`: 6, 2
- `tests/server/edit/feeds.test.ts`: 291, 2
- `src/lib/state/client/writes.svelte.ts`: 2, 1
- `src/lib/state/shared/stores/shapes.ts`: 4, 1
- `config/text/server.yml`: 2, 0
- `config/text/views/apps/apps.yml`: 4, 4
- `config/text/views/feeds/linkedin.yml`: 2, 2
- `docs/HELP.md`: 1, 1
- `docs/templates.md`: 7, 9
- `docs/diagrams/layers.dot` and `.svg`: 1, 1 each
- `docs/diagrams/layer-server.dot` and `.svg`: 1, 1 each

Every path is on the step's or the round's write list. `src/lib/data/sources/documents/docs.ts` is unchanged.

### spec.md:72

- **New keys.** The step adds the catalog keys `server.feeds.post_no_front_matter` and `server.feeds.post_not_dated`.
  - Neither is empty.
  - Each is unique in the `feeds` group of `config/text/server.yml`, beside `post_exists` and `post_needs_idea`.
  - Neither collides with a configured or reserved key. The keys check's 'has a reader for every catalog key' and the one-file-per-group rule pass in the list above.
  - The entry field `idea` is not new: `readLinkedinFolder` already sent it, and the view now reads it.
- **Asynchronous paths.** `markLinkedinPosted` is synchronous from its first `existsSync` to its return, so two presses run one after the other in the server. The second finds no `xx-` source and answers `found: false`, which the route answers with `server.write_route.no_idea_file` and 404 (`feed-route.ts:175-176`). A page closed while the request is in flight changes nothing on the server: the write completes and its answer is dropped. No write supersedes another, since there is no queue and no timer.

### Host- and user-visible changes, added this round

Each is seen on TEST's LinkedIn view with a scratch hub's folder in the state named.

- **A front matter that does not parse** (an unclosed quote in `title:`). Before (base): Mark posted renamed it, text unchanged. After: refused with "The LinkedIn idea's front matter did not read back with the new date and publish: True.", nothing moved.
- **A front matter that never closes, or a file that opens with a byte order mark.** Before (base): renamed. After: refused with "The LinkedIn idea has no front matter between two --- lines.", nothing moved.
- **The name rule.** Before (base): only `xx-` followed by lower-case letters, digits and single dashes, then `.md`. After: any base name `xx-<at least one character>.md`, the suffix in any case. Underscores, dots and capitals are accepted, and `xx-foo.MD` becomes `NN-foo.MD`. Before, such an idea was listed with Mark posted, and the press was refused with "A LinkedIn post must name an xx-*.md idea.".
- **Fences with trailing blanks, a `...` closer, or CRLF line ends.** After: promoted and dated, the fences kept as written and a CRLF file left CRLF. With the round-0 code these were refused; on base they were renamed undated.
- **An idea `xx-a.b.md` beside `xx-a.md`.** Before: Mark posted on `xx-a.md` also renamed `xx-a.b.md` to `NN-a.b.md`. After: `xx-a.b.md` keeps its name and stays under Ideas.
- **A file named `xx-.md`.** Before (base): listed under Ideas, with Mark posted refused. After: not listed in the LinkedIn view at all, since `isLinkedinFile` takes it neither as an idea nor as a post. A change to it does not refresh the view (`portfolio.ts:566`).
- **A failed write after the rename** (for example a full disk). After: the idea is back under Ideas with its own name and text, and the press shows the error.
- **The Update tray's LinkedIn task**, once the Doc text lands: it no longer reports the days since the last post and no longer renames a post on request. The template in `docs/templates.md` changes the same way.

### Limitations

- A throw from one of the sidecar renames, after the post was written, leaves a dated post with some sidecars still under their `xx-` names. Item 4 names the write of the text only, so this is unchanged.
- If renaming the post back itself throws, that rename's error is the one passed on, and the post stays numbered with its old text.
- The view's half of case 5 has no unit test (see item 3); the look on landing is its proof.
- Two choices of this round could be reversed:
  - The suffix is case-insensitive, matching `isLinkedinFile`, so every file the view lists as an idea is one Mark posted accepts.
  - `xx-.md` is dropped from the listing.

The line for G8's Test entry is unchanged: `tests/server/edit/feeds.test.ts`, 'marks an idea posted with the day pressed and publish: True, or refuses and moves nothing: $name', every row.
