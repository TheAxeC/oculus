# Q77c report (claude:opus builder)

Everything in the brief is done.

## DONE / NOT DONE

| Item | State | Command and output |
|---|---|---|
| 1. New form read by `DIRECTIVE` / `directives()`, resolved to the same `first` / `last`; old form refused | DONE | `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts` -> `34 reverts, 0 unproven, 0 unchecked`. A node run of `directives()` over every file under `tests/` that holds a directive printed `1754 0` (1754 directives, 0 with a problem). |
| 2. No match, several matches and an offset past the end are unproven | DONE | Proven by the cases in `revert-check.test.ts` (see item 5). Each case is red under its revert. |
| 3. Converter `bin/migrations/revert-anchors.mjs`, with `--check`, run once over the tree | DONE | The run printed `1742 directives converted in 235 files written, 0 refused`. |
| 4. Head comment states the form | DONE | `bin/revert-check.mjs:4-22` |
| 5. Tests in both files | DONE | See the verification rows 1 and 9. |
| V1 `npx vitest run tests/checks/bin tests/checks/source/comment-width.test.ts --reporter=dot` | DONE | `Test Files  9 passed (9)` / `Tests  76 passed (76)` |
| V2 `npm run check` | DONE | `COMPLETED 1509 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| V3 `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| V4 `npm run lint` | DONE | exit 0 |
| V5 ASCII gate (the perl form in the rules file) | DONE | printed nothing |
| V6 `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | exit 0 and exit 0 |
| V7 `node bin/migrations/revert-anchors.mjs --check` | DONE | `0 directives converted in 0 files written, 0 refused` |
| V8 `grep -rhE "// revert: [^ ]+:[0-9]" tests \| wc -l` | DONE | `0` |
| V9 `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts` | DONE | `34 reverts, 0 unproven, 0 unchecked`, every line `red` |

After V1 to V9 ran, I reworded two lines of the head comment in `bin/revert-check.mjs` ("is no longer read" became "is not read"). After that change I re-ran the comment-width test (2 passed), lint (exit 0), `npx prettier --check` on the file (clean) and `LC_ALL=C grep -n '[^ -~]'` over the four files (no output). I did not re-run the whole V1 to V9 list after it.

## Converter count
The run over the tree printed `1742 directives converted in 235 files written, 0 refused`. A dry-run tally from `planFor` gave 1656 anchored on the target line's own text and 86 with an offset. That matches the brief.

## The five cases, as the converter wrote them
All five are identical to the brief.
- `tests/server/accounts/connect/loop.test.ts:99`: `// revert: src/lib/server/accounts/connect/loop.ts "if (moved) options.moved?.(dir);" => delete`
- `tests/browser/shell/rail.spec.ts:463`: `// revert: src/lib/shell/rail/ActivityRail.svelte "void write((rail) => railHidden(rail, page));" => void write((rail) => rail);`
- `tests/ui/primitives.test.ts:165`: `// revert: src/lib/ui/controls/Chip.svelte "<span class=\"chip\" class:toned={tone !== undefined} class:filled class:bracketed {style}>" +2 => delete`
- `tests/shell/rail/rail.test.ts:78`: `// revert: src/lib/shell/rail/RailPages.svelte "<ToolButton" +1 => label={entry.page}`
- `tests/checks/tree/duplication.test.ts:330`: `// revert: tests/checks/tree/duplication.test.ts "const code = line" .. ".trim();" => const code = line;`

## What changed, per item

**Item 1 and 2, `bin/revert-check.mjs` (545 to 660 lines):**
- `TEXT` at :101 and `DIRECTIVE` at :108 read the new form. `NUMBERED` at :113 is the old form, exported for the converter.
- `anchorOf` at :147.
- `parseDirective` at :160 reads the anchored form first, then refuses a numbered line with `names a line number; convert it`.
- `resolveAnchor` at :177 matches by trimmed-text equality. A count other than 1 gives `which matches <n> lines`; an offset past the end gives `which runs to line <n> of <len>`.
- `spelled` at :194 is exported and used by the converter.
- `located` at :204 resolves only a target that is inside the tree and exists. Otherwise the existing "outside the tree" and "no file" messages still report it.
- `directives()` at :232 carries a new `problem` field.
- `checkOne` at :536 prints `unproven  <file>:<line> <problem>` first.
- Nothing from `applied` downward changed.

**Item 3, `bin/migrations/revert-anchors.mjs` (new, 182 lines):**
- `anchorFor` at :52 computes each anchor by the brief's rule.
- `rewrite` at :73 changes only the location text, so everything before `revert:` and the replacement are kept byte for byte.
- `disproof` at :100 proves each rewrite with the imported `parseDirective` and `resolveAnchor`, over every file as it will stand after the run. That covers a directive whose target is itself a rewritten directive line.
- `planFor` at :118 re-runs the proofs until no new refusal appears.
- Usage: `[--check] [--root <dir>]`.

**Item 4:** the head comment of `bin/revert-check.mjs:4-22` states the form, the JSON escaping, the uniqueness rule, `+<n>`, the range, the unproven cases, and that the numbered form is refused.

**Item 5, `tests/checks/bin/revert-check.test.ts` (730 to 830 lines):**
- New cases at :121-192:
  - an anchor resolving to its line;
  - an offset;
  - a range;
  - an anchor matching none and one matching two, each with its count;
  - an offset past the end;
  - a target line changed, which is unproven and does not revert another line;
  - the old form refused.
- Each new case carries a new-form revert, and each is red (V9).
- The existing fixtures now use the new form. The old "line 99" case became a range that runs backwards (`lines 2-1 of 4`), because the new form cannot name line 99.

**Item 5, `tests/checks/bin/revert-anchors.test.ts` (new, 127 lines):** five cases: a unique line (plus `--check` writes nothing), a repeated line with an offset, a range, a line with quotes and `=>`, and a refused directive. The refused one has a proof that genuinely fails: it names a directive line that the same run rewrites. It is left as it was, counted as refused, and the run exits 1.

**Converted directive lines:** 235 test files under `tests/`, written by the converter only.

## Where the brief was off
- "86 with an offset, 16 of them ranges": the tree holds 16 ranges in total, and 9 of those carry an offset. This comes from the same dry-run tally (`ranges: 16, offsetRanges: 9`).
- The 22 directives in `revert-check.test.ts` that name `bin/revert-check.mjs` were converted while that file still had its old line numbering; the new code was appended at its end for that run. After the rewrite of `revert-check.mjs`, a comparison against a saved copy of the original showed every one still names the same text: `mismatches 0`, and the range still covers the old lines 65-84.

## Decisions the orchestrator may reverse
1. The converter exits 1 when anything is refused.
2. The converter's refusal line reads `refused   <file>:<line> names <target>:<n>[-<m>]: <why>`.
3. A quoted text that is not valid JSON is unproven, with `names <path> by a text that is not a JSON string`.
4. The converter skips symlinks and `node_modules` under `tests/`.
5. The converter's write became `if (check) continue;` followed by the write on its own line, so a single-line revert can target it.

## Limitations
- A path containing a space cannot be named, as before.
- A directive whose replacement itself contains `// revert:` has not been exercised.
- No Markdown document states the directive form. A grep of `src`, `config`, `HELP.md`, `DESIGN.md` and `README.md` for `revert:` found only unrelated UI strings.
