# Brief check of O187 (brief `.scratch/migration/agents/briefs/O187.md`, main at e34e44fb5)

Summary of what the session needs to act on before dispatch:
- (P1) The brief's manifest premise is incomplete: 16 manifests hold `repository.url`, not 4. The 12 it misses are personal-tier projects under `side-projects/`.
- (P2) The brief says `repositories` is "the one git glyph the catalogs hold". That is false: `branch`, `merge` and `commit` also draw git icons. The choice of glyph still holds.
- (P3) Verify item 4 names "the standards' rules on sentence length and list items", and `spec.md` holds no such rules.
- (P4) Verify item 1 uses the `grep '[^ -~]'` form, which `spec.md:103` says the perl gate replaces.
- (P5) Case 6 draws a non-web address with no link. The step line and ruling 760 say "a link", and this departure is not listed under "Decisions taken in this brief".
- (P6) The brief's dedup compares after `trim()` only. Near-duplicates (a trailing slash, or the same address without its scheme) would be drawn twice. No hub manifest has one today.
- The plan has no `## Goal` section.

## Names

The step renames nothing. It changes the behaviour of `CardAddresses.svelte`, and the head comment of that file is on the write list.

`git grep -n "CardAddresses" -- src tests config docs README.md ':!config/local.yml'`:
```
src/lib/views/shared/card/project/ProjectCard.svelte:47:    import CardAddresses from './CardAddresses.svelte';
src/lib/views/shared/card/project/ProjectCard.svelte:405:    <CardAddresses {item} />
src/lib/views/shared/card/project/ProjectCard.svelte:409:    <CardAddresses {item} />
```
These are outside the write list, and the change does not make them false. The `ProjectCard.svelte` head comment (lines 1-37) says nothing about the address lines. `grep -n "links\|address" ProjectCard.svelte` gives 7, 28, 59, 156 and 162, which are about CardLinks, CrossLinks and the Clone rows, so the change does not make them false either.

`git grep -n "repository\.url" -- src tests config docs README.md ':!config/local.yml'` hits:
- `config/schemas/manifest-schema.yml:92`, help: "The address of the project's repository on its remote. Clone fetches it into a folder the reader picks." It is still true.
- `src/lib/data/sources/clones.ts:2,41,64`, `src/lib/data/sources/manifests.ts:18,281,293`, `src/lib/server/root/watch/portfolio/portfolio.ts:164`, `src/lib/state/forms/schema.ts:490`, `tests/data/sources/manifests/clones.test.ts:31,34,153`. All are about the clones and the form. None is made false.

`git grep -n -i "address list\|address line\|address lines"` has one hit: `tests/server/accounts/connect/git/routes.test.ts:4`. It is unrelated.

The glyph `repositories` is unchanged. Its uses are `glyphs.yml:96`, `icons.yml:95`, `config/text/views/sources/repositories.yml:259,353`, `RepoItems.svelte:75`, `RepoList.svelte:220`, `Repositories.svelte:378`, `AppSourceItem.svelte:56` and `view-menu.ts:34`. None is made false.

`posting` is unchanged. Its callers are `LeadCard.svelte:54`, `RadarCard.svelte:60`, `LiteratureCard.svelte:28` and `CardAddresses.svelte:9`. One pre-existing stale sentence is outside the write list and is not made false by this step: `posting.ts:1-3` says "apart from a view so the lead card and the radar card ask it once", but four components call it today.

Docs:
- `README.md:12` ("...the project's folder, manuscript and repository") is still true.
- `docs/data-map.md:378` (`links`) and `:386` (`repository.*`) are still true.
- `docs/HELP.md` has no sentence on the card's addresses. `git grep -n -i "card" -- docs/HELP.md | grep -i "link\|address\|repositor"` gives only line 66, which is about Open Workbench.

## The step line

