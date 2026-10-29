# O102 hand-back before any change: the first run finds cases the brief's own rules get wrong

Nothing of the brief is built. The first run of the cases on the unchanged tree finds that case 1 (the generator's output equal to the website's three files, with only case 2's differences) cannot hold under the rules of items 2 and 4 against the data on disk. The brief says to stop there, before changing any code, and hand back the first run with each such case, its rule and the result it gives. No file of the hub or the website is changed, and the one file written in the worktree is this report (`git status --short` in the worktree: `?? .scratch/migration/agents/reviews/O102-report.md`); no patch is written.

## Premise that does not reproduce

- Brief line 13: "Its `publications.yml` has a change staged in the website's repository that is not committed (`git diff --cached --stat` there: `_data/publications.yml | 24`)". In the website, `git diff --cached --stat` prints nothing and `git status --short` prints nothing; `git show --stat HEAD` prints commit 225a55d4 "Update publications: move ECG representation paper to 'Papers in Preparation' and adjust publication status", `_data/publications.yml | 24 ++++++++++++------------`. The change is committed. The file on disk is the same either way: `publications.yml:205-216` holds the Dongho Chun entry in `journal` with `pub_pre: ""` and `pub_post: '(Accepted)'`. Nothing in the step depends on it being staged.

## The cases the brief's rules get wrong

### A. Map key order (cases 1 and 2, item 8)

Rule: case 1 compares the generated files with the files on disk "parsed with map key order kept"; case 2 lists the only differences allowed, and key order is not among them.

Result: the entries of one section are written in different key orders on disk, so no generator that writes one order per record shape gives them all. Examples:

- `publications.yml:5-14` (FLKit): `authors, order, title, program, url, pub_pre, pub_post, book, pub_date, abstract`.
- `publications.yml:15-23` (ERP signatures): `authors, title, program, pub_pre, url, order, pub_post, book, pub_date, abstract`.
- `publications.yml:234-240` (GO-BTTR): `authors, title, program, book, url, order, pub_date`; `publications.yml:243-249`: `authors, order, title, program, pub_date, book, url`.
- `data.yml:107-109` (`title, location, duration`) against `data.yml:110-112`, BKO (`title, duration, location`).

The first write of each file therefore differs from today's file in key order on most entries. Item 8's audit is not affected after that first write, since the generator's order is then on disk.

Options: (a) case 1 compares the parsed values with the key order of each entry ignored, and the report lists the key orders the first write changes as a text-level difference; (b) each record keeps its entry's key order (a stored key list per record), which carries the website's accidental order into the hub. Recommendation: (a). Lazy option: none of the two leaves work undone; (b) is the costlier and worse one.

### B. The generated `title` (item 1, ruling 543 (1), case 1)

Rule: `title` is generated from the manifest's `title`.

Result: seven manifests' titles differ from the website's by case, a hyphen or a trailing full stop (each pair matched by the brief's normalised comparison, so the record goes on that manifest):

| Manifest | Manifest `title` | Website title |
| --- | --- | --- |
| `projects/archive/phd/phd-thesis/project.yml:12` | Finger movement decoding: From source-localisation to tensor regression modelling | `publications.yml:415` Finger Movement Decoding: From Source-Localisation to Tensor Regression Modelling |
| `projects/archive/published/2016/bachelor-network-ids/project.yml:10` | Machine Learning Techniques for Flow-Based Network Intrusion Detection Systems | `publications.yml:445` Machine learning techniques for flow-based network intrusion detection systems |
| `projects/archive/published/2018/masters-eeg-infotheory/project.yml:11` | An Information-Theoretical Approach to EEG Source-Reconstructed Connectivity | `publications.yml:425` An Information Theoretical Approach to EEG Source-Reconstructed Connectivity |
| `projects/archive/published/2021/volga-finger-trajectories/project.yml:11` | Reconstructing Single Finger Trajectories from Intracranial Brain Activity | `publications.yml:478` Reconstructing single finger trajectories from intracranial brain activity |
| `projects/coauthor/published/2016/chi-purpose-centric/project.yml:11` | Purpose-Centric Appropriation of Everyday Objects as Game Controllers | `publications.yml:497` Purpose-centric appropriation of everyday objects as game controllers. |
| `projects/coauthor/published/2023/modulation-lmp-bci/project.yml:10` | Modulation of LMPs Using the Gamma Band Increases the Stability of Finger Trajectories Decoded from ECoG | `publications.yml:472` Modulation of LMPs using the gamma band increases the stability of finger trajectories decoded from ECoG |
| `projects/coauthor/published/2024/highgamma-event-detection/project.yml:10` | High-Gamma Band Event Detection Improves Stability of Finger Trajectories Decoded from ECoG-LMP Activity | `publications.yml:460` High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity |

Options: (a) the hub patch sets each of the seven manifests' `title` to the website's text, so the website shows what it shows today and the hub's cards show the website's wording; (b) the seven differences are added to case 2, so the first write changes seven titles on the website to the manifests' wording. Recommendation: (a), since the website's title is the one published under the paper (a judgment; Axel's choice of wording would settle it). Lazy option: (b), which leaves the two wordings unreconciled.

### C. One section from a `kinds` row that names several (item 2)

Rule: the section is "the first row of `website.kinds` whose `stages` and `forms` hold the manifest's", with the catch-all kept, and "a published paper with no matching row goes to `journal` or `conference` by its form as today".

Result: the rule gives a list of sections where a row names several, and an entry needs one. The hub's rows (`.oculus/config.yml:42-51`) include `{ kind: [journal, other-publications], forms: [journal] }` (line 50) and the catch-all `{ kind: [abstracts, conference, journal, other-publications, posters, thesis] }` (line 51). The audit's `expectedSections` (`src/lib/server/content/audit/publications.ts:120-130`) returns that list, which is right for an expectation and gives no single section for a write. Two matched manifests reach the catch-all: `dongho-ecg-clustering` has no `form` (`grep -n "^form:" .../dongho-ecg-clustering/project.yml` prints nothing; on disk it is in `journal`), and `algebraic-effects-compilation` is `form: tech-report` (`project.yml:4`; on disk it is in `other-publications`). Every `journal`-form manifest reaches the `[journal, other-publications]` row. "By its form as today" has no today: no code places a paper in one section.

Options: (a) the hub patch rewrites the rows so each names one section (`{ kind: [journal], forms: [journal] }`, `{ kind: [other-publications], forms: [tech-report] }`), the generator takes a row's first `kind` as the section, and Dongho Chun's manifest gains `form: journal`; (b) the generator takes the first `kind` of the row as it stands, which puts `tech-report` in `abstracts`, the catch-all's first word, and Dongho Chun's paper in `abstracts` too. Recommendation: (a). Lazy option: (b).

### D. The industry profiles' location and duration (item 4, ruling 543 (3), case 1)

Rule: a profile names each job, degree, project and award by key "with its own wording, location and duration read from the record".

Result: nearly every profile row prints a location or duration that differs from the record it names, so `industry.yml` cannot come out equal. Examples:

- `industry.yml:76-78`: "University of Twente / Medisch Spectrum Twente", "Jan 2026 - Present"; the record `data.yml:46-47`: "January 2026 - Current".
- `industry.yml:83-84`: "UHasselt (Flanders AI Research Program)", "Jan 2024 - Jan 2026"; `data.yml:52-53`: "UHasselt", "January 2024 - January 2026 (Research Affiliate from 2026)".
- `industry.yml:95-96`: "KU Leuven", "2018 - 2024", one row over two records, `data.yml:83-85` (Sep. 2018 - May 2023) and `data.yml:59-61` (May 2023 - January 2024).
- `industry.yml:455-456`: "Idrogenet Srl (Gloreha), Italy", "2022 - 2023"; `data.yml:77-78`: "Lumezzane, Italy", "Dec. 2022 - Jan. 2023".
- `industry.yml:126-128`: Cardinal at `https://github.com/TheAxeC/Cardinal`, "2015 - Present"; `data.yml:386-387`: `.../cardinal-revamped`, "Jan. 2015 - Current".
- `industry.yml:142-145`: PhD "2018 - 2023"; `data.yml:282`: "Sep. 2018 - May 2023".
- `industry.yml:162-165`: award "Brussels", date `"2016"`; `data.yml:549-552`: "Brussels, Belgium", `2016-02-01 15:59:00-0400`.

Options: (a) a profile row names its record by key and carries its own `location`, `duration` (and `date`, `url`) where it prints them differently, the record's value used where the row has none; (b) the profiles print the records' values, and every difference above is added to case 2, which changes what the three employer CVs print. Recommendation: (a), since the profiles are tailored on purpose (a judgment). Lazy option: neither leaves work inside the step undone; (b) changes text sent to employers.

### E. Two different personal blocks for one person (item 4, `personal`)

Rule: the person facts (name, email, ORCID, links) live on the `self` entry of `people.yml`, and the generator writes `personal` back.

Result: `industry.yml:13-25` `shared.personal` has `email: axel.faes[at]gmail.com` and a `location` link "Netherlands | EU citizen (no visa required)", and no `googlescholar` or `orcid`; `data.yml:18-24` has `email: axel.faes[at]utwente.nl` and six links. One `self` entry gives one email.

Options: (a) `career.yml` `profiles` gains a shared block (the email and links the employer CVs print, by name), the `self` entry holding the academic ones; (b) the `self` entry holds both emails as two named links rows and the profiles pick by name. Recommendation: (a). Lazy option: none.

### F. Names the CV prints against the people entries it reuses (item 4, `references`, `students`)

Rule: "a reference already a person is that entry"; "a student already in `people.yml` reused with its role kept"; the generator prints the person's `name`.

Result: the entries' names differ from the CV's. `people.yml:62` "Liesbet Peeters" against `data.yml:32` "Liesbet M. Peeters"; `people.yml:116` "Dongho", `:128` "Matteo", `:133` "Mohsen", `:138` "Ward", `:148` "Do" against `data.yml:162,153,156,168,150` "Dongho Chun", "Matteo Ramina", "Mohsen Soleimanisemsani", "Ward Ceyssens", "Anh Phuong DO".

Options: (a) the hub patch gives each reused entry the full name the CV prints, so every card shows the full name; (b) the differences go into case 2 and the CV prints the short names. Recommendation: (a). Lazy option: (b).

### G. The teaching entry printed twice is two runs (item 4, `academic`)

Rule: "An entry the website prints twice ('Bioinformatics (3740) Coordinating lecturer') is one hub entry written twice by a field the generator reads."

Result: the two printings differ: `data.yml:107-109` "Sept. 2025 - Sept. 2026" and `data.yml:119-121` "Sept. 2024 - Sept. 2025", and they are not adjacent (rows 1 and 5 of `academic`). The hub has one entry, `education.yml:40-49` (`sub: "UHasselt | Sept 2025 - Sept 2026 (also 2024-2025)"`). A field that writes the entry twice must carry two durations and two places in the list.

Options: (a) the entry gains `runs:`, rows `{ duration, rank }`, one CV row per run; (b) two `education.yml` entries, one per academic year, as the other per-year entries (`msc-supervision-computer-science-2025-2026`) are. Recommendation: (b), since the file already keys teaching and supervision per year (a judgment). Lazy option: none.

### H. Smaller points the build would otherwise decide silently

- `grants` rows print `status: Submitted, decision pending` (`data.yml:328,335`); `funding.yml:28,61` hold `status: submitted`, a vocabulary word. Item 4 gives `funding.yml` `location`, `duration`, `about`, `url` (and `role`, `min`), with no field for the printed status text. Proposed: a field `cv_status` (text) on the funding entry.
- The section titles of `data.yml` ("Work & Research Experience", `data.yml:43`, and nine others) have no home in item 4. Proposed: `website.yml` gains `sections:`, a map of section key to title, in the website patch.
- `data.yml:18-24` `personal.links` hold handles, not addresses (`googlescholar: abRAHJEAAAAJ`, `linkedin: axelfaes`), so the rows `{ name, url }` of ruling 561 hold a handle in `url` for four of the six.
- Case 5 names "form `journal-article`"; the form word is `journal` (`config/catalogs/vocab.yml:81`).

## The cases' first run, on the unchanged tree

Commands run from the worktree root unless named otherwise.

1. No generator: `git grep -n "Generated by oculus" -- src tests` prints nothing. By reading, A to G above.
2. By reading: the differences listed in case 2 exist on disk (`publications.yml:339-341`, the FLLM 2025 `book` and `pub_post`; `publications.yml:11`, FLKit's `'(Under Review)'`; `publications.yml:400-406`, the `other-publications` entry with no `pub_date`). A, B, C, D, F and G give more.
3, 4, 7, 17, 18, 19: no generator. `git grep -n "code_availability" -- src` lists only the model, the snapshot normaliser and the deposit (`src/lib/data/model/model-entities.ts:193`, `src/lib/data/snapshot/normalise.ts:181,278`, `src/lib/server/git/deposit/deposit.ts:159,225,253,416,451-452`); no reader builds a `Code` link.
5. `grep -n "^  accepted:" config/catalogs/vocab.yml` prints only `112:  accepted:      { color: "#2563eb", closes_deadline: true }`, the `statuses` map; no stage `accepted`.
6. `git grep -n "programs" -- src` prints no reader of `website.yml`'s `programs:`.
8, 9, 10, 12, 13, 14: `ls src/lib/views/academic` prints `latex math-preview present slides`, no Career view; `git grep -n -i "write the website\|website\.cv\|website\.folder" -- src config ':!config/local.yml'` prints nothing.
11. The audit matches by title (`publications.ts:158-301`) and watches the one feed file: `audited.ts:94` `if (setting.website !== null) files.add(join(dir, setting.website.file));`.
15. `audit.website.file`, `.list`, `.title`, `.kinds` are hub keys (`src/lib/data/helpers/hub-names.ts:761-764`, `src/lib/data/shapes/hub-keys.ts:48-51`), so the hub's `audit.website` raises no unknown-key finding today, and `website:` is no hub key.
16. `grep -n "references\|positions" ~/workspace/research-hub/.oculus/data/academic/career.yml` prints nothing.
20. `people.yml:14`: `- { field: links, type: tags, help: "Web addresses of the person." }`.
21. `grep -n "group-strip\|scroller"` over `Usage.svelte` and `LineCounts.svelte`, and `git grep -n "group-strip" -- src`: `Usage.svelte:298` `<div class="scroller">` and `:391` `.scroller {` with no `--group-strip`; `LineCounts.svelte:166` `--group-strip: 0px;`; `src/lib/ui/display/table/Table.svelte:110` `top: var(--group-strip, 0);`. The defect is present.

## What happens next

The orchestrator rules on A to G (and the proposals of H) and resumes the builder with the rulings; the build of items 1 to 13 starts from them, and the final report carries the rulings.
