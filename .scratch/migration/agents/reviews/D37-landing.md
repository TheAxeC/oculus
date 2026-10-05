# D37 landing: the Search view's replace and the LaTeX build and view kept true

Plan oculus/migration, step D37 landed on main; next: H3 (the hub's data map), then D42 (a file's history).

## Open items

None.

## Agents stopped before the landing

`ListAgents` before the cherry-pick listed no agent of D37: its builder a199838e70a84d39d and its reviewers had finished. The two agents running belong to X3f (diagnosis) and S5 (refuter).

## Not done

- Case 18, the terminal bar's resize refusal, was not seen on TEST: no build terminal ended between the start and the first resize during the look.
- Case 32, a Replace Preview asked from a float, was not seen on TEST.

## What landed

Booked 2026-10-05: the Search view's replace kept true after a write and the LaTeX build and view kept true landed on main from base ed0e6de58 (61 files, +1851 -887), /spec with a brief check, built, refuted, one repair round (the refuter's findings and the Format Document diagnosis, `agents/reviews/D37-diagnosis.md`, first heading: a preview tab kept replaced the instance and the editor made its model again, fixed by `$derived` names in `ui/controls/editor/Editor.svelte`), refuted again, /land. The builder's first report did not pass its bar (the round). Fixes at landing, three: (1) the round review's Spec finding 1, `written` in `server/files/fs/replace.ts` counts an empty region at a line's start, and at the end of a last line with no line end, as on the line, so a replace with an empty text gives a dismissed hit on that line back (probe: ` x qzlook` gets `edited` on main and not on the worktree; a hit on the next line stays unmarked); (2) the round review's Standards finding 4, the `Editor.svelte` comment rewrapped at 100; (3) a defect the look found, older than D37 (the second diagnosis in `agents/reviews/D37-diagnosis.md`, red on ed0e6de58): a diff pane read through the file routes (the Replace Preview, Compare with Selected, a local history copy) names its root by the served key, which `openFile` and `revealFile` read as a repository folder, so Open File opened nothing; `tabOf` in `state/sources/repositories/repositories.svelte.ts` takes a served key as the tab's root (folded into D37 by Z468). The round review's Standards finding 3 closed by naming D37's four tests under G35 in `agents/guarded.md`; Behaviour finding 5: a project command's Run Again or Restart that ends between two polls with the same status now sends a `sessions` push, so its diagnostics are read again for that run. Verification on main: `npm run diagrams` exit 0; `test:landing: 140.1 s; every command passed` (an earlier run failed `test:checks` on the look's scratch folder `side-projects/look-d37/`, which has no `project.yml`; the folder removed, the whole list run again). The look on TEST (Z467): Search `qzlook` lists 5 hits in 2 files and says `claude ran out of time.`; the second hit of line 1 dismissed and the first replaced with an empty text gives the dismissed hit back on the changed line, the file reading ` x qzlook`; Format Document on a preview tab, then Cmd+Z, gives the text back and the tab is clean; Open LaTeX on a folder from its row menu lists `main.tex`; build runs in a terminal tab and ends with `PDF 02:21`, `2 problems`, `0 errors, 2 warnings`; build again on a file with one error runs in the same kept terminal and ends with `PDF 02:22`, `1 problem`, `1 error, 0 warnings`, the list naming `main.tex:3  Undefined control sequence.`; PDF opens the page; the Replace Preview's Open File shows `messy.json` at `Ln 2, Col 1`. Not seen at the look: the terminal bar's resize refusal (case 18) and a preview asked from a float (case 32). Agents: builder a199838e70a84d39d (claude-sonnet-5-5), 202,552 tokens, 284 tool uses, 43.1 min, round 1 136,539 tokens, 100 tool uses, 26.2 min; brief check a034fb57d1878846c (claude-opus-5-5), 259,613 tokens, 81 tool uses, 10.2 min; reviewer a69f261fc8c1776c5 (claude-opus-5-5), 316,568 tokens, 89 tool uses, 18.8 min; reviewer over round 1 a45d0e7de5d8174e5 (claude-opus-5-5), 254,346 tokens, 82 tool uses, 16.0 min; diagnosis of Open File aec785dceedf5bb25 (claude-opus-5-5), 224,498 tokens, 86 tool uses, 15.8 min; the Format Document diagnosis run by the orchestrator on TEST.

## What is next

H3 lands with its fixes at landing and a look on the Help pages (the Venues and Pillars help lines), then D42 with its fixes at landing, the page-cost timing on HELP.md and a look.
