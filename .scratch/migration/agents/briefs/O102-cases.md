# O102, the ruling on the cases of the first run

The builder's hand-back (`agents/reviews/O102-report.md`) is read and its claims checked on the tree: the website's change is committed (`git log --oneline -2` in the website prints `225a55d Update publications: move ECG representation paper ...`); the hub's `.oculus/config.yml:42-51` holds nine `kinds` rows, the last two `[journal, other-publications]` for the form `journal` and a catch-all of six sections; `chi-purpose-centric`'s title differs from `publications.yml:497` by case and a closing full stop; the two Bioinformatics rows are `data.yml:107-109` (Sept. 2025 - Sept. 2026) and `data.yml:119-121` (Sept. 2024 - Sept. 2025); the CV template reads `personal.links.googlescholar` and `linkedin` as account names (`_scripts/src/cv.tex.template:70-71`). The rulings below are booked as open item 571 (Z1075). Everything else in the brief stands.

Premise corrections to the brief: line 13's staged change is committed, and the step reads the website as committed; "What is on the tree" says six `kinds` rows, and there are nine; item 4's "Bioinformatics ... printed twice" is two runs of one course.

1. **A, key order.** Case 1 compares the parsed files with the key order inside an entry not counted, and with the order of the sections, of the entries in a section, of the rows of a list and of the names in a `links` map counted. The report lists the reorderings of keys inside entries as text-level differences of the first write.
2. **B, the generated title.** The hub patch sets the seven manifest titles (`phd-thesis`, `bachelor-network-ids`, `masters-eeg-infotheory`, `volga-finger-trajectories`, `chi-purpose-centric`, `modulation-lmp-bci`, `highgamma-event-detection`) to the website's text, each named in the report with its old and new title.
3. **C, one section.** The hub patch rewrites the `kinds` rows so each names one section: the `journal` form gives `journal`, the `tech-report` form gives `other-publications`, and the catch-all row is removed. The generator takes the row's one `kind`. Dongho Chun's manifest gains `form: journal`. A manifest that no row takes, and that carries `publication:`, gives no entry and a finding, as item 2 says of a stage with no section. The audit's expectation of a section reads the same rows.
4. **D, the industry profiles.** A profile row names its record by key and carries its own `location`, `duration`, `date` or address where it prints them differently from the record; a row that covers two records names both. Where it prints the record's value, it carries none.
5. **E, the employer CVs' person block.** `career.yml` `profiles` gains a `shared` block with the email and links the employer CVs print (`industry.yml:13-25`); `data.yml`'s `personal` reads the `self` entry of `people.yml`.
6. **F, full names.** The hub patch gives the six `people.yml` entries (`:62`, `:116`, `:128`, `:133`, `:138`, `:148`) the full name `data.yml` prints, its spelling kept ("Anh Phuong DO").
7. **G, the two runs.** Two `education.yml` entries, one per academic year, as the file does for supervision entries; the 2024-2025 run is a new entry.
8. **H.**
   - A grant row's printed status is a text field `cv_status` on the `funding.yml` entry, entered in its schema with help ("The status the CV prints for the grant").
   - The ten section titles of `data.yml` go in a `sections:` map of `website.yml`, in the website patch, keyed by the section's key.
   - A `people.yml` link row is `{ name, url, handle }`: `url` the full address, `handle` the account name a CV prints where it prints one (Google Scholar `abRAHJEAAAAJ`, LinkedIn `axelfaes`, GitHub `TheAxeC`); the generator writes `handle` where the CV reads one and `url` otherwise. ORCID stays the entry's `orcid` field.
   - Case 5's form is `journal` (`config/catalogs/vocab.yml:81`).

The cases of the brief change only as above. Resume the build of items 1 to 13 from these rulings; the final report carries this file's path.
