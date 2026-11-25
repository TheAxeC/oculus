# Step O190 refuter report (on .agents/worktrees/migration-O190, base e2fbf2161)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ shasum docs/diagrams/* > <scratch>/before; taskpolicy -b nice -n 19 npm run diagrams; shasum docs/diagrams/* | diff <scratch>/before -
diagrams exit=0
diff exit=0          (the run rewrote no file; the four diagram files in the diff are what it gives: layer-state "113" to "114", layers "585" to "586")

$ taskpolicy -b nice -n 19 npx vitest run tests/checks/config/templates.test.ts tests/data/snapshot/normalise.test.ts --maxWorkers 2 --reporter verbose
 <check mark> |unit| tests/data/snapshot/normalise.test.ts > normalise, the field mapping > fills a project from the manifest keys of the same meaning 1ms
 <check mark> |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every field of the manifest schema a file holds in the project.yml template 27ms
 Test Files  2 passed (2)
      Tests  18 passed (18)

$ git diff e2fbf2161 --name-only | grep -v '^.scratch/' | grep -v -e '\.svg$' -e '\.dot$' | xargs taskpolicy -b nice -n 19 npx prettier --check     (17 files)
Checking formatting...
All matched files use Prettier code style!

$ <the 11 changed .ts and .svelte files> | xargs taskpolicy -b nice -n 19 npx eslint
eslint exit=0        (no output)

$ taskpolicy -b nice -n 19 npm run check
1795615615375 COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
check exit=0

$ git diff e2fbf2161 --name-only | grep -v '^.scratch/' | xargs env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'
perl exit=0          (no output; the same check over both copies of O190-report.md prints nothing, and `cmp` of the two copies exits 0)

$ wc -l <changed source files>
     875 src/lib/state/boards/focus.ts
     279 src/lib/views/shared/card/card.ts
     852 src/lib/data/model/model-entities.ts
     714 src/lib/data/snapshot/normalise.ts
     639 src/lib/state/forms/schema.ts
     613 src/lib/data/shapes/catalog-files/vocab.ts
     176 src/lib/views/shared/card/project/CardFacts.svelte
     458 src/lib/views/shared/card/project/ProjectCard.svelte
     380 src/lib/views/boards/focus/lanes/Lanes.svelte
     366 src/lib/views/boards/focus/lanes/LaneCard.svelte
     400 tests/data/snapshot/normalise.test.ts

Case-run program: the builder's cases.ts and tsconfig.json recreated in <scratchpad>/O190-review/ (cases.mts, since that folder has no package.json; WT and the planted hub's folder read from the environment; baseUrl at the tree under test), run as
  WT=<tree> GIT_CEILING_DIRECTORIES=<scratch>/tmp taskpolicy -b nice -n 19 npx tsx --tsconfig <scratch>/tsconfig.json <scratch>/cases.mts
against the worktree, and against a base copy of src/ and config/ (cp of the worktree, each changed file overwritten from `git show e2fbf2161:<path>`). TMPDIR was left unset: tsx's IPC pipe under the scratchpad path fails with "listen EINVAL" (socket path too long). The folder was removed after.

Worktree, exit=0, output identical line for line to the report's "Cases after the change" block, including:
case 1: project.submitted="2026-10-24"
  fact={"date":"2026-10-24","days":32}
  words={"label":"submitted 2026-10-24 | 32d","tip":"Submitted: 2026-10-24, 32 days ago"}
case 4: ... words={"label":"submitted 2026-11-25 | 0d","tip":"Submitted: 2026-11-25, 0 days ago"}
case 5: ... findings=["submitted: submitted is soon, which is not a day written YYYY-MM-DD"]
case 6: ... findings=["submitted: submitted is 2026-10-24T10:00:00+02:00, which is not a day written YYYY-MM-DD"]
case 1 with a venue: laneFacts=[{"kind":"submitted",...},{"kind":"venue","label":"BSPC","whole":"Signal Processing"}]
case 9: fact={"date":"2026-10-24","days":32} ...   case 10: fact=null laneFacts=[]
case 11: review=Delta(d11), Zeta(b11), Alpha(a11), Beta(c11)   (same from the reversed input)
case 12: review=Zeta(z12), Alpha(a12)   (same from the reversed input)
case 13: review=Alpha(a13), Zeta(z13)
case 14: review=Gamma(g14), Alpha(a14), Beta(b14)
case 15: revise=Zeta(z15), Alpha(a15)   case 15: fact a15=null fact z15=null
case 16: idea=Alpha(a16), Mu(m16), Zeta(z16)
case 17: fieldValues.submitted="2026-10-24"
decision 1, 2026-11-26: {"label":"submitted 2026-11-26","tip":"Submitted: 2026-11-26"}

