# O86 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O86, the update tasks of every hub, landed 2026-10-26. Next: /spec O88 and O87; O84's report.

## Open items

- 479: which cards outside the project card draw the strip of projects. (a) a person's card, one strip of the projects whose team holds them; (b) a person's card one strip per role (Lead, Supervisor, Collaborator), an organisation's card the projects of its affiliated people, a resource's card the projects whose `compute:` names it; (c) none (the lazy option). Recommendation (b).
- 480: scheduling rulings 470 to 478 (and 479). (a) six steps O91 to O96 grouped by the files they change, and from now on a design open item carries its scheduling; (b) one step per ruling; (c) left unscheduled (the lazy option). Recommendation (a).
- 481: which side names the link between a project and an event, a teaching entry or an application. (a) `related:` stays on the entries; (b) the manifests name them and the entries lose `related:`; (c) no decision (the lazy option). Recommendation (a).

## Check of the agents

`ListAgents` at the landing listed one subagent running, O84's builder a6b9bb9efcca75eff; none of O86's brief check (a3bd147e859e9ce7f), builder (a932a66494c50d411) or reviewers (ad0866bc88d7625f3, a30581466148faabc).

## NOT DONE

Nothing of the step.

## What landed

The whole range from base bf27e33ff (one wip commit e23b4c057 of the builder's work), 54 paths, 1744 insertions and 1200 deletions:

- The Update tray offers each update task (Lit Watch, Scout, LinkedIn, Inbox) of every hub that holds its file under `.oculus/tasks/`, named by its hub when two hubs hold one, the primary first; a schedule or a press runs the task of the hub it names.
- A notice names the hub whose task ran when two hubs offer the task; the inbox notice names no hub; a hub seen for the first time posts no notice until its date moves.
- A save from the schedule dialog keeps a `hub:` the entry names.
- A hub's own snapshot carries the raw feeds, and only the merged snapshot's summary has `byHub`.

## Checks

In the gate worktree at main's head 7f7249aba, after `git cherry-pick -n bf27e33ff..migration-O86` (conflicts only in the generated `docs/diagrams/*`, taken from main and regenerated), `npm run diagrams && npm run docs:palette && npm run test:quick`:

```
ok      prettier (8.3 s): All matched files use Prettier code style!
ok      ASCII gate (9.1 s)
ok      svelte-kit sync (11.2 s)
ok      eslint (205.2 s)
ok      svelte-check (262.8 s): 1793050980897 COMPLETED 548 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (298.2 s)
FAILED  vitest (375.4 s)
FAILED  vitest slow (414.2 s)
test:quick: 431.5 s; failed: vitest, vitest slow
```

The two failures are a worker that did not start for `tests/ui/html.dom.test.ts` and a 20000 ms timeout in `tests/data/hubs/hub-portfolio.test.ts`, at a load average of 20.9 while O84's builder ran its tests; the step changes neither file, and alone they passed, 8 of 8 and 16 of 16. On main the gate's staged diff applied with `git apply --index`; each of the 54 staged paths is equal under `cmp` to the gate's file.

## Fixes at landing

- The doc comments of `normalise` and `placeClones` rewrapped at 100 columns, words unchanged.
- The doc comment of `runMemory` rewritten to say what the function does.
- `runMemory` forgets every task and hub pair the channel's message no longer carries, so a hub that leaves and a hub that later takes its name is a first sighting.

## The look

Scratch server on port 8797 from the gate over a workspace of two hubs: the tray lists "Lit Watch (research-hub)" then "Lit Watch (lab)" ("Last run: none yet"), the other tasks unnamed; Schedule... on lab's Lit Watch opens Add schedule with the name and task "Lit Watch (lab)"; a moved radar date posted "Lit Watch (research-hub) ran and has new results." with Open.

Seen and not traced: the browser console warns `state_proxy_equality_mismatch` from Svelte at each page load, with no stack; whether main before O89 warns too is not verified.

## Agents

Brief check a3bd147e859e9ce7f (claude-opus-5-5, 259309 tokens, 95 tool uses, 10 min 43 s); builder a932a66494c50d411 (claude-opus-5-5): 77328 tokens, 340 tool uses, 59 min 35 s, repair round 1 after the pause 352283 tokens, 5 tool uses, 7 min 3 s; reviewer ad0866bc88d7625f3 (claude-opus-5-5, 280671 tokens, 59 tool uses, 16 min 10 s); reviewer over round 1 a30581466148faabc (claude-opus-5-5, 236475 tokens, 49 tool uses, 14 min 16 s). The builder's first report did not pass its bar (one repair round of five items).
