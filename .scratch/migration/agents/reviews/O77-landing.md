# O77 landing: the project card, the project page, the Focus lane card and the Focus filter

Position: the cockpit-to-oculus migration, O77 the project card and the project page; next: O78, collections and registries by flag, then O79, O80 and O81.

## Open items

- none.

## The check of Steps 1

The runner's agent listing showed no subagent: O77's builder a03c2980d7a4157d9, its brief check a0e953361e2056991 and its reviewers a88a9c6ce833fcaca and a386cef4a5e53c123 were not listed.

## NOT DONE

- Not looked at: the right-click on a card in the desktop app (`npm run app`), and the collection view's outcome line moving from a 6 px to an 8 px gap under the merged `SaidBody.svelte`, kept under the orchestrator's choice Z1008 (`choices.md`). Both rest on reading and the reviews.

## What landed

O77 landed on main from base 796273a8, the whole range (one wip commit 87538a3c), 90 paths with the fixes at landing, on top of 2fa80109. The staged diff was applied in the gate worktree at 2fa80109, the diagrams regenerated there and copied to main; every one of the 90 staged paths on main equals the gate's file under `cmp`.

- A project card on a board is drawn closed; its title, Open project page and Enter open the project page beside the board as a preview tab.
- The card's actions: three icons under the pointer (Ask, Open Workbench, Open project page) and a "..." menu listing every action in words, also opened by a right-click anywhere on the card and by Shift+F10.
- The closed card: Next drawn as the ELI5 is, a WAITING ON line in amber above FUNDING, a red BLOCKED line and blocked chip, the folder's name at the end of the facts row; the chips in their word's colour.
- The project page in two columns, the left one holding STATUS, LATEST, NEXT with the whole `next`, RESULTS, OUTCOME and IDEAS / AVENUES.
- The Focus lane card: the name first, then one wrapping row of tags (stage, form, chips, then the role, the tier and the venue's short name); a tier word or role row flagged `unmarked: true` in `config/catalogs/vocab.yml` (set on `research` and `lead`) draws no tag; no review wait line; the people wait line names each person once.
- The Focus Filter action in the pane's header: Mine only, Role, Tier and, on a workspace of more than one hub, Hub; a hidden count per section. The Hub list also on the project boards' bar and the collection views.
- A Focus band card whose status carries `deadline_met` or `closes_deadline` draws no countdown.
- The two duplication copies and the six comment-width lines red on main ended; one `toggled` in `src/lib/state/shared/lists/lists.ts` for every list toggle.

## What was found

- The first review found a repeated `waiting-on:` value throwing and case 19 partial; repair round 1 closed them with ruling 383 and the round's other items.
- The review over round 1 found that the round's link and selection rule let the browser's whole menu onto a card, where the base showed none. Closed by ruling 384: the card's menu on a right-click anywhere on the card.
- The same review found the toggle rule imported from the session folds module and written again in three places, and a HELP sentence naming two kinds of page; both fixed at landing.
- Under the shipped words, ruling 383 takes the countdown off every Teaching card and every card under Funding's Submitted stage, which is what the ruling asks.

## Fixes at landing

Eight: the shared `toggled` in `lists.ts`; the HELP landing sentence; ruling 384's card menu; ruling 385's lane card, with wrapping tags and no "+N"; ruling 378 (a) as the `unmarked` flag on tier and role words, so no word and no list position is written in code; the chip colours on the lane card and the project board card; the wait line through `waitedOn`; the config-folder test's count of described keys (35) and the regenerated diagrams `layer-state`, `layer-views`, `layers` and `writes`.

## Verification

`npm run diagrams && npm run test:quick` in the gate after the last fix at landing: "test:quick: 89 changed file(s)", "50 test file(s)"; ok prettier, ASCII gate, svelte-kit sync, svelte-check ("544 FILES 0 ERRORS 0 WARNINGS"), eslint, vitest slow, vitest, vitest checks; "test:quick: 55.7 s; every command passed". Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

Case run of ruling 378 (a) over six projects: A `[]`, B `["Supervisor","Personal"]`, C `["Software"]`, D `["Lead","Research"]` (the flag stripped from the words), E `[]`, F `["odd"]`, each the expected result.

## Look

On 8790, the TEST page: a project card's `numbers still to run` chip drawn blue; Focus with 65 lane cards and none with "+N"; Clin-HCCNet's tags wrapping onto two rows; the two "Research" tags found on the page are venue names (JMIR, JMLR). On a scratch server on 8797 with two hubs: the blocked card's wait line reads "Waiting on Ashkan Pirmani", the person named once; theirs-one hidden by Mine only; the Filter menu lists Mine only, Role (Lead, Supervisor, Collaborator), Tier (Research, Personal, Software) and Hub (research-hub, hub-two).

## Usage

Builder a03c2980d7a4157d9: 301455 tokens, 218 tool uses, 28 min 52 s; round 1 363827 tokens, 263 tool uses, 31 min 31 s. Reviewer a88a9c6ce833fcaca: 355179 tokens, 92 tool uses, 17 min 7 s. Reviewer over round 1 a386cef4a5e53c123: 301674 tokens, 70 tool uses, 13 min 56 s. Brief check a0e953361e2056991: 297500 tokens, 106 tool uses, 13 min 50 s. The builder's first report did not pass its bar (one repair round); eight fixes at landing.

## Next

O78, collections and registries by flag (rulings 386, 387), then O79, O80 and O81.
