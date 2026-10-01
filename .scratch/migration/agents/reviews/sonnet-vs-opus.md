# Sonnet 5.5 builders against Opus 5.5 builders

Builders switched from `claude-opus-5-5` to `claude-sonnet-5-5` at commit aceaeffe (2026-09-30 00:04). Reviewers and brief checks ran on `claude-opus-5-5` throughout, so the review bar is the same for both. Every figure below is read from the step's landing report, `agents/reviews/<step>-landing.md`, under its Usage or Agents' usage heading.

## Rows

Builder time and tool uses are the sum of every run of the builder (the cases hand-back, the build, each repair round). "Passed" is whether the builder's first report passed its bar.

| Step | Model | Builder min | Tool uses | Passed | Fixes at landing | Rounds |
|---|---|---|---|---|---|---|
| Q86 | Opus | 53 | 159 | no | 4 | 2 |
| Q87 | Opus | 32 | 112 | no | 4 | 1 |
| Q82 | Opus | 57 | 152 | no | 4 | 1 |
| Q96 | Opus | 95 | 137 | no | 3 | 1 |
| Q79b | Opus | 146 | 422 | no | 6 | 1 |
| D13a | Opus | 129 | 349 | no | 6 | 1 |
| Q88 | Opus | 79 | 294 | no | 6 | 1 |
| Q86b | Opus | 94 | 173 | no | 3 | 2 |
| Q103 | Opus | 24 | 42 | yes | 2 | 0 |
| D13b | Opus | 157 | 443 | no | 12 | 1 |
| Q86c | Opus | 76 | 151 | no | 3 | 1 |
| D13c | Sonnet | 49 | 103 | no | 3 | 1 |
| Q84 | Sonnet | 71 | 220 | no | 5 | 1 |
| Q102 | Sonnet | 144 | 457 | no | 9 | 1 |
| E1 | Sonnet | 23 | 57 | no | 15 | 1 |
| E2 | Sonnet | 59 | 118 | no | 5 | 1 |
| Q85a1 | Sonnet | 47 | 68 | no | 2 | 1 |
| Q108 | Sonnet | 20 | 56 | no | 1 | 1 |
| Q110 | Sonnet | 20 | 34 | no | 2 | 1 |
| E3 | Sonnet | 19 | 61 | no | 8 | 1 |
| Q111 | Sonnet | 44 | 106 | no | 4 | 1 |
| Q106 | Sonnet | 32 | 54 | no | 1 | 1 |
| Q107 | Sonnet | 147 | 311 | no | 4 | 2 |
| S3a | Sonnet | 80 | 283 | no | 4 | 1 |
| X3d | Sonnet | 283 | 1016 | no | 8 | 1 |
| S3b | Sonnet | 94 | 290 | no | 6 | 1 |
| Q109 | Sonnet | 118 | 298 | no | 5 | 1 |

## Totals

| | Opus (11 steps) | Sonnet (16 steps) |
|---|---|---|
| Builder minutes per step, median | 79 | 54 |
| Builder minutes per step, mean | 86 | 78 |
| Tool uses per step, median | 159 | 112 |
| First report passed its bar | 1 of 11 | 0 of 16 |
| Fixes at landing, median | 4.0 | 4.5 |
| Fixes at landing, mean | 4.8 | 5.1 |
| Steps needing a second repair round | 2 | 1 |

## Reading

- On review quality the two are indistinguishable on this record. Both models almost never pass the first review (1 of 11 against 0 of 16), and both leave four to five fixes at landing per step.
- Sonnet steps took less builder time at the median (54 against 79 minutes). The means are close (78 against 86) because of X3d (283 minutes) and two other long Sonnet steps, Q102 and Q107.
- Recommendation: keep Sonnet 5.5 builders with Opus 5.5 reviewers. The review stage catches the same amount behind either builder, and Sonnet is not slower.

## What this does not show

- The steps differ. No brief was built by both models, so step size and difficulty are not controlled. A blind A/B (one brief built twice from the same base, both diffs reviewed by one Opus reviewer that does not know the model) would settle it.
- Money cost is not measured. The token figure in each completion notice is not summed here, because what it counts is not verified: X3d's three runs each report 338k to 346k tokens whatever their length.
- The first review's finding counts are not tabulated, because the landing reports do not state them in one form.
- X3d's Sonnet row leaves out the earlier builder that was stopped (Z104). Q83, an Opus step, is left out because its landing report gives no usage.
