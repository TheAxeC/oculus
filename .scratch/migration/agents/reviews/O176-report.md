Everything in the brief is done.

C10 (the measured fit and the look) is the orchestrator's by the brief and has not been run. No hub file was committed; 24 deck files are changed in the hub worktree.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:191-195` holds the heading, one sentence and no entry:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged trees

| Case | Command | Output |
| --- | --- | --- |
| C1 | `node c1c3.mjs <hub worktree>` | `decks: 93; figure lines: 0; two-slide decks: 13` |
| C2 | `grep -rl '^equation'` over the decks, `wc -l` | 13: covert-theory, bttd-source-eeg, raw-pls, btfno, hccnet-revision, bttn-incident-af, bt-operator-theory, meseret-cirrhosis, ward-bttr-crosssubject, fed-multicellular-immune, ms-lipid-handshake, jacobian-coupled-blockterm-dp, linfoot-estimator |
| C2 | `grep -rl --include=main.md 'figure:'` over `present/` | 0 |
| C2 | integrity test, `-t "deck\|equation\|portfolio"` | `Tests  7 passed \| 7 skipped (14)` |
| C3 | same program | `faults: 0` |
| C9 | `node c9.mjs <hub worktree>` | `lines repeated across decks: 36` |

C4 on the unchanged tree: hccnet-revision, meseret-cirrhosis, ward-bttr-crosssubject and raw-pls had a statement on slide 1 and a question on slide 2; bttd-source-eeg had a question on slide 1 and a statement on slide 2. C5: the three chips stood as the brief quotes them. C6: no fact named in item 5's list stood on a slide of its deck; each comes in on a `+` line of the `git diff`. C7: `mu_{\mathrm{band}}` stood in the second method line, the first result and the equation of bt-operator-theory, none labelled a corollary (the `-` lines of the `git diff`, quoted below). C8: the 59 decks stood as at hub commit 76cf0c5f9.

No case of the first run was one the brief's own rules get wrong.

## DONE / NOT DONE

All commands were run after the last change to a hub file. The two programs are quoted at the end of this section. `node` is v24.21.0 from `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`; `TMPDIR` and `GIT_CEILING_DIRECTORIES` were set to `.agents/scratch/` for every program but `npm run test:quick`.

| Item or case | State | Command | Output |
| --- | --- | --- | --- |
| Item 1, C1 | DONE | `node c1c3.mjs <hub worktree>` | 15 `C1` lines below, each `exists true`; `decks: 93; figure lines: 15; two-slide decks: 13` |
| Item 2, C2 | DONE | `grep -rl --include=main.md '^equation' projects \| wc -l` from the hub worktree | `13` |
| Item 2, C2 | DONE | `git diff -U0 \| grep -E '^[-+]equation'` | two lines, both bt-operator-theory, quoted in its entry below; no equation line moved |
| Item 2, C2 | DONE | `OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts -t "deck\|equation\|portfolio"` from the oculus worktree | `Test Files  1 passed (1)`; `Tests  7 passed \| 7 skipped (14)` |
| Item 3, C4 | DONE | read, titles printed by the `C3` lines | five titles quoted below |
| Item 4, C5 | DONE | read | three chips below, each with its source |
| Item 5, C6 | DONE | read, source lines printed with `sed -n` | section "Every fact brought back" |
| Item 6, C7 | DONE | `grep -n 'mu_{\\mathrm{band}}' projects/manuscripts/bt-operator-theory/present/main.md` | one hit, line 19, the corollary line, quoted below |
| Item 7, C11 | DONE | per-slide counts from the `C3` lines | section "Second slides" |
| Item 8, C8 | DONE | read; number locations by the two read-only searches quoted below | section "The 59 decks" |
| Item 9, C3 | DONE | `node c1c3.mjs <hub worktree>` | `faults: 0` |
| Item 9, C9 | DONE | `node c9.mjs <hub worktree>` | `lines repeated across decks: 36`, every one a short label, a status phrase, an author list, a venue string or a shared title; listed below |
| C10 | NOT DONE by this step | the orchestrator's measured fit | the builder starts no server, by the brief |
| Character set, report | DONE | the gate of `agents/spec.md` run over this report: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' .scratch/migration/agents/reviews/O176-report.md` | prints nothing |
| Character set, decks | DONE | from the hub worktree, the `find ... xargs ... grep -n '[^ -~]'` of the brief | four lines, each the place name Link<o-umlaut>ping: `ideas/modality-dropping-btf/present/main.md:10`, `ideas/hccnet-fl-sweden/present/main.md:4`, `:11`, `:19` |
| Paths written | DONE | `git status --short` from the hub worktree | 24 paths, all `M`, all `present/main.md` of decks of the path list; table below |
| Verify list | DONE | `npm run diagrams`, then `npm run test:quick` from the oculus worktree with `TMPDIR` unset | `test:quick: 39.2 s; every command passed`; `test:quick: 0 changed file(s), from git since HEAD` |

The verify list ran once. No whole-suite command ran. The step adds and changes no test. `git status --short` from the oculus worktree printed nothing after `npm run diagrams`, before this report was written.

### C1 output

```
C1 active/linfoot-estimator | slide 1 | engine_shapes.png | exists true
C1 active/sandpile-operator | slide 1 | rollout.png | exists true
C1 archive/published/2021/source-localization | slide 1 | sparsity-acc-spread_norm.png | exists true
C1 archive/published/2022/block-term-tensor-regression | slide 1 | image10.png | exists true
C1 archive/published/2022/extended-bttr-note | slide 1 | ebttr_fig.jpeg | exists true
C1 archive/published/2025/go-bttr | slide 1 | gobttr.jpeg | exists true
C1 archive/published/2026/dongho-ecg-clustering | slide 1 | dongho_silhouette.png | exists true
C1 manuscripts/bttn-incident-af | slide 1 | pipeline_overview.png | exists true
C1 manuscripts/clinical-hccnet | slide 1 | sequences_by_horizon.png | exists true
C1 manuscripts/dries-bttr-ecg | slide 1 | forest_auroc.png | exists true
C1 manuscripts/hccnet-revision | slide 1 | figure_outline.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 1 | fig_simulation.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 2 | meseret_landmark.png | exists true
C1 manuscripts/raw-pls | slide 1 | fig2_results.png | exists true
C1 manuscripts/ward-bttr-crosssubject | slide 1 | pipeline_flowchart.png | exists true
```

The 12 figures item 1 keeps off have no `figure:` line: the 15 lines above are all of them.

### C3 output for the five decks of item 3 and the totals

```
C3 manuscripts/hccnet-revision: slide 1 "Predicting liver cancer from a patient's whole series of surveillance MRI" / slide 2 "Where the pre-training gain comes from and what fusion shows"
C3 manuscripts/meseret-cirrhosis: slide 1 "What a cirrhosis benchmark loses when its outcome is scored as a class" / slide 2 "Where the static ceiling is and what updated measurements add"
C3 manuscripts/ward-bttr-crosssubject: slide 1 "Decoding finger movements in a new patient from other patients' implants" / slide 2 "Whether the alignment carries the transfer, and where it stops"
C3 manuscripts/raw-pls: slide 1 "RAW-PLS: tensor-PLS for tumours in a different place in every patient" / slide 2 "What holds against registration and what did not hold"
C3 manuscripts/bttd-source-eeg: slide 1 "Can one decomposition localize evoked EEG generators and their dynamics?" / slide 2 "How does the method handle correlated sources and real visual EEG, and where does it stop?"
decks: 93; figure lines: 15; two-slide decks: 13
faults: 0
```

The five `C3` lines above are reformatted from the program's output, the per-slide counts moved to the "Second slides" table. Of 93 `C3` lines 80 read `1 slide(s)` and 13 `2 slide(s)`.

### C9 output, classified

`lines repeated across decks: 36`. No hook, headline, method or result line is among them.

| Class | Lines, with the number of decks |
| --- | --- |
| Spec labels | Venue 54, Authors 43, Data 32, Stage 26, Code 10, Cohort 9, Outcome 4, Target 4, Baselines 3, Degree 3, Form 3, Benchmark 2, Cohorts 2, Compute 2, Corpora 2, Horizons 2, Setup 2, Supervision 2 |
| Tag text, a label | Measured 2 (ms-lipid-handshake, phd-thesis) |
| Status values | nascent, gate pending 8; de-risking 2; de-risking, gate pending 2; nascent, exploring 2; nascent, speculative 2; stopped 2 |
| Author lists | A. Faes, M. Amir Haeri 4; E. Calvo Merino, A. Faes, M.M. Van Hulle 3; A. Faes 2; A. Faes, M. Fahimi Hnazaee, M. Van Hulle 2; A. Faes, M.M.J. Guichelaar, ..., M. Amir Haeri 2 |
| Venue strings | Comput. Biol. Med., under review 2 (ecg-readable-substrate, meseret-cirrhosis); Medical Image Analysis or IEEE TMI 2 (hccnet-pathology, physics-tensor-hcc); ICFP 2017 Student Research Competition 2 (icfp-src-abstract, icfp-src-poster) |
| Shared titles, `sub` of two decks on one publication | Causal Graphical Modelling of Functional Connectivity from Reconstructed EEG Sources (abstract-bci-meeting-2021, connectivity-motor-imagery); High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity (modulation-lmp-bci, highgamma-event-detection); Towards a Core Language with Row-Based Effects for Optimised Compilation (icfp-src-abstract, icfp-src-poster) |

