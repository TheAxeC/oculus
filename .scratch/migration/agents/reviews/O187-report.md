# O187 report: a project card draws its repository's address

Everything in the brief is done.

## Open items of the state file, verbatim

`sed -n 175,188p .scratch/migration/orchestrator-state.md` prints the heading, blank lines and the closing note; the list holds no item:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run (unchanged tree) and after the change

Read on the unchanged tree: `CardAddresses.svelte` base lines 18 (`const links = $derived(item.project.links ?? [])`), 21 (`{#if links.length > 0}`), 23-35 (one `<li>` per entry, `posting(link)` decides `<a>` with `<Glyph name="link" />` or `<LinkedText>`); `ProjectCard.svelte` base lines 157-160 (`toClone`) and 256-268 (the Clone row). The base component reads neither `repository` nor `codeAvailability`. `posting` (`src/lib/views/shared/card/feed/posting.ts:12-17`) with `hrefOf` (`src/lib/state/boards/collection/index.ts:554-558`), `ADDRESSED = /^([a-z][a-z0-9+.-]*:|\/)/i` and `HOSTED = /^(www\.[^/]+|[^/:]+\.[a-z]{2,}(:[0-9]+)?\/.*)$/i` (`src/lib/data/places/hub-address.ts:22,30`), and `fileBytesUrl` (`src/lib/data/helpers/files/address.ts:33-39`, an answer that starts with `/`) decide every `posting` answer below.

Read after the change: `CardAddresses.svelte` lines 27-31 (`code`: the first of `repository?.url`, `codeAvailability?.url` whose trim is non-empty), 32 (`codeHref = posting(code)`), 38-43 (`same`), 46-48 (`links`: the `links:` entries that are not `same` as `code`), 51 (`{#if code !== undefined || links.length > 0}`), 53-67 (the code line, its own `<li>` outside the `{#each}`: `<a href={codeHref}>` with `<Glyph name="repositories" />` when `codeHref` is defined, else `<span class="words">` with the same glyph and the plain words), 69-82 (the `links:` lines as on the base); `ProjectCard.svelte` lines 157-162 (`toClone`).

No case is one the brief's rules get wrong; the step went on without a stop.

