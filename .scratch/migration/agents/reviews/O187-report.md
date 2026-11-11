# O187 report: a project card draws its repository's address

Everything in the brief is done, with the four items of repair round 1.

## Open items of the state file, verbatim

`sed -n 175,188p .scratch/migration/orchestrator-state.md` prints the heading, blank lines and the closing note; the list holds no item:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

## The cases' first run (unchanged tree) and after the change

Read on the unchanged tree: `CardAddresses.svelte` base lines 18 (`const links = $derived(item.project.links ?? [])`), 21 (`{#if links.length > 0}`), 23-35 (one `<li>` per entry, `posting(link)` decides `<a>` with `<Glyph name="link" />` or `<LinkedText>`); `ProjectCard.svelte` base lines 157-160 (`toClone`) and 256-268 (the Clone row). The base component reads neither `repository` nor `codeAvailability`. `posting` (`src/lib/views/shared/card/feed/posting.ts:12-17`) with `hrefOf` (`src/lib/state/boards/collection/index.ts:554-558`), `ADDRESSED = /^([a-z][a-z0-9+.-]*:|\/)/i` and `HOSTED = /^(www\.[^/]+|[^/:]+\.[a-z]{2,}(:[0-9]+)?\/.*)$/i` (`src/lib/data/places/hub-address.ts:22,30`), and `fileBytesUrl` (`src/lib/data/helpers/files/address.ts:33-39`, an answer that starts with `/`) decide every `posting` answer below.

Read after the change: `CardAddresses.svelte` lines 26-30 (`code`: the first of `repository?.url`, `codeAvailability?.url` whose trim is non-empty), 31 (`codeHref = posting(code)`), 37-42 (`same`), 45-47 (`links`: the `links:` entries that are not `same` as `code`), 50 (`{#if code !== undefined || links.length > 0}`), 52-67 (the code line, its own `<li>` outside the `{#each}`: `<a href={codeHref}>` with `<Glyph name="repositories" />` when `codeHref` is defined, else `<span class="words">` with the same glyph and the plain words), 68-81 (the `links:` lines as on the base); `ProjectCard.svelte` lines 157-162 (`toClone`).

No case is one the brief's rules get wrong; the step went on without a stop.

