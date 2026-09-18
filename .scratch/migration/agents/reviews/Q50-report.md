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
