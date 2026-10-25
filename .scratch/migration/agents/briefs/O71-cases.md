# O71, round 0: the cases ruling

The builder's first run found one case the brief's own rules get wrong. It is ruled here and replaces the case's text in the brief; every other case stands as written.

1. Case 11, second half. A hub `manifest_fields:` row whose `from` names a list `vocab.yml` does not hold gets no finding on the unchanged tree (the first run's row `from: vocab.no_such_list`), and G128 promises none. The case's second half reads: a row with `from: vocab.priority_levels` is read like every row whose `from` names no vocab list: no finding, as such a row gets today. The step adds no code for it; the missing finding is booked as open item 342 for Axel, since it holds for every unknown list name and does not come from this step.
2. Case 7, the first grep. Its one hit `docs/HELP.md:517` stays after the step, since that line is handed over as Doc text and applied at landing; every other hit is gone.
