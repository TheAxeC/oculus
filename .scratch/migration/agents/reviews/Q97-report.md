Everything in the brief and in repair round 1 is done. The full verify list was not run in this round, as the round says; the orchestrator runs it on main at landing.

## Open items (verbatim from the state file)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

## The cases' first run

Run in a scratch copy of the worktree's `tools/oculus` outside the repository (`<scratchpad>/q97copy/oculus`, `node_modules` linked to the worktree's, deleted after the runs; `ls` of it then prints "No such file or directory"), with the step's tests and the base's `config/layout.yml` (`Q97-base-layout.yml`, the orchestrator's copy) in place. Command: `npx vitest run` over the eight test files of the brief (`rail-config`, `config-folder`, state `catalogue`, Views `catalogue`, `arrangement`, `settings`, state `rail`, shell `rail`).

Result on the base layout: `Test Files  7 failed | 1 passed (8)`, `Tests  10 failed | 128 passed (138)`. The failing tests:

```
 FAIL  tests/checks/config/config-folder.test.ts > oculus's own config directory > keys every catalogue group by the rail page it holds, in rail order, Help after System
 FAIL  tests/shell/rail/rail-config.test.ts > the rail of the real config > draws the twelve pages of layout.yml in their order, Views and Settings last
 FAIL  tests/shell/rail/rail-config.test.ts > the rail of the real config > draws the Help button with the question glyph, the Help view's own
 FAIL  tests/state/workbench/navigation/arrangement.test.ts > the shipped pages > draws the twelve buttons in the ruled order, Help right after System
 FAIL  tests/state/workbench/navigation/arrangement.test.ts > the shipped pages > makes every page as the rulings lay it out, pane by pane
 FAIL  tests/state/workbench/navigation/arrangement.test.ts > a System page saved before the Help page was its own > makes the Help page from its shipped arrangement on its first press, tied to help
 FAIL  tests/state/workbench/navigation/catalogue.test.ts > the catalogue of the real config > lists one group per rail page, in rail order, labelled with its button, and Help after System
 FAIL  tests/state/workbench/navigation/rail.test.ts > the rail pages the page hands the shell > reads the shipped list in its order, Views and Settings last
 FAIL  tests/views/system/workbench/catalogue.test.ts > the Views catalogue > draws each group under its heading, with its chord letter where it has one
 FAIL  tests/views/system/workbench/settings.test.ts > the rail half > draws one row per button of the file, holding its label
```

So on the base every case fails except three, which pass: the one-page rule (`arrangement.test.ts:294`, the base keeps every entry on one page), the saved System page keeping its old tabs (`arrangement.test.ts:395`), and the Help section's five entries at `h1` to `h5` (`views/.../catalogue.test.ts:61`, `:81`). Those three are audits of rules this step keeps.

Then, in the same scratch copy with the step's `config/layout.yml`, each change undone on its own (the rest of the step's layout kept), the same eight files:

| Change undone | Result | Failing tests |
|---|---|---|
| the Help rail line removed | `Tests  10 failed \| 128 passed (138)` | config-folder `keys every catalogue group...`; rail-config `draws the twelve pages...` and `draws the Help button with the question glyph...`; arrangement `draws the twelve buttons...`, `makes every page... pane by pane`, `puts every view... on exactly one page`; state catalogue `lists one group per rail page...`; state rail `reads the shipped list in its order...`; Views catalogue `draws each group under its heading...`; settings `draws one row per button...` |
| `info` back to the two-pane split | `Tests  2 failed \| 136 passed (138)` | arrangement `makes every page... pane by pane`, `puts every view... on exactly one page` |
| the `help` arrangement removed | `Tests  9 failed \| 129 passed (138)` | config-folder `keys every catalogue group...`; rail-config `draws the twelve pages...` and `draws the Help button...`; arrangement `draws the twelve buttons...`, `makes every page... pane by pane`, `puts every view... on exactly one page`, `makes the Help page from its shipped arrangement...`; state rail `finds nothing wrong with the shipped rail list` and `reads the shipped list in its order...` |
| the Help glyph `question` changed to `page` | `Tests  1 failed \| 137 passed (138)` | rail-config `draws the Help button with the question glyph, the Help view's own` |

