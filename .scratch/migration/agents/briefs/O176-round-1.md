# O176 repair round 1

Rules: `.scratch/migration/agents/spec.md`, as for the step. The brief `agents/briefs/O176.md` stays in force, the item 9 deck rules on every line. The review is `.scratch/migration/agents/reviews/O176-refuter.md`, also in the worktree's ledger at the same path. You write only in the two worktrees. This is the only round; nothing inside it is left for later.

## 1. Every slide fits (C10, item 7)

The orchestrator drew every deck of the hub worktree. These 22 slides are marked Too tall, each with the percentage of the frame's height it runs past (0-based slide index):

```
dongho-ecg-clustering #0 29
go-bttr #0 66
extended-bttr-note #0 60
block-term-tensor-regression #0 52
source-localization #0 25
bttn-incident-af #0 57
bttn-incident-af #1 3
dries-bttr-ecg #0 65
ward-bttr-crosssubject #0 71
ward-bttr-crosssubject #1 6
meseret-cirrhosis #0 66
meseret-cirrhosis #1 23
hccnet-revision #0 22
bttd-source-eeg #0 1
bttd-source-eeg #1 10
fed-multicellular-immune #1 6
raw-pls #0 36
sandpile-operator #0 73
clinical-hccnet #0 63
linfoot-estimator #0 34
bt-operator-theory #0 1
bt-operator-theory #1 9
```

The cause on the slides with a figure is in `src/lib/views/academic/present/screen/slide-layout.ts:27-29`: where the text at its least size leaves a wide figure no height, the figure is drawn whole under the text and the slide runs past its frame. All 15 figures stay in the deck; that is Axel's ruling.

What holds when you are done:

- A figure that its slide's text leaves no room for moves, with its `caption` and `explain`, to a second slide of the deck, as item 7 says for a deck that can no longer hold what it holds. The slide it leaves is then the slide it was before the figure came back, plus the facts of item 5. The second slide is `kind: project`, titled in the first slide's title form, and holds the figure and only as much text as leaves the figure room: in practice a hook or a short line or two, or none of the `method` and `results` lists.
- A deck that already has two slides puts the figure on the second, and moves text from the second to the first where the first has room. Two slides are the limit. A deck in which the figure and the kept facts cannot fit on two slides is named in the report with what does not fit, and nothing is dropped to hide it.
- A slide over by 10% or less with no figure (bttn-incident-af #1, ward-bttr-crosssubject #1, bttd-source-eeg #0 and #1, fed-multicellular-immune #1, bt-operator-theory #0 and #1) is shortened by rewriting its lines shorter or by moving a line to the deck's other slide, with every fact, number and qualifier kept.
- No figure is dropped, no fact of item 5 is dropped, and nothing is taken off a slide to make room unless it moves to the deck's other slide.

You run no page and start no server (`agents/spec.md`). The orchestrator measures again after your report, and what still runs over is fixed at landing, so leave margin: a slide you are unsure of holds less.

## 2. bt-operator-theory headline (Spec 1)

`projects/manuscripts/bt-operator-theory/present/main.md:23`: the headline needs back the class of targets the separation holds on, in the source's terms.

## 3. bt-operator-theory, the synthetic checks (Spec 2)

`:45` and `:34`: the sources do not say the checks match the corrected form. `code/synthetic_separation.py:29-30` builds the class as `d_BT = mu_band * K`, and `project.yml:22` lists rerunning the scripts as still to do. Rewrite both lines to what the sources state: what the scripts check, and that form.

## 4. ssm-longitudinal hook (Spec 3)

`projects/ideas/ssm-longitudinal/present/main.md:5` states a fault of another project's model, which item 9 forbids, and that model's manuscript reads otherwise (`manuscripts/hccnet-revision/manuscript/sections/3_methodology/b_architecture.tex:21`). Rewrite the hook from this project's own sources, and read `:20` with it.

## 5. The C8 table (Spec 4 and Proof 1)

Remake C8's table by reading: for each deck "no change", the source file and line where each number on the slide stands with its meaning, read in that source. Nothing the two shell searches printed is used, and no loop, script or search program produces the table; a `grep` for one number in one file, typed by hand and read, is fine. In pfl-ms-npj the T:18, T:22, T:23 and T:25 citations are author lines and are replaced by the real places. Any line whose number turns out to mean something else on the slide is corrected, with before, after and source.

## 6. Facts left off (Spec 5)

Report line 652 gives one reason for 14 decks. Replace it by one row per fact: deck, the fact as the O151 refuter's section "Facts in the round 1 snapshot, absent now" names it, and why it does or does not meet item 5's test. A fact that meets the test comes back, its source at file and line, and counts under finding 1's limits.

## Verify before you report

The brief's "Verify before you report" items once after the last change, C1, C2, C3 (with its "one or two slides"), C9 and the character sets, with `TMPDIR` unset for `npm run test:quick`. The report at `.scratch/migration/agents/reviews/O176-report.md` in the oculus worktree gets a section "Repair round 1": per finding what changed, every changed line before and after with its source, the verify lines, each deck that gained a second slide and why. No git command that writes.
