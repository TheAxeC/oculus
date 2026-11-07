O151 is stopped at the first run, before any change. One case is one the brief's own rules get wrong, and the brief says to hand that back. No deck, figure, CSS or Svelte file has been written, and the report file `.scratch/migration/agents/reviews/O151-report.md` does not exist yet. The only files I wrote are in my scratchpad: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/` holds `c5.mjs`, `c10.mjs`, `research.txt` (the 95 manifest paths), `c5-first.txt`, `c10-first.txt`, `c6-first.txt` and `c6-first-b.txt`.

## The case the brief's rules get wrong

**The rule.** Item 1 says: "A deck names no other project and no work of another project." The only exceptions are a coauthor deck's authorship line and the covert pair.

**The case.** C2 asks for `projects/archive/phd/phd-thesis` to get "a deck from the thesis and the manifest". The thesis is a compilation of other hub projects' papers.
- Its manifest's `related:` field is `[source-localization, block-term-tensor-regression, extended-bttr-note]`.
- Its `outcome:` reads: "A compilation thesis of four journal papers: Sparse eLORETA source localisation (J. Neural Eng. 2021) and neural-network directed connectivity (Applied Sciences 2022), then the block-term tensor-regression finger decoders BTTR (IEEE TNNLS 2022) and eBTTR (J. Neural Eng. 2022)."
- `thesis.tex:167-170` includes chapter-2 to chapter-5, which are those papers.

**What the rule gives.** Read as written, the rule bars the thesis deck from naming or describing BTTR, eBTTR, the source-localisation paper or the connectivity paper, which are the thesis's whole content. The deck would then break item 2's "no fact is dropped" and the "Decks are internal" ruling (every deck carries proper information).

**The same clash in other decks.** I listed every manifest whose own `title`, `eli5`, `outcome` or `short` names another hub project's method. The command grepped each manifest for e?BTTR, Go-BTTR, fBTTR, HCCNet(-FL), BT-FNO, MoBTE, BTTN, COVERT, RAW-PLS, LF-BTD and BTTD, and printed `related:`. Leaving out the decks that name only their own method, these hit:
- **The BTTR line:** block-term-tensor-regression, extended-bttr-note, fbttr-strategies, fermat, abduction and dries-bttr-ecg all name BTTR or eBTTR, which are the method of block-term-tensor-regression or extended-bttr-note.
- **HCCNet:** hccnet-fl, clinical-hccnet, hccnet-fl-sweden, hccnet-pathology, florank-personalization, physics-tensor-hcc and ssm-longitudinal all name HCCNet, the model of hccnet-revision.
- **BT-FNO:** bt-operator-theory names BT-FNO, the model of btfno. Its manuscript rests its claim on that companion: `bt-operator-theory/manuscript/main.tex:49` and `:75` say "The empirical companion \citep{faes_btfno_companion} reports the measurements; this paper is the proof", and `:642` restates the companion's measurements as corroboration.
- **Others:** faithful-block-term-layer names BTTN (bttn-incident-af's model), and jacobian-coupled-blockterm-dp names COVERT (covert-applied's method).

For these projects, the work of another project is the very thing the deck has to describe: the model it federates, applies, proves a theorem about or extends.

**Two readings for you to rule between.**
- Reading A, the strict one: no other project or its work is named. These decks then leave out what their own manuscript and manifest say they build on.
- Reading B: a deck names no other project as such: no cross-reference, no "see also", no comparison with a sibling paper. A method or model the project's own manuscript or manifest names as what it builds on, applies or compiles is named as its own sources state it. The covert pair still never name or describe each other.

My recommendation is B. It keeps every fact the project's own sources give, and still forbids what the rule appears to target, such as the current covert-applied deck's comparison with HCCNet-FL (`covert-applied/present/main.md:48`). A is the cheaper option: it lets these decks say less.

## The cases' first run (unchanged trees)

**C5.** I ran `node c5.mjs <hub worktree> research.txt` from the scratchpad. It cuts slides with oculus's own `splitSlides` from `src/lib/data/sources/deck/split.ts` and parses with the worktree's `yaml`.
- The last line of the output: "folders with present.yml: 25 of 95". The other 70 print "NO present.yml (no present/ folder)".
- Every one of the 25 decks has 1 slide.
- **First slide not `kind: project`:** fed-faithful-ecg and ecg-readable-substrate (kind text), and the 9 idea stubs (kind idea; desc only): btd-autoencoder, clinical-ai-eval-artifacts, ecg-af-fair, fl-privacy-auditing, florank-personalization, hccnet-fl-sweden, hccnet-pathology, quantum-tensor-fl and ssm-longitudinal.
- **`eli5` absent:** dongho-ecg-clustering, dries-bttr-ecg, hccnet-revision, meseret-cirrhosis and ward-bttr-crosssubject.
- **Shape faults:** btfno has "extra: not a project key", covert-applied has "extra: not a project key", and bttn-incident-af has "results: not a list of text".
- No value holds a control character.

