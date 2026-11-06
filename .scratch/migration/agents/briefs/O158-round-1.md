# O158 repair round 1

The review is `.scratch/migration/agents/reviews/O158-refuter.md` in the main checkout (`/Users/axelfaes/workspace/oculus`); read it whole. Each finding below is ruled; change only what it names. The paths are the step's paths and the report.

1. Spec 1, `src/lib/views/academic/present/parts/project/Facts.svelte:183-187`. A fact's tooltip wrapper is held to its fact's width again (`min-width: 0; max-width: 100%` on the wrapper, for example `.fact > :global(.tip)`), so a value longer than its room in a narrow frame (a 400 px frame, 270 px inner) ends in an ellipsis at the strip's edge and no fact runs past the strip. Name in the report how the value then shrinks below the 14em cap, and give C10's 400 px state and C15 below the cap again.
2. Behaviour 1, `Facts.svelte:111` and `:118`. The hidden copy a screen reader reads gives the whole fact, every entry of a list (`read` from `whole`), so the accessible text holds what the base's did; the drawn strip stays as it is. The key `fact_more` then has no user: remove it from `config/text/views/academic/present.yml` when nothing else reads it (grep it). State the accessible text's before and after in the report.
3. Proof 1. In "The case-run program", quote the base command with `FACE=1.0`, the form that reproduces the base counts, and name the face factor every line count assumes and how the counts move at 1.05 (fed-faithful-ecg 1 to 2 lines). Name the decks within 5 percent of a line break as unsettled until the look.
4. Standards 1, `src/lib/views/academic/present/Slide.svelte:24-31`: rewrap the paragraph as a whole at 100 columns.
5. Standards 2, `Facts.svelte:23-25`: state it directly ("so it scales with the text size and the theme, outside the content's factor"), with no "not X" contrast.
6. Standards 3, `src/lib/views/academic/present/parts/Dot.svelte:5-6`: "unless an element around it sets `--dot-size`", in place of "its parent".
7. Open items: copy them from the main checkout's state file, section "Open items", when you write the report.

Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. After the round's last change, run the full verify list and quote its final lines in the report; a red line in a file you touched is fixed before hand-back.
