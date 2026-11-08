# O151 round 1: the review's findings and the source rule

Rules: `agents/spec.md`, the step's brief `agents/briefs/O151.md` and its round-0 rulings `agents/briefs/O151-cases.md`, which stay in force except where this file says otherwise. The findings are those of `agents/reviews/O151-refuter.md` and of the read-only check `agents/reviews/O151-source-check.md`; each is ruled here. Every ruling stays inside the step's part.

You work in the two worktrees the brief names and nowhere else. Backups, logs, case-run programs and temporary folders live in `.agents/scratch/` inside the oculus worktree, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` both set to it, and are removed before the report; the verify list's `npm run test:quick` runs with `TMPDIR` unset (`agents/spec.md` "Where you work").

## The source rule (Axel's ruling 724, in force for every deck)

A slide states only what the project's own sources state: its manuscript, `README.md`, `project.yml`, `CLAUDE.md` and the project's other text files, as item 1 of the brief lists them. A slide carries no verdict on the work; no claim that the paper, a table, a figure, a caption or the draft is wrong, inconsistent, holds identical or repeated values, or leaves something out; no range, count, sum, "best", reading of a chart or comparison that the sources do not state; and no framing or explanation they do not give. A faithful rewording of a source's statement is allowed, and so is a limitation the sources themselves state. A statement the sources give with a hedge ("likely", "may") keeps the hedge.

## Rulings

1. **Every deck read again against the rule.** Read all 95 decks in full, each against its project's sources, and remove every statement the rule bars or replace it with the sources' own words. `agents/reviews/O151-source-check.md` lists 71 such statements in 31 decks: every one of them goes or is replaced, and it is where you start, not the limit; a statement it does not list that the rule bars is treated the same. A slide title that frames a critique is retitled by what the slide shows (abduction slide 2 is "Abduction decoding per finger pair"; go-bttr slide 2 is "How Go-BTTR assigns its blocks"). A slide that loses lines still fits its frame and keeps the brief's shape (one slide, or two where that reads better). The report lists, per deck, each statement removed or replaced, with its line before and its words after.
2. **The known issues of a paper, kept privately.** For each project whose deck stated a fault of its paper (the ten of the source check's "Critiques" section, and any other you find), check each fault against the paper itself. Each fault that holds is written in that project's `README.md`, under a section placed at the end of the file:

   ```
   ## Known issues in the published paper (private)

   Not to be presented on slides, in project.yml, or anywhere else.

   - <the fault, as the paper shows it, with the file and line or table that shows it>
   ```

   For connectivity-motor-imagery, which is a stopped draft, the heading reads "## Known issues in the draft (private)". A fault that does not hold against the paper is not written. Nine of the ten projects have no `README.md` (go-bttr, abduction, fbttr-strategies, fermat, hcc-modality-poster, connectivity-motor-imagery, abstract-bci-meeting-2021, chi-household-survival, http2-web-performance): there the file is created holding a first line `# <the project's title from project.yml>`, a blank line, and the section. ecg-readable-substrate's existing `README.md` gets the section at its end, and nothing else in it changes. No deck takes anything from such a section. The report lists each fault written, with what showed it, and each one dropped, with why.
3. **The idea stated in its own terms** (Spec 3, Axel's ruling 723). The xsub-ecog-framework deck states the idea as its own manifest and README state it (one cross-subject ECoG framework tested across tasks and subjects, its gate, what it would measure), with no student method as its mechanism, no student result as its status, and nothing of ward-bttr-crosssubject named.
4. **No other project's result as a bar** (Spec 1). serial-ecg-af's chip "Single-ECG bar" carries no BTTN number; round-0 ruling 1 bars another project's result. Naming BTTN as the model the project keeps stays.
5. **Only the files item 1 lists** (Spec 2). fed-faithful-ecg's FedProx numbers come from a file neither `README.md` nor `CLAUDE.md` names: they go, and the deck states FedProx as the README does, a benchmark still to run.
6. **The disagreement listed** (Proof 2). fermat's deck keeps the numbers of the FLTA paper the manifest names (`admin/conference/main_work.tex`); the report lists the local-client rows that differ in the arXiv version under `manuscript/` (0.89 and 0.92 against 0.842 and 0.882) with both places, as the brief asks for any disagreement.
7. **The report's verify sentence** (Proof 1). The sentence that verify item 1 "cannot pass" is removed; the report gives the run of this round.
8. **Values read from a figure** (Proof 3). A value a slide takes from a figure stands only where the figure prints it as text (a bar label, an axis-free number in the image); a value read off a chart's geometry goes under the source rule. Each figure value kept is checked again from a render made in `.agents/scratch/`, and the report names the figure, the value and the render.
9. **The individual-reference-intervals folder line** (Spec 6) goes under ruling 1.

Spec 5 (unapproved read-only programs) and Spec 7 (the comment rewrap in `Slide.svelte` lines 41-42) need nothing from you: nothing those programs printed is used, and the rewrap is accepted at landing. C9, the measured fit, is the orchestrator's look at landing.

## Paths this round writes, beyond the brief's list

In the hub worktree:

- `projects/archive/published/2025/go-bttr/README.md`
- `projects/archive/published/2026/abduction/README.md`
- `projects/archive/published/2025/fbttr-strategies/README.md`
- `projects/archive/published/2025/fermat/README.md`
- `projects/archive/published/2026/hcc-modality-poster/README.md`
- `projects/archive/stopped/connectivity-motor-imagery/README.md`
- `projects/archive/published/2021/abstract-bci-meeting-2021/README.md`
- `projects/coauthor/published/2016/chi-household-survival/README.md`
- `projects/coauthor/published/2018/http2-web-performance/README.md`
- `projects/manuscripts/ecg-readable-substrate/README.md`, the new section at its end only
- the `README.md` of any other project whose paper fault you find, named in the report

## Verify before you report

The brief's "Verify before you report" list, run after this round's last change, with `npm run test:quick` run with `TMPDIR` unset. Add the character-set check over every `README.md` this round writes. The report appends a "Round 1" section to `.scratch/migration/agents/reviews/O151-report.md` in the oculus worktree: per ruling what was done, the per-deck list of ruling 1, the faults of ruling 2, and the verify lines.