`grep -n "^- O187 " .scratch/migration/plan.md` gives line 1746. Each part of the line, with what it maps to:
1. "address lines draw `links:` only; `repository.url` read only by Clone and Cloned in": tree premises 1 and 3.
2. "a project whose remote is in `repository.url` alone (oculus, bttr..., federated-learning-tutorial, fl-kit...) shows no address": tree premise 5. The step line and the brief both list only those 4; see Premises.
3. "every project card whose manifest has `repository.url` draws it": "What to build" paragraph 1. The brief reads "has" as "non-empty" (case 7). That agrees with `manifests.ts:282-285` `urlOf`, which treats a blank url as none.
4. "as its first address line": paragraph 1, "the first line ... before the `links:` entries".
5. "a link": bullet 1. Only a `posting` address becomes a link; see P5 under the cases below.
6. "with the git glyph": bullet 2, with the premise corrected.
7. "on the boards and on the project page": paragraph 1 and case 9.
8. "whatever the tier": paragraph 1. No case holds a personal-tier or research-tier project with an address.
9. "built by a builder agent (ruling 760)": the brief is a builder brief.

No part of the line is left without a requirement. The line names no check of its own. The look at landing (cases 1, 2 and 9) is the only check that is not done by reading.

Ruling 760 (`plan.md:3752`) and "No inline builds" (`plan.md:3651`) were both read. The brief agrees with them, apart from P5.

There is no `## Goal` section: `grep -n "^## Goal" .scratch/migration/plan.md` exits 1. The headings are Steps, Could run in parallel, Rulings, Agents, and Blocked, and by what. I judged against the goal given in my task, "a project card shows its repository's address".

## Premises