1. oculus (`repository.url: 'https://github.com/TheAxeC/oculus'`, `links: []`, read in `~/workspace/oculus/.oculus/project.yml:19,22-23`). Base: line 21 false, no list. After: `code` is the address, `posting` answers it (ADDRESSED), line 57-58 draw one link with the `repositories` glyph; `links` empty. One line. Holds.
2. fl-kit (`repository.url: "https://github.com/TheAxeC/fl-kit"`, `links:` one entry `https://github.com/UHasselt-BiomedicalDataSciences/federated-learning-toolkit`, read in the hub manifest lines 9-12). Base: one line, the `links:` entry with `link`. After: the code line first (53-67, `repositories`), then the entry (69-82, `link`); `same` is false, the two `posting` answers differ. Two lines. Holds.
3. Research project, no `repository:`, two `links:` entries (and no `code_availability.url`, as the case states no more keys). Base: two lines. After: `code` undefined (both candidates undefined), `links` unfiltered, two lines as on the base. Holds. With a non-empty `code_availability.url` the card draws three lines, by the ruling.
4. Neither. Base: no list. After: `code` undefined, `links` empty, line 51 false, no list. Holds.
5. `repository.url` also its one `links:` entry. Base: one line, the entry with `link`. After: `same` true by equal `posting` answers, the entry filtered out at 46-48, one line, the code line with `repositories`. Holds.
6. `git@github.com:TheAxeC/oculus.git`. ADDRESSED fails at `@`; HOSTED fails since `:T` is no port and no `/` follows the host; `hrefOf` gives `/api/file//git%40...`, which does not start with `http`, so `posting` is undefined. Base: no line. After: lines 62-65, the words with `repositories` and no link. Holds.
7. `''` or only spaces. Base: no repository line. After: `url.trim() !== ''` is false at line 30, `code` undefined, no line. Holds.
8. `repository:` with `visibility` and `clones` but no `url`. Base: no line. After: `repository?.url` undefined, filtered at line 30. Holds.
9. Project page vs board. Base and after: `ProjectCard.svelte` `blocks` (`:406-408` after) and `details` (`:410-415` after) both draw `<CardAddresses {item} />` (`grep -n "CardAddresses" src/lib/views/shared/card/project/ProjectCard.svelte` prints `47`, `407`, `411`). Same lines. Holds.
10. axeski (`repository.url: "https://github.com/TheAxeC/axeski"`, `links: []`, hub manifest lines 10-13). Base: no list. After: one link with `repositories`. Holds; the component reads no tier.
11. `git@github.com:2222/TheAxeC/oculus.git`. HOSTED matches (`git@github` `.com` `:2222` `/...`), `posting` answers `https://git@github.com:2222/TheAxeC/oculus.git`. Base: no line. After: lines 57-58, a link to that answer with `repositories`, its words the manifest's value. Holds.
12. `https://github.com/TheAxeC/x` and `links:` `https://github.com/TheAxeC/x/`. `posting` answers each unchanged, the two differ, `same` false. Base: one line. After: two lines. Holds.
13. `javascript:alert(1)`. ADDRESSED matches, `hrefOf` returns it, it does not start with `http`, `posting` undefined. Base: no line. After: the words with `repositories`, no link, no `href` drawn. Holds.
14. raw-pls (no `repository:`, `code_availability.url: "https://github.com/TheAxeC/registration-free-tensor-pls"`, hub manifest lines 34-37, no `links:`). Base: no list. After: `code` is the deposit's address (second candidate), one link with `repositories`. Holds.
15. algebraic-effects-compilation (`code_availability.url: /publications/other/effCompiler.zip`, hub manifest lines 19-21). ADDRESSED matches the leading slash, `posting` undefined. Base: no list. After: the words `/publications/other/effCompiler.zip` with `repositories`, no link. Holds.
16. Both keys. After: `find` at lines 28-30 takes the first candidate, `https://github.com/TheAxeC/a`; the deposit's address is not drawn. Base: no line. Holds.
17. `repository.url: '  '`, `code_availability.url: https://github.com/TheAxeC/b`. After: the first candidate fails the trim, the second is taken, one code line `https://github.com/TheAxeC/b`. Base: no line. Holds.
18. `code_availability.url` also the one `links:` entry, no `repository:`. Base: one line, the entry with `link`. After: `same` true, the entry filtered, one line, the code line. Holds.
19. `code_availability: { status: none }`. After: `codeAvailability?.url` undefined, no code line. Base: no line. Holds.
20. Menu, `repository: { url: '', clones: [] }` or `url: '   '`. Base: `block?.url !== undefined` true, `toClone` is `''` or `'   '`, the Clone row drawn with a tip naming an empty address. After: `url` trims to `''`, `toClone` null, no Clone row (line 258 `if (toClone !== null)`). Holds.
21. oculus with `clones: []`. Base and after: `toClone` is `https://github.com/TheAxeC/oculus`, the Clone row with that tip. Holds.
22. `url: ' https://github.com/TheAxeC/x '`, `clones: []`. Base: tip names the address with its spaces. After: `toClone` is the trimmed `https://github.com/TheAxeC/x`, the tip names it. Holds.

