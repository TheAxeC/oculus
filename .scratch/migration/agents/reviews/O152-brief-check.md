# Step O152 brief check (on main at 1842b5751)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O152.md`. Pages are cited by section. Hits of a grep keep their `file:line`.

`.scratch/migration/plan.md` has no `## Goal` section (`grep -n "^## " .scratch/migration/plan.md` prints `5:## Steps, in execution order`, `1691:## Could run in parallel`, `1704:## Rulings`, `3567:## Agents`, `4414:## Blocked, and by what`). This check uses the goal the caller gave: the card's Venue tag reads the tier icon in the tier's colour with its label as tooltip, then name, quartile and JIF, without the cost. The standards are the rules file alone (`.agents/plan.yaml`: `standards: [.scratch/migration/agents/spec.md]`).

## 1. Names

- `venueText`: `git grep -n "venueText\|TierRow\|venueTiers" -- ':!.scratch' ':!config/local.yml'` prints `board/index.ts:22`, `board/items.ts:31`, `:147` and `presets.ts:673`. The one hit outside the paths is `src/lib/state/boards/board/index.ts:22`, a re-export. The change does not make it false.
- `TierRow`, `venueTiers`: the same grep. The hits outside the paths are `src/lib/views/shared/card/record/registry/LineCard.svelte:27,39` (`type TierRow`, `tiers: TierRow[]`), `RegistryPageCard.svelte:22,102` and `src/lib/views/structure/pillars/Pillars.svelte:50,84`. An optional `glyph?` does not make any of them false.
- The board item's `venue` type (`presets.ts:135`): `grep -rn "venue?*\.short\|\.venue\.short" src` and `grep -rn "item\.venue\|\.venue\b" src`. The hits outside the paths are `BoardList.svelte:73` (`short`), `board/facets.ts:60-62` (`id`, `short`), `board/state.ts:55` (`id`) and `tests/state/boards/board/hub-facets.test.ts:28` (`venue: null`). A field added to the non-null object makes none of them false.
- Glyph names `crown`, `target`: `git grep -n -w "crown"` has no hit outside `.scratch`. `git grep -n -w "target" -- config ':!config/local.yml'` prints `icons.yml:49 head: target` and `:86 focus: target`, which are icon-file values and stay true. It also prints prose words at `behavior.yml:66`, `findings.yml:23`, `linkedin.yml:25`, `data.yml:85,110`, `repositories.yml:83` and `venues.yml:7`, none of them a glyph name. No hit is made false.
- `venue_tiers` rows: `git grep -n "venue_tiers" -- ':!config/local.yml' ':!.scratch'`. The hits outside the paths:
  - `src/lib/data/shapes/catalog-files/vocab.ts:532-536`, the whole-file shape's description: "The tiers a venue's `tier` takes, best first, each with its colour; a tier with `assignable: false` is drawn but not offered." This sentence becomes incomplete. It names the colour and not the new glyph, while `radar_buckets`' description (`:538-543`) says "each with its glyph, words and colour". The file's head comment (`vocab.ts:1-3`) says "The descriptions say what the file's head comments and readers say each key holds", and item 1 rewrites that head comment to name the glyph. This path is not in "Paths this step writes".
  - `docs/data-map.md:123` (`# the tiers of venues, in order (whole)`) and `:206`: stay true.
  - `docs/templates.md:1141` (the venues schema `tier` help "flagship, strong or specialist."): stays true.
  - `docs/HELP.md:576`, `docs/data-map.md:82`, `vocab.yml:4`, `options/catalogs/vocab.yml:4`, `hub-names.ts:690,750`, `hub-keys.ts:41`, `vocab-keys.ts:209`, `in-place.ts:105`, `config-folder.test.ts:252` and `hub-vocab.test.ts:207,227,282`: all are about the whole-list merge, and all stay true.