1. `wc -l CardAddresses.svelte` gives `58`. Line 18 is `const links = $derived(item.project.links ?? []);`, and lines 21-38 match the brief's description. `posting.ts:12-17` matches. **Holds.**
2. `grep -n "CardAddresses" ProjectCard.svelte` gives lines 47, 405 and 409. The `blocks` snippet is lines 404-406 and `details` is 408-413. **Holds.** `RecordCard.svelte:343-357` draws `details` on the page and `blocks` otherwise. The project card passes no `left` or `right` (`ProjectCard.svelte:415-437`), so the `columns` branch (`RecordCard.svelte:203`) never drops the address lines.
3. `grep -rn "repository" src/lib/views/shared/card src/lib/views/shared/record` gives `ugrep: warning: src/lib/views/shared/record: No such file or directory`. It also gives `ProjectCard.svelte` lines 24, 34, 35 and 150, which are comments on a folder being a repository, besides 156, 158 and 164. **Partly wrong:** the folder in the brief's command does not exist (the record folder is `src/lib/views/shared/card/record`); "gives only those lines" is inexact; the substance holds: no card draws the address. A wider `grep -rnE "repository\??\.url|\.repository\b" src` finds only `ProjectCard.svelte:158,164` on the client side. Line ranges: `sed -n 256p` gives `if (toClone !== null) {`, and the Cloned in block is 269-280 (line 280 is `}`). The brief's 269-279 is one short.
4. `sed -n 355,376p model-entities.ts`: `RepositoryBlock` is at 365-373, with its comment from 358. `repository?: RepositoryBlock` is at 515. **Holds.** `normalise.ts:211-222` builds the block with `str(value.url)`, which gives a string or undefined and does not trim.
5. Manifests. My loop over `~/workspace/research-hub/projects/*/*/project.yml` and `~/workspace/*/.oculus/project.yml` reproduces the brief's 4: oculus `links: []`, bttr and federated-learning-tutorial with `links: None`, and fl-kit with one other link. **The list is incomplete.** `grep -rl --include=project.yml -E "^repository:" .` under the hub also finds 12 `tier: personal` manifests under `side-projects/`, for example `side-projects/research-hub` (`https://github.com/TheAxeC/research-hub`), `side-projects/finished/axeski` and `side-projects/school/...`. Each holds an https `repository.url` and `links: []`. `config/defaults/sources.yml:12` (`- { dir: side-projects, optional: true }`) shows that oculus scans them. None of the 16 has a `links:` entry equal or near-equal to its url (the scan printed `equal: [] | near: []` for every row). None holds `repository:` as a scalar: `grep -rn --include=project.yml -E "^repository:\s*\S"` prints nothing. "A research-tier project holds none today" holds. Research manuscripts carry their GitHub address at `code_availability.url` instead (for example `projects/manuscripts/raw-pls/project.yml:37`). The card draws only the code status from that block (`CardFacts.svelte:123-125`). This is outside ruling 760, which names `repository.url`; I note it for the session.
6. Glyph: `sed -n 96p glyphs.yml` gives `  repositories: "[R]"`; `sed -n 95p icons.yml` gives `    repositories: folder-git-2`; `sed -n 378p Repositories.svelte` gives `glyph="repositories"`, on the reopen-closed button. `grep -nE "^\s*git[a-z_-]*\s*:"` over both catalogs prints nothing, so "No glyph named `git`" **holds**. "the one git glyph the catalogs hold" (brief lines 16 and 67) is **false**: `icons.yml:45 branch: git-branch`, `:47 merge: git-merge`, `:48 commit: git-commit-horizontal` and `:212 symbol_interface: git-commit-horizontal` also draw git icons. The choice still holds as "the repository glyph". `Glyph.svelte:26`: an unknown name throws, and `repositories` is known.
7. `posting`. I copied the regexes from `hub-address.ts:22,30` and the body of `posting` into a `node -e` program that only prints:
   ```
   "https://github.com/TheAxeC/oculus" -> "https://github.com/TheAxeC/oculus"
   "git@github.com:TheAxeC/oculus.git" -> undefined
   "ssh://git@github.com/TheAxeC/oculus.git" -> undefined
   "github.com/TheAxeC/oculus" -> "https://github.com/TheAxeC/oculus"
   "javascript:alert(1)" -> undefined
   "httpx://evil" -> "httpx://evil"
   "   " -> undefined
   "git@github.com:2222/TheAxeC/oculus.git" -> "https://git@github.com:2222/TheAxeC/oculus.git"
   ```
   **Holds, with two exceptions:** `posting` accepts any scheme that starts with `http` (`posting.ts:16`, `href.startsWith('http')`), and a `git@host:<digits>/path` address matches `HOSTED` and gets an `https://git@...` link. `linkRuns` (`html.ts:806-826`) links only `http(s)://`, so drawing an ssh or `git@` address through `LinkedText` gives no link, as the brief wants.
8. Tests and guarded entries: `grep -rln "CardAddresses\|ProjectCard" tests` prints nothing (exit 1); `grep -n -i "CardAddresses\|posting" .scratch/migration/agents/guarded.md` hits lines 75 and 167, where "posting" is a verb in unrelated test titles; `git grep -rln "hrefOf" tests` finds nothing. "No entry covers them" **holds**.
9. ADR: `ls docs/adr` gives `No such file or directory` (exit 1). `grep -n "adr" .agents/plan.yaml` exits 1. **Holds.**
10. Verify list: `orchestrator-state.md:6-7` gives `verify:` / `- npm run test:quick`. **Holds.** The base list `.agents/worktrees/O187-unused-base.txt` does not exist yet, and neither does an O187 worktree; both are /spec's later work.

## Cases and checks

Cases inconsistent with `spec.md`: none. Each case is checked by reading and at the look, consistent with `spec.md` and the test rule, since no `guarded.md` entry applies.

Checks inconsistent with `spec.md`:
- **Verify item 1** names `LC_ALL=C grep -n '[^ -~]' ...CardAddresses.svelte`. `spec.md:103` says the perl gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". `O186.md:108` uses the perl form.
- **Verify item 4** names "the standards' rules on sentence length and list items". `grep -n -i "sentence length\|long sentence\|list item" .scratch/migration/agents/spec.md` exits 1. `.agents/plan.yaml:6` names `standards: [.scratch/migration/agents/spec.md]` and nothing else.
- Minor: "stays under 520 lines" against spec's "at or under 520".

