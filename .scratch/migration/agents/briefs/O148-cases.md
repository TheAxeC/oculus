# O148, the cases ruling (round 0)

The brief `agents/briefs/O148.md` stands, with these two changes. Build items 1 to 7 now.

## C15, the person row, ruled

C15's person row is replaced by: "A person id the people registry lacks among the lead: not drawn, as the card does not draw it, since the merge drops a key no hub resolves and raises its finding (`src/lib/data/snapshot/hubs/merge.ts:130-132`, `:149`); a person whose record has an empty `name`: drawn by the person's key, as `personNames` draws it (`src/lib/state/boards/person.ts:48`). Checked by the deck route's test." The snapshot build's read of a deck (`src/lib/data/index.ts`, `deckProjects` and `decks()`) leaves out a person key its people registry lacks, so both readers give the same words. The venue half of C15 holds as written.

## The domain on the deck route, a defect inside the step

The server's `deckProject` (`src/lib/server/content/deck/read.ts:58-59`) passes `project.domainIds.at(0)`, an internal id (`hub:graphs`), and the reader (`src/lib/data/sources/deck/read.ts:191`) checks it against the registry's bare keys (`read.ts:103`, `Object.keys(hubDomainsOf(...))`), so every project with a domain raises `findings.deck.domain_unknown` on the deck route and its slides carry no domain. Fix it in this step: the reader compares and names the domain's key (`keyOf`), and the slide keeps the internal id the client's `domainTone` and `domainLabel` read; the snapshot build, which passes the bare manifest key, gives the same result. Add a case to your report, C21: a project deck whose project has a domain the registry holds, read through the deck route: no `domain_unknown` finding, and the slide's domain set; its first run on the unchanged tree is the run you already have (`base-run.txt`, `domain=(none)`). It is checked by the deck route's test (`tests/routes/docs/deck.test.ts`, under G32).

The paths of the brief cover both changes (`src/lib/data/sources/deck/read.ts`, `src/lib/server/content/deck/read.ts`, `src/lib/data/index.ts`, `tests/routes/docs/deck.test.ts`).
