# Review: Q50, a web address written without a scheme is not a hub path

Reviewer aae362464a67b5703, claude:opus, read-only, 04:18 to 05:10. Worktree `.agents/worktrees/q50`, base `84fd99e1`. Nothing was edited anywhere; every revert ran on a copy under the reviewer's scratch folder, and `git status --short` with `git diff 84fd99e1 --stat` was identical at the start and at the end.

## Verification, rerun

```
npx vitest run --reporter=dot        Test Files 251 passed (251) / Tests 4268 passed (4268) / 105.29s
the same, with the browser suite beside it   2 failed | 4266 passed: tests/server/git.test.ts and
                                             tests/server/hpc/ssh.test.ts, both green alone (39 passed),
                                             neither reading the changed module (grep -c is 0 in each)
npx vitest run tests/state tests/views       Tests 2096 passed (2096)
npm run check                        COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS
npm run build                        built, adapter-node
npm run format:check                 All matched files use Prettier code style!
npm run lint                         no output
the ASCII gate                       printed nothing
npx playwright test                  253 passed (5.4m), exit 0 (after waiting for port 8792)
```

Revert A (`!HOSTED.test(value)` dropped from `isHubPath`): `Tests 2 failed | 90 passed (92)`, `github.com/TheAxeC/x: expected true to be false` and `expected [ 'github.com/x' ] to deeply equal []`. Revert B (the `HOSTED` branch dropped from `hrefOf`): `2 failed | 90 passed`, `expected '/api/file/hub/github.com/x' to be 'https://github.com/x'`. Both together over the whole suite: exactly the step's three new cases go red, plus four that need the hub and git and fail because the copy sits outside both.

The reviewer's own probe, written independently over a strictly larger set than the builder's:

```
the 16 hub data files plus every project.yml (108 files)
values at a link, url or folder key: 674     read differently: 0
still read as a hub path: 43                 of those, with a dot in the first segment: 0
every .yml/.yaml in the hub (314 files)
values at a link, url or folder key: 799     read differently: 0
the demo fixture                             10 values, read differently: 0
```

## Spec

1. **The brief's fix text 1 is not delivered for a bare host, and the reason is a contradiction inside the brief.** `src/lib/state/collection.ts:254` requires a path behind the host, so `isHubPath('github.com')` is true and `hrefOf('github.com')` is `/api/file/hub/github.com`. Item 1's "a first segment carrying a dot and ending in a letters-only suffix" and its "a path whose first segment merely holds a dot (`README.md`) stays a hub path" cannot both hold for a single dotted segment: `github.com` and `README.md` are the same shape. The builder kept paths and wrote the other side up as a limitation rather than naming the clash.
2. A premise off by one: the brief says `ADDRESSED` is at line 241; `git show daa7129b:...` gives 242. Every other premise reproduces.

## Proof

3. **The report's "after" for the venue card is wrong, and the venue card is left with a broken link.** `src/lib/views/venues/VenueCard.svelte:79` is `href: linkPath === undefined ? venue.link : hrefOf(linkPath)`, so when the value stops being a hub path `hrefOf` never runs and the raw value is used. Rendered with a venue `link` of `github.com/TheAxeC/x`: after, `href="github.com/TheAxeC/x"` with no Show in Files; before, `href="/api/file/hub/github.com/TheAxeC/x"` with it. The href is relative, so the press lands under the page's own address, which is the 404 the `hrefOf` comment says the hub root exists to avoid.
4. **The report's decision 3 is false as written.** `isHubPath('my_host.com:8080/x')` is false and `hrefOf` gives `https://my_host.com:8080/x`; dropping the `(:[0-9]+)?` group makes it a hub path again. The group is unreachable only for a host whose characters all fit `ADDRESSED`'s scheme class. `github.com:8080/x` is taken by `ADDRESSED` first and returned unchanged, an unopenable href; that is base behaviour.
5. The probe's 257 and 135 could not be reproduced because the probe is not in the tree; the reviewer's own counts agree on the central claim (0 read differently, 0 with a dot in the first segment).
6. **The two ambiguities are not unclosable without a list.** A rule that closes both: ask whether the first segment is a name the hub root actually holds, which the file browser already reads through `readListing(HUB_ROOT, '')`. Over the real hub: 19 top-level folders, exactly one host-shaped (`theaxec.github.io`), and 12 top-level files, none read as an address. It would make `isHubPath` take the root's names, which touches the three view call sites.
7. Files-changed numbers: `git diff 84fd99e1 --numstat` gives `20 3`, `33 0`, `9 0`; the report says 18/3, 31, 8. The totals reproduce.
8. Within test 1's eight values only three change answer; the rest are guards, which is legitimate, and no test in the tree stays green while claiming the change.

## Standards