### Case-run programs, source

`.agents/scratch/c1c3.mjs`:

```js
// Case-run program for O176 cases C1 and C3. Prints deck, slide and figure for every `figure:` line
// with whether its file exists; and per deck the slide count, each slide's kind, title and any key
// in the wrong shape under docs/decks.md. Writes nothing.
// Usage: node c1c3.mjs <hub root>
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O176/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O176/src/lib/data/sources/deck/split.ts';

const hub = process.argv[2];
const SKIP = /novel-math-primitives|ecg-af-fair/;
const CLASSES = ['measured', 'design', 'proof', 'mixed'];
const FIGS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const TEXT = ['title', 'sub', 'hook', 'mechanism', 'headline', 'equation', 'notes'];
const KEYS = ['kind', 'notes', 'title', 'sub', 'hook', 'tag', 'eli5', 'equation', 'specs', 'panels', 'method', 'results', 'mechanism', 'headline'];
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

function decks(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (!statSync(path).isDirectory()) continue;
        if (name === 'present') {
            if (existsSync(join(path, 'main.md')) && !SKIP.test(path)) out.push(path);
        } else decks(path, out);
    }
    return out;
}

function faults(meta, folder) {
    const f = [];
    for (const [key, v] of Object.entries(meta)) {
        if (!KEYS.includes(key)) f.push(`${key}: not a project key`);
        if (TEXT.includes(key) && !isText(v)) f.push(`${key}: not text`);
        if (key === 'tag' && !(isMap(v) && CLASSES.includes(v.class) && isText(v.text))) f.push('tag: wrong shape');
        if (key === 'eli5' && !(isMap(v) && isText(v.purpose) && isText(v.plain))) f.push('eli5: wrong shape');
        if (key === 'specs' && !(Array.isArray(v) && v.length <= 4 && v.every((s) => isMap(s) && isText(s.label) && isText(s.value)))) f.push('specs: wrong shape or more than four');
        if ((key === 'method' || key === 'results') && !(Array.isArray(v) && v.length > 0 && v.length <= 4 && v.every(isText))) f.push(`${key}: not a list of one to four texts`);
        if (key === 'panels') {
            if (!Array.isArray(v) || v.length !== 1) f.push('panels: not one panel');
            else for (const p of v) {
                if (!isMap(p) || !isText(p.figure) || !isText(p.caption) || !isText(p.explain)) f.push('panel: wrong shape');
                else {
                    if (!FIGS.includes(extname(p.figure).toLowerCase())) f.push('panel: not an image');
                    if (!existsSync(join(folder, p.figure))) f.push('panel: file missing');
                }
            }
        }
    }
    return f;
}

const all = decks(join(hub, 'projects')).sort();
let figures = 0;
const c3 = [];
const bad = [];
for (const folder of all) {
    const name = folder.slice(join(hub, 'projects').length + 1, -'/present'.length);
    const cut = splitSlides(readFileSync(join(folder, 'main.md'), 'utf8'));
    if (cut.unreadable) bad.push(`${name}: front matter does not parse`);
    const yml = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    if (!isText(yml?.deck?.title) || !Array.isArray(yml?.order)) bad.push(`${name}: present.yml shape`);
    const parts = [];
    cut.slides.forEach((slide, i) => {
        const meta = slide.meta ?? {};
        if (Array.isArray(meta.panels)) for (const p of meta.panels) {
            figures += 1;
            console.log(`C1 ${name} | slide ${i + 1} | ${p.figure} | exists ${existsSync(join(folder, p.figure))}`);
        }
        if (meta.kind !== 'project') bad.push(`${name}: slide ${i + 1} kind ${meta.kind}`);
        if (!isText(meta.title)) bad.push(`${name}: slide ${i + 1} untitled`);
        for (const x of faults(meta, folder)) bad.push(`${name}: slide ${i + 1} ${x}`);
        const n = (k) => (Array.isArray(meta[k]) ? meta[k].length : 0);
        parts.push(`${i + 1}:${meta.kind}${meta.equation ? '+eq' : ''}${meta.panels ? '+fig' : ''} specs ${n('specs')} method ${n('method')} results ${n('results')}: ${meta.title}`);
    });
    if (cut.slides.length < 1 || cut.slides.length > 2) bad.push(`${name}: ${cut.slides.length} slides`);
    c3.push(`C3 ${name}: ${cut.slides.length} slide(s): ${parts.join(' || ')}`);
}
for (const l of c3) console.log(l);
console.log(`decks: ${all.length}; figure lines: ${figures}; two-slide decks: ${c3.filter((l) => /: 2 slide/.test(l)).length}`);
console.log(`faults: ${bad.length}`);
for (const l of bad) console.log(`FAULT ${l}`);
```

`.agents/scratch/c9.mjs`:

```js
// Case-run program for O176 case C9. Prints every slide-text line found in more than one of the 93
// decks, with the decks and keys that hold it. A slide-text line is a text value of a slide's front
// matter (every key but kind, tag.class and a panel's figure, a list's items and a map's values
// each a line of their own) and each non-blank line of a slide's body. Writes nothing.
// Usage: node c9.mjs <hub root>
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O176/node_modules/yaml/dist/index.js';
import { splitSlides } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O176/src/lib/data/sources/deck/split.ts';

const hub = process.argv[2];
const SKIP = /novel-math-primitives|ecg-af-fair/;
const seen = new Map();

function decks(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (!statSync(path).isDirectory()) continue;
        if (name === 'present') {
            if (existsSync(join(path, 'main.md')) && !SKIP.test(path)) out.push(path);
        } else decks(path, out);
    }
    return out;
}

function add(line, where, project) {
    const text = line.trim();
    if (text === '') return;
    if (!seen.has(text)) seen.set(text, new Map());
    seen.get(text).set(project, where);
}

function leaves(value, path, project) {
    if (typeof value === 'string') add(value, path, project);
    else if (typeof value === 'number') add(String(value), path, project);
    else if (Array.isArray(value)) value.forEach((v) => leaves(v, path, project));
    else if (value && typeof value === 'object')
        for (const [k, v] of Object.entries(value)) {
            if (k === 'kind' || (path === 'tag' && k === 'class') || k === 'figure') continue;
            leaves(v, path ? `${path}.${k}` : k, project);
        }
}

for (const folder of decks(join(hub, 'projects'))) {
    const project = folder.slice(join(hub, 'projects').length + 1, -'/present'.length);
    const yml = parse(readFileSync(join(folder, 'present.yml'), 'utf8'));
    add(String(yml?.deck?.title ?? ''), 'deck.title', project);
    for (const slide of splitSlides(readFileSync(join(folder, 'main.md'), 'utf8')).slides) {
        leaves(slide.meta ?? {}, '', project);
        for (const line of slide.body.split('\n')) add(line, 'body', project);
    }
}

let repeated = 0;
for (const [text, where] of [...seen].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))) {
    if (where.size < 2) continue;
    repeated += 1;
    console.log(`${JSON.stringify(text)} in ${where.size} decks: ${[...where].map(([p, k]) => `${p} (${k})`).join('; ')}`);
}
console.log(`lines repeated across decks: ${repeated}`);
```

### File table, from `git status --short` and `git diff --numstat` in the hub worktree

Every path is `projects/<deck>/present/main.md`. No `present.yml` changed.

| Deck | Added | Removed |
| --- | --- | --- |
| active/linfoot-estimator | 2 | 0 |
| active/sandpile-operator | 2 | 0 |
| archive/published/2016/bachelor-network-ids | 1 | 1 |
| archive/published/2021/source-localization | 2 | 0 |
| archive/published/2022/block-term-tensor-regression | 2 | 0 |
| archive/published/2022/extended-bttr-note | 2 | 0 |
| archive/published/2025/go-bttr | 2 | 0 |
| archive/published/2026/dongho-ecg-clustering | 2 | 0 |
| archive/published/2026/hcc-modality-poster | 1 | 1 |
| ideas/faithful-interpretability-position | 1 | 1 |
| ideas/florank-personalization | 1 | 1 |
| ideas/physics-tensor-hcc | 2 | 2 |
| manuscripts/bt-operator-theory | 13 | 11 |
| manuscripts/bttd-source-eeg | 4 | 2 |
| manuscripts/bttn-incident-af | 3 | 1 |
| manuscripts/clinical-hccnet | 4 | 2 |
| manuscripts/covert-theory | 1 | 1 |
| manuscripts/dries-bttr-ecg | 4 | 0 |
| manuscripts/ecg-readable-substrate | 1 | 1 |
| manuscripts/fed-multicellular-immune | 2 | 1 |
| manuscripts/hccnet-revision | 3 | 1 |
| manuscripts/meseret-cirrhosis | 5 | 1 |
| manuscripts/raw-pls | 5 | 3 |
| manuscripts/ward-bttr-crosssubject | 5 | 2 |

