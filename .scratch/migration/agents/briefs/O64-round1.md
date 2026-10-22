# O64, repair round 1

The review `agents/reviews/O64-refuter.md` holds. Fix these three findings and nothing else; the paths widen to `src/lib/ui/display/meters/Progress.svelte` for item 1.

1. T1. `Progress.svelte` draws its track as a `div` (`:20-30`), which through `RepoList.svelte`'s `named` snippet now sits inside spans inside the row's `<button class="main">`, where only phrasing content is valid. Make the track a `span` with the display that keeps it drawn as today (block), so it is valid inside a button and everywhere `Progress` is used. Read every user of `Progress` (`grep -rln "meters/Progress" src`, 5 files) and name each in the report with why it draws as before; the look at landing checks them. Its `role="progressbar"`, label and reduce-motion rule stay.
2. T2. In `RepoList.svelte`'s `actions` snippet, `{@const words = working ? repositories.busyWords(root) : ''}` shadows the row's `words` snippet; rename the `@const` to a name that says what it holds (the busy words), with every use of it.
3. P1. The report's "Verify 6, names" quotes the greps' output as printed, in place of the summary table.

Then rerun the brief's "Verify before you report" checks for the files you changed (the verify list once, after the last change) and append a section "Repair round 1" to the report with each fix, its place and the output of the checks. The rules of your first build hold unchanged.
