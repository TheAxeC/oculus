# Brief check of O94 (brief `.scratch/migration/agents/briefs/O94.md`, main at 27f4e04fc)

## Names

Command: `grep -rn --exclude=local.yml "linkedin-post\|markLinkedinPosted\|markpost_tip\|markpost\b\|post_no_front_matter\|post_needs_idea\|post_exists" src tests config docs README.md utils bin`, plus `grep -rn --exclude=local.yml -i "mark posted\|markpost\|next number\|post nudge\|linkedin_cadence\|rename.*xx-\|xx-.*rename" src config docs README.md` and `grep -rn ... "says whether a post is due\|days since the last post against\|rename the file to the next\|Bump cadence\|One file per post in"`.

These hits are outside "Paths this step writes":

1. `src/lib/server/edit/feeds/feed-route.ts:39`, `:175`, `:177`. These lines are the import, the call and `kind: 'linkedin-post'`. The change keeps them true.
2. `src/lib/server/edit/writes/bodies.ts:187`, `:395`, `src/lib/server/edit/writes/apps/gate.ts:82`, `src/lib/data/helpers/files/apps/apps.ts:145`, `:190` (CONFIRMED_WRITES) and `src/lib/state/system/apps/words.ts:49`, `:59`. These hold the kind's name and its keys, and the change keeps them true.
3. `src/lib/state/sessions/source/write-files.ts:227`. It names the idea's path, so a write is refused while a source tab holds unsaved text of the idea. The change keeps it true. It matters more after the step, because the write now changes the text.
4. `src/lib/state/client/writes.svelte.ts:519-520`: "Rename one LinkedIn idea ... and its same-basename sidecars as the next numbered post". This is not false, but it no longer says everything the write does.
5. `src/lib/state/shared/stores/shapes.ts:375`: "Promote one LinkedIn idea ... to the next numbered post." This is not false, but it no longer says everything the write does.
6. `src/lib/views/feeds/linkedin/PostCard.svelte:4-5`, `:49-50`. These read the keys, and the change keeps them true.
7. `docs/apps.md:451`: "| `linkedin-post` | `{ kind, id }`; `id` the idea's id | yes, no undo |". This stays true.
8. `docs/HELP.md:105` ("Last post:" for LinkedIn) and `docs/HELP.md:302` ("a LinkedIn post Mark posted while an idea"). Both stay true.
9. `config/defaults/behavior.yml:57`, `config/options/behavior.yml:178-180` and `config/text/app.yml:293` ("draft a post from _linkedin/"). These are about the view's cadence line and the task's note, and all stay true.
10. `tests/routes/hubs/hub-writes.test.ts:251`, `:519`, `:535`, `:572` and the route fixture `tests/routes/edit/write-fixture.ts:96`. The fixture writes `'---\ntitle: "Route idea"\ncategory: research\ndate: 2026-09-12\n---\n\n'`, which has a front matter, so the route rows still hold. These files are only run, not changed.
11. `server.feeds.post_no_front_matter` has no hit anywhere, so the new key collides with nothing. `post_exists` and `post_needs_idea` appear only at `config/text/server.yml:336-337` and in `feeds.ts`.
12. The task template's step words appear only in `docs/templates.md:666`, `:669`, `:675`, `:679`, `:689`. These lines are inside the write list, but two places stay false after the step:
    - `docs/templates.md:669` reads "# LinkedIn: post nudge and draft". Item 3 says "Nothing else of the template changes", which keeps a title that names the cadence nudge after step 1 is removed.
    - The hub file `~/workspace/research-hub/.oculus/tasks/linkedin.md:1` has the same title, and item 4 says "every other line kept word for word".
    - The rule that a sentence the change makes false is a defect (spec.md:71) applies to both, and the brief dictates that they be kept.