The Views view's heading test (repair item 1) fails with the Help rail line removed and passes with it.

Each case, the test that is it, and what turns it red:

| Case | Test | Red when |
|---|---|---|
| `railPages(shipped)` as `label:page`, twelve | `arrangement.test.ts:248` | the Help rail line or the `help` arrangement is removed |
| `ActivityRail` draws twelve `data-rail-page` in order | `rail-config.test.ts:30` | the Help rail line or the `help` arrangement is removed |
| the `help` button draws `data-glyph="question"` | `rail-config.test.ts:40` (new) | the glyph is changed, or the Help rail line or `help` arrangement is removed |
| the pages pane by pane | `arrangement.test.ts:265` | `info` goes back to two panes, or the Help rail line or `help` arrangement is removed |
| every placed entry on exactly one page | `arrangement.test.ts:294`, unchanged | `info` goes back to two panes, or the Help rail line or `help` arrangement is removed; passes on the base (audit there) |
| the config's groups equal the rail's pages and labels | `config-folder.test.ts:450` | the Help rail line or the `help` arrangement is removed |
| the catalogue's sections, state fold | `state/.../catalogue.test.ts:260` | the Help rail line is removed |
| the catalogue's sections, Views view | `views/.../catalogue.test.ts:51` | the Help rail line is removed |
| the Help section's entries at `h1` to `h5` | `views/.../catalogue.test.ts:61`, `:81`, unchanged | audit: this step changes no group membership or chord |
| the Settings rail half: 12 rows | `settings.test.ts:96` | the Help rail line is removed |
| a saved System page keeps its old tabs | `arrangement.test.ts:395` (new) | audit of the existing keep-what-was-arranged rule of `openRailPage` |
| the Help page made on its first press, tied to `help` | `arrangement.test.ts:403` (new) | the `help` arrangement is removed (audit of the same rule otherwise) |

## What to build

| Item | State | Where | Proof |
|---|---|---|---|
| 1. `config/layout.yml`: Help rail entry after System, `help` arrangement after `info`, `info` one pane, `nav_groups` comment | DONE | `config/layout.yml:20`, `:24`, `:98-106` | `grep -c "label:" <(sed -n '/^rail:/,/^$/p' config/layout.yml)` prints `12`; the `nav_groups` entries are unchanged |
| 2. head comments of `catalogue.ts`, `Help.svelte`, `Memories.svelte` | DONE | `catalogue.ts:2-3`, `Help.svelte:2-3`, `Memories.svelte:2-3` | `grep -n "no page"` over the four files prints only `config/layout.yml:44` ("An arrangement that does not add up makes no page."), which is not about the Help group; a diff against main shows only the comment lines changed |
| 3. `HELP.md:19`, `:68` | DONE | `HELP.md:19`, `:68` | word diff against main: only these two lines changed |
| 4. `DESIGN.md:269`, `:282` | DONE | `DESIGN.md:269`, `:282` | `:269` reads "(`f`, `m`, `p`, `e`, `s`, `c`, `l`, `r`, `t`, `y`, `h` and `w`, one per rail page)"; `:282` reads "a listed view of the Help page's group" |
| 5. tests changed to the twelve-page rail and the new cases | DONE | the eight test files of the brief | see the checks below |
| Round 1, item 1: the Views view's heading test compares with the loaded config's rail labels | DONE | `tests/views/system/workbench/catalogue.test.ts:54` | `expect(headings).toEqual((config.rail as { label: string }[]).map((entry) => entry.label));`, the Help-after-System check kept at `:55`, the unused `SHIPPED_RAIL_LABELS` import removed; red with the Help rail line removed (table above) |

Accepted edits outside the brief's path list, as the orchestrator ruled: `config/text/app.yml:12` (the `h1-h5` row of the key sheet) and `DESIGN.md:81` (the sentence that called Help a group with no page).

`npm run diagrams` leaves `docs/diagrams` identical to main (`diff -rq` prints nothing).

