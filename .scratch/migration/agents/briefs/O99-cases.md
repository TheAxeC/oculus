# O99, the round-0 cases ruling

Read with `agents/briefs/O99.md`. Each ruling replaces the brief's text it names; everything else in the brief stands.

1. Case 2 (hand-back A). The case becomes: "Primary hub scope, `literature.prefer` changed and saved: written into the primary's `.oculus/config.yml`, one History write; the Workspace scope does not draw `literature.prefer`, and the Primary hub scope does not draw `literature.timeout_s`." A key a scope's file does not take is not drawn in that scope, as item 1 says.
2. Case 16 and item 5 (hand-back B). The choice of a data file's primary key writes where the reader reads it:
   - `key_none` with no `collections:` mark, and `key_two`: `primary_key: true` on the field picked in the file's `schema:`, every other schema mark taken away.
   - `key_missing` (no schema): `primary_key: <field>` on the file's `collections:` entry in the hub's `.oculus/config.yml`; no `schema:` is added to the data file.
   - `key_beside`, and `key_none` whose `collections:` entry names a key: the schema flag on the field picked, and the `collections:` entry's `primary_key:` taken away; two files, each its own write and its own History record.
   - The fields offered are those the file's entries hold that are no list or map.
   - Case 16 runs all four.
3. Case 7 (hand-back C). The test that no route answer, channel push, History record or log holds a `downloads` secret needs a guarded entry, which is Axel's (open item 545). Build everything the case and item 3 ask, the secret handling included, and write no test for it until the ruling; the ruling comes to you in a message, and the report names the test as waiting on 545 if it has not come by then.
4. Decision 7 and case 22 (the note). Build them as the brief says: a page with no `views` key is read as having been given no view, the same default `docs` has (`src/lib/state/workbench/layout/model.ts:131-133`). That is the reading of an absent key, not a reader of an older form.