No case became a test: no entry of `agents/guarded.md` covers these lines and the behaviour needs a DOM. The look at landing takes cases 1, 2, 9, 10, 14 and 15 on the hub's own projects.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Code line from `repository.url`, else `code_availability.url`, trimmed non-empty | DONE | read, `CardAddresses.svelte:27-31`; cases 1, 7, 8, 14, 16, 17, 19 |
| Drawn as a `links:` line: link to `posting`'s answer in a new tab, else words with no link | DONE | read, `:55-66`; cases 6, 11, 13, 15 |
| Glyph `repositories` on link and words | DONE | read, `:58`, `:63` |
| Dedup by equal `posting` answers, else equal trimmed texts | DONE | read, `:38-43`, `:46-48`; cases 5, 12, 18 |
| Key no `links:` line can take | DONE | the code line is its own `<li>` outside the `{#each}`, `:53-67` |
| List drawn when either is there, not at all when neither | DONE | read, `:51`; cases 3, 4 |
| Head comment | DONE | `CardAddresses.svelte:2-10` |
| Clone row only for a trimmed non-empty `repository.url`, tip the trimmed address | DONE | read, `ProjectCard.svelte:157-162`; cases 20, 21, 22 |
| `npm run diagrams` then `npm run test:quick` (TMPDIR unset) | DONE | `test:quick: 54.8 s; every command passed` |
| ASCII gate over the three paths | DONE | perl command prints nothing, exit status 0 |
| `sh utils/unused-exports.sh` against the base list | DONE | `diff` with the base list prints nothing, `diff exit 0`; no line added |
| No test added or changed | DONE | the step adds or changes no test |

`npm run test:quick` printed:

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 12 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (10.1 s)
ok      svelte-check (31.5 s): 1794424442991 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (51.7 s): Duration  39.12s (transform 20.95s, setup 0ms, import 40.49s, tests 82.92s, environment 2ms)
test:quick: 54.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

The twelve test files it ran are `tests/checks/imports/{augments,cycles,order}.test.ts`, `tests/checks/source/{catalog-file-keys,comment-width,history,html-sites,keys,strip-types}.test.ts` and `tests/checks/tree/{boundaries,duplication,size}.test.ts`.

The ASCII gate: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/views/shared/card/project/CardAddresses.svelte src/lib/views/shared/card/project/ProjectCard.svelte .scratch/migration/agents/reviews/O187-report.md; echo "exit $?"` prints `exit 0` and nothing else.

`sh utils/unused-exports.sh` prints 334 lines; `diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O187-unused-base.txt <that output>` prints nothing. The step adds no export.

History-word grep over the added lines: `git diff -U0 -- src | grep -E "^\+" | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9]{2}-"` prints nothing (exit 1).

Name grep: `grep -rn "CardAddresses\|toClone" src tests config docs README.md` finds only `ProjectCard.svelte:47,157,258,262,407,411`. Helper grep before writing `same`: `grep -rn "export function \(same\|filled\|nonEmpty\|blank\|sameAddress\|isBlank\)" src` finds `same` only in `src/lib/server/core/changes.ts:191` (server code a view may not import, and a deep equality of values, not of addresses) and no address comparison; `posting` is reused.

Comments re-read: `CardAddresses.svelte` head comment, rewritten. `ProjectCard.svelte` head comment (lines 2-38), still true: it names no address line. The docstring above `toClone` ("The repository the project names that is not cloned anywhere yet: its address."), still true. `grep -n "links" src/lib/views/shared/card/project/ProjectCard.svelte` finds only lines 7, 28 and 59, about CardLinks and the cross-links strip, none about the address lines. No README, `docs/` guide or catalog paragraph describes the card's address lines or the Clone row's tip (`grep -n -i "repository\.url\|repository:\|Clone\b" docs/HELP.md docs/data-map.md docs/apps.md README.md` finds none that does).

## Files

From `git status --short` and `git diff --stat`:

| Path | Lines before | Lines after | In the write list |
| --- | --- | --- | --- |
| `src/lib/views/shared/card/project/CardAddresses.svelte` | 58 | 108 | yes |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 452 | 454 | yes |
| `.scratch/migration/agents/reviews/O187-report.md` | new | this file | yes |

`npm run diagrams` left no change in `git status --short`.

