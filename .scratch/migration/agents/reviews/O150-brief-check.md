# Step O150 brief check

## Names

Hub search: `cd ~/workspace/research-hub; git grep -n -E '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|of: *(pillars|more|ideas)|legend: *(pillars|more|ideas)'`. Every hit is in `deck/present.yml` (lines 44 to 50), `deck/title.md` (lines 4 and 8) or `deck/transition.md` (lines 3 and 6). All three files are on the write list, so no hub hit lies outside it. A wider search, `git grep -n -i -E 'portfolio deck|deck/present|deck/title|transition\.md|pillar projects|\{\{[a-z]+\.count'` with `deck/` excluded, finds two lines:
- `.oculus/config.yml:26` (the `portfolio_deck` comment) stays true.
- `README.md:60` ("the portfolio deck is the hub's `deck/` folder") stays true.
The hub's other uses of the word `pillars` (`docs/RESEARCH-APPROACH.md`, `.oculus/data/pillars/`, the applications) mean the research pillars, not the deck group. They are not affected.

Oculus search: `grep -rn --exclude=local.yml -E '\{\{ *(pillars|more|research)\.count|transition\.md|slides: *(pillars|more|ideas|research)\b|...|projects/\*/\*/present|projects/\*\*/present' src tests config docs README.md`. The hits are all synthetic fixtures or examples with their own text, and the change makes none of them false:
- tests: `tests/server/core/changes.test.ts:439-454`, `tests/server/edit/deck/deck-edit.test.ts:19-116`, `tests/fixtures/hubs/demo/deck/present.yml:7`, `tests/data/sources/present.test.ts:150-263`, `tests/routes/edit/write-fixture.ts:249-270`, `tests/routes/edit/undo/undo.test.ts:537-551`, `tests/routes/edit/deck-slides.test.ts:81-318`, `tests/routes/hubs/hub-writes.test.ts:853`;
- the example hint at `config/text/views/academic/present.yml:62`;
- the template comment at `docs/templates.md:1926`.

A sentence the change makes false sits outside the write list. `deck/engine.md:12` reads "Each of the next slides leads with the governing equation, then specs, method, and results." Today the next slides are the seven `pillars` decks, and each is `kind: project`. After the change, the next slides are all 25 decks. Nine are `kind: idea` (the `ideas/*` decks) and two are `kind: text` (`manuscripts/ecg-readable-substrate`, `archive/failed/fed-faithful-ecg`), and none of those eleven has an equation. I checked with `grep -m1 '^kind:'` over each deck's `main.md`. The brief item 1 premise says "`deck/engine.md` and `deck/closing.md` name no group" and leaves `engine.md` unchanged. The brief should add `deck/engine.md` to "Paths this step writes" and to "What to build", with its line 12 reworded so it is true of the whole run of decks. A change to the hub's own words is Axel's to approve, so it should go through the same `choices.md` booking as decisions 2 and 3.

## The step line

The step line is `plan.md:1688`, read with `grep -n '^- O150 '`. Each part maps to the brief as follows:
- "`deck/present.yml` rewritten to one group": item 1.
- "finds every research project's deck (`find: { folders: [projects/**/present], tiers: [research] }`": item 1.
- "the glob corrected at /spec from `projects/*/*/present` ...": the premise at brief line 20 and decision 4.
- "`discover: true`, `sort: folder`": item 1.
- "placed by one `{ slides: <group> }` entry between the deck's own files": item 1's order.
- "every narrowing left to the filter bar": item 1 (no `stages:`, no `slides:` list) and case C3.
- "written by the orchestrator in the hub, committed on the user's word; orchestrator, no agent (ruling 678)": brief line 7. It is not an item of "What to build", which is right for an executor line.