Base copy, exit=0, output identical to the report's first-run block (every case 1 to 8 "no fact function", the finding "key submitted is not declared by the schema of this file" for cases 1 and 3 to 8; case 11 Delta, Alpha, Beta, Zeta; case 12 Alpha, Zeta and reversed Zeta, Alpha; case 14 Alpha, Beta, Gamma; case 15 Alpha, Zeta; case 17 undefined).

Reviewer probe (same harness), worktree / base:
fact "2026-11-24": {"date":"2026-11-24","days":1} {"label":"submitted 2026-11-24 | 1d","tip":"Submitted: 2026-11-24, 1 day ago"}  / no fn
fact "2026-13-01": {"date":"2026-13-01"} label "submitted 2026-13-01"   (judgment call 4)
fact " 2026-10-24": null   fact "": null
same deadline, no dates: alpha, zeta  / base: zeta, alpha   (input order zeta, alpha)
same deadline, same day: alpha, zeta  / base: zeta, alpha
deadline beats an older submitted day: due, dated  / base: due, dated

$ taskpolicy -b nice -n 19 sh utils/unused-exports.sh | grep -e focus.ts -e card.ts -e normalise.ts -e model-entities -e schema.ts -e vocab.ts
src/lib/data/snapshot/normalise.ts: collectionViews, ENTITY_KINDS
src/lib/views/shared/card/card.ts: SESSION_VIEWS, SHOWN
src/lib/data/model/model-entities.ts: Chip
$ ... | grep -i submitted
(no output)

$ git diff e2fbf2161 -U0 -- src config docs/templates.md docs/apps.md tests | grep '^+' | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O[0-9]+|20[0-9]{2}-[0-9]{2}-[0-9]{2})\b"
five hits, as the report says: "drawn before it" (focus_clusters comment), "a project with a day before one without", "a value before none", and the two `submitted: '2026-10-24',` fixture lines; none is history.

$ grep -rn 'ISO_DATE.test\|isIsoDate\|isDay(' src tests
six lines: the five call sites the report names plus focus.ts:624 (the new submittedDay).

Report line numbers rechecked by grep: manifest-schema.yml:77, model-entities.ts:486-489, normalise.ts:291, schema.ts:481, focus.ts:636 (cardSubmitted), card.ts:250 (submittedWords), project.yml:132-138, templates.md:1239, apps.md:416, data-map.md:383 and HELP.md:102 (the Doc text lines): each reproduces.

Premises rechecked on e2fbf2161 with git show: focus.ts 815 lines, pausesCountdown 213, laneOrder 314, laneItems 425, LaneFact 592, cardYear 603, laneFacts 621; normalise.ts manifestProject 261, deadline 290, snooze 293; schema.ts fieldValues 443, deadline 480; ProjectCard.svelte:390 `<CardFacts {item} onfolder={showFolder} />`; check.ts:298 not_a_date; templates.md 1238 and 1240; vocab.yml 72, 176, 179, 190. The hub: no manifest with a top-level `submitted:` (grep exit=1), 12 at `stage: submitted`.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `manifest-schema.yml:77` with label, type, section and the help words; `Project.submitted` documented at `model-entities.ts:485-489`; `normalise.ts:291`; `schema.ts:481`; case 1 and case 17 runs.
- 2: holds. `focus.ts:622-648`: `ISO_DATE` from `data/helpers/dates.ts`, the same regex `check.ts` uses; the flag read by `hasWord(words, 'stages', 'pauses_countdown', ...)`; future date gives the date alone, today 0, `soon` and the timestamp none; runs of cases 1 to 10.
- 3: holds. `card.ts:250-261` `submittedWords`, strings under `project.card` (`project.yml:132-138`), used by both CardFacts.svelte and LaneCard.svelte; the decision-1 lines reproduce, the one-day tip gives "1 day ago" in the reviewer probe.
- 4: holds by reading and the type check. CardFacts.svelte draws the tag before the year's with the item 3 label and tip and the `stale` glyph; `now` prop passed at `ProjectCard.svelte:394`; ProjectCard's head comment lists the fact. The drawing is the look's.
- 5: holds. `laneFacts(..., now)` with `now` last (`focus.ts:678-684`), the fact pushed first; `Lanes.svelte:236` passes `now`; `LaneFact` gains kind `submitted` carrying `Submitted`; LaneCard.svelte `FACT_GLYPHS`, `factLabel` and `factTip` go through `submittedWords`. Case 1 with a venue puts it first.
- 6: holds. `laneOrder` via `presentFirst` over deadline, then `submittedDay`, then `titleOrder`; `sort: title` lanes unchanged (case 16); the five sentences rewritten (`focus.ts:86-89`, `focus.ts:433-437`, `config/catalogs/vocab.yml:176`, `config/options/catalogs/vocab.yml:163`, `vocab.ts:126`). Cases 11 to 16 runs.
- 7: holds. `config/catalogs/vocab.yml:60`, `config/options/catalogs/vocab.yml:58`, `vocab.ts:178`.
- 8: holds. `docs/templates.md:1239`, comment aligned at the block's column; templates test passes.
- 9: holds. Fixture and expected project carry `submitted: '2026-10-24'`; fails on the unchanged source as the report quotes, passes after (rerun above).
- 10: holds. The report's "Doc text" gives `data-map.md:383` as `grep -n` prints it with its replacement, and the line `HELP.md:102` a new line follows; both current lines reproduce.