1. oculus (`repository.url: 'https://github.com/TheAxeC/oculus'`, `links: []`, read in `~/workspace/oculus/.oculus/project.yml:19,22-23`). Base: line 21 false, no list. After: `code` is the address, `posting` answers it (ADDRESSED), lines 56-57 draw one link with the `repositories` glyph; `links` empty. One line. Holds.
2. fl-kit (`repository.url: "https://github.com/TheAxeC/fl-kit"`, `links:` one entry `https://github.com/UHasselt-BiomedicalDataSciences/federated-learning-toolkit`, read in the hub manifest lines 9-12). Base: one line, the `links:` entry with `link`. After: the code line first (52-67, `repositories`), then the entry (68-81, `link`); `same` is false, the two `posting` answers differ. Two lines. Holds.
3. Research project, no `repository:`, two `links:` entries (and no `code_availability.url`, as the case states no more keys). Base: two lines. After: `code` undefined (both candidates undefined), `links` unfiltered, two lines as on the base. Holds. With a non-empty `code_availability.url` the card draws three lines, by the ruling.
4. Neither. Base: no list. After: `code` undefined, `links` empty, line 50 false, no list. Holds.
5. `repository.url` also its one `links:` entry. Base: one line, the entry with `link`. After: `same` true by equal `posting` answers, the entry filtered out at 45-47, one line, the code line with `repositories`. Holds.
6. `git@github.com:TheAxeC/oculus.git`. ADDRESSED fails at `@`; HOSTED fails since `:T` is no port and no `/` follows the host; `hrefOf` gives `/api/file//git%40...`, which does not start with `http`, so `posting` is undefined. Base: no line. After: lines 61-64, the words with `repositories` and no link. Holds.
7. `''` or only spaces. Base: no repository line. After: `url.trim() !== ''` is false at line 29, `code` undefined, no line. Holds.
8. `repository:` with `visibility` and `clones` but no `url`. Base: no line. After: `repository?.url` undefined, filtered at line 29. Holds.
9. Project page vs board. Base and after: `ProjectCard.svelte` `blocks` (`:406-408` after) and `details` (`:410-415` after) both draw `<CardAddresses {item} />` (`grep -n "CardAddresses" src/lib/views/shared/card/project/ProjectCard.svelte` prints `47`, `407`, `411`). Same lines. Holds.
10. axeski (`repository.url: "https://github.com/TheAxeC/axeski"`, `links: []`, hub manifest lines 10-13). Base: no list. After: one link with `repositories`. Holds; the component reads no tier.
11. `git@github.com:2222/TheAxeC/oculus.git`. HOSTED matches (`git@github` `.com` `:2222` `/...`), `posting` answers `https://git@github.com:2222/TheAxeC/oculus.git`. Base: no line. After: lines 56-57, a link to that answer with `repositories`, its words the manifest's value. Holds.
12. `https://github.com/TheAxeC/x` and `links:` `https://github.com/TheAxeC/x/`. `posting` answers each unchanged, the two differ, `same` false. Base: one line. After: two lines. Holds.
13. `javascript:alert(1)`. ADDRESSED matches, `hrefOf` returns it, it does not start with `http`, `posting` undefined. Base: no line. After: the words with `repositories`, no link, no `href` drawn. Holds.
14. raw-pls (no `repository:`, `code_availability.url: "https://github.com/TheAxeC/registration-free-tensor-pls"`, hub manifest lines 34-37, no `links:`). Base: no list. After: `code` is the deposit's address (second candidate), one link with `repositories`. Holds.
15. algebraic-effects-compilation (`code_availability.url: /publications/other/effCompiler.zip`, hub manifest lines 19-21). ADDRESSED matches the leading slash, `posting` undefined. Base: no list. After: the words `/publications/other/effCompiler.zip` with `repositories`, no link. Holds.
16. Both keys. After: `find` at lines 27-29 takes the first candidate, `https://github.com/TheAxeC/a`; the deposit's address is not drawn. Base: no line. Holds.
17. `repository.url: '  '`, `code_availability.url: https://github.com/TheAxeC/b`. After: the first candidate fails the trim, the second is taken, one code line `https://github.com/TheAxeC/b`. Base: no line. Holds.
18. `code_availability.url` also the one `links:` entry, no `repository:`. Base: one line, the entry with `link`. After: `same` true, the entry filtered, one line, the code line. Holds.
19. `code_availability: { status: none }`. After: `codeAvailability?.url` undefined, no code line. Base: no line. Holds.
20. Menu, `repository: { url: '', clones: [] }` or `url: '   '`. Base: `block?.url !== undefined` true, `toClone` is `''` or `'   '`, the Clone row drawn with a tip naming an empty address. After: `url` trims to `''`, `toClone` null, no Clone row (line 258 `if (toClone !== null)`). Holds.
21. oculus with `clones: []`. Base and after: `toClone` is `https://github.com/TheAxeC/oculus`, the Clone row with that tip. Holds.
22. `url: ' https://github.com/TheAxeC/x '`, `clones: []`. Base: tip names the address with its spaces. After: `toClone` is the trimmed `https://github.com/TheAxeC/x`, the tip names it, and a press clones that trimmed address (repair round 1, item 2). Holds.