- The Venue line of `docs/HELP.md:299`: `git grep -n -i "whole text\|venue's cost\|its cost\|the cost" -- docs README.md src config`. The only hit outside the paths for the card's Venue line is the head comment of `CardLinks.svelte:27-29`, "its whole text (its name with its quartile and the rest) as one tag with no press". It becomes false, but that file is in the paths. `HELP.md:312` "its whole text on hover" is about the list mode and stays true.

Findings: `src/lib/data/shapes/catalog-files/vocab.ts:532-536`, the `venue_tiers` description, no longer says everything a row holds once the glyph is added, and the path is outside "Paths this step writes".

## 2. The step line

- "the project card's Venue tag (`venueText`, `presets.ts:670-679`) reads the venue's tier icon, then its name, quartile and JIF": served by the "What to build" lead paragraph and items 3, 4 and 5.
- "without the cost text, which stays on the Venues view's card": served by item 4, the premise on `VenueCard.svelte:258-259`, and C8.
- "each `venue_tiers` row ... gains a `glyph:` naming a key of `glyphs.yml` (flagship `crown`, strong `star`, specialist `target`, unrated none": served by item 1.
- "the lucide icons added through `glyphs.yml` and `icons.yml` where missing": served by item 1 and decision 2.
- "described in `config/options/catalogs/vocab.yml`": served by item 2.
- "drawn in the tier's colour": served by items 3 (the tone) and 5.
- "with the tier's label as its tooltip": served by item 5.
- "(ruling 686)", that is "each `venue_tiers` row ... carrying its `glyph:` as `radar_buckets` does" (`plan.md:3561`): served by items 1 and 2.

Findings: none.

## 3. Premises