13. Two lines in a file the step writes, outside its line range:
    - `config/text/views/apps/apps.yml:67` and `:74` read `linkedin-idea: Move a LinkedIn idea, asking you first.` and `move a LinkedIn idea`. Both are false today: the kind adds an idea (`feed-route.ts:162`, `addLinkedinIdea`).
    - This step does not make them false. They sit next to its lines 68 and 75, and the write list names only those two lines.
14. `config/text/views/feeds/linkedin.yml:24` reads `ontrack: last post {0}d ago - on track`. It keeps a spaced hyphen in a file the step writes, and verify item 5 (`grep -n " - "`) prints it.

## The step line

`grep -n "O94" .scratch/migration/plan.md` gives line 850: "the LinkedIn view's Mark posted also writes `date:` as the day it is pressed and `publish: True`, and `.oculus/tasks/linkedin.md` keeps only its drafting steps, its cadence and rename steps removed (ruling 478) (ruling 480) (ruling 482)".

- "writes `date:` as the day it is pressed": item 1 (`localDate(Date.now())`), cases 1 to 4 and 6.
- "and `publish: True`": item 1, cases 1, 2 and 6.
- "`.oculus/tasks/linkedin.md` keeps only its drafting steps": item 4 for the hub's file and item 3 for oculus's template of it.
- "its cadence and rename steps removed": items 3 and 4 (steps 1 and 5 removed, the Finish lines).
- Ruling 478 (a): served by all of the above. Rulings 480 and 482 only schedule the step (`plan.md:2877`, `:2879`).
- Item 2 (the words) and the HELP.md part of item 3 serve the line through spec.md:71, which asks for the docs and the catalog to follow the behaviour.
- Every part of the line has a requirement.
- There is no Goal section in `plan.md`. `grep -n "^## " .scratch/migration/plan.md` prints only Steps, Could run in parallel, Rulings, Agents and Blocked. The opening paragraph names `tools/oculus/DESIGN.md`.
- The brief misquotes the line's references as "(ruling 478)(480)(482)". This does not change the work.

## Premises

Each command was rerun on main:

- Line 850: holds.
- `wc -l src/lib/server/edit/feeds/feeds.ts` prints `675`. The doc comment is at :308 and the function at :309-359 (`grep -n`). The behaviour is as described in `sed -n 300,362p`. Holds.
- `grep -rn "linkedin-post\|markLinkedinPosted" src` gives feed-route.ts:175, writes.svelte.ts:523 and PostCard.svelte:49-50. Holds.
- `linkedin.yml:18` reads `markpost_tip: mark posted - rename xx- to the next number`. `apps.yml:68` and `:75` are as quoted. Holds.
- The stub (`linkedin-idea.ts:6-15`), `feeds.ts:289` and `dates.ts:14`: hold.
- Hub ideas, partly wrong:
    - Ten `xx-*.md` files: holds.
    - "each front matter holds `publish:` on its line 4 and `date:` on its line 5" does NOT hold. `sed -n 4p` prints `category: ...` and `sed -n 5p` prints `publish: ...`; `publish` is on line 5, `date` on line 6, and the closing `---` on line 7 (awk).
    - Eight files have `publish: True` with `date: 2025-02-12`, and two have `publish: False`. Holds; the two False files are dated 2026-08-04 and 2026-08-11.
    - `grep -lc $'\r' *.md` prints nothing (exit 1), and no file starts with `ef bb bf`. Holds.
- Fixture at `feeds.test.ts:82-85` and the row at `:122-144`: hold.
- Route rows at `hub-writes.test.ts:250-254`, `:515-545`, `:571-572`: hold.
- `FRONT_DATE` at `src/lib/data/sources/documents/feeds.ts:45`: holds.
- "the website does not filter on `publish`" holds, and the fact is stronger: the website's `_config.yml:16-17` reads `linkedin:` / `output: false   # repo-only history`, so no LinkedIn file is rendered at all. That makes the reason in Decision 3 ("not one the website renders as a post") false: the website renders no LinkedIn file, with or without a front matter.
- `docs/templates.md:664` is the heading and `:692` is `## project.yml`, so the range takes one line of the next section. `docs/HELP.md:332`: holds.
- Hub task file: steps 1 to 5 and the Finish "End with the cadence line ...". Holds.
- `sed -n 61,62p .scratch/migration/agents/guarded.md` is G83 and covers only the config.yml, local.yml and project.yml blocks. Holds.
- `ls -d docs/adr` prints "No such file or directory". Holds.
- `sed -n 6,9p .scratch/migration/orchestrator-state.md` gives `verify: - npm run test:quick`. Holds.