## Judgment calls the brief left open

1. The code line's words, where `posting` gives nothing, are plain text (`<span>{code}</span>`), not `LinkedText`, since the brief says "drawn as its words, with no link". A value such as `see https://x` in `repository.url` is therefore drawn with no link at all, where a `links:` entry of the same text would link its `https://x` run.
2. The words form is wrapped in `<span class="words">`, which takes the layout of `.links a` (inline-flex, centred, gap 4px) so the glyph sits beside the words as on a link; the existing `.links a` rule was split into a shared layout rule `.links a, .words` and the colour rule `.links a`, so the link keeps every declaration it had.
3. The code line's words are the manifest's value untrimmed, as the `links:` lines draw `{link}`; leading and trailing spaces collapse in the rendered line.
4. The code line is its own `<li>` outside the `{#each}`, so it needs no key.
5. `same` compares the two `posting` answers when either is defined and the trimmed texts only when neither is; since `posting` is a function of the trimmed text, equal trimmed texts always give equal answers, so both readings of "where `posting` gives nothing for either" give the same result.

## Host- or user-visible changes, before and after

- Projects board, a listing (`Listing.svelte` through `ProjectCards.svelte`) and the project page, for the oculus, axeski and fl-kit cards: before, oculus and axeski draw no address list and fl-kit one line with the `link` glyph; after, oculus and axeski draw one line `https://github.com/...` with the repositories glyph (`folder-git-2`, `[R]` in the terminal palette), a link opening a new tab, and fl-kit draws that line first and its `links:` entry second.
- The raw-pls card and the other deposited manuscripts with a `code_availability.url`: before, no address list; after, one line, the deposit's address as a link with the repositories glyph. The algebraic-effects-compilation card: one line, the words `/publications/other/effCompiler.zip` with the repositories glyph and no link.
- The card's menu: before, a manifest with `repository.url` empty or only spaces and no clone drew a Clone row whose tip named an empty address; after, no Clone row. A tip of an address with stray spaces names it trimmed. No manifest holds either today.
- Assistive technology: `Glyph` is `aria-hidden="true"` (`src/lib/ui/display/Glyph.svelte`, the box markup). Before, a `links:` web page reads as a link named by its address ("link, https://..."), and any other entry as its words, with web runs inside them as links; the code line is not drawn. After, the `links:` lines read the same, and the code line reads exactly like a `links:` line: a link named by its address, or its words. Nothing tells a screen-reader user that the first line is the repository or the code deposit; the distinction is the glyph alone, and a spoken label would need a text key, which the brief rules out.

## Limitations and sharp edges

- The Clone row's tip is trimmed, but the server's clone (`src/lib/server/git/clone/clone-routes.ts:113`, `cloneRepository` in `src/lib/server/git/clone/clone.ts:98-117`) passes the manifest's untrimmed `repository.url` to `git remote add origin` (`clone.ts:117`), so for case 22 the press runs git with an address carrying spaces; what git does with it is not verified. The build's match of a clone's origin to the address trims both (`addressKey`, `src/lib/data/sources/origin.ts:110`). The clone route is outside the step's write list; no manifest holds such a value today (the brief's own count).
- A twin that differs by a trailing slash, by case or by its scheme is drawn twice (brief decision 3; case 12).
- `git@github.com:2222/...` reaches the page as `https://git@github.com:2222/...`, `posting`'s answer for any `links:` entry of that shape (case 11).

## Anything in the brief that was wrong or impossible

Nothing. The brief's line numbers for `ProjectCard.svelte` (157-160, 256-268, 404-413) and its 452-line count matched the base; the file now holds `toClone` at 157-162 and the two snippets at 406-415.

## Runs

The verify list (`npm run diagrams` then `npm run test:quick`) ran once. No whole-suite command ran. Besides it: `npx prettier --check` and `npx eslint` over the two changed files, once each, both clean.
