# Step O143 brief check (on main at 6e6749703)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O143.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Head: `git log -1 --oneline` printed `6e6749703 Book rulings 667 to 669 as steps O141 to O143`. `plan.md` has no `## Goal` section: `grep -n '^## ' .scratch/migration/plan.md` printed only `5:## Steps, in execution order`, `1673:## Could run in parallel`, `1686:## Rulings`, `3531:## Agents` and `4354:## Blocked, and by what`. The plan's opening paragraph names its goal as "Execution ledger for `tools/oculus/DESIGN.md`". For check 5, "the goal" is therefore taken from the step line (`plan.md:1671`) and the Rulings line of open item 669 (`plan.md:3528`): oculus knows `stopped` as an entry Axel stopped pursuing (grey, closing its deadline), and the Funding template offers it.

## 1. Names

- The new key `statuses.stopped`: `git grep -n -w -e 'stopped' -- config docs README.md ':!config/local.yml'` and `git grep -n -e "'stopped'" -e '"stopped"' -- src`. The hits relevant to a status word:
  - `config/catalogs/vocab.yml:52`: the stages comment "(accepted to stopped)". It describes `stages:`, a different list, so the change does not make it false.
  - `config/catalogs/vocab.yml:77`: `stopped:      { label: "stopped (dropped or abandoned)", icon: trash, color: "#9ca3af", dead: 2, terminal: true, dead_end: true }`. This is the project stage, a different list; it stays true.
  - `docs/templates.md:376`: `#     stopped: null`. This is the hub stages example; it stays true.
  - The `src` hits are build, lint, debug and session states (`src/lib/state/sessions/latex/latex-state.ts:148` and others). None of them reads `statuses:`.
- The Funding template's options and any list of the statuses in words: `git grep -n -e 'withdrawn' -- config docs src tests README.md ':!config/local.yml'` and `git grep -n -e 'not-applied' -e 'in-prep, planned' -e 'contributing, awarded' -e '\bawarded\b.*\brejected\b' -- config docs src tests README.md ':!config/local.yml'`. The hits outside the brief's paths:
  - `docs/templates.md:1436-1437`: `#    status: in-prep              # required: in-prep, planned, submitted, contributing,` / `#                                 # awarded, rejected or withdrawn`. This is the entry comment of the same Funding template. It lists the allowed statuses in words, and the change makes it false, because it leaves out `stopped`. It is outside "Paths this step writes" (`docs/templates.md line 1407`). It also contradicts "What to build" item 2, "No other line of the template changes". Item 3 would make the builder widen the paths to cover it, so the brief contradicts itself. This block is the text the Files view's make item writes into a new hub's `funding.yml` (`src/lib/data/sources/documents/templates.ts:22` `export const TEMPLATES_PAGE = 'docs/templates.md';`, `src/lib/server/files/project/make.ts:22`), so the stale comment would reach new hubs.
  - `docs/templates.md:1565` and `:1583`: the Applications options and their comment. Both stay true under C6.
  - `tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml:8`: `options: [in-prep, planned, submitted, awarded, rejected]`. This is a fixture's own schema, which already lacks `withdrawn` and `contributing`. The change does not make it false.
  - `tests/data/snapshot/schema-rules.test.ts:223-292`: the closest-word rows. The test reads the real `vocab.yml` (`:34 const LOADED = loadConfig(engineDir()).config;`). A recomputation with `python3 -c` of `closestWord` over the `statuses:` keys, with and without `stopped` placed after `not-applied`, gave the same closest word for every row: `'acepted' accepted accepted`, `'pased' paused paused`, `'In Prep' in-prep in-prep`, `'not applied' not-applied not-applied`, `'under review' under-review under-review`, `'canceled' cancelled cancelled`, `'xyz' None None`, `'scope' None None`, `'zzzz' None None`. The change does not make any row false.
  - `docs/HELP.md:562`, `:565` and `docs/data-map.md:104`, `:226` describe `statuses:` without listing its words, so they stay true.

Findings:
- `docs/templates.md:1436-1437`, the Funding template's entry comment listing the statuses ("awarded, rejected or withdrawn"), becomes false. Neither item 2 nor the write list includes it, and item 2 forbids changing it.