Totals: 70 added, 32 removed, 24 files. Every panel adds two lines, `panels:` and the panel.

## Per deck, every changed line before and after, with its source

Paths are relative to the deck's project folder in the hub worktree. "Before: none" is a line added. For a panel the snapshot line is the before, and "same as the snapshot" means the panel line is byte-equal to the snapshot deck's, by a comparison of `grep -h "figure: <name>"` over the two trees.

### active/linfoot-estimator (slide 1, item 1)

- After: `{ figure: engine_shapes.png, caption: 'The preprint''s two families and 18 draws from the label engine', explain: 'Every engine label is exact; 12 of the 18 draws fall rather than rise, and 8 carry a label of at least 0.4 while a rank correlation reads under 0.25.' }`
- Correction against the snapshot: "8 carry a label above 0.4" became "of at least 0.4". The image prints each draw's label and rank r: of the 18 draws, 12 have a negative rank r, and the draws with |rank r| under 0.25 and L at least 0.400 are 8, of which 2 carry L = 0.400 and 6 carry more.
- Source: `README.md:71`; caption `manuscript/archive/2026-11-article/main.tex:262-263`; the image.

### active/sandpile-operator (item 1)

- After, same as the snapshot: `{ figure: rollout.png, caption: 'Held-out synthetic medium: arrival step and final mass error', explain: 'Arrival-time maps on top, final mass error below: all models reach a broadly similar region, while diffusion smears the mass magnitude.' }`
- Source: `code/README.md:16` and `README.md:27`.

### archive/published/2016/bachelor-network-ids (item 8)

- Before: `'Naive Bayes barely beats the random binary F of 0.465 across datasets; within CTU-13 the RBF SVM reaches F 0.046, the neural network 0.'`
- After: `'Naive Bayes barely beats the random binary F of 0.465 across datasets; within CTU-13 the RBF SVM reaches F 0.0455, the neural network 0.'`
- Source: Table 11.15, `txt:3495` of the PDF text (`pdftotext -layout manuscript/main.pdf`): Binary F-score, Standard feature set, 0.0455.

### archive/published/2021/source-localization (item 1)

- After: `{ figure: sparsity-acc-spread_norm.png, caption: 'Average correlation and complement of normalized spread against $\kappa$', explain: 'Both normalized to eLORETA''s outcome; the Pareto-optimal solution is at the intersection, $\kappa \approx 0.08$.' }`
- Correction against the snapshot: "where neither metric improves without the other worsening" is off, the caption does not say it, and "Both normalized to eLORETA's outcome" is added from the caption.
- Source: `manuscript/main.tex:178-179`.

### archive/published/2022/block-term-tensor-regression (item 1)

- After: `{ figure: image10.png, caption: 'Predicted ring-finger flexion of subject 1 against the data glove', explain: 'Actual and predicted flexion amplitudes (z-scores) over time for gBTTR and HOPLS; of the BTTR versions only gBTTR is shown.' }`
- Correction against the snapshot: "for gBTTR and HOPLS" added, "the generalized" dropped from the explanation.
- Source: `manuscript/bare_jrnl.tex:820` (gBTTR and HOPLS), `:823-824` (caption).

### archive/published/2022/extended-bttr-note (item 1)

- After, same as the snapshot: `{ figure: ebttr_fig.jpeg, caption: 'eBTTR: each block pairs a core and loadings for the ECoG tensor with a finger loading for $\mathbf{Y}$', explain: 'The tensor and the finger matrix are both rebuilt as a sum of $K$ blocks plus residuals $\mathbf{E}$ and $\mathbf{F}$.' }`
- Source: `manuscript/main.tex:102-103` (caption), `:141-145` (the two sums).

### archive/published/2025/go-bttr (item 1)

- After, same as the snapshot: `{ figure: gobttr.jpeg, caption: 'Go-BTTR: each iteration runs CGP on the five finger trajectories, then one block per finger group', explain: 'In iteration 1 fingers 1 and 2 are linked and share an eBTTR block; in iteration 2 no link remains and every finger gets a BTTR block.' }`
- Source: `manuscript/main.tex:122`, caption `:130-131`, and the image.

### archive/published/2026/dongho-ecg-clustering (item 1)

- After: `{ figure: dongho_silhouette.png, caption: 'Silhouette against ARI per clustering solution; marker size is the largest-cluster fraction', explain: 'Raw flattening with Ward scores silhouette 0.81 at ARI 0.000, one cluster holding all but a handful of records; the hand-crafted features score 0.28 at ARI 0.711.' }`
- Correction against the snapshot: "for every clustering solution" became "per clustering solution", "one cluster holding the cohort" became "one cluster holding all but a handful of records".
- Source: `manuscript/main.tex:550-555`, caption from `:563`.

### archive/published/2026/hcc-modality-poster (item 5)

- Before: `{ label: 'Data', value: 'Medisch Spectrum Twente, about 240 patients, 15.4% HCC-positive' }`
- After: `{ label: 'Data', value: 'Medisch Spectrum Twente, about 240 patients, about 37 HCC-positive (15.4%)' }`
- Source: the poster's text (`pdftotext -layout`), lines 140-144 ("~37", "HCC-POSITIVE", "15.4%") and 187 ("~240").

### ideas/faithful-interpretability-position (item 8, item 9)

- Before: `'Existing reviews (JMSS 2024, a 2025 biomedical-signal review) are method catalogues, which this must differ from.'`
- After: `'Existing reviews (JMSS 2024, a 2025 biomedical-signal review) catalogue methods; this paper takes a methodological position.'`
- Source: `README.md:20`. The before line faulted other papers; the after line states what the source states.

### ideas/florank-personalization (item 8)

- Before: `'Wins: A beats FedAVG-HCCNet on the worst silos at matched communication; B beats the matrix adapter at matched parameters.'`
- After: `'A positive would be: A beats FedAVG-HCCNet on the worst silos at matched communication; B beats the matrix adapter at matched parameters.'`
- Source: `README.md:21`, "What would make it a real positive". "Wins:" read as a measured outcome; nothing has run.

### ideas/physics-tensor-hcc (item 8, item 9)

- Before: `hook: 'HCCNet''s ablation: naive fusion adds little; four DWI b-values are one decay curve treated as four channels.'`
- After: `hook: 'Four DWI b-values sample one physical decay curve; fitting the curve first leaves a few contrasts for a block-term model.'`
- Source: `README.md:7` (the b-values and the physical curve) and `:15` (the fit, then the block-term decomposition). The before line stated a fault of a paper and named another project's result.
- Before: `'Beating HCCNet''s naive fusion is the low bar; the gate is beating the best single modality decisively.'`
- After: `'Beating naive fusion is the low bar; the gate is beating the best single modality decisively.'`
- Source: `README.md:21`.

### manuscripts/bt-operator-theory (items 2, 4, 6)

Slide 1:

- Before: `hook: 'Both formats reach the same operators; CP fits a frequency profile per rank-one term, a band target needs one per band.'`
- After: `hook: 'Both formats reach the same operators; CP fits a frequency profile per rank-one term, the block-term format one per block.'`
- Source: `README.md:83` correction 1 (free-profile class, $RK$).
- Before: `'By Parseval the risk reduces to counting free frequency directions: $RLK$ for CP, $\mu_{\mathrm{band}}K$ for block-term.'`
- After: `'By Parseval the risk reduces to counting free frequency directions: $RLK$ for CP, $RK$ for block-term with free profiles.'`
- Source: `README.md:83` correction 1.
- Before: `'Separation $\Theta((RL-\mu_{\mathrm{band}})K\sigma^2/n)$; the risk ratio tends to $RL/\mu_{\mathrm{band}}$; the gap is positive under any band overlap exactly when $L>1$.'`
- After: `'Free-profile class: $RK$ frequency parameters, separation $\Theta(R(L-1)K\sigma^2/n)$, risk ratio tending to $L$, positive for $L>1$, $R=1$ included.'`
- After: `'Corollary for a band-constrained estimator with the band supports imposed: $\mu_{\mathrm{band}}K$ frequency parameters, ratio $RL/\mu_{\mathrm{band}}$.'`
- Source: `README.md:83` corrections 1 and 4 ($R(L-1)K>0$ at $R=1$, $L>1$).
- Before: `'Ordering block-term $\le$ Tucker/TT $\le$ CP, with measured ratios 2.93 and 5.43 against theory 3 and 6.'`
- After: `'Ordering: with free profiles block-term, Tucker and TT tie at $RK$ in frequency, so strictness comes from the channel term.'`
- After: `'Jacobian ranks at $K=12,C=6,R=2,L=2$: block-term 62, Tucker 68, TT 76, CP 84 at a block-term target and 88 at a generic point.'`
- Source: `README.md:83` correction 2.
- Before: `'Proportional regime: the ratio diverges near CP''s threshold $n = RLK$, and block-term avoids CP''s double-descent peak.'` Removed. Correction 1 says the proportional-regime result inherits the change; the slide 2 line below says so.
- Before: `mechanism: 'Shared band profiles remove the frequency directions CP fits to noise'`
- After: `mechanism: 'One frequency profile per block removes the frequency directions CP fits to noise'`
- Before: `headline: 'On disjoint-band targets CP''s excess risk exceeds block-term''s by a factor tending to $RL$'`
- After: `headline: 'CP''s excess risk exceeds the free-profile block-term''s by a factor tending to $L$'`
- Source of both: `README.md:83` correction 1.

