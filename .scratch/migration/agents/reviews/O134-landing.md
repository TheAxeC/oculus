# O134 landing

Roadmap entry: the cockpit-to-oculus migration. Step O134, a Notes section in the templates page (ruling 649). Next: O131, the editor holds a one-text `multi` value to its words, whose review over round 1 has reported; then O133 prepared again (rulings 648 and 652) and O132 (ruling 647).

## Open items

- None.

## Steps 1

The runner's agent listing showed none of O134's agents running: the builder aadfda5f340a408b4 and the reviewer a05c46e52aec55295 had each sent their completion notice. The one subagent then running was O131's reviewer over round 1.

## Not done

Nothing.

## What landed

O134 landed on main from base c41dc24ec, the whole range (the wip commit 2c99149dc) with the fixes at landing, 2 paths, 17 insertions and 4 deletions:

- `docs/templates.md`, "Where each file goes": the row `notes/<name>.md` | `<hub>/.oculus/notes/` | New Note, or you; the sentence over the bullets reads "These have no template, since they hold pictures or oculus writes them:"; the notes bullet names `order.json` alone.
- `docs/templates.md`: the section `notes/<name>.md` before `project.yml`, with the copyable head (`---`, `tags: []` with its comment, `---`) and the rule it follows.
- `docs/data-map.md:23`: the notes are written by New Note and you, `order.json` by oculus.

Premise corrected: the brief said the header is hidden in the preview and the editor. The editor shows it (`src/lib/views/sources/source/Editor.svelte:25-28` opens the file as written; `grep -rnE "setHiddenAreas|hiddenAreas" src` prints nothing). The builder left the clause out, and the section says the preview hides the head.

## Verification

In the gate worktree, `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      ASCII gate (2.3 s)
ok      svelte-kit sync (5.1 s)
ok      svelte-check (16.0 s): 1793721646082 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (25.3 s): Duration  4.44s (transform 1.60s, setup 0ms, import 3.90s, tests 27ms, environment 1ms)
test:quick: 30.6 s; every command passed
```

After the heading fix, `npm run test:quick` again: "test:quick: 17.1 s; every command passed". `npx vitest run tests/checks/config/templates.test.ts tests/routes/hubs/make.test.ts`: "Tests  40 passed (40)". `npx prettier --check docs/templates.md docs/data-map.md`: "All matched files use Prettier code style!". The ASCII gate over both files printed nothing. The diagrams and the palette page were unchanged, and the staged diffs of main and the gate are equal under `cmp` (exit 0). The verify list equals the page's commands. No A/B: the configuration names no bench.

## Fixes at landing

- The review's Standards 1 (`docs/templates.md`, the tags sentence): it now says a tag of digits only is not read, that a `#` inside the head starts a YAML comment so a tag is written there without it or quoted (`"#paper"`), and that a `#word` in the note's text is of letters, digits, `_`, `-` and `/`, not only digits, and not in code, as `docs/HELP.md:405` says.
- The review's Standards 2 (`docs/data-map.md:23`): the notes are written by New Note and you, `order.json` by oculus.
- The look: the headings `## notes/<name>.md` and `## workspaces/<name>.yml` (line 667, drawn the same way before the step) were drawn as "notes/.md" and "workspaces/.yml", since the page reads `<name>` as an HTML tag. Both are written with `\<` and are drawn whole, in the headings and in the contents. No link in `docs`, `src`, `tests` or `README.md` names either anchor.

The builder's first report passed its bar; three fixes at landing.

## The look

A scratch server on 8797 from the gate. The Help view's Templates tab shows the new table row, the section `notes/<name>.md` with its block and its rule, and the contents entries `workspaces/<name>.yml` and `notes/<name>.md`. No console error. The server is stopped and 8797 is free.

## Usage

- Builder aadfda5f340a408b4: 132004 tokens, 45 tool uses, 6 min 14 s.
- Brief check: none, a small text step.
- Reviewer a05c46e52aec55295: 131236 tokens, 31 tool uses, 6 min 6 s.

All served claude-opus-5-5.

## Next

O131's landing with its review over round 1; /spec O133 again; /spec O132.
