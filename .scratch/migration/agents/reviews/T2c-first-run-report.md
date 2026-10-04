Everything in the brief is done, with one non-deletion change and one head comment left as it was; both are listed under "Changes that are not deletions".

## Entries

- G1: none in my folders
- G2: none in my folders
- G3: none in my folders
- G4: none in my folders
- G5: `tests/ui/html.test.ts`, "inlineMarkdown" > "is the sanitiser over the inline renderer, so no field reaches a card around it". It is the only test kept for an entry. The same sweep elsewhere may name `tests/checks/source/html-sites.test.ts` for G5, which `guarded.md` lists as held under G5; settled at landing (decision 1 of the brief).
- G6: none in my folders
- G7: none in my folders
- G8: none in my folders
- G9: none in my folders
- G10: none in my folders
- G11: none in my folders
- G12: none in my folders
- G13: none in my folders
- G14: none in my folders
- G15: none in my folders
- G16: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G17: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G18: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G19: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G20: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G21: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G22: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G23: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G24: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G25: none in my folders (its test is named under `tests/checks/`, outside my folders)
- G26: none in my folders. `tests/checks/look/contrast.test.ts` is the named test. `tests/ui/theme/colours.test.ts` ("keeps every --on-<surface> on its surface at 4.5:1, under every theme") and `tests/themes/derive.test.ts` measure contrast too but are not the named test, so they are deleted.
- G27: none in my folders (its test is named under `tests/checks/utils/`, outside my folders)

## Counts of `tests/views`, `tests/shell`, `tests/ui`, `tests/themes`

Before (taken before the first deletion, copy of the four folders in the session scratchpad):

- test files (`*.test.ts`): 194
- `.ts` files: 216
- `.svelte` files (helpers, not counted by the brief): 11
- lines in the `.ts` files: 51,995
- `it(` or `test(` calls (`grep -rhoE '\b(it|test)(\.each|\.skip|\.only)?[(`]'` over `*.ts`): 2,756
- files tagged `@module-tag slow`: 4

After (taken after the last change):

- test files: 1 (`tests/ui/html.test.ts`)
- `.ts` files: 6
- `.svelte` files: 3
- lines in the `.ts` files: 306
- `it(` or `test(` calls: 1
- files tagged slow: 0
- `tests/themes/` no longer exists (its only file was `derive.test.ts`). `vite.config.ts` does not name that folder.

Files left (9 of 227): `tests/ui/html.test.ts`, `tests/ui/frame/client-runtime.ts` (named by `vite.config.ts:65`), and the seven helpers below.

## Helpers kept because a file outside my folders imports them

Found by resolving every relative import in `tests/`, `utils/` and `vite.config.ts` and following imports of kept files (script kept in the session scratchpad, read only):

- `tests/shell/fixtures/Alpha.svelte`: `tests/state/workbench/layout/open/kept-panes.test.ts:32`
- `tests/shell/rail/rail-fixture.ts`: `tests/state/workbench/navigation/catalogue.test.ts:25`
- `tests/ui/controls/editor/monaco-diff.ts`: `tests/server/git/diff-patch.test.ts:27`, `tests/state/sources/repositories/diff/hunks-git.test.ts:18`, `tests/state/sources/repositories/diff/diff.test.ts:30`
- `tests/ui/menu/GroupContexts.svelte`: `tests/fixtures/client.ts:12`
- `tests/ui/menu/HeldContexts.svelte`: kept because the kept `GroupContexts.svelte` imports it (`GroupContexts.svelte:7`)
- `tests/views/shared/real-text.ts`: `tests/state/sources/explorer/acts/folders.test.ts:20`, `tests/state/sources/explorer/acts/keys.test.ts:19`
- `tests/views/system/workbench/workbench-fixture.ts`: `tests/state/system/config-files.test.ts` (import of the fixture)

Every other helper, `.ts` and `.svelte`, had no importer outside my folders and no kept file in my folders importing it, and is deleted. After the deletion no relative import in `tests/`, `utils/` or `src/` resolves to a missing file in my four folders (the script printed only two `tests/checks/tree/boundaries.test.ts` hits, which are planted-source strings naming `src` views, not my folders).

## Changes that are not deletions

1. `tests/ui/html.test.ts`: the multi-line `import { ALLOWED_ATTR, ... sanitise } from '../../src/lib/ui/html.ts'` became the one line `import { inlineMarkdown, sanitise } from '../../src/lib/ui/html.ts';` once the other names were removed, so that Prettier (`npm run format:check`) keeps the file as it formats it. The import line of `readFileSync` and every other import of a deleted test's name is deleted.
2. The head comment of `tests/ui/html.test.ts` still describes the whole sanitiser suite (lines 1 to 2: "the profile it filters by, the addresses it lets an href hold, what a link is given once it is clean, and the Markdown line a card's field becomes;", and the sentence about the app rendering in the browser alone). I deleted the one line that named only deleted things (the `codeSpans` line), so line 2 now ends in a semicolon. Rewriting the rest is not a deletion, so it is left for the orchestrator to rewrite at landing.

## Not verified / outside my folders

- No test, format, check or build was run (brief item 6). The landing runs the verify list.
- Files outside my folders that read or name deleted files and are other sweeps' work: `tests/checks/tree/audits.test.ts` (reads `tests/views/`), `tests/checks/tree/allow-negatives.ts`, `DESIGN.md` line 223 and 227 (name `tests/views/whole/type-scale.test.ts` and `tests/views/whole/chips.test.ts`), and comments in `tests/state/**`, `tests/data/sources/personal.test.ts` that name deleted view tests.
