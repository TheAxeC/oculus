# Report: Q50, a web address written without a scheme is not a hub path

Builder a181fc7855d996f4e, claude:opus through the Agent tool, launched 04:05, reported 04:34.

Everything in the brief is done.

## DONE / NOT DONE

| Deliverable | Status | Command and output |
| --- | --- | --- |
| 1. A host-looking value is an address, not a path (`isHubPath`) | DONE | `npx vitest run tests/state/collection.test.ts tests/state/show-in-files.test.ts --reporter=dot` -> `Test Files 2 passed (2) / Tests 92 passed (92)` |
| 2. `hrefOf` follows the same rule | DONE | same run; the case is `puts https in front of a web address written without a scheme` |
| 3. The rule said in the comment above `ADDRESSED` | DONE | quoted under "Before and after" |
| Test 1, `isHubPath` over the eight values the brief names | DONE | red under both reverts |
| Test 2, `hubPathsOf` over a `url` | DONE | red under revert A |
| Test 3, `hrefOf` over the four values | DONE | red under revert B |
| `npx vitest run --reporter=dot` | DONE | `Test Files 251 passed (251) / Tests 4268 passed (4268) / Duration 78.92s` |
| `npm run check` | DONE | `COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | built twice, `done` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `> eslint .` and no further output |
| ASCII gate | DONE | printed nothing |
| Probe over the real hub | DONE | below |

Three earlier full-suite runs ended `Tests 1 failed | 4267 passed (4268)`, twice on `tests/server/git.test.ts > carries the newest commits, newest first, capped at the constant` and once on `tests/server/hpc/ssh.test.ts`; both files green when rerun alone (`Tests 39 passed (39)`), and `grep -c "state/collection"` in each is 0. The final full run is the green one in the table.

## The probe over the real hub

Read-only, written in the session scratchpad, not in the tree; walks the manifests, the registries, the collections and the built snapshot's entities and relations, collects every string at a `link`, `url` or `folder` key, and reads each by the old rule and the new one.

```
hub: /Users/axelfaes/workspace/research-hub
values at a link, url or folder key: 257
values read differently: 0
values still read as a hub path: 135
of those, with a dot in the first segment: 0
  control "github.com/TheAxeC/x" read differently: true
  control "www.example.org" read differently: true
  control "example.co.uk/a/b" read differently: true
```

No value in the hub changes meaning. The demo fixture is unaffected: every `url:` in `demo` begins `https://example.org/` and `grep -rn 'link:' demo` returns nothing.

## The reverts, run

**Revert A** (drop `!HOSTED.test(value)` from `isHubPath`): `Tests 2 failed | 90 passed (92)`, the two named cases, with `expected true to be false` at `tests/state/collection.test.ts:341` and `expected [ 'github.com/x' ] to deeply equal []` at `tests/state/show-in-files.test.ts:450`.

**Revert B** (drop the `HOSTED` line from `hrefOf`): `Tests 2 failed | 90 passed (92)`, with `expected '/api/file/hub/github.com/x' to be 'https://github.com/x'`.

The `isHubPath` case carries both reverts because it also asserts the older invariant at `tests/state/collection.test.ts:315`, that `isHubPath(v)` equals `hrefOf(v).startsWith('/api/file/hub/')`, over the eight new values.

## Doc text (neither file edited, per brief decision 2)

`HELP.md:82`, `HELP.md:86` and `DESIGN.md:338` stay true as written, since none of them enumerates what an address is. If the widened sense is to be spelled out, the clause for `DESIGN.md:338` is: `(not an address, a web address written without its scheme included, and not climbing above the hub)`.

`grep -rn 'HOSTED' src tests config HELP.md DESIGN.md README.md` finds the name only in `src/lib/state/collection.ts` and the three revert comments.

## Before and after

```ts
// before
/** A value that already names where it goes: a scheme, or an absolute path of the page's own. */
const ADDRESSED = /^([a-z][a-z0-9+.-]*:|\/)/i;

// after, with HOSTED and HOSTED_SCHEME beside it
const HOSTED = /^(www\.[^/]+|[^/:]+\.[a-z]{2,}(:[0-9]+)?\/.*)$/i;
const HOSTED_SCHEME = 'https://';
```