A case that checks a place the step does not change: **Case 9** reads the `blocks` and `details` snippets of `ProjectCard.svelte`, which the step does not change. Both render `<CardAddresses {item} />` (lines 405 and 409), so the case holds on the unchanged tree whatever the build does. The brief's re-read of the `ProjectCard.svelte` head comment is required by `spec.md`, so it is in order.

P5: case 6 and bullet 1 draw a non-web address with no link, while ruling 760 says "a link with the git glyph". The decision is sound, since there is no web href for an ssh address, and no hub manifest holds one today (all 16 are https). It is still a departure from a ruling, which `spec.md` "No silent design decisions" lists. It belongs under "Decisions taken in this brief", and it is not there.

## The question (could it pass without the goal being reached?)

- Case 1: no. With `links: []`, the current `{#if links.length > 0}` (`CardAddresses.svelte:21`) draws nothing, so this case needs bullet 4 and the new line.
- Case 2: no. It needs the repository line first and the glyph difference.
- Cases 3, 4, 7 and 8: yes. They pass on the unchanged tree by construction. They guard against overreach and do not prove the goal.
- Case 5: yes on the unchanged tree for "one line", but with the `link` glyph. It proves the dedup only after the change.
- Case 6: it could pass with no repository line at all if read loosely. It proves the goal only because "with the `repositories` glyph" is required.
- Case 9: yes. It holds on the unchanged tree and proves sameness, not presence. Presence on the page rests on case 1 combined with case 9.
- Step line check: none is named. The look at landing covers cases 1, 2 and 9 on software-tier cards only. "Whatever the tier" could pass unseen for personal-tier cards; the risk is low (`ProjectCard.svelte:33`; no tier logic beyond venue tiers). I recommend that the look also takes one personal card, for example `side-projects/finished/axeski`.
- "What to build" paragraph 1 reaches the goal only with bullet 4. Bullet 1 could pass while showing an address with no link for a scheme-less url, but `posting` gives `github.com/...` an https link, so no. Bullets 2, 3 and 5 are independent of the goal; bullet 3 draws near-duplicates twice (P6). Bullet 4 is required for the goal (case 1).
- Boards that are not ProjectCard: the Focus board's lane card (`LaneCard.svelte`) is its own markup and draws no `links:`. A project on the Focus board shows no address before or after the step. The brief's "on a board" covers the boards that draw `ProjectCard` (Projects, `Listing.svelte:115,130` through `ProjectCards.svelte:65`, and the project page). The session may want this said in the brief.

## Implied inputs

1. A `repository.url` whose value reaches the href is untrusted: `javascript:alert(1)` gives `posting` undefined, so it is drawn as words with the `repositories` glyph and no link. `httpx://evil` gets `href="httpx://evil"` through `posting.ts:16`; this is existing `posting` behaviour, outside the write list, and harmless as script. The brief's description of `posting` should name it.
2. `git@github.com:2222/owner/repo.git` gets the href `https://git@github.com:2222/...`. Bullet 1 says a `git@host:path` address gets no link, so the brief and `posting` disagree on this input. The brief should rule whether the line follows `posting` (a link) or the stated rule (words).
3. A scheme-less url such as `github.com/TheAxeC/oculus` is a link to `https://github.com/TheAxeC/oculus`, and its words are as written.
4. A `links:` entry that differs from the url only by a trailing slash, by its scheme or by case is drawn twice under "compared after `trim()`". Comparing the two `posting()` results, or the trimmed text where `posting` gives none, would draw it once. No hub manifest has such a pair today.
5. A url with spaces around it: the href is trimmed (`posting.ts:13`), the words are drawn as written and HTML collapses the spaces, and dedup on `trim()` matches it.
6. A `url:` that is not a string (a number, a list or null): `normalise.ts:214` `str()` gives undefined, so no line, the same as case 8.
7. A project with `repository.url` and non-empty `clones`, such as oculus itself: the line is drawn whatever `clones` holds.
8. The keyed `{#each}` (`CardAddresses.svelte:23`, key `` `${index}:${link}` ``): the repository line must not share a key with a `links:` entry; the brief names no key.
9. Accessible name: `Glyph.svelte` draws with `aria-hidden="true"`. The repository line and a `links:` line therefore read the same to assistive technology, and the difference is visual only. The before-and-after section should state this.
10. `url: ''` with no clones: there is no repository line (case 7), but the menu's Clone row still appears, because `ProjectCard.svelte:159` tests `block?.url !== undefined`. Its tip would hold an empty address. This is pre-existing and outside the write list. I note it because it costs a failed clone.

