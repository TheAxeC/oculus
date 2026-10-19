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
24. `feeds/position-leads.yml:10-48`: the 34 log lines naming `/research-cockpit scout` stay as they are, each the record of a run (open item 153).
25. Memory, updated by the session: `research-cockpit-infra.md` rewritten as the record of a retired tool with its `MEMORY.md` line; `unicode-sweep-2026-08-24.md:18`, `feedback-no-unicode-in-python.md:14`, `repo-transferability-and-drive-move.md:25,80`, `feedback-deposit-self-contained-argfree.md:18`, `project-glassbox-decision-pipelines.md:19` point at oculus.

## Added by open items 154 and 155 (each ruled by Axel)

26. The hub data yml files move into `.oculus/data/` (`git mv`), and oculus's own default paths change to the same folders (`config/sources.yml:30-50`, `CAREER_FILE` of `src/lib/data/helpers/hub-names.ts:196`, the templates of `docs/templates.md`, `DESIGN.md:762`):
    - `research/`: `data.yml`, `venues.yml`, `statements.yml` (from `registries/boilerplate.yml`), `resources.yml`.
    - `pillars/`: `pillars.yml`, `domains.yml`.
    - `literature/`: `literature.yml`, `radar.yml` (from `feeds/literature-radar.yml`).
    - `people/`: `people.yml`, `organisations.yml`.
    - `academic/`: `career.yml`, `funding.yml`, `applications.yml`, `leads.yml` (from `feeds/position-leads.yml`), `education.yml`, `tasks.yml`, `joint-work.yml`, `events.yml`.
    - The hub's `.oculus/config.yml` loses its `collections:` block and `career_file`, which equal the defaults, and its writing globs (`:80-93`) name the new paths.
    - `registries/`, `feeds/` and `tasks/` are then empty and go; `funding/`, `education/`, `applications/` and `network/` keep their documents, and the `link:` fields, written from the hub root, keep working.
    - Every line naming an old path is changed: the hub `CLAUDE.md`, `README.md`, `CONTEXT.md`, `.gitignore`, `.oculus/tasks/litwatch.md` and `scout.md`, two `.md` under `applications/information/`, `.agents/skills/project-cleanup/SKILL.md`, `tools/skills/catalog.yaml`, the README lines of eeg-saad-challenge, linfoot-estimator, loewner and glassbox, oculus's `docs/data-map.md`, `docs/templates.md`, `DESIGN.md`, `docs/diagrams/`, `config/sources.yml` and the 35 test files whose fixture strings name them, and the 18 memory files that state a path.
    - `utils/migrations/migrate-joint-work.mjs` is deleted (migration code).
27. The three spread sets are gathered as `O38-recover.md` section 1 lists, with every file that reads them; the cluster moves follow `ssh utwente 'ls -la ~/data ~/data/archive ~/data/BraTS-METS'`, after `squeue -u $USER` shows no job of bttn-incident-af, covert-applied, ecg-readable-substrate, glassbox or raw-pls, and the cluster's code copies are rsynced before the next sbatch.
28. Under `~/data` on this Mac: `ecgfounder_net1d.py`, `hubert_dataset.py` and `hubert_ecg_inspect.py` deleted; the four folders of `O38-recover.md` section 1 registered.
29. The rice theme gets two rows under Settings, This browser, after Icons (`src/lib/state/system/config/other-rows/browser.ts:22-30`, `BrowserControl.svelte`), each per browser like Icons and acting on the rice themes alone: Brackets (buttons, chips and tags drawn in brackets, `ToolButton.svelte:463-494`, `Chip.svelte:167-193`, `Tag.svelte:85-93`) and Monospace (the UI font of `themes.css:47-67`; editors, code and terminals stay monospace). Every `body.rice` rule of `src/` is placed under Brackets, Monospace or the theme itself; the theme's small shape rules get no toggle.
30. After the landing, the session pushes the deposits of bttn-incident-af (`TheAxeC/bttn-incident-af`) and glassbox (`TheAxeC/robust-transparency-ecg`) through oculus's Deposit view (open item 155); covert-applied and ecg-readable-substrate, whose deposited files also change, are pushed only on Axel's word.
