# Q97 landing

Oculus migration (tools/oculus/.scratch/migration). Plan step Q97: Help its own rail button after System, with its own page. Next: set 2, Q98 + Q92 + Q89.

## Open items

None.

## The check before the landing

The runner's agent listing (ListAgents) showed no subagent of this session running: the builder (ac17969c2ab41b218) and both reviewers (ad765807871077cac, adf0fa839f6739d7d) had ended.

## Not done

Nothing inside the brief. The one-pane System arrangement was not seen on screen, since Axel's saved System page keeps its tabs until its Reset (the brief's decision 4) and the look does not reset a page he works on; `arrangement.test.ts` proves it.

## What landed

- `config/layout.yml`: a twelfth rail button, Help (glyph `question`, page `help`), right after System; a `help` arrangement, split 0.6 / 0.4, Help and HPC how-to on the left, Research approach, Agent approach and Memories on the right; `info` one pane of Status, Findings, Audit, History, Config and Gallery.
- The `help` catalogue group keys to the Help page, chord `h`; the comments in `catalogue.ts`, `Help.svelte` and `Memories.svelte`; the key sheet's `h1-h5` row in `config/text/app.yml:12` ("the Help page's group"); `HELP.md` 19 and 68, `DESIGN.md` 269 and 282.
- Eight test files, the Views view's heading test comparing with `config.rail`.
- One fix at landing, the merge with Q95: Q95's Add case in `tests/views/system/workbench/settings.test.ts` counted the saved rail as eleven buttons. Its three counts now follow the saved list (`saved.length + 1` rows, `markOf(body, saved.length)`, `rail_why_label` `saved.length + 1`). The merged file without the fix fails that case: `expected ... to have a length of 12 but got 13`.

## Checks on main

```
$ sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh .../orchestrator-state.md   (from tools/oculus), exit 0
 Test Files  338 passed (338)
      Tests  5309 passed (5309)
verify: 6 commands passed
$ npm run diagrams   -> exit 0, no file under docs/diagrams changed
```

## The look (the page named TEST on 8790, Axel's Chrome)

- The rail: the Help button (question glyph) sits after System, tooltip "Help".
- Pressing it made the Help page: Help and HPC how-to on the left, Research approach, Agent approach and Memories on the right.
- The Views catalogue lists SYSTEM (Status, Findings, Audit, History, Config, Gallery, y1-y6), then HELP (Help, Memories, Research approach, Agent approach, HPC how-to, h1-h5), then VIEWS AND SETTINGS.
- The Rail section's page choices include `help`.
- Axel's saved System page still shows Status, Findings, Audit, History, Usage and Help, as the brief's decision 4 says, until its Reset.
- TEST was shown again afterwards.

## Found

- The first review: three findings, closed in round 1. The review over round 1: none. The dispositions are in `agents/reviews/Q97-refuter.md` under Closed.

## Next

Set 2 of the queue: `/spec` Q98, Q92 and Q89, their builders launched, then refuted and landed.