## ADRs

None exist. `ls docs/adr` gives `ls: docs/adr: No such file or directory`, and `grep -n "adr" .agents/plan.yaml` exits 1.

## Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O187.md` prints nothing (exit 1). Each dictated item:
- Line 28: `target="_blank" rel="noreferrer"`. **Holds.**
- Line 29: the glyph names `repositories` and `link`. **Holds.**
- Line 30: `trim()`. A mechanism, not file text. **Holds.**
- Line 32: the content of the head comment. A content requirement, not dictated wording. **Holds**, provided the builder avoids the comparative words `spec.md` lists.
- Lines 16 and 67: "the one git glyph the catalogs hold". Brief text, factually wrong (Premises item 6).

## Declined to judge

- I did not run the cases or the verify list on a tree, since I change nothing and have no worktree.
- I did not judge whether `code_availability.url` (research manuscripts) or the Focus lane card should be covered. Both are outside ruling 760's words.
- I did not judge the wording of the head comment, which is not written yet.
- I did not open the hub's `.oculus/local.yml`.

Usage: abe2dd01598571517, claude-opus-5-5; stopped on Axel's word and resumed by a message; the resumed run 153886 tokens, 2 tool uses, 77.1 s from its completion notice; the stopped run's usage was not reported; 54 tool uses in its transcript in all.

## Closed

- P1: the brief's manifest premise rewritten to the 16 manifests, the 12 personal-tier ones under `side-projects/` named, and case 10 added for a personal-tier card; the look takes `side-projects/finished/axeski`.
- P2: the glyph's reason rewritten to "the glyph of repositories", the false "one git glyph" removed from the premise and from decision 1.
- P3: verify item 4 removed.
- P4: verify item 1 uses the perl gate of `spec.md:103`.
- P5 and implied input 2: decision 4 added: the line follows `posting`, as the `links:` lines do, so an address `posting` reads as a web page is a link and any other is words; case 6 kept (`git@github.com:TheAxeC/oculus.git`, words), case 11 added (`git@github.com:2222/...`, a link, as `posting` gives).
- P6 and implied input 4: decision 3 rewritten: an entry is the repository's address when the two `posting()` results are equal, or, where `posting` gives none, their trimmed texts; case 12 added (a trailing-slash twin is drawn twice under this rule, since `posting` keeps the slash).
- Premises item 3: the grep command and the line range 269-280 corrected.
- Implied input 1: the `posting` premise names the `http`-prefixed scheme rule.
- Implied input 8: the repository line's key is required not to collide with a `links:` key.
- Implied input 9: the report states the accessible reading before and after.
- Case 9: kept as a sameness check, named as such.
- Minor: "at or under 520 lines".
- The Focus lane card, `code_availability.url` and the Clone row with an empty url (implied input 10) are outside ruling 760's words and the step's paths; raised to Axel as open item 761, ruled (1) (a), (2) (a), (3) (a): "What to build" now draws `code_availability.url` as the code line where the manifest has no `repository.url`, keeps the lane card unchanged and makes the Clone row need a non-empty trimmed `repository.url`; `ProjectCard.svelte` joins the paths; cases 14 to 22 added; the look takes cases 14 and 15 too.