- CardLinks Venue kind at `:129-135`, plain `Tag` at `:179-185`, cross-link at `:186-196`: `sed -n 120,200p` and `grep -n "onpress === null\|<Tag\|crosslink" CardLinks.svelte` print `179: {#if onpress === null}`, `180: <Tag`, `187: <span class="crosslink">` and `194: <Tag ...>`. Matches. The brief leaves out one fact: the Venue tag never reaches the cross-link branch. `press()` returns `linkView(kind.key, funding)`, and `card.ts:89-93` gives `''` for every kind but `funding` and `team`, so for `venue` `press` returns null.
- `Tag` colours glyph and words through one `tone`: `cat Tag.svelte`, `:33` `--tone-txt: var(--c-${tone}-txt)` and `.tag.toned { color: var(--tone-txt...) }`. Matches.
- `venueText` at `presets.ts:670-680` (name, quartile, `JIF <n>`, `free`, joined by ` | `): `sed -n 660,690p` shows the doc comment at 670-672 and the function at 673-680. Matches.
- One caller `items.ts:147`, re-export `index.ts:22`, type at `presets.ts:135`, `BoardList.svelte:73`, haystack at `items.ts:91`: `grep -rn "venueText" src tests`, `grep -n "item.venue?.text" items.ts` and `grep -n "venue: {" presets.ts` print exactly those lines. Matches.
- `VenueCard.svelte:258-259` draws `venue.free`: `sed -n 250,265p` prints `{#if venue.free}` and `<Tag label={venue.free} tone={freeTone(venue.free)} />`. Matches.
- `vocab.yml:301-305` four rows, none with a glyph, and `radar_buckets` at `:307-312`: `sed -n 295,315p config/catalogs/vocab.yml`. Matches.
- `keyed` at `vocab.ts:12-24` allows `glyph`: `sed -n 1,30p` shows `const keyed = z.strictObject({` at 12 with `glyph: text.optional()`, and `:532-533` gives `venue_tiers: z.array(keyed)`. Matches.
- Palette lines `vocab.yml:32,33,40,47`: `sed -n 25,50p` shows `"#0d9488": c-teal` at 32, `"#0891b2": c-cyan` at 33, `"#7c3aed": c-purple` at 40 and `"#94a3b8": muted` at 47. Matches.
- `toneOf`, `paletteTone` at `tones.ts:198-221`: `grep -n "export function toneOf\|export function paletteTone"` prints `198` and `215`. Matches. The brief leaves out that `toneOf` answers `UNKNOWN_TONE = 'grey'` (`tones.ts:34`) for an unmapped hex and for `muted`, and that only `paletteTone` answers undefined.
- `TierRow` at `lines.ts:31-35`, `venueTiers` at `:282-307`, callers `Pillars.svelte:84` and `RegistryPageCard.svelte:102`: `sed -n 1,40p`, `sed -n 270,312p` and the grep in check 1. Matches. `TierRow` is also used by `LineCard.svelte:27,39` and `tierStrip` (`lines.ts:90`), which the brief does not name. Neither breaks.
- "A venue's tier is `Venue.tier` (`src/lib/data/model/model-entities.ts:419`)": `grep -n "tier" src/lib/data/model/model-entities.ts` prints `419: tier?: string;` inside `Project`, whose doc comment at `:416` says "The manifest's `tier`, the kind of project, a word of the vocabulary's `tiers`". The venue's `tier` is at `:549`, inside `export type Venue` (`:545`). **Differs.**
- `venue_tiers: WHOLE` at `in-place.ts:105` and `vocabOf` at `tones.ts:189`: `sed -n 100,108p` and the grep. Matches.
- The research hub sets no `venue_tiers`: `grep -n venue_tiers ~/workspace/research-hub/.oculus/config.yml` prints nothing (exit 1). Matches.
- `glyphs.yml:27` `star: "[*]"`, `:90` `venue: "<>"`, no `crown`/`target`; `icons.yml:26` `star: star`, `:89` `venue: diamond`, `:49` and `:86` `target`: `grep -n` prints exactly those. Matches.
- lucide ships `crown.svg`, `star.svg` and `target.svg`: `ls node_modules/lucide-static/icons/ | grep -E ...` prints all three. Matches.
- The stand-in rule at `catalogs.ts:116-148`: the doc comment at 117-118 and the check at 143-147. Matches.
- The use rule at `config-folder.test.ts:74-90`: those lines hold `NAMED` and the doc comment of `glyphReaders`, which says "a string value of any config file but the two that define the glyphs". The tests themselves are at `:472` and `:478`. Matches in substance.
- `Glyph` throws on an unknown name and is `aria-hidden`; `hasGlyph` at `text.ts:95`: `cat Glyph.svelte` and `grep -n "export function hasGlyph"`. Matches.
- Options entry at `options/catalogs/vocab.yml:390-402`, `radar_buckets` at `:403-415`, schema at `options.ts:198-201`: `sed -n 385,416p` and `sed -n 195,202p`. Matches.
- `docs/HELP.md:299` "and Venue, with its whole text"; `docs/templates.md:541-546` and `:548-552`: `sed -n 297,300p docs/HELP.md` and `sed -n 538,553p docs/templates.md`. Matches.
- Sizes: `wc -l` prints 252, 97, 243, 717, 312, 384, 132, 279 and 278. Matches.
- Item 1's "each in the group of the file where the tier and venue names sit": `grep -n "^  #\|^    #\|tier" config/catalogs/glyphs.yml config/catalogs/icons.yml` prints only group comments and no line holding `tier`. Neither file has a tier name. The `venue` name sits in "tab / section icons" (`glyphs.yml:86`, `icons.yml:85`).

Findings:
- The `Venue.tier` premise names `model-entities.ts:419`, which is `Project.tier`, the kind of project from `tiers`. The venue's field is `model-entities.ts:549`. A builder who follows the line reads the wrong field. The two words are easy to mix up here, since a project's `tier` is also read on cards.
- Item 1 places `crown` and `target` "in the group ... where the tier and venue names sit", but neither file holds a tier name. The group meant can only be "tab / section icons" (`glyphs.yml:86`, `icons.yml:85`), and the brief should say so.
- The brief's description of the cross-link branch is true for the card, but it does not say that the Venue kind is never a cross-link (`card.ts:89-93`). See check 5, item 5.

