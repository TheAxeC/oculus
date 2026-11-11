# Step O187 refuter report (on .agents/worktrees/migration-O187, base 66ecbeee8)

## Verification (rerun by the reviewer)

All commands were run from the worktree root, with Node at `$HOME/.nvm/versions/node/v24.21.0/bin` on PATH and TMPDIR unset.

- `npm run diagrams` printed the diagram list (last line `docs/diagrams/writes.svg`). After it, `git status --short` prints only ` M src/lib/views/shared/card/project/CardAddresses.svelte`, ` M src/lib/views/shared/card/project/ProjectCard.svelte` and `?? .scratch/migration/agents/reviews/O187-report.md`.
- `npm run test:quick` printed:
  - `test:quick: 3 changed file(s), from git since HEAD`
  - `test:quick: 12 test file(s)`
  - `ok      prettier (0.7 s): All matched files use Prettier code style!`
  - `ok      ASCII gate (0.8 s)`
  - `ok      svelte-kit sync (2.6 s)`
  - `ok      eslint (1.8 s)`
  - `ok      svelte-check (7.7 s): 1794424696256 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
  - `ok      vitest checks (42.9 s): Duration  32.62s (transform 12.09s, setup 0ms, import 25.47s, tests 64.42s, environment 3ms)`
  - `test:quick: 45.6 s; every command passed`
  - It counts 3 changed files where the builder's run counted 2, because the report file now exists. The 12 test files are the ones the builder lists.
- The ASCII gate over the three paths (`LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' <the three paths>; echo "exit $?"`) prints `exit 0` and nothing else.
- `sh utils/unused-exports.sh` exits 0 and prints 334 lines. `diff` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O187-unused-base.txt` prints nothing (`diff exit 0`).
- The builder's history-word grep, run as `git diff 66ecbeee8 | grep -E "^\+" | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9]{2}-"`, prints nothing (exit 1). This matches the report.
- The builder's name grep, `grep -rn "CardAddresses\|toClone" src tests config docs README.md --exclude=local.yml`, finds only `ProjectCard.svelte:47,157,258,262,407,411`. This matches the report.
- `grep -n "links" src/lib/views/shared/card/project/ProjectCard.svelte` gives lines 7, 28 and 59. This matches the report.
- `grep -rln "CardAddresses\|ProjectCard" tests` prints nothing (exit 1).
- The builder's docs grep, `grep -n -i "repository\.url\|repository:\|Clone\b" docs/HELP.md docs/data-map.md docs/apps.md README.md`, gives README.md:68, README.md:97, docs/HELP.md:146 and docs/HELP.md:497. None of them describes the card's address lines or the Clone row's tip. This matches the report.
- The builder's helper grep, `grep -rn "export function \(same\|filled\|nonEmpty\|blank\|sameAddress\|isBlank\)" src`, prints 26 lines, among them `src/lib/data/sources/origin.ts:123:export function sameAddress(a: string, b: string): boolean {`, `src/lib/data/shapes/shapes.ts:59:export function filledText` and `src/lib/state/system/machine/debug/debug.ts:45:export function filled`. This does not match the report (finding 2.1).
- The open items of the state file: on main, `grep -n -A6 "^## Open items" .scratch/migration/orchestrator-state.md` shows the heading at line 185 followed by blank lines. In the worktree's copy, `sed -n 175,188p` gives the heading, blank lines and the closing note. The list is empty in both, as the report says.
- Docs: no ADR folder exists in the repository, and `.agents/plan.yaml` names no `adr` key. `grep -rn -i "CardAddresses\|address lines\|address list\|toClone"` over `docs` and `README.md` finds nothing. `docs/templates.md:1257-1258` (`repository:` / `url: "" # the remote; Clone fetches it`) is still true.
- Manifests read for the named cases: oculus `.oculus/project.yml:19,22-23` (`links: []`, `url: 'https://github.com/TheAxeC/oculus'`); fl-kit `projects/software/fl-kit-elixir-federated-learning-kit/project.yml:9-12`; axeski `side-projects/finished/axeski/project.yml:10-13`; raw-pls `projects/manuscripts/raw-pls/project.yml:34-37`, with no `links:`; algebraic-effects-compilation `projects/coauthor/published/2017/algebraic-effects-compilation/project.yml:19-21`. Each matches its case. Listing every manifest with `repository:` gives 18 today, all `https://github.com/TheAxeC/...`. Against the brief's 16, they include `projects/software/linfoot-estimator-package` and `side-projects/research-hub`. No decision of the step rests on that count.

## Verdicts

Items of the brief's "What to build":