No case became a test: no entry of `agents/guarded.md` covers the card's lines and the behaviour needs a DOM. The look at landing takes cases 1, 2, 9, 10, 14 and 15 on the hub's own projects. The press of case 22 is covered by the two rows added to G80's test in repair round 1.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| Code line from `repository.url`, else `code_availability.url`, trimmed non-empty | DONE | read, `CardAddresses.svelte:26-30`; cases 1, 7, 8, 14, 16, 17, 19 |
| Drawn as a `links:` line: link to `posting`'s answer in a new tab, else words with no link | DONE | read, `:54-65`; cases 6, 11, 13, 15 |
| Glyph `repositories` on link and words | DONE | read, `:57`, `:62` |
| Dedup by equal `posting` answers, else equal trimmed texts | DONE | read, `:37-42`, `:45-47`; cases 5, 12, 18 |
| Key no `links:` line can take | DONE | the code line is its own `<li>` outside the `{#each}`, `:52-67` |
| List drawn when either is there, not at all when neither | DONE | read, `:50`; cases 3, 4 |
| Head comment, ending at "is drawn once, as the code line" | DONE | `CardAddresses.svelte:2-9` |
| Clone row only for a trimmed non-empty `repository.url`, tip the trimmed address | DONE | read, `ProjectCard.svelte:157-162`; cases 20, 21, 22 |
| The press clones the trimmed `repository.url`, refuses one of spaces with `no_url` | DONE | `clone-routes.ts:114-115`; `npx vitest run tests/routes/git/clone.test.ts`: `Tests  25 passed (25)` |
| G80's two rows | DONE | `tests/routes/git/clone.test.ts:143-168`; runs below |
| `npm run diagrams` then `npm run test:quick` (TMPDIR unset) | DONE | `test:quick: 56.6 s; every command passed` |
| ASCII gate over the five paths | DONE | perl command prints nothing, `exit 0` |
| `sh utils/unused-exports.sh` against the base list | DONE | `diff` with the base list prints nothing, `diff exit 0`; no line added |
| Helper-grep sentence corrected | DONE | "Greps" below |
| Before and after for every repository and code manifest | DONE | "Host- or user-visible changes" below |

`npm run test:quick`, the run after the last change, printed:

```
test:quick: 7 changed file(s), from git since HEAD
test:quick: 14 test file(s)
        tests/routes/git/clone.test.ts: changed
        tests/routes/git/credentials.test.ts: imports at depth 2
        tests/checks/imports/augments.test.ts: scans the source text of a changed file
        tests/checks/imports/cycles.test.ts: scans the source text of a changed file
        tests/checks/imports/order.test.ts: scans the source text of a changed file
        tests/checks/source/catalog-file-keys.test.ts: scans the source text of a changed file
        tests/checks/source/comment-width.test.ts: scans the source text of a changed file
        tests/checks/source/history.test.ts: scans the source text of a changed file
        tests/checks/source/html-sites.test.ts: scans the source text of a changed file
        tests/checks/source/keys.test.ts: scans the source text of a changed file
        tests/checks/source/strip-types.test.ts: scans the source text of a changed file
        tests/checks/tree/boundaries.test.ts: scans the source text of a changed file
        tests/checks/tree/duplication.test.ts: scans the source text of a changed file
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (12.2 s): 1794426354888 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (12.2 s)
ok      vitest (31.1 s): Duration  16.15s (transform 14.69s, setup 0ms, import 20.38s, tests 0ms, environment 0ms)
ok      vitest slow (44.4 s): Duration  29.48s (transform 7.76s, setup 0ms, import 13.14s, tests 32.26s, environment 0ms)
ok      vitest checks (53.7 s): Duration  38.64s (transform 16.90s, setup 0ms, import 34.06s, tests 91.27s, environment 4ms)
test:quick: 56.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

The seven changed files it counts are the four source and test files, this report, and the round brief and the review the orchestrator copied into the ledger (`git status --short` lists them as ` M` for the four and `??` for the three ledger files).

The ASCII gate: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/views/shared/card/project/CardAddresses.svelte src/lib/views/shared/card/project/ProjectCard.svelte src/lib/server/git/clone/clone-routes.ts tests/routes/git/clone.test.ts .scratch/migration/agents/reviews/O187-report.md; echo "exit $?"` prints `exit 0` and nothing else.

`sh utils/unused-exports.sh` prints 334 lines; `diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O187-unused-base.txt <that output>` prints nothing (`diff exit 0`). The step adds no export.

## Greps

History words over the added lines: `git diff -U0 -- src tests | grep -E "^\+" | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9]{2}-"` prints nothing (exit 1).

Names: `grep -rn "CardAddresses\|toClone" src tests config docs README.md --exclude=local.yml` finds only `ProjectCard.svelte:47,157,258,262,407,411`.

Helpers, before writing `same`: `grep -rn "export function \(same\|filled\|nonEmpty\|blank\|sameAddress\|isBlank\)" src` prints 25 lines:

```
src/lib/ui/tree/list/virtual.ts:60:export function sameWindow(one: RowWindow, two: RowWindow): boolean {
src/lib/server/core/auth.ts:51:export function sameOrigin(headers: Headers, host: string): boolean {
src/lib/server/core/changes.ts:191:export function same(left: unknown, right: unknown): boolean {
src/lib/server/core/files/yaml/yaml-edit.ts:134:export function sameValue(next: unknown, current: unknown): boolean {
src/lib/server/machine/hpc/clusters/keys.ts:75:export function filledKeyFile(template: string, keyType: KeyType, resource: string): string {
src/lib/server/machine/apps/serve/address.ts:59:export function sameKey(held: string, given: string): boolean {
src/lib/server/machine/runs/lint/writing/yaml.ts:61:export function sameValue(before: string, after: string): boolean {
src/lib/server/files/source/source.ts:180:export function sameStamp(one: Stamp, other: Stamp): boolean {
src/lib/state/forms/record-values.ts:153:export function blankRecord(field: FormField): RecordEdit {
src/lib/state/forms/record-values.ts:158:export function blankRow(): Row {
src/lib/state/life/present.ts:218:export function sameDeck(left: DeckRef, right: DeckRef): boolean {
src/lib/state/feeds/radar.ts:235:export function filledBuckets(
src/lib/state/system/machine/debug/debug.ts:45:export function filled(text: string | undefined): string | undefined {
src/lib/state/workbench/layout/model.ts:104:export function sameFolder(left: FolderRef, right: FolderRef): boolean {
src/lib/state/workbench/layout/model.ts:315:export function samePath(left: number[], right: number[]): boolean {
src/lib/state/workbench/navigation/rail.ts:92:export function sameRail(left: readonly RailEntry[], right: readonly RailEntry[]): boolean {
src/lib/state/sources/repositories/diff/diff-view.ts:201:export function sameFiles(a: readonly DiffSides[], b: readonly DiffSides[]): boolean {
src/lib/data/shapes/shapes.ts:59:export function filledText(value: unknown): string | undefined {
src/lib/data/sources/origin.ts:123:export function sameAddress(a: string, b: string): boolean {
src/lib/data/prose/literature.ts:43:export function sameTitle(left: string, right: string): boolean {
src/lib/data/prose/literature.ts:56:export function samePaper(left: PaperIds, right: PaperIds): boolean {
src/lib/data/helpers/guards.ts:99:export function sameInOrder(a: unknown, b: unknown): boolean {
src/lib/data/helpers/files/apps/status-items.ts:8:export function blankItem(
src/lib/data/helpers/keys/keys.ts:179:export function sameChord(a: Chord, b: Chord): boolean {
src/lib/data/helpers/files/paths.ts:232:export function sameDiskFile(
```

The address comparison among them is `sameAddress` (`src/lib/data/sources/origin.ts:123`), and it is not used. It keys an address by host and path (`addressKey`, `origin.ts:109-120`) with the trailing slash and `.git` stripped and a github.com path compared without case, so it would draw case 12 (`https://github.com/TheAxeC/x` and `https://github.com/TheAxeC/x/`) as one line, against the brief's Decision 3. It gives no key for a text that is no address (`/publications/other/effCompiler.zip` gives null), so it cannot decide the trimmed-text half of the rule. `filledText` (`src/lib/data/shapes/shapes.ts:59`) and `filled` (`src/lib/state/system/machine/debug/debug.ts:45`) keep a value of spaces, so neither is the trimmed non-empty test. `same` in `src/lib/server/core/changes.ts:191` is server code a view may not import. `posting` is reused.

Comments re-read: `CardAddresses.svelte` head comment, rewritten. `clone-routes.ts` head comment, rewritten in its third paragraph (lines 11-19). `tests/routes/git/clone.test.ts` head comment, still true. `ProjectCard.svelte` head comment (lines 2-38), still true: it names no address line. The docstring above `toClone`, still true. `grep -n "links" src/lib/views/shared/card/project/ProjectCard.svelte` finds only lines 7, 28 and 59, about CardLinks and the cross-links strip. No README, `docs/` guide or catalog paragraph describes the card's address lines or the Clone row's tip (`grep -n -i "repository\.url\|repository:\|Clone\b" docs/HELP.md docs/data-map.md docs/apps.md README.md` finds none that does). `docs/templates.md:1257-1258` (`url: "" # the remote; Clone fetches it`) stays true.

## Files

From `git status --short` and `git diff --stat`:

