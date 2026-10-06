# Q79d landing

Roadmap entry oculus/migration (the cockpit-to-oculus migration). Plan step Q79d: the library audit's shared helpers, each written once. Next: Q101's review, then `/spec` Q87 and Q81.

## Open items

- None.

## Agents stopped

`ListAgents` before the landing showed only Q101's builder add47a57e76017575; no builder or reviewer of Q79d was running.

## Not done

Nothing.

## What landed

- `data/helpers/guards.ts` `isMap` in place of the `isRecord` copies and `collection.ts`'s `isFieldMap`; the yaml library's node test imported as `isYamlMap` in every file under `src` and `bin` that uses it.
- `server/core/paths.ts` `inside`, `below` and `realPath`; a folder of `/` holds only itself, as on main.
- `data/helpers/files/paths.ts` `nameOf`, `trimSlash`, `pathUnder`, `deepestHolding` and `joinPath`, with `text-kind.ts` and `opens-in-program.ts` moved into `files/`.
- `git-parse.ts` `statusRecords` over `git status --porcelain=v1 -z` for the server and the deposit.
- `dates.ts` `localDate` and `ago`.

## Found and fixed at landing

- The round review's findings: three head comments name their new imports; the audit case lists `isFieldMap` and reads `bin`; `bin/migrations/migrate-joint-work.mjs` imports `isMap as isYamlMap`. Each audit change turns red when undone (quoted in the booking). The lazy option for the `bin` finding was narrowing the comments to `src`.
- Defects Q100's landing left on main (bd2a7e96): the list-title rule written twice in `Calendar.svelte`, three comment lines over the hundredth column, and `type-scale.test.ts` without the list-title rule. Q100's booking now carries a correction saying its list-title fix was not verified.

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md`, after the last fix: `Test Files 351 passed (351)`, `Tests 5597 passed | 1 skipped (5598)`, `COMPLETED 1489 FILES 0 ERRORS 0 WARNINGS`, format and lint clean, the ASCII check clean, `checks: 6 commands passed`.

## Look

On TEST under vscode dark modern: the Sessions list's relative times and the terminal row's folder name; the Usage view's live sessions by folder name; the Calendar's list view (titles at the Calendar's size, week buttons enabled), set back to Month; the Timeline of a picked session. Nothing wrong seen.

## Usage

Builder 162 tool uses, 356k tokens, 77 min, round 56 tool uses, 159k tokens, 14 min; reviewers 62 tool uses, 256k tokens, 15 min and 38 tool uses, 167k tokens, 11 min. The first report did not pass the bar; one repair round.
