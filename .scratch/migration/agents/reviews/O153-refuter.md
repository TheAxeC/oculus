# Step O153 refuter report (on .agents/worktrees/migration-O153, base 8ea70be0d)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette        (from the worktree root, PATH with node v24.21.0)
...
docs/diagrams/writes.dot
docs/diagrams/writes.svg
> oculus@1.0.0 docs:palette
> node utils/diagrams/palette.mjs
docs/palette.md
$ git status --short        (right after, so the two commands changed no file)
 M docs/HELP.md
 M src/lib/views/boards/project/Project.svelte
 M src/lib/views/shared/card/project/ProjectCard.svelte
?? .scratch/migration/agents/reviews/O153-report.md

$ npm run test:quick        (run once)
test:quick: 4 changed file(s), from git since HEAD
test:quick: 9 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.1 s)
ok      svelte-check (8.8 s): 1793918183013 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (40.6 s): Duration  30.15s (transform 11.84s, setup 0ms, import 24.71s, tests 39.87s, environment 2ms)
test:quick: 43.4 s; every command passed
(4 changed files against the builder's 3: the fourth is the builder's untracked report, written after its run.)

$ grep -rn 'deposit' src/lib/views/shared/card/project/ProjectCard.svelte src/lib/views/boards/project/Project.svelte
src/lib/views/shared/card/project/ProjectCard.svelte:32:    // included; the row opens the project's deposit beside the card. The team is the TEAM row of
src/lib/views/shared/card/project/ProjectCard.svelte:203:                id: 'deposit',
src/lib/views/shared/card/project/ProjectCard.svelte:204:                label: t('project.card.deposit'),
src/lib/views/shared/card/project/ProjectCard.svelte:205:                glyph: t('project.card.deposit_glyph'),
src/lib/views/shared/card/project/ProjectCard.svelte:207:                    openBeside('deposit', recordField(item.id));
src/lib/views/boards/project/Project.svelte:29:    // Open project page action. The card carries the deposit control on every page that draws it,
src/lib/views/boards/project/Project.svelte:30:    // whatever the project's tier or placement; the deposit mirrors the `code/` folder of the
(same seven lines as the report)

$ grep -rn '\bdeposit\b' src/lib/views --include='*.svelte' | grep -v 'views/boards/deposit/'
the six lines above without :205; no attribute `deposit` on a ProjectCard or Card

$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory
exit 0
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' ProjectCard.svelte Project.svelte docs/HELP.md .scratch/migration/agents/reviews/O153-report.md
exit 0 (nothing printed)

$ wc -l
     426 src/lib/views/shared/card/project/ProjectCard.svelte
     212 src/lib/views/boards/project/Project.svelte
     632 docs/HELP.md

$ sh utils/unused-exports.sh > <scratchpad>/unused-O153-review.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O153-base/unused-exports.txt <scratchpad>/unused-O153-review.txt
diff exit 0; 335 lines on each side
$ ls .agents/worktrees/O153-base/unused-exports.txt   (from the worktree root)
ls: .agents/worktrees/O153-base/unused-exports.txt: No such file or directory   (as the report says)

$ git diff 8ea70be0d -U0 | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"
1:+- **A project card.** A card on a board is always drawn closed. Its title, its Open project page action and Enter on the keyboard cursor open the project page beside the board as a preview tab. The
(the one hit the report quotes; "before" is the existing pane order on HELP.md:299)
$ the same over the src hunks only, with "always" and any [A-Z][0-9]{2,3} id added: exit 1, nothing printed
$ awk 'length > 100' over the two components: nothing printed

$ diff -rq O153-base/{src,tests,utils} migration-O153/...; diff -rq -x local.yml O153-base/config migration-O153/config
Files O153-base/src/lib/views/boards/project/Project.svelte and migration-O153/src/lib/views/boards/project/Project.svelte differ
Files O153-base/src/lib/views/shared/card/project/ProjectCard.svelte and migration-O153/src/lib/views/shared/card/project/ProjectCard.svelte differ

$ git diff 8ea70be0d --stat
 docs/HELP.md                                       |  2 +-
 src/lib/views/boards/project/Project.svelte        | 17 ++++++------
 .../views/shared/card/project/ProjectCard.svelte   | 30 ++++++++++------------
 3 files changed, 22 insertions(+), 27 deletions(-)
$ git diff 8ea70be0d --word-diff -- docs/HELP.md   (the only change)
[-(on the project page)-]

