# O94 refuter report

## Verification (rerun by the reviewer)

All commands were run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O94` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The rules file names no output filter (`grep -n -i filter` over `spec.md`, the state file and `.agents/plan.yaml` finds none), so each output is quoted as printed.

1. `npm run diagrams && npm run test:quick`. `git status --short` afterwards lists no file under `docs/diagrams`. Its tail:
```
ok      prettier (3.8 s): All matched files use Prettier code style!
ok      ASCII gate (3.9 s)
ok      svelte-kit sync (17.9 s)
ok      vitest slow (42.1 s): Duration  31.31s (transform 10.05s, setup 0ms, import 36.78s, tests 29.63s, environment 2ms)
ok      eslint (84.1 s)
ok      svelte-check (93.1 s): 1793059726472 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (100.2 s): Duration  90.87s (transform 75.19s, setup 0ms, import 179.76s, tests 131.90s, environment 4ms)
ok      vitest (113.3 s): Duration  104.09s (transform 300.38s, setup 0ms, import 352.22s, tests 18.94s, environment 2.53s)
test:quick: 131.3 s; every command passed
```
2. ASCII gate over the nine changed files and the report: `ascii exit 0`, nothing printed.
3. `npx vitest run tests/server/edit/feeds.test.ts tests/routes/hubs/hub-writes.test.ts --reporter=dot`: `Test Files  2 passed (2)` / `Tests  69 passed (69)`.
4. `wc -l src/lib/server/edit/feeds/feeds.ts`: `742 src/lib/server/edit/feeds/feeds.ts`.
5. `grep -n " - " config/text/views/feeds/linkedin.yml`: nothing printed, `hyphen grep exit 1`.
6. I read every new or changed sentence against the prose rules. No departure beyond the two the report names: `---` in `post_no_front_matter` and `publish: True` in `post_not_dated`, both literal and both given by the brief.

These are the builder's quoted commands, rerun:
- `npx vitest run tests/server/edit/feeds.test.ts -t "marks an idea posted|promotes an idea" --reporter=verbose`: `<check mark>` on 'promotes an idea past 01-A and moves its same-basename sidecar' and on each of the 13 rows ('the fixture\'s idea, its date replace<ellipsis>', 'the stub\'s front matter with publish<ellipsis>', 'a quoted date', 'a quoted date key', 'a date line in the body', 'no front matter', 'a front matter that holds publish: Tr<ellipsis>', 'a date line written twice', 'a front matter with neither key', 'a front matter that never closes', 'a front matter that does not parse', 'an idea name with capitals', 'a published: key beside the date'), `Tests  14 passed | 8 skipped (22)`.
- `npx vitest run tests/routes/hubs/hub-writes.test.ts -t "LinkedIn idea" --reporter=verbose`: `<check mark>` on "'a LinkedIn idea posted' changes the second hub only, is logged by path and is undone" and four other LinkedIn rows, `Tests  5 passed | 42 skipped (47)`.
- `sh utils/unused-exports.sh 2>/dev/null | diff ../O94-base/unused-exports.txt -`: `diff exit 0`.
- `diff ../O94-base/tests/server/edit/feeds.test.ts tests/server/edit/feeds.test.ts | grep "^<"`: only the two base import lines.
- `diff -rq` against `O94-base` over `src`, `config`, `tests` and `utils`: the seven files the report lists, and no other.
- `git diff 5c3847a33 --numstat` and `wc -l`: every count in the report's file table matches (feeds.ts 742, 80/13; feeds.test.ts 642, 192/2; writes.svelte.ts 877; shapes.ts 529; server.yml 544; linkedin.yml 34; apps.yml 202; HELP.md 584; templates.md 1524).
- The report's grep for the changed names over `src config docs README.md tests` finds no stale sentence. `PostCard.svelte:4-5`, `docs/apps.md:451`, `config/options/behavior.yml:178` and `config/defaults/behavior.yml:57` are still true.
- History-word grep over the added lines of `src` and `tests`: the only hits are `before` at `feeds.ts:316` and `:358`, which name an order, and the variables `before`/`after`. The date-shaped hits are test inputs, not comments.
- I diffed the report's Doc text against `~/workspace/research-hub/.oculus/tasks/linkedin.md`. Only line 1, line 5, the steps and the Finish line differ.
- Premises of "What is on the tree", checked with `git show 5c3847a33:<path>`: feeds.ts had 675 lines; `linkedin.yml:18`, `:24`, `apps.yml:67-68`, `:74-75`, `feed-route.ts:162`, `:175`, `writes.svelte.ts:519-520`, `:523`, `shapes.ts:375`, `json.ts:90`, `documents/feeds.ts:45`, `PostCard.svelte:49-50`, `linkedin.ts:106`, `dates.ts:14` and `HELP.md:332` read as the brief says.
- The hub's ten `xx-*.md` ideas: no CR (`grep -lc $'\r'` exit 1), all start `2d2d2d`, lines 5 and 6 hold 8 `publish: True` and 2 `publish: False`. Each front matter parses with `yaml` `uniqueKeys: false` and closes on line 7, so none of them would be refused by the new checks.

## Verdicts

Items:
1. Mark posted writes the date and `publish: True`: holds.
   - Name rule: `feeds.ts:371`.
   - Key lines: `POST_KEY` at `:312` and `postedText` at `:322-338`. Each `date` and `publish` line is replaced, and missing keys are added `publish` first before the closing `---`.
   - Read-back: `readsPosted` at `:345-355` uses `uniqueKeys: false` (Ruling B).
   - Refusals at `:397-403` all come before the rename. Then the rename (`:405`), `writeTextAtomic` (`:406`) and the sidecars, in the brief's order.
   - The record keeps `undo: 'none'` (`:422`), and its comment says the write dates the post.
   - The page's comments are rewritten: `writes.svelte.ts:519-521` and `shapes.ts:375-378`.
2. The words: holds. `linkedin.yml:18`, `:24` and `apps.yml:67-68`, `:74-75` read exactly as the brief gives them.
3. The documents: holds.
   - `HELP.md:332` carries the brief's sentence verbatim.
   - The template's title, its three renumbered steps and its Finish are as the brief gives them.
   - The sentence at `templates.md:666` became false and was rewritten, as spec.md:71 requires.
   - The extra sentence at `:671` is Spec 1.
4. The hub's task file as text: holds. Diffed against the hub file, only the lines item 4 names differ. The added clause on line 5 is judged in Spec 1.

Cases, as ruled:
1. met (row 1 plus the unchanged 'promotes an idea past 01-A' row, which checks the record and the sidecar).
2. met.
3. met.
4. met.
5. met: the names stay as FOLDER and the text is unchanged.
6. met (preserved behaviour; the first run, green, is quoted).
7. not applicable: dropped by Ruling A, with the `post_exists` guard kept at `feeds.ts:396-398` and its catalog line at `server.yml:336`.
8. met.
9. met.
10. met.
11. met.

Ruling B row ('a date line written twice'): met; its first run, red, is quoted.

12. met (my rerun above).
13. not verifiable by me. It is settled by the look on landing on TEST's LinkedIn view.

## 1. Spec

1. `docs/templates.md:671`. The hunk: `-... This task drafts; it never posts.` / `+... This task drafts and never posts; the LinkedIn view's Mark posted records a post once it is made.`
   - Item 3 asks for "its opening sentence under the heading" to say this, and adds "Nothing else of the template changes."
   - If "the heading" is `### .oculus/tasks/linkedin.md`, line 666 is the change the item asks for, and line 671 is a second change that no item asks for. This is builder choice 6.
   - If "the heading" is the template's `# LinkedIn: draft a post`, the opening sentence there ("This file is the whole instruction ...") is untouched, and the change sits on the paragraph's last sentence instead.
   - Either way, line 666 is required by spec.md:71.
   - Failure scenario: a hub author copying the template reads the same fact twice within six lines, against the brief's "nothing else changes". The consequence is low. The orchestrator decides which reading the brief meant.
   - Builder choice 7, the clause added to the hub's line 5, is within item 4's "reworded to say the task drafts posts": the rewording is the builder's, and it keeps the hub file in step with the template. No finding.