`hrefOf` gains `if (HOSTED.test(value)) return \`${HOSTED_SCHEME}${value}\`;` after the `ADDRESSED` return; `isHubPath` becomes `value !== '' && !ADDRESSED.test(value) && !HOSTED.test(value)`.

What a reader would see for a value of the new shape (`github.com/TheAxeC/x` in a `link`, `url` or `folder`): before, the card offered Show in Files, the Files view selected nothing and printed the not-there line, and the card's link went to `/api/file/hub/github.com/TheAxeC/x`; after, no Show in Files control and the link goes to `https://github.com/TheAxeC/x`. The same for a venue card's `link` (`views/venues/VenueCard.svelte:65`), the Person view's supervision folder (`views/Person.svelte:59`) and `programLink` (`views/collection/EntryCard.svelte:226`). No value in the hub has that shape today.

## Files changed

| File | Added | Removed | Total now |
| --- | --- | --- | --- |
| `src/lib/state/collection.ts` | 18 | 3 | 804 |
| `tests/state/collection.test.ts` | 31 | 0 | 836 |
| `tests/state/show-in-files.test.ts` | 8 | 0 | 570 |

`tests/views/collection.test.ts` and `tests/views/venues.test.ts` are unchanged: their cases that read the rule use `https://example.org/...`, which the change does not touch.

## Decisions the orchestrator may reverse

1. The scheme put in front is `https://` (brief decision 1), held in `HOSTED_SCHEME` at `src/lib/state/collection.ts:257`; user-visible, since it is where a press lands.
2. `HOSTED_SCHEME` is a literal in the state module rather than a config key, beside `HUB_ROOT` and `PAIR`.
3. A host with a port is matched but never decides anything today: `localhost:8790/x` is already an address under `ADDRESSED`, whose scheme class admits a dot. The `(:[0-9]+)?` can be dropped without changing an answer.
4. The `www.` branch takes any `www.<something>` with no slash requirement, which is what makes `www.example.org` an address on its own. `www.notes/plan.md` would also be an address; no such value is in the hub.

## Limitations and sharp edges

1. **A bare host with no path and no `www.` is still read as a hub path.** `github.com` and `example.org` alone still get Show in Files and a not-there line. A lone dotted segment cannot be told from a file name (`README.md` has the same shape), and the brief requires `README.md` to stay a path; telling them apart needs a list of top-level domains or of file extensions. Of the 135 hub values that still read as a hub path, 0 have a dot in the first segment at all.
2. **The mirror of the same ambiguity**: a genuine hub folder like `my.docs/notes.md` is now read as a web address and loses Show in Files. The probe measures that no such value exists in the hub.
3. The change is proven in the node suite only: the three functions are pure and have no DOM behaviour, and no selector, control name or markup was touched.
4. Two full-suite runs were red on files the step does not touch, each green alone, neither importing `state/collection.ts`.

---

# Repair round 1 (builder a181fc7855d996f4e, sent 05:30, reported 06:0x)

Everything in the five rulings is done.

**Raised for the orchestrator, one, user-visible:** the Person view's supervision-folder block now draws its heading and no body line when the `folder` value is not a path of the hub, because no listing is asked for one. The honest line there needs a new key in `config/text/views/person.yml`, a config file outside the builder's path list. Nothing in the hub hits it: `grep -n 'folder:' registries/people.yml` gives five values, all hub paths.

