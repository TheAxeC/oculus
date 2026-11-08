# O151: the read-only check of every deck against its sources

Five read-only agents read each of O151's 95 decks in the hub worktree `research-hub/.agents/worktrees/migration-O151` against the project's own sources (manuscript, `README.md`, `project.yml`, `CLAUDE.md`, the project's other text files) and listed every statement those sources do not state. Their lists follow, by deck, with the deck line and the kind: critique (the paper, a table, a figure or the draft called wrong, inconsistent, identical, or leaving something out), verdict (a judgment of a result), arithmetic (a range, count, sum, "best", reading of a chart or comparison the sources do not state), framing (a characterisation the sources do not give). The agents missed at least one statement (abduction line 32), and two of them read some long manuscripts in part, so this list is where O151's repair round 1 starts, not its limit.

Agents (general-purpose, 2026-11-08): a25f915611190cf20 (365349 tokens, 77 tool uses, 9.4 min), af530072313f63302 (112972 tokens, 67 tool uses, 9.1 min), a81be273ab90f9a2e (191061 tokens, 23 tool uses, 4.3 min), a29ce0e0774eee6a7 (235683 tokens, 29 tool uses, 4.1 min), ac6376a67648ea914 (331634 tokens, 87 tool uses, 8.8 min).

Totals: 31 decks, 70 statements, and the abduction title: 20 critiques in 10 projects, 5 verdicts, 23 arithmetic, 23 framings.

## Critiques of a paper or draft

- `archive/published/2025/go-bttr`: line 32 "...and the caveats in the reported tables"; line 39 "In the Utrecht table, subjects 2, 4 and 5 carry identical values for every finger and method; only subject 3 differs."
- `archive/published/2026/abduction`: line 32 title "What the abduction decoding shows, and where it is weak"; line 33 "...while its own sensor figure lists a thumb-index abduction sensor."; line 35 "The plot legend names the index-middle pair; the manuscript caption names the thumb-index pair of subject 2 in task 2."; line 37 "The text reports eBTTR significantly ahead of every method on every pair; the table leaves 12 of the 40 baseline cells unmarked, 10 of them CNN and LSTM."
- `archive/published/2025/fbttr-strategies`: line 35 "The manuscript reads the colour as Pearson correlation; its colour bar runs past -5 and up to 20."; line 39 "The rows labelled centralized BTTR in the strategy tables carry the eBTTR numbers of the main tables."
- `archive/published/2025/fermat`: line 40 "The hybrid FBTTR run returns the fully federated numbers exactly, 0.872 and 0.772."; line 47 "The text calls FBTTR's lead over FedAdagrad and FedProx non-significant; the table marks FedAvg and FedProx as significant."; line 48 "The ECoG case does not say how the recordings were split into clients."
- `archive/published/2026/hcc-modality-poster`: line 36 "...its DWI, T1-IOP, T2W and all-four values equal the pretrained encoder-head row."; line 46 "...the poster gives no intervals."; line 47 "The design comparison has single-group scores for DWI, T1-IOP and T2W only; DCE alone appears only in the single-group chart."
- `archive/stopped/connectivity-motor-imagery`: line 24 "Granger causality, information theory and the discussion are empty headings in the draft."; line 44 "listed twice as 0.14 and 0.2".
- `archive/published/2021/abstract-bci-meeting-2021`: line 24 "The estimate adds a lag-2 term from $x_3$ into $x_1$ and prints the lag-1 term from $x_2$ twice, as 0.14 and 0.2, against 0.25."
- `coauthor/published/2016/chi-household-survival`: line 24 "No user study is reported".
- `coauthor/published/2018/http2-web-performance`: line 48 "Three of the figures are reused from the authors' earlier paper."
- `manuscripts/ecg-readable-substrate`: line 39 "the submitted manuscript does not report this run".

## Verdicts on results

- `manuscripts/clinical-hccnet` line 34 "Diffusion-weighted and T1 in- and out-of-phase MRI hold up at every horizon".
- `archive/published/2021/volga-finger-trajectories` line 21 "The thumb is predicted far less well than the other two fingers."
- `archive/published/2022/extended-bttr-note` line 24 "Subject 3 shows no gain; BTTR edges eBTTR, 0.67 against 0.66."; line 33 "eBTTR predicts those movements, where BTTR, trained per cued finger, barely does."
- `archive/stopped/connectivity-motor-imagery` line 23 "The lag-2 terms come back smaller, and a spurious lag-2 link from $x_3$ to $x_1$ appears."

## The builder's own arithmetic

- `ideas/old-charges-stemmatology` line 38 "21 witnesses" (the sources give 20 manuscripts plus the editio princeps).
- `manuscripts/clinical-hccnet` line 24 "29 were at BCLC stage 0 or A at diagnosis" (the manuscript gives 13 and 16).
- `coauthor/published/2024/highgamma-event-detection` line 26 "Same 0.56 correlation, with rest variance down from 0.03 to 0.011" (no baseline value given; the variance is subject 1's).
- `coauthor/published/2025/pfl-ms-npj` line 11 "(73 authors)"; line 24 "Adaptive training takes longer for four of the five strategies"; line 48 "A. Faes is the sixth of 73 authors".
- `archive/published/2022/extended-bttr-note` line 37 "eBTTR r 0.43 to 0.82 ... BTTR 0.01 to 0.62".
- `archive/published/2025/fbttr-strategies` line 25 "AM, RF, LARS, CNN and LSTM stay lower on every subject mean; the best of them, LSTM..."; line 37 "only FedYogi falls significantly."
- `archive/published/2025/fermat` line 24 "best federated AUC 0.846 (FedAvg, FedProx)"; line 46 "FL4E hybrid runs spread from C-index 0.439 (FedProx) to 0.776 (FedAdagrad)."
- `archive/published/2025/go-bttr` line 11 "(8 authors)"; line 24 "eBTTR or BTTR falls significantly below Go-BTTR on five subject-finger pairs".
- `archive/published/2026/abduction` line 23 "single fingers 0.12 to 0.45 (subject 1); sign letters 0.12 to 0.42 and 0.32 to 0.49"; line 24 "eBTTR beats chance on every pair and AM, RF and LARS on most; CNN and LSTM are level on several pairs (LSTM 0.32 on subject 1 index-middle)."; line 25 "trained on single fingers and tested on the letters, r falls to 0.08 to 0.22"; line 38 "subject 1 reaches 0.07 to 0.28".
- `archive/stopped/connectivity-motor-imagery` line 22 "The lag-1 self-terms and the two links into $x_2$ come back within 0.07 of the truth."
- `coauthor/active/flkit` line 11 "(10 authors)".
- `archive/published/2017/icfp-src-poster` line 9 "brings the loops close to hand-written OCaml"; line 22 "Eff(PureOpt) stays within about 10% of OCaml; Handlers in Action peaks near 180%" (read off an unlabelled chart); line 25 "near native OCaml".
- `archive/published/2021/abstract-bci-meeting-2021` line 23 "Lag-2 self-terms shrink to $-0.4$ and $-0.28$ from $-0.7$ and $-0.5$."

## Framings the sources do not give

- `ideas/old-charges-stemmatology` line 38 "simultaneous contamination stays out of scope in the Bayesian and automatic work".
- `archive/failed/fed-faithful-ecg` line 9 "on real ECGs both hospitals learned the same parts, so nothing scrambled"; line 25 "No-go: real ECG components align across silos on their own" (the sources give this as the likely reason only).
- `coauthor/published/2024/highgamma-event-detection` line 9 "so the predicted finger moves only when the real one does".
- `coauthor/stopped/individual-reference-intervals` line 8 "Warn earlier that a patient is heading for a hospital readmission or for worse disease."; line 20 "The project folder holds only its manifest: no data, code or result was kept."; line 22 "Stopped in 2024 before a full paper for IEEE JBHI".
- `ideas/fl-privacy-auditing` line 18, `ideas/hccnet-fl-sweden` line 19, `ideas/hccnet-pathology` line 20, `ideas/quantum-tensor-fl` line 19, `ideas/ssm-longitudinal` line 19: "Nothing has run".
- `archive/stopped/algebraic-subtyping` line 8 "A type then says both what a value is and which effects it may trigger, and a more specific type can stand where a general one is asked for."
- `coauthor/active/flkit` line 5 "and bundles what a new group needs to run its first federation"; line 8 "train models together on data that may not leave their institutions"; line 22 "The toolkit is public on GitHub."
- `coauthor/published/2023/ecog-frequency-features` line 5 "Finger decoders usually take the whole ECoG spectrum".
- `active/novel-math-primitives` line 5 "this scan maps candidates that pass the first two on paper".
- `archive/failed/ms-lipid-handshake` line 30 "the uptake rise (p = 0.013) tracks general activation markers" (the README says "may track").
- `archive/published/2017/icfp-src-abstract` line 25 "Proposal: explicit types so rewrites cannot break typing".
- `archive/published/2017/icfp-src-poster` line 8 "Show that programs written with effect handlers can run as fast as plain code once compiled well."
- `archive/published/2022/block-term-tensor-regression` line 33 "BTTR and HOPLS differ significantly only on subject 3, where ACCoS-gBTTR wins"; line 35 "gBTTR and HOPLS follow the timing of each flexion but undershoot its peak."