## Cases and checks

1. Rules file and brief disagree:
    - spec.md:73 says a write that edits a file's text re-parses its own result and refuses when the result is not what was asked. Neither item 1 nor any case asks for this.
    - Nothing says what is parsed (the new front matter's `date` and `publish`), when (before any file moves, under item 1's fifth bullet) or with which refusal sentence (no catalog key is named).
2. spec.md:69 forbids a wall-clock margin. Reading the day in the test with `localDate(Date.now())` races across midnight against the write's own read. Cases 1 to 4 and 6 should fix the day with `vi.setSystemTime`; the brief leaves it to the builder.
3. Case 1's expected text is ambiguous.
    - Item 1 replaces the fixture's `date:` in place (line 4) and adds `publish: True` after it, before `---`. The result is `---\ntitle: "Easy problems"\ncategory: research\ndate: <today>\npublish: True\n---\n\nIdea body.\n`.
    - The case says "holds `publish: True` and `date: <today>` before its closing `---`", which can be read as both lines being added.
4. Item 1's second bullet ("a key the front matter lacks is added ..., `publish` before `date`") has no case. No case lacks `date:`, and no case lacks both keys, so the order of the two added keys is never checked.
5. Item 1's fourth bullet refuses "a front matter with no closing `---`". No case covers it; case 5 covers only a first line that is not `---`.
6. Case 6 gives the same outcome as case 2 (both lines set in place). Under spec.md:59 ("one row per input that gives a different outcome") it is a row of its own only because the bytes come out equal. This is a judgment and is kept as a note.
7. Case 7 is current behaviour and is green on the unchanged tree; the brief does not claim it red. It is consistent with the rules.
8. Case 8 runs `tests/routes/hubs/hub-writes.test.ts`, a file the step does not change. That is a run, not a change, and the route reaches the changed code, so it is consistent.
9. Case 9 is the look on landing on a scratch hub, consistent with spec.md:60 and :64.
10. Verify item 6 points at "the standards pages' rules on list items and sentence length". `.agents/plan.yaml` has `standards: [.scratch/migration/agents/spec.md]`, and spec.md has no rule on list items or sentence length, so the check has nothing to read against.

## The question

Could each of these pass without the goal being reached?

- **Case 1:** yes, if the row asserts with `toContain`, since duplicated or misplaced lines would pass. Only an exact `toBe` of the whole text closes this, and the case does not demand it.
- **Case 2:** no, if "the file's other bytes equal" is asserted as whole-text equality. With a partial assert, the same as case 1.
- **Case 3:** yes, if only the date value is checked and not the line's unquoted form.
- **Case 4:** no, since the body line and the front matter are both checked.
- **Case 5:** no; the names and the absence of the `NN-` file are checked.
- **Case 6:** yes. A write that never edits text passes it, but that write fails cases 1 to 3, so the set holds.
- **Case 7:** no.
- **Case 8:** yes. The route rows check only file names (`hub-writes.test.ts:252-254`, `:540-543`), not text. They guard routing and are not meant to prove dating.
- **Case 9:** no. The Posted list shows the front matter's date, and an undated rename would show 2025-02-12.
- **The step-line check:** the hub task file (item 4) is checked by no command before landing, only by reading the Doc text. It passes without the goal if the orchestrator does not write it at landing. See Declined to judge on the hub commit.
- **Item 1:** see cases 1 to 6. The re-parse of spec.md:73 can be absent and every case still pass.
- **Item 2:** verify 5 checks only that the tip line has no " - "; the words themselves are checked by reading and the look. Yes, any words without a spaced hyphen pass.
- **Item 3:** reading only. Yes, the title at templates.md:669 stays false, and the brief dictates that.
- **Item 4:** reading only, with the same title problem at line 1 of the hub file.
- **Verify 3** passes with weak rows (see case 1). **Verify 4** is a fact. **Verify 6** passes trivially (Cases and checks, point 10).