The other builder choices are judged here:
- Choice 1, quoted keys: asked by item 1, since `"date":` is the YAML key `date`. `node -e` with `parse('"date": 2025-02-12\npublish: True\ndate: 2026-10-27', { uniqueKeys: false })` printed `{"date":"2026-10-27","publish":true}`. Without this choice the read-back would accept a file that holds both dates.
- Choice 2, the parse-failure row: asked by spec.md:59, one row per outcome.
- Choice 3, no rewrite when the text is unchanged: an internal detail of item 1, and case 6 holds either way.

## 2. Proof

none

## 3. Standards

1. The case-run program left its files behind.
   - Place: the report's "The cases' first run", the program that calls `mkdtempSync(join(tmpdir(), 'o94-case-'))`.
   - spec.md:65 says a file a case-run program needs "lives in the scratchpad or the base copy and is gone before the report".
   - Three hub copies remain in the system temporary folder: `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o94-case-4ZtdN6`, `o94-case-IhBBau` and `o94-case-RRIA0Z`, modified 00:30 to 00:32 on Oct 27 (`ls -d`, `stat`). Each holds `linkedin/01-A-reflection.md` and `02-easy-problems.md`.
   - The report's quote of the program's first output line is shortened with "..." (`{"found":true,"changed":["file"],"refused":[],...}`), so its output is not quoted whole.
   - The program is a case-run program in kind (it prints results, writes nothing into the diff, and its source is quoted). Only the placement and the clean-up break the rule.
   - Failure scenario: hub copies pile up in the shared temporary folder across steps and must be removed at landing, as happened after another step.
   - The folders' contents do match the claimed unchanged-tree outputs: renamed, text unchanged.
