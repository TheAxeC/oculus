NOT done: meseret-cirrhosis slide 1 does not fit by estimate: with its figure and its kept facts it stands at about 40 against a room of about 37. The section "Repair round 1" names what does not fit. Everything else in the brief and in repair round 1 is done.

C10 (the measured fit and the look) is the orchestrator's by the brief and has not been run; no page was run, so every fit in this report is an estimate. No hub file was committed; 25 deck files are changed in the hub worktree.

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
| Item 1, C1 | DONE | `node c1c3.mjs <hub worktree>` | 15 `C1` lines below, each `exists true`; `decks: 93; figure lines: 15; two-slide decks: 19` |
| Item 2, C2 | DONE | `grep -rl --include=main.md '^equation' projects \| wc -l` from the hub worktree | `13` |
| Item 2, C2 | DONE | `git diff -U0 \| grep -E '^[-+]equation'` | eight lines: bt-operator-theory's two, as item 6 rewrites it, and two each for hccnet-revision, meseret-cirrhosis and raw-pls, the same terms set on two lines in `gathered`, quoted in "Repair round 1" |
| Item 2, C2 | DONE | `OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts -t "deck\|equation\|portfolio"` from the oculus worktree | `Test Files  1 passed (1)`; `Tests  7 passed \| 7 skipped (14)` |
| Item 3, C4 | DONE | read, titles printed by the `C3` lines | five titles quoted below |
| Item 4, C5 | DONE | read | three chips below, each with its source |
| Item 5, C6 | DONE | read, source lines printed with `sed -n` | section "Every fact brought back" |
| Item 6, C7 | DONE | `grep -n 'mu_{\\mathrm{band}}' projects/manuscripts/bt-operator-theory/present/main.md` | one hit, line 19, the corollary line, quoted below |
| Item 7, C11 | DONE | per-slide counts from the `C3` lines | section "Second slides" |
| Item 8, C8 | DONE | read; each number placed by reading its passage, a `grep` for one number in one file typed by hand where the passage had to be found | section "The 59 decks" |
| Item 9, C3 | DONE | `node c1c3.mjs <hub worktree>` | `faults: 0` |
| Item 9, C9 | DONE | `node c9.mjs <hub worktree>` | `lines repeated across decks: 36`, every one a short label, a status phrase, an author list, a venue string or a shared title; listed below |
| C10 | NOT DONE by this step | the orchestrator's measured fit | the builder starts no server, by the brief |
| Character set, report | DONE | the gate of `agents/spec.md` run over this report: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' .scratch/migration/agents/reviews/O176-report.md` | prints nothing |
| Character set, decks | DONE | from the hub worktree, the `find ... xargs ... grep -n '[^ -~]'` of the brief | four lines, each the place name Link<o-umlaut>ping: `ideas/modality-dropping-btf/present/main.md:10`, `ideas/hccnet-fl-sweden/present/main.md:4`, `:11`, `:19` |
| Paths written | DONE | `git status --short` from the hub worktree | 25 paths, all `M`, all `present/main.md` of decks of the path list; table below |
| Verify list | DONE | `npm run diagrams`, then `npm run test:quick` from the oculus worktree with `TMPDIR` unset | `test:quick: 56.8 s; every command passed`; `test:quick: 3 changed file(s), from git since HEAD`; exit status 0, printed by `echo "verify-exit=$?"` as `verify-exit=0` |

The verify list ran once, after the last change to a hub file. No whole-suite command ran. The step adds and changes no test. `git status --short` from the oculus worktree after `npm run diagrams` prints three untracked paths and no other: `.scratch/migration/agents/briefs/O176-round-1.md`, `.scratch/migration/agents/reviews/O176-refuter.md` and this report.

### C1 output

```
C1 active/linfoot-estimator | slide 2 | engine_shapes.png | exists true
C1 active/sandpile-operator | slide 2 | rollout.png | exists true
C1 archive/published/2021/source-localization | slide 2 | sparsity-acc-spread_norm.png | exists true
C1 archive/published/2022/block-term-tensor-regression | slide 2 | image10.png | exists true
C1 archive/published/2022/extended-bttr-note | slide 2 | ebttr_fig.jpeg | exists true
C1 archive/published/2025/go-bttr | slide 2 | gobttr.jpeg | exists true
C1 archive/published/2026/dongho-ecg-clustering | slide 2 | dongho_silhouette.png | exists true
C1 manuscripts/bttn-incident-af | slide 2 | pipeline_overview.png | exists true
C1 manuscripts/clinical-hccnet | slide 2 | sequences_by_horizon.png | exists true
C1 manuscripts/dries-bttr-ecg | slide 2 | forest_auroc.png | exists true
C1 manuscripts/hccnet-revision | slide 2 | figure_outline.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 1 | fig_simulation.png | exists true
C1 manuscripts/meseret-cirrhosis | slide 2 | meseret_landmark.png | exists true
C1 manuscripts/raw-pls | slide 2 | fig2_results.png | exists true
C1 manuscripts/ward-bttr-crosssubject | slide 2 | pipeline_flowchart.png | exists true
```

Thirteen panels moved to the deck's second slide under repair round 1, finding 1; meseret-cirrhosis keeps one figure on each slide.

The 12 figures item 1 keeps off have no `figure:` line: the 15 lines above are all of them.

### C3 output for the five decks of item 3 and the totals

```
C3 manuscripts/hccnet-revision: slide 1 "Predicting liver cancer from a patient's whole series of surveillance MRI" / slide 2 "Where the pre-training gain comes from and what fusion shows"
C3 manuscripts/meseret-cirrhosis: slide 1 "What a cirrhosis benchmark loses when its outcome is scored as a class" / slide 2 "Where the static ceiling is and what updated measurements add"
C3 manuscripts/ward-bttr-crosssubject: slide 1 "Decoding finger movements in a new patient from other patients' implants" / slide 2 "Whether the alignment carries the transfer, and where it stops"
C3 manuscripts/raw-pls: slide 1 "RAW-PLS: tensor-PLS for tumours in a different place in every patient" / slide 2 "What holds against registration and what did not hold"
C3 manuscripts/bttd-source-eeg: slide 1 "Can one decomposition localize evoked EEG generators and their dynamics?" / slide 2 "Does it hold for correlated sources and real EEG, and where does it stop?"
decks: 93; figure lines: 15; two-slide decks: 19
faults: 0
```

