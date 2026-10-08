NOT DONE: the whole step. D40 is stopped before any change because the expected result of case 20 is wrong under the brief's own rules (below). No file of the worktree was changed, no test was written, none of the 14 items is built, no check of "Verify before you report" was run. Everything in the table at the end is NOT DONE.

## Open items of the state file (orchestrator-state.md, "Open items", verbatim)

None.

## The case that is wrong under the brief's own rules: case 20

Case 20 (brief, "Cases"): `projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py:95`: `Once the model is trained <U+2013> and, hence, ...` in a docstring. No row: skipped by `**/bttrlib/**`. With `lint.writing_skip` set to `[]`, one `en-dash` row with suggestions.

The rules it is judged by: item 2 (`comment-worker.ts`): "A character is in a comment when a scope of its token starts with `comment.`, or, in Python, is `string.quoted.docstring.multi.python`"; decision 2: "One mark per character".

Result the rules give, two parts:

1. The docstring is a raw docstring. Lines 94-96 of the file open it with `r"""`, and Shiki 4.4.3's Python grammar scopes a raw docstring `string.quoted.docstring.raw.multi.python`, which is not `string.quoted.docstring.multi.python`. By the rule as written the en dashes are in no comment, so the file gets 0 rows, not 1. Command and output (scratch script `/private/tmp/claude-502/d40-builder/probe/bttr-scope.mjs`, which tokenises the file with `highlighter.getLanguage('python').tokenizeLine` carrying the rule stack, the way item 2 says the worker does):

```
$ node bttr-scope.mjs
line 95: en dash in token starting at col 0; scopes: string.quoted.docstring.raw.multi.python; comment.*: false; exact docstring scope of item 2: false
```

   The same probe on a synthetic file (`/private/tmp/claude-502/d40-builder/probe/shiki-scopes.mjs`) shows the three Python string scopes side by side:

```
"Raw doc <U+2013> here." source.python > string.quoted.docstring.raw.multi.python
"Plain doc <U+2013> here." source.python > string.quoted.docstring.multi.python
"not doc <U+2013>" source.python > string.quoted.multi.python
```

   (the script prints the en dash U+2013, written `<U+2013>` here because the report is ASCII). All three copies of `bttr.py` open the docstring with `r"""` (bttn-incident-af line 94, dries-bttr-ecg line 94, ward-bttr-crosssubject line 96), so the same holds for each.

2. Line 95 holds two U+2013 characters (`trained <U+2013> and` and `computed <U+2013> the`), counted by `python3` over the line (`en dashes on line: 2` for each of the three copies). Both are spaced, so each is an `en-dash` row with three suggestions and no fix, and decision 2 gives one row per character: with the docstring recognised, the file gets 2 rows on line 95, not 1.

So the case's "one `en-dash` row" is reached by neither reading: the rule as written gives 0 rows, and the rule widened to every `string.quoted.docstring.` scope gives 2. The brief's own count of "6 en dashes, all in the vendored bttrlib/bttr.py (three copies, line 95 or 97, a docstring)" ("What is on the tree") is the 3 x 2 characters, consistent with 2 per copy.

What the orchestrator has to rule before the build:

- (a) Docstring scopes: every scope that starts with `string.quoted.docstring.` (covers `r"""`; whether other prefixed forms carry such a scope was not probed), so a raw docstring is a docstring as G71 and open item 20.2 (a) say ("Python docstring"). Recommended: a raw docstring is a Python docstring, and a docstring that is not marked would be a silent gap in the writing rules; this is the reading G71's text asks for. The lazy option would be leaving the exact scope and letting raw docstrings go unmarked.
- (b) Keep the exact scope: raw docstrings get no mark. Then case 20 reads "0 rows", and G71's text would need "a Python docstring written without the `r` prefix".
- In both, case 20's count becomes "two `en-dash` rows" (one per character); the closing sentence of case 20 is reworded to that.

A smaller point in case 12 (not blocking): `Q73-report.md:45` holds three U+2192 arrows (`life`, `words` and `stores`), so by decision 2 the line gives three `arrow` rows; the case's "One `arrow` row" is read as the row on the first arrow (its fix `` `state/feeds/life` -> `state/life` `` is the same for each).

No other case contradicted its rule on the checks made so far. The reading checks that were made, each against the file:

