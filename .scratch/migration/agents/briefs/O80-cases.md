# O80, the ruling on the cases (round 0)

The builder's first run of the cases handed back case 17 (`agents/reviews/O80-report.md`, "The case handed back: case 17") and four paths the change needs outside the brief's write list ("Judgment calls left open by the brief"). This file rules on them; the brief stands otherwise. Go on with the build under the brief and this file.

## Case 17: ruled (b) (open item 424, closed under self-rule Z1025)

The page makes the finding. The board-views function of item 1 is given the view ids the modules register (`src/routes/views.ts` has them) and returns a finding for each board key equal to one of them or to a collection key, naming the board; that board is not registered. The config payload (`ConfigPayload`, `src/lib/data/model/index.ts`) gains the `from` map the server already holds, so the finding names the file the `boards:` value came from. `allFindings` (`src/lib/state/workbench/navigation/status.ts`) takes the page's config findings as a fourth source, so the finding is listed in the Findings view and the status bar as any config finding is. Say in the report what the payload gains, as a before and after. `boardsFindings` (G116) keeps every finding it gives today and gives no finding for a view id. The test of case 17 is a row of 'the board views' (G124) over the board-views function with a module id list given to it; no test reads the routes layer. Option (a), the board left out with no finding, was the lazy option.

## The paths the change needs, added to the write list

- `src/routes/views.ts` (already listed) and `src/lib/state/workbench/navigation/status.ts` (`allFindings`).
- `src/lib/data/model/index.ts` (`ConfigPayload`) and the server code that builds the payload (find it with `grep -rn "ConfigPayload" src` and name it in the report).
- `src/lib/ui/forms/Prompt.svelte` and `src/lib/ui/forms/prompt.ts`: a choice field the prompt requires keeps its yes off while it is empty.
- `src/lib/server/edit/writes/hubs.ts` (`homeOf`, `homeOfLiterature`): the hub rule of item 3 and its refusal live here, with their rows in `tests/server/edit/hub-writes.test.ts` (G8) and `tests/state/forms/new-entry.test.ts`.
- `config/options/layout.yml`: the boards `key` field (`:128-131`) is no longer a fixed choice of six; it is a text key, as a collection's key is described.
- The board-views function: `src/lib/state/boards/board/` holds 10 items, so put it in `presets.ts`, which already reads `boards:`, when it fits there under the size limit, and otherwise split the folder by concern and name the split in the report.

## The whole-suite command

The accidental `npx vitest run --dir <scratchpad> --project unit` is recorded in your report; run no whole-suite command again.