The five `C3` lines above are reformatted from the program's output, the per-slide counts moved to the "Second slides" table. Of 93 `C3` lines 74 read `1 slide(s)` and 19 `2 slide(s)`, so every deck has one or two slides.

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
| active/linfoot-estimator | 4 | 6 |
| active/sandpile-operator | 10 | 2 |
| archive/published/2016/bachelor-network-ids | 1 | 1 |
| archive/published/2021/source-localization | 8 | 0 |
| archive/published/2022/block-term-tensor-regression | 8 | 0 |
| archive/published/2022/extended-bttr-note | 8 | 0 |
| archive/published/2025/go-bttr | 8 | 0 |
| archive/published/2026/dongho-ecg-clustering | 8 | 0 |
| archive/published/2026/hcc-modality-poster | 1 | 1 |
| ideas/faithful-interpretability-position | 1 | 1 |
| ideas/florank-personalization | 1 | 1 |
| ideas/physics-tensor-hcc | 2 | 2 |
| ideas/ssm-longitudinal | 2 | 2 |
| manuscripts/bt-operator-theory | 17 | 17 |
| manuscripts/bttd-source-eeg | 6 | 6 |
| manuscripts/bttn-incident-af | 7 | 10 |
| manuscripts/clinical-hccnet | 7 | 10 |
| manuscripts/covert-theory | 1 | 1 |
| manuscripts/dries-bttr-ecg | 7 | 8 |
| manuscripts/ecg-readable-substrate | 1 | 1 |
| manuscripts/fed-multicellular-immune | 2 | 3 |
| manuscripts/hccnet-revision | 7 | 10 |
| manuscripts/meseret-cirrhosis | 8 | 14 |
| manuscripts/raw-pls | 9 | 13 |
| manuscripts/ward-bttr-crosssubject | 8 | 12 |

Totals: 142 added, 121 removed, 25 files, from `git diff --numstat`. A panel on a slide of its own adds the slide's front matter with it.

## Per deck, every changed line before and after, with its source

A line changed again in repair round 1 stands in that section with its final text; the entries here give the first delivery's change.

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

Each number on a slide was placed by reading its passage in the source, with a `grep` for that one number in one file typed by hand where the passage had to be found. No loop, script or search program produced this table. Each entry gives the number, what it means there and its place.

R is `README.md`, Y is `project.yml`, T is the deck's `txt`. A figure in a row is the slide's form; where the source prints more decimals, the source's form follows it.