1. Code line from a trimmed non-empty `repository.url`, else `code_availability.url`; neither gives the list as before: holds. `CardAddresses.svelte:27-31` (`[repository?.url, codeAvailability?.url].find((url) => url !== undefined && url.trim() !== '')`), and `:46-48` leaves `links` unfiltered when `code` is undefined.
2. `CardAddresses.svelte` draws the code line and stays at or under 520 lines: holds. It draws it at `:53-68`, and `wc -l` gives 108.
3. Drawn as the `links:` lines are: holds, `:55-66`.
4. Glyph `repositories` on the link and on the words: holds, `:58` and `:63`. `config/catalogs/glyphs.yml:96` and `icons.yml:95` hold the name.
5. Dedup by equal `posting()` answers, or equal trimmed texts where `posting` gives nothing: holds, `:38-48`. `posting` (`posting.ts:12-17`) is a function of the trimmed value, so when one side has an answer and the other has none, their trimmed texts differ; both readings of "for either" give the same result.
6. A key no `links:` line can take: holds. The code line is its own `<li>` outside the keyed `{#each}` (`:53-68`).
7. The list draws when either the code line or a `links:` entry is there, and not when neither is: holds, `:51`.
8. Head comment: violated, finding 3.1. It says everything the item asks for, and its closing clause is false.
9. No other card comment names the address lines, and the builder reports on `ProjectCard.svelte`'s head comment: holds. The grep gives lines 7, 28 and 59, about CardLinks and the cross-links strip. Report line 93 says the head comment is still true, and `ProjectCard.svelte:1-38` names no address line.
10. `ProjectCard.svelte` changes only `toClone` and stays at or under 520 lines; the Clone row needs a trimmed non-empty url and empty clones; the tip is trimmed; Cloned in is unchanged; the docstring is true: holds. The diff's one hunk is `:156-162`, the file is 454 lines, and `clonedIn` at `:166` is untouched.
11. The report states what assistive technology reads, before and after: holds, report line 120. `Glyph.svelte:50,52` carry `aria-hidden="true"`.
12. Every board that draws `ProjectCard`, with `LaneCard.svelte` unchanged: holds. Both snippets draw `<CardAddresses {item} />` (`ProjectCard.svelte:407,411`). The importers are `Projects.svelte`, `Project.svelte`, `Listing.svelte`, `ProjectCards.svelte` and `CardGrid.svelte`. `LaneCard.svelte` is not in the diff.
13. No other file changes, and no `config/text` word is added: holds. `git status --short` shows the two source files and the report.
14. Conventions, style rules: holds. `.links a` keeps all four of its declarations, split into `.links a, .words` (layout) and `.links a` (colour).

Cases of the brief's "Cases" (each verified by reading the lines given; a DOM rendering is owed to the look):

1. met. `:28-32,57-59`; `posting` answers the https value (ADDRESSED).
2. met. Code line `:53-68`, then the `links:` entry `:69-82`; `same` is false because the two `posting` answers differ.
3. met. `code` is undefined, so `links` is unfiltered: two lines.
4. met. `:51` is false.
5. met. `same` is true, so the entry is filtered at `:47`.
6. met. ADDRESSED fails at `@`, HOSTED fails at `:T`, and `hrefOf` gives an `/api/file/...` path, so `posting` is undefined. The line is drawn at `:62-65`.
7. met. `:29` trim.
8. met. `repository?.url` is undefined.
9. met. Both snippets draw the same component with the same prop.
10. met. The component reads no tier.
11. met. HOSTED matches, and `posting` answers `https://git@github.com:2222/TheAxeC/oculus.git`.
12. met. `posting` returns each https value as it is; they differ, so two lines.
13. met. ADDRESSED keeps the value, it does not start with `http`, so no href.
14. met. The second candidate is taken.
15. met. The leading `/` matches ADDRESSED and the answer does not start with `http`, so the line is words.
16. met. `find` takes the first candidate.
17. met. The first candidate fails the trim.
18. met. `same` is true.
19. met. `codeAvailability?.url` is undefined.
20. met. `:160-161` gives null, so `:258` adds no row.
21. met. `toClone` is the address.
22. met as the brief states it: the tip is trimmed (`:160-161`, `:262`). See finding 4.1 for the press.

## 1. Spec

none

## 2. Proof