**C6.** From the oculus worktree root I ran `OCULUS_TEST_HUB=<hub worktree> TMPDIR=<scratchpad> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"`.
- The first run printed "Tests 1 failed | 6 passed | 7 skipped (14)". The real-hub row "reads a deck out of every project that has a present/ folder, with no finding" hit "Error: Test timed out in 5000ms." at 6759 ms.
- The second run printed "Tests 7 passed | 7 skipped (14)", with that row at 3038 ms. `uptime` showed load averages of 15.95, 16.05 and 14.57 at the time.
- A risk I own: with 95 decks in place of 25, that row reads almost four times as many decks under the same 5000 ms limit. It may time out under load. The test file is outside my path list.

**C8, by reading.** Today the strip's values are `var(--slide-fs-small)` (`Facts.svelte:165`) and its labels are `0.72em` of that (`:158`, `:222`), at the frame's factor 1. That gives:

| Text size | Values today | Labels today | Values asked | Labels asked |
|---|---|---|---|---|
| 1 | 18 px | 12.96 px | 12 px | 10 px |
| rice | 17 px | 12.24 px | 11 px | 9 px |
| 1.5 | 27 px | 19.44 px | 18 px | 15 px |
| 0.7 | 12.6 px | 9.072 px | 8.4 px | 7 px |
| 1.6 | 28.8 px | 20.736 px | 19.2 px | 16 px |

The dot is `0.5em` of 18 px, so 9 px at text size 1, which is what C8 asks. The C8 values are not met today.

**C10.** I ran `node c10.mjs <hub worktree> research.txt`. The last line: "lines repeated across decks: 15". They are:
- "Measured" (tag.text, 8 decks) and "Validating" (tag.text, btfno and raw-pls).
- Spec labels: Cohort, Data, Eval and Model (3 decks each); Backbone, Input, Metric and Temporal (2 each).
- The same BT-FNO equation in bt-operator-theory and btfno.
- The body headings "## In plain words (ELI5)", "## Key results", "## The idea / method" and "## Why it matters / what's next", in both fed-faithful-ecg and ecg-readable-substrate.

**C1 to C4 and C7, noted (not traced).**
- **C1:** clinical-ai-eval-artifacts is one `kind: idea` slide with desc 'Meta-science: many federated and clinical-AI gains are evaluation artifacts; a corrected protocol'. It has no number.
- **C2:** phd-thesis has no `present/` folder. It has no README.md, `manuscript/thesis.tex` with 17 included files, and a manifest with `outcome:` and `publication.abstract:`.
- **C3:** ms-lipid-handshake has no deck (it holds code/, project.yml and README.md). algebraic-subtyping has no deck (it holds project.yml and todo.md; no README or manuscript). raw-pls is one project slide with 6 specs and 5 panels. Its results include "supervised novelty earned", and it names no dead target from its CLAUDE.md. I have not yet read the CLAUDE.md to list them.
- **C4:** running `grep -n -i covert` hits covert-theory's `main.md:7` ("sub: COVERT, the convergence + privacy-utility guarantee") and covert-applied's `main.md:7`, `:8`, `:43` and `:48`. Neither current deck describes the other paper by name, but covert-applied's `:48` compares with HCCNet-FL. For the new decks: `covert-theory/manuscript/main.tex` holds 0 lines naming covert, and `covert-applied/manuscript/main.tex` holds 50. So covert-applied's deck will name its own method COVERT, and covert-theory's deck will not use the name.
- **C7:** the current decks are not traced, as the brief says.
- **C9:** this is the orchestrator's measured fit.

## Two more findings for the ruling (neither stops the step on its own)

- **A second slide of `kind: equation` would turn C6 red.** In `tests/checks/config/integrity.test.ts`, `drawnEquations` (`:109-115`) counts an `equation`-kind slide's formula. `writtenEquations` (`:75-85`) counts only a front-matter `equation:`. So `expect(equations.length).toBe(written...)` at `:252` fails for such a slide. Item 2 allows an `equation` slide as the second slide. I would use `project` (with panels) or `columns` for any second slide and no `equation` kind.
- **The dot under the rice theme is a choice the brief leaves open.** C8 fixes the dot at 9 px at text size 1. I plan to set it as 0.75em of the strip's value size: 9 px at the design size, times the text scale. It then follows the rice 12/13 rule as every slide size does, which gives 8.25 px under rice (8.5 px today). The other way is a fixed calc(9px * text scale), which gives 9 px under rice. I will list whichever is used as a decision you can reverse.

## What resumes the step

A ruling on Reading A or Reading B for item 1's rule. With it I start the build: the facts strip, then the 95 decks one by one, writing each deck's part of the report as it is finished.