| Deck | What was read and the changes | Each number, its meaning and its place |
| --- | --- | --- |
| active/eeg-saad-challenge | R, Y. No change. | five public training sets, two blind test sets R:7; challenge year 2027 R:3; test phase 2026-11-09 to 2026-12-08 R:69; 64 channels BioSemi R:37; 64 channels NeuroScan R:41; 255 channels, KUL-Ultra-High-Density, R:40; the 2 of $H$, harmonic mean, R:25; the 60 of the per-switch score R:23; lookahead 1000 ms R:13; 2 test submissions, the last counts, R:16; KUL 2.1 corrects a 70 ms misalignment in 2.0 R:31 |
| archive/failed/faithful-block-term-layer | R (`:17-23`, `:29-32`), Y. No change. | no number; P1 and P2 are labels |
| archive/published/2016/bachelor-network-ids | T, Y. One line changed, above. | year 2016 Y:12; 10 runs per experiment T:2822; KNN binary F within CTU, standard features 0.9500 and TCP features 0.9857, T:2996; KNN binary F cross-dataset, standard 0.9631 and TCP 0.9924, T:3031; Canberra multi-class F cross-dataset 0.9151 T:3111; KNN F on real-world flows 0.7633 T:3144, over 11072646 samples T:3145; decision-tree F on real-world flows 0.0155 T:3257, every EDM sample classified malicious T:3247-3248; uniform random baseline binary F 0.4653 T:2926, against naive Bayes cross-dataset 0.4990 T:3337; RBF SVM binary F within CTU 0.0455 T:3495; neural-network binary F within CTU 0.0 T:3596 |
| archive/published/2017/icfp-src-abstract | T (`33`, `83-92`, `100-107`), Y. No change. | year 2017 Y:12; 3 pp, `pdfinfo` prints Pages 3 |
| archive/published/2017/icfp-src-poster | T, Y, and a render of `manuscript/main.pdf` by `pdftoppm` read as an image. No change; the chart values are traced. | year 2017 Y:13; run time against basic Eff at 100, from the render's chart, Pure, Latent, Incr, State: Opt 78.5, 74.3, 56, 34; Pure 35.4, 37.4, 62.3, 85; PureOpt 2.4, 2, 5.5, 3.3; Native 2.3, 1.9, 3.8, 2.3 |
| archive/published/2018/masters-algebraic-subtyping | T, Y. No change; the unresolved numbers are traced. | degree year 2018 T:25; about 2700 lines of OCaml T:3216; 10,000 iterations T:3538; untyped Eff at 100 T:3563; Fig 6.6, EffCore and subtyping, printed to two decimals and rounded to one on the slide: Interp 222.74, 261.47 T:3563; Loop 282.74, 471.07 T:3564; Parser 27387.71, 1177.23 T:3565; Queens 6402.66, 753.47 T:3566; Range 109.26, 155.10 T:3567 |
| archive/published/2018/masters-eeg-infotheory | T, Y. No change. | degree year 2018 T:24; 13 subjects and 3404 trials T:1206; 128 channels T:1101; 600 nouns T:1111; four regions T:1187; 90 bins T:1245; 60% to 70% shared and 40% to 30% unique T:1318-1320; $I(\mathrm{Abs},\mathrm{Con})$ between 2 and 3 bits T:1347; three-way term -1 bit T:1339; with 10 trials most bins are empty T:1411-1412; with 80 trials nearly every bin is filled T:1426; directed information described, not computed T:904, T:1721-1727 |
| archive/published/2021/abstract-bci-meeting-2021 | T, its bib, Y. No change. | 8th meeting Y:16; 2021 Y:23; Omidvarnia et al. 2011 `manuscript/main.bib:65`; 500 noise sources and SNR 0.9 at sources T:35; SNR 0.9 at sensors T:36; true $x_1$ T:29; true $x_2$ (0.7, -0.5, from $x_1$ 0.2, from $x_3$ 0.25) T:30; estimated $x_1$ (0.5, -0.4, 0.14, 0.14, 0.2) T:42; estimated $x_2$ (0.77, -0.28, 0.18, 0.31) T:43; estimated $x_3$ 0.8 T:44 |
| archive/published/2021/source-localization | T, M (`manuscript/main.tex`), Y. Panel moved, repair round 1. | J. Neural Eng. 18 (2021) 066014 T:1; 500 noise sources, three dipoles T:192, T:198; correlation far superficial pink noise LCMV 0.9867, eLORETA 0.9537, Sparse eLORETA 0.9234 T:257; close deep 0.8383, 0.6297, 0.5991 T:273; $\kappa$ about 0.08, the Pareto point, T:295, T:372; spread FS eLORETA 199.47, Sparse 113.16, BC-VARETA 113.89 T:372; FD 9239.1, 175.34, 4.48 T:374; seconds eLORETA 0.3567, Sparse 1.0459, BC-VARETA 68.0538 T:337-339 |
| archive/published/2021/volga-finger-trajectories | T whole, Y. No change. | 2021 Y:13; Pearson 0.37, 0.87, 0.78, respectively for thumb, index and little finger, T:28, T:31 |
| archive/published/2022/connectivity-iris | T, Y. No change. | Appl. Sci. 12, 2889, 2022, T:36; three dipoles, ground truth 1, T:203; pink noise T:437; SNR set to 0.9 T:510; ground truth 2 adds a moving third dipole T:418; TRGC model order two T:999; ground truth 1 median sensitivity TCDF 0.33 T:1211, LSTM-NUE 0.67 and Conv2D 0.67 T:1212-1213, TRGC 1 T:1220; Far-Deep F1 TRGC 1 T:1258, LSTM-NUE 0.75 T:1260; ground truth 2 only LSTM-NUE and TRGC detect the link T:1718; precision TRGC 0.71, 0.70 and LSTM-NUE 0.37, 0.43 T:1779-1786; dipole condition not significant T:1205-1206, T:1231, T:1808 |
| archive/published/2026/erp-signatures | T (lines 18, 29-30, 79, 89, 108-109, 171), R, Y. No change. | UCR 36, KU Leuven 16, Maribor 16 R:7; 36 participants, 4 of 9 variants each, 16 per variant T:30; nine variants T:5; 8 locally held participants, a smoke test, R:28 |
| archive/stopped/algebraic-subtyping | Y (`eli5`, `outcome`). No change. | Master's thesis 2018 Y:10 |
| archive/stopped/connectivity-motor-imagery | T, M (`manuscript/main.tex`), R, Y. No change. | abstract presented 2021, Y:12; 3 brain sources, equation 4, T:155-157; 500 noisy sources and SNR 0.9 at sources and sensors T:163-164; true terms T:155-157; recovered $x_1$ T:172, $x_2$ T:173, $x_3$ 0.8 T:174 |
| coauthor/active/flkit | R (`:5`, `:9`, `:13`), Y. No change. | no number |
| coauthor/published/2016/chi-household-survival | T, R, Y. No change. | pp. 168-171 Y:20; CHI EA 2016 T:38; four objects T:26 |
| coauthor/published/2016/chi-purpose-centric | T, Y. No change. | pp. 2744-2750 Y:20; CHI EA 2016 T:36; four objects T:24 |
| coauthor/published/2017/algebraic-effects-compilation | T, Y. No change. | report 708, October 2017, T:8; Theorem 4.1 T:519, 5.1 T:792, 6.2 T:880; basic 25x to 50x slower than hand-written T:1089; both 1x to 1.5x T:1092; percent of basic: pure loop 78.5, 35.4, 2.4, 2.3 and state 34, 85, 3.3, 2.3, T:1113-1125; first solution 25-30% faster than Multicore OCaml T:1166 |
| coauthor/published/2017/http2-best-practices | T, Y. No change. | 2017 Y:10; aggregates of 10 to 100 page loads T:275; one to 500 files T:346; 4 hosts T:567; 30 large images T:299; sharding over 50% and nine websites T:632 |
| coauthor/published/2018/http2-web-performance | T, Y. No change. | pp. 87-114 Y:21; 2018 Y:10; Chrome v60, Firefox v54 T:168; corpus A nine pages T:913, at least 10 loads T:934; corpus B 40 websites T:694, at least 20 loads T:937; 30 large images T:379, 1 host, Fig. 1(c); almost 80% slower between NoLoss and Good T:415; 400 complex JS files T:862, header bytes a factor of more than five against h1 T:867 |
| coauthor/published/2023/coordinated-fingers-ecnr | T whole, Y. No change. | 2023 Y:13; four subjects and 8 movements T:22; 5 single fingers T:23; 62 electrodes T:25; 8-30 Hz T:28; 80% T:31; 50% chance T:32; 0.3-3 Hz and -0.5 s T:33 |
| coauthor/published/2023/ecog-frequency-features | T, Y. No change. | J. Neural Eng. 20 (2023) 066014 T:1; nine participants T:118; 38-64 electrodes T:129; LMP at 20 Hz T:150; seven bands T:151-154; 8 features T:256; up to 10 channels T:242; 45 performance values per feature T:257; fc 1.5 Hz slow, 3.5 Hz fast T:298; 0.5 against 0.45, Liang and Bougrain, T:357, T:40 |
| coauthor/published/2023/modulation-lmp-bci | T whole, Y. No change. | 2023 Y:12; LMP below 3.5 Hz T:14; gamma above 60 Hz T:15; average correlation 0.56 T:26; participant 1 rest variance 0.011 against 0.03 T:29 |
| coauthor/published/2024/highgamma-event-detection | T whole, Y. No change. | 10th meeting T:3; 2023 T:8; DOI 10.3217/978-3-85125-962-9-23 T:9; below 3.5 Hz T:27; above 60 Hz T:28; 0.56 T:39; subject 1 variance 0.011 against 0.03 T:42 |
| coauthor/published/2025/editorial-bigdata-ai-ms | T, R, Y. No change. | Front. Immunol. 16:1679482 T:32, R:3; 2025 T:2; past four years T:139 |
| coauthor/published/2025/pfl-ms-npj | T, Y. No change. | npj Digit. Med. (2025) 8:478 T:57; 32 countries and 350 rounds T:563, 10 repeats T:72; progression within 2 years T:35; 42 input features T:549; five optimisers T:68; up to five extension layers T:698-700; weighted ROC-AUC, adaptive FedProx 0.8398 $\pm$ 0.0019 and fine-tuned 0.8375 and baseline FedProx 0.7834, Table 1, T:232; centralized 0.8092 T:81; local 0.7983, WA row, T:311; AUC-PR baseline FedProx 0.4081 and adaptive 0.5346, Table 1, T:232; centralized 0.4605 T:82; adaptive leading in 11 countries T:353 and fine-tuned in 6 T:354; 27% longer T:115; 217.51 and 171.77 min T:252; 283,115 episodes, 26,246 patients T:488 |
| coauthor/published/2025/proprioception-exoskeleton | T, Y. No change. | ICORR 2025 Y:12; 25 subjects T:13; 62 channels T:98; 1-s segments T:124; 10 $\times$ 5-fold T:138; four classifiers T:180; IPM 0.80 $\pm$ 0.07 and PM 0.72 T:23, $\pm$ 0.10 T:24; IPM against PM 0.61 T:25, $\pm$ 0.09 T:26; IM 0.73 $\pm$ 0.08 T:27 |
| coauthor/stopped/individual-reference-intervals | Y only: the project folder holds `present` and `project.yml` (`ls`). No change. | IEEE JBHI (2024) Y:10 |
| ideas/adapter-format-theory | R, Y. No change. | Khavari and Rabusseau 2021 R:28 |
| ideas/asthma-geo-tensor | R, Y. No change. | no number |
| ideas/attention-scoped-instructions | R, Y. No change. | 4 candidates R:3; Cohen's d 0.63 R:11; strict pass rate at most 36.2% R:13 |
| ideas/block-term-nca | R, Y. No change. | 87 patients R:39; six web searches R:43 |
| ideas/brecht-fl-partitioning | R, the thesis text, Y. No change. | six partitioners R:7; Dirichlet $\alpha$ = 0.1 R:11; global accuracy near 83% R:12 |
| ideas/btd-autoencoder | R, Y. No change. | about 90% zeros R:11; validation at 100+, 5 to 8 donors, $N \le 10$, R:16 |
| ideas/cirrhosis-digital-twin | R, Y. No change. | 2025 proposal R:3; PIHC R:40; SSH Explore 2027 R:41; ENW-XS package 27-2 R:42; ENW-M R:43; about 400 patients and study of 250 R:16 |
| ideas/concept-bottleneck-hcc | R, Y. No change. | 925 studies, 258 patients, 37 HCC-positive, horizons 3 to 36 months R:11; LI-RADS 0, 1, 2 counts 685, 174, 104 of 963 R:22 |
| ideas/conformal-tensor-factors | R, Y. No change. | no number; Route 1 and Route 2 are labels |
| ideas/faithful-interpretability-position | R, Y. One line changed, above. | JMSS 2024, a 2025 review R:20 |
| ideas/fed-duplication-limits | R, Y. No change. | ProToken 98.62%, TraceFL 99%, at $k = 1$ R:23 |
| ideas/fed-neural-operators | R, Y. No change. | no number |
| ideas/fedbtd | R, Y. No change. | FedRot-LoRA Feb 2026 R:13 |
| ideas/federated-protocol-agents | R, Y. No change. | 5 percent and 15 percent R:43 |
| ideas/fedlink | R, Y. No change. | 114 links, 45 labs, 10 countries R:24; MIBiG 3.0 about 1,002 compounds, 68 categories R:26; 21 sources, 25 claims R:39 |
| ideas/fl-privacy-auditing | R, Y. No change. | no number |
| ideas/florank-personalization | R, the poster text, Y. One line changed, above. | ECTRIMS 2025, about 26k patients, 146 centers R:30; FacT AAAI 2023 R:17; F1 0.4864 $\pm$ 0.0123, LoRA 0.4496 $\pm$ 0.0013, AUC-PR 0.4997 $\pm$ 0.0044 poster text :50; FedAVG 0.4030 $\pm$ 0.0059 poster text :51; LoRA as rank-$(1,1)$ R:17 |
| ideas/harmonop | R, Y. No change. | BraTS 2020 and 2021 R:11 |
| ideas/hccnet-fl-sweden | R, Y. No change. | 963 exams, 243 fine-tune, 37 HCC+ R:30; 1.5T and 3T R:20 |
| ideas/hccnet-pathology | R, Y. No change. | 243 patients, 37 cancers, 12.4M of HCCNet-F R:7; P(HCC) within 3 years, four nets R:9; bands below 5%, 5-15%, above 15% R:23; about 9M, 963 exams R:25 |
| ideas/modality-dropping-btf | R, Y. No change. | 4-lane scan R:3; TenMFL IEEE TCE 2024 R:26 |
| ideas/multiway-biosignal-fm | R, Y. No change. | 39 EEG, 31 ECG, 2023 to Sept 2026, R:7; 100M band Y:21; 0.16B, NeurIPS 2019, R:25; NeurIPS 2024 R:26; 1.5B, NeurIPS 2025, R:28 |
| ideas/neurosde | R, Y. No change. | 9 subjects R:13 |
| ideas/old-charges-stemmatology | R, Y. No change. | c.1390 and 18th century R:3; about 130 copies and Begemann 1888 R:7; 131 entries R:36; Hughan 1872, 20 manuscripts R:37; 15 to 20 witnesses R:20 |
| ideas/paleogenomics-tensor | R, Y. No change. | no number |
| ideas/pathology-tensor-mil | R, Y. No change. | CAMELYON16/17, a dataset name, R:11 |
| ideas/physics-tensor-hcc | R, Y. Two lines changed, above. | 925 studies, 258 patients, 37 HCC+, horizons R:11; b = 0, 150, 400, 800 and the factor 2 of the Dixon formula R:7; 37 positives overfit R:7 |
| ideas/quantum-tensor-fl | R, Y. No change. | no number |
| ideas/serial-ecg-af | R, Y. No change. | 104,008 patients with 2 or more ECGs and 638,683 pairs R:11; Attia 0.87, Raghunath 0.85 at 1 yr R:3; 0.85 serial bar R:21; Sun et al., JAHA 2024, and 2 Hz P-wave R:7; Gruwez cohort delivered 2026-07-16 Y:17 |
| ideas/ssm-longitudinal | R, Y. Hook and one result changed, repair round 1, finding 4. | no number; $\Delta t$ is a variable |
| ideas/strokeop | R, Y. No change. | 3 hours instead of 6 R:7 |

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
| sandpile-operator | deep-equilibrium plan (`README.md:49`) | does not meet the test: a planned change of method; the headline is already limited to synthetic cascades and the slide says capability only (`present/main.md:20`) |
| engram | decided-against list (PPO, GRPO and a reward model; the Pile; a control-panel UI; more reference candidates; a skew-normal fit) | does not meet it: options not taken; the headline "Instrument done; the localiser gate is next" claims nothing about them |
| engram | 190 MB index cost (`README.md:75`) | does not meet it: the storage cost of a replaced provenance index; the headline claims no storage figure |
| glassbox | dead end: sufficiency certificate, near-empty at 4-13% prevalence | does not meet it: the headline is about age and the encoders, and states no certificate |
| glassbox | dead end: novelty monitor, predicts model errors at chance | does not meet it: the headline states no monitor |
| glassbox | dead end: averaging the named and encoder predictions gives no gain | does not meet it: the headline claims no averaging gain |
| hccnet-fl | heterogeneity axis, label skew: mean AUPRC 0.713 to 0.671 for CAF, 0.628 to 0.503 for FedAvg | does not meet it: CAF stays above FedAvg; the worst-silo line at $\alpha$ = 0.1 stands at `present/main.md:18` |
| hccnet-fl | heterogeneity axis, cadence: CAF 0.718 dense, 0.694 sparse, worst silo 0.671; FedAvg 0.641, 0.583, 0.547; FedBN worst silo 0.601 | does not meet it: the same ordering as the headline's comparison |
| hccnet-fl | heterogeneity axis, dominant modality: worst-silo AUPRC 0.351 local-only, 0.408 FedAvg, 0.489 CAF | does not meet it: the same ordering; the headline names no such case |
| hccnet-fl | FedSL 0.402 against 0.701 (`README.md:22`) | does not meet it: an ablation of where the gain comes from, which the hook states |
| covert-applied | masking no-go: orthogonal masking cannot keep a thresholded sparse core | does not meet it: the reason the design fits locally in the clear, which `present/main.md` states; the headline's parity and communication claims are unaffected |
| covert-applied | 38.1 MB, masked dense tensors at 8x the feature dimension (`README.md:34`) | does not meet it: a wider gap than the headline's 24x, so its absence cannot make the headline read stronger |
| phd-thesis | Granger precision: TRGC 0.71 against 0.37 for LSTM-NUE on ground truth 2 | does not meet it: an earlier chapter's connectivity comparison; the headline is about finger decoding by BTTR |
| phd-thesis | finger abduction not yet attempted from ECoG | does not meet it: an outlook of the thesis; the headline and hook claim flexion trajectories only |
| block-term-tensor-regression | significance line: ACE-BTTR differs from LSTM, AM, RF and LARS for every subject; thumb and index show no significant difference to LSTM | does not meet it: the headline compares with HOPLS, and the LSTM means stand in `present/main.md:19` |
| block-term-tensor-regression | non-difference line: BTTR and gBTTR do not differ significantly on test data | does not meet it: a comparison of two variants of the same method; the headline claims no gBTTR gain |
| block-term-tensor-regression | figure `image10.png` | stands on slide 2, repair round 1, finding 1 |
| go-bttr | figure `gobttr.jpeg` | stands on slide 2, repair round 1, finding 1 |
| fbttr-strategies | figure `model.png` | not a fact of item 5's test; item 1 of the brief lists it among the 12 figures that stay off |
| abduction | figure `raw_signal` | not a fact of item 5's test; item 1 of the brief lists it among the 12 figures that stay off |
| loewner | hook, `plain` and `Stage` lines as written in the snapshot | does not meet it: the same statement stands in shorter form in `hook`, `eli5.plain` and the headline "Algorithm to derive before any pilot" |
| loewner | the correction, as `equation` and method lines | stands at `present/main.md:15` |
| loewner | outer loss and the open derivative and adjoint | stand at `present/main.md:16` |
| loewner | No experiments have run, code/ holds only its README; novelty and usefulness unestablished; no implementation, manuscript or venue | stands at `present/main.md:18` |
| loewner | Occupied line | stands at `present/main.md:19` |
| loewner | First number line | stands at `present/main.md:20` |
| fed-faithful-ecg | title, hook, `plain` and `Stage` lines as written in the snapshot | does not meet it: the shorter lines state the same; `Outcome` reads no-go at `present/main.md:13` |
| fed-faithful-ecg | backbone, silo and faithfulness-metric method lines | stand at `present/main.md:15` in shorter form |
| fed-faithful-ecg | centralized and FedAvg AUROC, comprehensiveness and consistency | stand at `present/main.md:18` |
| fed-faithful-ecg | FedAvg kept accuracy and faithfulness, no gap to fix | stands at `present/main.md:18` |
| fed-faithful-ecg | aligned averaging 0.834, 0.107, 0.341 | stands at `present/main.md:18` |
| clinical-ai-eval-artifacts | Gate-pending: no protocol run yet | stands at `present/main.md:18` |
| clinical-ai-eval-artifacts | Target: the reported gain shrinks or vanishes on that benchmark under the protocol | stands at `present/main.md:18` |
| xsub-ecog-framework | title and hook as written in the snapshot | does not meet it: the shorter lines state the same question and limit |
| xsub-ecog-framework | test on BCI Competition IV dataset 4, 3 subjects, finger flexion | stands at `present/main.md:14` |
| xsub-ecog-framework | Not started; it needs new runs | stands at `present/main.md:18` |
| xsub-ecog-framework | Gate: minimal-calibration transfer holds on BCI-IV-4, then on a different task | stands at `present/main.md:18` |
| novel-math-primitives, ecg-af-fair | the refuter's lines | outside this step, by the brief |

