# O38: every deletion and every edit (open item 152)

## Delete (each on Axel's yes)

1. Delete `tools/cockpit/`.
2. Delete `tools/cockpit/dummy/AUDIT_AUTO.md` (untracked).
3. Delete `tools/cockpit/dummy/cockpit.html` (untracked).
4. Delete `tools/present/`.
5. Delete `tools/data/` (with open item 151).
6. Delete `tools/deposit/`.
7. Delete `.agents/skills/research-cockpit/`.
8. Delete `.agents/skills/remove-unicode/`.
9. Delete `.agents/skills/project-new/`.
10. Delete the links `.claude/skills/research-cockpit`, `.claude/skills/remove-unicode`, `.claude/skills/project-new`, `.codex/skills/research-cockpit`, `.codex/skills/remove-unicode`, `.codex/skills/project-new`.
11. Delete `~/Applications/Cockpit.app`.

## Edit a skill (on Axel's yes)

12. `.agents/skills/project-cleanup/SKILL.md`:
    - `:18`: "Layout standard: `tools/cockpit/DESIGN.md`" becomes the hub README's "Project layout and tiers".
    - `:31`, `:122`: "the cockpit glance" becomes "oculus's project card".
    - `:67`: "Rendered cockpit tabs" becomes "oculus's views".
    - `:126`, `:153`: "the cockpit read-limits" becomes oculus's `read_limits` (`config/behavior.yml:8`: `results` 300, where the skill says 240).
    - `:202`, `:220-221`, `:248-249`: `tools/deposit/deposit.py` becomes oculus's Deposit view.
    - `:255`: `python3 tools/cockpit/build.py` and `--selftest` become "the Audit view shows no readability finding for this project".

## Edit the user-level files (on Axel's yes)

13. `~/.claude/rules/no-unicode-in-python.md:10`: `tools/cockpit/data/config/glyphs.yml` becomes oculus's `config/catalogs/glyphs.yml`.

## Edit, as part of the step

14. `.agents/plan.yaml:12`, and the copy in `orchestrator-state.md:11`: `tools/cockpit` and `tools/present` removed from `worktree_paths`.
15. `.gitignore:123-124`: the `tools/present/present.html` lines removed.
16. `.oculus/config.yml:65`: `recover_command` removed (open item 151); `:87`: `tools/present/assets/**` removed from `writing_glyphs`.
17. `README.md:10,18`: Recover named in place of `tools/data/redownload.py`; `:60`: the clause on `tools/present/` removed.
18. `registries/data.yml`: as open item 151.
19. `funding/about-axel/README.md:3,22`, `about-axel.html:10,328`, `about-axel-meyfroidt.html:10,353`: "the same look as `tools/present`" and "reused from tools/present" become "the portfolio deck's look".
20. The `.depositignore` comment naming `tools/deposit/deposit.py` becomes "oculus's Deposit" in: `projects/archive/disproved/ms-lipid-handshake/code/.depositignore:3`, `projects/archive/nogo/jacobian-coupled-blockterm-dp/code/.depositignore:1`, `projects/manuscripts/dongho-ecg-clustering/code/.depositignore:1`, `projects/manuscripts/dries-bttr-ecg/code/.depositignore:1`, `projects/manuscripts/fed-multicellular-immune/code/.depositignore:1`, `projects/manuscripts/hccnet-revision/code/.depositignore:1`, `projects/manuscripts/meseret-cirrhosis/code/.depositignore:2`.
21. btfno: `admin/build_supplement.sh:4`, `CLAUDE.md:22` and `README.md:102`, `tools/deposit/deposit.py` becomes oculus's Deposit view.
22. `projects/archive/published/2026/glassbox-decision-pipelines/README.md:101`: the push command becomes oculus's Deposit view.
23. oculus `DESIGN.md:696,738` and the tests: as open item 151.
24. `feeds/position-leads.yml:10-48`: 34 log lines record runs as "(local `/research-cockpit scout`)"; each becomes "(scout task)", or each stays as the record of what ran. Axel's choice.
25. Memory, updated by the session: `research-cockpit-infra.md` rewritten as the record of a retired tool with its `MEMORY.md` line; `unicode-sweep-2026-08-24.md:18`, `feedback-no-unicode-in-python.md:14`, `repo-transferability-and-drive-move.md:25,80`, `feedback-deposit-self-contained-argfree.md:18`, `project-glassbox-decision-pipelines.md:19` point at oculus.
