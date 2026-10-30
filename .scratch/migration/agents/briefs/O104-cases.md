# O104, the first run's case, ruled

Read with `agents/briefs/O104.md`. The rules of your first message stand.

Case "An entry whose identity has a fault: Edit opens, and Save is off with the fault's words" is ruled by open item 598 (a):

- For a `shared` fault of a collection entry and an `unkeyed` feed entry, the case stands as written.
- For an entry with no key (an `empty` fault, or an entry of a file with a schema and no primary key), the Edit row is drawn disabled, its title the fault's words from `blockedBy`. Edit in File stays on, and it is where the key is written.

`src/lib/views/feeds/leads/Leads.svelte` is added to the paths: it hands `LeadCard` the entry's ident through a new `id` prop, as `RadarCard` takes one.

`case-run.mjs` and `case-table.py` in your scratchpad are scripts the brief did not approve. Write no further script, and name both in the report with what each computes.

Build from item 1.