C6: each fact named in item 5's list stands on its deck, at the "Brought back" rows, and in its source at the line given. The current source states each one.

## Second slides (item 7, C11)

From the program's per-slide counts, specs / method / results. The 74 other decks have one slide. Six decks of one slide gained a second, each because its text leaves its figure no room, in the section "Repair round 1". No deck lost its second slide.

| Deck | Slide 1 | Slide 2 | Why it has a second slide |
| --- | --- | --- | --- |
| active/linfoot-estimator | 4 / 2 / 3 | 2 / 1 / 2, equation, figure | specs 6 and results 5 together exceed four |
| active/sandpile-operator | 3 / 3 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| archive/published/2021/source-localization | 3 / 2 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| archive/published/2022/block-term-tensor-regression | 3 / 2 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| archive/published/2022/extended-bttr-note | 3 / 2 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| archive/published/2025/go-bttr | 3 / 2 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| archive/published/2026/dongho-ecg-clustering | 3 / 2 / 3 | 0 / 0 / 0, figure | repair round 1, finding 1 |
| manuscripts/bt-operator-theory | 3 / 2 / 4 | 1 / 0 / 4, equation | ruling O176 decks; results 8 together |
| manuscripts/btfno | 3 / 2 / 3 | 3 / 1 / 2, equation | ruling O176 decks; specs 6, results 5 |
| manuscripts/bttd-source-eeg | 3 / 2 / 3 | 2 / 0 / 4, equation | ruling O176 decks; specs 5, results 7 |
| manuscripts/bttn-incident-af | 4 / 2 / 4 | 2 / 0 / 2, equation, figure | specs 6, results 6 |
| manuscripts/clinical-hccnet | 4 / 2 / 4 | 0 / 1 / 3, figure | results 7 |
| manuscripts/dries-bttr-ecg | 4 / 2 / 4 | 0 / 1 / 4, figure | ruling O176 decks; results 8 |
| manuscripts/ecg-readable-substrate | 3 / 2 / 3 | 1 / 1 / 3 | results 6 |
| manuscripts/fed-multicellular-immune | 3 / 2 / 3 | 3 / 0 / 4, equation | ruling O176 decks; specs 6, results 7 |
| manuscripts/hccnet-revision | 4 / 2 / 3 | 1 / 0 / 2, equation, figure | specs 5, results 5 |
| manuscripts/meseret-cirrhosis | 3 / 2 / 3, figure | 2 / 1 / 3, equation, figure | the second slide holds the equation and `meseret_landmark`, by item 7; two figures need two slides |
| manuscripts/raw-pls | 3 / 2 / 4 | 2 / 0 / 1, equation, figure | specs 5, results 5 |
| manuscripts/ward-bttr-crosssubject | 4 / 2 / 4 | 0 / 0 / 3, equation, figure | results 7 |

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
| pfl-ms-npj | Table 1, baseline FedProx ROC-AUC 0.7834 (T:232) | the country table's WA row, 0.7835 (T:311) | Table 1 |

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
- Second-slide `sub` and `eli5` rows that a figure left no room for are taken off where another line of the deck says the same; each is named in "Repair round 1". The brief's sentence "nothing is taken off a slide to make room unless it moves to the deck's other slide" could be read to cover them. Their removal is reversible, at the cost of the fit of those slides.
- The equations of hccnet-revision, meseret-cirrhosis and raw-pls are set on two lines in `gathered`, the same terms, the separator `, \quad` dropped, so they fit the column left by the figure. Item 2's "Equations stay as they are" could be read to forbid it; no term changed.