- 2.1 `.scratch/migration/agents/reviews/O187-report.md:91`: "Helper grep before writing `same`: `grep -rn "export function \(same\|filled\|nonEmpty\|blank\|sameAddress\|isBlank\)" src` finds `same` only in `src/lib/server/core/changes.ts:191` ... and no address comparison"; what is wrong: the same command prints 26 lines, among them `src/lib/data/sources/origin.ts:123:export function sameAddress(a: string, b: string): boolean {`, an address comparison, along with `filledText` (`src/lib/data/shapes/shapes.ts:59`) and `filled` (`src/lib/state/system/machine/debug/debug.ts:45`); the reuse judgment the rules file asks for rests on it; failure scenario: a reader who trusts the report concludes that no address comparison exists, and the reuse judgment is recorded as made on a false reading. On the merits the code stands: `sameAddress` keys an address by host and path with the trailing slash and `.git` stripped and github.com paths compared without case (`origin.ts:110-120`) and gives no key for a non-address, so using it would draw case 12 as one line, against Decision 3; `filledText` and `filled` do not trim. The defect is the false sentence in the report.

## 3. Standards

- 3.1 `src/lib/views/shared/card/project/CardAddresses.svelte:8-10`: "A `links:` entry that is the code line's address is drawn once, as the code line, so the list never shows one address twice."; what is wrong: the filter at `:46-48` removes only entries that are the code line's address; two `links:` entries that are the same address as each other are both drawn, since `{#each}` keys by `${index}:${link}` (`:69`), so the closing clause is a sentence the diff adds that the code does not do; failure scenario: a manifest with `links: ['https://x.org/a', 'https://x.org/a']` and no `repository:` draws two identical lines while the head comment says the list never shows one address twice; verdict: item 8 violated. Fix: end the sentence at "is drawn once, as the code line". Deduplicating `links:` among themselves is a change no item asks for.

## 4. Behaviour

- 4.1 `src/lib/views/shared/card/project/ProjectCard.svelte:160-161` (`const url = block.url?.trim() ?? ''; return url !== '' && block.clones.length === 0 ? url : null;`), against `src/lib/server/git/clone/clone-routes.ts:113-117` (`const url = found.repository?.url; ... cloneRepository({ dir, url, ... })`) and `src/lib/server/git/clone/clone.ts:117` (`['remote', 'add', 'origin', url]`); what is wrong: for a padded `repository.url`, the row now promises an address the press does not use; failure scenario, case 22 (`repository: { url: ' https://github.com/TheAxeC/x ', clones: [] }`): the tip names `https://github.com/TheAxeC/x`, and pressing Clone runs `git remote add origin ' https://github.com/TheAxeC/x '` and then `git ls-remote --symref origin HEAD` on that value, very likely a failed clone under a tip naming a valid address (not verified, see Declined to judge). Before the step, tip and press both carried the spaces. Judged against ruling 761 (3): the ruling's text covers the row's drawing, the brief adds the trimmed tip (Decision 5, case 22) and "No other file changes", so the step meets its brief, and the builder named the gap with its file and line (report:124). The cause is ended by one line in a file outside the write list, `clone-routes.ts:113` (`const url = found.repository?.url?.trim();`); the empty case is already refused there and at `clone.ts:100`. Leaving it as a report line is the lazy option. No manifest holds a padded `repository.url` today.
- 4.2 report line 117: "for the oculus, axeski and fl-kit cards: before, oculus and axeski draw no address list ..."; what is wrong: every one of the 18 manifests that hold `repository.url` changes the same way, among them bttr-block-term-tensor-regression, federated-learning-tutorial, linfoot-estimator-package, the research-hub side project and the school and finished side projects; the report states the deposit cards generally (line 118) but not these; failure scenario: the look, which reads this section, checks three repository cards and has no stated expectation for the other fifteen. Low weight: the rule is one, and the look's cases 1, 2 and 10 exercise it.

Weighed, with no finding:

- Code line choice: `repository.url` takes precedence over `code_availability.url` as ruling 761 (1) and case 16 say. A non-empty `repository.url` that `posting` gives nothing for is drawn as words, and an https `code_availability.url` beside it is not drawn; that follows the ruling's condition, and no manifest holds that pair.
- Whether `same()` can hide a distinct address: `posting` answers equal only for equal trimmed texts, or for a host-form text and its `https://` form, which `hrefOf` makes the same page; an entry that carries the address among other words, or names a different scheme, page or trailing slash, is still drawn.
- `btfno`'s `code_availability.status: review-anon` with a GitHub `url`: the card draws that address. The ruling sets no status condition, and the card is a workbench view.

## Declined to judge

- What git does with a padded remote address in finding 4.1. It would be settled in a scratch folder by `git init -q && git remote add origin ' https://github.com/TheAxeC/x ' && git ls-remote --symref origin HEAD`, outside the git commands this review may run.
- The rendered card: the glyph's placement beside the words form, the order of the lines, and the new-tab link. Owed to the look on landing (cases 1, 2, 9, 10, 14, 15).
- The builder's statement that it ran `npx prettier --check` and `npx eslint` once each and the verify list once (report:134). Only the builder's transcript shows its command count.

Reviewer usage: a565d66ff1bae5d4a, claude-opus-5-5, 161685 tokens, 39 tool uses, 399.6 s.