| Path | Lines before | Lines after | In the write list |
| --- | --- | --- | --- |
| `src/lib/views/shared/card/project/CardAddresses.svelte` | 58 | 107 | yes |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 452 | 454 | yes |
| `src/lib/server/git/clone/clone-routes.ts` | 169 | 170 | yes, round 1 |
| `tests/routes/git/clone.test.ts` | 431 | 458 | yes, round 1 |
| `.scratch/migration/agents/reviews/O187-report.md` | new | this file | yes |

`npm run diagrams` left no change in `git status --short`. `git diff tests/routes/git/clone.test.ts | grep -E "^-[^-]"` prints nothing: no existing assertion, table row or predicate changed; the file gains 27 lines.

## Judgment calls the brief left open

1. The code line's words, where `posting` gives nothing, are plain text (`<span>{code}</span>`), not `LinkedText`, since the brief says "drawn as its words, with no link". A value such as `see https://x` in `repository.url` is therefore drawn with no link at all, where a `links:` entry of the same text would link its `https://x` run.
2. The words form is wrapped in `<span class="words">`, which takes the layout of `.links a` (inline-flex, centred, gap 4px) so the glyph sits beside the words as on a link; the existing `.links a` rule was split into a shared layout rule `.links a, .words` and the colour rule `.links a`, so the link keeps every declaration it had.
3. The code line's words are the manifest's value untrimmed, as the `links:` lines draw `{link}`; leading and trailing spaces collapse in the rendered line.
4. The code line is its own `<li>` outside the `{#each}`, so it needs no key.
5. `same` compares the two `posting` answers when either is defined and the trimmed texts only when neither is; since `posting` is a function of the trimmed text, equal trimmed texts always give equal answers, so both readings of "where `posting` gives nothing for either" give the same result.
6. The row of a url of only spaces is its own `it`, not a row of the table 'refuses $name and reads nothing again': the round asks that it leave no folder, which needs a folder under a scratch directory, and the table's rows carry fixed folders (`/x`, `''`, `side-projects/p`) declared while the file loads, and a scratch directory made while the file loads would be left behind by a run that skips every case, since the sweep is the fixture of a case (`tests/fixtures/scratch.ts:5-11`).
7. The two new rows are not tagged on their own: the file carries `// @module-tag slow` at line 7, so both run with the file's other rows.

## Host- or user-visible changes, before and after

The manifests were listed with these commands, each manifest's lines read from their output:

```
{ grep -rl --include=project.yml -E "^repository:" ~/workspace/research-hub; grep -l -E "^repository:" ~/workspace/*/.oculus/project.yml; } | sort -u | while read f; do echo "== ${f#$HOME/workspace/}"; grep -A12 "^repository:" "$f" | grep -m1 -E "^\s+url:"; awk '/^links:/{p=1; print; next} p && /^[^ -]/{p=0} p' "$f"; done
grep -rl --include=project.yml -E "^code_availability:" ~/workspace/research-hub ~/workspace/*/.oculus | sort | while read f; do u=$(awk '/^code_availability:/{p=1;next} p && /^[^ ]/{p=0} p && /^  url:/{sub(/^  url: */,""); print}' "$f"); r=$(grep -c "^repository:" "$f"); [ -n "$u" ] && [ "$u" != '""' ] && [ "$u" != "''" ] && echo "${f#$HOME/workspace/} | url=$u | repository=$r | links=..."; done
```

The first finds 18 manifests with `repository:`, each holding a non-empty `url`, all `https://github.com/TheAxeC/...`; the brief's 16 leaves out linfoot-estimator-package and the research-hub side project. The second finds 24 manifests with `code_availability:`, 16 of them with a non-empty `url` and none of those with `repository:`; the other 8 hold `url:` empty, `url: ''` or no `url` (hccnet-fl, eeg-saad-challenge, loewner, ecg-af-block-term, ecg-af-patient-objective, ecg-af-stable-score, sandpile-operator, engram) and draw no code line.

Repository manifests. Before: the card draws its `links:` only. After: the repository's address first, a link opening a new tab with the repositories glyph (`folder-git-2`, `[R]` in the terminal palette), then the `links:`.