## 4. Cases and checks

- C1: consistent with the rules file's "Where you work" and "What every package obeys" (a builder runs no page, and the look is the proof). Its data is wrong. `grep -n -A14 "id: bspc" ~/workspace/research-hub/.oculus/data/research/venues.yml` prints `tier: specialist`, `jif: "5.7"`, `quartile: Q2` and `free: "free (subscription)"`. So BSPC draws the target in cyan with tooltip "specialist", and never the star in teal. A strong venue of the hub is `jbi` (Journal of Biomedical Informatics, `venues.yml:35-37`, `tier: strong`).
- C2: consistent.
- C3: consistent. The hub has no venue with `unrated`, no tier or an unknown tier: the tier count over `venues.yml` gives 25 flagship, 20 specialist and 25 strong. The look part therefore has nothing to show, and the case rests on reading.
- C4: inconsistent with the code. `grep -n "NO_JIF" presets.ts` prints `403: const NO_JIF = ['', '-', 'none'];`, so a JIF of `n/a` gives "<name> | JIF n/a" and not the name alone. Nothing in "What to build" changes `NO_JIF`. The hub writes `jif: "none"` (20 venues, by the jif count over `venues.yml`).
- C5: consistent; a case-run program is allowed by "What every package obeys".
- C6, C7: consistent with the test rule, but the brief does not say that G127's Code line gains the new unit. G127's Code line (`guarded.md:196`) names `hubVocabOf`, `hubVocabs`, `workspaceVocabs` and "the lookups of `tones.ts`". The tier join item 3 adds lives in `items.ts`, `presets.ts` or `lines.ts`, which no Code line names. The rules file ("What every package obeys": "An entry keeps one test per unit it covers: each ... file its text and its Code line name") puts a test only under an entry whose Code line names its unit. The brief should say that the orchestrator adds that unit to G127's Code line at landing. C7's "the `venue` glyph is drawn" is markup that item 7's state-level test cannot reach. That part's proof is the reading and the look, and the case does not say so.
- C8: asks for a look at `VenueCard.svelte`, a place the step does not change.
- C9: consistent.
- C10: consistent (G12; `config-folder.test.ts:472`, `:478`, `:494`).
- C11: consistent (the options entry is changed).

Findings:
- C1 names BSPC as a `strong` venue; the hub has it as `specialist` (`venues.yml:126`).
- C4 expects `n/a` to drop the JIF; `NO_JIF` (`presets.ts:403`) holds only `''`, `'-'` and `'none'`.
- C6/C7 put a test under G127 without saying that G127's Code line gains the tier join's file.
- C8 asks the builder to check a place the step does not change (`VenueCard.svelte:258-259`).

## 5. The question

