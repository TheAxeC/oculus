# O151 look, after the builder's first hand-back

Server: `npx vite dev --port 8799` from `.agents/worktrees/migration-O151` (the step's code), HOME a scratch home whose hub is a copy of the research hub's `.oculus/` (without `local.yml` and `secrets`), its `deck/`, every `project.yml`, and the 95 `present/` folders of the builder's `.agents/hub/projects/`. The Present view drew the portfolio deck "Research projects": 95 projects, 124 slides. No `self` is set in the scratch copy, so no Mine only filter applied; no filter was set (Decision 7).

## G14 over the scratch hub

`OCULUS_TEST_HUB=<scratch hub> npx vitest run tests/checks/config/integrity.test.ts`, from the O151 worktree: 3 failed, 11 passed of 14.

- "reads a deck out of every project that has a present/ folder, with no finding" and "reads the portfolio deck with every named deck found": two deck findings, `{{project.venue}} holds no value for the project adapter-format-theory; it is filled with nothing` (`projects/ideas/adapter-format-theory/present/main.md:1`) and the same for `strokeop` (`projects/ideas/strokeop/present/main.md:1`). Both manifests hold a venue (`venue: jmlr` and `venue: media`, each at `project.yml:15`); the finding comes from G14's `readDeck`, which reads with `noRecords` (`integrity.test.ts:91-102`), so a placeholder naming a record has no value there while the app fills it.
- "reads an equation out of every slide that writes one, as LaTeX that typesets": `expected 61 to be 56`. The test's second count (`writtenEquations`, `integrity.test.ts:75-85`) counts only a front matter `equation:`; the five `kind: equation` slides are drawn but not written that way: `manuscripts/covert-theory`, `manuscripts/bt-operator-theory`, `manuscripts/covert-applied`, `manuscripts/fed-multicellular-immune`, `archive/stopped/connectivity-motor-imagery` (`grep -rl '^kind: equation'`). The brief (item 2, line 40) puts a governing equation in the first slide's `equation:`.

## Brief item 4 and Decision 5: slides too tall

After every slide of the portfolio deck was shown once (Next through 1 to 124), the Findings view holds 94 findings `slide too tall: <title> runs <n> px past its frame of 1280 by 720 px`, and the Overview marks 90 tiles Too tall. Over: minimum 19 px, median 307 px, maximum 696 px. Only the title, section and closing slides of the portfolio deck and a few short slides fit. Slide 3 (ERP signatures) shows the cause: a sub line of two lines, a hook, five specs, the two-row callout, three Method items and Results below the frame's foot, the facts strip not reached.

Each finding, px over and the slide's title (cut at 34 characters), in the Findings view's order:

```
578 Federate What Transfers: Component
272 How stimulus type and task structu
653 Which representation clusters? A c
368 Finger abduction trajectory predic
401 Transparent and Robust: Interpreta
333 Applying Federated Learning to Blo
334 Decoding Sign Language Finger Flex
111 Editorial introduction 'The use of
402 On the Impact of Proprioception in
325 Optimizing Federated Block-Term Te
352 Personalized Federated Learning fo
314 The role of distinct ECoG frequenc
401 Finger movement and coactivation p
421 Neural Networks for Directed Conne
365 Single finger trajectory predictio
409 Source space reduction for eLORETA
253 Web Performance Characteristics of
235 Concatenation, embedding and shard
252 Modality-Specific Encoding with a
240 High-gamma band event detection im
223 Finger Movement Decoding: From Sou
60 Individual and Coordinated Finger
174 Modulation of LMPs using the gamma
299 Causal Graphical Modelling of Func
19 Reconstructing single finger traje
355 Algebraic Subtyping for Algebraic
296 An Information Theoretical Approac
324 Efficient compilation of algebraic
250 Towards a Core Language with Row-B
230 Towards a Core Language with Row-B
255 Household Survival: Immersive Room
296 Machine learning techniques for fl
72 Purpose-centric appropriation of e
534 An Interpretable Block-Term Tensor
572 An interpretable tensor model for
696 Behavior-Supervised Alignment for
592 Competing-Risks Modelling of a Wid
37 Development and Design of FLKit: A
598 HCCNet: A Self-Supervised CNN-Tran
372 Jointly localized spatiotemporal c
637 Privacy-preserving federated tenso
517 Private Coupled Descent: Dimension
645 Registration-Free Supervised Tenso
541 When Masking Meets Sparsity: COVER
666 You Don't Need the Black Box: Name
354 A risk ordering and an adaptive fo
266 Faithful Block-Term Tensor Multipl
391 Gauge-Aware Conformal Prediction f
413 Identifiability and erasure limits
266 Operator Learning for Ischemic Tis
317 A Soft-Sandpile Progression Operat
170 Cross-Dataset Selective Auditory A
297 ECG-AF (FAIR / Vandervoort)
156 Interpretable Atrial-Substrate Pro
536 Locating and excising a memorised
345 Towards a pretrained deep learning
152 Untapped Mathematical Primitives f
635 Prediction of hepatocellular carci
424 A Generalization Separation for Bl
475 MoBTE: A Mixture of Block-Term Spe
188 A Behavior-Aligned Transfer Framew
453 A Longitudinal Concept-Bottleneck
293 Agents that keep a multi-site clin
186 BTD Autoencoder
81 Clinical-AI Eval Artifacts
130 Coupled block-term tensor decompos
208 Federated Block-Term Neural Operat
159 Federated spatiotemporal tensor mo
150 FL Privacy Auditing
272 HCCNet FL Network (Sweden)
227 Measured, Not Asserted: A Position
419 Modality-Dropping Block-Term Fusio
552 Neural cellular automata with a bl
216 Operator-Theoretic MRI Harmonizati
344 Physics-Informed Structured-Tensor
159 Quantum Tensor / Quantum FL
379 Shared Latent SDE for Cross-Subjec
192 SSM Longitudinal Imaging
317 A multiway biosignal foundation mo
293 A phylogenetic reconstruction of t
164 Brecht FL Partitioning
563 Declared scope and precedence for
221 Digital twin for cardiovascular an
368 The 2025 PIHC proposal and the fun
273 FedLink: federated coupled block-t
230 FLoRank x HCCNet / Block-Term: str
272 HCCNet Pathology Networks
350 Trainable Loewner Layers for Signa
154 Faithful Block-Term Layer
167 Faithfulness-Preserving Federated
154 Jacobian-coupled block-term model
239 MS Lipid Handshake (BTD)
448 Causal Graphical Modelling of Func
307 Federated Block-Term Decomposition
```

## Cases left to the look

- C12 (`ideas/fedlink`, no figure, no equation): no `.right` element, the one `.cols` child `left` 1023 px wide, the text across the whole width. Met. The slide is still too tall (273 px).
- C13 (`manuscripts/raw-pls`, slide 1 of 2): a `.right` column holding the KaTeX equation, no figure. Met.
- C15 (slide 3, text scale 1, frame 1280 px): `.facts` 12px, its label 10px, a Method item 13.5px (`getComputedStyle`). Met.

## Repair round 1, checkpoint 1

Same server, the builder's decks copied over the scratch hub by its approved rsync, the page reloaded, the portfolio deck picked and stepped through Next 1 to 188. The Findings view holds 26 distinct too-tall slides of the portfolio deck (deduplicated by file and slide; px over, deck, slide index):

```
2 manuscripts/raw-pls #0
268 manuscripts/raw-pls #1
2 manuscripts/bttn-incident-af #0
2 manuscripts/hccnet-revision #0
85 manuscripts/hccnet-revision #1
2 manuscripts/covert-theory #0
170 manuscripts/covert-theory #1
2 manuscripts/btfno #0
4 ideas/ssm-longitudinal #0
17 archive/published/2026/glassbox-decision-pipelines #0
18 ideas/fedlink #0
21 manuscripts/ecg-readable-substrate #0
334 manuscripts/ecg-readable-substrate #1
21 manuscripts/bt-operator-theory #0
140 manuscripts/bt-operator-theory #1
22 manuscripts/meseret-cirrhosis #0
137 manuscripts/meseret-cirrhosis #1
22 manuscripts/fed-multicellular-immune #0
259 manuscripts/fed-multicellular-immune #1
28 archive/published/2026/dongho-ecg-clustering #1
28 manuscripts/covert-applied #0
114 manuscripts/covert-applied #1
28 archive/stopped/connectivity-motor-imagery #1
20 manuscripts/clinical-hccnet #1
80 manuscripts/ward-bttr-crosssubject #1
271 ideas/cirrhosis-digital-twin #1
```

Sent to the builder as checkpoint 1's answer, with the ruling that every fact and figure stays, each project keeps at most two slides, and the text is written in fewer words.

## Repair round 1, checkpoint 2

The same procedure, after the page was reloaded and all 188 slides drawn: 17 slides are too tall (px over, deck, the line the slide starts on):

```
193 ideas/cirrhosis-digital-twin :26
181 manuscripts/fed-multicellular-immune :25
55 manuscripts/ecg-readable-substrate :25
38 manuscripts/covert-theory :25
35 manuscripts/covert-applied :25
28 archive/stopped/connectivity-motor-imagery :24
17 archive/published/2026/glassbox-decision-pipelines :1
4 ideas/ssm-longitudinal :1
2 manuscripts/ward-bttr-crosssubject :25
2 manuscripts/btfno :1
2 manuscripts/bt-operator-theory :1
2 manuscripts/raw-pls :1
2 manuscripts/covert-theory :1
2 manuscripts/fed-multicellular-immune :1
2 manuscripts/hccnet-revision :1
2 manuscripts/meseret-cirrhosis :1
2 manuscripts/bttn-incident-af :1
```

## Repair round 1, checkpoint 3

5 slides too tall:

```
141 ideas/cirrhosis-digital-twin :26
24 manuscripts/fed-multicellular-immune :25
11 manuscripts/covert-theory :25
2 manuscripts/fed-multicellular-immune :1
2 manuscripts/covert-theory :1
```

The round's checkpoint limit is raised from three to four so these are finished in the round; a fact stated twice (slide 1, slide 2, the facts strip, the plain-words box) may be kept once.

## Repair round 1, checkpoint 4

Measured after the builder's `npm run test:quick` ended (its svelte-kit sync reloaded the page while it ran), page reloaded, all 188 slides drawn: 3 slides too tall.

```
85 ideas/cirrhosis-digital-twin :1
2 manuscripts/covert-theory :1
2 manuscripts/fed-multicellular-immune :1
```

cirrhosis-digital-twin's slide 2 now fits; its slide 1 took the moved lines and runs 85 px over. The 2 px of covert-theory slide 1 is real overflow at the least factor 0.75: in the frame's own px the frame's inner height is 590 (clientHeight 718 less 64 + 64 padding), the content 521.7 and the facts strip 70.6, so the slide is 592.3 tall (measured in the page with `getBoundingClientRect` divided by the scale 0.861).

## Landing

Server 8799 from the O151 worktree over the scratch hub (`$S/O151look/home/workspace/research-hub`), the decks copied in with `rsync -a .agents/hub/projects/ $S/O151look/home/workspace/research-hub/projects/` after each change, the page reloaded before each measure.

Deck fixes at landing, each fact kept:

- The three slides too tall at checkpoint 4 (cirrhosis-digital-twin, covert-theory, fed-multicellular-immune) shortened in their own words; cirrhosis-digital-twin rewritten over its two slides (two method items, four one-line results, the iDT and Outcomes items on the left of slide 2, the three calls on its right).
- ecg-readable-substrate: hook, slide 2 heading and the CODE-15 to MIMIC line; individual-reference-intervals: purpose line.
- Figures on the second slides. The look found the figures of clinical-hccnet, raw-pls, ward-bttr-crosssubject, hccnet-revision and dries-bttr-ecg drawn small. A Markdown image on a columns slide is drawn no taller than the room its column leaves, and the text is drawn at the largest size that fits (`docs/decks.md`, "A slide is laid out in its deck's frame"), so the figure grows only as the text beside it shrinks. Items were moved into the text-only column and written in fewer words until that column is the one that fixes the size and the figure's column holds less text. Final sizes, design px:

```
clinical-hccnet         215 x 126
raw-pls                 216 x 152
ward-bttr-crosssubject  116 x  91
hccnet-revision         194 x 208
dries-bttr-ecg          250 x 182
```

ward-bttr-crosssubject stays the smallest: its text-only column holds 16 lines at the least factor, a 17th runs 2 px past the room, and with 16 the text is drawn at about 0.8 and the figure takes what is left.

Final measure: all 95 decks stepped slide by slide on 8799 after a reload (372 slides with the portfolio's), then System, Findings: `too tall: 0` (`document.body.innerText` matched for "slide too tall"). G14 from the gate over the same scratch hub: `Test Files 1 passed (1)`, `Tests 14 passed (14)`.

A reload during the look restored the Settings view, and the deck select's value was set there once; Settings showed "No unsaved change" and `find -mmin -5` over the scratch hub listed only `.oculus/transcript-cache.json`, so the look left no write.