| Manifest | `repository.url` | `links:` | Before | After |
| --- | --- | --- | --- | --- |
| `oculus/.oculus/project.yml` | `https://github.com/TheAxeC/oculus` | `[]` | no list | 1 line, the repository |
| `projects/software/bttr-block-term-tensor-regression` | `https://github.com/TheAxeC/block-term-tensor-regression` | none | no list | 1 line, the repository |
| `projects/software/federated-learning-tutorial` | `https://github.com/TheAxeC/federated-learning-tutorial` | none | no list | 1 line, the repository |
| `projects/software/fl-kit-elixir-federated-learning-kit` | `https://github.com/TheAxeC/fl-kit` | 1, `https://github.com/UHasselt-BiomedicalDataSciences/federated-learning-toolkit` | 1 line, the entry with `link` | 2 lines, the repository then the entry |
| `projects/software/linfoot-estimator-package` | `https://github.com/TheAxeC/linfoot` | none | no list | 1 line, the repository |
| `side-projects/finished/axeski` | `https://github.com/TheAxeC/axeski` | `[]` | no list | 1 line, the repository |
| `side-projects/finished/cardinal-revamped` | `https://github.com/TheAxeC/cardinal-revamped` | `[]` | no list | 1 line, the repository |
| `side-projects/finished/cardinal` | `https://github.com/TheAxeC/cardinal` | `[]` | no list | 1 line, the repository |
| `side-projects/finished/cv-autogenerator` | `https://github.com/TheAxeC/cv-autogenerator` | `[]` | no list | 1 line, the repository |
| `side-projects/finished/ical-kuleuven` | `https://github.com/TheAxeC/ical-kuleuven` | `[]` | no list | 1 line, the repository |
| `side-projects/finished/theaxec-profile-readme` | `https://github.com/TheAxeC/TheAxeC` | `[]` | no list | 1 line, the repository |
| `side-projects/research-hub` | `https://github.com/TheAxeC/research-hub` | `[]` | no list | 1 line, the repository |
| `side-projects/school/algebraic-subtyping-for-algebraic-effects-handlers` | `https://github.com/TheAxeC/algebraic-subtyping-for-algebraic-effects-and-handlers` | `[]` | no list | 1 line, the repository |
| `side-projects/school/eeg-source-reconstructed-connectivity-information-theoretical` | `https://github.com/TheAxeC/an-information-theoretical-approach-to-eeg-source-reconstructed-connectivity` | `[]` | no list | 1 line, the repository |
| `side-projects/school/effect-handler-optimization-honours-project` | `https://github.com/TheAxeC/honoursproject-effect-handler-optimization` | `[]` | no list | 1 line, the repository |
| `side-projects/school/ml-for-flow-based-network-intrusion-detection` | `https://github.com/TheAxeC/machine-learning-techniques-for-flow-based-network-intrusion-detection-systems` | `[]` | no list | 1 line, the repository |
| `side-projects/school/quasi-monte-carlo-points-on-collections-of-triangles` | `https://github.com/TheAxeC/quasi-monte-carlo-points-on-collections-of-triangles` | `[]` | no list | 1 line, the repository |
| `side-projects/school/row-based-effects-honours-project` | `https://github.com/TheAxeC/honoursproject-row-based-effects` | `[]` | no list | 1 line, the repository |

Code deposit manifests (non-empty `code_availability.url`, no `repository:`, none with `links:`). That none holds `links:` was checked at landing: `xargs grep -n -E '^links:'` over the 16 manifests prints nothing (exit 1). Before: no address list. After: one line, the deposit's address with the repositories glyph, a link opening a new tab, except algebraic-effects-compilation, whose site path is words with no link.

