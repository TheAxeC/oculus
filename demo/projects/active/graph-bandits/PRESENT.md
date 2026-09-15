---
present:
  tag: { class: measured, text: Measured }
  title: Probing the node that tells you most, on a graph that keeps moving
  sub: Bandit allocation under an evolving neighbourhood
  hook: A static-graph bandit spends its budget where the graph used to be informative.
  eli5:
    purpose: Decide which node to measure next when the graph changes while you measure it.
    plain: The method keeps a running estimate of how much each node would teach you, and shifts the budget as edges appear and vanish.
  equation: "R_T = \\sum_{t=1}^{T} \\left( \\mu^{*}_t - \\mu_{a_t,t} \\right)"
  specs:
    - { label: Regret, value: 0.42 vs 0.61 static }
    - { label: Seeds, value: 20 }
  panels:
    - diagram_html: "<div class=\"dgrid\" style=\"grid-template-columns:1fr 1fr\"><div class=\"dnode\" style=\"border-color:#2563eb\">probe<br><small>one node</small></div><div class=\"dnode\" style=\"border-color:#ea580c\">update<br><small>its neighbourhood</small></div></div><div class=\"darrow\">then reallocate the budget</div>"
      caption: One round of the loop.
      explain: Each round probes one node, updates the neighbourhood estimate, and reallocates the remaining budget.
  method:
    - Track a per-node information estimate that decays with edge churn.
    - Allocate the next probe by the decayed estimate rather than the raw degree.
  results:
    - Cumulative regret 0.42 against 0.61 for the static-graph baseline on synthgraph, 20 seeds.
slides:
  - id: ablations
    tag: { class: design, text: In progress }
    title: Which half of the method is doing the work
    hook: The decay term and the reallocation step are separable, so each is ablated on its own.
    method:
      - Drop the decay term and keep the reallocation.
      - Drop the reallocation and keep the decay term.
---

# PRESENT, Bandit algorithms over evolving graphs

The narrative body, which the deck draws only for a project that wrote no front matter.