Slide 2:

- Before: `{ label: 'Code', value: 'four synthetic scripts' }`
- After: `{ label: 'Checks', value: 'four scripts: separation, format ordering, proportional regime, depth' }`
- Source: `CLAUDE.md` of the project, "What this is" (the four scripts `synthetic_separation.py`, `four_format_ordering.py`, `proportional_regime.py`, `depth_amplification.py`). The label differs from slide 1's chip `Code`, which is the repository.
- Before: `'Depth: the dimension gap is exactly $92D$ through $D=4$.'` Removed. After: `'Depth, proportional-regime and selection results inherit the free-profile form of Theorem 1.'` Source: `README.md:83` correction 1, last sentence.
- Before: `'An oracle reaches the rate within CP, so no minimax separation; the companion PDEBench study: a 33% smaller gap at five families, a tie on one.'`
- After: `'Knowing the band supports gives CP $LK$; reaching the block-term rate needs the block membership of the CP terms.'` Source: `README.md:83` correction 3.
- After: `'Companion PDEBench study: a 33% smaller gap at five families, a tie on one; its $L=1$ ablation leaves a residual.'` Source: `manuscript/main.tex:652` (33%), `:654` (tie); the residual is `README.md:83` correction 5.
- Before: `equation: '\mathrm{Risk}(\mathrm{CP}) - \mathrm{Risk}(\mathrm{BT}) = \Theta\Big(\frac{(RL-\mu_{\mathrm{band}})K}{n}\,\sigma^2\Big) \ge \Theta\Big(\frac{R(L-1)K}{n}\,\sigma^2\Big) > 0'`
- After: `equation: '\mathrm{Risk}(\mathrm{CP}) - \mathrm{Risk}(\mathrm{BT}) = \Theta\Big(\frac{R(L-1)K}{n}\,\sigma^2\Big) > 0'`
- Source: `README.md:83` correction 4, term $R(L-1)K>0$; the $\Theta$ form is the second term of the deck's own earlier equation. No form is the builder's derivation.

C7, quoted: `grep -n 'mu_{\\mathrm{band}}' projects/manuscripts/bt-operator-theory/present/main.md` prints one line:

```
19:  - 'Corollary for a band-constrained estimator with the band supports imposed: $\mu_{\mathrm{band}}K$ frequency parameters, ratio $RL/\mu_{\mathrm{band}}$.'
```

By reading: the free-profile result on line 18 is ratio $L$. $RL$ appears elsewhere only as `CP-rank-$RL$` (line 15), as $RLK$ for CP (line 16) and in the corollary's $RL/\mu_{\mathrm{band}}$ (line 19). The `headline`, `mechanism`, equation and the `Depth` and `Proportional regime` lines are as quoted above and say what `README.md:83` asks. The line `'L-gating at full overlap: ratio [1.0, 1.99, 2.79, 4.34] against theory [1, 2, 3, 4].'` stands (`manuscript/main.tex:608`, full band overlap $\mu_{\mathrm{band}}=R$, where $RL/\mu_{\mathrm{band}}$ is $L$).

### manuscripts/bttd-source-eeg (items 3, 5)

- Before: `title: 'Correlated sources, real visual EEG, and where the method stops'`
- After: `title: 'How does the method handle correlated sources and real visual EEG, and where does it stop?'`
- Before: `... Champagne is sharper (about 0.1 mm).'`; after: `... Champagne is sharper under its matched sparse prior (about 0.1 mm).'` Source: `manuscript/main.tex:374-378`.
- Before: none; after: `'The linear inverses and Champagne are also correlation-robust.'` Source: `manuscript/main.tex:329-331`.
- Before: none; after: `'Deep sources degrade for all methods.'` Source: `manuscript/main.tex:405`.

### manuscripts/bttn-incident-af (items 1, 4)

- After: `{ figure: pipeline_overview.png, caption: 'The BTTN pipeline', explain: 'ECG, spectrogram tensor, block factors $A_k$ and $C_k$, temporal convolution and attention; the clinical term is added after the block layer, and a Cox head reads a relative hazard at any horizon.' }`
- Correction against the snapshot: "and a Cox loss gives risk at 1, 2 and 5 years" became "and a Cox head reads a relative hazard at any horizon". Source: `manuscript/main.tex:85`, `:90`.
- Before: `{ label: 'AUROC', value: 'block-term, full-rank 0.729, CP 0.728' }`
- After: `{ label: 'Interpretable-layer swap, AUROC', value: 'block-term, full-rank 0.729, CP 0.728' }`
- Source: `manuscript/main.tex:307` (the ablation swaps only the first interpretable layer), `:317-319` (0.729, 0.728, 0.729).

### manuscripts/clinical-hccnet (items 1, 5)

- After, same as the snapshot: `{ figure: sequences_by_horizon.png, caption: 'AUROC per MRI sequence by horizon', explain: 'DW-MRI reaches 0.922, 0.855 and 0.813, and T1 in- and out-of-phase MRI 0.936, 0.852 and 0.741, at 1, 2 and 3 years.' }`
- Source: caption `manuscript/main.tex:305-306`; values `:284-286` and `:292-294` (Table `tab:horizon`). The manuscript includes `sequences_by_horizon.pdf`; the deck's file is `present/sequences_by_horizon.png`.
- Before: `'In the 58 held-out patients: 0.899 at 1 year (4 HCC), 0.881 at 2 years (3 HCC), 0.929 at 3 years (1 HCC).'`
- After: `'In the 58 held-out patients (each sequence''s encoder size was chosen on them): 0.899 at 1 year (4 HCC), 0.881 at 2 years (3 HCC), 0.929 at 3 years (1 HCC).'`
- Source: `manuscript/main.tex:142`.
- Before: `'Whole-cohort values include development patients; one centre, mostly MASLD and ALD, 10 HCC at 3 years in the whole cohort, 1 held out.'`
- After: `'Whole-cohort values include development patients; one centre, ethnically homogeneous, mostly MASLD and ALD, 10 HCC at 3 years in the whole cohort, 1 held out.'`
- Source: `manuscript/main.tex:322`.

### manuscripts/covert-theory (item 5)

- Before: `'Not claimed: tightness in $m$, a block-term-specific separation.'`
- After: `'Not claimed: a rate to the floor, tightness in $m$, a block-term-specific separation, private recovery of the factors (dimension-dependent).'`
- Source: `manuscript/main.tex:687-690` (rate to the floor), `:139` (private recovery).

### manuscripts/dries-bttr-ecg (items 1, 5)

- After, same as the snapshot: `{ figure: forest_auroc.png, caption: 'AUROC on the seed-0 draw with 95% CIs', explain: 'Every method on both cohorts; this draw is the best of the ten for BTTR on AFIB, so the ten-draw means are the primary summary.' }`
- Source: `manuscript/main.tex:150-151`, `:122`; `README.md:22`.
- Before: none; after: `'Age alone scores 0.500 under the matched controls and about 0.75 with unmatched ones.'` Source: `manuscript/main.tex:135`, `:155`; `README.md:41`.
- Before: none; after: `'The CNN stays near chance aligned and unaligned, so no alignment conclusion for the CNN.'` Source: `manuscript/main.tex:216`; `README.md:25`.

### manuscripts/ecg-readable-substrate (item 5)

- Before: `'One endpoint, frozen embeddings only, ten-second HRV. Dead ends: a sparse-dictionary substrate, federated transport, a residual as a leakage signature.'`
- After: `'One endpoint, frozen embeddings only, ten-second HRV, NeuroKit delineation a possible confounder. Dead ends: a sparse-dictionary substrate, federated transport, a residual as a leakage signature.'`
- Source: `manuscript/main.tex:262`.