- Cases 1 to 6, 8 to 16, 19: the named lines were read (`python3` over the files) and hold what the cases say (guarded.md 7-9, R2-domain-pathology.md 5-8, orchestrator-state.md 311-312, U2-audit.md 13-28, SUBMISSION_CHECKLIST.md 11-13, coauthor-request.md 7-14, deck/title.md 1-6, HPC-UTwente-howto.md 133, 07-depth-amplification.md 17-19, R17.md 11, Q73-report.md 45, mail.md 3 and 7, response-letter.md 181, D14-refuter.md 234, 07-collections.css 124).
- Case 7: marked 18's lexer on `A3-report.md` gives a `paragraph` token at line 1388 (`node a3.mjs`: `1388 paragraph "25c25\n191c191\n269c269\n284c284\n294c294\n"`).
- Case 46: marked 18 lexes `> - a\nb\n> - c` as a block quote holding two lists, and `> - a b\n> - c` as one list of two items (`node marked-cases.mjs`), so the join is a suggestion as the case says.
- Cases 21, 22, 23, 24, 43 (and the `.jsx` half): Shiki's scopes on the case text give exactly the comment tokens the cases name (`node shiki-cases.mjs`: TypeScript string, template, regular expression code and the two comments; Python `#` comment and docstring comment, `'''` string code; shell `# yes` comment only; Svelte script, HTML, markup-expression and style comments comment and the text node code; TSX and JSX the JSX comment and the line comment comment and the JSX text code).

## The cases' first run on the unchanged tree

Command: `node /private/tmp/claude-502/d40-builder/probe/first-run.mjs` (Node 24.21.0, from the scratch folder; it imports `routes.ts`, `runs.ts`, `eslint.ts`, `json.ts` and `ops.ts` of the worktree as they are and posts to `handleLint` and `handleOps` with the write token; cases 1 to 20 over the worktree as root `hub`, the synthetic cases over a temporary folder). Its output as printed:

```
case 1: lint writing tools/oculus/.scratch/migration/agents/guarded.md -> 400 {"ok":false,"error":"bad_body"}
case 2: lint writing funding/2026-fwo-senior-transplant/proposal/long-proposal/reviews/round6/R2-domain-pathology.md -> 400 {"ok":false,"error":"bad_body"}
case 3: lint writing tools/oculus/.scratch/migration/orchestrator-state.md -> 400 {"ok":false,"error":"bad_body"}
case 4: lint writing tools/oculus/.scratch/migration/agents/reviews/U2-audit.md -> 400 {"ok":false,"error":"bad_body"}
case 5: lint writing projects/manuscripts/bttd-source-eeg/admin/SUBMISSION_CHECKLIST.md -> 400 {"ok":false,"error":"bad_body"}
case 6: lint writing projects/coauthor/active/clinical-hccnet/admin/coauthor-request.md -> 400 {"ok":false,"error":"bad_body"}
case 7: lint writing tools/oculus/.scratch/migration/agents/reviews/A3-report.md -> 400 {"ok":false,"error":"bad_body"}
case 8: lint writing deck/title.md -> 400 {"ok":false,"error":"bad_body"}
case 9: lint writing docs/HPC-UTwente-howto.md -> 400 {"ok":false,"error":"bad_body"}
case 10: lint writing projects/manuscripts/bt-operator-theory/notes/derivations/07-depth-amplification.md -> 400 {"ok":false,"error":"bad_body"}
case 11: lint writing tools/oculus/.scratch/migration/agents/reviews/R17.md -> 400 {"ok":false,"error":"bad_body"}
case 12: lint writing tools/oculus/.scratch/migration/agents/reviews/Q73-report.md -> 400 {"ok":false,"error":"bad_body"}
case 13: lint writing funding/2026-nwo-enw-xs/assessment/mail.md -> 400 {"ok":false,"error":"bad_body"}
case 14: lint writing projects/manuscripts/dongho-ecg-clustering/admin/submission/response-letter.md -> 400 {"ok":false,"error":"bad_body"}
case 15: lint writing funding/2026-nwo-enw-xs/assessment/mail.md -> 400 {"ok":false,"error":"bad_body"}
case 16: lint writing tools/oculus/.scratch/migration/agents/reviews/D14-refuter.md -> 400 {"ok":false,"error":"bad_body"}
case 17: lint writing tools/cockpit/data/config/glyphs.yml -> 400 {"ok":false,"error":"bad_body"}
case 18: lint writing tools/cockpit/data/config/text.yml -> 400 {"ok":false,"error":"bad_body"}
case 19: lint writing tools/cockpit/assets/css/07-collections.css -> 400 {"ok":false,"error":"bad_body"}
case 20: lint writing projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py -> 400 {"ok":false,"error":"bad_body"}
case 21: lint writing c21.ts -> 400 {"ok":false,"error":"bad_body"}
case 22: lint writing c22.py -> 400 {"ok":false,"error":"bad_body"}
case 23: lint writing c23.sh -> 400 {"ok":false,"error":"bad_body"}
case 24: lint writing c24.svelte -> 400 {"ok":false,"error":"bad_body"}
case 25: lint writing c25.ts -> 400 {"ok":false,"error":"bad_body"}
case 26: lint writing c26.md -> 400 {"ok":false,"error":"bad_body"}
case 27: lint writing c27.yml -> 400 {"ok":false,"error":"bad_body"}
case 28: lint writing c28.md -> 400 {"ok":false,"error":"bad_body"}
case 29: lint writing c29.md -> 400 {"ok":false,"error":"bad_body"}
case 30: lint writing c30.md -> 400 {"ok":false,"error":"bad_body"}
case 31: lint writing c31.md -> 400 {"ok":false,"error":"bad_body"}
case 32: lint writing c32.md -> 400 {"ok":false,"error":"bad_body"}
case 33: lint writing c33.md -> 400 {"ok":false,"error":"bad_body"}
case 34: lint writing c34.md -> 400 {"ok":false,"error":"bad_body"}
case 35: lint writing c35.md -> 400 {"ok":false,"error":"bad_body"}
case 37: lint writing c37.md -> 400 {"ok":false,"error":"bad_body"}
case 38: lint writing c38.json -> 400 {"ok":false,"error":"bad_body"}
case 40: lint writing c40.md -> 400 {"ok":false,"error":"bad_body"}
case 43: lint writing c43.tsx -> 400 {"ok":false,"error":"bad_body"}
case 46: lint writing c46.md -> 400 {"ok":false,"error":"bad_body"}
case 47: lint writing c47.md -> 400 {"ok":false,"error":"bad_body"}
case 48: lint writing c48.yml -> 400 {"ok":false,"error":"bad_body"}
case 49: lint writing c49.md -> 400 {"ok":false,"error":"bad_body"}
case 36: lint writing with lint.writing off: the route has no such setting; linter writing -> 400 {"ok":false,"error":"bad_body"}
case 39: tab with unsaved text, Fix All: no writing fixer to register; see grep below
case 41/42: reader absent: src/lib/server/machine/runs/lint/writing: ENOENT
case 44/45: worker absent (same folder);
case 50: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 51: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 52: folder plan -> 400 {"ok":false,"error":"bad_body"}
case 54: writing-fix two files -> 400 {"error":"not-an-action"}
case 55: writing-fix refusals -> 400 {"error":"not-an-action"}
```

