# D56 landing

Position: oculus migration plan, step D56 (the workbench) landed, step 337 of 340; next: D49 (the help pages cut) and D55 (roots as hubs), which this landing unblocks, then Q72 (the architecture re-read).

## Open items

None.

## Check before landing

`ListAgents` before the wip commit listed D56's reviewer over round 1 as completed and no D56 agent running; TaskStop found D56's builder already ended.

## Not done

Nothing inside D56's brief and the rulings on it. Not looked at in the page: a workbench whose root leaves the workspace (the hub root cannot be removed in the page; the report's RUN 7 holds it) and the Code theme menu (the report's RUN 6 holds it).

## What landed

The workbench, from base dee635dbd (105 paths, +2319 -623 against main). A workbench is a page that belongs to one folder. It is made from the new top-level `workbench:` arrangement of `config/layout.yml`: Files, Search, Repositories, LaTeX, Problems and the sessions list as tabs limited to the folder, and an empty documents pane where views opened from the workbench land first, also after a reload. It opens from a project, an entry page, Show in Files and the Files view's Open in New Files. The rail's Workbenches menu lists open workbenches with Close and Reset layout. A closed workbench's layout is kept by its folder. Reset all pages leaves workbenches alone. The five limited views say when the folder's root is not served. The Code theme menu offers the 19 VS Code themes.

## What was found

The review over repair round 1 found three points, closed at landing: the documents pane lost its mark when its last tab closed, so after a reload a pick split a new pane (fixed in `keptPane`; the reviewer's scenario now keeps 2 panes and the mark); Repositories and the sessions list called a served root not served while the workspaces load (fixed: both use `servesRoot`, as Search, LaTeX and Problems do); the report quoted no reuse grep for the round's new functions (closed by the same fix).

Fixes at landing: 5. The two code fixes above, the merge with main in `docs/configuration.md`, `docs/views.md` and `docs/window.md` carrying both sides, and the generated diagrams regenerated.

## Verification

Gate in `.agents/worktrees/gate`, `npm run diagrams && npm run test:landing`:

```
ok      ASCII gate (1.4 s)
ok      npm run lint (4.3 s)
ok      npm run format:check (26.0 s)
ok      npm test (142.7 s)
ok      npm run check, then npm run build, then npm run test:slow (276.0 s)
ok      npm run test:checks (324.2 s)
test:landing: 324.2 s; every command passed
```

The run before this one failed in the check, build and slow-test command; its output was not kept, and the three commands each passed alone before the rerun. Its cause is not identified (not verified). Main's 105 staged blobs equal the gate's by `git rev-parse`.

Look, on a scratch oculus from the gate (port 8796, HOME and a copy of `demo/` as the hub under the scratchpad): Open in New Files on `projects/active` made the workbench with its six tool tabs and an empty documents pane; the Workbenches menu listed it with Close and Reset layout; a file opened from the workbench landed in the documents pane; Search and Repositories showed "In hub/projects/active"; Close with unsaved text asked "Close the page active and the 7 tabs on it? Unsaved changes in project.yml." and Cancel kept the page and the text. The page behind the question is blank, which comes from the unchanged `Confirm` and `Modal` primitives. No A/B (`bench: []`).

## Agents

- Builder a98f8c8c562caa8d7 (claude-sonnet-5-5): 286,546 tokens, 70 tool uses, 11.0 min (first run and cases, stopped by Axel).
- Builder a6f65daca142e0c86 (claude-sonnet-5-5): 113,994 tokens, 285 tool uses, 72.3 min (the build); round 1 209,153 tokens, 377 tool uses, 70.8 min.
- Brief check ab76aa6336c81ae1d (claude-opus-5-5): 269,002 tokens, 103 tool uses, 13.1 min.
- Reviewer a17e012de19ee2885 (claude-opus-5-5): 346,450 tokens, 92 tool uses, 30.1 min.
- Reviewer over round 1 ad867f75f854aa81e (claude-opus-5-5): 299,026 tokens, 88 tool uses, 15.3 min.

The first report did not pass its bar (one repair round). Fixes at landing: 5. The builder disclosed one read-only `git status` against the no-git rule, and scratch runs of the earlier builder under the real HOME; the reviewer over round 1 found no trace of either in the worktree.

## Next

/spec D49 and /spec D55.