- C1: no, the look shows the card. It cannot be run as written on the hub data, since BSPC is specialist.
- C2: no, the look shows the icon and colour.
- C3: no for the unrated and no-tier rows, since reading the code shows the fallback.
- C4: yes. It reads only `venueText` and says nothing of the icon. It covers only the text part, and as written its expectation is wrong (check 4).
- C5: yes. It guards the search, not the goal, by design.
- C6: yes. The test shows the board item's tier fields per hub; a card that draws the old `venue` glyph would still pass it. The look covers the drawing.
- C7: yes. The test shows that the state gives no tier icon; a `CardLinks` that passed the row's raw glyph name to `Glyph` would still throw at the look and pass the test.
- C8: yes. It looks at an unchanged card.
- C9: yes, for "by reading `glyphs.yml`". The stand-in exists in the file whether or not the card draws it, and the bracket rule of `Tag.svelte` (see check 6) is never read.
- C10: yes. `crown` and `target` count as used through `vocab.yml`'s string values whether or not anything draws them.
- C11: yes. It serves item 2, not the card.
- The check on the step's line: the plan's O152 line (`plan.md:1689`) names no check.
- Item 1: yes alone; data only.
- Item 2: yes alone.
- Item 3: yes alone (state). It also reads the tier row from the project's hub, which can give the wrong row for a venue of another hub (check 6).
- Item 4: yes alone.
- Item 5: this is the item that delivers the goal, and parts of it could pass without the goal:
  - "Both branches of `CardLinks`" can never be seen for the Venue tag, which is never a cross-link (`card.ts:89-93`).
  - "a `title` on the element around it" gives a tooltip that never appears on keyboard focus. The card's own facts row gives every tip through `ui/menu/Tooltip.svelte` (`CardFacts.svelte:16`, `:81-123`), whose head comment says "The browser's own `title` is what this replaces" (`Tooltip.svelte:7-9`). The rules file's "The principles every package is judged on" asks to reuse what exists.
  - "as its accessible name" can be met by an `aria-label` on a plain `span`, which has the generic role and whose name screen readers need not expose. This is a judgment from ARIA 1.2's naming rules and is not run here. The item names no role or hidden text that would make the name read.
  - "a colour the palette does not map draws the glyph muted" holds only with `paletteTone`. With `toneOf`, which the brief leaves open, the glyph is `grey` (`tones.ts:34`, `:198-199`).
- Item 6: yes alone.
- Item 7: yes (state only, as for C6).

Findings:
- Item 5's two-branch requirement covers a branch the Venue tag never takes.
- Item 5 dictates `title` over the card's `Tooltip` convention, so a keyboard user gets no tip.
- The accessible-name requirement can be met by a name that is not exposed.
- Item 3's "muted" expectation contradicts `toneOf`, one of the two functions it offers.
- C9's "by reading `glyphs.yml`" and C6/C7's state-level test can pass with a card that does not draw the tier icon.

## 6. Implied inputs