| Ruling | Status | Command and output |
| --- | --- | --- |
| 1. Venue link goes nowhere | DONE | `VenueCard.svelte:79` is now `href: hrefOf(linkPath ?? venue.link)`; `npx vitest run tests/views/venues.test.ts` -> 18 passed; revert C turns the new case red |
| 1b. Every venue link through `hrefOf` | DONE | `:87` is now `href: hrefOf(venue.call)`; revert G |
| 2. Every caller read and the wrong ones fixed | DONE | the table below |
| 3. The `ADDRESSED` comment says what the code does | DONE | quoted below |
| 4. `theaxec.github.io` stated as live | DONE | with its measurement |
| 4b. A case that prints every host-shaped value of the real hub | DONE | `npx vitest run tests/integrity.test.ts` prints `integrity: 256 link/url/folder values, 0 read as a web address, 0 dotted first segment`, 9 passed |
| 5. Decision 3 corrected, with a test on the port group | DONE | new case red under revert F |
| 5b. Files-changed numbers corrected | DONE | the reconstruction now reproduces `git diff 84fd99e1 --numstat` |
| `npx vitest run --reporter=dot` | DONE | `Test Files 251 passed (251) / Tests 4274 passed (4274)` |
| `npm run check` | DONE | `COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS` |
| `npm run build`, `format:check`, `lint`, the ASCII gate | DONE | built; Prettier clean; eslint silent; the gate printed nothing |
| The probe over the real hub, rerun | DONE | 257 values, 0 read differently, 135 still a hub path, 0 with a dot in the first segment |

## Every caller of the rule, and what each does with a scheme-less address

| Call site | What it does with `github.com/x` or `www.example.org/index.html` | Verdict |
| --- | --- | --- |
| `views/collection/EntryCard.svelte:128` `hubPathsOf` | no path, so no Show in Files and no "not there" line | correct, the step's own change |
| `views/collection/EntryCard.svelte:211` `isDocument` | **was wrong**: its own rule opened `www.example.org/index.html` in the document view under `HUB_ROOT`. Now `isHubPath(link) && /^[^:]*\.html?$/i.test(link)` | fixed, revert D |
| `views/collection/EntryCard.svelte:218` `openDocument` | reachable only behind `isDocument` | fixed by the above |
| `views/collection/EntryCard.svelte:226` `programLink` | `isHubPath` false, so no Open in its program control | correct already |
| `views/collection/EntryCard.svelte:358` `hrefOf` | `https://www.example.org/index.html`, `target="_blank"` | correct already |
| `views/venues/VenueCard.svelte:65` `hubPathsOf` | nothing, so no Show in Files | correct already |
| `views/venues/VenueCard.svelte:79` the site link | **was wrong**: rendered `href="github.com/TheAxeC/x"`, relative to the page | fixed, revert C |
| `views/venues/VenueCard.svelte:87` the call link | **was raw** `href: venue.call`, relative for any value without a scheme | fixed, revert G |
| `views/venues/VenueCard.svelte:92` the contact link | builds `mailto:` itself | correct already |
| `views/Person.svelte:59` `hubPathsOf` | nothing, so no Show in Files | correct already |
| `views/Person.svelte:62` the listing | **was wrong**: asked the hub for a host-shaped folder | fixed, revert E |
| `views/Person.svelte:120` `openFile` | built `${folder}/${name}`; now behind an early return | fixed with the above |

No other surface builds a hub URL out of a `link`, `url` or `folder`.

## `theaxec.github.io` is a live shape

It is a real top-level folder of this hub and the one `config/sources.yml` points into. `hrefOf('theaxec.github.io/_data/publications.yml')` answers `https://theaxec.github.io/_data/publications.yml`. Nothing is broken today: those are config keys and never pass through this rule, and the probe measures no value read differently. The new case in `tests/integrity.test.ts` prints every such value on every run and asserts nothing about what it finds; it carries one assertion (`values.size > 0`) only because `vite.config.ts:29` sets `requireAssertions: true`.

## The two corrected claims

```
  my_host.com:8080/x  isHubPath false  hrefOf https://my_host.com:8080/x
  github.com:8080/x   isHubPath false  hrefOf github.com:8080/x
  my_host.com:8080/x  ADDRESSED false  HOSTED with port group true  without false
  github.com:8080/x   ADDRESSED true   HOSTED with port group true  without false
```

The `(:[0-9]+)?` group is load-bearing: `my_host.com:8080/x` is an address only because of it, since `_` is outside `ADDRESSED`'s scheme class. `hrefOf('github.com:8080/x')` answers the value unchanged, a relative href, because `ADDRESSED` takes `github.com:` for a scheme; base behaviour, unchanged by this step.

