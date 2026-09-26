# Brief: the library audit

Axel's ruling: less code is the aim. Oculus is over 100,000 lines, and every capability it builds by hand where an established library covers it is code that must be kept up. The orchestrator checks, Axel decides. This audit finds, for every capability oculus builds by hand, whether a library covers it, and gives Axel what he needs to rule. Code is written by hand only where no library covers the capability; no feature is cut to have less code.

Each auditor covers one part of the tree, named in its prompt. The parts together cover every file under `tools/oculus/src/`, `tools/oculus/bin/`, the non-test files under `tools/oculus/tests/` and the check files under `tools/oculus/tests/checks/`, and the root files (`playwright.config.ts`, `vite.config.ts`, `svelte.config.js`, `eslint.config.js` and the rest of `ls tools/oculus`).

## Rules

- Read only. Edit no file anywhere, run no git command, install nothing. `npm view <package> ...` and web searches are allowed and expected.
- Work from `/Users/axelfaes/workspace/research-hub/tools/oculus` (main). The step X3b (Source Control) is in flight: for each file of your part named in the X3b list below, read the worktree copy under `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3b/tools/oculus/` instead of main's, and audit the files X3b adds under your part as well.
- Bundle size is not a criterion; do not weigh it.
- Weigh what does matter in oculus: its theme tokens (`src/lib/themes/tokens.css`, `themes.css`; every colour comes from a token and every theme must apply), its layer rules (DESIGN.md: `ui/` imports no state and no view; `shell/` imports no view by name; `views/` imports no shell and no other view; nothing client-side imports `lib/server/`), Svelte 5 with runes and SvelteKit with the node adapter, the dependencies already in `package.json`, the ASCII and size rules of `agents/spec.md`, and Axel's demand that surfaces copied from VS Code match VS Code exhaustively.
- Every library fact comes from a command or a page you read in this run: the version, license, last release date, maintainer or organisation, peer dependencies and whether they match what oculus runs. A fact you did not check is written as "not checked".

## Coverage, which is checked

1. Start by enumerating every file of your part with `find <paths> -type f | sort` and quote the count.
2. Group the files into capabilities: a capability is one thing oculus does that a library could plausibly provide (a Markdown renderer, a tree view, a tab and pane layout, fuzzy matching, a text editor, a diff, a YAML round trip that keeps comments, a git reader, a file watcher, a process manager, a date formatter, a drag and drop, a virtual list, a keyboard shortcut layer, a colour contrast measure, a websocket protocol, a test helper, a lint rule, and so on). Many files are domain logic that no library covers (a view of Axel's funding, the portfolio's own rules); say so for those, in one line each.
3. The report ends with a coverage table: every enumerated file, one row each, with the capability it belongs to. A file missing from the table is a failed audit.

## Per capability where a library is a real option

- What oculus has: the files, their line counts (`wc -l`), what the code does and which features of it a reader uses.
- Each candidate library (at least the two or three most established where they exist): the facts above; which of oculus's features it covers and which it does not; what code it would remove (an estimate in lines, marked as an estimate) and what code would stay (the glue, the theming, the parts it lacks); how it takes the theme tokens and the layer rules; how it fits Svelte 5 and SvelteKit; for a VS Code surface, how close it comes to VS Code's own behaviour.
- The options, one of which is always keeping the code, each with its pros and cons.
- One recommendation, with its reasons. Recommending to keep the code is allowed when no candidate fits, and the reason names what the candidates lack.

## Also

- A dependency oculus already has that a hand-built part duplicates (for example code doing what `highlight.js`, `marked`, `dompurify` or `yaml` already does) is a finding of its own.
- A library already in `package.json` used only partly, with hand-built code beside it covering what the library offers, is a finding of its own.

## Report

Your final message is the report: the enumeration count and command first; then one section per capability with a real library option, in the shape above; then the domain-logic capabilities, one line each; then the coverage table. Plain ASCII, no em dashes. No summary of the tree beyond what a capability needs.
