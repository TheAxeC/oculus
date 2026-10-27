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