2. The front matter is split and parsed by new code, and the report quotes no reuse grep.
   - `feeds.ts:322-355` (`postedText`, `readsPosted`) splits and parses a front matter with new code. The tree already has `splitFrontmatter` and `parseFrontmatter` (`src/lib/data/sources/documents/docs.ts:58-68`, `:116`), which `src/lib/server/machine/runs/lint/writing/markdown.ts:4` calls "the tree's one split".
   - spec.md:88 asks for the grep for an existing helper to be quoted in the report. It is not there.
   - The brief's rule (first line exactly `---`, closing line exactly `---`, CR refused) and Ruling B (`uniqueKeys: false`) differ from those helpers: `splitFrontmatter` accepts `---[ \t]*`, a `...` closer and CRLF, and `parseFrontmatter` throws on a repeated key. So the builder's code follows the brief, but the disagreement is not reported as spec.md:7 asks.
   - Failure scenario: for an idea whose closing line is `--- ` (a trailing space), the readers built on `splitFrontmatter` and the preview's `FRONT_MATTER` see a front matter. Mark posted refuses it with "The LinkedIn idea has no front matter between two --- lines.", and the reader sees two such lines. None of the hub's ten ideas is affected (verified above).
3. The report lacks spec.md:72's statements on new keys and asynchronous paths.
   - The two new catalog keys are distinct from their siblings, and the keys check passes.
   - `markLinkedinPosted` is synchronous. Read in the code, a second press after the rename finds no source and answers `found: false` (`feeds.ts:380-382`).
   - Failure scenario: none at runtime. It is a report omission.

## 4. Behaviour

1. Some visible changes are missing from the report's "Host- and user-visible changes":
   - An idea whose front matter does not parse (for example an unclosed quote in `title:`) was renamed before. It is now refused with "The LinkedIn idea's front matter did not read back with the new date and publish: True." (`feeds.ts:403`, row 'a front matter that does not parse').
   - An idea whose front matter never closes, or that starts with a byte order mark, was renamed before. It is now refused with the no-front-matter sentence.
   - The name rule now accepts every `xx-*.md`, including underscores, dots and capitals. The report lists capitals only.
   - Once the Doc text lands, the Update tray's LinkedIn task no longer reports the days since the last post and no longer renames a post on request; the template in `docs/templates.md` changes the same way.

   Failure scenario: the landing's look and Axel read the before/after list and are not told that a malformed idea is now refused, or that the task's output lost its cadence line.

## Declined to judge