## 2. The step line

- "`config/catalogs/vocab.yml` `statuses:` gains `stopped: { color: "#9ca3af", closes_deadline: true }`": item 1.
- "the colour and flag of `not-applied`": item 1, and Decision 1. The `default_application` flag of `not-applied` is explicitly excluded, which matches the step line's literal value.
- "for an entry Axel stopped pursuing": the brief's opening paragraph (line 7). It is meaning, so no requirement is needed.
- "oculus's Funding template (`docs/templates.md:1407`) lists it after `withdrawn` in the options": item 2.
- "as the research hub's `.oculus/data/academic/funding.yml:11` does": a premise (line 13) and C5.
- "the Applications options keep `not-applied`": C6, with no item of "What to build". A case that guards an absence is enough here.

Findings: none.

## 3. Premises

- `grep -n stopped config/catalogs/vocab.yml` printed two hits, `52:# The stages a project's work is at, ...` and `77:  stopped:      { label: "stopped (dropped or abandoned)", ... }`. The brief says it "hits only the project stage at `:77`". Both hits are in the stages section, so the substance holds, but the output has a second line at `:52`.
- `statuses:` at `:109-157`: `grep -n '^statuses:\|^  offered:'` printed `109:statuses:` and `156:  offered: ...`. Line 157 is blank (`sed -n 157p ... | cat -e` printed `$`), so the list is `:109-156`.
- The flag comment at `:100-108`: the comment opens at `101:# The statuses a collection entry's status takes...`, and line 100 is blank (`$`), so the comment is `:101-108`. Its words match the brief's paraphrase (`:102` `closes_deadline`, `:103` `deadline_met` and the awaiting box, `:101` the closest-word finding).
- `:145` `withdrawn:     { color: "#475569", closes_deadline: true }` and `:146` `not-applied:   { color: "#9ca3af", closes_deadline: true, default_application: true }`: both match.
- `grep -n '9ca3af' config/catalogs/vocab.yml` printed `48:  "#9ca3af": c-grey`, `77` (stage stopped), `123` paused, `146` not-applied, `147` not-attending, `148` cancelled, `149` past, `150` skipped, `151` passed, `153` archived, `188`, `276` and `297`. This matches the brief.
- The hub's `funding.yml:11` (`sed -n 11p`) reads `options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn, stopped]`, and `grep -n stopped` gives `56:    status: stopped` and `69:    status: stopped`. These match the working tree. All three lines are uncommitted in the hub: `git diff .oculus/data/academic/funding.yml` shows them as added lines, and `git show HEAD:.oculus/data/academic/funding.yml | grep -n stopped` gives only the note at `:50`. The brief does not say that "the research hub already writes it" holds only for the hub's uncommitted working tree.
- `docs/templates.md:1407` (`grep -n`) reads `options: [in-prep, planned, submitted, contributing, awarded, rejected, withdrawn]`: it matches.
- `docs/templates.md:1565` reads `options: [active, applied, interview, offered, accepted, not-applied, declined, rejected, withdrawn]`, and the hub's `applications.yml:9` gives the same list. The hub's `applications.yml` has no `status: stopped` (`grep -c` printed `0`). Both match.
- `ls docs/adr` printed `ls: docs/adr: No such file or directory`: it matches.
- The read range "the Funding template (:1395-1440)": `grep -n '^```'` gives the block's fences at `1399` and `1451`, and the heading is at `1397`. Line `1395` is the closing fence of the statements block. The range misses `1441-1451`.
- The palette range `:10-50`: `palette:` is at `:10` and its last row `"#475569": c-slate` is at `:50`. It matches.
- The brief's line 7 says the entries carrying `stopped` "stay on the deadline radar". Reading the hub's stopped entries with `python3 -c` (`yaml.safe_load`) printed `2026-fwo-senior-stopped-meyfroidt ['date', 'key', 'lead', 'link', 'meta', 'note', 'status', 'sub', 'tags', 'title']` and the same keys for `2026-fwo-senior-stopped-stalmans`. Neither entry has a `deadline`, a follow-up or a subtask, so neither is on any radar line before or after the step (`src/lib/state/boards/ticker.ts:293-294`: `daysUntil(isoOf(scheme.deadline), now)` returns null, and then `continue`).
- What the code does today with a status `statuses:` does not hold:
  - Colour: `statusTone` gives `UNKNOWN_TONE` when the word is missing (`src/lib/state/shared/words/tones.ts:229-231`), and `UNKNOWN_TONE = 'grey'` (`:34`). After the change, `toneOf("#9ca3af")` goes through `palette` `"#9ca3af": c-grey` (`vocab.yml:48`, `tones.ts:198-215`) to `grey`. The tone drawn on the entry card (`src/lib/views/shared/forms/entry/card/EntryCard.svelte:286`, `:303`) and on the collection bar slice (`src/lib/state/boards/collection/bar.ts:470`) is `grey` before and after. The brief's "drawn with no colour of their own" is literally true, but there is no visible colour change.
  - Deadline radar: `closesDeadline` and `deadlineMet` are false for an unknown word (`src/lib/data/shapes/vocab-keys.ts:188`, `wordsWith(...).includes(word.trim().toLowerCase())`). A scheme with a deadline inside `deadline_horizon_days` is therefore listed (`ticker.ts:290-294`), and so are its due follow-ups (`ticker.ts:441`) and its subtasks (`ticker.ts:502`).
  - Awaiting box: `deadlineMet` is false, so the scheme is not listed (`src/lib/state/boards/focus.ts:708`, `src/lib/state/boards/focus/filter.ts:628`). This is the same result as after the change.
  - Finding: `checkEntryStatus` (`src/lib/data/snapshot/validate.ts:262-279`) gives `findings.validate.status_not_in_vocab`, `'status {0} is not a word of the statuses list; the closest word is {1}'` (`config/text/findings.yml:372`). The same `python3 -c` computation of `closestWord` gave `[('dropped', 2), ('skipped', 2)]` within the bound of 3, so the base finding names `dropped`, the first in the list's order.