## Anything in the brief that was wrong or impossible

- The brief's verify item 4 says `verify-exit=` is read from the output of `npm run test:quick`. The output has no such line; it ends with `test:quick: 39.2 s; every command passed` and the two `not covered` lines. Its whole output was printed by the run quoted above.
- Nothing else in the brief was wrong or impossible.

## Limitations

- C10 is untested by this step: whether each slide fits at 16:9 is the orchestrator's measured fit and look. The fit figures of "Repair round 1" are estimates from the orchestrator's percents, since no page was run. Meseret-cirrhosis slide 1 is over by that estimate.
- The `.agents/scratch/` folder, with the extractions, the programs and the logs, is removed before hand-back, as `agents/spec.md` asks; the programs are quoted above and the extractions come back from the command given.

## Before and after, for the look

In each project's deck, the slide of each of the 15 panels (C1 lists deck, slide and figure, most of them now on slide 2) should draw its figure; the 12 figures item 1 keeps off should draw on none. bt-operator-theory's two slides should state ratio $L$ for the free-profile class. Every title of the five decks of item 3 should read in one form on both slides. Second slides stand as in the table above.

## Repair round 1

Not done: meseret-cirrhosis slide 1 is over by estimate, named below. Nothing else of the round is left. All 15 figures stay on a slide (C1 above). No fit here is measured: no page was run, and each slide's height is my estimate from the orchestrator's percents.

