# The three setups compared: Opus or Sonnet builder, Opus or Sonnet reviewer

Axel ruled Z252 (b) on this comparison: Sonnet builders, Opus reviewers and brief checks.

## Sources

- Every subagent transcript under `~/.claude/projects/-Users-axelfaes-workspace-research-hub/*/subagents/` that names oculus (624 agents): model, input and cache tokens, tool uses, and active time (the spans from each prompt to the agent's last entry before it waits). Role and step come from the agent's prompt and description.
- Output tokens are taken per message as the larger of the recorded count and the visible text and tool input divided by 3.5, since the transcripts hold streaming snapshots and no thinking text; output is 5 to 10 percent of each group's cost, so every cost is a lower bound on both sides alike.
- Prices from the Anthropic pricing page (2026-10-02): Opus 5.5 $4 input, $5 and $8 cache writes, $0.20 cache read, $20 output; Sonnet 5.5 $2, $2.50 and $4, $0.20, $10, per million tokens.
- Landing time: the commit that added the step's landing report. Preparation time: the step's first preparation commit.
- Step size: the brief as committed at preparation, before any builder ran (its "Cases" and "What to build" counts).
- First report passed its bar, and fixes at landing: each step's landing report. First-review findings: counted by reading each first refuter report.
- Scripts: `scratchpad/fresh/` of the session (`dump.py`, `classify.py`, `compute.py`, `final.py`).

## Steps

- Opus builder, Opus reviewer (OO, 15, the last 15 before Sonnet builders): Q79d, Q101, Q86, Q87, Q82, Q81, Q96, Q79b, D13a, Q88, Q86b, Q103, Q83, D13b, Q86c.
- Sonnet builder, Opus reviewer (SO, 16): D13c, Q84, Q102, E1, E2, Q85a1, Q108, Q110, E3, Q111, Q106, Q107, S3a, X3d, S3b, Q109.
- Sonnet builder, Sonnet reviewer (SS, 15): S3c, Q85b, Q88b, D31, Q85c, U3, U4, D27, Q85d, Q35, Q66, L4, M4, D35, D24.
- Left out: Q85a4, U2 and Q85a2, whose first review ran on Opus and whose round review ran on Sonnet.

## Per step

Cells are median / mean. p: Kruskal-Wallis across the three groups, then Mann-Whitney per pair.

| Per step | OO (15) | SO (16) | SS (15) | p, all 3 | OO vs SO | OO vs SS | SO vs SS |
|---|---|---|---|---|---|---|---|
| Cost, all agents ($) | 22.7 / 25.0 | 17.8 / 26.5 | 30.9 / 39.0 | 0.038 | 0.33 | 0.068 | 0.021 |
| Builder ($) | 16.8 / 17.7 | 8.5 / 14.8 | 18.9 / 26.9 | 0.013 | 0.028 | 0.34 | 0.009 |
| Reviewers ($) | 6.2 / 6.4 | 5.6 / 7.0 | 7.6 / 7.5 | 0.49 | 0.62 | 0.53 | 0.24 |
| Brief check, survey, diagnosis ($) | 0.0 / 0.9 | 3.2 / 4.7 | 4.2 / 4.6 | <0.001 | <0.001 | <0.001 | 0.20 |
| Step time, first agent to landing (min) | 191 / 237 | 202 / 288 | 285 / 584 | 0.060 | 0.80 | 0.031 | 0.060 |
| Step time, preparation to landing (min) | 187 / 231 | 189 / 260 | 264 / 291 | 0.21 | 0.83 | 0.15 | 0.12 |
| Agent minutes | 115 / 118 | 103 / 152 | 215 / 251 | 0.002 | 0.95 | 0.001 | 0.005 |
| Builder minutes | 80 / 84 | 55 / 91 | 131 / 173 | 0.006 | 0.24 | 0.013 | 0.005 |
| Builder tool uses | 218 / 233 | 112 / 265 | 283 / 442 | 0.029 | 0.15 | 0.068 | 0.022 |
| Reviewer minutes per review | 14 / 15 | 14 / 15 | 28 / 28 | <0.001 | 0.62 | <0.001 | <0.001 |
| First report passed its bar | 1 of 15 | 0 of 16 | 1 of 15 | | | | |
| Steps with a second repair round | 2 | 1 | 0 | | | | |
| Fixes at landing | 6 / 5.4 | 4.5 / 5.1 | 3 / 3.8 | 0.18 | 0.56 | 0.055 | 0.29 |
| First-review findings | 11 / 12.9 | 9 / 10.5 | 12 / 11.3 | 0.34 | 0.21 | 0.65 | 0.25 |
| Total, all steps of the group ($) | 375 | 424 | 585 | | | | |

## Step size

| From the brief at preparation (median) | OO | SO | SS | p, OO vs SS |
|---|---|---|---|---|
| Cases | 15 | 25 | 21 | 0.035 |
| "What to build" items | 7 | 6 | 11 | |

Three SS briefs (Q88b, L4, M4) held no case list at their preparation commit and are left out of the per-case rows (n 12).

## Per case of the brief

Cells are median / pooled.

| Per case | OO | SO | SS | p, all 3 | OO vs SO | OO vs SS | SO vs SS |
|---|---|---|---|---|---|---|---|
| Cost ($) | 1.77 / 1.62 | 0.77 / 1.10 | 1.71 / 1.84 | 0.004 | 0.003 | 0.98 | 0.010 |
| Agent minutes | 7.6 / 7.7 | 4.5 / 6.3 | 11.7 / 11.7 | 0.003 | 0.015 | 0.12 | 0.002 |
| Step time (min) | 10.5 / 15.3 | 9.0 / 12.0 | 14.6 / 22.2 | 0.17 | 0.17 | 0.64 | 0.082 |

Per "What to build" item the three groups cost the same (p 0.86).

## What it shows

- Sonnet builder with Opus reviewer costs least per case of the brief and uses the fewest agent minutes per case, each different from both other setups at p<0.05; per step its median cost is the lowest.
- Opus with Opus and Sonnet with Sonnet cost the same per case (p 0.98). Sonnet with Sonnet uses the most agent time per case, and its reviews take twice as long (p<0.001).
- No quality measure separates the three: the bar, second rounds, fixes at landing and first-review findings are all p>0.05. Sonnet with Sonnet is lowest on fixes at landing (3) and second rounds (0), not distinguishable from chance at these counts.

## What it does not settle

- The steps were not assigned to setups at random, and the rules changed over the window.
- The SS steps ran at higher concurrency: a median of 3 builders running at the midpoint of each builder span, against 2 for OO and SO. That lengthens time and leaves token cost unchanged.
- Fixes at landing and first-review findings are counts made by reading the reports.
- The same steps built under each setup would settle what the above leaves open.
