# O65, repair round 1

The rules file and `agents/briefs/O65.md` still hold. This round closes the findings of `agents/reviews/O65-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

The rules file's "Where you work" holds in full: you run no git command, read-only ones included; the base copy `.agents/worktrees/migration-O65-base/` is where the unchanged tree is read and run.

## Rulings

1. **P1, Julia's settings by an order that does not depend on timing.** `src/lib/ui/controls/editor/kit/rite/settings.ts` gives Julia VS Code's settings in a way whose result does not depend on which of two module loads resolves first: for example by giving them again whenever Monaco's language configuration for `julia` changes and differs from VS Code's, or by a registration Monaco ranks above its own. No `setTimeout`. A test reaches it: the stub's `onLanguageEncountered` calls its callback, Monaco's own Julia settings are given after VS Code's in the test, and the row asserts that Julia ends with VS Code's brackets and auto-closing pairs. The row's run on the tree before this round's change is quoted.

2. **P2.** The record of `tests/ui/controls/editor/kit/comment-rules.test.ts:20` (`modes`) moves out of file scope, into the mocked module, read by importing that module.

3. **T1.** The three comments that say the Cmd+K chords are given up so Cmd+K opens the palette from inside the editor are rewritten to say what is true now: `src/lib/shell/keys/Palette.svelte:28-30`, `src/lib/state/workbench/palette.ts:5-7`, `src/lib/state/workbench/navigation/editor-status.svelte.ts:14-16`. Grep `gave up`, `give up`, `gives up`, `given up`, `freed` across `src`, `docs`, `config` (with `--exclude=local.yml`) and `tests` once more and rewrite every other false hit.

4. **T2.** The `declare module 'monaco-editor/languages/definitions/julia/julia.js'` in `src/monaco-modules.d.ts` declares only what the tree reads; if the new code of ruling 1 reads nothing from it, it has no members, and the head comment stays true.

5. **B1 and S3, the one-press LaTeX keys in the files LaTeX Workshop binds them in (item 5).** In a `.bib` file Cmd+Alt+B and Cmd+Alt+C are not bound, so Cmd+Alt+C reaches Monaco's case-sensitive find toggle; in `.sty` and `.cls` Cmd+Alt+J and Cmd+Alt+M are not bound; Cmd+Alt+B, C and V stay bound in `.sty` and `.cls`. The same holds off macOS for the same keys' Ctrl forms. A command whose key a file does not take stays in the palette. The Keys view's LaTeX rows and `docs/HELP.md` say which files take which keys. Each file kind's bindings are a test row of the LaTeX tab's keys, with its run on the tree before this round's change quoted.

6. **B2.** The report's "Before and after" gives each user-visible change with its before and after, the five the review lists among them, and those of ruling 5.

7. **S1, S2, P3.** No work in this round. S1 and S2 are recorded at landing. P3 is checked at the look at landing, by comparing item 4's table with the Keyboard Shortcuts view's editor rows. After this round's last change the verify list runs once, and the report says how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O65.md`'s "Paths this step writes", the five the first report named outside it, and:

- `src/lib/shell/keys/Palette.svelte`
- `src/lib/state/workbench/palette.ts`
- `src/lib/state/workbench/navigation/editor-status.svelte.ts`
- any other file ruling 3's grep finds false
- the test file of the LaTeX tab's keys, named in the report
- `.scratch/migration/agents/reviews/O65-report.md` (rewritten whole)

## Report

Rewrite `.scratch/migration/agents/reviews/O65-report.md` whole: each ruling with DONE or NOT DONE, its diff and the check that shows it; each new or changed test row with its run on the base copy and after; "Before and after" complete; the verify lines.