### manuscripts/fed-multicellular-immune (item 5)

- Before: `{ label: 'Liver PSC/PBC, 16 donors', value: 'CV AUC 0.975, $p=0.005$' }`
- After: `{ label: 'Liver PSC/PBC, 16 donors', value: 'CV AUC 0.975, $p=0.005$; 6 controls, no replication' }`
- Source: `manuscript/main.tex:438-442`.
- Before: none; after: `'Comparable or below elsewhere, gap to the best single cell type: SLE +0.013, COVID -0.064, Crohn''s +0.008, kidney +0.024, heart -0.015.'`
- Source: `manuscript/main.tex:447-450`; `README.md:30`.

### manuscripts/hccnet-revision (items 1, 3)

- After, same as the snapshot: `{ figure: figure_outline.png, caption: 'The HCCNet modelling approach for one patient.', explain: 'Each raw MRI passes through the **CNN backbone**; time-based positional encodings are added to the embeddings, the **Transformer encoder** reads them, and the last hidden state of the **[cls] token** gives the prediction.' }`
- Source: `manuscript/figures/architecture.tex:3` (caption), `:10` (the note); `manuscript/sections/3_methodology/b_architecture.tex:21` (the elapsed time replaces the sequence position, which is the "time-based" of the explanation).
- Before: `title: 'Where does the pre-training gain come from, and what does fusion show?'`
- After: `title: 'Where the pre-training gain comes from and what fusion shows'`

### manuscripts/meseret-cirrhosis (items 1, 3)

- After, same as the snapshot, slide 1: `{ figure: fig_simulation.png, caption: 'Recovery of the true transplant risk in the simulation.', explain: 'Left: **Spearman correlation** between each approach''s transplant risk and the true 5-year cumulative incidence; right: **Harrell''s C** against the truth. Means and 2.5 to 97.5 percentiles over 200 replicates per training size, on a fixed test set of 5000.' }`
- Source: `manuscript/main.tex:299-300`.
- After, same as the snapshot, slide 2: `{ figure: meseret_landmark.png, caption: 'Landmark analysis on the serial cohort.', explain: 'Three-year death-risk discrimination at each landmark: the **baseline measurement** decays as it ages, the **most recent measurement** restores it, and the advantage widens with follow-up.' }`
- Source: `manuscript/main.tex:326-327`. The manuscript's `manuscript/figures/fig_landmark.png` and the deck's `present/meseret_landmark.png` are byte-identical (`cmp` prints nothing and exits 0).
- Before: `title: 'Where is the static ceiling, and what do updated measurements add?'`
- After: `title: 'Where the static ceiling is and what updated measurements add'`

### manuscripts/raw-pls (items 1, 3, 4, 5)

- After, same as the snapshot: `{ figure: fig2_results.png, caption: 'Synthetic warp, both BraTS targets, and the ablation', explain: 'Under warp only RAW-PLS stays flat near 0.67; it is the only positive method on the structural target and the best on grade.' }`
- Source: the image's panels A to D, `manuscript/main.tex:445` (0.67), `:475-480` (only positive method, best on grade).
- Before: `title: 'What holds against registration, and what did not hold?'`
- After: `title: 'What holds against registration and what did not hold'`
- Before: `{ label: 'Real warps', value: '120 lesions, 3% at $\eta$ = 0.427' }`
- After: `{ label: 'Real warps', value: '120 lesions: representation moves 3% at $\eta$ = 0.427' }`
- Source: `manuscript/main.tex:625-630`.
- Before: `'Radiomics margins, affine and SyN: structural +0.030, +0.053; grade +0.039, +0.012; all p < 0.05.'`
- After: `'Radiomics margins, affine and SyN: structural +0.030, +0.053; grade +0.039, +0.012; all p < 0.05; most of the whole-brain grid''s deficit was rasterization dilution.'`
- Source: `manuscript/main.tex:541-542`.

### manuscripts/ward-bttr-crosssubject (items 1, 3, 5)

- After, same as the snapshot: `{ figure: pipeline_flowchart.png, caption: 'The pipeline from raw recordings to predicted trajectories.', explain: 'Grids enter as **24-band envelope features**; a private **behavior-aligned filter** projects each grid onto the shared finger-motor space; one **shared TCN decoder** outputs the trajectories. Target labels estimate the target filter in both regimes and update the decoder only under minimal calibration.' }`
- Source: `manuscript/body.tex:266-275`.
- Before: `title: 'Does the alignment carry the transfer, and where does it stop?'`
- After: `title: 'Whether the alignment carries the transfer, and where it stops'`
- Before: `'Dead ends: block-term decoders underfit across patients; AJILE12 decodes near zero; on scalp EEG the alignment adds nothing.'`
- After: `'Dead ends: block-term decoders underfit across patients (ridge 0.354 against BTTR 0.156 on identical features); on scalp EEG the alignment adds nothing.'` Source: `README.md:37`.
- After: `'AJILE12 decodes near zero: only 6 of 12 subjects have a reach-locked high-gamma response.'` Source: `manuscript/body.tex:947`; `README.md:46`.

### C5, the three chips

| Chip | What it now says | Source |
| --- | --- | --- |
| bt-operator-theory, slide 2, `Checks` | what the four scripts check | the project's `CLAUDE.md`, "What this is", the four script names |
| raw-pls, slide 2, `Real warps` | that the representation moves 3% | `manuscript/main.tex:625-630` |
| bttn-incident-af, slide 2, `Interpretable-layer swap, AUROC` | what the AUROC is of | `manuscript/main.tex:307`, `:317-319` |

## The 59 decks (C8)

Each deck's `present/main.md` was read line by line against the sources named here. Four of the 59 changed by item 8 and one by item 1 only; their lines are above. The other decks read "no change".

Sources: `README.md`, `project.yml` and `manuscript/main.tex` of the deck, and where the project holds a PDF, its text by `pdftotext -layout`, cited below as `txt`. Those extractions are in `.agents/scratch/txt/`, which is removed before hand-back; `pdftotext -layout <the project's PDF> -` reproduces them (`diff -q` against the extraction of bachelor-network-ids printed no difference). erp-signatures' `txt` is `textutil -convert txt -stdout manuscript/main_revised.docx`.

The location of each number was taken with two read-only searches of the shell, written out here; they print and change nothing, and no file of them is part of the step. The first gives each number of two characters or more its first occurrence in the sources; the second gives a one-digit number with the word after it, written as a digit or a word. The reading matched each number's meaning on the slide; a first occurrence that is a different use of the same digits is a location of the digits only.

```sh
# first search, per deck, $d the project folder and $src its sources; zsh
for n in $(grep -v -E '^(kind|tag):' $d/present/main.md | grep -oE '[0-9]+([.,][0-9]+)*' | sed -E 's/[.,]+$//' | sort -u); do
  [ ${#n} -lt 2 ] && continue
  e=$(printf '%s' "$n" | sed 's/[.]/\\./g')
  grep -n -E -m1 -H "(^|[^0-9.,])$e([^0-9.,]|[.,][^0-9]|$)" ${=src} | head -1 | cut -d: -f1,2
done
# second search, one-digit numbers with the following word; W is zero to nine as words
grep -v -E '^(kind|tag):' $d/present/main.md | grep -oE "(^|[ '(])[1-9] [a-zA-Z-]+" | sed -E "s/^[ '(]//" | sort -u | while read -r t; do
  num=${t%% *}; word=${t#* }; w=${W[$((num+1))]}; stem=${word%s}
  grep -n -i -E -m1 -H "(^|[^0-9.])($num|$w)[ -]+($word|$stem)" ${=src} | head -1 | cut -d: -f1,2
done
```

Per deck, `number=place`. R is `README.md`, Y is `project.yml`, M is `manuscript/main.tex`, T is the deck's `txt`. A number the searches did not find is given the line that the reading traced it to, with the form the source prints.