| Manifest | `code_availability.url` | After |
| --- | --- | --- |
| `projects/archive/published/2026/dongho-ecg-clustering` | `https://github.com/TheAxeC/ecg-representation-clustering` | 1 line, a link |
| `projects/archive/published/2026/glassbox-decision-pipelines` | `https://github.com/TheAxeC/robust-transparency-ecg` | 1 line, a link |
| `projects/coauthor/published/2017/algebraic-effects-compilation` | `/publications/other/effCompiler.zip` | 1 line, words, no link |
| `projects/manuscripts/bt-operator-theory` | `https://github.com/TheAxeC/block-term-operator-theory` | 1 line, a link |
| `projects/manuscripts/btfno` | `https://github.com/TheAxeC/block-term-neural-operator` | 1 line, a link |
| `projects/manuscripts/bttd-source-eeg` | `https://github.com/TheAxeC/leadfield-btd-eeg` | 1 line, a link |
| `projects/manuscripts/bttn-incident-af` | `https://github.com/TheAxeC/bttn-incident-af` | 1 line, a link |
| `projects/manuscripts/covert-applied` | `https://github.com/TheAxeC/covert-vertical-federated-tensor` | 1 line, a link |
| `projects/manuscripts/covert-theory` | `https://github.com/TheAxeC/private-coupled-descent` | 1 line, a link |
| `projects/manuscripts/dries-bttr-ecg` | `https://github.com/TheAxeC/bttr-af-ecg` | 1 line, a link |
| `projects/manuscripts/ecg-readable-substrate` | `https://github.com/TheAxeC/named-ecg-vs-foundation-models` | 1 line, a link |
| `projects/manuscripts/fed-multicellular-immune` | `https://github.com/TheAxeC/federated-multicellular-tensor` | 1 line, a link |
| `projects/manuscripts/hccnet-revision` | `https://github.com/TheAxeC/hccnet` | 1 line, a link |
| `projects/manuscripts/meseret-cirrhosis` | `https://github.com/TheAxeC/cirrhosis-competing-risks` | 1 line, a link |
| `projects/manuscripts/raw-pls` | `https://github.com/TheAxeC/registration-free-tensor-pls` | 1 line, a link |
| `projects/manuscripts/ward-bttr-crosssubject` | `https://github.com/TheAxeC/behavior-aligned-ecog-transfer` | 1 line, a link |

These cards change on the Projects boards, the listings (`Listing.svelte` through `ProjectCards.svelte`) and the project page; the Focus board's lane card is not changed.

- The card's menu: before, a manifest with `repository.url` empty or only spaces and no clone drew a Clone row whose tip named an empty address; after, no Clone row. A tip of an address with stray spaces names it trimmed, and its press clones that trimmed address. No manifest holds either today.
- The clone route: before, a `repository.url` of only spaces was refused by `cloneRepository` (`src/lib/server/git/clone/clone.ts:100`) with the `no_url` sentence, and a padded one was passed to `git remote add origin` with its spaces and refused with `Could not read from remote repository.` (the first run below). After, the route refuses the first at `clone-routes.ts:115` with the same sentence, and clones the second with `origin` the trimmed address.
- Assistive technology: `Glyph` is `aria-hidden="true"` (`src/lib/ui/display/Glyph.svelte`, the box markup). Before, a `links:` web page reads as a link named by its address ("link, https://..."), and any other entry as its words, with web runs inside them as links; the code line is not drawn. After, the `links:` lines read the same, and the code line reads exactly like a `links:` line: a link named by its address, or its words. Nothing tells a screen-reader user that the first line is the repository or the code deposit; the distinction is the glyph alone, and a spoken label would need a text key, which the brief rules out.

## Limitations and sharp edges

- A twin that differs by a trailing slash, by case or by its scheme is drawn twice (brief decision 3; case 12).
- Two `links:` entries that are the same address as each other are both drawn; only an entry that is the code line's address is dropped, as the head comment says.
- `git@github.com:2222/...` reaches the page as `https://git@github.com:2222/...`, `posting`'s answer for any `links:` entry of that shape (case 11).

## Anything in the brief that was wrong or impossible

The brief counts 16 manifests with `repository.url`; the listing above finds 18 (linfoot-estimator-package and the research-hub side project are the two more). No decision of the step rests on the count. The brief's line numbers for `ProjectCard.svelte` (157-160, 256-268, 404-413) and its 452-line count matched the base.

## Repair round 1