## The reverts, rerun on the final tree

| Revert | Result |
| --- | --- |
| A, `!HOSTED.test(value)` out of `isHubPath` | 5 failed of 1045: the two state cases plus `views/collection.test.ts > draws an HTML link written as a web address`, `views/person.test.ts > asks the hub for no listing`, `views/venues.test.ts > sends a site link written without a scheme through hrefOf` |
| B, the `HOSTED` branch out of `hrefOf` | 4 failed of 1045 |
| C, site link back to the conditional | 1 failed: `expected ... to contain 'href="https://github.com/TheAxeC/x"'` |
| D, `isDocument` back to its own rule | 1 failed: `expected ... to contain 'href="https://www.example.org/index.h...'` |
| E, the listing back to the raw `folder` | 1 failed: `expected ... not to contain 'Reading the folder ...'` |
| F, the `(:[0-9]+)?` group out of `HOSTED` | 1 failed: `expected true to be false` on the port case |
| G, call link back to `href: venue.call` | 1 failed: `expected ... to contain 'href="https://conf.example.org/cfp"'` |

## Before and after

The `ADDRESSED` comment now reads: an address is a value carrying a scheme, a leading slash, or a host with a path behind it; a lone dotted segment stays a path inside the hub, since `github.com` and `README.md` are one shape and separating them would take the hub root's own listing, which lands after the card is drawn and would take a control away again.

`VenueCard.svelte`: `href: linkPath === undefined ? venue.link : hrefOf(linkPath)` becomes `href: hrefOf(linkPath ?? venue.link)`, and `href: venue.call` becomes `href: hrefOf(venue.call)`. No venue in the hub changes, since every `link:` and every `call:` carries a scheme.

`EntryCard.svelte`: `isDocument` becomes `isHubPath(link) && /^[^:]*\.html?$/i.test(link)`. A card whose `link` is `www.example.org/index.html` drew a control that opened the document view over `api/file/hub/www.example.org/index.html`; it now draws the anchor to `https://www.example.org/index.html` with `target="_blank"`.

`Person.svelte`: the listing is asked for the hub path and never the raw value, `openFile` returns early, and the markup's loading branch splits so `files === null` draws nothing.

## Files changed

| File | Added | Removed | Lines now |
| --- | --- | --- | --- |
| `src/lib/state/collection.ts` | 20 | 3 | 806 |
| `src/lib/views/venues/VenueCard.svelte` | 9 | 3 | 240 |
| `src/lib/views/collection/EntryCard.svelte` | 2 | 2 | 494 |
| `src/lib/views/Person.svelte` | 8 | 3 | 306 |
| `tests/state/collection.test.ts` | 38 | 0 | 844 |
| `tests/state/show-in-files.test.ts` | 8 | 0 | 570 |
| `tests/views/collection.test.ts` | 14 | 0 | 943 |
| `tests/views/venues.test.ts` | 20 | 0 | 446 |
| `tests/views/person.test.ts` | 15 | 0 | 315 |
| `tests/integrity.test.ts` | 46 | 0 | 220 |

`tests/views/person.test.ts` gains a fixture person `hosted` with `folder: 'theaxec.github.io/_data'`, the real host-shaped folder name.

## Limitations

1. A bare host still reads as a hub path, by the orchestrator's ruling that the shape-based rule stands; the reason is one clause in the `ADDRESSED` comment, and the integrity case prints any such value the day one appears.
2. A hub path whose first segment is a host reads as an address, the `theaxec.github.io` shape.
3. The Person folder block's silent body, the open item above; unreached by any value in the hub.
4. `hrefOf('github.com:8080/x')` returns the value unchanged, a relative href, base behaviour unchanged by this step.
5. The browser suite was not run by the builder; no selector, control name or markup class changed.
6. One full-suite run was red on `tests/server/hpc/ssh.test.ts`, green alone and in the two later full runs, and it does not read the changed modules.
