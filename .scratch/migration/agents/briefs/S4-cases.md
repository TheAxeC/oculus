# S4, the cases ruling (round 0)

The builder's first run found two cases the brief's rules get wrong. Rulings:

- R1 (C4, `usage_tiers` with a value 20): option (a). "A number is written as a number, read back as a number" is tested on `read_limits`, whose reader takes numbers. The `usage_tiers` 20 edit is a case of its own: refused, with the `usageTiers` reader's sentence, nothing written. `usageTiers` is not changed.
- R2 (C8, a value a reader refuses): option (a). The reader-refusal cases are a `themes` entry in `appearance.yml` with an unknown glyph (`themeFindings`) and `layout.yml` with `nav_groups.help` removed (`docFindings`). No new finding is added for a `nav_groups` glyph.
- The minor readings are confirmed: `audit_ignore` is exercised by C28; C33 asserts 409 `moved` worded `history.moved`; 14 `config.desc_*` keys move; C21's fixture is a views page whose status pane lacks gallery.
- The judgment calls are confirmed: an empty list item is a named problem that holds Save back; a dropped `config` tab keeps its id with state null; a `config` tab beside a `settings` tab is removed and the pane's active tab becomes that `settings` tab; the Catalogs and Texts groups come after the local.yml group.

The final report carries these rulings.