## Implied inputs

1. **A name with capitals.** This has happened. The hub holds `xx-leadingAIinHealth.md`. Testing it with node against `/^xx-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/` prints `false`.
    - The card draws Mark posted, because `splitPosts` uses `file.startsWith('xx-')` (`src/lib/state/feeds/linkedin.ts:106`).
    - The press is then refused with "A LinkedIn post must name an xx-*.md idea.", which is false for that file.
    - This is not caused by this step and is outside its line. I report it because the button the step changes fails on a real idea.
    - Expected: the idea is accepted, or the refusal names the lowercase rule.
2. **Write to a new name, then remove the idea.**
    - `writeAtomic` passes no mode for a new file (`src/lib/server/core/json.ts:150-160`), so the post takes the umask's mode rather than the idea's.
    - If the removal fails after the write, both `xx-` and `NN-` exist, and the view lists the post twice: once as an idea, once as posted.
    - The order of the text write against the sidecar renames is not stated.
    - Expected: an order that leaves no duplicate. For example: rename the idea with `renameSync`, then `writeTextAtomic` the target in place (which keeps the mode), then rename the sidecars. A failure part-way then leaves an undated numbered post, which is said in the report.
3. **A `publish:` line.** The match must be the key `publish:` and not the prefix `publish`, or Jekyll's own key `published:` would be replaced.
    - Expected: only a line whose key is exactly `publish` or `date`, at column 0, is replaced.
    - An indented `date:` under a nested map is not a front matter key and stays.
    - The brief does not say "column 0".
4. **Line ends.** None of the hub's files has a CR (premise), so this has not happened.
    - Expected, unstated: a CRLF file's first line `---\r` counts as `---`, and each replaced or added line ends with the file's own line end.
    - A wrong answer refuses the file or mixes line ends.
5. **A byte order mark before `---`.** This has not happened. Expected, unstated: refused as having no front matter, or accepted with the mark kept.
6. **A second press.** A double press sends the old `xx-` id after the first press has renamed the file. `existsSync(source)` is false, so the route answers 404 with `server.write_route.no_idea_file` (`feed-route.ts:176`) and nothing moves. This is current behaviour and needs no case.
7. **Date form.** `localDate` writes `YYYY-MM-DD`, unquoted, as the stub does. A `date:` with a time (`2025-02-12 10:00:00 +0100`) is replaced whole by the day. This is consistent with item 1's "replaced whole"; a trailing `# comment` on a replaced line is lost the same way.
8. **Two `date:` lines in one front matter.** Unstated whether each is replaced. This has not happened, and the cost is low.
9. **Re-parse (spec.md:73).** See Cases and checks, point 1. The input is a front matter that is not valid YAML. No idea in the hub has one, but the brief names no answer for it.

## ADRs

`ls -d docs/adr` prints "ls: docs/adr: No such file or directory". There are no records in force, so none is touched.

## Dictated text

1. `grep -n "no front matter to date" .scratch/migration/agents/briefs/O94.md` gives line 31: "The LinkedIn idea has no front matter to date."
    - ASCII, no dash, no quip: holds.
    - Plain words: breaks. "to date" reads as the idiom "so far". The sentence is also said for a file that opens a front matter but never closes it.
2. `grep -n "dated today and published" ...` gives line 34: `Rename to the next number, dated today and published`.
    - ASCII and the spaced-hyphen removal: hold.
    - Plain words: breaks. "published" says the press publishes, but it only sets `publish: True`, and the website builds nothing from the folder (`_config.yml:17` `output: false`). The participles "dated today and published" also have no subject after the imperative.
