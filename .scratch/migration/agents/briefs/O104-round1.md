# O104, repair round 1

Read with `agents/briefs/O104.md`, `O104-cases.md` and the review `agents/reviews/O104-refuter.md`. Each item says what to change. The rules of your first message stand: no state-changing git, work only in the worktree, in the ledger only your report and the hub patch. A shortcut is a finding: an item read narrower than its text, or work inside it called outside it, is done or handed back with the reason before the report. No script is written, inline ones included.

Paths this round writes: those of the brief, the files each item names, the hub patch and the report.

1. The outcome line (Standards 1). `RecordPage.svelte` gains a prop for the error tone of its `said` line (`--danger`), and `Career.svelte` hands its `said` text and tone to the frame and drops its own `<p>`, `.said` and `.said.error`.

2. Text outside a card on a page (Behaviour 1). What a page draws outside a card sits on a `Surface`, as `Project.svelte:161` and `:193` do: `Person.svelte`'s two `Empty` lines and the folder body, as `EntryFolder` wraps it; `Career.svelte`'s `Empty`; `Listing.svelte`'s `Empty`. Grep each rebuilt page (`Person`, `Career`, `Listing`, `Post`, `Entry`) for any other such text and wrap it. The body of `Post.svelte` included: it stands on no tinted Pane.

3. The off-pillar line (Behaviour 2). `RegistryPageCard.svelte` hands `LineCard` `muted`, read as `Pillars.svelte:146` reads it, so the page's card is the card the view draws.

4. A post's images (Behaviour 3). `Post.svelte:90` passes `linkedinSourcePath(folder, entry.file)` as `path`.

5. `byKey` (Standards 2). `RegistryPageCard.svelte:60` and `:63` read through `byKey` of `guards.ts`.

6. False sentences (Spec 2). Correct these to what the code does: `docs/templates.md:99`, `docs/templates.md:1711`, `tests/fixtures/hubs/demo/.oculus/data/academic/career.yml:1`, `EntryFolder.svelte:9-10` and `:76` (the page's tab state holds the folds and the chosen document, no edits), and `career.no_schema` in `config/text/views/academic/career.yml:10`, which reads: "The career file has no schema: list, so it has no editor. Add a schema: to the file to edit it." Then grep `src`, `config` (with `--exclude=local.yml`), `docs` and `tests/fixtures` for `Career view`, `edited in`, `entry's page`, `on its page`, `its editor`, `form` beside `career` or `entry`, and correct every other sentence the step made false.

7. The fixture's sentence (Spec 3). `tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml:8` ends: "and its title is written in the entry's editor." Correct the two rows of `tests/data/hubs/hub-portfolio.test.ts` only if they match this text.

8. The hub's sentences (Proof 1). Ruled: the hub patch takes these three text changes beside its `section:` rows, by the same reason as item 14 of the brief, and nothing else.
   - `.oculus/data/literature/literature.yml:8`, same sentence as item 7.
   - `.oculus/data/academic/career.yml:1`: "# Career: the strategy and the career record, shown in oculus's Career view on the Academic page and edited in its editor."
   - `.oculus/data/academic/funding.yml:1`: "Every entry has a page with an editor built from the schema" becomes "Every entry has a page, and an editor built from the schema", and "Add asks the key and opens that page" stays. The rest of the line is unchanged byte for byte.

9. The report (Spec 1, Proof 1). Under "Scratch programs", give the commands by which the hub patch, the fixture rows and the `docs/templates.md` rows were made. Correct the report's first line and its count of false hub sentences.

After the changes, run `npm run diagrams && npm run docs:palette && npm run test:quick` once, the `patch --dry-run` of the brief, and each changed test once after the change, and quote their lines; a red line in a file the step does not change is run alone, not the list again. Append to `.scratch/migration/agents/reviews/O104-report.md` a section "Repair round 1" with each item's change and its checks, and correct "Doc text" in place.
