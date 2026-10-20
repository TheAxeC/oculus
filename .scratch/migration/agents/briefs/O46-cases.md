# O46, round 0: the ruling on case 20, the write list and the premises the first run changed

Ruled by the orchestrator in automode (Z959), from the builder's first run (`agents/reviews/O46-report.md`). Where this file and the brief differ, this file holds.

## Case 20 and decision 4: a keyed list or a family in `settings:`

Decision 4 is replaced by this rule (Z959). Ruling 180's point 3 stands: a keyed list in the workspace file overrides oculus's list entry by entry.

1. A record list whose options entry names a field under `key:` (`rail` by `page`, `floats` by `view`, `latex.recipes`, `latex.tools` and `themes` by `name`, `focus.ticker_sources` by `collection`) is merged with oculus's list this way: each workspace entry replaces oculus's entry with the same key, or is added when oculus has none; the merged list holds the workspace's entries in the workspace's order, then oculus's other entries in oculus's order. An entry `{ <key field>: x, removed: true }` takes oculus's entry `x` out of the merged list and is not itself in it.
2. A map family (`nav_groups`, `editor.languages`, `boards`, `counts`, `usage_tiers`, `read_limits`, `open.program_ext` and the other families) is merged by its keys: a workspace key replaces oculus's key of the same name or is added; `x: null` takes oculus's key `x` out.
3. A record list without `key:` (`audit_ignore` among them) and every other value replace oculus's value whole.
4. Findings, each naming the workspace file and the key, oculus's value then standing for that entry: `removed` with a value other than `true`; `removed: true` on an entry whose key oculus's list does not hold; `x: null` for a key oculus's family does not hold; two entries of one list with the same key.
5. Every write that saves one of these values into `settings:` writes what the reader sees: every entry in the reader's order (the keyed lists) or every key (the families), then one `removed: true` entry or one `null` key for each of oculus's entries the reader took out. This covers the rail's drag and Hide (`src/lib/server/edit/writes/config/lists/rail.ts`, `src/lib/shell/rail/rail.ts` `railMoved` and `railHidden`), the audit mute write (`writes/config/lists/audit-mute.ts`, a list without `key:`, written whole) and the Settings list and family editors' Remove and Move (`src/lib/state/system/config/editors/draft.ts`, saved through `config-value`). Reset on such a key removes it from `settings:`.
6. The options entry's `help` for each keyed list and family says, in one sentence, how a workspace overrides and removes an entry; `docs/templates.md`'s `workspaces/<name>.yml` block shows one override and one `removed: true`, and `HELP.md`'s Settings bullets say it.

Case 20 then reads, and the builder's tests check: `settings: { arrangements: { focus: <a pane> } }` gives the workspace's Focus arrangement and oculus's for every other page; `settings: { rail: [{ page: focus, label: F }] }` replaces only the rail entry with `page: focus`, at the head of the rail; `settings: { rail: [{ page: focus, removed: true }] }` gives oculus's rail without `focus`; `settings: { counts: { x: null } }` gives oculus's `counts` without `x`; `settings: { audit_ignore: [x] }` replaces the list whole. Added cases: Hide on the `focus` rail button removes the button and the workspace file holds the rail with `{ page: focus, removed: true }`; a drag of a rail button keeps the new order after the config push; Settings' Remove on a shipped theme keeps it removed after the push; G96's case 'is marked saved once the file holds the empty family, until it is edited' holds with the family written as every oculus key set to `null`.

## The write list

"Paths this step writes" gains every file the moved-path grep names, so Verify 6 and item 12 can be met: each file listed by `grep -rln "catalogs/options.yml\|config/appearance.yml\|config/behavior.yml\|config/layout.yml\|config/present.yml\|config/sources.yml" src docs HELP.md DESIGN.md README.md` on the base (the builder counted 81 outside the brief's list), each changed only where it names a moved file or reads one, and each named in the report. This includes `src/lib/data/sources/collections.ts`, `src/lib/server/content/docs.ts`, `src/lib/server/edit/writes.ts` (`behaviorFile` and `layoutFile`: the rail write and the audit mute write go to the workspace file's `settings:` under item 3), `src/lib/server/machine/apps/read/across/stored.ts` (the findings on values stored for apps name the file the value now lives in), `src/lib/shell/rail/`, and the stylesheets under `src/lib/themes/`.

## Premises the first run changed

1. The workspace file's schema is built in `src/lib/server/root/watch/own-schemas.ts:24` from `workspaceFileShape` and is the same for every build. Item 3's `settings:` completion needs it to follow the merged config, so it moves into the build's schemas beside `engineSchemas`; `src/lib/server/root/` is already in the write list. Its five keys (`folders`, `folders[].name`, `folders[].path`, `folders[].repository_scan_depth`, `primary`) get descriptions under item 11.
2. `src/lib/data/sources/config/settings.ts` is 878 lines, so it is split by concern into files of its folder (already in the write list), every importer updated.

## The builder's other points

The first run of the 29 cases is accepted as the report gives it. The probes stay under `$TMPDIR/o46first/` and are rerun for the after values.
