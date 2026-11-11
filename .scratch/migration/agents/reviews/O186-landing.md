# O186 landing

Position: the oculus migration plan, step O186 (every file row of Settings opens its file), the last open step of `plan.md`. Next: none; every step of `plan.md` is ticked or removed and the queue is empty.

Open items: none.

Check of Steps 1: ListAgents showed no subagent running; the builder a87bf6fcc96c1b7f7 and the reviewer a739bf17e54eff7c3 had both finished.

NOT DONE: nothing inside the step. The installed app (`~/Applications/oculus.app`, 1.1.0) shows the change only from its next build.

## What landed

The whole range from base 448c2b636 (the builder's build in the wip commit 8c04d5cc2) with the fixes at landing, 8 paths, 50 insertions and 38 deletions:

- `config/text/views/system/workbench.yml`: `settings.show_file` (Show File) and `settings.show_file_tip` ("Open oculus's {0} in a tab that only reads it"); `settings_open_unavailable` removed; the six catalog sentences and `texts_about` say the open workspace lays its own values over oculus's in its workspace file's `settings:`, under the key each names.
- `src/lib/views/system/workbench/settings/List.svelte`: every file row draws Show File, which calls `showOculusFile` (the read-only `:oculus` route, the function Show Defaults now calls too), then Open file where `openTarget` finds a workspace folder holding oculus's `config/`; the unavailable span and its `.unavailable` rule removed.
- `src/lib/state/system/config/groups.ts`, `config-files.ts`, `scopes/rows.ts`, `view/folders.ts`: comments say the same.
- `src/lib/server/files/workspace/oculus-config.ts` (head, lines 1-6) and `src/lib/state/sessions/source/draft.ts` (`loadSourceReadonly`'s doc): name Show File beside Show Defaults; both joined the step at landing.

## Found, and how each was closed

- Review Spec 1, the rename of `showDefaults` to `showOculusFile`: kept, since one function serves both buttons.
- Review Proof 1: the builder's report table gives `workbench.yml` as +8 -9; `git diff --numstat` gives 9 insertions and 8 deletions. No decision rests on it.
- Review Standards 1: `desc_unimath` says symbols in place of commands (fixed at landing).
- Review Standards 2: `desc_latex` names its sections (notice, at, environments, chords, symbols), each replacing oculus's section whole; `desc_agents` says oculus's in place of these (fixed at landing).
- Review Standards 3: the head of `oculus-config.ts` and the doc of `loadSourceReadonly` name Show File (fixed at landing).
- Review Standards 4: the FileRow comment of `view/folders.ts` reworded (fixed at landing).
- Review Behaviour 1, the code spans in the new sentences: checked in the look below.
- Premise correction at /spec: only `catalogs/vocab.yml` is a hub key (`src/lib/data/shapes/hub-keys.ts`); the six other catalogs and `text` are set in the open workspace file's `settings:` (`src/lib/data/sources/config/merge/workspace-layer.ts:1-18`).

## Verification

In the gate at main's head 588f1649a with the range and the fixes: `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      ASCII gate (1.6 s)
ok      svelte-kit sync (3.8 s)
ok      eslint (17.0 s)
ok      svelte-check (23.1 s): 1794410626926 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (55.9 s)
ok      vitest (58.9 s)
ok      vitest checks (77.4 s)
test:quick: 81.5 s; every command passed
```

Main and the gate give the same staged diff under `cmp` and the same tree under `git write-tree`, `b8704b9a04cccb5e21ae447505360a7a1076c86b`. No benchmark is on this plan's list, so there is no A/B.

## The look

On a scratch server at 8797 from the gate, the Settings view opened from a rail button's Settings menu item:

- The installed app's case (the scratch workspace holds no checkout of oculus): all 78 rows (7 catalogs, 3 schemas, 68 texts) draw Show File alone with its tip, and no row draws the old line. Show File on `catalogs/glyphs.yml`, `schemas/deck-schema.yml` and `text/views/system/workbench.yml` each opened a source tab with the banner "This file is read-only on this machine".
- The new sentences draw on the six heading lines (Appearance, Editor, Sessions and usage), on the six Catalogs rows and as the Texts group's sentence, each with its two code spans in monospace. A search for "workspace file" keeps those rows (26 settings found).
- The held case (the gate added as a folder of the scratch workspace for the look): all 78 rows draw Show File then Open file; Open file on `catalogs/icons.yml` opened the gate's copy editable, with no banner. The workspace file was then restored (shasum `bc03950ae5cba95eda955174115d7b70c3dfba63`, as before), the gate held only its staged paths, the server was stopped and the tab closed.

## Agents

First report's bar: met; no repair round; one full run of the verify list by the builder.

- Builder a87bf6fcc96c1b7f7: 163427 tokens, 52 tool uses, 457.5 s.
- Brief check acb6e5a864c75ef20: 181473 tokens, 50 tool uses, 413.5 s.
- Reviewer a739bf17e54eff7c3: 152376 tokens, 25 tool uses, 343.7 s.

All on claude-opus-5-5.
