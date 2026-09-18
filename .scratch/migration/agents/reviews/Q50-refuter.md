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
