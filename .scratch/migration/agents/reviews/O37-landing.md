# O37 landing

Position: oculus migration, step O37 (the fixes and owed looks of O33's phase A), landed; next: O38 (the cockpit retired and the hub's tools cleaned, each deletion on Axel's yes path by path), then O39 (oculus's own repository). O40 (the look defects O37's landing does not fix) is prepared once O37 has landed and starts only on Axel's go (ruling 127).

## Open items

- 128 (2026-10-17, O37's landing). O30 case 27, a drag of a tab from one window of the desktop app into another, is the one owed look not taken: it needs the real pointer, and the session moves no pointer and never brings an app to the front; a key or an Accessibility press cannot start a drag between windows. Options: (a) Axel drags a tab between two windows of a scratch app the session starts and says what he saw; (b) Axel names a time at which the session may move the pointer for one drag on a scratch app, with that app in front; (c) the case stays held by its test only. Recommendation: (b), since the session then records the look with its reads as it records every other look, and Axel spends no time on it; (a) costs Axel the look's minutes and gives no reads. The lazy option is (c), which leaves the look untaken.

## Not done

- O30 case 27 is not taken (open item 128).
- D68's panel path from a browser tab is not taken: it waits on row 69 of `agents/reviews/O37-defects.md` (one press says "The folder panel is already open."), and O40 takes it once that row is fixed.
- 44 look defects of `agents/reviews/O37-defects.md` are open, each for O40 (ruling 127).
- `npm run test:quick` over this step's whole change takes 92.9 s against its 45 s; over a change of a builder's size it takes 20.8 s (Z930, self-rule).
- The builder's report `agents/reviews/O37-report.md` opens "Everything in the brief is done.", which is false (the review over round 1, Proof 1); the line stays as the builder's record, and this report is the end state.

## The check of Steps 1

ListAgents showed no agent running ("No reachable agents"); the builder a85b6f3127062ae40 and the reviewers ad8a7f0497e2ae8be and a46985fba3162d6a3 had ended.

## What landed

From base 0f04ce969: 536 files under `tools/oculus` (+19,644 -7,800, `git diff --cached --shortstat`) and five hub files (`registries/career.yml`, `domains.yml`, `pillars.yml`, `venues.yml`, `tools/skills/catalog.yaml`), as the booking in `plan.md` under O37 states. Of the 77 test files the step added, 18 stay and 59 are deleted (open item 124). plan.md's lines over 400 characters are shortened, each kept whole in its step's brief under "plan.md lines in full" (defect 23); the header and the O33 and D63 lines stay long (ruling 126).

## What was found, and the fixes at landing

The review over round 1 (`agents/reviews/O37-refuter.md`, "Repair round 1, refuted"), each closed:

- Spec 1, the wait line printed up to three times per vitest start: only the earliest waiter of a process prints it (`earlierWaiter`, `src/lib/server/core/json.ts:421-427`).
- Standards 1 and Behaviour 1, the fold cache's key passed through `globalThis`: `cache.ts` computes the digest from the reader's source files (`READER_FILES`, `READER_FOLDERS`); no global is left (`grep -rn '__SESSIONS_READER__\|globalThis' vite.config.ts src/lib/server/sessions/cache.ts` prints nothing).
- Behaviour 2, naming files left by a killed lock taker: `dropLeftFiles` removes the naming files and claims of ended processes before each take (`json.ts:340-363`).
- Standards 2, Proof 3 and Standards 7, the new tests outside `agents/guarded.md`: 59 deleted and 18 kept under G2, G13, G31, G32 and G88 to G99 (open item 124); `dock-floor.test.ts` and `coded-refusal.test.ts` are among the deleted.
- Standards 4 to 6, comments: `src/lib/ui/html.ts` keeps one doc comment over `MarkdownExtras`; `CommandRows.svelte` names `shell/keys/palette-modes.ts`; the three comments broken short are rejoined.
- Proof 1 (the report's first line) is not changed (Not done). Proof 2, the builder's `node -e` and `osacompile` probes, are unapproved scripts and nothing they produced is used, under the standing ruling of open item 116. Standards 3, the builder's whole-suite runs, is the builder's conduct and changes no file.

The looks: 84 defects in `agents/reviews/O37-defects.md`, 40 done at landing (39 fixed, row 56 needing no change), each with its check, and 44 open for O40.

Red lines of the landing runs, each fixed in the gate and carried to main:

- `tests/server/git/git-ops.test.ts`, a hook timed out at 10 s: the machine's git configuration ran; `isolateGit` replaces it with an empty file.
- `tests/server/machine/lsp/lifetime.test.ts`, a 5 s timeout, and `tests/server/machine/lsp/adapters/markdown-links-lent.test.ts`, a request counted among a document's notices: both wait with `sentOnClock`, and the second counts only `didOpen`, `didChange` and `didClose`.
- `tests/server/machine/lsp/servers.test.ts`: the test of the language servers' start shape follows the look fix that gives the two node servers `ELECTRON_RUN_AS_NODE=1` (`servers.ts:219-220`).
- `tests/server/root/no-workspace.test.ts` and `workspace-follow.test.ts`, 5 s timeouts under load: each case builds a whole server context, with its git watch and process watchers, so both are tagged slow.
- `npm run format:check` on `tests/server/core/lock.test.ts`: formatted.
- `tests/checks/diagrams/palette.test.ts`: `docs/palette.md` written again (open item 125).
- `tests/checks/tree/size.test.ts`: `src/lib/server/sessions` at 11 items in the first run, 10 in the tree that landed (`ls | wc -l`); `tests/server/root` at 11 with the new `process/` folder, brought to 10 by moving `config-cache.test.ts` into `tests/server/root/process/`, its path updated in its guarded row (`agents/guarded.md:205`).
- `tests/checks/source/comment-width.test.ts`: three comments past column 100 (`palette.ts:493`, `Stats.svelte:9`, `RootChip.svelte:6`) rewrapped.
- `tests/checks/tree/boundaries.test.ts`: `load.ts` held the theme failure count at module level (`themeFailures`); it is held by the loader the editor's one load per page makes (`themeLoader`), and the theme look was taken again on that build (row 1).

Choices taken in automode: Z930 (`npm run test:quick` over a whole step's change). Open item raised: 128.

## Verification

In the gate worktree, whose `tools/oculus` tree equals main's staged one (`diff -rq` with the generated folders left out prints nothing): `npm run diagrams` (the layer diagram gained `load.ts`'s dynamic import), then `npm run test:landing`: `ok ASCII gate (0.9 s)`, `ok npm run format:check (18.9 s)`, `ok npm run lint (40.4 s)`, `ok npm run check, without its type sync (69.9 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok npm run test:checks (186.2 s)`, `ok npm test (397.6 s)`, `ok npm run test:slow (430.8 s)`, `ok npm run build (475.3 s)`, `test:landing: 475.3 s; every command passed`.

- `npm run test:quick` over two changed files: `test:quick: 20.8 s (limit 45.0 s); every command passed`; over the whole step: `test:quick: 92.9 s (limit 45.0 s); every command passed` (Z930).
- The types lock (item 17), on two scratch copies of the gate with a reference copy synced alone: two vitest runs started at once on no types, three rounds, each run passed and the types equal the reference; `svelte-kit sync` started while vitest reads, three rounds, the same; a sync killed with 5, 65 and 8 of 66 type files written, the next vitest printed "took over ... whose process has ended", passed, and the types equal the reference.
- `tests/checks/source/history.test.ts` alone: 3 passed.

## The look

On my scratch desktop app on port 8796 over the gate's tree, and on the look agents' scratch apps, each with its own hub, home and engine; Axel's server on 8790 and his tabs untouched. Every view and state of `agents/reviews/O37-defects.md`'s rows, recorded with what was seen; the owed looks recorded in `agents/reviews/owed-looks.md` under "Taken", but O30 case 27 (open item 128) and D68's browser panel path (O40). O30 case 41 on the landing build: Cmd+W in a popped-out window over unsaved `use.ts` asked "Close this tab and lose its unsaved changes?", and Escape kept the tab and its text (the key sent to the page, with Chrome in front). The theme retry (row 1) on the landing build: two failing picks kept the colours and each asked again, the third repainted.

## Agents

- Builder a85b6f3127062ae40 (claude-opus-5-5): 358,242 tokens, 1139 tool uses, 201.5 min; round 1 401,668 tokens, 3263 tool uses, 569.1 min. First report did not pass its bar (one repair round).
- Brief check a61a42227a685cb6c (claude-opus-5-5): 229,798 tokens, 66 tool uses, 10.8 min.
- Reviewer ad8a7f0497e2ae8be (claude-opus-5-5): 317,492 tokens, 100 tool uses, 19.5 min; reviewer over round 1 a46985fba3162d6a3 (claude-opus-5-5): 230,398 tokens, 174 tool uses, 31.6 min.
- Mapping of the new tests against `agents/guarded.md` a10bab7ef7b1d175a (ordo-high, claude-opus-5-5): 188,547 tokens, 113 tool uses, 21.4 min.
- Look agents, each claude-opus-5-5, summed over their completion notices: a ad3ebad52cc64b6f6 697,601 tokens, 323 tool uses, 48.9 min; b a87c15781373e2975 547,218, 1007, 163.9 min; c afd4a48e00a989767 809,321, 1325, 214.1 min; d a13bc2f290961f631 247,325, 541, 66.4 min; e aeee224010addb6cc 454,885, 406, 54.6 min; f a3c68a7249ab41f28 408,407, 500, 66.4 min.
- Shortening of plan.md's long lines, each claude-opus-5-5: a6a8dce7d78290662 211,533 tokens, 20 tool uses, 7.8 min; a2dc7cd8c6251e178 188,227, 22, 5.4 min; a1c8ce83ea4c0d888 183,314, 28, 5.6 min; ac5b6c148dbeb8997 183,014, 31, 5.8 min.
- Reading of the shortened lines, each claude-opus-5-5: a390996f00f7ff0e4 177,298 tokens, 12 tool uses, 1.4 min; a4f3fb5a3751065bb 170,636, 13, 1.6 min; afeec0cead01179b0 180,815, 11, 1.8 min; ac461851c16f219f8 186,001, 15, 1.8 min.

## Next

O38 is prepared through /spec, each deletion and each skill edit brought to Axel path by path for his yes; O40 waits for Axel's go; open item 128 waits for his ruling.