### Finding 1: every slide fits

| Slide (0-based) | Over, % | What changed |
| --- | --- | --- |
| dongho-ecg-clustering #0 | 29 | figure to a new second slide |
| go-bttr #0 | 66 | figure to a new second slide |
| extended-bttr-note #0 | 60 | figure to a new second slide |
| block-term-tensor-regression #0 | 52 | figure to a new second slide |
| source-localization #0 | 25 | figure to a new second slide |
| sandpile-operator #0 | 73 | figure to a new second slide; hook and `plain` shortened |
| bttn-incident-af #0 | 57 | figure to slide 2; a spec and a result moved in from slide 2; hook shortened |
| bttn-incident-af #1 | 3 | spec, result and `eli5` off to slide 1 or merged; `sub` removed |
| dries-bttr-ecg #0 | 65 | figure to slide 2; spec moved in from slide 2 |
| ward-bttr-crosssubject #0 | 71 | figure to slide 2; a spec and a result moved in from slide 2; hook shortened |
| ward-bttr-crosssubject #1 | 6 | spec and result moved to slide 1; hook and method merged; `sub` and `eli5` removed |
| meseret-cirrhosis #0 | 66 | `sub`, hook and `eli5` removed, their facts in the Data spec and the title; figure stays, by estimate still over |
| meseret-cirrhosis #1 | 23 | `sub`, `eli5` and hook removed, hook merged into the first result; equation on two lines |
| hccnet-revision #0 | 22 | figure to slide 2; spec moved in from slide 2; hook shortened |
| bttd-source-eeg #0 | 1 | hook shortened |
| bttd-source-eeg #1 | 10 | title shortened; method line removed, its content in hook and `sub` |
| fed-multicellular-immune #1 | 6 | method line removed, its content in the hook |
| raw-pls #0 | 36 | figure to slide 2; result moved in from slide 2; hook rewritten shorter |
| clinical-hccnet #0 | 63 | figure to slide 2; spec and result moved in; hook and one result shortened |
| linfoot-estimator #0 | 34 | figure to slide 2; spec moved in; hook shortened |
| bt-operator-theory #0 | 1 | hook shortened |
| bt-operator-theory #1 | 9 | method line removed; lines under findings 3 and 2 |

**Decks that gained a second slide, and why.** Each had one slide whose text leaves its figure no height, so the figure goes with its `caption` and `explain` to a second `kind: project` slide that holds it alone: dongho-ecg-clustering, go-bttr, extended-bttr-note, block-term-tensor-regression, source-localization, sandpile-operator. Their first slides read as before the figure came back, save sandpile's two shortened lines.

**A deck that cannot hold figure and kept facts on two slides.** meseret-cirrhosis: slide 1 holds `fig_simulation.png` and three specs, two method lines and three result lines, at about 40 against a room of about 37 by estimate, about 5 to 6 percent over. Slide 2 holds `meseret_landmark.png` and the equation, so neither slide takes the other's figure. What does not fit is the slide 1 list of method and result lines with the figure beside it. Nothing was dropped to hide it.

**Every changed line, before and after.** Each after states the same fact as its before; the source of the fact is the deck's earlier line unless a source is named.