| Deck | What was read and the changes | Number locations |
| --- | --- | --- |
| active/eeg-saad-challenge | R, Y. No change. | 08=R:69 09=R:69 1000=R:13 11=R:69 12=R:45 2.0=R:31 2.1=R:31 2026=R:69 2027=R:3 255=R:31 60=R:23 64=R:23 70=R:31; 2 test=R:21 |
| archive/failed/faithful-block-term-layer | R (`:17-23`, `:29-32`), Y. No change. | no number of two characters |
| archive/published/2016/bachelor-network-ids | T, Y. One line changed, above. | 0.0155=T:3257 0.0455=T:3495 10=T:93 13=T:165 2016=T:27; 0.465 is 0.4653 T:2926; 0.763 is 0.7633 T:3144; 0.915 is 0.9151 T:3111; 0.950 is 0.9500 T:2996; 0.963 is 0.9631 T:3031; 0.986 is 0.9857 T:2996; 0.992 is 0.9924 T:3031; 11.07M is 11072646 T:3145 |
| archive/published/2017/icfp-src-abstract | T (`33`, `83-92`, `100-107`), Y. No change. | 2017=T:129; 3 pp is `pdfinfo` Pages 3 |
| archive/published/2017/icfp-src-poster | T, Y, and a render of `manuscript/main.pdf` by `pdftoppm` read as an image. No change; the chart values are traced. | 2017=T:69; chart, Pure/Latent/Incr/State, from the render: Basic 100; Opt 78.5, 74.3, 56, 34; Pure 35.4, 37.4, 62.3, 85; PureOpt 2.4, 2, 5.5, 3.3; Native 2.3, 1.9, 3.8, 2.3 |
| archive/published/2018/masters-algebraic-subtyping | T, Y. No change; the unresolved numbers are traced. | 10,000=T:3538 100=T:3563 2018=T:25 2700=T:3216; Fig 6.6 prints T:3563-3567 to two decimals: 222.74 and 261.47, 282.74 and 471.07, 27387.71 and 1177.23, 6402.66 and 753.47, 109.26 and 155.10; hypothesis T:3546; proofs on Dolan T:493; supervisors T:15-20; union return and standard Eff T:3613-3621 |
| archive/published/2018/masters-eeg-infotheory | T, Y. No change. | 10=T:157 128=T:1101 13=T:74 2018=T:24 30=T:95 3404=T:1206 40=T:158 60=T:1318 600=T:1111 70=T:1099 80=T:159 90=T:1245; 3 bits and 2 to 3 bits=T:1347; 4 regions=T:1187; -1 bit=T:1339 |
| archive/published/2021/abstract-bci-meeting-2021 | T, M, its bib, Y. No change. | 0.14=T:42 0.18=T:43 0.2=T:30 0.25=T:29 0.28=T:43 0.31=T:43 0.4=T:42 0.5=T:29 0.7=T:29 0.77=T:43 0.8=T:31 0.9=T:36 2021=Y:1 500=T:35; 2011 is T:59-61, `manuscript/main.bib:62-65` |
| archive/published/2021/source-localization | T, M, Y. Panel only, above. | 0.08=T:295 0.3567=T:337 0.5991=T:273 0.6297=T:273 0.8383=T:273 0.9234=T:257 0.9537=T:257 0.9867=T:257 066014=T:1 1.0459=T:338 113.16=T:372 113.89=T:372 175.34=T:374 18=T:1 199.47=T:372 2021=T:1 4.48=T:374 500=T:192 68.0538=T:339 9239.1=T:374; 2 real=T:162; 3 dipoles=T:198 |
| archive/published/2021/volga-finger-trajectories | T whole, Y. No change. | 0.37=T:31 0.78=T:31 0.87=T:31 2021=Y:13 |
| archive/published/2022/connectivity-iris | T, Y. No change. | 0.33=T:1211 0.37=T:1786 0.43=T:1786 0.67=T:1213 0.70=T:959 0.71=T:1779 0.75=T:1235 0.9=T:493 12=T:36 2022=T:36 2889=T:36; ground truth 1 and 2=T:203, T:418 |
| archive/published/2026/erp-signatures | T (lines 18, 29-30, 79, 89, 108-109, 171), R, Y. No change. | 16=T:30 36=T:30; 4 of=T:30; 9 variants=T:67; 8 locally held participants=R:28 |
| archive/stopped/algebraic-subtyping | Y (`eli5`, `outcome`). No change. | 2018=Y:10 |
| archive/stopped/connectivity-motor-imagery | T, M, R, Y. No change. | 0.14=T:172 0.18=T:173 0.2=T:156 0.25=T:155 0.28=T:173 0.31=T:173 0.4=T:172 0.5=T:155 0.7=T:155 0.77=T:173 0.8=T:157 0.9=T:164 2021=Y:9 500=T:163; 3 brain sources are x1, x2, x3 of equation 4, T:155-157 |
| coauthor/active/flkit | R (`:5`, `:9`, `:13`), Y. No change. | no number of two characters |
| coauthor/published/2016/chi-household-survival | T, R, Y. No change. | 168=Y:20 171=Y:20 2016=T:38 |
| coauthor/published/2016/chi-purpose-centric | T, Y. No change. | 2016=T:36 2744=Y:20 2750=Y:20 |
| coauthor/published/2017/algebraic-effects-compilation | T, Y. No change. | 1.5=T:1092 2.3=T:216 2.4=T:237 2017=T:8 25=T:1089 3.3=T:340 30=T:1166 34=T:1121 35.4=T:1121 4.1=T:449 5.1=T:654 50=T:1089 6.2=T:1575 708=T:8 78.5=T:1113 85=T:1112 |
| coauthor/published/2017/http2-best-practices | T, Y. No change. | 1.1=T:65 10=T:127 100=T:275 2017=T:849 30=T:44 50=T:358 500=T:209; 1 to=T:35; 4 hosts=T:567 |
| coauthor/published/2018/http2-web-performance | T, Y. No change. | 1.1=T:2 10=T:114 114=Y:21 20=T:113 2018=Y:10 30=T:46 40=T:465 400=T:490 54=T:168 60=T:168 80=T:101 87=Y:21; 9 pages=T:913, written as nine |
| coauthor/published/2023/coordinated-fingers-ecnr | T whole, Y. No change. | 0.3=T:33 0.5=T:33 2023=Y:13 30=T:28 50=T:32 62=T:25 80=T:31; 4 healthy=T:22 |
| coauthor/published/2023/ecog-frequency-features | T, Y. No change. | 0.45=T:40 0.5=T:40 066014=T:1 1.5=T:147 10=T:64 20=T:1 2023=T:1 3.5=T:147 38=T:129 45=T:257 64=T:129 |
| coauthor/published/2023/modulation-lmp-bci | T whole, Y. No change. | 0.011=T:29 0.03=T:29 0.56=T:26 2023=Y:12 3.5=T:14 60=T:15; participant 1=T:29 |
| coauthor/published/2024/highgamma-event-detection | T whole, Y. No change. | 0.011=T:42 0.03=T:42 0.56=T:39 10th=T:3 10.3217=T:9 2023=T:8 23=T:9 3.5=T:27 60=T:28 85125=T:9 962=T:9 978=T:9; subject 1=T:42 |
| coauthor/published/2025/editorial-bigdata-ai-ms | T, R, Y. No change. | 16=T:32 1679482=R:3 2025=T:2 |
| coauthor/published/2025/pfl-ms-npj | T, Y. No change. | 0.0019=T:43 0.4081=T:217 0.4605=T:82 0.5346=T:232 0.7834=T:232 0.7983=T:311 0.8092=T:81 0.8375=T:232 0.8398=T:43 0.84=Y:15 10=T:18 11=T:18 171.77=T:252 2025=T:57 217.51=T:252 26,246=T:488 27=T:22 283,115=T:488 32=T:23 350=T:563 42=T:25 478=T:57; 0.78 rounds 0.7834 T:232; 0.81 rounds 0.8092 T:81; 2 years=T:35; 5 local extension layers=T:698-700, written as five |
| coauthor/published/2025/proprioception-exoskeleton | T, Y. No change. | 0.07=T:23 0.08=T:27 0.09=T:26 0.10=T:24 0.61=T:25 0.72=T:23 0.73=T:27 0.80=T:23 10=T:67 2025=Y:12 25=T:13 62=T:98 |
| coauthor/stopped/individual-reference-intervals | Y only: the project folder holds `present` and `project.yml` (`ls`). No change. | 2024=Y:10 |
| ideas/adapter-format-theory | R, Y. No change. | 2021=R:28 |
| ideas/asthma-geo-tensor | R, Y. No change. | no number of two characters |
| ideas/attention-scoped-instructions | R, Y. No change. | 0.63=R:11 36.2=R:13 |
| ideas/block-term-nca | R, Y. No change. | 24=R:39 87=R:39 |
| ideas/brecht-fl-partitioning | R, the thesis text, Y. No change. | 0.1=T:1016 83=R:12; thesis acknowledgement, R:28-32 |
| ideas/btd-autoencoder | R, Y. No change. | 10=R:16 100=R:16 90=R:11; 5 to 8 donors=R:16 |
| ideas/cirrhosis-digital-twin | R, Y. No change. | 2025=R:3 2027=R:38 250=R:16 27=R:42 400=R:16 |
| ideas/concept-bottleneck-hcc | R, Y. No change. | 104=R:22 12=R:11 174=R:22 24=R:11 258=R:11 36=R:11 37=R:11 685=R:22 925=R:11 963=R:22 |
| ideas/conformal-tensor-factors | R, Y. No change. | no number of two characters |
| ideas/faithful-interpretability-position | R, Y. One line changed, above. | 2024=R:20 2025=R:20 |
| ideas/fed-duplication-limits | R, Y. No change. | 98.62=R:23 99=R:23 |
| ideas/fed-neural-operators | R, Y. No change. | no number of two characters |
| ideas/fedbtd | R, Y. No change. | 2026=R:3 |
| ideas/federated-protocol-agents | R, Y. No change. | 15=R:43 |
| ideas/fedlink | R, Y. No change. | 1,002=R:26 10=R:24 114=R:24 21=R:3 25=R:39 3.0=R:26 45=R:24 68=R:26 |
| ideas/fl-privacy-auditing | R, Y. No change. | no number of two characters |
| ideas/florank-personalization | R, the poster text, Y. One line changed, above. | 0.0013=T:50 0.0044=T:50 0.0059=T:51 0.0123=T:50 0.4030=T:51 0.4496=T:50 0.4864=T:50 0.4997=T:50 1,1=R:17 146=T:22 2023=R:17 2025=R:5 26=T:7 |
| ideas/harmonop | R, Y. No change. | 2020=R:11 2021=R:11 |
| ideas/hccnet-fl-sweden | R, Y. No change. | 1.5=R:20 243=R:30 37=R:30 963=R:30 |
| ideas/hccnet-pathology | R, Y. No change. | 12.4=R:7 15=R:23 243=R:7 37=R:7 963=R:25; 3 years=R:9 |
| ideas/modality-dropping-btf | R, Y. No change. | 2024=R:26 |
| ideas/multiway-biosignal-fm | R, Y. No change. | 0.16=R:25 1.5=R:28 100=R:28 15=R:36 2019=R:15 2023=R:7 2024=R:15 2025=R:28 2026=R:3 31=R:7 39=R:7 |
| ideas/neurosde | R, Y. No change. | 9 subjects=R:13 |
| ideas/old-charges-stemmatology | R, Y. No change. | 130=R:7 131=R:36 1390=R:3 15=R:20 18=R:3 1872=R:37 1888=R:3 20=R:20 |
| ideas/paleogenomics-tensor | R, Y. No change. | no number of two characters |
| ideas/pathology-tensor-mil | R, Y. No change. | 16=R:11 17=R:11 |
| ideas/physics-tensor-hcc | R, Y. Two lines changed, above. | 12=R:11 150=R:7 24=R:11 258=R:11 36=R:11 37=R:7 400=R:7 800=R:7 925=R:11; the 2 of $2 S_{in}$ is the Dixon formula, R and the slide's own method line |
| ideas/quantum-tensor-fl | R, Y. No change. | no number of two characters |
| ideas/serial-ecg-af | R, Y. No change. | 0.85=R:3 0.87=R:3 07=R:3 104,008=R:11 15=R:11 16=Y:17 2024=R:7 2026=R:3 638,683=R:11; 1 yr=R:3; 2 Hz=R:7; 2 or more ECGs=R:11, written `>= 2` |
| ideas/ssm-longitudinal | R, Y. No change. | no number of two characters |
| ideas/strokeop | R, Y. No change. | 24=R:11; 3 hours instead of 6=R:7, written `reperfusion at 3h vs 6h` |