$ grep -rn 'deposit_glyph\|card.deposit\|deposit=' <base copy>/tests     exit 1, nothing
$ grep -rln "project/ProjectCard.svelte\|ProjectCards.svelte" <base copy>/src | wc -l     7
$ test -d docs/adr || echo "no docs/adr"     no docs/adr
$ grep -rn "ProjectCard\|Project.svelte" tests     nothing
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `ProjectCard.svelte:202-209` puts the row `{ id: 'deposit', ..., onclick: () => { openBeside('deposit', recordField(item.id)); } }` into the `rows` array with no condition. The prop's doc comment, its type and the `deposit = false` default are gone (`git diff 8ea70be0d -- src`). `record-menu.ts:85` is unchanged, and it places the row by its id.
- 2: holds. `Project.svelte:139-147` passes no `deposit`. The head comment at `:27-35` reads "with `page` on: ... The card carries the deposit control on every page that draws it, whatever the project's tier or placement; the deposit mirrors the `code/` folder of the project's own folder."
- 3: holds. The head comment at `ProjectCard.svelte:29-34` says "Every card carries the Deposit row in its menu, on every page that draws it, a project read from a repository included". The only change to `docs/HELP.md:299` is the removed "(on the project page)" (word-diff). My grep of `deposit` over `src`, `tests`, `config` (`--exclude=local.yml`), `docs` and `README.md`, narrowed to lines that also name a page, card, menu, control, action, "only" or "alone", found no other sentence that puts the deposit on the project page alone. The remaining hits are `HELP.md:85, 303, 315`, `deposit.yml:43`, `Deposit.svelte:2`, `record-menu.ts:11` and `folder-opener.ts:16-17`, and each is true after the diff.

Cases of the brief's "Cases":

- C1: met by reading. `Projects.svelte:305-315` draws `Card` (the ProjectCard), which now always offers `deposit`. `menuRuns` puts the rest run in this order: 'ask', 'editor', 'edit', 'pin', 'copy', 'deposit', 'clone', 'cloned'. After those come the kind's own actions, and the project card has none in that run. `RecordCard.svelte:218` adds only followup, subtask and deadline, which belong to the Add run. So Deposit follows Copy Context, comes before Clone or Cloned-in, and is last when neither is drawn. How the menu looks on screen is for the look.
- C2: met by reading. `ProjectCards.svelte:65-75` draws `ProjectCard` with no condition, and `Person.svelte:271, 286` and `Listing.svelte:115, 130` draw through it. How it looks on screen is for the look.
- C3: met by reading. `Project.svelte` no longer passes `deposit`, and the `actions` array holds one `id: 'deposit'`. `runActions` picks each id once from that array, so the menu has one Deposit row.
- C4: met by reading. The row calls `openBeside('deposit', recordField(item.id))`, the same call Edit Manifest makes at `:186` with `'editor'`. `landing.ts:1-3` treats a deposit and a manifest edit as the same kind of view ("opened for something"), so both reach `openOpened` through the same branch of `openInto` (`opening.ts:279`). The pane it lands in on screen is for the look.
- C5: met by reading. `recordField(id)` returns `addressOfId(id)` (`records.ts:15-17`), and the row does not depend on tier, hub or placement.
- C6: met by reading. `ProjectCard.svelte:401` reads `strip={['ask', 'workbench', 'page']}`, and `stripActions` draws only the ids it is given.
- C7: met. The grep lists no `deposit` attribute, and svelte-check reports 0 errors in `test:quick`.
- C8: met by reading. `RecordCard.svelte:219` (`runs = menuRuns(every)`) feeds both `:297` (the "..." menu) and `:328` (`ContextMenu`). Shift+F10 on screen is for the look.
- C9: met by reading. The row has no condition. `sync` in `deposit.ts:357-369` answers `server.deposit.no_code` ("The project has no code/ to deposit", `server.yml:278`) whichever card opened the view, though only after the `no_mirror` check at `:366-367`. Opening from a card therefore gives the same result the project page gives today. The drawn words are for the look.
- C10: met by reading. `openOpened` (`opening.ts:376-395`) finds the open view with `findView(tree, view, stateId(state))` and activates it.

## 1. Spec

none

## 2. Proof

none

## 3. Standards

none

## 4. Behaviour

none. The report gives the before and after for C1 to C4, C6, C8 and C9, cards of personal projects included (C9).

## Declined to judge

- What the menus look like on screen for C1, C2, C3 and C8 (the row's place and glyph, the Shift+F10 and right-click menus), where the view lands for C4, and the words the Deposit view draws for C9. A reviewer runs no page. The look at landing settles these, on a scratch server off 8787 and 8790, with the views and states the report's "Host- and user-visible changes" section names.
- Whether the worktree's HEAD is the base 8ea70be0d, which matters for the report's `git diff -U0` (taken against HEAD). Only `git rev-parse HEAD` would settle it, and the Rules forbid that command. My own run against the base, `git diff 8ea70be0d -U0`, gives the same single hit.
- `src/lib/views/boards/deposit/Deposit.svelte:75` says the state comes from what "the card handed openView", but the card calls `openBeside`. The base has the same sentence, so this diff did not make it false and it is outside this step.

Reviewer usage: ae0872378d5f180de, claude-opus-5-5, 156545 tokens, 47 tool uses, 8 min 3 s.

## Closed

- No finding under the four headings, so no repair round is sent.
- Declined to judge, the look: taken at landing on the scratch server on 8797.
- Declined to judge, the worktree's HEAD: `git -C .agents/worktrees/migration-O153 rev-parse HEAD`, run by the session, settles it at landing.
- Declined to judge, `Deposit.svelte:75`: the doc comment names the card's call; fixed at landing to say `openBeside`, since the comment describes how the card this step changes opens the view.
