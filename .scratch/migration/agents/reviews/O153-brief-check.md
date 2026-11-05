# Brief check of O153 (Deposit in every project card's menu)

Main at head `70c718641` (`git log --oneline -3`). The working tree has uncommitted changes only in `.scratch/migration/plan.md`, `.scratch/migration/orchestrator-state.md` and the untracked brief (`git status --short`). `plan.md` has no Goal section: `grep -n -i "^#.*goal\|^goal\|\*\*goal" .scratch/migration/plan.md` prints nothing. Its head paragraph (line 3) says it is the execution ledger for `tools/oculus/DESIGN.md`. I used the goal given in this check's prompt: Deposit in the menu of every project card, wherever the card is drawn. The configured standards are only the rules file: `.agents/plan.yaml` has `standards: [.scratch/migration/agents/spec.md]`. The rules file names no further standards pages besides `docs/HELP.md` and `docs/apps.md` as places to write.

## Names

The command `grep -rn -i "deposit" src tests docs README.md`, narrowed to card, menu, project-page and prop sentences, plus `grep -rn -i "deposit" config --exclude=local.yml`, plus `grep -rn "import .*ProjectCard\(s\)\?\.svelte" src tests`.

The prop `deposit` is set in one place only, `src/lib/views/boards/project/Project.svelte:142`. It is declared and read only in `ProjectCard.svelte:89-90, 108, 239`. No test passes or names it: `grep -rn 'deposit_glyph\|card.deposit\|deposit=' tests` prints nothing (rc=1). Every importer of the card is one of these:
- `ProjectCards.svelte:9`
- `Projects.svelte:106`
- `Project.svelte:63`
- `Person.svelte:64` and `Listing.svelte:30`, both through ProjectCards

Hits outside the write list, and whether the change makes each false:
- `src/lib/views/shared/card/record/record-menu.ts:11` and `:85`. The run lists Deposit with no condition. Still true.
- `config/text/views/boards/project.yml:71-72` (`deposit: Deposit`, `deposit_glyph: published`). The keys are still read by `ProjectCard.svelte:242-243`, so the orphan-key check still holds. Still true.
- `config/text/views/boards/deposit.yml:43`: "No project chosen. Open the deposit from a project card." Still true, and now truer.
- `config/text/views/boards/deposit.yml:93-94` (`views.deposit`) is the view's registration text. Not affected.
- `src/lib/views/boards/deposit/Deposit.svelte:2`: "A deposit opens from a project". Still true.
- `src/lib/state/workbench/layout/open/float/folder-opener.ts:16-19`, together with `docs/HELP.md:85` ("Deposit (for a project with a deposit)"). Both are about the workbench page's Deposit tab, which `hasDeposit` (`folder-opener.ts:80-84`) keeps only for a project with `code/` or a `code_availability` repo or url. Not made false, because they describe the workbench, not the card. The card, however, offers Deposit to every project while the workbench drops the tab for a project without one. That difference already exists on the project page today; the step only spreads it to every card.
- `docs/HELP.md:303` (Deposit in the run, no condition) and `:315` ("Every project has one."). Still true.
- `docs/palette.md:22` (`| Deposit | deposit |`). Not affected.
- `src/lib/views/shared/card/record/CardGrid.svelte:15`, `ProjectCards.svelte:2-7`, and the head comments of `Projects.svelte:74, 96` and `Person.svelte:33`. None mentions the deposit. Not affected.
- `README.md` and `docs/apps.md`: `grep -n -i "deposit" README.md` and `grep -rn "Deposit" README.md docs/apps.md` print nothing.
- The test files that hit `\bdeposit\b` are about the deposit route, Zenodo, the folder opener, the config folder and the website (for example `tests/checks/config/config-folder.test.ts:181,305` and `tests/state/workbench/layout/folder-opener.test.ts`). None concerns the card or the prop. Not affected.

## The step line

`plan.md:1691`, mapped to "What to build":
- "the Deposit row of the card's menu ... drawn on every project card, on the Projects boards, the Person view, a Listing and the project page" maps to item 1.
- "the `deposit` prop removed" maps to item 1.
- "`docs/HELP.md`'s project card paragraph ("Deposit (on the project page)")" maps to item 3.
- "the head comment of `Project.svelte` saying so" maps to item 2.
- "(ruling 687)" is cited on brief line 20. The ruling at `plan.md:3563` matches the step line word for word in scope.

Every part has a requirement. Item 3 also asks for the ProjectCard head comment and the wider grep. Both are already required by the rules file (`spec.md:72`), so they do not widen the step. The step line names no check.

## Premises

