# Brief: PR2, Present decks from any folder, one format for every deck

Size: a full step

Read `tools/oculus/.scratch/migration/agents/spec.md` first; its rules govern this step unchanged. Then, in full: `tools/oculus/.scratch/migration/agents/briefs/PR2-design.md` (Axel's ruled design, Z637 to Z640, which this brief builds and never changes), and `tools/oculus/.scratch/migration/agents/guarded.md` entries G2, G8, G9, G12, G14, G16, G21, G24 and G32. No ADR folder exists (`ls tools/oculus/docs/adr docs/adr` fails for both), so no ADR touches this step.

A design ruling decides what is built. It never exempts the code: every line is written to the standards pages, so that people can read, use and maintain it.

The worktree is `.agents/worktrees/PR2`. Its sparse checkout holds the plan's paths plus `deck`, `docs` and `.agents/skills`, which this step writes at the hub's root. The base copy is `.agents/worktrees/PR2-base/tools/oculus/` with `unused-exports.txt` beside it, unpacked by the orchestrator at the base. Your scratch server uses port 8792.

## What is on the tree (read on main at 4ce24363b)

- A deck today is one file, `tools/oculus/config/present.yml` (273 lines, `wc -l`), under one `deck:` map: `tag_tones`, `meta` (kicker, title_html, lede, a hand-typed `legend`, `hint`, closing words, contact), `themes` (eleven domain colours and labels copied by hand from `config/catalogs/vocab.yml`'s `domains`), `order` (21 lines of `{ slide: <kind>, ref: <key> }`), `framing` (`engine`, `transition`), `summaries` (`summary1` eight hand-typed rows, `summary2` six), `ideas` (ten hand-typed cards with `maturity`) (`cat config/present.yml`). The Slides view saves `selection:` and `slide_order:` into this file when it is used; the file holds neither today (`grep -c -E "selection:|slide_order:" config/present.yml` prints 0).
- A project's slide is the `present:` map of its `PRESENT.md` front matter. `find projects tools/oculus/demo -name PRESENT.md` lists 18 files (premise corrected: an earlier count used `-maxdepth 3` and missed the archive):
  - 13 under `projects/manuscripts`, `projects/active` and `projects/ideas` declare `present:` and none declares `slides:`; their figures are in `present/` beside the file (`find projects -maxdepth 4 -type d -name present`).
  - `projects/ideas/asthma-geo-tensor/PRESENT.md` is the unfilled template.
  - `projects/manuscripts/ecg-readable-substrate/PRESENT.md` and `projects/archive/nogo/fed-faithful-ecg/PRESENT.md` are prose with no `present:` map.
  - `projects/archive/published/2026/hccnet-fl/PRESENT.md` declares a full `present:` map (10 keys) with its figure `present/eq_hccnetfl.png`; today's `config/present.yml:48` places it in the deck.
  - `tools/oculus/demo/projects/active/graph-bandits/PRESENT.md` declares `present:` and a `slides:` list of one more slide, `id: ablations` (`:23-27`).
- The readers of `PRESENT.md`, of `project.present` and of the deck (`git grep -l -E "PRESENT|\.present\b|deckSources|slideTagClasses|deckWrite|'deck'"` over `src` and `tests`):
  - `src/lib/data/sources/present.ts` (403 lines): `readPresent` reads one `PRESENT.md` into `PresentSlide[]` with findings (figure missing, equation naming an image, slide id twice, unreadable file); `deckFindings` checks `order:`.
  - `src/lib/data/helpers/deck.ts` (188 lines): `PRESENT_DOC`, `DECK_KINDS`, `OPEN_TIERS` (`:40`), `deckEntries`, `deckChoice`, `catalogKeys`, `defaultKeys`, `deckSources`.
  - `src/lib/data/index.ts`: `DECK_FILE` (`:40`), `deckFile` (`:182`), the snapshot's `project.present` (`:197-256`).
  - `src/lib/data/snapshot/normalise.ts:33,293,339,753`: imports `PresentSlide` and sets `project.present` from `raw.present`; `src/lib/data/model/index.ts:60` `RawPortfolio.present`.
  - `src/lib/state/boards/board/items.ts:176-192`: `markdownDocNames` adds the `PRESENT.md` document when `project.present` is not empty.
  - `src/lib/server/edit/writes/config/config-sources.ts:13,19,60-66` and `src/lib/state/system/config/editors/sources.ts:15,24,108-115`: the Settings option sources `slides` (from `deckSources`) and `slide_tags` (`slideTagClasses` over `project.present`); `config/catalogs/options.yml:972` reads `values_from: slide_tags` for the `tag_tones` keys.
  - `src/lib/state/life/present.ts` (473 lines) and `present.svelte.ts` (92 lines): the typed `Deck` read from the merged config, `deckSlides`, `deckCatalog`, the `PresentStore`.
  - `src/lib/state/life/slides.ts` (139 lines) and `src/lib/views/academic/slides/Slides.svelte` (336 lines): the catalog with ticks and order, saved by `writeDeck`.
  - The write `deck`: `src/lib/server/edit/writes/config/deck.ts` (133 lines), `src/lib/server/edit/deck-edit.ts` (64 lines), routed at `writes/config/config-write.ts:61`, undone at `writes/undo.ts:313`, its body `DeckWrite`, `deckShape` and `deckWrite` at `writes/bodies.ts:96-100,260-264,394-399`, gated at `writes/app-gate.ts:78`, closed to apps at `src/lib/data/helpers/files/apps.ts:134` (`CLOSED_WRITES`), on the client at `state/client/writes.svelte.ts:404` and `state/shared/stores/shapes.ts:221`, named in the History view by `config/text/views/system/history.yml:49` `kind_deck`. `~/.oculus/changes.jsonl` holds two `deck` records (`grep -c '"kind":"deck"'`).
  - `src/lib/server/edit/list-edit.ts` (193 lines): `setList`/`setItems(source, owner, field, items)` rewrite a list under one top-level map only; a flow list (`[a, b]`) is rewritten as a block list (`:141-152`).
  - The Present parts under `src/lib/views/academic/present/` (`Present.svelte` 502 lines, `Slide.svelte`, `Overview.svelte`, `Panel.svelte`, `markup.ts`, and `parts/`). The keys are bound in `Present.svelte` (`o`/`O` at `:249`, `f`/`F` at `:254`, the arrows, Space, Home and End above); no key catalog exists under `config/` (`ls config config/catalogs`). `Panel.svelte:29-32` draws a figure with `fileUrl(HUB_ROOT, \`${folder}/present/${panel.figure}\`)`.
  - `src/lib/views/shared/card/card.ts:94` `deckSlideOf` and `ProjectCard.svelte:182-195`: the card's deck control opens Present at the project's slide; its words `config/text/views/boards/project.yml:78-79` (`present`, `present_tip: open the public deck at this project's slide`).
  - `src/lib/views/boards/project/Project.svelte:50,72-77`: the project tab lists `PRESENT.md` among its Markdown documents.
  - `src/lib/server/content/docs.ts:49,74-84` (`api/docs` serves `PRESENT.md`), `src/lib/server/content/audit/projects.ts:35` (`SCANNED`, the TODO and VERIFY markers), `src/lib/server/root/watch/portfolio.ts:45,144-158,163-183` (a watch event on `PRESENT.md` rebuilds the snapshot), `src/lib/data/sources/docs.ts:9`, `src/lib/data/model/model-entities.ts` (`PresentSlide`, `DeckKind`, `DeckEntry`, `DeckMeta`, `DeckTheme`, `DeckFraming`, `DeckSummary`, `DeckIdeas`, `Deck`, `DeckSlide`, `Project.present`).
  - `src/lib/data/sources/config/catalog/options.ts:88-89,445-446,494-497`: the option sources `deck_framing` and `deck_summaries`; `config/catalogs/options.yml:963-1141`: the Settings catalog's `present.yml:` section.
  - `config/text/views/system/workbench.yml:22` `desc_present` names "the deck slides, the domain themes, the tag tones and the order".
  - `tools/oculus/docs/apps.md:271`: a Project in the portfolio apps read has `present?`, a list of slides.
  - `src/lib/server/git/git-index.ts:336` matches `PRESENT` only in `ALREADY_PRESENT`; not a reader. `tests/fixtures/present.ts` is a value-presence helper (`present<T>(value, what)`) with nothing to do with decks; this step does not touch it.
  - Tests: `tests/data/sources/present.test.ts` (G32), `tests/server/edit/deck-edit.test.ts` (G8), `tests/server/edit/writes.test.ts:153` (G8, asserts `'  chips: [exploring]'` for a new idea), `tests/routes/edit/write-fixture.ts:267-281`, `tests/routes/edit/undo/undo.test.ts` (G9), `tests/server/core/changes.test.ts` (G9), `tests/checks/config/integrity.test.ts` (G14, counts the real hub's `PRESENT.md` front matter), `tests/checks/config/config.test.ts:177`, `tests/checks/config/config-folder.test.ts:118` (G12, `'present.yml': ['deck']`), `tests/checks/tree/boundaries.test.ts:32,42-44,169` (G16, `data/helpers/deck`), `tests/checks/tree/allow-duplication.txt:30` (G21, names `present.test.ts`), `tests/data/snapshot/normalise.test.ts:235` (`present: {}`).
- Guarded entries naming deck tests (`agents/guarded.md`): G8, `deck-edit.test.ts` 'replaces a list in place and keeps every comment around it'; G9, `changes.test.ts` 'records the deck's two lists as the file held them and as it holds them now' and `undo.test.ts` 'puts the deck's two lists back to what the save before them left'; G32, `present.test.ts` 'reads the front matter into one slide under the project id'. G32 guarantees that a parser reads a well-formed file into the values it holds; it says nothing of malformed files.
- Scan tiers are the basename of each `scan:` dir (`model-entities.ts:15`; `config/sources.yml`), so `tiers: [active, manuscripts, ideas]` names three of them and leaves `archive` out.
- `config/catalogs/vocab.yml:51` `domains:` holds twelve keys, each `{ color, label }`. `status_legend` (`:74`) holds the chips with `icon` and `label` (`exploring` at `:95`, `parked` at `:96`); `status_palette` (`:106`) holds their colours (`exploring` at `:119`); `status_palette` also feeds the collection-entry statuses (`data/index.ts:146`). `manifest-schema.yml:36` takes `status.chips` from `status_legend`. The demo's `graph-bandits/project.yml:11` has `domain: graphs`, which `vocab.yml` does not hold.
- Idea maturity today: of the 33 idea manifests (`projects/ideas/*/project.yml`), 32 carry `chips: [exploring]` written inline (`grep -l` counts 32) and `fedbtd` carries `parked`. The grid's ten cards are nine of those 32 plus FedBTD. Premise corrected: the design says "the other 21 `exploring` ideas"; the count is 23, computed with a `yaml.safe_load` loop: adapter-format-theory, asthma-geo-tensor, attention-scoped-instructions, block-term-nca, brecht-fl-partitioning, concept-bottleneck-hcc, conformal-tensor-factors, engram, faithful-interpretability-position, fed-duplication-limits, fed-neural-operators, fedlink, harmonop, modality-dropping-btf, multiway-biosignal-fm, neurosde, paleogenomics-tensor, pathology-tensor-mil, physics-tensor-hcc, serial-ecg-af, strokeop, tao-of-ecs, xsub-ecog-framework.
- `exploring` is also the chip of four active projects (`eeg-saad-challenge`, `loewner`, `novel-math-primitives`, `linfoot-estimator`) and one coauthor project (`chi-purpose-centric`), a status of `network/joint-work.yml` (`config/layout.yml:152`) and an "in progress" key of the coauthor board (`config/layout.yml:141`), so it stays in the vocabulary.
- New idea manifests: the New idea write writes `chips: [exploring]` (`src/lib/server/edit/writes/manifest.ts:444`); the `project-new` skill copies `tools/cockpit/templates/project.idea.yml` (chip `gate-pending` at `:11`) and offers an optional `PRESENT.md` (`.agents/skills/project-new/SKILL.md:44,46`) from `tools/cockpit/templates/docs/PRESENT.md`.
- The hub's documents name `PRESENT.md` or the old deck: `README.md:23`, `docs/DATA-MAP.md:88,89,217,234,253,254,311,356`, `.agents/skills/project-new/SKILL.md:44,46`, `.agents/skills/project-cleanup/SKILL.md:36,191`, `.agents/skills/remove-unicode/SKILL.md:176`, `tools/cockpit/templates/project.active.yml:7`, `tools/cockpit/templates/project.idea.yml:2`, `tools/oculus/DESIGN.md:43,61,113,385,392`, `tools/oculus/HELP.md:81,139,298` and the other Present and Slides lines. `tools/oculus/demo/README.md:5` names a test `tests/data/demo-hub.test.ts` that does not exist (`ls tests/data`). `projects/manuscripts/raw-pls/code/campaigns/brats_realdata/saliency_overlay_figure.py:8` names `PRESENT.md` in project code, outside this step's write rights; the report lists it.
- The cockpit's public deck: `tools/present/build.py` (364 lines) and `deck_config.py` (106 lines) build `tools/present/present.html`, the hub's public showcase, from every project's `PRESENT.md` front matter; `.agents/skills/research-cockpit/SKILL.md:62,92-95` tell a SYNC run to edit `PRESENT.md` and rebuild it; `docs/DATA-MAP.md:138` describes it. O29, which retires the cockpit, is paused (Z425). Axel ruled Z650 (b): this step does not update them (part 9).
- The Files view's row menu (`src/lib/views/shared/explorer/tree/menu/row-menu.ts`) has Open LaTeX (`ROW_LATEX` at `:78`, its fact at `:223`, the item at `:262`, the action at `:506-517`).
- Change pushes: the `files` channel's version moves on every write under a root the git watcher watches (`src/lib/state/sources/files.svelte.ts:12-16`).
- Dependencies already installed: `yaml`, `marked`, `katex`, `dompurify` (`package.json:74-102`); `src/lib/data/sources/docs.ts` has `splitFrontmatter` and `readFrontmatter`. No `npm run demo` script exists (`grep -c demo package.json` prints 0).
- No `deck/` folder and no `portfolio_deck` key exist (`ls deck`, `grep -n portfolio_deck config/sources.yml`).

## What to build

The whole of `PR2-design.md`, in these parts. Every name and shape the design gives is used as written.

### 1. The deck format, read on the server

A deck is a folder holding `present.yml` and Markdown slide files.

`present.yml`:

```yaml
deck:
    title: <the deck's title>
defaults:                  # optional; overrides config/present.yml's defaults for this deck
    tag_tones: { ... }
groups:                    # optional
    <group>:
        find: { folders: <glob or list of globs>, tiers: [<tier>...], status: [<chip>...] }
        discover: true     # optional, default false
        sort: folder       # optional, folder (default) or title
        slides: [<deck name>...]
order:
    - <file>.md                                   # every slide of that file, in file order
    - { slides: <group> }                         # the group's members' slides, in the group's order
    - { kind: summary, of: <group>, title: <text>, foot: <text> }   # title and foot optional
    - { kind: grid, of: <group>, title: <text>, lede: <text>, foot: <text> }
```

The split of a slide file:

- A slide file is an optional front matter and a body. The body is split into slides at each line holding only `---` that is outside a fenced code block (of any fence length) and outside an HTML comment, including one that spans lines.
- A slide after a separator opens with its own front matter when the separator is followed directly, with no blank line, by lines and a closing `---` line, and those lines parse as a YAML map. Lines that do not parse as a map (for example `# Where it wins` then `- item`, which YAML reads as a comment and a list) are the slide's body.
- A slide's front matter keys: `kind` (default `text`), `notes`, `legend: <group>`, and the kind's own keys below. The first slide's front matter is the file's.
- A file with only a front matter is one slide. An empty file is no slide and a finding.

The kinds, each drawn in the existing 1280 by 720 frame (`FRAME_WIDTH`, `FRAME_HEIGHT` in `state/life/present.ts`):

- `title`: `kicker:`; the first `#` heading is the title (it may hold `<br>`), the paragraphs after it the lede; `legend:` draws the group's domain chips.
- `section`: the `#` heading and the paragraphs after it; an ordered list is drawn as numbered cards, each item's leading bold text its card title; text after the list is the foot; `legend:` as above.
- `text`: the body as Markdown blocks: headings, paragraphs, lists, images, tables.
- `image`: a `#` heading and one image filling the rest of the frame, its alt text the caption.
- `columns`: the body split into two columns at a line holding only `|||`, each column Markdown blocks; a `#` heading before the first column spans both.
- `equation`: the `#` heading, the first display formula (`$$...$$`) drawn large, the rest of the body below it.
- `code`: the `#` heading and the first fenced code block, highlighted as the editor's Markdown preview highlights code.
- `closing`: `kicker:` and `contact:`; the `#` heading and the lede, as `title`.
- `project`: the rich project slide, drawn by today's `parts/Project.svelte`. Its front matter holds today's `present:` keys unchanged (`tag`, `title`, `sub`, `hook`, `eli5`, `equation`, `specs`, `panels`, `method`, `results`, `extra`), plus `mechanism:` and `headline:` for summaries. Its tone comes from its project's `domain:`. With no rich key it draws its body as Markdown.
- `idea`: one idea card: `desc:`, the name from the project's `short:` (its `title:` when there is none), the colour from its `domain:`, the maturity chip from its status chips (part 3).

Paths: images, `panels[].figure`, the files `order:` names and the globs of `find.folders` resolve inside the deck's served root only. An entry that leaves it (`..`, an absolute path, a symlink whose target is outside) is a finding naming the entry, and nothing is read through it (G2, G3). A figure that is not there is drawn as the gap and is a finding, as `resolveFiles` does today. An `order:` entry naming a missing file or a map of no known shape is a finding naming the entry, and places nothing.

Names: a deck's name is its folder's name, or, for a folder named `present`, its parent folder's name. A project deck is `<project folder>/present/` and belongs to that project. Two decks a group can see under the same name are a finding naming both paths, and neither is placed under that name.

Groups:

- `find:` lists the decks under the globs of `folders:`, relative to the deck's root, kept when the deck's project is in one of `tiers:` and holds one of `status:`'s chips. `tiers:` and `status:` left out keep every deck; a deck that belongs to no project, or a project with no `status.chips`, is dropped by either. A group never finds the deck it is declared in.
- A group with no `find:` resolves its `slides:` names against the project decks of the hub.
- The members are the decks `slides:` names, in its order, then, under `discover: true`, every found deck `slides:` does not name and no other group's `slides:` names, in `sort:` order (`folder`: the deck's path; `title`: its `deck.title`, then its name). A `sort:` value other than these two is a finding, and `folder` is used.
- A deck two discovering groups both find and neither names is in neither, and is a finding naming the deck and both groups.
- A name in `slides:` that matches no deck is a finding naming the group and the name; it places nothing. A name in two groups' `slides:` is a member of both.
- `{ slides: <group> }` places each member's slides in the member's own `order:`, every file it names. A member's own group entries are expanded the same way; a deck reached again while it is being expanded is a finding and places nothing a second time.
- `{{<group>.count}}` in any slide's text is replaced by the number of slides the group holds, a digit: every slide of every member's own `order:`, whether or not the deck places the group, as the design says ("any group, shown or not"). A count of a group that does not exist is a finding and is left as written.

Computed entries:

- `summary`: a table, one row per member project in the group's order: the field (the label of its `domain:` in `vocab.yml`'s `domains`), the project (its `short:`, its `title:` when there is none), and `mechanism:` and `headline:` from the member deck's first `kind: project` slide. A member with no project slide gives its field and name with the other two cells empty, and no finding: a text slide is a valid member. A member deck that belongs to no project gives its `deck.title` and empty cells.
- `grid`: one card per member, as the `idea` kind draws it from the member's first `kind: idea` slide; the cards' maturity chips are explained by a legend of the `status:` chips of the group's `find:`, each chip's words and colour from `vocab.yml`.
- `legend: <group>`: one chip per distinct domain of the group's member projects, in member order, each chip the domain's label and colour.

Colours: a domain colour, a status chip colour and a tag tone are painted through the palette as today (`toneOf` in `state/shared/words/tones.ts`), so every pair on a slide stays inside the set `tests/checks/look/contrast.test.ts` measures. `themes` is gone; colours and labels come from `vocab.yml`'s `domains`. A `domain:` that `vocab.yml` does not hold draws the neutral tone, an empty field and no legend chip, and is a finding naming the project and the domain. A deck's `defaults.tag_tones` overrides `config/present.yml`'s for that deck's slides.

A `present.yml` that is empty, does not parse, or holds no `order:` is a finding naming the file; the deck draws the empty state.

The reader is a server module that reads one deck folder into a typed deck with its findings, nothing thrown and nothing repaired, as `readPresent` is today, placed under `src/lib/data/sources/` beside the other hub parsers (G32's Code line). It replaces `data/sources/present.ts` and `data/helpers/deck.ts`. `OPEN_TIERS`, `selection`, `slide_order`, `DECK_KINDS`'s old kinds, `framing`, `summaries`, `ideas`, `meta` and `themes` are removed, and so are the types that held them. `deckSources` and the option source `slides` go with them; the option source `slide_tags` reads the `tag.class` of every `kind: project` slide of the hub's project decks.

### 2. Where decks live and how a view gets one

- `config/sources.yml` gains `portfolio_deck: deck`, with a comment saying it is the hub folder the Present view opens when no deck is named, and a Settings catalog entry in `config/catalogs/options.yml` (heading sources, control folder).
- `config/present.yml` keeps only `defaults: { tag_tones: { measured: green, design: amber, proof: purple, mixed: cyan } }`, with its head comment rewritten to say so; its Settings catalog section keeps only `defaults.tag_tones`. The option sources `deck_framing` and `deck_summaries` go (`options.ts`, `options.yml:1060`). `config-folder.test.ts:118` names `defaults` as the file's top key.
- A route serves one deck, read from a served root and a folder path (`api/deck`, under `src/routes/api/(docs)/`), with the page's token as every route that reads the disk, refusing a path outside the roots (G2) and never reading `config/local.yml` (G3). Its answer is the deck as the view draws it: the slides in order with their kind, words, tone and figure addresses, the groups with their members, candidates, missing names and conflicts, and the findings.
- The client holds each answer in the query client by root and path, as `state/sources/files.svelte.ts` holds a folder, and marks it stale on a new version of the `files`, `portfolio` and `config` channels.
- The snapshot no longer carries `project.present` (`RawPortfolio.present`, `normalise.ts`, `items.ts` changed with it). A project carries `deck?`, the path of its `present/` folder relative to the hub root when `present/present.yml` exists, for the card, the project tab and apps; `docs/apps.md:271` documents `deck?` in place of `present?`.
- The snapshot build reads the portfolio deck and every project deck, and their findings are the snapshot's findings, so the Audit view and the Findings view list them.
- The portfolio watcher rebuilds on a change to `present.yml` or a `.md` file inside a project's `present/` folder or inside the `portfolio_deck` folder (`relevant` and `namedByConfig` in `server/root/watch/portfolio.ts`).
- The audit's `SCANNED` (`audit/projects.ts:35`) scans the `.md` files of a project's `present/` folder in place of `PRESENT.md`.

### 3. Maturity as status chips

- `vocab.yml`'s `status_legend` gains `nascent` (icon `white`, label "nascent (concept)"), `scoping` (icon `yellow`, label "scoping (lit-check and framing)") and `de-risking` (icon `blue`, label "de-risking (feasibility experiment)"), after `exploring`; `status_palette` gains `nascent: "#7c5cff"`, `scoping: "#0891b2"`, `de-risking: "#16a34a"`. The labels are the words of today's grid hint (`config/present.yml`'s `deck.ideas.hint`).
- `exploring` stays for the active, coauthor and joint-work entries that use it.
- The idea manifests, through `convert-decks.py` (part 4) in the worktree's copy: the nine grid ideas take their grid maturity (btd-autoencoder scoping, florank-personalization scoping, clinical-ai-eval-artifacts scoping, ecg-af-fair de-risking, fl-privacy-auditing scoping, hccnet-fl-sweden de-risking, hccnet-pathology scoping, ssm-longitudinal nascent, quantum-tensor-fl nascent); the 23 others take `nascent`; `fedbtd` keeps `parked`. Only the `exploring` item of the `chips: [exploring]` line changes, each file otherwise byte-identical.
- The default chip of a new idea is `nascent`: `manifest.ts:444`, `writes.test.ts:153`'s assertion (G8), and `tools/cockpit/templates/project.idea.yml:11`.

### 4. The conversion, by a script

`tools/oculus/utils/convert-decks.py` (Python 3, standard library and `yaml` only, run from the hub's root in the worktree, writing nothing when a target file already exists, with `--check` printing what is left to convert and writing nothing) is the one writer of the hub data paths this step changes. The builder runs it in the worktree; the orchestrator commits its output at landing.

- Each `PRESENT.md` with a `present:` map (the 13, `hccnet-fl` in the archive, and the demo's `graph-bandits`) becomes `present/main.md` (front matter: `kind: project`, the `present:` map's keys in their order, then `mechanism:` and `headline:` from the project's row in today's summaries, per the table below, when it has one; no body) and `present/present.yml` (`deck: { title: <the present: title> }`, `order: [main.md]`). A `slides:` list becomes further slides of `main.md`, each after a `---` with its own front matter (`kind: project` and the entry's keys but `id`). The figures stay where they are.
- `asthma-geo-tensor/PRESENT.md`, the unfilled template, is removed and gets no deck.
- `ecg-readable-substrate` and `fed-faithful-ecg`: `present/main.md` (`kind: text`, the body of `PRESENT.md` without its comment line, its `# PRESENT:` heading turned into the slide's `#` heading with the `PRESENT: ` prefix removed) and `present/present.yml`.
- The nine grid ideas get `present/present.yml` and `present/main.md` (`kind: idea`, `desc:` the grid card's `desc`).
- The 32 idea manifests' chips, as part 3 says.
- The demo hub: `graph-bandits` as above, and `tools/oculus/demo/deck/` holds a small portfolio deck (a title slide, one group finding `projects/*/*/present` with `discover: true`, a summary, a closing slide); `tools/oculus/demo/config` needs no change, since `portfolio_deck` is read from the engine's `sources.yml`. `tools/oculus/demo/README.md:5` is rewritten to say what holds (no `demo-hub.test.ts` exists).
- `config/present.yml`'s content becomes the hub's `deck/`:
  - `deck/present.yml`: `deck.title: 'Structured models, everywhere they hide'`; the groups `pillars`, `more` and `ideas` and the `order:` as the design's `present.yml` block gives them, with two changes Axel ruled (Z652): `more`'s `find:` reads `tiers: [active, manuscripts]` (no `ideas`), and `ideas` has `discover: true`; every `slides:` written as a block list; the second summary keeps its title `'The wider portfolio, at a glance'`; each summary keeps its foot with the domain list removed (`summary1`: "Unified by structured, interpretable tensor models."; `summary2`: "The same structured-tensor backbone throughout."); the grid keeps its title, its lede and the foot "Each gated on a novelty check before committing."
  - `deck/title.md`: `kind: title`, `kicker:` as today, `legend: pillars`, the heading "Structured models,<br>everywhere they hide", the lede with "A dozen active projects spanning brain, heart, liver and immunity." replaced by "{{pillars.count}} pillar projects and {{more.count}} more." and the rest of the lede as written.
  - `deck/engine.md`: `kind: section`, the engine framing's title, lede, three cards as an ordered list, and its hint as the foot.
  - `deck/transition.md`: `kind: section`, `legend: more`, the heading "{{more.count}} more, same backbone", no lede, the hint as the foot.
  - `deck/closing.md`: `kind: closing`, `kicker: Thank you`, `contact:`, the closing heading and lede.
  - The deck's key hint is not carried (part 5 draws Present's own).
  - The words are carried byte for byte except where this list changes them; HTML tags in them (`<b>`, `<i>`, `<br>`, `&amp;`) are kept.
- After conversion no `PRESENT.md` is left under `projects/` or `tools/oculus/demo/`, and `config/present.yml` holds only `defaults:`.

The summary table the script uses:

| Project | Summary row |
|---|---|
| hccnet-revision | summary1 "HCCNet, longitudinal MRI prognosis" |
| covert-applied | summary1 "COVERT, vertical block-term tensors" |
| covert-theory | summary1 "COVERT, theory" |
| bttn-incident-af | summary1 "Incident-AF prediction (MIMIC-IV)" |
| raw-pls | summary1 "RAW-PLS, registration-free tumor MRI" |
| btfno | summary1 "BT-FNO, block-term neural operator" |
| bt-operator-theory | summary1 "BT Operator Theory, why it generalizes" |
| hccnet-fl | summary1 "HCCNet-FL, component-aware federation" (its own deck only) |
| bttd-source-eeg | summary2 "BTTD, source-reconstructed EEG" |
| dries-bttr-ecg | summary2 "Dries, AF substrate in normal ECG" |
| dongho-ecg-clustering | summary2 "Dongho, ECG representation benchmark" |
| fed-multicellular-immune | summary2 "Federated multicellular tensor" |
| meseret-cirrhosis | summary2 "Meseret, competing-risks survival" |
| ward-bttr-crosssubject | summary2 "Ward, cross-subject BCI decoding" |

`hccnet-fl` keeps its slide in its own deck; the portfolio deck does not show it, since the ruled `pillars` group does not name it and its `find:` tiers leave the archive out.

The prose under each `present:` block is read against the slide, file by file, by the builder (a reading, never the script): every sentence that says something the slide does not is quoted in the report under "Prose the slides do not carry", with its project. The 23 ideas given `nascent` and the converted `ecg-readable-substrate` and `fed-faithful-ecg` slides are listed in the report.

### 5. The Present view

- A Present pane's instance state holds the deck's `root` and `path` beside `slide` and `overview`; a pane with no deck named, including one saved before this step, opens the portfolio deck (`portfolio_deck` on the hub root) at its first slide. The tab is labelled with the deck's `deck.title`, or its name.
- The toolbar gains a deck menu listing the portfolio deck, every project deck, and the decks opened in that pane before (up to ten, kept in its instance state), which opens the chosen deck in the pane.
- The overview, the counter, the keys and PR1's full screen work over any deck as they do over today's.
- Present draws its key hint itself, in the foot of every deck's first slide: a new word `present.key_hint` in `config/text/views/academic/present.yml` naming the keys `Present.svelte` binds (the arrows and Space to move, `O` for the overview, `F` for full screen). No deck file holds a hint.
- An empty deck, a folder with no `present.yml`, an unreadable `present.yml` and a `portfolio_deck` folder that does not exist each draw the view's empty state with a sentence naming the folder.
- The project card's deck control opens that project's own deck, and is shown only for a project with `deck`; its tip in `config/text/views/boards/project.yml` (`present_tip`) is rewritten. The project tab drops `PRESENT.md` from its documents and shows an Open presentation control for a project with a deck, its word in the same file.
- `config/text/views/system/workbench.yml:22` `desc_present` is rewritten to what the view draws.

### 6. Open presentation in the Files view

The Files view's row menu gains Open presentation (`files.menu_present` in `config/text/views/sources/files.yml`) on a folder that holds `present.yml` and on a file named `present.yml`, after Open LaTeX, opening the Present view on that folder with the folder's name as the tab's label, as Open LaTeX does.

### 7. The Slides view

The Slides view is about the deck of the Present pane it was opened from. It lists each group of the deck: its members in order (named ones ticked, discovered ones ticked and marked found), its candidates (found, not members, unticked), its missing names (marked missing) and its conflicts (marked, naming the other group). A tick adds the deck's name to the end of `slides:`, an untick removes it, a drag reorders within the group, and Save writes each changed group's `slides:` into the deck's `present.yml`, every other byte of the file kept. `selection:` and `slide_order:` are gone. Save is refused on a deck whose `present.yml` is unreadable.

- The write is a new write kind, `deck-slides` (`{ root, path, group, base, slides }`, `base` the list as the view read it), replacing `deck`: it refuses a path outside the roots, a file not named `present.yml`, a group the file does not hold, a `base` the file's list no longer equals (with G8's sentence that the file changed), a repeated name and a name that is neither a member, a candidate nor a missing name of the group; it writes through the list edit with its result read back and compared, as `setDeckLists` does, so a file whose shape the edit cannot keep is refused whole. `setItems` takes a key path for its owner (`['groups', <group>]`), its current callers unchanged. A flow list is rewritten as a block list that reads back to the new values.
- It is recorded in the change log with the list before and after, and undone by writing the list back. It is added to `CLOSED_WRITES` (`apps.ts:134`), to `bodies.ts` and `app-gate.ts` as `deck` is, and named in `history.yml` (`kind_deck_slides`).
- The two `deck` records already in `~/.oculus/changes.jsonl` stay named in the History view (`kind_deck` kept), and their undo is refused with a sentence in `history.yml` saying the deck they changed no longer exists; nothing is written to `config/present.yml`.

### 8. Documents

Every sentence the change makes false is rewritten: `tools/oculus/DESIGN.md` (:43, :61, :113, :385, :392), `tools/oculus/HELP.md` (:81, :139, :298 and every other line `grep -n -i "present\|deck\|slides"` finds), `tools/oculus/docs/apps.md:271`, `README.md:23`, `docs/DATA-MAP.md:88,89,217,234,253,254,311,356`, `.agents/skills/project-new/SKILL.md:44,46` (an optional `present/` deck from `templates/docs/present/`), `.agents/skills/project-cleanup/SKILL.md:36,191`, `.agents/skills/remove-unicode/SKILL.md:176` (every deck's `present.yml` and slide files, `deck/`), `tools/cockpit/templates/project.active.yml:7`, `tools/cockpit/templates/project.idea.yml:2`. `tools/cockpit/templates/docs/PRESENT.md` is replaced by `tools/cockpit/templates/docs/present/present.yml` and `main.md` (`kind: project` with empty keys). Each comment that names `PRESENT.md`, `selection:`, `slide_order:` or a removed kind is rewritten. `tests/checks/tree/boundaries.test.ts` and `allow-duplication.txt` name the new modules in place of the removed ones.

### 9. The cockpit's public deck (ruling Z650)

Axel ruled (b): the cockpit is not updated, since it is to be deleted. `tools/present/` (`build.py`, `deck_config.py`, `present.html`, `content/`) is left exactly as it is. `.agents/skills/research-cockpit/SKILL.md:62` names a project's public slide as `present/main.md` (its `kind: project` front matter, public-safe fields only); `:92-95` drop the rebuild of the public present deck and say that oculus's Present view is the deck; `:99`'s `present` command says `tools/present` is the cockpit's old showcase, no longer rebuilt. `docs/DATA-MAP.md:138` says the same of `tools/present/`.

## Cases

The builder's first task, before any change, is the first run of every case on the unchanged tree, with each result noted.

1. The portfolio deck (`deck/` on the hub) draws, in order: the title (lede "7 pillar projects and 7 more.", legend chips of the pillars' domains, the key hint in the foot), the engine section with three numbered cards, the seven pillar slides, the pillars summary (seven rows, field the domain label, project the `short:`, mechanism and headline read from each `main.md`), the transition ("7 more, same backbone"), the six named `more` slides then `ecg-readable-substrate` (found by discovery, `sort: folder`), the `more` summary (seven rows, `ecg-readable-substrate`'s mechanism and headline empty), the idea grid with nine cards and the maturity legend, the closing slide. A `headline:` changed in one `main.md` changes that summary row at the next push. Unchanged tree: `config/present.yml`'s deck.
2. `{{pillars.count}}` reads 7; `{{ideas.count}}` reads 9 though `ideas` is never placed by `{ slides: }`; a count of a group the deck lacks stays as written and is a finding.
3. A slide file with three slides split by `---`, the second opening with `kind: image` front matter directly after the separator, the third after a blank line: three slides, kinds text, image and text.
4. A `---` line inside a fenced code block, and one inside a multi-line HTML comment, do not split the slide.
5. A separator followed directly by `# Where it wins`, `- item` and `---`: no front matter; the lines are the slide's body.
6. A group whose `slides:` names `nope`: a finding naming the group and `nope`; nothing placed; the Slides view shows it missing.
7. Two groups with `discover: true` and the same `find:` over a deck neither names: the deck is in neither; a finding naming the deck and both groups, in the Audit view and the Slides view.
8. A deck named in `pillars`'s `slides:` is never added to `more` by discovery.
9. `find:` with `status: [nascent, scoping, de-risking]`: `fedbtd` (parked) is never found. A tenth idea given a `present/` deck and a `nascent` chip, named nowhere, appears in the idea grid by discovery and never among `more`'s slides (Z652).
10. A deck whose group's member is the deck itself through `{ slides: g }`: a finding; nothing placed twice; no hang.
11. A member deck whose `order:` names two slide files: `{ slides: g }` places both files' slides, and the group's count counts them.
12. A figure that is not in the deck's folder: drawn as the gap, and a finding.
13. A deck with `defaults.tag_tones` mapping `measured` to another tone: its project slides draw that tone; the portfolio deck keeps `config/present.yml`'s.
14. A custom deck in a folder outside the hub (another served root) opens from the Files view's Open presentation, its images drawn from its own folder; `find:` with `tiers:` there finds nothing; it is then in the pane's deck menu.
15. Open presentation shows on a folder holding `present.yml` and on `present.yml`, and not on another folder or file.
16. A path outside the served roots, to the route or to the write, and an `order:` entry, an image and a `find.folders` glob with `..` or a symlink out of the root: refused or a finding, nothing read (G2, G3).
17. The Slides view's tick, untick and drag, then Save, write only the group's `slides:` list; the rest of `deck/present.yml`, comments included, byte-identical; the change log records the list before and after; undo writes it back.
18. The write refuses a repeated name, an unknown name, an unknown group, a file not named `present.yml`, a `base` the file no longer holds, and a file whose edit does not read back.
19. A slide file saved in the editor reaches the open Present pane at the next push; a manifest's chip changed moves an idea card's maturity; `vocab.yml`'s domain colour changed recolours every chip and slide of that domain.
20. No `PRESENT.md` is left under `projects/` or `tools/oculus/demo/` (`find`); `config/present.yml` holds only `defaults:`; `grep -rn PRESENT src tests` finds only `ALREADY_PRESENT`.
21. The idea manifests' chips: the nine grid ideas as listed, 23 `nascent`, `fedbtd` `parked`, no idea `exploring`; the active and coauthor projects keep `exploring`.
22. The deck reader over a copy of `tools/oculus/demo` reads its portfolio deck with graph-bandits's two slides, the `graphs` domain finding, and no other finding.
23. A `portfolio_deck` folder that does not exist, and a `present.yml` that does not parse: the empty state naming the folder, a finding, no crash.
24. A Present pane saved with `{ slide: 'hccnet-fl' }` and no `root`: opens the portfolio deck at its first slide.
25. Undo of an old `deck` record: refused with the sentence; `config/present.yml` unchanged.
26. A new idea from the New idea write carries `chips: [nascent]`.

Tests, each under the entry that already guarantees it: cases 16 and 18 under G2 and G8 (the route and the write), case 17 under G8 and G9 (the write, the change record, the undo), case 26 under G8 (`writes.test.ts:153`'s assertion), and cases 3, 4, 5 and 11 under G32 (the reader reads a well-formed deck into what it holds). Each test replaces the deck test it supersedes. Every other case, the malformed-input cases included, is a run or a look the report quotes, since no guarded entry covers a malformed deck. The orchestrator rewrites the entries' Code and test references at landing from the report's list.

When the first run finds a case the brief's own rules get wrong, the builder stops there, before changing any code, and hands back the first run and that case, with the rule and the result it gives.

## Paths this step writes

- `tools/oculus/src/lib/data/sources/present.ts` (replaced) and the new deck reader module(s) under `tools/oculus/src/lib/data/sources/`
- `tools/oculus/src/lib/data/helpers/deck.ts` (removed or replaced)
- `tools/oculus/src/lib/data/index.ts`, `tools/oculus/src/lib/data/snapshot/normalise.ts`
- `tools/oculus/src/lib/data/model/model-entities.ts`, `tools/oculus/src/lib/data/model/index.ts`
- `tools/oculus/src/lib/data/sources/docs.ts` (its head comment)
- `tools/oculus/src/lib/data/sources/config/catalog/options.ts`
- `tools/oculus/src/lib/data/helpers/files/apps.ts` (`CLOSED_WRITES`)
- `tools/oculus/src/routes/api/(docs)/deck/` (new)
- `tools/oculus/src/lib/server/content/docs.ts`, `tools/oculus/src/lib/server/content/audit/projects.ts`
- `tools/oculus/src/lib/server/root/watch/portfolio.ts`
- `tools/oculus/src/lib/server/edit/deck-edit.ts`, `tools/oculus/src/lib/server/edit/list-edit.ts`, `tools/oculus/src/lib/server/edit/writes.ts`, `tools/oculus/src/lib/server/edit/writes/bodies.ts`, `tools/oculus/src/lib/server/edit/writes/app-gate.ts`, `tools/oculus/src/lib/server/edit/writes/config/deck.ts`, `tools/oculus/src/lib/server/edit/writes/config/config-write.ts`, `tools/oculus/src/lib/server/edit/writes/config/config-sources.ts`, `tools/oculus/src/lib/server/edit/writes/undo.ts`, `tools/oculus/src/lib/server/edit/writes/manifest.ts` (line 444)
- `tools/oculus/src/lib/state/life/present.ts`, `present.svelte.ts`, `slides.ts`, and a new deck query store under `tools/oculus/src/lib/state/life/`
- `tools/oculus/src/lib/state/boards/board/items.ts`, `tools/oculus/src/lib/state/system/config/editors/sources.ts`
- `tools/oculus/src/lib/state/client/writes.svelte.ts`, `tools/oculus/src/lib/state/shared/stores/shapes.ts`, `tools/oculus/src/lib/state/client/context.ts`
- `tools/oculus/src/lib/views/academic/present/` (every file) and `tools/oculus/src/lib/views/academic/slides/Slides.svelte`
- `tools/oculus/src/lib/views/shared/card/card.ts`, `tools/oculus/src/lib/views/shared/card/ProjectCard.svelte`, `tools/oculus/src/lib/views/boards/project/Project.svelte`
- `tools/oculus/src/lib/views/shared/explorer/tree/menu/row-menu.ts`
- `tools/oculus/config/present.yml`, `tools/oculus/config/sources.yml`, `tools/oculus/config/catalogs/vocab.yml`, `tools/oculus/config/catalogs/options.yml`
- `tools/oculus/config/text/views/academic/present.yml`, `tools/oculus/config/text/views/academic/slides.yml`, `tools/oculus/config/text/views/sources/files.yml` (the `menu_present` line), `tools/oculus/config/text/views/boards/project.yml` (lines 78-79 and the Open presentation word), `tools/oculus/config/text/views/system/workbench.yml` line 22, `tools/oculus/config/text/views/system/history.yml` (lines 49-50 and the refusal sentence), `tools/oculus/config/text/findings.yml` (the `present` findings)
- `tools/oculus/utils/convert-decks.py` (new)
- `tools/oculus/tests/data/sources/present.test.ts` (replaced), `tools/oculus/tests/server/edit/deck-edit.test.ts`, `tools/oculus/tests/server/edit/writes.test.ts` (line 153), `tools/oculus/tests/checks/config/integrity.test.ts`, `tools/oculus/tests/checks/config/config-folder.test.ts` (line 118), `tools/oculus/tests/routes/edit/write-fixture.ts`, `tools/oculus/tests/routes/edit/undo/undo.test.ts`, `tools/oculus/tests/server/core/changes.test.ts`, `tools/oculus/tests/checks/config/config.test.ts`, `tools/oculus/tests/data/snapshot/normalise.test.ts` (line 235), `tools/oculus/tests/checks/tree/boundaries.test.ts`, `tools/oculus/tests/checks/tree/allow-duplication.txt`, and the tests of the route
- `tools/oculus/demo/projects/active/graph-bandits/` (`PRESENT.md` removed, `present/` added), `tools/oculus/demo/deck/` (new), `tools/oculus/demo/README.md` line 5
- `tools/oculus/DESIGN.md` lines 43, 61, 113, 385, 392
- `tools/oculus/HELP.md` lines 81, 139, 298 and the other Present and Slides lines
- `tools/oculus/docs/apps.md` line 271
- `tools/oculus/docs/diagrams/` (regenerated)
- `deck/` (new, the hub's portfolio deck)
- through `convert-decks.py` only: the 18 `PRESENT.md` files (removed), `projects/*/*/present/present.yml` and `main.md` and `projects/archive/*/*/*/present/present.yml` and `main.md` (new), the `chips:` line of the 32 `exploring` idea manifests `projects/ideas/*/project.yml`
- `README.md` line 23, `docs/DATA-MAP.md` lines 88, 89, 217, 234, 253, 254, 311, 356
- `.agents/skills/project-new/SKILL.md` lines 44, 46; `.agents/skills/project-cleanup/SKILL.md` lines 36, 191; `.agents/skills/remove-unicode/SKILL.md` line 176
- `tools/cockpit/templates/project.active.yml` line 7, `tools/cockpit/templates/project.idea.yml` lines 2 and 11, `tools/cockpit/templates/docs/PRESENT.md` (removed), `tools/cockpit/templates/docs/present/` (new)
- `.agents/skills/research-cockpit/SKILL.md` lines 62, 92-95, 99; `docs/DATA-MAP.md` line 138
- `tools/oculus/.scratch/migration/agents/reviews/PR2-report.md`

## Decisions taken in this brief (each reversible, none silent)

1. The slide file format details the design leaves open (Z649, self-rule): a slide after a separator takes its own front matter when lines parsing as a YAML map and a closing `---` follow the separator directly; a `---` inside a code fence or an HTML comment does not split; the kinds' Markdown shapes in part 1, `|||` as the column split, an ordered list as the section's cards, the text after it as the foot; a deck's name is its folder's name, or its parent's for a `present` folder; `find.folders` is relative to the deck's root. Five real cases under the rule, from the converted tree: `deck/title.md` (front matter only, kind title, one slide), `deck/engine.md` (one slide, an ordered list of three cards), `projects/manuscripts/btfno/present/main.md` (front matter with the 11 `present:` keys plus mechanism and headline, no body, one slide), `projects/manuscripts/ecg-readable-substrate/present/main.md` (kind text, a heading and four `##` sections in one slide), `tools/oculus/demo/projects/active/graph-bandits/present/main.md` (two project slides, the second after a `---` with its own front matter).
2. Library (Z648, self-rule): the split is written by hand over the existing `splitFrontmatter` and `yaml`, and the slides drawn by today's Present parts. Candidates checked in "Libraries checked".
3. The summary and grid entries take `title:`, `foot:` (and the grid `lede:`); both summary foots lose their hand-typed domain list (Z649).
4. The title's lede becomes "{{pillars.count}} pillar projects and {{more.count}} more." and the transition's heading "{{more.count}} more, same backbone" (Z649).
5. The maturity chips' icons, colours and labels in part 3; new ideas start `nascent` in both the New idea write and the cockpit template (Z649).
6. The card's deck control opens the project's own deck; the project tab drops `PRESENT.md` and gains Open presentation; the Present toolbar's deck menu lists the portfolio deck, the project decks and the pane's recent decks (Z649, Z651).
7. The deck route lives under `api/(docs)/deck`; its answer goes stale on the `files`, `portfolio` and `config` versions.
8. The key hint is a Present word drawn in the foot of every deck's first slide, since no key catalog exists (Z651).
9. `extra:` is carried into `main.md` as written; Present does not draw it, as today.
10. A summary member with no project slide gives a row with empty mechanism and headline and no finding, so the converted hub keeps G14's no-findings build (Z651).
11. A project carries `deck?`, its `present/` folder's path, in the portfolio apps read, in place of `present?` (Z651).
12. The `deck-slides` write carries `base`; old `deck` records keep their History name and their undo is refused (Z651).
13. A `domain:` missing from `vocab.yml` is a finding with the neutral tone (Z651).
14. `hccnet-fl` and `fed-faithful-ecg` in the archive get their own decks, so no slide is lost; the portfolio deck does not show them (Z651).
15. The worktree's sparse checkout adds `deck`, `docs` and `.agents/skills`.

## Libraries checked

Under `libraries: check` (`.agents/plan.yaml:15`), looked up with `npm view <name> version license time maintainers dependencies`:

- `@slidev/parser` 53.0.0, MIT, antfu and kermanx, modified 2026-09-16, depends on `yaml`, `pathe`, `@antfu/utils` and `@slidev/types`, whose own dependencies include `vue`, `vue-router`, `monaco-editor`, `mermaid`, `shiki`, `unocss` and eight Vite plugins. Its split (`parseSync`, about 50 lines of `dist/core.mjs`) is what part 1 writes. Not taken (Z648): it also applies Slidev's rules to the decks (a slide's last HTML comment taken out as its notes, a leading ```` ```yaml ```` block taken as front matter, headmatter, layouts, `src:` imports), which every upgrade can change, and it brings Slidev's dependency tree.
- `@marp-team/marp-core` 4.4.0, MIT, yhatt, modified 2026-09-04: renders Markdown slides to HTML with its own themes, its per-slide settings in HTML comments; it would replace the Present parts this step keeps. Not taken.
- `reveal.js` 6.0.2, MIT, hakimel, modified 2026-09-10: a whole presentation runtime; it would replace PR1's full screen and the Present view. Not taken.
- `gray-matter` 4.0.3 and `front-matter` 4.0.2, MIT, last modified 2023-07-12: front matter splitting, which `data/sources/docs.ts` already does. Not taken.

The builder adds no dependency this brief does not name. A library the builder finds that would cover its work is reported, not installed.

## Read, with sections or line ranges

1. `agents/briefs/PR2-design.md` whole: the ruled design.
2. `src/lib/data/sources/present.ts` whole and `src/lib/data/helpers/deck.ts` whole.
3. `src/lib/state/life/present.ts` whole and `src/lib/views/academic/present/` whole.
4. `src/lib/server/edit/writes/config/deck.ts`, `deck-edit.ts`, `list-edit.ts`, `writes/undo.ts:300-330`, `writes/config/config-write.ts`, `writes/bodies.ts:90-100,255-265,390-400`.
5. `src/lib/state/sources/files.svelte.ts:1-80` and `src/lib/state/sessions/latex.svelte.ts:1-40`: a folder answer held in the query client, by root and path.
6. `src/lib/views/shared/explorer/tree/menu/row-menu.ts:200-300,495-540`: Open LaTeX, the model for Open presentation.
7. `src/lib/server/root/watch/portfolio.ts:140-200`: the rebuild rule.
8. `config/catalogs/vocab.yml:51-125`: domains, chips and their colours.

## Conventions

- Prose in every file: the spec's prose rules (one line per paragraph and bullet in Markdown, ASCII only, no em dash, no history in comments).
- The converted slide words are byte for byte the source's except the changes part 4 lists, Axel's own wording included; the report lists any carried sentence that breaks a prose rule for Axel, without changing it.
- YAML written by the script parses with `yaml.safe_load` and reads back to the values written; LaTeX in a double-quoted scalar keeps its doubled backslashes.
- No file over the size limit of `tests/checks/tree`.

## Verify before you report

Run from `tools/oculus` in the worktree, each output piped through the filter `spec.md` names. You run no git command.

1. `npm run diagrams`, then `npm run test:quick`: every line `ok`. The plan's whole verify list runs once, at landing on main.
2. `python3 utils/convert-decks.py --check` from the hub root prints that nothing is left to convert; `find projects tools/oculus/demo -name PRESENT.md` from the hub root prints nothing.
3. `grep -rn "PRESENT" src tests` prints only `ALREADY_PRESENT`; `grep -rn -E "slide_order|OPEN_TIERS|DeckTheme" src tests config --exclude=local.yml` prints nothing.
4. The ASCII gate in the form `spec.md` gives (`LC_ALL=C perl -ne ...`), over every file the step writes outside `projects/` and `deck/`: no hit but accented letters in names under `config/`.
5. `sh utils/unused-exports.sh` exits 0, and its output equals the base copy's `unused-exports.txt` but for lines the step's own change explains, each named.
6. The new tests run on the unchanged tree first (they fail: the format does not exist), then pass; the report quotes both runs. The deck tests they replace are named with their replacements.
7. A server on port 8792 with a scratch `HOME` and the engine copied without `local.yml`: the portfolio deck, a project deck and a custom deck answer from the route; the report quotes each answer's slide count and findings.

## Report

Write it to `tools/oculus/.scratch/migration/agents/reviews/PR2-report.md`, with these parts in this order.

- The first line: anything NOT done, or "Everything in the brief is done".
- The open items of the state file, verbatim.
- The cases' first run, every case by its number, with the command or reading and its output.
- The DONE / NOT DONE table with the checks above and their output as printed.
- The guarded tests: each test written, under its entry, and the test it replaces.
- The files with line counts, from `diff -rq` against the base copy, each marked in or outside "Paths this step writes".
- "Prose the slides do not carry": per project, each sentence of the `PRESENT.md` prose the slide does not say.
- The 23 ideas set to `nascent`, and the `ecg-readable-substrate` and `fed-faithful-ecg` slides as converted.
- Carried sentences that break a prose rule, for Axel.
- Every judgment call the brief left open.
- Every host- or user-visible change with its before and after.
- Anything in the brief that was wrong or impossible, with the evidence.

## plan.md lines in full (each line of plan.md shortened to the 400-character rule, whole, under the P number its short line ends with)
- P927: - ✅ PR2 Present decks, one format for every deck, as Axel ruled it in `agents/briefs/PR2-design.md`: a deck is a folder with a `present.yml` (`groups:` with `find:`, `discover:`, `sort:` and `slides:`, and `order:`) and Markdown slide files, several slides to a file split by `---`; custom decks anywhere, project decks in each project's `present/`, the portfolio deck in the hub's `deck/` named by `portfolio_deck` in `sources.yml`; summaries, legends, counts and the idea grid computed from groups, colours and labels from `vocab.yml`'s domains, ideas' maturity as status chips; `PRESENT.md` and the portfolio content of `config/present.yml` converted by a script and removed; Open presentation from the Files view on a deck's folder or its `present.yml`; the brief's writer verifies every mechanism against the code and changes no ruled point (ruling Z637) (ruling Z638) (ruling Z639) (ruling Z640) (ruling Z650)
- P928 (under: - ✅ PR2 Present decks, one format for every deck, as Axel ru): - Booked 2026-10-06: a deck is a folder holding a `present.yml` (`deck:`, `defaults:`, `groups:` with `find:`, `discover:`, `sort:` and `slides:`, `order:`) and Markdown slide files, read by `data/sources/deck/` and served at `GET /api/deck?root=&path=`; the portfolio deck is the hub's `deck/` (`portfolio_deck:` in `config/sources.yml`), a project's deck its `present/`, any other folder opened with Open Presentation; every PRESENT.md and the portfolio content of `config/present.yml` converted by `utils/migrations/convert-decks.mjs` and removed; ideas' maturity as the nascent, scoping and de-risking chips; a Present tab's identity is its deck's root and path (Z653). Fixes at landing: Z655, a section slide's front matter may carry `foot:` (`kinds.ts`), and `deck/transition.md` carries its hint there with no cards (the converter writes it so); Z656, the deck menu points its tab through the new `pointInstance` (`layout/instances.ts`), which activates a tab that already shows the chosen deck; every opener names the portfolio deck by the empty reference (`tabDeck` in `state/life/present.ts`, used by the deck menu and the Files menu); `fileOfTab` reads the path `.` as no file, and the Slides opener passes the tab state with that path; DESIGN.md and HELP.md state the one-tab rule as built and the breadcrumb bar of a folder deck's tab; Proof 1, a deck write records its file under the hub's own path (`hubSpelling` in `edit/writes/config/deck.ts`, `deckFileOf` reading the real path), so `changes.test.ts` expects `deck/present.yml` on every machine; Proof 2, the report's empty list of carried spaced hyphens is the open item below. Verification on the gate: `npm run diagrams && npm run test:landing` printed `ok` for the ASCII gate, format:check, lint and npm test; test:checks red only on `integrity.test.ts`'s two real-hub cases, because the gate's sparse checkout held no `deck/` (passed, 231 of 231, after `git sparse-checkout add deck`); check (0 errors) and build green; test:slow red only on `tests/server/desktop/start.test.ts` 'asks the default port ... starts no second server', which fails the same way on main's head without PR2 (a scratch checkout of 033d3b9b, 1 failed, 4 passed), an open item below; main's staged diff equals the gate's (`cmp`). Look on a scratch oculus over the gate's build (port 8793, its own HOME and engine, Z507's form; Axel's server on 8790 runs the server code of before this landing and answers the old deck shape until it restarts): the portfolio deck's 21 slides, the transition slide with its heading, legend and foot and no cards; Open Presentation on `deck/` twice gives one tab, with no breadcrumb; the deck menu's BT-FNO shows the breadcrumb hub > projects > manuscripts > btfno > present; on a second tab the deck menu's BT-FNO brings the open BT-FNO tab forward. Builder ad626fab8e2a49ab3 (claude-sonnet-5-5; 347,934 tokens, 609 tool uses, 113.1 min; round 1 208,624 tokens, 249 tool uses, 44.9 min; round 2 284,207 tokens, 177 tool uses, 44.3 min). Brief check a4be0b9c90d5e0f8b (claude-opus-5-5, 262,300 tokens, 111 tool uses, 16.2 min). Reviewer ac8902c2a666de395 (claude-opus-5-5, 149,642 tokens, 114 tool uses, 15.6 min); over round 1 ac66e4d8f80f5fe9f (claude-opus-5-5, 341,182 tokens, 108 tool uses, 16.7 min); over round 2 afb8c97b1def8331e (claude-opus-5-5, 315,512 tokens, 115 tool uses, 18.4 min). The first report did not pass its bar (two repair rounds, the second under the cap's exception).
