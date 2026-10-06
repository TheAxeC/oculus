# PR2: the deck design Axel ruled (Z637 to Z640)

Every point here is Axel's ruling from the discussion of 2026-10-06. PR2's brief builds it; the brief's writer researches and verifies each mechanism against the code before the build, and changes no ruled point without a ruling.

## A deck is a folder

A deck is a folder holding a `present.yml` and Markdown slide files. A slide file is a Markdown body under a short front matter (its kind, its notes); a file may hold several slides, split by a line holding only `---`. Images are paths relative to the deck's folder.

```markdown
---
kind: text
notes: Start with the picture, then the two bullets.
---
# How the blocks are built

- each block shares one frequency band

![The blocks](btfno_blocks.png)

---

# Where it wins

- the more varied the physics, the bigger the gap
```

The slide kinds are general (title, section, text, image, two columns, equation, code, closing) and include the rich project slide (`kind: project`) and the idea card (`kind: idea`), so no kind belongs to the portfolio alone.

A deck opens in the Present view from the Present view, from the Files view's menu on its folder, and from the Files view's menu on a `present.yml` ("Open presentation").

## Three places decks live

- A custom deck: any folder.
- A project's deck: the project's `present/` folder, beside its figures.
- The portfolio deck: the hub's top-level `deck/` folder, named in `config/sources.yml`:

```yaml
portfolio_deck: deck
```

## present.yml

```yaml
deck:
    title: 'Structured models, everywhere they hide'

groups:
    pillars:
        find: { folders: projects/*/*/present, tiers: [active, manuscripts, ideas] }
        slides: [hccnet-revision, covert-applied, covert-theory, bttn-incident-af, raw-pls, btfno, bt-operator-theory]
    more:
        find: { folders: projects/*/*/present, tiers: [active, manuscripts, ideas] }
        discover: true
        sort: folder
        slides: [bttd-source-eeg, dries-bttr-ecg, dongho-ecg-clustering, fed-multicellular-immune, meseret-cirrhosis, ward-bttr-crosssubject]
    ideas:
        find: { folders: projects/*/*/present, tiers: [ideas], status: [nascent, scoping, de-risking] }
        slides: [btd-autoencoder, florank-personalization, clinical-ai-eval-artifacts, ecg-af-fair, fl-privacy-auditing, hccnet-fl-sweden, hccnet-pathology, ssm-longitudinal, quantum-tensor-fl]

order:
    - title.md
    - engine.md
    - { slides: pillars }
    - { kind: summary, of: pillars, title: 'Active pillars, at a glance' }
    - transition.md
    - { slides: more }
    - { kind: summary, of: more }
    - { kind: grid, of: ideas, title: 'The idea pipeline, what is next' }
    - closing.md
```

- `groups:` defines groups; `order:` alone says what is shown. A group's members are slides on the deck only where `order:` says `{ slides: <group> }`. A summary, a grid, a legend and a `{{<group>.count}}` read any group, shown or not.
- `find:` says where a group looks (`folders:`), which tiers count (`tiers:`, left out for a folder outside the hub) and which status chips count (`status:`). What it finds is listed in the Slides view as a candidate for the group.
- `slides:` is the group's fixed order. It is written by hand in any editor or by the Slides view's drag; both edit the same lines.
- `discover: true` puts a found deck that `slides:` does not name on the deck by itself, after the named ones, in the order `sort:` gives (`folder` by default, or `title`). Without it a found deck waits in the Slides view, unticked.
- A deck named in one group's `slides:` is never added to another group by discovery. A deck two discovering groups both find is a finding in the Audit view and the Slides view, naming the deck and both groups, and goes in neither until it is put in one.
- A name in `slides:` that matches no deck is shown in the Slides view as missing and reported as a finding; it is never skipped in silence.
- `find:`, `groups:`, summaries, grids and counts work in every deck, not only the portfolio.
- `OPEN_TIERS` (`data/helpers/deck.ts:40`) is removed; tiers are only what a deck's `find:` names.

## Nothing is copied by hand

- Colours and labels come from `config/catalogs/vocab.yml`'s `domains`, by each project's `domain:`, everywhere: slides, summaries, legends, grid cards. `themes` is removed.
- A summary has one row per project of the group, in the group's order: the field (the domain's label from `vocab.yml`), the project's name (its `short:` in `project.yml`), and `mechanism:` and `headline:` from the project's `present/main.md`.
- A legend shows one chip per domain of a group's projects: `legend: <group>` in a slide's front matter.
- A count is a digit: `{{<group>.count}}` in a slide's text is replaced by the number of slides the group holds when the slide is drawn.
- A grid card takes its name from `short:` and its colour from `domain:` in `project.yml`, and its one-line description from the idea's `present/main.md` (`kind: idea`), since the deck is the public surface and `project.yml` holds private notes.
- Maturity is the ideas' status chip in their manifests: `exploring` splits into `nascent`, `scoping` and `de-risking`, with their words and colours in `vocab.yml` and the default chip of the `project-new` template; a parked idea is never found by a `find:` that names those three.
- Present shows its own key hint from oculus's key catalog; no deck file holds one.

## config/present.yml

Only oculus's defaults stay, which any `present.yml` can change:

```yaml
defaults:
    tag_tones: { measured: green, design: amber, proof: purple, mixed: cyan }
```

## The conversion, by a script in PR2

- Each of the 13 `PRESENT.md` files that declare a slide: its `present:` block becomes `present/main.md` (`kind: project`, with `mechanism:` and `headline:` taken from its row in today's summaries), beside a new `present/present.yml` (`order: [main.md]`). The Markdown text below the block is read against the slide, file by file; anything it says that the slide does not is shown to Axel, then `PRESENT.md` is removed.
- `asthma-geo-tensor`: its `PRESENT.md` holds only the empty template; no deck, the file removed.
- `ecg-readable-substrate`: its prose becomes `present/main.md` and `present/present.yml`, shown to Axel before PR2 lands.
- The 9 ideas of today's grid get a deck (`present/present.yml`, `present/main.md` with `kind: idea` and the grid card's description). Their maturity chip is the grid's value; the other 21 `exploring` ideas get `nascent`, listed for Axel to change before PR2 lands.
- `config/present.yml` becomes `deck/`: `meta` into `title.md` and `closing.md`, `framing.engine` into `engine.md`, `framing.transition` into `transition.md`, the summaries and the idea grid into `order:` entries, `order:` into `groups:` and `order:`. The title's "A dozen active projects" becomes a count; the domain lists of the title's lede and of `summary2`'s foot, the transition's list of topics and the deck's key hint are removed.
- `PRESENT.md` is gone after the conversion: the Projects view, the audit and every other reader read the project's `present/` deck (the readers are found by `grep -rl PRESENT src tests`).
- The Slides view lists each group's candidates and writes `slides:` by its drag; `selection:` and `slide_order:` are gone.