1. Review 3.1, the head comment. `CardAddresses.svelte:8-9` now ends the sentence at "is drawn once, as the code line." and the file is 107 lines. The `links:` entries are not deduplicated among themselves.
2. Review 4.1, the Clone press. `src/lib/server/git/clone/clone-routes.ts:114-115`:

   ```ts
   const url = found.repository?.url?.trim() ?? '';
   if (url === '') return refused(words(text, 'server.clone.no_url'));
   ```

   The head comment's third paragraph (`:11-19`) now says the `url` must hold more than spaces and is cloned with the spaces around it taken off, rewrapped at 100 columns. `clone.ts` is not changed. Two rows were added to G80's describe 'cloning the repository of a project into the folder the reader chose' in `tests/routes/git/clone.test.ts`:
   - `:143-154` 'clones a repository url with spaces around it as the address without them, its origin that address': the project's url is the test's bare remote with two spaces on each side; it asserts status 200 with `{ ok: true, dir }`, the cloned `a.txt`, and `git remote get-url origin` equal to the bare remote's path.
   - `:156-168` 'refuses a repository url that holds only spaces with the sentence of a missing one and leaves no folder': url `'   '`; it asserts status 400, the `no repository url` sentence, no folder at the chosen path, and no rescan.

   First run, on the unchanged route, `npx vitest run tests/routes/git/clone.test.ts -t "spaces" --reporter verbose` (TMPDIR unset):

   ```
    x |unit| tests/routes/git/clone.test.ts > cloning the repository of a project into the folder the reader chose > clones a repository url with spaces around it as the address without them, its origin that address 238ms
    v |unit| tests/routes/git/clone.test.ts > cloning the repository of a project into the folder the reader chose > refuses a repository url that holds only spaces with the sentence of a missing one and leaves no folder 1ms
   AssertionError: expected { status: 400, ...(1) } to match object { status: 200, ...(1) }
   -     "dir": "/tmp/oculus-clone-route-padded-i3N3OR/p",
   -     "ok": true,
   +     "error": "Could not read from remote repository.",
   -   "status": 200,
   +   "status": 400,
    > tests/routes/git/clone.test.ts:151:24
         Tests  1 failed | 1 passed | 23 skipped (25)
   ```

   The marks the run printed as <multiplication x>, <check mark>, <horizontal ellipsis> and <heavy right-pointing angle> are written here as `x`, `v`, `...` and `>`. The second row passes on the unchanged route, since `cloneRepository` refuses a url of spaces at `clone.ts:100` before it makes the folder.

   After the change, the same command:

   ```
    v |unit| tests/routes/git/clone.test.ts > cloning the repository of a project into the folder the reader chose > clones a repository url with spaces around it as the address without them, its origin that address 345ms
    v |unit| tests/routes/git/clone.test.ts > cloning the repository of a project into the folder the reader chose > refuses a repository url that holds only spaces with the sentence of a missing one and leaves no folder 1ms
         Tests  2 passed | 23 skipped (25)
   ```

   The whole file, `npx vitest run tests/routes/git/clone.test.ts`, prints `Test Files  1 passed (1)` and `Tests  25 passed (25)` (`Duration  5.00s`). In the slow configuration `package.json` names (`test:slow`), `npx vitest run --tagsFilter slow --exclude 'tests/checks/**' --testTimeout 20000 tests/routes/git/clone.test.ts` prints `Test Files  1 passed (1)` and `Tests  25 passed (25)` (`Duration  5.09s`). The orchestrator writes the two titles into G80's Test line at landing; `agents/guarded.md` is not edited.
3. Review 2.1, the helper grep. The report's sentence is replaced by the grep's whole output, 25 lines, and the reasons `sameAddress`, `filledText`, `filled` and `same` are not used (section "Greps").
4. Review 4.2, the before and after. The three-card statement is replaced by both tables in "Host- or user-visible changes", with the two listing commands: 18 repository manifests and 16 code deposit manifests.

Checks of the round, after its last change (TMPDIR unset): `npm run diagrams` then `npm run test:quick`, `test:quick: 56.6 s; every command passed`; the clone file in both configurations, 25 of 25 passing; the ASCII gate over the five paths, `exit 0` and nothing else; `sh utils/unused-exports.sh` against the base list, `diff exit 0`, no line added. All quoted above.

## Runs

The verify list (`npm run diagrams` then `npm run test:quick`) ran once for the step and once for repair round 1, each after that round's last change. No whole-suite command ran. Besides it: in the step, `npx prettier --check` and `npx eslint` over the two changed files, once each; in repair round 1, `npx vitest run tests/routes/git/clone.test.ts -t "spaces"` twice (before and after the change), `npx prettier --check` over the three files the round changed once, and the clone file whole in the default and in the slow configuration once each.