Findings:
- Line 7's "stay on the deadline radar" is false for the hub's two stopped entries, which carry no deadline. The base result holds only for an entry that has a deadline inside the horizon.
- The colour premise is incomplete: the tone is `grey` before and after, so neither the Funding view nor the radar shows a difference for the hub's two entries. The only change those entries show is that the finding naming `dropped` disappears. The report part at line 78 ("before and after ... on the Funding view and the deadline radar") asks for a difference that will not appear, and the look at landing would search for it.
- `grep -n stopped` prints `:52` as well as `:77`.
- `statuses:` is `:109-156`, and the comment is `:101-108`.
- The Funding template read range should be `:1397-1451`.
- The hub's `stopped` lines exist only in its uncommitted working tree.

## 4. Cases and checks

- C1: consistent with the rules file (spec.md "What every package obeys", case-run program).
- C2: inconsistent in two places.
  - It offers "or by the test that covers `closes_deadline` run with the word". `git grep -ln -e closes_deadline -e closesDeadline -- tests` printed nothing, so no such test exists. Running a test "with the word" would also mean changing a test, which the brief's line 64 and spec.md "What every package obeys" (the test rule) forbid.
  - "a deadline in the future" gives the stated base result ("on the base it is on it") only for a deadline inside `deadline_horizon_days` (`ticker.ts:200`, `:294`).
  - C2 asks the builder to run `ticker.ts`, which the step does not change. It runs that code over the changed `vocab.yml`, so it checks the step's own effect. That use is consistent.
- C3: consistent. It runs `validate.ts`, which the step does not change, over the changed list. That is the step's effect. The base result could name its word: the finding names `dropped`.
- C4: consistent with the rules. It runs the unchanged awaiting-box code over the changed list. It gives no base result, unlike C1 to C3, and its base result is the same as the after result (see check 5).
- C5: consistent, but it reads line 1407 only and leaves the stale comment at `:1436-1437` (check 1).
- C6: consistent.
- Decision 2 cites "the rules file's test rule calls for none for a word added to a list". spec.md "What every package obeys" says a test exists only as the test of an entry of `agents/guarded.md`, and that a builder writes no other test. It says nothing about "a word added to a list". The conclusion (no new test) holds; the paraphrase does not.
- Verify item 3 runs the ASCII check over `config/catalogs/vocab.yml` only. spec.md "Verify before you report" asks for the check over every file touched, and the step also writes `docs/templates.md`.

