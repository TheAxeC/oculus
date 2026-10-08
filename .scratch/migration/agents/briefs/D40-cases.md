# D40, the cases ruling (round 0)

The builder's first run stopped on case 20 before any change (`agents/reviews/D40-report.md`). The orchestrator checked each point on the tree and rules as follows. The brief stands everywhere else; build every item now.

## Case 20 and the docstring scope

- Checked: `sed -n 94,95p projects/manuscripts/dries-bttr-ecg/code/bttrlib/bttr.py` shows `r"""` on line 94; a `python3` count gives 2 U+2013 per copy in all three `bttr.py` copies; your probe `bttr-scope.mjs`, rerun, prints `string.quoted.docstring.raw.multi.python` for line 95.
- Ruling: (a). Item 2's docstring rule reads: a character is in a comment when a scope of its token starts with `comment.`, or, in Python, starts with `string.quoted.docstring.`. G71 names Python docstrings (open item 20.2 (a)), and a raw docstring is a docstring. Probe the other prefixed forms (`u`, `b`, `f`, `rb`, `R`) and quote the scope each gets; a form whose scope does not start with `string.quoted.docstring.` is reported, not added by another rule.
- Case 20 now reads: no row, since the file is skipped by `**/bttrlib/**` and the route answers `off`. With `lint.writing_skip` set to `[]`, two `en-dash` rows on line 95 (`trained <U+2013> and` and `computed <U+2013> the`), each spaced, each with the three suggestions and no fix.
- Add case 22b to G71's test: a raw docstring `r"""Doc <U+2192> string."""` gives one `arrow` row.

## Case 12

- Checked: line 45 of `Q73-report.md` holds three U+2192 (`python3` count).
- Case 12 now reads: three `arrow` rows on line 45, one per arrow, each with the preferred fix to `->` and the suggestion ` to `; Fix All gives `->` for all three.

## Paths

- `src/lib/server/root/server-context.ts` in "Paths this step writes" and in item 2 is `src/lib/server/root/process/server-context.ts` (lines 40-55).
- `src/lib/server/files/fs/lsp-edit.ts` is also written by D39 (its item 5, the copy limit and the private-folder refusal). D39 lands first; your generalisation of `lspEditFiles` keeps D39's checks when the two meet at D40's landing, and your report names the functions you changed in that file so the landing can merge them.