9. **The head comment above `ADDRESSED` (`:241-245`) claims more than the code does**: "an address is a value carrying a scheme, a leading slash or a host as its first segment" is false for `github.com`, which is a host as its first segment and is read as a path. The `HOSTED` comment two lines below is accurate.
10. Everything else: none. No history, no date, no package id in any added comment; the ASCII gate is clean; sizes 804, 836, 570; `HELP.md:82`, `HELP.md:86` and `DESIGN.md:338` stay true, since none enumerates what an address is.

## Behaviour

11. The venue card, as in finding 3: reader-visible, and the report states the opposite of what it does.
12. **`theaxec.github.io` is a real top-level folder of this hub**, and a path under it is now read as a web address: `hrefOf('theaxec.github.io/_data/publications.yml')` gives `https://theaxec.github.io/_data/publications.yml`. `config/sources.yml` names `publications_file: theaxec.github.io/_data/publications.yml` and `linkedin_dir: theaxec.github.io/_linkedin`, which are config keys and do not pass through this rule, so nothing is broken today. The report states this shape as hypothetical (`my.docs/notes.md`) when the hub has exactly one such folder and it is the one oculus's own configuration points into.
13. Two surfaces do not follow the rule, both base behaviour and both outside the brief's paths: `EntryCard.svelte:337` tests `isDocument` first, whose own rule at `:210` opens `www.example.org/index.html` as a hub document; `Person.svelte:60` asks the hub for a listing of a host-shaped `folder` while losing its Show in Files control at `:59`.
14. What the rule reads wrongly, measured through the module, with the judgment for each: `github.com` and `example.org` (finding 1); `192.168.1.1/x`, `example.com?q=1`, `example.com#top`, `github.com./x` (inherent, the brief says a letters-only suffix and the host branch needs a slash); `user:pass@github.com/x` and `github.com:8080/x` (base `ADDRESSED`, unchanged); `www.md` and `www.notes/plan.md` (inherent, the `www.` branch has no dot test, the report's decision 4); `my.docs/notes.md` and `theaxec.github.io/...` (inherent, finding 12); `../github.com/x` (base, `hubPathsOf` drops it, `hrefOf` does not normalise); `//github.com/x`, `mailto:x`, `data:text/plain,x`, `GitHub.COM/x`, `user@github.com/x` (correct). The shapes this hub could plausibly hold are a bare host, a host with a path, and a hub path whose first segment carries a dot.
15. No ReDoS: `isHubPath` over a 200,000-character value is 1 ms in each of four shapes; the regex has no nested quantifier.

## Not checked

The report's own three earlier red full-suite runs (the same end state was reproduced); the plan and state files; D22's own diff; the new rule pressed in a real browser against a value of the new shape, since neither the hub nor the demo holds one; `folder` carrying a host, whose one surface is the Person view.

Reviewer usage: about 71 tool uses, 52 minutes (04:18 to 05:10), of which roughly 25 waiting for port 8792.

---

# The run over repair round 1 (reviewer a25a40af12ad975b8)

```
npx vitest run --reporter=dot     Test Files 251 passed (251) / Tests 4274 passed (4274) / 81.91s
npm run check                     COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS
npm run build                     exit 0
npm run format:check              All matched files use Prettier code style!
npm run lint                      no output
the ASCII gate                    printed nothing
npx playwright test               253 passed (9.2m), exit 0
npx vitest run tests/integrity.test.ts --reporter=verbose
                                  integrity: 256 link/url/folder values, 0 read as a web address,
                                  0 dotted first segment
git diff --stat 84fd99e1          10 files changed, 193 insertions(+), 11 deletions(-)
```

The reviewer's own walk over the built snapshot, written independently: 328 occurrences at a `link`, `url` or `folder` key, 256 distinct, deepest at depth 5 of the case's cap of 12, 135 still read as a hub path, 0 read as a web address, 0 with a dotted first segment. A differential probe running every real value through all four changed surfaces: 67 venue `link`/`call`, 146 collection `link`/`url`, 5 people `folder`, and not one changes href, Show in Files, `isDocument` or the listing path.

All seven reverts were rerun; no test stays green under its own revert. The port case fails under revert F for the reason it names: `_` is outside `ADDRESSED`'s scheme class, so `my_host.com:8080/x` reaches `HOSTED` and only the port group matches it.

## Spec

1. **Ruling 3 is not met.** `src/lib/state/collection.ts:243-244` still claims to state the whole rule: "an address is a value carrying a scheme, a leading slash, or a host with a path behind it". `www.example.org` has none of the three and is an address (`isHubPath` false, `hrefOf` `https://www.example.org`, which the step's own case at `tests/state/collection.test.ts:337` asserts). The first review's finding 9 was the same sentence false for `github.com`; it is now false for the `www.` branch.
2. **Ruling 5b is marked DONE and still does not reproduce.** `git diff 84fd99e1 --numstat` against the round's table: `collection.ts` 22/3 vs 20/3, `tests/state/collection.test.ts` 41 vs 38, `show-in-files.test.ts` 9 vs 8, `views/collection.test.ts` 15 vs 14, `views/venues.test.ts` 22 vs 20, `views/person.test.ts` 16 vs 15, `integrity.test.ts` 49 vs 46. Seven of ten rows are short by the blank lines between the added blocks.
3. **Ruling 2 is complete for the three functions and short for the field.** The sweep over `hrefOf`, `isHubPath` and `hubPathsOf` is whole. Two other surfaces draw a `url` and decide address-or-not with their own rule, neither named: `src/lib/views/leads/LeadCard.svelte:177` and `src/lib/views/radar/RadarCard.svelte:151`, both `url.startsWith('http')`. A `url` of `github.com/x` now opens `https://github.com/x` from a collection card and draws no link at all on a lead or a radar card.
4. **The same question got two answers inside the round.** `EntryCard.svelte:211` uses `isHubPath`, which excludes an address but not a path climbing above the hub; `Person.svelte:59` uses `hubPathsOf`, which excludes both. A collection `link` of `../x.html` still passes `isDocument` and opens a document tab asking api/file for `hub/../x.html`, which `src/lib/server/files.ts:112` refuses. Base behaviour; the report lists `isDocument` as fixed without saying which half.

## Proof

5. **The report's revert A and B rows do not reproduce**: A gives 6 failed, not 5 (the port case is also red, since `isHubPath('my_host.com:8080/x')` goes back to true); B gives 6, not 4. Both runs are over `tests/state tests/views`, a subset of the report's own run.
6. The probe's 257 is not reproducible (the probe is not in the tree); the reviewer's own count is 256 distinct, which is what the integrity case prints. The 135 and the two zeroes reproduce exactly.
7. **The integrity case's set is the snapshot, not the hub.** Nothing sits outside `snapshot.entities` and `snapshot.relations` today and the deepest hit is at depth 5 of the cap of 12, so nothing is missed; but a value under a key the model drops never reaches the walk, and the case's comment reads as a promise over the hub's YAML. Of the 256, 92 are `entities.projects.folder`, which never passes through the rule at all (`ProjectCard.svelte:149` hands `project.folder` to `showInFiles` raw), so the printed count mixes fields that reach the rule with fields that cannot.
8. It cannot go green over a hub it failed to read: pointed at a directory that is not the hub, the case is red with `expected 0 to be greater than 0`.
9. The print names the values with their field locations, not only the count; both lists are empty today.

## Standards

10. **A false sentence in the comment block the round edited**, pre-existing at the base: `src/lib/views/venues/VenueCard.svelte:5-8`, "a path opens through api/file in this tab". The site link is built with `external: true` and rendered at `:145` as `target={item.external ? '_blank' : undefined}`, so it opens in a tab of its own, which is what `DESIGN.md:338` says. The round appended a sentence to that block and did not carry the correction.
11. Everything else clean: sizes 806, 306, 494, 240 and a largest test file of 943; the ASCII gate silent; no added line carrying a date, a package id or a word about an earlier attempt; no `.only` or `.skip`; `HELP.md:82`, `:86`, `:121` and `DESIGN.md:338` all still true.

## Behaviour

12. **The Person folder block: the report states the after, not the before, and one shape reaches a worse place.** `theaxec.github.io/_data` is a real folder of this hub, so before the change the block asked for it and drew its actual files; after, it draws a heading and nothing. A folder climbing above the hub drew `Reading the folder ...` and then the route's refusal; now it draws nothing. No person in the hub reaches either (all five `folder:` values are `education/student-supervision/<name>-2024`). The heading should be drawn; what is missing is one line saying there is nothing to list. The booking appears only in the dispatch block's note, not in the Open items list.
13. **The venue call link change does more than the report says**: a `call` that is a hub path now goes to `/api/file/hub/...` and opens the file, where before it rendered relative and opened nothing. It still gets no Show in Files control, since `linkPath` is computed from `venue.link` alone.
14. **The venue site link changes for one more shape, unstated**: a `link` that normalises to nothing or climbs above the hub was rendered raw and relative, and now goes through `hrefOf` to `/api/file/hub/../x`. Neither form reaches a file.
15. `isDocument` lets no new value in: the new rule is strictly narrower than the old one, proven over the 146 collection values, 0 changing.
16. `openFile`'s guard at `Person.svelte:119` is unreachable: a row is drawn only when `files` is non-null, which requires `folderPath` defined.

## Not checked

The new rule pressed in a real browser against a value of the new shape (neither the hub nor the demo holds one; the look is the orchestrator's); the builder's own probe script; the earlier red full-suite runs; whether api/file's refusal for a climbing path is what the document view draws; the plan and state files beyond Q50's dispatch block; ReDoS, which the first review measured.

Reviewer usage: 30 tool calls, about 22 minutes, of which the browser suite was 9.2 and the node suite 1.4.