Findings:
- C2's alternative proof names a test that does not exist and implies changing a test.
- C2's input needs "a deadline inside `deadline_horizon_days`, or overdue".
- C4 needs its base result stated.
- C5 should also cover the entry comment at `:1436-1437`.
- Verify item 3 omits `docs/templates.md`.
- Decision 2 misstates the test rule.

## 5. The question

- C1: no. The key's value is read after the change and its absence on the base.
- C2: as written, it could fail to show the contrast. With a deadline past the horizon, the entry is off the radar on the base too, so the case passes after the change without telling `stopped` apart from an unknown word. With an input inside the horizon, the answer is no.
- C3: no, provided the run uses oculus's `statuses:`. A run against a hub whose own `.oculus/config.yml` adds `stopped` would show no finding on the base as well (not verified for the research hub; see "Declined to judge").
- C4: yes. An unknown status is outside the awaiting box on the base (`focus.ts:708`), so C4 passes on the unchanged tree. It guards item 1's "no `deadline_met`" and proves nothing the step adds.
- C5: no for line 1407. It does not reach the entry comment at `:1436-1437`, so the template could still describe its statuses wrongly while C5 passes.
- C6: yes. It passes on the base, as a guard of an absence should.
- The verify list:
  - Item 1 (three vitest files) and item 4 (`yaml.safe_load`, which printed `ok` on the base) pass on the unchanged tree. They prove that nothing broke, not that the goal was reached.
  - Item 2, `test:quick`, is the same kind of check.
  - Item 3 skips `docs/templates.md`.
  - The step's line has no check of its own; the goal rests on C1, C2, C3 and C5.
- Item 3 of "What to build" could pass with a grep pattern too narrow to find `:1436-1437`, because the brief gives no pattern.

Findings:
- C2's input must be inside the horizon.
- C4 passes on the base.
- C5 misses `:1436-1437`.
- Item 3's grep has no pattern. Naming the patterns `withdrawn`, `not-applied` and `rejected or withdrawn` would close this.

## 6. Implied inputs

This is a product configuration step that the code reads, so the inputs below apply.

- A stopped funding scheme with a due follow-up or an open subtask: missing. On the base, both are radar lines (`ticker.ts:441`, `:502` skip only when `closes_deadline` holds without `live_subtasks`). After the change, neither is listed. A wrong answer here leaves nagging lines for work Axel has stopped.
- A deadline inside versus past the horizon: missing (C2, check 5). The expected result is that inside the horizon the scheme is listed on the base and not listed after.
- A hub made by the Files view's make item: missing. Its `funding.yml` is written from this template block (`src/lib/server/files/project/make.ts:22`). The expected result is that the written `status` options end `withdrawn, stopped]` and the entry comment names `stopped`.
- The tone of a stopped entry: missing. The expected result is `statusTone('stopped')` = `grey` before and after (check 3).
- A status written `Stopped` or ` stopped `: not needed. The radar trims and lowercases (`vocab-keys.ts:188`), while the vocabulary check compares the word as written (`validate.ts:253`) and would name `stopped`. The hub writes the word in lower case, so this input has not happened.

Findings:
- The follow-up and subtask input, the horizon input, the make-item input and the tone input are missing from "Cases", each with the expected result above.

## 7. ADRs

- No record. `ls docs/adr` printed `ls: docs/adr: No such file or directory`. `grep -n -w 'adr' .agents/plan.yaml .scratch/migration/orchestrator-state.md` printed nothing, so the configuration names no `adr` folder.

Findings: none.

## 8. Dictated text

