# O105, repair round 1

Worktree and rules as the brief says. Each item is ruled; change what it says and nothing else. The findings are in `.scratch/migration/agents/reviews/O105-refuter.md`, in the worktree copy of this ledger once copied, under the names below.

1. P1. `tests/routes/sessions/website.test.ts`, row 'a file that is a link to a file out of the folder': assert that the outside file still reads `kept: 1\n` after the refused press, with `outside` reachable from the assertion. The filter of `onDisk` lifts the check only for that row's own value, not for the rows of case M.
2. P3. Add one row for a path naming the website's folder itself (`.`) and one for two keys differing by letter case on a case-folding file system, each with the expected result, in `tests/data/hubs/website-files.test.ts` beside the other bad-path rows. Quote each failing line from a run on the unchanged tree only if it can be had without touching source; otherwise say it is new and judged by reading. No code is altered to make a test go red.
3. T1. Remove `isEntry` from `src/lib/server/content/audit/website/site.ts` and use the exported `seen` of `src/lib/server/core/git/run.ts:300`. If the layers forbid that import, move `seen` to `core/paths.ts` and point both callers at it. Quote the helper grep in the report.
4. T2. `BadPath` in `site.ts` stops being exported.
5. T4. `settingsOf` in `src/lib/state/sessions/source/website.svelte.ts` loses its try and catch.
6. T5. The website patch: the edited paragraph of `_industry/README.md` is one line. Regenerate `O105-website.patch` by `diff -ruN` as before.
7. T6. `docs/HELP.md:561`: name the website's own file in place of `its` before `programs:`.
8. Report only: S1, quote the source of the compare loop of cases I and J and how the scratch hub was made, or rerun with a quoted loop, and settle 16 against 14 html files; quote the case-run output whole. P2, correct the `website-watch.test.ts` row. T3, add the head-comment and doc list ('still true' or 'rewritten'), each new key's collision case, and the statement that cases F, G, M, N, Q and part of D sit in a slow-tagged file. B1, correct the landing paragraph: on a website without the patch both CV builds stop with `KeyError: 'portrait_url'` and all 18 page headings are blank. B2, add the before and after for a generated file that is a link out of the folder, in Write the website and in the audit.

Verify: the brief's checks 1 to 4 and 6, once, on the final tree. The list is not run again for a timeout in a file the step does not change. A shortcut is a finding. No git command that changes state; only your report and the website patch in the ledger. Append your changes to the existing report under "Repair round 1".