All rerun on main at `70c718641`. Results:
- ProjectCard is 430 lines (`wc -l`). Holds.
- `actions` is at `:157-275`. Holds.
- The Deposit row is at `:239-247`. The text holds; the `if` block's closing brace is at `:248`.
- The prop doc comment and type are at `:89-90`, the default at `:108`. Holds.
- The Edit Manifest row is at `:183-189`, with `openBeside('editor', recordField(item.id))` at `:188`. Holds.
- The head comment quote is at `:29-33`. Holds; the deposit sentence itself is `:30-31`.
- `Project.svelte:142` reads `deposit`. Holds.
- The element is said to be at `:137-146`. It actually runs `:137-148`, with `/>` at `:148`. Minor.
- The `Project.svelte` head comment `:27-31` holds verbatim.
- `Projects.svelte:305` (`<Card`) and `:106` (the import) hold.
- `ProjectCards.svelte:65` holds.
- Person and Listing use ProjectCards (`Person.svelte:271,286`, `Listing.svelte:115,130`). Holds.
  - The brief's grep `grep -rln "project/ProjectCard.svelte\|ProjectCards.svelte" src` prints 7 files, not 5: it adds `CardGrid.svelte` and `CardBrief.svelte`, whose hits are comments only. The claim holds; the grep output is wider than it suggests.
- The strip `['ask', 'workbench', 'page']` is at `ProjectCard.svelte:405`. Holds.
- The rest run of `record-menu.ts:85` holds verbatim.
- `project.yml:71-72` holds.
- HELP.md:
  - `:299` contains "then Ask, Edit Manifest, Pin to Top (Unpin while pinned), Copy Context, Deposit (on the project page) and Clone, or the folder the repository is cloned in." Holds, and `grep -n "(on the project page)" docs/HELP.md` hits only `:299`.
  - `:303` and `:315` hold.
- The test grep prints nothing. Holds.
- The rulings hold:
  - "Deposit for every project", 2026-10-12, at `plan.md:2743`.
  - Ruling 687, 2026-11-05, at `plan.md:3563`.
  - Ruling 37, 2026-10-10, at `plan.md:2606` ("not Deposit").
  - D71 carries "(ruling Deposit for every project)" at `plan.md:1503`.
  - "Raises that question separately" holds: open item 688 is booked at `orchestrator-state.md:183`.
- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. Holds.
- The base copy `.agents/worktrees/O153-base` and the worktree do not exist yet (`ls .agents/worktrees/ | grep O153` prints nothing). This is expected before /spec stages them; verify item 5 depends on it.

## Cases and checks

- C1 to C6: checked by reading and at the look. That is consistent with `spec.md:65` and `:67`.
- C1 wording: "after Copy Context and before Clone" holds only when the Clone or Cloned-in row is drawn (`ProjectCard.svelte:249, 262`). For a project with no `repository.url`, Deposit is the last row of the run. The order itself is correct per `record-menu.ts:85`.
- C4 asks the builder to read `openBeside` (`state/workbench/layout/open/opening.ts:208`), which the step does not change. It asks only for a reading to confirm where the view lands, not a quote or an explanation. Acceptable.
- C7 is satisfiable. A leftover `deposit` attribute on ProjectCard is a type error under svelte-check, since the Props are typed. The `\bdeposit\b` grep is noisy: about 100 hits, mostly in `views/boards/deposit/`. The builder must read the hits on ProjectCard and Card tags.
- Verify item 8 asks for "the standards pages' rules on sentence length". No configured standards page has such a rule: `grep -n -i "sentence length\|long sentence" .scratch/migration/agents/spec.md` prints nothing. The item points at a rule that does not exist and should be dropped, or should name `spec.md:21` (prose).
- Verify item 3 names `LC_ALL=C grep -n '[^ -~]'` over the touched files. That is consistent with `spec.md:78`, but `spec.md:103` says the perl gate replaces the grep form "wherever a brief or a check names it". This is a minor wording conflict inside the rules file. The three target files have no non-ASCII today (`LC_ALL=C grep -c '[^ -~]'` gives 0, 0, 0).
- Decision 2 (no test) holds. The cited reason should be `guarded.md:3`, "Views have no entry: the look on TEST covers them", and `spec.md:60`. The brief instead cites a cost reason the rules file's test rule does not state.
- Verify item 1 adds `npm run docs:palette`. It exists (`package.json:24`), and no rule calls for or bans it. It should not change `docs/palette.md`, since no view registration changes (not verified by a run).

## The question

Could each check pass without the goal being reached?