- A hub whose `venue_tiers` rows carry glyphs beside a hub whose rows carry none (a hub that replaced the list whole without `glyph:`): missing. C6 has two hubs with different glyphs, not one with none. Expected: that hub's venues draw the `venue` glyph with no tier tooltip, while the other hub's draw their tier icons.
- A venue of another hub. A project of hub B whose `venue:` names a key only hub A holds resolves to hub A's venue (`resolveKey`, `src/lib/data/helpers/hub-names.ts:532-541`; `projectOf`, `snapshot/hubs/merge.ts:138`). Its `tier` word is written under hub A's `venue_tiers`. This is missing, and item 3 says to read "the vocabulary of the project's own hub". Expected under G127 ("Each hub's records are drawn under that hub's own vocabulary"): the venue is hub A's record, so the row is hub A's (`rootOf(venue)`). Otherwise the brief must rule it. A wrong answer draws the wrong icon and colour, or the fallback.
- A venue cross-link drawn inside its `ToolButton`: cannot happen for the Venue kind (`card.ts:89-93`). Item 5 asks for it; the case list correctly has none. Expected: not applicable, and item 5's sentence should be dropped or say so.
- The ASCII glyph mode with the terminal brackets on (`rice.brackets`): missing in part. C9 checks only the stand-in. `Tag.svelte` leaves its own brackets off when `bracketedGlyph(glyph)` holds (`text.ts:117-121`, `Tag.svelte:38-41`). `[^]` and `[*]` are bracketed and `(+)` is not, so a tier glyph drawn as `Tag`'s `glyph` reads `[^] name | Q1` for flagship and `[(+) name | Q1]` for specialist. A tier glyph drawn as markup outside `Tag` leaves `Tag`'s `glyph` prop empty, and gives `[^] [name | Q1]`, two bracket pairs. Expected: one bracket pair per tag under every tier.
- A tier colour the palette does not map (and `unrated`'s `#94a3b8`, which maps to `muted`, no `c-` token): missing from Cases, though item 3 states it. Expected: the glyph drawn in the tag's muted colour. This holds only with `paletteTone`, since `toneOf` gives `grey`.
- A project with no venue: missing. This happens in the hub. Expected: no Venue line, as today (`CardLinks.svelte:133`, `tags: []`).
- A venue whose tier row exists but whose glyph is empty (`glyph: ''`): missing. Expected: the `venue` glyph and no throw. `hasGlyph('')` is false, while `Glyph` with `''` throws through `glyph('')` (`text.ts:82-87`).
- A hub list with no `assignable: false` row: missing. Item 3 says "the fallback row (`assignable: false`), as the Pillars view counts it", but `tierStrip` counts under "the last row when none is the fallback" (`lines.ts:83-96`). Expected: a stated rule. Either the last row, which can carry a glyph, so an untiered venue would draw that tier's icon, or no tier icon.
- A hub `venue_tiers: []`: missing. Expected: no tier icon and the `venue` glyph. `tierStrip` guards `tiers.length === 0` (`lines.ts:94`), and a copy of its fallback line without that guard reads `tiers[-1]`.
- A folder that is no hub, or a workspace with no primary: `vocabOf(hub)` gives oculus's own words (`tones.ts:180-184`). Not a case; low cost. Expected: the shipped tiers.
- The test's glyph vocabulary: `tests/state/shared/hub-words.test.ts` never calls `setGlyphs` (`grep -rn "setGlyphs" tests` lists other files only). Under that test `hasGlyph` is false for every name until the case installs `glyphCatalog(config)`. This is not a missing case, but item 7 does not say it.

Findings: missing from Cases with an expected result to add:
- the hub without tier glyphs;
- the venue of another hub (and the hub whose row applies);
- the terminal brackets with a bracketed and an unbracketed tier stand-in;
- the unmapped colour;
- the project with no venue;
- the empty `glyph:`;
- the list with no fallback row;
- the empty list.

## 7. ADRs

- `test -d docs/adr && ls docs/adr || echo "no docs/adr"` prints `no docs/adr`, and `.agents/plan.yaml` names no `adr` key (`grep -n "^adr" .agents/plan.yaml` prints nothing). No record.

Findings: none.

## 8. Dictated text

- `crown: "[^]"`: `grep -n 'crown: "\[^\]"' .scratch/migration/agents/briefs/O152.md` prints `77:`. It holds under the rules file's "What every package obeys" (ASCII) and the stand-in rule (three printable characters). `[^]` is also the stand-in of `publish` and `scout` (`glyphs.yml:57`, `:101`), which no rule forbids.
- `target: "(+)"`: the same line, `77:`. It holds. `(+)` is also the stand-in of `green` (`glyphs.yml:147`), and it is not bracketed (see check 6).
- `glyph:` values `flagship` `crown`, `strong` `star`, `specialist` `target`: `grep -n '`flagship` `crown`' ...` prints `30:`. Holds.
- `icons.yml` rows `crown` to `crown` and `target` to `target`: `grep -n "maps \`crown\` to the lucide file"` prints `30:`. Holds; the files ship.
- `glyph?: string` on `TierRow`: `grep -n "glyph?: string"` prints `32:`. It holds under the rules file's "What every package obeys", where types must be strippable.
- `control: glyph`: `grep -n "control: glyph"` prints `20:` and `31:`. Holds.
- `JIF <n>`: `grep -n "JIF <n>"` prints `12:`, `36:` and `45:`. Holds; it is the existing format.
- `--c-<tone>-txt`: `grep -n -- "--c-<tone>-txt"` prints `37:`. Holds.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O152.md` prints nothing.

Findings: none.

## Declined to judge

- Whether the duplicate terminal stand-ins (`[^]` shared with `publish` and `scout`, `(+)` with the radar's `green`) read clearly on a card is the user's call on the look. No rule decides it.
- Decision 4 (an unknown tier glyph raises no finding) matches the Focus lanes' handling of an unknown `icon` (`docs/HELP.md:297`, "the Focus glyph for a row naming none or a name the glyph catalog lacks"). `focus_clusters` does raise a finding for a `glyph` naming no word of the text catalog (`sections/vocab.ts:5`, `:80`). Which pattern a vocabulary row should follow is a design call; it is left to the orchestrator.
- Whether `O147`, said in the state file to run beside O152, shares a path with this brief was not checked; it is outside this check's scope.

Agent usage: a43403bea8848ebc5, claude-opus-5-5, 223233 tokens, 61 tool uses, 10 min 42 s.

## Closed

Each finding is closed by a change to `agents/briefs/O152.md`:

- Names, `vocab.ts:532-536`: the path is added to "Paths this step writes" (lines 532-536), and item 1 asks for the description to name the glyph beside the colour, as `radar_buckets`' does; a premise names the description and the file's head comment.
- Premises, `Venue.tier`: the premise now names `model-entities.ts:549` inside `export type Venue` (`:545`) and says `:419` is `Project.tier`, a different word list.
- Premises, the glyph group: item 1 names the "tab / section icons" group of each file, where `venue` sits (`glyphs.yml:86`, `icons.yml:85`).
- Premises and The question, the cross-link branch: a premise says the Venue tag is never a cross-link (`card.ts:89-93`), and item 5 no longer asks for the two branches.
- Cases, C1: C1 now uses `jbi` (tier `strong`); BSPC, tier `specialist`, is C2 with its hub values.
- Cases, C4: C4 now uses `jif: "none"`, which `NO_JIF` drops; a premise quotes `NO_JIF`.
- Cases, C6/C7 and G127's Code line: item 7 says the orchestrator adds the unit the case tests to G127's Code line at landing; C7 says the card's part is checked by reading.
- Cases, C8 on an unchanged place: the Venues view case is removed; C8 is now the list with no fallback row and the empty list.
- The question, the `title` tooltip and the accessible name: item 5 uses `ui/menu/Tooltip.svelte`, the card's own tip, which shows on keyboard focus and gives the words through `aria-describedby`; a premise quotes it. Decision 7 records it.
- The question, `toneOf` against "muted": item 3 names `paletteTone`, an unmapped colour and `muted` giving no tone and the glyph muted; a premise states what each function answers; decision 7 records it.
- The question, C6/C7 and C9 passing without the card drawing: C9 is now a look at the bracket pairs on the card; C7's card part is read; the look covers C1, C2, C4, C9 and C9b.
- Implied inputs, the hub without tier glyphs: in C6 and item 7.
- Implied inputs, the venue of another hub: item 3 reads the row from the venue's own hub, `rootOf(venue)`, under G127; in C6 and item 7; decision 6; a premise names `resolveKey` and `rootOf`.
- Implied inputs, the terminal brackets: item 5 makes the tier glyph `Tag`'s own glyph and dictates the one-pair reading per tier; C9; decision 1; a premise names the bracket rule.
- Implied inputs, the unmapped colour: C9c and item 3.
- Implied inputs, the project with no venue: C9b and item 5.
- Implied inputs, the empty `glyph:`: item 3 and C7.
- Implied inputs, the list with no fallback row and the empty list: item 3 gives such a venue no tier icon, unlike `tierStrip`'s count; C8; decision 3; a premise quotes `tierStrip`.
- Implied inputs, the test's glyph vocabulary: item 7 installs it with `setGlyphs`; a premise says the test installs none today.
- Declined to judge, the unknown-glyph pattern: decision 4 now cites the Focus lane handling it follows.

Dictated lines added after the check, each held against `agents/spec.md` (ASCII, plain words): the bracket readings `[^] <text>`, `[*] <text>` and `[(+) <text>]` (`grep -n '\[(+) <text>\]' agents/briefs/O152.md`), which are stand-ins and the tag's text, holds; C2's `"<its name as the hub writes it> | Q2 | JIF 5.7"`, the existing `venueText` format, holds.
