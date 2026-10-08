# M6 landing

Roadmap entry: oculus/migration (the cockpit-to-oculus migration). Plan step M6, the collection forms removed. Next: D43 (LaTeX navigation through texlab), on repair round 1; then D36 and D39 are prepared.

## Open items

None.

## The check of Steps 1

The builder a173480c420c38472 and both reviewers (a89f8c70199b6a617, add334d586072988b) had completed; the stop tool found none of them running, and the agent listing showed only D43's builder aab41ff6fa6e753ea.

## Not done

- The LinkedIn Add opening the new idea at line 9 was not seen on a page: the scratch hub has no LinkedIn folder, so the write is refused there with its sentence. `IDEA_BODY_LINE` (9) is covered by the unit run of `tests/server/edit/feeds.test.ts`.
- Not looked at on 8790: that server runs main's code and is Axel's to view.

## What landed

From base 0e9bde803, 161 files with the fixes at landing:

- The shared entry form, its drafts and the bookmark form are gone. A card's status, deadline and date are changed in place (`InPlace.svelte`).
- Add puts a new entry in the text of a source tab of the file with the caret in it. Edit in File opens the file at the entry and puts no text.
- While a source tab holds unsaved text of a file, every control that writes that file is disabled with `collection.file_unsaved` as its title, the reorder grip included (`Grip.svelte`). A write from any view or from an app over that file is refused before it is sent.
- Each entry holding a shared identity value carries its own fault, so Edit in File opens it by position.
- The LinkedIn stub and its body line live in one place (`data/prose/linkedin-idea.ts`).
- The desktop app's EPIPE guard (Z719).
- The folders `ui/display/table/`, `ui/display/ticker/` and `views/shared/forms/registry/`.
- `DESIGN.md`, `docs/window.md`, `docs/DATA-MAP.md` and the comment at `registries/data.yml:23` are corrected.
- G28 is widened in `agents/guarded.md`, with its test `tests/state/client/held-unsaved.test.ts`.

## What was found, and the fixes at landing

The builder's first report did not pass its bar; the first review's 13 findings went back in repair round 1, and the review over round 1 confirmed each closed. Two fixes at landing:

- The career file's default is named once, `CAREER_FILE` in `data/helpers/hub-names.ts`, read by the page's write naming (`state/sessions/source/write-files.ts`), the server's career write (`server/edit/writes/subtasks.ts`) and `data/index.ts`. Before, the page named no file when the config had no `career_file` while the server wrote `registries/career.yml`, so a host write went out over an unsaved tab of that file.
- `tests/data/sources/career.test.ts` imports the constant from its new place; the gate's first run was red on that import.

Closed without code: the report's first line counts Leads' mount-time "today" as a change though it is base code; the builder ran two read-only git commands in round 1, disclosed in its report.

Booked as D39's Step 0: `diskName` takes `engine:<name>` and `hub:tools/oculus/config/<name>` as one file even when the engine is served from outside the hub (a server run from a worktree over the main checkout), which refuses a write too many there and loses no edit. Deciding one file by the roots' real folders is the overlay D39's case 18 builds.

## Verification

Gate in `.agents/worktrees/gate` at 7a9d9a4ab with M6's range and the fixes:

```
test:landing: 6 commands, from /Users/axelfaes/workspace/research-hub/.agents/worktrees/gate/tools/oculus
ok      ASCII gate (0.9 s)
ok      npm run format:check (24.7 s): All matched files use Prettier code style!
ok      npm run lint (78.7 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm test (111.2 s): Duration  107.11s (transform 47.11s, setup 0ms, import 328.87s, tests 67.53s, environment 171ms)
ok      npm run test:checks (228.4 s): Duration  224.22s (transform 36.04s, setup 0ms, import 144.40s, tests 339.75s, environment 4ms)
ok      npm run check, then npm run build, then npm run test:slow (332.2 s): Duration  202.37s (transform 14.61s, setup 0ms, import 118.62s, tests 268.53s, environment 101ms)
test:landing: 332.2 s; every command passed
```

G48, `npx vitest run tests/server/desktop/start.test.ts` in the gate: `Test Files 1 passed (1)`, `Tests 5 passed (5)`; `pgrep -fl app-harness` printed nothing afterwards. Main's staged diff is byte-equal to the gate's (`cmp` of the two `git diff --cached`). The A/B: no `bench:` line, none run.

## The look

On a scratch oculus on port 8796 served from the gate, with the gate checkout as its hub and its own `HOME`, stopped afterwards:

- Data: Add opened `registries/data.yml` in a source tab with a new entry (`key: ""`, `name: ""`) at line 1070 and the caret in it; the tab shows unsaved. Data cards draw no write controls.
- Funding (Academic Life): Add opened `funding/funding.yml` with `title: ""` and `status: in-prep` at line 160, caret in the title. All 11 reorder grips were drawn off, titled "funding.yml has unsaved text in a tab; save or revert it first", with no grab cursor; 35 controls carried that title, the status selects and date inputs disabled. Edit in File and Show in Files stayed enabled.
- Position Leads: Add lead opened `feeds/position-leads.yml` with `title: ""`, `status: open` and `date: 2026-10-08`, the date of the press.
- LinkedIn: Add Idea answered "A write was refused: the LinkedIn folder is not on this hub" (see Not done).
- Venues: the deadline label reads the catalog word "deadline" where a card has no conference label.

## Agents

- Builder a173480c420c38472 (claude-sonnet-5-5): 313,550 tokens, 521 tool uses, 111.3 min; round 1 280,133 tokens, 136 tool uses, 35.8 min.
- Brief check a0ebc241025bf8a8f (claude-opus-5-5): 338,515 tokens, 132 tool uses, 16.3 min; closed by ad9ce45922c35f90e, 150,543 tokens, 121 tool uses, 23.1 min.
- Reviewer a89f8c70199b6a617 (claude-opus-5-5): 237,976 tokens, 162 tool uses, 26.8 min.
- Reviewer over round 1 add334d586072988b (claude-opus-5-5): 304,586 tokens, 72 tool uses, 16.2 min.

First report passed its bar: no. Fixes at landing: 2.

## Next

D43's repair round, its review over the round and its landing; then /spec D36 and D39.