Cases of the brief's "Cases":

- 1: met, the case run (fact 2026-10-24 and 32, first in `laneFacts`, label `submitted 2026-10-24 | 32d`).
- 2: met, the case run (`fact=null`, `laneFacts=[]`, with a venue only the venue, as on the base).
- 3: met, the case run (`{"date":"2026-11-26"}`, label `submitted 2026-11-26`).
- 4: met, the case run (0 days, label `... | 0d`, tip "0 days ago", the `other` form).
- 5: met, the case run (no fact; finding keyed `submitted`).
- 6: met, the case run (no fact; finding keyed `submitted`).
- 7: met, the case run (as case 1).
- 8: met, the case run (`fact=null`).
- 9: met, the case run with a hub's `stages` holding `under-review` with the flag; the callers pass the project's own hub's words (`CardFacts.svelte` `vocabOf(hub)`, `Lanes.svelte` `wordsAt(project)`), by reading.
- 10: met, the case run (`fact=null`).
- 11: met, the case run (Delta, Zeta, Alpha, Beta from either input order).
- 12: met, the case run (Zeta, Alpha from either input order).
- 13: met, the case run (Alpha, Zeta from input Zeta, Alpha).
- 14: met, the case run (the dated Gamma first, then Alpha, Beta by title).
- 15: met, the case run (Zeta, Alpha; no fact on either).
- 16: met, the case run (Alpha, Mu, Zeta).
- 17: met, the case run (`fieldValues.submitted="2026-10-24"`).
- 18: met, `tests/data/snapshot/normalise.test.ts` "fills a project from the manifest keys of the same meaning", red on the unchanged source as quoted, green on the rerun.
- 19: met, `tests/checks/config/templates.test.ts` passes on the rerun.

## 1. Spec

- `docs/apps.md:416`: "`deadline?`, `submitted?`, `snooze?`"; what is wrong: a path outside the brief's "Paths this step writes", which says "The step writes these paths and nothing else"; no item asks for it. The rules file ("After changing a name...": "A step writes what an app builder meets into the Apps guide `docs/apps.md`", and a sentence the change makes false is a defect) requires it, and the rules file overrides the brief. The row is correct: `Project` now carries `submitted?` and the `projects` payload is that record. The report names the path and its reason in its second line and under "Files". The brief and its brief check missed this path. Failure scenario without the line: an app builder reading the `projects` row of the Apps guide does not know the record carries `submitted` and parses the manifest again to get it. Verdict: no item or case; the line should be kept, and the orchestrator decides on the widening (it is internal to the docs an app builder reads and adds no requirement or case).

## 2. Proof

none. Every count, path, line number and run the report quotes as evidence reproduces (above), including the first run on the unchanged tree.

## 3. Standards