The three decks the brief names as unresolved are traced: bachelor-network-ids and masters-algebraic-subtyping in the table; the icfp-src-poster chart values read from `pdftoppm` output, an image in `.agents/scratch/`.

## Every fact brought back and every listed fact left off

### Brought back

| Deck | Fact | Source | Where on the deck |
| --- | --- | --- | --- |
| clinical-hccnet | each sequence's encoder size chosen on the held-out patients | `manuscript/main.tex:142` | slide 1, held-out result |
| clinical-hccnet | ethnically homogeneous population | `manuscript/main.tex:322` | slide 2 |
| fed-multicellular-immune | SLE +0.013, COVID -0.064, Crohn's +0.008, kidney +0.024, heart -0.015 | `manuscript/main.tex:447-450`; `README.md:30` | slide 2 |
| fed-multicellular-immune | liver 6 controls, no replication | `manuscript/main.tex:438-442` | slide 2 chip |
| raw-pls | most of the grid's deficit was rasterization dilution | `manuscript/main.tex:541-542` | slide 2 |
| dries-bttr-ecg | age alone 0.500 matched, about 0.75 unmatched | `manuscript/main.tex:135`, `:155`; `README.md:41` | slide 1 |
| dries-bttr-ecg | CNN near chance aligned and unaligned, no alignment conclusion | `manuscript/main.tex:216`; `README.md:25` | slide 2 |
| bttd-source-eeg | deep sources degrade for all methods | `manuscript/main.tex:405` | slide 2 |
| bttd-source-eeg | correlated-source robustness of linear inverses and Champagne | `manuscript/main.tex:329-331` | slide 2 |
| bttd-source-eeg | Champagne under its matched sparse prior | `manuscript/main.tex:374-378` | slide 1 |
| covert-theory | no rate to the floor; private recovery dimension-dependent | `manuscript/main.tex:687-690`, `:139` | results line |
| ecg-readable-substrate | NeuroKit delineation a possible confounder | `manuscript/main.tex:262` | slide 2 |
| hcc-modality-poster | about 37 positives | poster text 140-144 | Data chip |
| ward-bttr-crosssubject | ridge 0.354 against BTTR 0.156 | `README.md:37` | slide 2 |
| ward-bttr-crosssubject | 6 of 12 coverage | `manuscript/body.tex:947`; `README.md:46` | slide 2 |

Facts of the refuter's list that already stood on a slide, confirmed by `grep -n` over the decks: bttn "earlier ECG-report labels" in the chip label `Dead ends, earlier ECG-report labels` (slide 2, line 39); ward's behavior against Euclidean $p$ = 0.016 (slide 2, line 41); fermat's "larger clients can lose performance (alone AUC 0.89, 0.92)" and the accuracy-only significance (lines 19-20); hcc-modality-poster's naive concatenation DWI 0.718 and 0.795 (line 19); extended-bttr-note's eBTTR 0.72 against BTTR 0.05 as its own sentence (line 22).

### Listed and left off, each because it is a detail number or does not limit how a headline reads

| Deck | Fact | Why off |
| --- | --- | --- |
| bttn-incident-af | two-branch 0.731/0.754 and warm-start 0.744/0.758 pairs | detail numbers of dead ends; the dead ends stand in the chip |
| bttn-incident-af | figure bttn_interpret | item 1 keeps it off |
| meseret-cirrhosis | Spearman 0.59 with SMOTE; subdistribution HR 1.52, 0.32; METABRIC, GBSG, SUPPORT values and sizes; prothrombin PH p = 0.002; SUPPORT 508; net benefit | detail numbers, none narrows the headline |
| meseret-cirrhosis | Fine-Gray 5-year C | item 5 keeps it off |
| ward-bttr-crosssubject | CORTEG ridge 0.380 against 0.336; random-init head 0.319; nonlinear head 0.353 to 0.517; EEG 0.402 against 0.411; fingerflex 72.1 and 8.2 | detail numbers; the conclusions stand on slide 2 |
| hccnet-revision | parameter counts 12.4M to 72.4M; fusion AUROC 0.894, 0.891; Medisch Spectrum Twente 2011 to 2022 | detail numbers; fusion conclusion on slide 2 |
| dries-bttr-ecg | RR pseudo-leads 0.471, 0.548; median-beat window | detail numbers of a dead end and of the method |
| bttd-source-eeg | 500 background dipoles | detail of the simulation |
| fed-multicellular-immune | additive aggregation does not compute the merge; leakage 0.98 at 20 donors; gene-mode stitch 0.654 | method detail; the headline does not rest on them |
| raw-pls | AUPRC 0.975 against 0.793; isometry 4.2e-16 against 1.40 | detail numbers |
| btfno | frequency roughness values; gap values at $L=1$; the reviews' request list | detail numbers; a review's request is no fact of the result |
| bt-operator-theory | ratio 10.15 against 12; threshold about 60 against 6; gap values; selector and depth extensions; no representational edge; approximate band-structure trade-off | detail numbers; the numbers belong to the uncorrected form; `README.md:83` leaves depth and selection as inheriting the change, on slide 2 |
| ecg-readable-substrate | prevalences; no-age 0.781 against 0.749; ECG-JEPA +0.013 and ST-MEM; leakage-clean +0.013, +0.002; dead-end reasons | detail numbers |
| clinical-hccnet | subgroup results; truncated-history dead end; every interval excludes 1 | detail; the limits stand on slide 2 |
| linfoot-estimator | closed routes' numbers, MIST 0.33 nats, August estimator, margin spread | numbers of routes closed before the current work |
| covert-theory | PALM no-go; the "first" claim; floor checks 1.00, 1.03, 0.97, 1.1 at 20 seeds | a private dead end and a claim the slide does not make; detail numbers |
| ms-lipid-handshake | cohort detail | item 5 keeps it off |
| ms-lipid-handshake | uptake 0.013, phagocytic -0.235, pivot, coupled factorization r 0.252, the method's fit; figure | detail numbers; item 1 keeps the figure off |
| jacobian-coupled-blockterm-dp | Control chip; floor 14 and 22; 16 to 18 percent; $L=1$ at 0.988; 1.715 against 1.753; white-to-raw ratios | detail numbers |
| dongho-ecg-clustering | HuBERT axis; scaler table; cost 28.3 and 434.7 ms; conv-AE 0.127; ECGFounder 0.909 against 0.896; worst-site draws | detail numbers |
| hcc-modality-poster | no-pretrain heads 0.729, 0.731, 0.714; stage 2 and 3 training | detail numbers; the no-pretrain all-group value stands on the slide |
| fermat | class imbalance per client; local runs 0.63, 0.72 | detail numbers; the limits stand on the slide |
| extended-bttr-note | channels 61, 46, 63; 37 ms lag; hand-avatar comparison; renders coactivations anyway | detail numbers |
| sandpile-operator, engram, glassbox, hccnet-fl, covert-applied, phd-thesis, block-term-tensor-regression, go-bttr, fbttr-strategies, abduction, loewner, fed-faithful-ecg, clinical-ai-eval-artifacts, xsub-ecog-framework | the cut lines the refuter names | detail or a plan; each deck's limit lines stand; the figures of go-bttr and block-term are restored by item 1, those of fbttr and abduction item 1 keeps off |
| novel-math-primitives, ecg-af-fair | the refuter's lines | outside this step, by the brief |