### Checks, run from the worktree in this round

- The eight test files: `Test Files  8 passed (8)`, `Tests  138 passed (138)`.
- `npm run check`: exit 0, `COMPLETED 1433 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run format:check`: exit 0, `All matched files use Prettier code style!`.
- `npm run lint`: exit 0.
- `LC_ALL=C grep -n '[^ -~]' tests/views/system/workbench/catalogue.test.ts` prints nothing.

The full verify list was not run in this round, as instructed. Its one run in the first round was red at `npm test` on timeouts in `tests/server/core/git.test.ts` and `tests/server/git/git-ops.test.ts`, which this step does not touch. `tests/checks/tree/duplication.test.ts`, `tests/checks/tree/scratch.test.ts` and `tests/checks/source/comment-width.test.ts` also timed out in that run; they scan this step's files and passed when run on their own (22 of 22). The other five commands of the list passed.

## Files, line counts before and after

| File | Before | After |
|---|---|---|
| `config/layout.yml` | 181 | 184 |
| `config/text/app.yml` | 65 | 65 |
| `src/lib/state/workbench/navigation/catalogue.ts` | 263 | 263 |
| `src/lib/views/system/help/Help.svelte` | 91 | 91 |
| `src/lib/views/personal/memories/Memories.svelte` | 426 | 426 |
| `HELP.md` | 296 | 296 |
| `DESIGN.md` | 321 | 321 |
| `tests/shell/rail/shipped-rail.ts` | 33 | 35 |
| `tests/shell/rail/rail-config.test.ts` | 114 | 123 |
| `tests/checks/config/config-folder.test.ts` | 682 | 681 |
| `tests/state/workbench/navigation/catalogue.test.ts` | 414 | 395 |
| `tests/views/system/workbench/catalogue.test.ts` | 114 | 109 |
| `tests/state/workbench/navigation/arrangement.test.ts` | 455 | 547 |
| `tests/views/system/workbench/settings.test.ts` | 139 | 139 |

## Judgment calls

- The saved-System-page case lives in `arrangement.test.ts` as its own describe block, with the old `info` arrangement written out in the test (`OLD_INFO`) and the page saved and reloaded through a fake storage, so the case runs over a layout that was saved, not one still in memory.
- The Help glyph case is a separate test in `rail-config.test.ts` that reads the `help` button's markup from the rendered rail.
- The arrangement test title at `:248` drops "Incoming new and Info/more named System" for "Help right after System".
- In the first-run copy, `node_modules` was a symbolic link to the worktree's rather than a copy; nothing was written through it.

## Limitations and sharp edges

- Brief decision 4 stands: in a browser that saved a System page before this step, the manual, the three hub documents and the Memories wall sit on both the saved System page and the new Help page until that System page is Reset. The one-page test (`arrangement.test.ts:294`) checks the shipped arrangements, not saved layouts.

## The user-visible change

- The rail. Before: eleven buttons, System then Views and Settings. After: twelve, Help (glyph `question`) between System and Views and Settings. Help is the eleventh button, past the digits 1 to 9 like System and Views and Settings, so no digit shortcut changes.
- The System page. Before: a 0.6/0.4 split, left Status, Findings, Audit, History, Config, Gallery, Help, HPC how-to; right Research approach, Agent approach, Memories. After: one pane of Status, Findings, Audit, History, Config, Gallery.
- The Help page. Before: none. After: a 0.6/0.4 split, left Help and HPC how-to, right Research approach, Agent approach, Memories.
- The catalogue. Before: one section per rail page plus a Help section after System that was no page. After: one section per rail page in rail order, Help among them after System, with the same five entries at `h1` to `h5`.
- The key sheet, `config/text/app.yml:12`. Before: "h1-h5 | open the manual, the Memories wall or a hub document, the Help group". After: "h1-h5 | open the manual, the Memories wall or a hub document, the Help page's group".
- A saved System page. Before and after: shown as saved until its Reset; after Reset it is the one-pane System page. The Help page is made from its arrangement on its first press.