## Repair round 1, refuted

```
$ npm run test:quick   (worktree, TMPDIR unset)
test:quick: 7 changed file(s), from git since HEAD
test:quick: 14 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (2.3 s)
ok      svelte-check (9.2 s): 1794426758973 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.3 s): Duration  9.62s (transform 7.06s, setup 0ms, import 12.42s, tests 0ms, environment 1ms)
ok      vitest slow (37.7 s): Duration  26.02s (transform 6.73s, setup 0ms, import 11.71s, tests 27.59s, environment 1ms)
ok      vitest checks (49.5 s): Duration  37.74s (transform 13.64s, setup 0ms, import 28.83s, tests 81.24s, environment 3ms)
test:quick: 52.3 s; every command passed
$ npx vitest run tests/routes/git/clone.test.ts
     Tests  25 passed (25)
$ npx vitest run --tagsFilter slow --exclude 'tests/checks/**' --testTimeout 20000 tests/routes/git/clone.test.ts
     Tests  25 passed (25)
$ the perl ASCII gate over the five paths
exit 0
$ sh utils/unused-exports.sh, diff against O187-unused-base.txt
diff exit 0
```

The report's quoted commands, rerun: the open items empty; the history grep prints nothing; the name grep gives `ProjectCard.svelte:47,157,258,262,407,411`; the helper grep gives the report's 25 lines; the two listing commands give 18 repository manifests and 16 deposit manifests with the report's urls; no line of the test file removed.

### Verdicts

- Round items: 3.1 holds (`CardAddresses.svelte:8-9`); 4.1 holds (`clone-routes.ts:114-115`; `placeClones` still finds a padded clone through `addressKey`); 2.1 holds; 4.2 holds, with new finding 2.1.
- The two new rows: the padded row tests what it names and would fail with the trim taken out (its failure on the unchanged route quoted, report:259-270); the spaces-only row passes on the unchanged route too, since `cloneRepository` refuses at `clone.ts:100`, as the builder states; no finding, the round brief ordered it.
- Items 1 to 14 of "What to build": all hold except 8, violated by finding 3.1.
- Cases 1 to 22: all met (case 22 now including the press).

### Findings

- Proof 2.1 `O187-report.md:206`: "none with `links:`" has no producing command; the quoted listing command reads no `links:`. The clause is true: `grep -n -E '^links:'` over the 16 manifests prints nothing. Failure scenario: a reader rerunning the command cannot check the "After: 1 line" column. Fix: quote that grep.
- Standards 3.1 `CardAddresses.svelte:2-5`: the comment says the `links:` lines carry the glyph of a link, but an entry `posting` names no web page for is drawn as `<LinkedText>` with no glyph (`:78`), while the code line's words keep theirs; failure scenario: a maintainer reads the missing glyph on a plain-text entry as a defect, or changes the code line to match; verdict: item 8 violated. Fix: say a `links:` entry `posting` names a web page for carries the link glyph and any other carries none.
- Standards 3.2 `clone-routes.ts:21-23`: "so tests/routes/git/clone.test.ts drives the whole endpoint without running git or `gh` at all" is false (the test runs real git over scratch repositories, `clone.test.ts:3,31`); the sentence was false at the base and sits in the head comment the round rewrote; failure scenario: a maintainer drops the file's slow tag. Fix: say the test drives the endpoint with real git over scratch repositories and its own `gh`.
- Standards 3.3 `O187-report.md:112`: the quoted name grep recurses into `config/` without `--exclude=local.yml`; the builder's rules file does not state that rule; failure scenario: rerunning it greps the file that holds the calendar secret. Fix: add `--exclude=local.yml`.
- Behaviour: none. Spec: none.

### Declined to judge

- The padded row's failure on the unchanged route: reproducing it needs the trim removed; consistent by reading.
- What git says for a padded https address: settled in a scratch folder by `git remote add origin ' https://github.com/TheAxeC/x ' && git ls-remote --symref origin HEAD`, outside this review's git commands.
- The builder's run counts, and the rendered card (owed to the look: cases 1, 2, 9, 10, 14 and 15).
- Whether the worktree holds a `config/local.yml`: not checked, by the rule that forbids touching it.

Reviewer usage over round 1: a92592978de2dffeb, claude-opus-5-5, 186729 tokens, 52 tool uses, 520.7 s.

## Closed

- First review 2.1, 3.1, 4.1, 4.2: closed by repair round 1, each verdict holds over the round.
- Round review 3.1 and 3.2: fixed at landing in `CardAddresses.svelte` and `clone-routes.ts` (comments only, inside the brief).
- Round review 2.1 and 3.3: fixed at landing in `O187-report.md`.