- `stopped: { color: "#9ca3af", closes_deadline: true }` (`grep -n 'stopped: { color' .scratch/migration/agents/briefs/O143.md`, line 19): holds. It is ASCII, matches the step line and ruling 669, and uses the palette's grey.
- `[in-prep, planned, submitted, contributing, awarded, rejected, withdrawn, stopped]` (`grep -n 'withdrawn, stopped\]'`, lines 13 and 31): holds. It matches the hub's `funding.yml:11`.
- "Everything in the brief is done" (`grep -n 'Everything in the brief is done'`, line 70): holds. It is spec.md "Report"'s own wording.
- The brief dictates no words for the entry comment at `:1436-1437`. If the session adds them, they need the same hold.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O143.md` printed nothing.

Findings: none.

## Declined to judge

- Whether the research hub's own `.oculus/config.yml` already sets `statuses.stopped`. If it does, its words replace oculus's (`docs/HELP.md:565`), and the base results of C2 and C3 for the real hub would differ. My brief limited my reads of the hub to `funding.yml` and `applications.yml`, so this is not verified.
- Whether any other collection's template should list `stopped` under the ruling's words "funding and the other collections". The templates with a status select are statements `[draft, ready]` (`docs/templates.md:1384`), events `[upcoming, planned, completed, cancelled, not-attending]` (`:1462`), education `[ongoing, planned, completed]` (`:1510`), applications (`:1565`) and tasks `[doing, todo, done, dropped]` (`:1605`).
  - My judgment is that none should change. The word in `statuses:` makes `stopped` a valid status in every collection, because the vocabulary check is global (`validate.ts:262-279`). Events and tasks already have their own closing words (`cancelled` and `not-attending`, `dropped`). The step line names the Funding template alone.
  - Education has no word for an entry stopped before completion, so whether its template gains `stopped` is a user-visible choice. If the session reads the ruling otherwise, it is the user's call.
  - The brief does not state its own reading of this phrase. A sentence stating it, with C6 widened to the events, education, tasks and statements templates, would close that.
- Whether vitest runs leave anything in the checkout: I ran no vitest, so that nothing would be written to the main checkout. Every result above comes from reads, `git grep`, `git show`, `git diff` and `python3 -c` computations that print only.

Agent usage: a8d6da3737d3eb6cc, claude-opus-5-5, 179203 tokens, 68 tool uses, 7 min 54 s.

## Closed

- Names, `docs/templates.md:1436-1437`: item 2 now changes the entry comment to "awarded, rejected, withdrawn or stopped", the paths list names lines 1436-1437, and C5 reads it.
- Premises, "stay on the deadline radar": the opening paragraph says the radar holds only an entry with a deadline inside the horizon; "What is on the tree" says the hub's two entries have none and show the change only as the closest-word finding gone, and the report's visible-change list says so, with the colour grey before and after.
- Premises, line ranges: `:52` named beside `:77`; `statuses:` is `:109-156`, its comment `:101-108`; the template is `:1397-1451`.
- Premises, the hub's lines: named as uncommitted in the hub's working tree; the hub's `.oculus/config.yml` sets no `statuses:` (`grep -n statuses .oculus/config.yml` printed only project-tier comments), which closes the point declined to judge.
- Cases, C2: no test is named; C2 is run by a case-run program on an entry with a deadline inside the horizon.
- Cases, C3: the base finding names `dropped`. C4: its base result is stated, a guard.
- Cases, verify 3: covers `docs/templates.md`. Decision 2: restates the test rule as spec.md gives it (a test only for an entry of `agents/guarded.md`; `grep -n -i statuses agents/guarded.md` prints nothing).
- The question, item 3's grep: given its patterns.
- Implied inputs: C7 (due follow-up and open subtask), C8 (tone grey before and after); the horizon is in C2; the make-item input is named in "What is on the tree" and in the visible-change list, and C5 reads the block the make item writes.
- Declined, the other templates: Decision 3 and "What is on the tree" state the reading, the Funding template alone as the step line says, the word valid on any entry through `statuses:`.
- The base copy `.agents/worktrees/O143-base/` and its `unused-exports.txt` are named, as the state file's standing demand asks.
- The dictated comment words "awarded, rejected, withdrawn or stopped" are held: ASCII, plain, and they match the options line.
