# O195 landing

Position: the migration plan, step O195, no hub's settings in oculus's defaults, landed (497 of the plan's 541 step lines ticked). Next: the app rebuilt from main and copied over `~/Applications/oculus.app`; then open item 790 waits for Axel. No step is in flight.

## Open items

- Open item 790 (2026-11-26, O195's look, on a copy of the demo hub; the Settings form code `src/lib/state/system/config/` is not changed by O195): two defects of the Settings view's row settings, which no step of the plan covers. (1) After a Save that clears a field of a row (`update_tasks` `stale_days`, and `last_run`, which predates O195), the file is written ('Saved into hub/.oculus/config.yml.', the key taken off or set to ""), but the scope bar keeps '1 unsaved change', the tab stays marked unsaved and Save stays on; a second Save writes nothing and shows nothing; a reload clears it. (2) A task name of the wrong form typed into a row's task box ('Bad Name') stages no change and shows no sentence, though the form holds the sentence `workbench.settings_not_task_name` ('It must be lowercase letters, digits and dashes, starting with a letter.', `src/lib/state/system/config/editors/fields.ts:484`); a `stale_days` box in the same row shows its sentence beside the box. Options: (a) a new step that ends both: a Save that lands drops the change it saved, a cleared row field included, and a row's text field of a form draws its refusal sentence beside the box as a number box does, each with its test. Pro: the count and the refusal tell the truth about the file, on every row setting. Con: one more step before the plan closes. (b) Leave both. Pro: no work. Con: the Settings view keeps showing an unsaved change that is saved and keeps dropping a bad name without a word; this is the lazy option. Recommendation: (a).

## Agents stopped

The runner's agent listing (ListAgents) showed no subagent of this session before the worktree's wip commit; the builder a0db48830a7bff490 was stopped earlier on Axel's word, and the round's builder and both reviewers had ended.

## NOT DONE

- The research hub's lines are written into `~/workspace/research-hub/.oculus/config.yml` and `.oculus/workspaces/research-hub.yml` and are not committed there: a hub commit needs Axel's word.
- The app is not rebuilt yet; it is the next action.

## What landed

The whole range from ff548136a (wip commit a438700b4: the build and repair round 1), 52 paths, 438 insertions and 289 deletions:

- `stale_days` on a row of `update_tasks`, the row's threshold for the Focus refresh strip; a row without it is never nudged. `refresh` reads each offered task's threshold; `FEEDS`, `staleAfter` and `focus.refresh_stale_days` are gone.
- `website.files` and `website.file_header` ship empty. Write the website is off while a path is empty, its tip naming the first one (`career.website_no_path`), and the audit gives one finding for it.
- `scan:` ships empty, and the demo hub has its own six rules.
- The shipped Incoming arrangement holds no LinkedIn.
- A session's Details show its id (`sessions.f_id`) right under the title.
- The keys `focus.command.radar_glyph` and `refresh_radar_plain` are renamed, and `HUB_SCAN` and `HUB_SCAN_LINES` are frozen in `tests/fixtures/hubs/hub-build.ts`.

Fix at landing: S5 of the review over round 1. `tests/routes/sessions/website.test.ts` and `tests/state/sessions/source/website-store.test.ts` import the four paths and `PATHS` from `tests/fixtures/hubs/website-hub.ts` and drop their local copies.

Ledger: `agents/guarded.md` G125, G139 and G140 carry the new test titles, and G140 says the button is off with `career.website_no_path` while a path of `website.files` is empty.

Hub lines (in the research hub, uncommitted): `stale_days` 31, 7 and 2 on litwatch, scout and inbox, with the comment; `website.file_header` and the four `website.files` paths; `focus.refresh_stale_days` removed from the workspace file, and an `incoming` arrangement with LinkedIn added there. Both files parse and are ASCII.

## Verification

In the gate at main's head 3b2aaf955 with the range and the fix, `npm run diagrams && npm run docs:palette && npm run test:quick`:

- The diagrams are unchanged by the rerun. Prettier, the ASCII gate, svelte-kit sync, eslint, svelte-check (595 files, 0 errors, 0 warnings) and vitest checks are ok.
- vitest `Test Files  7 failed | 208 passed | 53 skipped (268)` and vitest slow `Test Files  3 failed | 69 passed (72)`; `test:quick: 443.1 s; failed: vitest, vitest slow`. All 20 failures in the 10 files are time-outs (`Test timed out in 20000ms`, `in 5000ms`, `Hook timed out in 10000ms`), run while Microsoft Defender and Spotlight held the load average near 20.
- Each of those files run alone once, all green: hub-portfolio 16, self 17, hub-vocab 33, cv-fields 23, latex 2, website 25, git routes 9, lsp formatting 4, choices 11, hub-words 5 tests passed.
- Main's staged diff equals the gate's (`cmp` of the two diffs: identical).
- Not covered: tests that reach no changed file within the import depth. The verify list was not changed. A/B: none, `bench: []`.

## The look

On scratch servers on port 8797, built from the gate.

Over the research hub's workspace, with a scratch HOME:

- **Focus Command center.** No refresh line, the same as before the step by its inputs: Lit Watch last ran 2026-11-11 (15 days, under 31, which the old workspace override also gave), Scout ran today (under 7), and the inbox threshold is 2 before and after.
- **Incoming.** Inbox, Position Leads and LinkedIn are pinned, then Calendar.
- **Career.** Write the website is on, and its tip names `_data/data.yml`, `_data/publications.yml`, `_data/industry.yml` and the CV command. A written file opens with the same header as before; the hub's CV file already opens with it.
- **Findings.** Nothing on `website`, `stale_days` or `refresh_stale_days`.
- **Settings, `update_tasks`.** `stale_days` is drawn as a box holding 31. `-1` is refused with 'It must be a whole number of at least 0.' and `1.5` with 'It must be a whole number.'. Nothing was saved, and the hub's `config.yml` diff is still the 16 hub lines.
- **Session Details.** This session's Details, on the Sessions view and on its Session tab, show `id` `be0ac0d7-a551-4911-a072-9f76e1bbe399` under the title.

On a copy of the demo hub with two update tasks:

- **Settings.** A cleared `stale_days` box, saved, takes the key off the litwatch row and leaves scout's.
- **Codex session.** A rollout's Details show `id` `01a082ee-1054-7da0-82c8-7ca8345d7114`.

`npm run docs:shots` in the gate: `focus.png` and `projects-board.png` are byte-identical to the committed copies, so the demo boards hold the same projects under the demo's own `scan:`. `explorer.png` differs in bytes with no visible change, and the committed copy is kept.

Found outside the step: open item 790. When the look's server started on the research hub, it published the calendar and the mail ('calendar publish: ok', 'mail publish: ok'); Google is not set up under the scratch HOME.

The scratch servers are stopped and their folders removed.

## Agents

- Builder a0db48830a7bff490 (claude-opus-5-5): 318996 tokens, 400 tool uses, 7597 s.
- Builder of round 1 a35e719b19dd40e1b (claude-opus-5-5): 236437 tokens, 91 tool uses, 843 s.
- Brief check a9f9d46d8a75327c7 (claude-opus-5-5): 268099 tokens, 107 tool uses, 831 s.
- Reviewer afbd02dbc48b6edac (claude-opus-5-5): 267542 tokens, 80 tool uses, 855 s.
- Reviewer over round 1 a858fb2614d74b42d (claude-opus-5-5): 182603 tokens, 41 tool uses, 458 s.

The builder's first report did not pass its bar: the review found SP1, SP2, P1 to P5, S1 to S4, B1 and B2, which went out in repair round 1. The review over round 1 closed them all and found SP3 and S5. S5 was fixed at landing, and SP3 is recorded with no change.
