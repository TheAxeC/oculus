# O154, repair round 1

The findings of `agents/reviews/O154-refuter.md`, each with its ruling. The brief `agents/briefs/O154.md` and the cases ruling `agents/briefs/O154-cases.md` stand. The paths are the brief's and those the diff already changes.

Every file edit in this round is made with Edit or Write (`spec.md`, "What every package obeys"): no program of your own, inline or in a file, that changes a file or prints text you then copy into one, and no heredoc or redirect that changes a file. Run the unit test files your change touches while you work, and the brief's "Verify before you report" once, at the end of the round. Diagnosis is banned; a cause is found by reading the code and, where a read does not settle it, by a run of your own. No breakage or mutation testing of any kind. A shortcut is a finding: a narrower reading of a ruling, or work inside it called outside it, is done or handed back with the reason before the report.

1. Spec 1, the programs `wrap.py` and `short.py`. They are a breach of `spec.md`, closed under the standing ruling "Unapproved builder scripts" (`plan.md` Rulings): the breach is recorded at landing, and this round lists the programs and the text they shaped so the orchestrator can read each hunk. In the report, under a heading "Programs", list each program with what it did and every run of it you made, in order, as far as your own record shows it: the input it was given and what it printed. Then list every comment paragraph whose wording or line breaks came from that output, as `file:line-line` in the worktree as it stands, the head comments and doc comments of item 7 among them. Read each listed paragraph yourself against the rules file's comment rules (whole paragraphs at 100 columns, no line inside a sentence ending short, what and why, no history) and fix with Edit any that breaks them; name each fix with its place. Write no program to do this.

Closed, not sent:

- The edits at `docs/decks.md:131` and `docs/HELP.md:334`, outside the write list's line ranges: the reviewer judged both needed, since the sentences became false; they stand.

Report: rewrite `.scratch/migration/agents/reviews/O154-report.md` in the worktree's copy of the ledger to its final form, with the ruling above marked done with the check that shows it, and the verify lines of the end of the round.
