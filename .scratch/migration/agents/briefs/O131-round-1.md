# Repair round 1 of O131

Read `agents/reviews/O131-refuter.md` (in the main ledger, copied beside this file in the worktree's ledger as `agents/reviews/O131-refuter.md`) for each finding's evidence. Each item below is a ruling: make the change it names, nothing else. The path list of the brief widens to `docs/HELP.md` line 570.

1. Decision 4 of the brief is reversed, which closes the divergence the builder named and the review confirmed (Declined to judge, the `joined` multi). A `joined` multi's schema is a text held to the value rule's form: `{ type: 'string', pattern: '^$|^[^ ]+( [^ ]+)*$' }`, the empty text or words separated by single spaces, which is what `multiProblem` (`value-rule.ts:161-170`) takes (`value === '' || value.split(' ').every((w) => w !== '')`). Before writing it, run the rule and the new schema over `''`, `'dark'`, `'dark contrast'`, `' dark'`, `'dark '`, `'dark  contrast'` and `'dark<tab>contrast'` (a real tab) and quote both columns; the two must agree on every row, and the pattern is changed until they do. The words stay any text, as decision 4's reason says. Case C11 becomes: the theme row's `class` written `'dark contrast'` gives no problem, and `'dark  contrast'` (two spaces) gives one on its line; a test row of describe 'the schema of a multi' checks both, run first on the code before this round's change to quote its failure, as the brief's check 4 asks.
2. Standards 1 and 2: the head comment of `options.ts` is made true of the file. A choice drawn from a source only the page holds is any text; a multi drawn from one is one text or a list of texts, and a `joined` one is one text of words separated by single spaces. The sentence on where the schema and the rule part gives no count, names the kinds as they now stand after item 1 (the `joined` spacing is no longer one of them), and adds the one the review found: a keyed family written as a list of rows, which the schema takes (`familySchema`, `options.ts:322`, `type: ['array', 'object']`) and the rule refuses (`familyProblem`, `value-rule.ts:249-251`, `{ kind: 'pairs' }`). The doc comment of `multiSchema` is rewritten to match item 1.
3. Standards 3: `docs/HELP.md:570`, the bullet "In a YAML file the editor checks, Ctrl+Space completes the keys, ...", gets one clause saying that a value of a choice or a multi is completed from its words and marked when it is outside them. One line, no hard wrap.
4. Behaviour 1: in your report, the hover bullet's before and after are corrected to what oculus's editor shows: oculus sends `hoverSchemaSource: false` (`src/lib/server/machine/lsp/adapters/yaml/settings.ts:14`), so no source line shows before or after; the change adds the `Allowed Values:` list under the help line.

Verify, from the worktree's root, after the last change: the brief's checks 1 to 5 again, `npm run test:quick` once, the ASCII gate over the changed files, and the unused-exports compare. Append a section "Repair round 1" to your report with each item's change, the runs quoted, and the files with line counts.

The orchestrator's run of the rule and the pattern before this round was sent (`npx tsx` over `valueProblem({ control: 'multi', joined: true, from: 'theme_classes' }, v, {})` from the worktree's `value-rule.ts`, and the pattern's `test`):

```
"" rule null pattern true
"dark" rule null pattern true
"dark contrast" rule null pattern true
" dark" rule {"kind":"words"} pattern false
"dark " rule {"kind":"words"} pattern false
"dark  contrast" rule {"kind":"words"} pattern false
"dark<tab>contrast" rule null pattern true
```