Every part has a requirement. Items 2 and 3 (the title's counts dropped, `transition.md` deleted) and the removal of the two summaries and the grid are not in the line. They follow from removing the three groups, and they are booked in `choices.md:6049` (`grep -n 'O150' .scratch/migration/choices.md`).

The quote of the plan line at brief line 11 is garbled. It writes "`tiers: [research] }`, ...), `discover: true`, `sort: folder`)". The ")" after "..." closes nothing, because the elided clause has no parenthesis of its own. The quote should end the elision as "`tiers: [research] }`, ..., `discover: true`, `sort: folder`)" or quote the line whole.

## Premises

Checked and holding:
- `deck/present.yml` has 54 lines (`wc -l deck/*`). It holds `pillars` (7 named, `find` over `projects/*/*/present` with a stage list), `more` (6 named, `discover: true`, `sort: folder`, two globs) and `ideas` (9 named, `discover: true`), with the order as stated (`cat -n deck/present.yml`).
- `deck/title.md:4` is `legend: pillars` and `:8` opens "{{pillars.count}} pillar projects and {{more.count}} more." `deck/transition.md:3` is `legend: more` and `:6` is "# {{more.count}} more, same backbone". `engine.md` and `closing.md` name no group.
- `read.ts:341-351` is `countOf`, a sum of the slides of the drawn members.
- `groups.ts:70` is `within(find.tiers, project?.tier)`. `groups.ts:4-8` describes the members. `spec.ts:158-165` is the `sort` check (`folder` or `title`).
- `docs/HELP.md:331` says "A deck whose groups hold project decks has a filter under the toolbar".
- The globs: `python3 -c "import glob; ..."` prints `22 25` and the three extra paths as stated. Node's own `fs.globSync('projects/**/present', {cwd: hub})` also returns 25. All 25 folders hold a `present.yml`.

Not holding:
- Brief line 15, "in the hub at its head, clean". The hub is not clean. `git status --short` in the hub prints ` M .oculus/data/academic/funding.yml`, ` M funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md` and three untracked paths under `funding/2026-fwo-senior-transplant/proposal/proposal/`. Case C4 and Verify 3 depend on this premise (see Cases).
- Brief line 20, "94 research manifests". `find projects -name project.yml | xargs grep -l '^tier: *research' | wc -l` prints `95`, which a `yaml.safe_load` count over the same files agrees with. That is 25 with a deck and 70 without, which matches O151's "70". The brief should say 95.
- Brief line 20, "Every research project sits at `projects/<a>/<b>/` or `projects/<a>/<b>/<c>/`". The depth count over the research manifests is `Counter({3: 54, 5: 32, 4: 9})`. The 32 projects at the deepest level sit at `projects/<a>/<b>/<c>/<d>/` (`archive/published/<year>/<p>`, `coauthor/published/<year>/<p>`), and `hccnet-fl` and `dongho-ecg-clustering`, which the brief itself lists, are among them. The brief should say "`projects/<a>/<b>/`, `projects/<a>/<b>/<c>/` or `projects/<a>/<b>/<c>/<d>/`". The `**` conclusion is unaffected.
- Brief line 7, "the step's worktree holds no change". No O150 worktree exists: `ls .agents/worktrees` lists only `gate` and logs. The brief should say there is none, or the worktree should be created first.
- Brief decision 2, "past any frame", is not measured. It holds for the "about 95" rows after O151, a judgment. For 25 rows in a 1280 by 720 frame, nothing in the brief measures it. The brief should either state it as not verified for today's 25 or measure it at the look.

Not in the brief at all: the read cost of the ruled glob, which I measured on this machine.
- `node -e "fs.globSync('projects/**/present', {cwd: hub})"` takes 1098, 1084 and 1023 ms over three warm runs. `projects/*/*/present` takes 2 ms. There are 8778 folders under `projects/` (`find projects -type d | wc -l`), including virtualenvs and `code/vendor/venv`.
- The reader runs this glob once per reader (`read.ts:259-286`, cached per reader only). A reader is created on every deck route read (`src/lib/server/content/deck/read.ts:100`), which includes every filter pick (`?keep=`) and the print page, and on every snapshot build (`src/lib/data/index.ts:339-354`, which reads the portfolio deck), so on every watcher rebuild.
- Three bounded globs, `[projects/*/*/present, projects/*/*/*/present, projects/*/*/*/*/present]`, find the same 25 in 31 ms with the same Node call.
- The brief takes decision 4 without naming this cost, and it is a cost a reader of the Present view sees. It should state the measured cost and weigh the two forms. My judgment is that the bounded list is the better option: it covers every depth a research project sits at today, and the cost of `**` is paid on every read.

## Cases and checks

- C1, "Checked ... by the glob", is circular. The deck's group uses the same `projects/**/present` glob, so a research deck the glob cannot reach would be missing from both, and the check would pass. The check should enumerate independently, from the manifests: every research `project.yml` whose folder holds `present/present.yml` (25 today), compared by name with the Overview's members.
- C1's "a group count of the Overview equal to the sum of their slides" is true by construction. `groupsOfDeck` sets `count: countOf(...)`, which is that sum (`read.ts:593`, `:345-351`), so it cannot fail. It should name expected values instead: group count 25 (one slide per deck; each member's order files hold two `---` lines, one front matter) and 28 deck slides in all (title, engine, 25, closing).
- C2 asks for findings of `engine.md` and `closing.md`, which the step does not change, and nothing in them names a group. The check is harmless, but it is a check of places the step leaves alone. If `engine.md` joins the write list (see Names), the check becomes relevant.
- C2 does not name the one command that reads the real portfolio deck. That is `OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts` from oculus main: the case "reads the portfolio deck with every named deck found" (`integrity.test.ts:264-271`) asserts `state` `ok`, `findings` `[]` (member decks' findings included, `read.ts:688`) and no missing names. Because oculus changes nothing in O150, the plan's verify list at landing (`npm run test:quick`, related tests only, `orchestrator-state.md:7-9`, `:140`) runs nothing that reads the hub. "The plan's whole verify list runs once, at landing on main" therefore checks nothing of this step. The brief should name the integrity run with its expected result, which by my reading of the reader is green, since `fed-faithful-ecg`'s deck is already held to no finding by the case at `:228-238`.
- C3 gives no expected numbers. They are "Filtered: 11 of 25 decks" and 14 slides (title, engine, 11, closing). Today 11 decks are at stage `submitted`, listed by reading each manifest's `stage`.
- C4 and Verify 3 ("`git status --short` lists the three paths and nothing else") fail on the tree as it stands, because the hub holds five paths changed outside the step (see Premises). They should read: `git status --short deck` lists ` M deck/present.yml`, ` M deck/title.md` and ` D deck/transition.md` (and `deck/engine.md` if it joins), and the whole `git status --short` equals its first run plus those lines.
- Verify 2 uses `LC_ALL=C grep -n '[^ -~]'`, while `spec.md:103` says the perl gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it". The perl gate as written runs over oculus's `src tests bin config`, not hub files, so the brief should either give the perl form over the deck files or say why the grep form applies to hub text. The deck files are ASCII today: the grep over `present.yml`, `title.md`, `engine.md` and `closing.md` prints nothing.
- Verify 4 and item 4 name "the scratch hub copy" with no path. They also do not say the copy is brought to the hub's current `projects/` before the look. A stale copy (for example one without `archive/failed/fed-faithful-ecg/present`) would show fewer than 25 decks, and C1 to C3 would be read against the wrong tree.
- `spec.md:72` asks for the name grep to be quoted in the report, and for every doc paragraph describing the behaviour to be listed as "still true" or "rewritten". The brief's Report section asks for neither. It should ask for both, covering `deck/engine.md:12`, hub `README.md:60` and `.oculus/config.yml:26`.
- `spec.md:84` asks the report for every limitation and judgment call. The brief's Report section omits them. Its list of visible changes should name at least these:
  - the first project slide after `engine.md` is `archive/failed/fed-faithful-ecg` (folder order puts `archive/` first);
  - the nine `kind: idea` slides are drawn as slides of their own in the run, where before they were cards of the grid;
  - the title legend grows from 4 domains (liver, method, heart, brain) to 7 (adding meta, privacy, liverfl).

## The question

Could each item or case pass without the goal being reached?
- Item 1: yes, in one case. A research project whose deck lives in its own repository (a workspace folder) is out of reach of a hub glob, because `under` globs only under `doc.root`. I found no such project today: the seven workspace repositories are tier personal or software (`grep -m1 '^tier:' <repo>/.oculus/project.yml`). Item 1 can also pass while adding about 1 s to every read, which is not the goal but is a cost of the item (see Premises).
- Item 2: no. It only removes counts that would otherwise be `count_unknown` findings.
- Item 3: no, for the same reason.
- Item 4: yes, if the look's hub copy is stale or unnamed (see Cases).
- C1: yes, because the comparison is with the same glob. The count part cannot fail at all.
- C2: yes. Findings-free deck files say nothing about membership. That is acceptable for its purpose, but the integrity run is the command form.
- C3: yes, if a non-submitted deck is missing; C1 has to catch that. C3 as written proves narrowing only for one value, not that every facet value reaches all 25.
- C4: it would fail on unrelated hub changes rather than pass falsely. It does not bear on the goal.

## Implied inputs

- A research project whose `present/` folder has no `present.yml`. It is skipped silently (`read.ts:279`, no finding). Today: none; `find projects -type d -name present` gives 25 and all 25 hold the file. The expected result is "not a member, no finding". After O151, a deck written without `present.yml` would vanish without a finding. The manifest-based C1 check catches it, which is a reason to adopt it.
- A `present` folder nested inside a project (`code/present`, `present/x/present`). `projectOf` gives null and `within(['research'], undefined)` is false, so the deck is dropped with no finding. Today: none, since the `find ... -name present` paths outside the project-root form print nothing. The expected result is "not a member". The brief covers this at line 21.
- A tier research project in `coauthor/`. It is kept as a member. Today none has a deck; after O151 some will. The expected result is "member". The brief should say so, since the goal "every research project's deck" includes them.
- A research project in its own repository. It is unreachable by the glob, and none exists today (see The question). The brief should state the expected result: not reached by this group.
- A software-tier project with a deck. It is excluded by `tiers:`, and none exists today.
- Two research projects with the same folder name. Both would be dropped with a `name_twice` finding (`groups.ts:93-106`). Today none: `... | xargs -n1 basename | sort | uniq -d` over the 95 prints nothing. This matters for O151; the expected result today is no clash.
- A member whose `domain` is not in the registry. That raises a finding on the `project.yml`, inside the deck's findings. Today all seven domains are in `.oculus/data/pillars/domains.yml` (checked against its `entries`).
- Of these, the ones whose wrong answer would cost something are:
  - the deck without `present.yml`, which vanishes silently; expected not a member, and caught only by a manifest-based C1;
  - the stale look copy, which gives wrong case results; expected 25 decks.

## ADRs

None. `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. `find . -path ./node_modules -prune -o -ipath '*adr*' -print` prints nothing, and `grep -n -i adr .agents/plan.yaml` prints nothing. The brief's line 5 holds.

## Dictated text

The brief dictates YAML values and one key value. It dictates no prose.
- `grep -n 'One group, named' O150.md` gives line 26: group `research`, `find: { folders: [projects/**/present], tiers: [research] }`, `discover: true`, `sort: folder`, order `title.md`, `engine.md`, `{ slides: research }`, `closing.md`. This holds. It is ASCII, and it parses as intended with both `yaml.safe_load` and the `yaml` package oculus uses (`node -e "require('yaml').parse(...)"` prints `{"find":{"folders":["projects/**/present"],"tiers":["research"]}}`). The glob choice itself is the finding under Premises.
- `grep -n 'legend:' O150.md` gives line 27, "`legend:` names `research`". This holds.
- Line 27's "keeps the thesis sentence as written" leaves `title.md:8` from "A shared thesis:" onward. That is existing hub text, ASCII, with no dash or contrast construction. It holds.

## Declined to judge

- Whether a failed project's deck (`fed-faithful-ecg`, a NO-GO) belongs in a deck whose own rule line, `deck/present.yml:1`, says "never a null or negative result". Rulings 685 and 678 ("every research project's deck, the failed and stopped ones included") settle it as Axel's.
- Whether dropping the two summaries and the idea grid (decision 2) is the better option or the cheaper one. It is booked for Axel's review in `choices.md:6049`. Under a filter pick the summary would hold fewer rows, so the "past any frame" reason holds for the unfiltered deck only. That is my judgment; a measurement at the look would settle it.
- Whether `sort: folder`, which opens the run with the archived decks, gives the talk order Axel wants. The ruling dictates `sort: folder`.

Brief-check usage: ac08585b688c6436b, claude-opus-5-5, 184707 tokens, 65 tool uses, 11 min 35 s.

## Closed

Each finding is closed by a change to `briefs/O150.md`, or raised to Axel:

- Names, `deck/engine.md:12` made false: raised as open item 689 (a change to the hub's words outside the step's line). The brief names it under "What is on the tree" and in the report's doc list; the step leaves `engine.md` as it is.
- The step line's quote: quoted whole, from the corrected line.
- Premises: the hub's unrelated changes are listed and `git status --short deck` is the check; 95 research manifests at depths 3, 4 and 5; the worktree is made at the base and holds no change.
- The glob's read cost: the globs become one per depth, `[projects/*/*/present, projects/*/*/*/present, projects/*/*/*/*/present]`, 25 decks in 24 ms against 1455 ms for `projects/**/present` (`fs.globSync` in the hub); the plan's line and `choices.md` are corrected.
- Decision 2: the overflow is stated as a judgment, not measured.
- C1: enumerated from the manifests, with the expected 25 members, group count 25 and 28 slides, and the first project slide named.
- C2: the integrity run from oculus main is the command, and Verify 3.
- C3: "Filtered: 11 of 25 decks" and 14 slides.
- C4 and Verify 4: `git status --short deck` with the three expected lines, the whole status equal to its first run plus those.
- Verify 2: the perl form over the deck files.
- Verify 5: the hub copy's path and the rsync that refreshes it, with the count of 25.
- Report: the name grep, the doc paragraphs, the limitations and the visible changes named.
- Implied inputs: C5 (coauthor decks are members, a repository's deck is not reached, a repeated folder name), and the `present` folder with no `present.yml` under "What is on the tree".
