# O79, repair round 1

The review is `.scratch/migration/agents/reviews/O79-refuter.md`. Build each item below under the brief, `O79-cases.md` and `agents/spec.md`; every rule of your first prompt still holds. Read the whole review first. The items not listed here are ruled at the end and need no change from you.

## 1. One primary-key rule (Standards 2)

`manifestKey` in `src/lib/state/forms/schema.ts:119-124` repeats the rule of `primaryKeyOf` (`src/lib/data/model/model-collections.ts:89-99`) without its `UNKEYED_TYPES` exclusion, so a manifest schema that flags a field of an unkeyed type is keyed for the project form and unkeyed for every reader. Make the project form read the one rule: `writableField` asks `primaryKeyOf` (or one predicate both share), so the same flag gives the same answer everywhere. A test of the project form's writable fields over a flag on an unkeyed type, where the rules file's test rule calls for one.

## 2. The refusal names its cause (Behaviour 1)

`server.entries.no_primary_key` (`config/text/server.yml:294`) and the card line `collection.no_primary_key` (`config/text/views/boards/collection.yml:21`) say "its schema flags no one field with primary_key: true" for every file without a primary key, which is false for three of the five causes `primaryKeyOf`'s doc comment lists. Each refusal and the card line name the cause the file has, with the remedy for that cause:

- the schema flags no field;
- the schema flags two fields or more;
- the flag is on a field of a type that is never a key (`UNKEYED_TYPES`);
- the `collections:` entry names `primary_key:` beside a flag in the schema;
- the file has neither a schema nor a named `primary_key:`.

The cause is computed once, beside `primaryKeyOf`, and every refusal (`src/lib/server/edit/writes/entries.ts:242-245`, `src/lib/server/edit/feeds/feeds.ts:76-80`, `src/lib/server/edit/feeds/literature.ts:150`) and the card line (`src/lib/state/sessions/source/draft-entry.ts:66-67`, `src/lib/views/shared/forms/entry-file.ts:160`) read it. The words are in the catalog, in the style of the group each key sits in (`server.*` lowercase, no full stop; `collection.*` as its neighbours). Tests: the rows that already refuse on each cause assert the cause's own sentence.

## 3. The Position Leads Add refusals in their group's style (Behaviour 2)

The Leads Add refusals now read `server.feeds.entry_needs_key` ("An entry needs a {0}.") and `server.entries.key_taken` ("an entry with that {0} is already in the file"). The second sits beside the sentence-case `server.feeds` refusals. Give the feeds Add its own key under `server.feeds` for a key already in the file, worded in that group's style (a capital, a full stop, as "This paper is in Lit Watch already." is), and leave `server.entries.key_taken` to the entry writes, which keep their lowercase style. Name both on-screen changes, before and after, under "Host- or user-visible changes" in the report.

## 4. A new entry in the schema's order (Behaviour 3)

No item asks for `renderEntry` to write the primary key on the `- ` line first. Write a new entry's fields in the schema's order, as the base did, and put `tests/server/edit/writes.test.ts:555-556` back to that order. A venue added to a file whose schema lists `name` before `id` is written `- name: ...` then `id: ...`.

## 5. Case 21 run (Proof 3)

Add a test that puts a collection keyed `projects` beside a schema field with `foreign_key: projects` and shows the field's choices and references are the manifests, not that collection's entries.

## Ruled, no change

- Spec 1: case 5 governs case 1; the definitions count rising from 44 to 61 is the expected result.
- Proof 1 and Proof 2: recorded; the rows read correctly. No first run on the base is asked for.
- Standards 1 and 3: recorded in the booking.
- Behaviour 4: the hub rewrite is applied at landing line by line from your report's list, never by copying the scratch files.

## This round

Run the cases of each item you change on the worktree, then `npm run test:quick -- --base a11f9f14` once after your last change. Append a section "Repair round 1" to `.scratch/migration/agents/reviews/O79-report.md` in the worktree: per item, the change with its file and lines, the test or run that shows it, and the verify lines. Your final message is that section's first line and the path.