- C1 (a board card has Deposit): no. All project boards are drawn by `Projects.svelte` (`src/routes/views.ts:116`), so one board stands for all.
- C2 (Person and Listing): no. Both draw `ProjectCards.svelte:65`, which draws the same ProjectCard, so an unconditional row reaches them.
- C3 (the project page, once): a regression guard against a duplicate. On its own it could pass on the base, but C1 and C2 carry the goal.
- C4 (the press opens the view beside): yes, it could pass without the goal, because it checks correctness, not coverage. It is not meant to carry the goal.
- C5 (a repository project and a second hub): it could pass trivially, since the row has no condition. It guards against a condition creeping in.
- C6 (strip unchanged): yes, unrelated to the goal. It is a guard.
- C7 (prop removed): yes, it could pass with the row deleted outright. C1 to C3 close that.
- The step line names no check.
- Item 1's checks (C1 to C3 and C7, with the look): together, no. The only importers of ProjectCard are the three listed. `grep -rn "project.card.edit_manifest\|project.card.pin_to_top" src` hits only ProjectCard, so no other component builds a project action menu.
- Item 2's check (verify 2 grep): could pass with a stale sentence left. The read of each hit closes that.
- Item 3's check (verify 6 grep): the same.

## Implied inputs

1. **The keyboard path to the menu.** The "..." opener, a right-click, the context-menu key and Shift+F10 all draw `menuRuns(every)` (`RecordCard.svelte:16, 219`). Expected: Deposit appears in the keyboard-opened menu as well. This holds by construction. It costs one line in the before-and-after for the look (Shift+F10 on a board card).
2. **The Focus board's lane cards** (`views/boards/focus/lanes/LaneCard.svelte`). They draw projects on a view the help calls a board (`HELP.md:297`), but with a move menu only (`LaneCard.svelte:186`), not ProjectCard. Ruling 687's "(the boards, ...)" could be read to cover them. Expected: out of scope, since they are not the project card and have no action menu. The brief should say so in one line so a reviewer does not count it as a miss. Saying so widens nothing.
3. **Board list mode** (`views/boards/projects/BoardList.svelte`). It draws rows with no action menu (`grep -n -i "menu\|actions" BoardList.svelte` hits only the Columns menu). Expected: no Deposit there, no change.
4. **A project with no `code/` and no `code_availability` repo or url.** The card now offers Deposit on every board, while the workbench drops its Deposit tab for such a project (`folder-opener.ts:80-84, 131`). Expected: the Deposit view opens for the project and Plan answers `server.deposit.no_code` ("The project has no code/ to deposit", `deposit.ts:369`, `config/text/server.yml:278`), as on the project page today. This was inferred from the code; it was not run. The before-and-after should name this state so the look sees it.
5. **A personal project (tier `personal`).** Ruling 37 says no Deposit; open item 688 is booked (`orchestrator-state.md:183`), recommending (a), every project. The brief builds per 687. If Axel rules (b), the brief changes, so the step should not land before 688 is ruled.
6. **The Deposit view already open for the project.** `openBeside` activates it where it is (`opening.ts:200-201`). Expected: the press on a second card of the same project activates the existing tab. It is not stated, but it holds by reading.

## ADRs

None. `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`, and `.agents/plan.yaml` has no `adr` key.

## Dictated text

One line. `grep -n "the run reads" .scratch/migration/agents/briefs/O153.md` gives line 26: "`docs/HELP.md:299` drops "(on the project page)", so the run reads "... Copy Context, Deposit and Clone, ..."." The result, "Copy Context, Deposit and Clone, or the folder the repository is cloned in.", holds: plain ASCII, no dash, no history word, true after the change (`spec.md:21`, `:44`). The other descriptions of comments (items 2 and 3) dictate content, not words.

## Declined to judge

- Whether ruling 687's "the boards" includes the Focus lane cards. That is Axel's reading; implied input 2 gives the recommended line.
- Whether the card offering Deposit to a project the workbench says has none is acceptable. It predates the step and is a different concern from where the card carries the row.

Usage: a1fe23ba35d510aa2, claude-opus-5-5, 167507 tokens, 39 tool uses, 7 min 11 s.

## Closed

- Premises, `Project.svelte` element range: the brief now says `:137-148`.
- Premises, the grep of the card's users: the brief now says it prints seven files, `CardGrid.svelte` and `CardBrief.svelte` by comments only.
- Cases, C1 wording: C1 now says Deposit comes after Copy Context, before Clone or Cloned-in when either is drawn, and last in the run otherwise.
- Cases, verify item 8: it now names the prose rule `spec.md:21`.
- Cases, verify item 3: it now names the rules file's perl ASCII gate (`spec.md:103`) over `src tests bin config` and over the touched files.
- Cases, decision 2's reason: it now cites `guarded.md:3` and `spec.md:60`.
- Implied inputs 1, 4 and 6: added as cases C8 (the keyboard-opened menu), C9 (a project with no `code/`: the Deposit view opens and its plan says the project has no code to deposit) and C10 (the Deposit view already open: the press activates the existing tab).
- Implied inputs 2 and 3: "What is on the tree" now says the Focus lane cards and the board's list mode draw no project card menu, so they carry no Deposit row and are outside the step.
- Implied input 5: ruling 688 (a), Axel's, keeps Deposit for every project; the brief says so.
- Declined to judge, the workbench tab: the workbench's Deposit tab rule is unchanged by the step; the card's offer on every project follows rulings 687 and 688.