C6: each fact named in item 5's list stands on its deck, at the "Brought back" rows, and in its source at the line given. The current source states each one.

## Second slides (item 7, C11)

From the program's per-slide counts, specs / method / results. The 80 other decks have one slide; no deck of one slide gained a second, since each holds its figure and its facts within four specs, four list items and one panel (`faults: 0`). No deck lost its second slide.

| Deck | Slide 1 | Slide 2 | Why it keeps a second slide |
| --- | --- | --- | --- |
| active/linfoot-estimator | 3 / 2 / 3, figure | 3 / 1 / 2, equation | specs 6 and results 5 together exceed four |
| manuscripts/bt-operator-theory | 3 / 2 / 4 | 1 / 1 / 4, equation | ruling O176 decks; results 8 together |
| manuscripts/btfno | 3 / 2 / 3 | 3 / 1 / 2, equation | ruling O176 decks; specs 6, results 5 |
| manuscripts/bttd-source-eeg | 3 / 2 / 3 | 2 / 1 / 4, equation | ruling O176 decks; specs 5, results 7 |
| manuscripts/bttn-incident-af | 3 / 2 / 3, figure | 3 / 1 / 2, equation | specs 6, results 5 |
| manuscripts/clinical-hccnet | 3 / 2 / 3, figure | 1 / 1 / 4 | results 7 |
| manuscripts/dries-bttr-ecg | 3 / 2 / 4, figure | 1 / 1 / 4 | ruling O176 decks; results 8 |
| manuscripts/ecg-readable-substrate | 3 / 2 / 3 | 1 / 1 / 3 | results 6 |
| manuscripts/fed-multicellular-immune | 3 / 2 / 3 | 3 / 1 / 4, equation | ruling O176 decks; specs 6, results 7 |
| manuscripts/hccnet-revision | 3 / 2 / 3, figure | 2 / 1 / 2, equation | specs 5, results 5 |
| manuscripts/meseret-cirrhosis | 3 / 2 / 3, figure | 2 / 1 / 3, equation, figure | the second slide holds the equation and `meseret_landmark`, by item 7; two figures need two slides |
| manuscripts/raw-pls | 3 / 2 / 3, figure | 2 / 1 / 2, equation | specs 5, results 5 |
| manuscripts/ward-bttr-crosssubject | 3 / 2 / 3, figure | 1 / 1 / 4, equation | results 7 |

## Every disagreement between sources

| Deck | One place | Other place | Slide follows |
| --- | --- | --- | --- |
| linfoot-estimator | `README.md:71` "8 carry a label above 0.4" | the figure's printed labels, `manuscript/archive/2026-11-article/main.tex:263`: 6 above 0.4, 8 at 0.4 or more | the figure: "of at least 0.4" |
| raw-pls | `manuscript/main.tex:475-480` caption describes (A) structural, (B) grade | `fig2_results.png` has four panels: A misalignment, B structural, C grade, D ablation | the image, whose four panels the snapshot's caption names |
| block-term-tensor-regression | caption `manuscript/bare_jrnl.tex:824` "as function of time (in ms)" | the image's axis in seconds | neither: the explanation says "over time" |
| meseret-cirrhosis | `manuscript/main.tex:326` includes `fig_landmark.png` | the deck's file is `meseret_landmark.png` | a name only; the two files are byte-identical |
| bachelor-network-ids | the PDF title page, University of Hasselt (T:1) | `project.yml:15`, "Bachelor's thesis, KU Leuven 2016" | the PDF |
| modulation-lmp-bci | the PDF's title, "High-gamma band event detection improves stability of finger trajectories decoded from ECoG-LMP activity" | `project.yml:10`, "Modulation of LMPs using the gamma band increases the stability of finger trajectories decoded from ECoG" | the PDF, in `sub` |
| highgamma-event-detection | the PDF's header, 10th International BCI Meeting 2023 (T:3-9) | `project.yml:13`, `:19`, International BCI Meeting 2024, and the folder `2024` | the PDF |

The two abstract PDFs of modulation-lmp-bci and highgamma-event-detection hold the same abstract under one title; highgamma's adds the proceedings header (`diff` of the two extractions prints 23 lines, all added lines of highgamma's). The `sub` of the two decks is therefore one shared title under C9.

## Every judgment call, each a decision the orchestrator may reverse

- The second-slide titles of hccnet-revision, meseret-cirrhosis, raw-pls and ward-bttr-crosssubject are noun-clause statements, keeping each title's words. Slide 1 of those decks is a statement.
- bt-operator-theory's `Jacobian ranks` line drops the `$(R,RL)$` that follows TT in `README.md:83`, for a short line; the Tucker and TT forms are the README's.
- bt-operator-theory's equation keeps the $\Theta$ form of the deck's own earlier second term, the term correction 4 of `README.md:83` names.
- Under the rule against a fault of a paper on a slide, the before lines of physics-tensor-hcc and faithful-interpretability-position are reworded, keeping each fact the source states.
- In florank-personalization "Wins:" became "A positive would be:", since the source states a condition.
- Other projects named on a slide where the project's own source names them as what it builds on, applies or succeeds, by the rule of `O151-cases.md` ruling 1: florank-personalization (HCCNet backbone, FLoRank), hccnet-pathology (HCCNet-F, HCCNet-Pico as baselines it succeeds), hccnet-fl-sweden, ssm-longitudinal (the HCCNet Transformer it replaces), serial-ecg-af (BTTN it keeps).
- Attention-scoped-instructions cites Instruction Bleed and `HANDBOOK.md` as external literature, as its `README.md` does; that README flags `HANDBOOK.md` as read in partial abstract.
- Ward's CORTEG and bttn's Raghunath and Jabbour stay on their slides as external methods the sources name.
- The two read-only shell searches of the C8 table are commands of `grep`, `sed` and `cut` in a loop, printing to a log in `.agents/scratch/`. They are neither of the case-run programs C1, C3 and C9 name; they are written out in full above and changed no file of the step. If the orchestrator reads the brief's "no script" sentence to cover them, the C8 table rests on these two searches and would be taken again by hand.

## Anything in the brief that was wrong or impossible

- The brief's verify item 4 says `verify-exit=` is read from the output of `npm run test:quick`. The output has no such line; it ends with `test:quick: 39.2 s; every command passed` and the two `not covered` lines. Its whole output was printed by the run quoted above.
- Nothing else in the brief was wrong or impossible.

## Limitations

- C10 is untested by this step: whether each slide fits at 16:9, above all meseret-cirrhosis's second slide with its equation and figure and the longer explanations of the ward and meseret panels, is the orchestrator's measured fit and look.
- The locations of the C8 table give the first occurrence of each number's digits in the sources. Where that occurrence is a different use of the same digits, the reading of the passages named in the "What was read" column is the check, and the location is of the digits only.
- The `.agents/scratch/` folder, with the extractions, the programs and the logs, is removed before hand-back, as `agents/spec.md` asks; the programs are quoted above and the extractions come back from the command given.

## Before and after, for the look

In each project's deck, the slide of each of the 15 panels (C1 lists deck, slide and figure) should draw its figure; the 12 figures item 1 keeps off should draw on none. bt-operator-theory's two slides should state ratio $L$ for the free-profile class. Every title of the five decks of item 3 should read in one form on both slides. Second slides stand as in the table above.
