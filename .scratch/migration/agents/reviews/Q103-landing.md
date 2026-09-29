# Q103 landing

Position: oculus/migration, step Q103 (the Live HPC view's failure text and a collapsible capacity section) landed; next, Q86c's /spec at the free slot, with D13b and Q83 in their repair rounds.

## Open items

None.

## Check of Steps 1

The agent listing showed the builder (aa5de1ddb633d20ec) gone and the reviewer (ad4b42fc960e4a45e) completed; the only running agent was D13b's reviewer, of another step.

## NOT DONE

The look at the capacity fold, its inner sinfo fold and the per-pane held state: the cluster was unreachable from this machine, and the view draws no capacity section without sinfo rows. Booked in the state file's Booked section as a look owed.

## What landed

`state/system/hpc.ts` (`HpcViewState`, `parseHpcState`, `toggledHpcState`), `Capacity.svelte` (the capacity fold holding the meters and the sinfo fold, each held per pane), `Hpc.svelte` (`Empty` for fetching, `p.said` for the unreachable line), `Head.svelte` (the hint `code` in the mono font at `--fs-sm`), four `capacity_*` keys in `config/text/views/system/hpc.yml`, the six layer diagrams, and the tests.

## Verification on main (from tools/oculus)

- `npm test`: 375 files, 5910 passed, 1 skipped
- `npm run check`: COMPLETED 2130 FILES 0 ERRORS 0 WARNINGS
- `npm run build`, `npm run format:check` (All matched files use Prettier code style!), `npm run lint`, the ASCII grep
- `checks: 6 commands passed`

## Found and fixed at landing

- The six diagram files were outside the brief's path list; `npm run diagrams` on main changes nothing.
- The meters sat flush under the fold's summary and over the sinfo summary; `.capacity > .meters { margin-block: 10px; }` in `Capacity.svelte`.

## The look on TEST

Live HPC, unreachable state: `p.said` at 12.5px, the ssh hint in `ui-monospace` at 11.5px (`getComputedStyle`). Theme light, unchanged. The Live HPC pane opened for the look was closed.

## Usage

Brief check 55 tool uses, 147k tokens, 7 min. Builder 42 tool uses, 180k tokens, 24 min. Reviewer 36 tool uses, 146k tokens, 14 min. The builder's first report passed its bar; two fixes at landing.