| Deck, slide | Line | Before | After |
| --- | --- | --- | --- |
| dongho-ecg-clustering, new 2 | `title`, `tag` | none | 'How do silhouette and ARI compare across the clustering solutions?', 'Silhouette against ARI' |
| dongho-ecg-clustering, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| go-bttr, new 2 | `title`, `tag` | none | 'How does Go-BTTR assign fingers to blocks in each iteration?', 'Finger grouping per iteration' |
| go-bttr, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| extended-bttr-note, new 2 | `title`, `tag` | none | 'What does each eBTTR block pair with the finger matrix?', 'The eBTTR block structure' |
| extended-bttr-note, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| block-term-tensor-regression, new 2 | `title`, `tag` | none | 'How does predicted ring-finger flexion compare with the data glove?', 'Predicted flexion, subject 1' |
| block-term-tensor-regression, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| source-localization, new 2 | `title`, `tag` | none | 'Where is the Pareto-optimal fraction of dipoles to keep?', 'The Pareto point' |
| source-localization, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| sandpile-operator, new 2 | `title`, `tag` | none | 'Arrival step and final mass error on a held-out synthetic medium', 'Synthetic rollout' |
| sandpile-operator, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| sandpile-operator, 1 | `hook` | Tumour, infarct and seizure fronts cross local thresholds and stop at barriers; smooth diffusion has no threshold and leaks. | Tumour, infarct and seizure fronts cross thresholds and stop at barriers; smooth diffusion has none and leaks. |
| sandpile-operator, 1 | `plain` | Like a sandpile, each spot holds its load until it passes a limit, then spills over to neighbours that are not walls; the network learns the limits. | Like a sandpile, each spot holds its load past a limit, then spills to neighbours that are not walls; the network learns the limits. |
| bttn-incident-af, 1 | `hook` | BTTN reads a frequency-time-lead spectrogram through blocks with readable factors; clinical factors sit outside them. | BTTN reads a frequency-time-lead spectrogram through readable blocks; clinical factors sit outside them. |
| bttn-incident-af, 2 to 1 | spec | `CODE-15, PTB-XL` on slide 2 | unchanged, on slide 1 |
| bttn-incident-af, 2 to 1 | result | 'No external cohort has dated onset...' on slide 2 | unchanged, on slide 1 |
| bttn-incident-af, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| bttn-incident-af, 2 | `sub` | Occlusion on held-out MIMIC-IV data, external cohorts and dead ends | removed; title and result lines of slide 2 carry it |
| bttn-incident-af, 2 | `eli5` | Which ECG parts carry the risk, and where can it be tested? / Masking a band or a lead shows where the model looks. | removed; carried by the hook and the result 'Occlusion (masking a band or a lead)...' |
| bttn-incident-af, 2 | method to result | Occlusion; probe label-blind 0.973, trained 0.976. | Occlusion (masking a band or a lead); probe label-blind 0.973, trained 0.976. |
| dries-bttr-ecg, 2 to 1 | spec | `Code` on slide 2 | unchanged, on slide 1 |
| dries-bttr-ecg, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| dries-bttr-ecg, 2 | `sub` | Weight maps, R-peak alignment, limits and dead ends | removed; the title carries it |
| dries-bttr-ecg, 2 | `eli5` | Show where the model puts its weight and how far the evidence goes. / Lining up the beats on the main spike lifts the score; the result is feasibility-level. | removed; carried by the hook and the result beginning 'Feasibility-level:' |
| dries-bttr-ecg, 2 | method | Alignment ablation: the same pipeline with and without R-peak registration, pooled paired gain +0.107 and +0.186. | Ablation: same pipeline with and without R-peak registration; pooled paired gain +0.107, +0.186. |
| dries-bttr-ecg, 2 | result | Identification within 31 days, one small public database, no external validation; PTB-XL has no follow-up for future onset. | Feasibility-level: identification within 31 days, one small public database, no external validation; PTB-XL has no follow-up for future onset. |
| ward-bttr-crosssubject, 1 | `hook` | Each grid is projected onto axes defined by finger movement, and one shared decoder reads those axes for every patient. | Each grid is projected onto finger-movement axes; one shared decoder reads those axes for every patient. |
| ward-bttr-crosssubject, 2 to 1 | spec, result | `Cursor cohort, n = 4`; Dead ends on slide 2 | unchanged, on slide 1 |
| ward-bttr-crosssubject, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| ward-bttr-crosssubject, 2 | `sub` | Same-protocol ablation, cursor-tracking replication and dead ends | removed; title and hook carry it |
| ward-bttr-crosssubject, 2 | `eli5` | Test whether the alignment is what makes the transfer work. / Permuting or replacing the alignment lowers the transfer. | removed; carried by the hook and the first result |
| ward-bttr-crosssubject, 2 | `hook` and method, merged | A same-protocol ablation changes only the correspondence scheme or the alignment head. / Frozen-decoder ablation; a cursor-tracking cohort repeats the test. | A frozen-decoder, same-protocol ablation changes only the correspondence scheme or the alignment head; a cursor-tracking cohort repeats it. |
| hccnet-revision, 1 | `hook` | Every examination is encoded; a Transformer reads the series with the time to the reference examination as its position. | Each examination is encoded; a Transformer reads the series, positioned by time to the reference examination. |
| hccnet-revision, 2 to 1 | spec | `Code` on slide 2 | unchanged, on slide 1 |
| hccnet-revision, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| hccnet-revision, 2 | `eli5` | Find which training stage helps and how trustworthy the probabilities are. / Sequence-order pre-training adds little; no fused input beats diffusion MRI alone. | removed; carried by the hook and the two results |
| hccnet-revision, 2 | `hook` and method, merged | An ablation separates the two pre-training stages; a calibration analysis compares the models. / Pre-training ablation on HCCNet-Pico, then identical fine-tuning. | On HCCNet-Pico an ablation separates the two pre-training stages, then identical fine-tuning; a calibration analysis compares the models. |
| hccnet-revision, 2 | `equation` | on one line, the two formulas joined by `, \quad` | the same two formulas in `gathered`, on two lines |
| raw-pls, 1 | `hook` | Each lesion is transported onto one learnable cross-subject template by fused Gromov-Wasserstein, no voxel matched. | Fused Gromov-Wasserstein transports each lesion onto one learnable cross-subject template; no voxel is matched. |
| raw-pls, 2 to 1 | result | `$\sqrt{N}$ rate` line on slide 2 | unchanged, on slide 1 as the fourth |
| raw-pls, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| raw-pls, 2 | `sub` | Radiomics baseline, real warps and dead targets | removed; title, specs and headline carry it |
| raw-pls, 2 | `eli5` | A stronger registered baseline, and the targets that fail. / Two clinical targets stay near chance or below. | removed; carried by the hook and the `Dead targets` spec |
| raw-pls, 2 | `hook` and method, merged | RAW-PLS beats a lesion-cropped registered radiomics baseline in all four settings. / Lesion-cropped radiomics, registered affine and SyN. | RAW-PLS beats a lesion-cropped radiomics baseline, registered affine and SyN, in all four settings. |
| raw-pls, 2 | `equation` | on one line | the same terms in `gathered`, on two lines |
| clinical-hccnet, 1 | `hook` | One block of left-lobe tissue on routine surveillance MRI, with no contrast agent and no clinical or laboratory variable. | One left-lobe tissue block on routine surveillance MRI, no contrast agent, no clinical or laboratory variable. |
| clinical-hccnet, 2 to 1 | spec, result | `HCC` spec; BCLC result on slide 2 | unchanged, on slide 1 |
| clinical-hccnet, 1 | held-out result | ...(each sequence's encoder size was chosen on them): 0.899 at 1 year (4 HCC), 0.881 at 2 years (3 HCC), 0.929 at 3 years (1 HCC). | ...(each sequence's encoder size chosen on them): 0.899 at 1 year (4 HCC), 0.881 at 2 (3 HCC), 0.929 at 3 (1 HCC). |
| clinical-hccnet, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| clinical-hccnet, 2 | `sub` | Per-sequence AUROC, the HCC cases, limitations and dead ends | removed; title and result lines carry it |
| clinical-hccnet, 2 | `eli5` | Show how each MRI sequence scores alone and where the evidence stops. / Each sequence is scored on its own; one centre and no external validation yet. | removed; carried by the method line and the limits line below |
| clinical-hccnet, 2 | limits result | Whole-cohort values include development patients; one centre, ethnically homogeneous, mostly MASLD and ALD, 10 HCC at 3 years in the whole cohort, 1 held out. | Whole-cohort values include development patients; one centre, no external validation yet, ethnically homogeneous, mostly MASLD and ALD; 10 HCC at 3 years in the whole cohort, 1 held out. |
| linfoot-estimator, 1 | `hook` | Exactly invariant to strictly increasing marginal maps and the eight symmetries of the square, through ranks and averaging. | Exact invariance to strictly increasing marginal maps and the square's eight symmetries, by ranks and averaging. |
| linfoot-estimator, 2 to 1 | spec | `Backbone bias ratio` on slide 2 | unchanged, on slide 1 |
| linfoot-estimator, 1 to 2 | `panels` | on slide 1 | unchanged, on slide 2 |
| linfoot-estimator, 2 | `sub` | Independent samples, measured departure, closed routes, runs in progress and credit | removed; the hook and three result lines carry it |
| linfoot-estimator, 2 | `eli5` | Where the new estimator does not help; ideas set aside. / The published estimator is lower on independent samples. | removed; carried by the hook and the headline |
| meseret-cirrhosis, 1 | `sub` | Competing-risks modelling of the Mayo PBC cohort: recovering the transplant outcome | removed; title, mechanism and Data spec carry it |
| meseret-cirrhosis, 1 | `hook` | The 418-patient cohort is right-censored with death and transplantation competing; recast, the transplant risk is recoverable. | removed; carried by the Data spec below and the first result |
| meseret-cirrhosis, 1 | `eli5` | Give patients a time-resolved risk of dying and of receiving a transplant, from a dataset often treated as a sorting exercise. / A patient still alive at the last visit is not a negative case; models that respect this track each patient's true risk. | removed; carried by the title and the first two results |
| meseret-cirrhosis, 1 | Data spec | Mayo PBC, 161 deaths, 25 transplants | Mayo PBC, 418 patients, right-censored, 161 deaths, 25 transplants |
| meseret-cirrhosis, 2 | `sub` | Discrimination ceiling, landmark analysis and external transport | removed; title and result lines carry it |
| meseret-cirrhosis, 2 | `eli5` | Do complex models or repeated measurements help? / No model exceeds the simple score. | removed; carried by the first result |
| meseret-cirrhosis, 2 | `hook` merged into result | Seven model families sit at the Mayo score's discrimination. / Harrell's C 0.806 to 0.833 across seven models; Mayo score 0.833, integrated Brier 0.143. | Seven model families sit at the Mayo score's discrimination: Harrell's C 0.806 to 0.833; Mayo score 0.833, integrated Brier 0.143. |
| meseret-cirrhosis, 2 | `equation` | on one line, joined by `, \quad` | the same terms in `gathered`, on two lines |
| bttd-source-eeg, 1 | `hook` | Folding the lead field into a block-term decomposition makes every block a cortical source map with its own dynamics. | With the lead field in the block-term factors, every block is a cortical source map with its own dynamics. |
| bttd-source-eeg, 1 | result | the most focal of the classical solvers | most focal of the classical solvers |
| bttd-source-eeg, 2 | `title` | How does the method handle correlated sources and real visual EEG, and where does it stop? | Does it hold for correlated sources and real EEG, and where does it stop? |
| bttd-source-eeg, 2 | method | Visual-hemifield stimuli on the open MNE sample data. | removed; the hook's 'one visual hemifield' and the `sub`'s 'open MNE sample data' carry it |
| fed-multicellular-immune, 2 | method | Programs scored against the best single compartment. | removed; the hook states it |
| bt-operator-theory, 1 | `hook` | Both formats reach the same operators; CP fits a frequency profile per rank-one term, the block-term format one per block. | Both formats reach the same operators; CP fits one frequency profile per rank-one term, block-term one per block. |
| bt-operator-theory, 2 | method | Four self-contained synthetic scripts. | removed; the hook states it |

