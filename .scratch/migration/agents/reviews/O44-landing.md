# O44 landing

Position: the cockpit-to-oculus migration, step O44 (every text over a wallpaper on a surface, the header toolbar that flipped every frame, the Focus rows at one size) landed; O46 (settings in files, state in `~/.oculus`, every key described) is building; then O39.

## Open items

None.

## The check of Steps 1

`ListAgents` before the landing: O44's builder a71415c7ab4e7e66f and its first reviewer a1d6c8c010b60b74b not listed; the reviewer over round 1 abfb7d795db113b8b listed as completed. No agent of O44 was running.

## NOT DONE

Nothing of the brief. The look covered TEST's Data and FWO entry views and, read only, Axel's Focus, Incoming and Literature pages; History, Processes, Apps, Gallery, Diff, a free float and the presenter view were not opened.

## What landed

- Part 1: the header toolbar reads every width in fractional pixels and its room from the `[data-toolbar-room]` span Pane's header lays out beside it; a toolbar with no such span draws every control (`Toolbar.svelte`, `fit.ts`, `watch.ts`, `Pane.svelte`).
- Part 2: `src/lib/ui/frame/Surface.svelte` on `--panel-on-wall`; `tinted` on History, Processes, Apps, AppTree and the Markdown preview; Surfaces on the parts of card views outside a card; `data-surface` on every painted layer; table heads clear unless `stays`; a free float the one layer and a docked float clear; the shell's breadcrumb row, folded strip and tab menu line on the surface (Z958); Markdown's `surface` prop removed; the sash files moved to `ui/frame/sash/`; DESIGN.md:249 and :658.
- Part 3: the Focus board's needs-attention and awaiting rows, and the career panel's rows, at `--fs-xs` with a 14 px line.
- Fixes at landing: six comments rewrapped at 100 columns (`Inbox.svelte`, `Leads.svelte`, `Linkedin.svelte`, `Literature.svelte`, `Radar.svelte`, `Toolbar.svelte`); `agents/reviews/O44-report.md` carries the round's section from the builder's final message and a "Corrections at landing" section.

## Verification

- On main, from `tools/oculus`, `checks.sh` over the verify list: `test:quick: 112.3 s (limit 45.0 s); every command passed`, `checks: 1 commands passed`.
- In the gate at main's head 2194a3704 with the range and the fixes (staged diff hash `66ba39da` on both): `npm run diagrams && npm run test:landing`, eight commands `ok`, `test:landing: 703.9 s; every command passed`; the regenerated diagrams equal main's.
- No A/B: the configuration names no bench.

## The look

On 127.0.0.1:8790 under rice with a wallpaper, read only:
- TEST, Data: the intro paragraph and the count line each on a surface; the filter bar on the panel mix; the cards unchanged.
- TEST, FWO entry: the card and the edit section each on a surface.
- Focus page: "8 manifests behind their docs" at the size of "3 emails to reply"; the awaiting names at their labels' size, the box on one surface.
- Incoming page: a MutationObserver over the two header toolbars (Inbox, Calendar) counted 0 changes in 2 s, against 113 to 117 flips before the step.
- Literature page: Literature search's head, Lit Watch's intro and Literature's intro and empty line each on a surface.
The palette's Focus entry opens the Focus page rather than a view on TEST, so the last three were looked at on Axel's pages without a change; the tab was put back on Focus.

## What was found

- The review over round 1: Standards 1 and 2, both fixed at landing. Spec, Proof and Behaviour: none.
- The builder did not write its round section into its report file; the orchestrator carried it from the final message.

## Agents

- Builder a71415c7ab4e7e66f: 348,648 tokens, 54 tool uses, 15.6 min; resumed after Z950: 270,352 tokens, 515 tool uses, 89.3 min; round 1: 254,117 tokens, 149 tool uses, 19.1 min.
- Brief check a08597bfebc889217: 236,913 tokens, 83 tool uses, 12.5 min.
- Reviewer a1d6c8c010b60b74b: 341,822 tokens, 99 tool uses, 16.8 min.
- Reviewer over round 1 abfb7d795db113b8b: 277,673 tokens, 77 tool uses, 12.2 min.
- The builder's first report did not pass its bar (five findings sent as round 1); two fixes at landing.

## Next

O46's report, its review and its landing; then O39.