3. `grep -n "Mark a LinkedIn post posted" ...` gives line 34: `Mark a LinkedIn post posted, asking you first.` and `mark a LinkedIn post posted`.
    - ASCII, no dash, no quip: holds.
    - Plain words: weak. The write takes an idea (`docs/apps.md:451` "`id` the idea's id"), and "post posted" repeats the word. In `apps.yml:84` it reads "The app {0} asks to mark a LinkedIn post posted: {2}".
4. `grep -n "Mark posted on an idea renames" ...` gives line 35: "Mark posted on an idea renames it to the next number and sets its `date:` to the day you press it and `publish:` to `True`." Holds.
5. `grep -n "End with the path of any file written" ...`:
    - Line 35, "End with the path of any file written.": holds.
    - Line 36, "End with the path of any file written or refreshed.": holds. It matches the hub step 4's "write/refresh".
6. The opening sentence of the template (line 35) and the reworded hub sentence (line 36) are described but not dictated, so there is no text to check.
7. Lines kept word for word that become false: `templates.md:669` and the hub file's line 1, "# LinkedIn: post nudge and draft". These are kept by items 3 and 4 although the nudge step goes; see Names, point 12.

## Declined to judge

- Whether the hub commit at landing is covered by the "Plan commits" ruling (`plan.md:2744`). That ruling names "a landing" commit of this plan. Rulings 462 and 470 each say "in a hub commit" explicitly, and ruling 478 does not. O68's hub rewrite waited for Axel's word (`plan.md:716`, open item 322). This is a ruling for the orchestrator or Axel, not a fact I can settle.
- Whether the new tip should start in lower case like its siblings (`linkedin.yml:7`, `:10`). spec.md has no rule on the case of a tip.
- Case 9's look: I run no page.

Usage: a0b48bbc141e6efce, claude-opus-5-5, 183761 tokens, 49 tool uses, 8 min 7 s.

## Closed

- Names 4, 5: item 1's last bullet rewrites both comments; the paths gain `writes.svelte.ts` 518-521 and `shapes.ts` 375.
- Names 12, Dictated 7, Question items 3 and 4: the template and the hub file are titled `# LinkedIn: draft a post` (items 3 and 4).
- Names 13: item 2 rewords `linkedin-idea`'s two apps words; the paths gain `apps.yml` 67 and 74.
- Names 14: item 2 rewords `ontrack`; verify 5 prints nothing.
- Premises (line numbers): the premise gives `publish` on line 5 and `date` on line 6, the function at 309-359 and the template range 664-691; the paths say 664-691.
- Premises (website), Decision 3: the premise states that nothing reads `publish:` and the website renders no LinkedIn file; decision 3's reason rewritten.
- Cases and checks 1, Implied 9: item 1 re-parses the new front matter before any file moves and refuses with `server.feeds.post_not_dated`.
- Cases and checks 2: every row fixes the day with `vi.setSystemTime`.
- Cases and checks 3, Question cases 1 to 3: every row asserts the whole text with `toBe`; case 1 gives the exact text.
- Cases and checks 4: case 8 (neither key). Cases and checks 5: case 9 (no closing line).
- Cases and checks 10: verify 6 reads against the rules file's prose rules.
- Implied 1: item 1 accepts the view's rule for an idea's name; case 10; decision 7.
- Implied 2: item 1 renames first, writes in place, then the sidecars; decision 8.
- Implied 3: item 1 matches the exact key at column 0; case 11.
- Implied 4, 5: decision 9 and item 1 (a byte order mark refused as no front matter).
- Implied 8: item 1 replaces each such line.
- Dictated 1, 2, 3: the refusal, the tip and the apps words reworded (items 1 and 2).
- Declined (the hub commit): the hub commit of the task file is part of O94's landing, under the ruling "Plan commits" (a landing's commits), as the hub commits of O55, O63, O68 and O79 at their landings were; ruling 478 names the file's change.
- Declined (tip case): the tip starts in lower case as its siblings do (decision 6).