- `.scratch/migration/agents/reviews/O190-report.md`, section "Runs": "`npm run test:quick`: started once, together with `npm run diagrams`, after the build ... I killed `npm run test:quick` (pid 92509) ..."; what is wrong: the rules file, "Token discipline", says the builder never runs `npm run test:quick` and that any whole-suite command is a finding of the review. Context that bears on it: the brief in force at dispatch (`git show e2fbf2161:.scratch/migration/agents/briefs/O190.md`, verify item 1) read "`npm run diagrams && npm run test:quick` (with `TMPDIR` unset), once after the last change", and the rule changed (ruling 777 (a)) during the build; the builder stopped the run on the coordinator's word, and no result of it is used in the report. Failure scenario: a whole suite of about 286 files running in the builder's worktree beside the landing's own run, compute paid twice; no wrong result follows. Verdict: none.

No other standard is broken: no comment or test title carries history (grep above), no non-ASCII, no file over its limit (focus.ts 875, the largest `.ts`; ProjectCard.svelte 458, the largest component), `focus.ts` holds no words, the flag is read by `hasWord` and never by the word `submitted`, every new string is in the catalog, and the grep of each changed name (`laneFacts`, `LaneFact`, `cardYear`, `<CardFacts`, `laneOrder`, `laneItems(`, "then title", "by deadline", `pauses_countdown`, `sort: title`, `focus_clusters`, `deadline?`) across `src`, `tests`, `config` (`--exclude=local.yml`), `docs` and `README.md` finds no sentence left false: `pausesCountdown`'s doc (`focus.ts:211-214`), `card.ts:209-212`, `Lanes.svelte:15` and `docs/templates.md:716-720` are still true.

## 4. Behaviour

- `src/lib/state/boards/focus.ts:321-337`: "presentFirst(a.deadline ?? '', b.deadline ?? '') || presentFirst(submittedDay(a) ?? '', submittedDay(b) ?? '') || titleOrder(a, b)"; what is wrong: on every lane of a cluster with no `sort` (the Now cluster's lanes as well as Review and Revise), two cards with the same deadline and no `submitted` were in input order and are now in title order (reviewer probe: base "zeta, alpha", worktree "alpha, zeta"). The brief asks for this. Item 6 orders "two projects of the same deadline, or with none, by `submitted` before the title ... and the title between two of the same date", and the five sentences already said "by deadline, then title", which the base code did not do for equal deadlines. The report states the change with its before and after only in "Judgment calls" 6. Its "Before and after" section, which the look is read against, says only "Cards of the same deadline follow the same rule", under the Review lane, and names no other lane. Failure scenario: the look at landing checks the Review and Revise lanes only, and a reader who sees two same-deadline cards on a Now lane swap places thinks something broke. Verdict: none (item 6 holds); the look's list should carry this line.

## Declined to judge

- What the cards draw on screen (cases 1 to 4 on a board card and a lane card, the Review lane's order on screen, Oculus Light and a dark theme, the new "Submitted" date field in the project form, the Settings help words): a builder and a reviewer run no page; this is the orchestrator's look at landing.
- `utils/unused-exports.sh` against the base: run on the worktree only, with no base tree holding `utils/` and `tests/`. The lines for the changed files name no export the step added, and no line names `submitted`.
- The rules file's own section "Verify before you report" still says "At minimum: `npm run test:quick`", which contradicts its "Token discipline" section and ruling 777 (a). This is outside the step's diff and is the orchestrator's file.
- The base copy of `config/` made for the first-run rerun included `config/options/local.yml`, the tracked options description file (the copy held no `config/local.yml`). It was deleted from the copy with `find -delete`, unopened and unprinted, and the scratch folder was removed after the runs.
- Whether a killed `npm run test:quick` left fixture folders or tmux sockets in the system temporary folder: settling it needs a listing outside the worktree and a tmux socket listing, both outside what this review may run.

Reviewer usage: aa9a5aa6c5f75b4e3, claude-opus-5-5, 220759 tokens, 75 tool uses, 1114 s.

## Closed

- Spec, `docs/apps.md:416`: kept at landing. The rules file has a step write what an app builder meets into `docs/apps.md`, and the row would be false without `submitted?`; it adds no requirement or case, so the path joins the step's under ruling 374 (a) (open item 778, automode).
- Standards, the stopped `npm run test:quick`: no fix; the brief in force at dispatch asked for it, the builder stopped it on ruling 777 (a), and no result of it is used.
- Behaviour, the tie order on every lane without `sort`: the brief asks for it (item 6); the look at landing checks a Now lane with two cards of one deadline beside the Review and Revise lanes, and the booking states the before and after.
- Declined, the rules file's "Verify before you report" sentence "At minimum: `npm run test:quick`": rewritten in `agents/spec.md` to the checks of ruling 777 (a), outside the step's diff.