### Finding 2: bt-operator-theory headline

| Line | Before | After | Source |
| --- | --- | --- | --- |
| `:23` `headline` | CP's excess risk exceeds the free-profile block-term's by a factor tending to $L$ | On band-structured targets CP's excess risk exceeds the free-profile block-term's by a factor tending to $L$ | `manuscript/main.tex:53`, `:373`; `README.md:22` |

### Finding 3: bt-operator-theory, the synthetic checks

| Line | Before | After | Source |
| --- | --- | --- | --- |
| slide 2 `hook` (`:30`) | Four self-contained synthetics check the theory inside the paper's own Gaussian model. | Four self-contained synthetics check the paper's Gaussian model on the band-constrained block-term class. | `code/synthetic_separation.py:29-30`, `CLAUDE.md` |
| slide 2 `purpose` (`:33`) | Show that the theory's numbers come out in its own model, and say how far it reaches. | What the four scripts check, and how far the claim reaches. | the same lines |
| slide 2 `plain` (`:34`) | The numbers match the theory; the advantage is an inductive bias. | The scripts check the band-constrained form; the free-profile rerun is still to do. | `project.yml:22` |
| slide 2 result (`:40`) | Knowing the band supports gives CP $LK$; reaching the block-term rate needs the block membership of the CP terms. | An inductive-bias result: knowing the band supports gives CP $LK$; the block-term rate needs the block membership of the CP terms. | `README.md:22` |
| slide 2 `headline` (`:43`) | The synthetic checks match the theory; the gap is an inductive-bias result | The four scripts check the band-constrained class; the free-profile rerun is still to do | `code/synthetic_separation.py:29-30`; `project.yml:22` |

### Finding 4: ssm-longitudinal

| Line | Before | After | Source |
| --- | --- | --- | --- |
| `:5` `hook` | HCCNet's Transformer pads irregular follow-up to fixed steps; a state-space model uses the actual $\Delta t$ between scans. | Follow-up MRI arrives at irregular, patient-specific intervals; a state-space model conditions its dynamics on the actual $\Delta t$ between scans. | `README.md`, "What it is and why" |
| `:20` result | Counts only if the continuous-time SSM beats the HCCNet baseline. | Real only if the continuous-time SSM scores above that CNN-Transformer on the same splits. | `README.md`, "Next", items 1 and 2 |

### Finding 5: C8's table by reading

The table in "The 59 decks (C8)" is remade. Each number stands with its meaning and its place, read in that source; nothing the two searches of the first delivery printed is used, and those searches are gone from this report. No loop, script or search program produced it. In pfl-ms-npj the author lines T:18, T:22, T:23 and T:25 are replaced by T:72 (10 repeats), T:115 (27%), T:353 and T:354 (11 countries, fine-tuned in 6), T:549 (42 inputs) and T:563 (32 clients, 350 rounds). The reading found no number on a slide that means something else there, so this finding changes no slide line. It adds one disagreement between two tables of the pfl-ms-npj paper, 0.7834 against 0.7835, listed under "Every disagreement between sources".

### Finding 6: one row per fact

Report line 652 of the first delivery is replaced by 37 rows, one per fact: the fact as the O151 refuter's section names it, and, for the decks the refuter names only as "lines cut" (loewner, fed-faithful-ecg, clinical-ai-eval-artifacts, xsub-ecog-framework), each cut line of `O151-report.md`. No fact on those rows meets item 5's test, so none comes back. Each row says why, or where the fact already stands on the deck.

### Verify

All commands ran after the last change to a hub file, from the directories named, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch/` but for `npm run test:quick`.

```
C1 (node --no-warnings c1c3.mjs <hub worktree>): 15 lines, each "exists true" (quoted in "C1 output")
C1, C3 (same program): decks: 93; figure lines: 15; two-slide decks: 19 / faults: 0
C3: 74 decks read "1 slide(s)", 19 read "2 slide(s)"; no deck has another count
C2 (grep -rl --include=main.md '^equation' projects | wc -l): 13
C2 (OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts -t "deck|equation|portfolio"): Test Files 1 passed (1); Tests 7 passed | 7 skipped (14)
C7 (grep -n 'mu_{\\mathrm{band}}' .../bt-operator-theory/present/main.md): one hit, line 19, the corollary line
C9 (node --no-warnings c9.mjs <hub worktree>): lines repeated across decks: 36, the same 36 classes as listed under "C9 output, classified"; no hook, headline, method or result among them
Character set, decks: four lines, each the place name Link<o-umlaut>ping, in modality-dropping-btf and hccnet-fl-sweden
git status --short (hub worktree): 25 paths, each " M" and a present/main.md of the path list
npm run diagrams; npm run test:quick (TMPDIR unset): test:quick: 56.8 s; every command passed; verify-exit=0
```

Not covered by these: the fit at 16:9 and the look, which are the orchestrator's, as the brief says.
