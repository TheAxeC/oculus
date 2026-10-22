# O54, repair round 1

The rules file, `agents/briefs/O54.md` and `agents/briefs/O54-cases.md` still hold. This round closes the findings of `agents/reviews/O54-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

## Rulings

1. **S1, feed entries by their internal id (items 1 and 5).** `src/lib/data/snapshot/hubs/feeds.ts` gives each feed entry (leads, Lit Watch, LinkedIn) its id by the merge's function, `<hub>:<title>` as `hubId` makes it, beside `root`. Every feed write names its entry by that id, and the server routes it by the id's hub part through the same function every other record write uses (`splitHubId`), with no `root` field on a write to an existing entry. `feedCursorId` (`src/lib/state/shared/page/idents.ts:29`) reads the entry's id rather than making one, or is removed where nothing then needs it. The callers are every file `grep -rln "writeFeedField\|feed-field\|feedCursorId" src` lists in the worktree (18 files at the base of this round, `LeadCard.svelte:110` among them); `docs/apps.md`'s feed-write section and the undo record of a feed write follow.

2. **B1, the refusal of a write that names no hub.** A record write whose id has no hub part (a bare key, a bare title) is refused with 400 and a new sentence under `server.write_route` in `config/text/server.yml` saying the write needs the record's hub, for feed and non-feed writes alike. A hub part no workspace folder carries stays the 404 of C16. The C16 row of `tests/routes/hubs/hub-routing.test.ts` asserts the 400 and its sentence for the bare key, the 404 for `nowhere:alpha`, and that nothing is written in either. `docs/apps.md` states both refusals. The sentence shows no joined `<hub>:<key>` (item 3).

3. **B2, the hub of a record the server creates.** The server's answer to a create (Add Lead, Add to Lit Watch, Add LinkedIn idea, Save to Literature, and every other create `writes.svelte.ts` sends) carries the new record's internal id, made from the hub it wrote. The client uses that id for the page it opens and for the entry it settles, at `writes.svelte.ts:418`, `:440`, `:480` and `:502` as they stand now. An optimistic entry drawn before the answer is keyed by the root the client sent; a create sent with no root draws no optimistic entry and shows the record once the answer names it. `look.primary()` is used at none of these places.

4. **S2, every saved field whose shape changed.** The report's item-3 list names every field of every file oculus writes under `~/.oculus` whose stored shape the step changed, each with its old form and its new form, found by grepping every use of `recordShape`, `recordItemsShape` and every other shape the step changed under `src/lib/state/` and `src/lib/data/shapes/`. At least these: the tab `{hub,key,label}`; `reveal` (`searchRevealShape`); a board's `expanded` and `more`; a collection's `more`; the map's `lines`; the card `cursor` (`layout/instance.ts:27`); the form draft `{kind,hub,name,edits}`; the LaTeX job target `{hub,key}`. The orchestrator changes `~/.oculus/layouts.json` and `views.json` once at landing from that list (ruling 238), so the list is the whole of it. No code reads an older form (`spec.md:43`).

5. **P1, C11's run.** Rerun the C11 probe against the final tree, importing `stateRecord` from where it is exported (`src/lib/state/shared/page/records.ts`), and quote that output. The probe stays in your scratch folder, not in the tree.

6. **P2, C12's muted half.** Add one probe line that mutes the finding's signature (7653ae880b67) in the scratch hub's config and shows the finding under `muted`, run on the base tree and on the final tree; quote both outputs.

7. **T1, `normalise-parts/links.ts:3-4`.** The head comment says a pair is written only when both ends are records known to the workspace's hubs, since `normalise.ts:610-626` hands `linked` the other hubs' keys.

8. **T2.** No work. After this round's last change the verify list runs once, as the brief's "Verify before you report" 1 says, and the report states how many times it ran.

## Paths this round writes

Every path of `agents/briefs/O54.md`'s "Paths this step writes", and:

- every file the grep of ruling 1 lists, and their tests
- `src/lib/server/edit/writes/hubs.ts`
- `config/text/server.yml`
- `docs/apps.md`
- `tests/routes/hubs/hub-routing.test.ts`
- `src/lib/data/snapshot/normalise-parts/links.ts`
- `.scratch/migration/agents/reviews/O54-report.md` (the report, rewritten whole)

## Report

Rewrite `.scratch/migration/agents/reviews/O54-report.md` whole: each ruling above with DONE or NOT DONE, the diff it made and the check that shows it; for ruling 1 and 2 each new or changed test row with its run on the tree before this round's change, failing, and after, passing; the S2 list in full; the P1 and P2 outputs; the verify lines.
