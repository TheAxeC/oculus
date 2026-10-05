# H3 landing: the hub's data map

Plan oculus/migration, step H3 landed on main; next: D42 (a file's history).

## Open items

- Z485, G36 for D23 (decision for Axel): the new guarded entry for language server lifetimes needs Axel's yes under Z392; options and recommendation in `orchestrator-state.md`.

## Agents stopped before the landing

`ListAgents` before the cherry-pick listed no agent of H3; the agents running belonged to X3f and S5.

## Not done

Nothing of H3.

## What landed

Booked 2026-10-05: the hub's data map landed on main from base e9822c082 (19 files, +520 -84): `docs/DATA-MAP.md`, the Data map in the Help group (h6) and the Help arrangement, `CONTEXT.md` and `README.md` pointing at it, the comments of `tools/oculus/config/sources.yml` and the hub data files made true, the help lines of the Venues and Pillars forms. /spec with a brief check, built, refuted, one repair round, refuted again, /land. The builder's first report did not pass its bar (the round). Fixes at landing, five, from the round review: Spec 1, the `slurm.resource` note is the brief's dictated text, with its added facts in sentences of their own and full paths; Spec 2, the Focus note and row say Focus draws the deadline of every live manifest and the follow-ups and subtasks of every manifest and collection entry, the registry files included (`ticker.ts`); Spec 3, a write refuses `id`, `tier` and `type` on every tier (`READ_ONLY`, `settable` in `yaml-edit.ts`); Standards 1, each link-table row whose function is outside `validate.ts` names its file; Standards 2, the edited comment paragraphs of `applications.yml`, `education.yml`, `funding.yml`, `network/events.yml`, `registries/data.yml`, `registries/domains.yml` and `registries/repos.yml` are one line each with no spaced hyphen (parsed YAML unchanged, `yaml.safe_load` compared before and after). Verification on main: `python3 tools/cockpit/build.py --selftest` SELFTEST PASS; `npm run diagrams` exit 0; `test:landing: 166.4 s; every command passed`. The look on TEST: the Views catalogue lists Data map at h6 in the Help group after HPC how-to; it opens as a Doc tab drawing the map with its 28 tables and the three corrected sentences; the Venues add form shows "journal or conference; the options are the venue_categories list of tools/oculus/config/catalogs/vocab.yml" and "prestige tier (curated, not JIF); the options are the venue_tiers list of tools/oculus/config/catalogs/vocab.yml" (before: "journal / conference - options from cockpit.yml venue_categories", "prestige tier (curated, not JIF) - options from cockpit.yml venue_tiers"); the Pillars add form shows the Colour help naming `tools/oculus/config/catalogs/vocab.yml` (before: `tools/oculus/config/vocab.yml`); both forms closed with Cancel, nothing written. Agents: builder a3b61954f94cb64a4 (claude-sonnet-5-5), 215,029 tokens, 174 tool uses, 24.5 min, with repair round 1; brief check a380d4e71bdd8a471 (claude-opus-5-5), 237,058 tokens, 82 tool uses, 10.4 min; reviewer adf7786fc0b6baf5c (claude-opus-5-5), 264,910 tokens, 98 tool uses, 14.1 min; reviewer over round 1 a663c6bd5d684da0a (claude-opus-5-5), 248,564 tokens, 71 tool uses, 10.3 min.

## What is next

D42 lands with its fixes at landing, the page-cost timing on HELP.md and a look.