- The first run on the unchanged tree. Re-running it needs the new test file placed in the base copy, a write I may not make. The report's count `Tests 10 failed | 1 passed | 9 skipped (20)` does not add up with its own claim that 'promotes an idea' passed in that run: the base file has 9 tests (`grep -cE` over `O94-base/tests/server/edit/feeds.test.ts`), so 20 means 11 rows, and the `-t` pattern matches the promote test, so 12 tests should have run. No decision rests on the count, since each row's red is quoted. To settle it, run the new feeds.test.ts against the base source.
- Re-running the case-run program. It writes a temporary hub, so I did not run it. The three leftover folders listed under Standards 1 corroborate its quoted results.
- Whether the builder ran a whole-suite command, and how many times it ran the verify list. The transcript is not available to me. The three runs the report states follow spec.md:26's rerun rule for reds in files the step changed.
- The sidecar rule: Mark posted on `xx-a.md` also renames an idea `xx-a.b.md` as a sidecar. This behaviour predates the step, and the brief keeps the rule "as now", so it is outside the step. The builder writes that it "needs a ruling", but it is not booked in `plan.md` or the state file; booking it is the orchestrator's call.
- `docs/apps.md`'s Reasons table lists no LinkedIn refusal. That omission is already in the base, which also omits `post_needs_idea` and `post_exists`, so I did not judge it as the step's.

Reviewer usage: a3d20902e374d2dd1, claude-opus-5-5, 209441 tokens, 56 tool uses, 17 min 47 s


# Repair round 1, refuted

### Verification (rerun by the reviewer)

