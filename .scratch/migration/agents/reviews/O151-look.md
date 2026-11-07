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