Page halves and the id checks, on the unchanged tree:

```
$ grep -rn "lint-writing\|writing-fix\|lint.writing" src config tests | grep -v local.yml
(no lines, grep exit 1)
$ node -e "import('src/lib/data/model/model-machine.ts').then(m => console.log(JSON.stringify(m.LINT_IDS), JSON.stringify(m.lintersOf('a.md')), JSON.stringify(m.lintersOf('a.ts'))))"
["chktex","ruff","eslint","shellcheck"] [] ["eslint"]
```

So on the unchanged tree: every route case answers 400 `bad_body` (`z.enum(LINT_IDS)` does not hold `writing`; the `folder` action is not in the body shape), cases 54 and 55 answer 400 `not-an-action` (the op `writing-fix` is unknown), case 38 answers `bad_body` where the built tree answers `not_taken`, and cases 13, 15, 21 (page half), 30 (page half), 36 (menu item), 39, 53 and the folder dialog find no such action, menu item, fixer or dialog: the grep above prints no line, and `lintersOf('a.md')` is empty. Case 40's ids and keys: `writing` is in no list, `lint-writing`, `writing-fix` and `lint.writing*` appear in no file. Cases 41 and 42 have no reader to run (`src/lib/server/machine/runs/lint/writing`: ENOENT). Cases 25, 44 and 45 need the reader and the worker and have no run on this tree.

## DONE / NOT DONE

| Row | State | Proof |
|---|---|---|
| First run of every case on the unchanged tree | DONE | `first-run.mjs` output above |
| Items 1 to 14 of "What to build" | NOT DONE | stopped at case 20 before any change |
| `tests/server/machine/runs/lint/writing.test.ts`, `tests/routes/replace/writing-fix.test.ts` | NOT DONE | not written |
| "Verify before you report" 1 to 11, full-list runs | NOT DONE | 0 full-list runs |

## Files changed

None. The worktree is as dispatched; the only file written under it is this report. Scratch files are under `/private/tmp/claude-502/d40-builder/probe/` (`first-run.mjs`, `first-run.out`, `shiki-scopes.mjs`, `shiki-cases.mjs`, `bttr-scope.mjs`, `marked-cases.mjs`, `a3.mjs`).

## Path in the brief that differs from the tree (not blocking)

`src/lib/server/root/server-context.ts` (path list, item 2) is at `src/lib/server/root/process/server-context.ts` (`lintRuns` at line 49). The step writes that file; the path list names the wrong folder.
D39 also changes `src/lib/server/files/fs/lsp-edit.ts` (its item 5, the private-folder refusal and the copy limit, `D39.md:131`), which "Shared with D39" does not list; D40's generalisation of `lspEditFiles` and D39's change meet in that file at landing.