Every command ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O94` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

1. `npm run diagrams && npm run test:quick`. I took an `md5` of `docs/diagrams/*.dot` and `*.svg` before the run and compared it after: `diagrams unchanged by the run`. Afterwards `git status --short` lists the four diagram files the step already changed (`layer-server.dot/.svg`, `layers.dot/.svg`) and nothing new. Their diff since the base is the import count (`"folder server/edit to layer data" [label="129"`, was 128; `"server to data" [label="551"`, was 550), which comes from the new import of `docs.ts`. The tail of the run:
```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.4 s): /Users/axelfaes/workspace/research-hub/.oculus/local.yml: ignoring unknown key(s) self
ok      eslint (36.0 s)
ok      vitest slow (64.4 s): Duration  52.57s (transform 23.26s, setup 0ms, import 58.51s, tests 59.80s, environment 1ms)
ok      svelte-check (66.7 s): 1793061901922 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (236.1 s): Duration  225.14s (transform 526.15s, setup 0ms, import 725.23s, tests 46.75s, environment 7.66s)
ok      vitest checks (357.7 s): Duration  342.42s (transform 224.84s, setup 0ms, import 711.54s, tests 389.70s, environment 4ms)
test:quick: 360.3 s; every command passed
```
2. `npx vitest run tests/server/edit/feeds.test.ts tests/routes/hubs/hub-writes.test.ts --reporter=dot` printed `Test Files  2 passed (2)` and `Tests  76 passed (76)`.
3. The ASCII gate over the 14 changed files and `.scratch/migration/agents/reviews/O94-report.md` printed nothing, `ascii exit 0`.
4. `wc -l src/lib/server/edit/feeds/feeds.ts` printed `766 src/lib/server/edit/feeds/feeds.ts`.
5. `grep -n " - " config/text/views/feeds/linkedin.yml` printed nothing, `hyphen grep exit 1`.

These are the commands the Round 1 section quotes as evidence, rerun:
- The reuse grep `grep -rn "splitFrontmatter\|FRONTMATTER\b\|FRONT_MATTER\|parseFrontmatter" src tests` gives the hits the report lists. Its pattern does not reach `linkedinFrontMatter` (`feeds.ts:179-182`), which is the LinkedIn view's own front matter reader (Spec 1).
- `ls -d` of the three `o94-case-*` folders printed `No such file or directory` three times, `ls exit 1`, and the glob `o94-*` matches nothing in that temporary folder.
- `ls -a ../O94-base` printed `. .. config src tests unused-exports.txt utils`. `git show 5c3847a33:<path> | diff - ../O94-base/<path>` is equal for `tests/server/edit/feeds.test.ts` and for `src/lib/server/edit/feeds/feeds.ts`.
- `npx vitest run tests/server/edit/feeds.test.ts -t "marks an idea posted|promotes an idea" --reporter=verbose` showed `<check mark>` on 'promotes an idea past 01-A ...' and on all 20 rows of the table, then `Tests  21 passed | 8 skipped (29)`.
- `npx vitest run tests/server/edit/feeds.test.ts tests/checks/tree/boundaries.test.ts --reporter=dot` ran twice:
  - The first run printed `Test Files  1 failed | 1 passed (2)` and `Tests  1 failed | 39 passed (40)`. I did not capture which test failed.
  - The second run printed `Test Files  2 passed (2)` and `Tests  40 passed (40)`. `uptime` just before it showed load averages `20.14 19.53 16.57`.
- `sh utils/unused-exports.sh 2>/dev/null | diff ../O94-base/unused-exports.txt -` printed nothing, `unused diff exit 0`.
- `git diff 5c3847a33 --numstat` and `wc -l` match every count in the report's Files list: feeds.ts 110/19, linkedin.ts 6/2 (156 lines), feeds.test.ts 291/2 (741 lines), and the rest as listed.
- `grep -n "loadLocal\|local.ts"` over `feeds.ts`, `json.ts`, `docs.ts` and the test file printed one line, `src/lib/data/sources/documents/docs.ts:113: * empty block is no keys, the same as readLocal (config/local.ts) reads an empty file.`, `grep exit 0`. The report says this grep "finds none" (Proof 2).
- `src/lib/data/sources/config/local.ts:642` holds the `console.warn` of unknown keys, and `feed-route.ts:175-176` answers `server.write_route.no_idea_file` with 404 when `found` is false. Both are as the report says.
- History-word grep over the added lines of `src` and `tests`: the only hits are "before" naming an order (the closing fence, any file moves, "before the press") and the variables `before`/`after`. The date-shaped hits are test inputs.
- `npx vitest run tests/routes/hubs/hub-writes.test.ts -t "LinkedIn idea" --reporter=verbose` showed `<check mark>` on the five LinkedIn rows, "'a LinkedIn idea posted' changes the second hub only, is logged by path and is undone" among them, then `Tests  5 passed | 42 skipped (47)`.

### Verdicts

Items of the step's brief, over the whole diff since 5c3847a33:
1. Mark posted writes the date and `publish: True`: holds.
   - The front matter rule and the name rule are the ones round 1 ruled (`splitFrontmatter`; `isLinkedinIdea`, `feeds.ts:213-215`).
   - Every refusal comes before the rename (`:415-421`).
   - The order is rename, `writeTextAtomic`, sidecars (`:422-431`). The record keeps `undo: 'none'` (`:446`).
   - The page's comments are rewritten (`writes.svelte.ts:519-521`, `shapes.ts:375-378`).
2. The words: holds (`linkedin.yml:18`, `:24`; `apps.yml:67-68`, `:74-75`).
3. The documents: holds. The first review's Spec 1 (the second sentence changed at `docs/templates.md:671`) is not ruled in the round brief and still stands as written there.
4. The hub's task file as text: holds. The Doc text is unchanged this round.

The round brief's six items:
1. The tree's front matter rule: holds as to the rule built, which is `splitFrontmatter` reused (`feeds.ts:337`, `:363`), CRLF kept per line, and a BOM refused. It is violated in one part: the head comment of `postedText` states a false fact (Standards 1). The item's own premise does not reproduce (Spec 1).
2. An idea is never another idea's sidecar: holds (`feeds.ts:408-410`; the doc comment at `:377-378`).
3. A name after `xx-`, one rule for the view and the write: holds. The view reads the server's mark (`linkedin.ts:110`), which is set by `isLinkedinIdea` (`feeds.ts:244`).
4. A failed write is renamed back: holds for a throw of `writeTextAtomic` (`feeds.ts:423-428`). The two remaining limitations are judged under Behaviour.
5. The case-run program's files: holds (rerun above).
6. The report: holds. Every Behaviour 1 point of the first review is listed with before and after, the spec.md:72 statements are given, and the base-copy count line is quoted whole with each row. Two exceptions: one quoted grep does not reproduce (Proof 2), and the list of visible changes misses the `...`-closer consequence (Behaviour 1).

Cases of the step's brief:
1. met
2. met
3. met
4. met
5. met
6. met
7. not applicable (Ruling A)
8. met
9. met
10. met
11. met
12. met (route rows rerun above)
13. not verifiable by me; it is the look on landing. For an idea closed by `...`, the look would not show today's date (Behaviour 1).

The cases ruling's added row ('a date line written twice'): met.

The round brief's seven cases:
1. `--- ` closer: met.
2. `...` closer: met for the write, which renames, dates and keeps the `...` line. The view does not read the result (Behaviour 1).
3. CRLF: met (two rows, compared with `toBe`).
4. `xx-a.b.md` keeps its name: met.
5. `xx-.md` refused: met. The view half is met by reading: `isLinkedinFile` (`feeds.ts:221-226`) no longer lists the file.
6. A throw after the rename: met.
7. Every earlier row still passes: met (21 passed above).

### 1. Spec

1. The round's premise that the view reads front matter by `splitFrontmatter` does not reproduce, and the builder did not report the disagreement (spec.md:7).
   - Place: `src/lib/server/edit/feeds/feeds.ts:326-328` with `:179-182`.
   - Round item 1 asks for `splitFrontmatter` "so Mark posted accepts exactly the files the LinkedIn view and the preview read a front matter from". The LinkedIn view does not read through `splitFrontmatter`. `readLinkedinFolder` (`feeds.ts:237`) calls `linkedinFrontMatter`, whose rule is `/^\s*---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/`: it accepts leading whitespace and a BOM (JS `\s` matches U+FEFF), and it has no `...` closer. The preview uses `RenderedMarkdown.svelte:83` `/^---\r?\n[\s\S]*?\r?\n---\r?\n?/`.
   - A node run with the three regexes copied from the source printed:
     ```
     "dots closer (posted text of row 2)" view: null | tree: true | preview: false
     "tab after opening fence" view: "title: \"T\"\ndate: 2026-10-27" | tree: true | preview: false
     "byte order mark" view: "title: \"T\"\ndate: 2025-02-12" | tree: false | preview: false
     "blank line before fence" view: "title: \"T\"\ndate: 2025-02-12" | tree: false | preview: false
     ```
   - So the write and the view still disagree. The write accepts a `...` closer that the view does not read. The view reads a BOM file and a file with a blank line before its fence, and the write refuses both with "The LinkedIn idea has no front matter between two --- lines."
   - The builder's reuse grep (Round 1, item 1) has no pattern for `linkedinFrontMatter`, a function in the same file it changed.
   - Failure scenario: a hand-written idea starts with a blank line. The view shows its title and date from the front matter, and Mark posted refuses it, telling the reader the file has no front matter.
   - No hub idea is affected today. Line 7 of each `.md` in the hub's `_linkedin` folder is `---` for 19 of 20 files; the 20th is a post with a `link:` line, and no name is `.MD` or `xx-.md`.
   - The fix stays in a file on the write list: one split for `linkedinFrontMatter` and `postedText`.
2. The first review's Spec 1 (`docs/templates.md:671`, the second sentence changed) still stands. The round brief does not rule on it.

### 2. Proof

1. The test file adds a file-scope mutable.
   - Place: `tests/server/edit/feeds.test.ts:26`: `const failing = vi.hoisted(() => ({ next: null as Error | null }));`, read and set by the `vi.mock` factory at `:30-41` and by the table loop at `:405` and `:429`.
   - spec.md:87 bans module-level mutable state "in test fixtures and helpers too". The tree has precedents: `tests/server/edit/config-value.test.ts:41` and `tests/server/files/ops.test.ts:24`.
   - Today the tests in the file run one after another (`it = test`, `tests/fixtures/scratch.ts:126`), so the value cannot leak.
   - Failure scenario: if a row returned before `finally` ran, or the file ran concurrently, a pending `failing.next` would make the next `writeTextAtomic` of an unrelated writer (`addLinkedinIdea`, `addLead`) throw.
   - The mock could instead export the real writer wrapped in `vi.fn`, and the row could call `vi.mocked(writeTextAtomic).mockImplementationOnce(...)`, with no holder of the test's own.
2. A quoted claim does not reproduce.
   - Place: the report's Round 1 Verification: "`grep -n "loadLocal\|local.ts"` over `feeds.ts`, `json.ts`, `docs.ts` and the test file finds none".
   - My rerun prints `docs.ts:113`, which is a comment. The conclusion it supports (no file of the step calls the reader) still holds, and no decision rests on it.
   - Failure scenario: a reader who reruns the grep sees a hit the report says is absent.

### 3. Standards

1. A head comment states a false fact (spec.md:71).
   - Place: `src/lib/server/edit/feeds/feeds.ts:326-328`: "The front matter is the block the tree's one split, `splitFrontmatter`, finds, the one the LinkedIn view and the preview read".
   - The view reads with `linkedinFrontMatter` (`:179-182`) and the preview with `RenderedMarkdown.svelte:83`, and the run under Spec 1 shows that they differ from it.
   - Failure scenario: a maintainer trusts the comment, changes `splitFrontmatter`, and expects the LinkedIn cards to follow. They do not.
2. The report narrates a wrong turn it backed out of (spec.md:14).
   - Place: Round 1, item 3: "`tests/checks/tree/boundaries.test.ts` does not let `state/` import `data/prose/linkedin-idea`; the run of the list printed `"state/feeds/linkedin.ts imports data/prose/linkedin-idea"`", and the Verification line "The first run was red in `tests/checks/tree/boundaries.test.ts`".
   - Low weight. Also, the boundaries allow list does take shared rules with a stated reason (`boundaries.test.ts:31-45`, for example `data/accounts/leads`), so "would mean an edit to the check's allow list" is no hard block. The design the builder chose, reading the server's mark, has one rule and is sound on its own terms.

Otherwise none. Every file is under its size limit (feeds.ts 766, linkedin.ts 156, feeds.test.ts 741). The history grep is clean, the gate is ASCII clean, prettier, eslint and comment width pass, and no export was added.

### 4. Behaviour

1. A post closed by `...` loses its date and title in the view, and the report does not say so.
   - Place: `feeds.ts:237-241` (`readLinkedinFolder` reads by `linkedinFrontMatter`).
   - Mark posted on an idea whose front matter closes with `...` writes `date: <today>` and `publish: True` and renames the file. `linkedinFrontMatter` finds no block in the result (`view: null` above).
   - The card then lists the post under Posted with its file name as the title and `date` empty. `splitPosts` sorts it last (`linkedin.ts:129-134`), and its snippet is the raw front matter.
   - The report's "added this round" list says only "promoted and dated, the fences kept as written".
   - Failure scenario: at the look on landing, case 13 with a `...` idea shows no date, against the report's before/after.
2. The builder's choice to match the `.md` suffix in any case.
   - Before (base): `xx-foo.MD` was listed with Mark posted, and the press was refused.
   - After: it is promoted to `NN-foo.MD`, dated. This makes the button and the write agree, which item 3 asks for.
   - Consequence the report does not state: the snapshot's last-post reader skips the new post, because `src/lib/data/sources/documents/feeds.ts:128` reads `if (!name.endsWith('.md') || name.startsWith('xx')) continue;`, a case-sensitive suffix. The Update tray (`UpdateTray.svelte:73`) and the notices (`notice-sources.ts:175`) read that `lastPost`.
   - Failure scenario: Mark posted on `xx-foo.MD`. The LinkedIn view shows a post dated today, while the Update tray still counts the days from the older post.
   - My judgment: keep the choice and align the snapshot reader's suffix, or state this consequence. No hub file has a `.MD` suffix today.
3. The builder's choice to stop listing `xx-.md`.
   - Before (base): listed under Ideas, with the press refused. After: not listed at all, and a change to it does not refresh the view (`portfolio.ts:566` uses `isLinkedinFile`).
   - The report states this with before and after. My judgment: acceptable and reversible. A reader who names a file `xx-.md` by hand sees it vanish without a word, and showing it without the button would need a third kind in `splitPosts` and the card.
4. Stated limitation: a sidecar rename that throws after the post was written.
   - The state left is a numbered post, dated, with some `xx-<stem>.<ext>` sidecars still under their old names. Those sidecars are not `.md`, so they are not listed. The error reaches the page, and no History record is made.
   - The base had the same partial state for a throw in its rename loop, and round item 4 names the text write only. So this is stated correctly and not new.
   - Undoing it in full would mean renaming the moved sidecars back and restoring the old text. That is the orchestrator's call whether to require it.
5. Stated limitation: a rename back that throws.
   - Place: `feeds.ts:426`. The rename's error replaces the write's, so the page shows a rename error in place of the cause, such as a full disk. The post stays numbered with the idea's old text and is listed under Posted with the idea's old `date:` (for example 2025-02-12), which reads as a post made on that day.
   - Item 4 says "the error is passed on". This holds except in this double failure, and the report states it. Low likelihood, since it follows a rename in the same folder that just succeeded.

### Declined to judge

- The base-copy run (`Tests  18 failed | 3 passed | 8 skipped (29)`) and the run on the round's starting tree (`7 failed | 13 passed | 9 skipped (29)`). Rerunning either means writing a test file and links into the base copy or the snapshot. I checked by arithmetic only: 20 rows plus the promote test is 21 run of 29, and 20 run of 29 under "marks an idea posted". Both are consistent, and the base regex `[a-z0-9]+` refuses `xx-.md`, which agrees with that row's PASS on base.
- Which test failed in my first run of `feeds.test.ts` with `boundaries.test.ts`. The run was under a load average near 20, the second run passed 40 of 40, and I did not capture the failing name.
- How many times the builder ran the list this round (the report says twice), and whether it ran a whole-suite command. The transcript is not available to me. A second run of the list after a red in `boundaries.test.ts` that the step's own change caused is a fair reading of spec.md:26, though the text names only reds in a file the step changed.
- The G8 Test line for the new rows. `grep -n "linkedin"` over the main checkout's `agents/guarded.md` prints nothing, so the line the report gives is not yet booked. Booking it is landing work.
- The `svelte-kit sync` line `ignoring unknown key(s) self`. It comes from the base predating O84's reader of that key, so it is not the step's. I did not read the file it names.

Reviewer usage: aaadd9a0ced9cd29d, claude-opus-5-5, 198815 tokens, 58 tool uses, 20 min 46 s

## Closed

First review:
- Spec 1 (`docs/templates.md:671`): no change. Line 666 tells a reader of the page what the task does; line 671 is the template's own instruction, which the task runner reads in the hub's task file and which the hub's file carries the same way (builder choice 7). The two sentences reach different readers.
- Standards 1 (the case-run folders): closed in repair round 1, item 5; the round-1 reviewer's `ls -d` printed "No such file or directory" for the three folders.
- Standards 2 (no reuse of the tree's split): closed in repair round 1, item 1 (`splitFrontmatter` reused).
- Standards 3 and Behaviour 1 (report omissions): closed in repair round 1, item 6.

Repair round 1:
- Spec 1, Standards 1 and Behaviour 1 (the view and the write read the front matter by different rules; the head comment of `postedText` false; a post closed by `...` losing its date in the view): fixed at landing. `linkedinFrontMatter` reads its block through `splitFrontmatter`, so the view lists a front matter exactly where Mark posted can date one; the head comments of both functions say so. New rows 'the LinkedIn view reads the front matter Mark posted can date, and no other' (a `...` closer read; a blank line before the fence and a byte order mark not read), red on the round's code: `expected undefined to be '2026-10-27'` and `expected '2025-02-12' to be undefined`. The research hub's 20 LinkedIn files each open with `---` and a newline (`head -c 4 | od -c` over each), so no hub card changes.
- Spec 2 (the first review's Spec 1): closed above.
- Proof 1 (a file-scope mutable in the test): fixed at landing. The mocks wrap the real `writeTextAtomic` and `renameSync` in `vi.fn`; a row sets a one-off implementation and `mockReset` in `finally` restores the real one. No holder of the test's own remains.
- Proof 2 (a quoted grep that does not reproduce): a report sentence; the conclusion holds (no file of the step calls the local reader), and no decision rests on it. Recorded here, no change.
- Standards 2 (the report narrates a wrong turn): a report sentence; no change to the code follows from it.
- Behaviour 2 (`.MD` posts skipped by the snapshot's last-post reader): fixed at landing. `src/lib/data/sources/documents/feeds.ts` reads the suffix in any case, as the view and Mark posted do; new row "takes the newest posted date, a post whose suffix is .MD among them and an idea's left out" in `tests/data/sources/feeds.test.ts`, red on the round's code: `expected { lastPost: '2026-08-20' } to deeply equal { lastPost: '2026-09-02' }`.
- Behaviour 3 (`xx-.md` no longer listed): stated in the report with before and after; it follows round item 3's one rule. No change.
- Behaviour 4 (a sidecar rename that throws after the post is written leaves a partial promotion): fixed at landing. `putIdeaBack` renames the moved sidecars back, writes the post's old text back and renames the post back, for a throw of the write or of any sidecar rename. New row "a sidecar that cannot be renamed after the post's text is written", red on the round's code (the folder held the numbered post).
- Behaviour 5 (a rename back that throws replaces the write's error): fixed at landing. Each step of `putIdeaBack` runs whatever the one before did, and the error that stopped the promotion is the one passed on.
