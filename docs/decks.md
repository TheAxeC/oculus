# Writing a deck

A deck is a folder of Markdown slides that the Present view shows. This guide starts with a deck that works, then gives every key of `present.yml`, every slide kind and every key a slide reads. The rest of the manual is [HELP.md](HELP.md).

## Contents

[TOC]

---

## A first deck

Put two files in the hub's `deck/` folder, the folder oculus opens as the portfolio deck, then open Present.

`present.yml`:

```yaml
deck:
  title: "Lab update"
order:
  - slides.md
```

`slides.md`:

```markdown
---
kind: title
kicker: Group meeting
---
# Lab update

What moved this month.

---
kind: section
---
# Three results

1. **Faster** The model trains in half the time.
2. **Smaller** It needs a third of the memory.
3. **Clearer** Its errors are easier to read.

---

# Next steps

- Write the methods section.
- Run the second cohort.

---
kind: closing
contact: "name@example.org"
---
# Questions
```

The deck shows four slides: a title slide, a section of three numbered cards, a text slide and a closing slide. `O` opens the Overview, where the slides are arranged; `F` shows the deck full screen and `P` opens the presenter screen.

## What a deck is

- A deck is a folder that holds a `present.yml`. The file says the deck's title and frame, its groups and its `order:`, the list of what the deck shows.
- The slides are Markdown files in the folder, or below it. One file holds one slide or several, cut apart by a line that holds only `---`.
- A slide is a front matter and a body. The front matter is YAML between two `---` lines; its `kind:` says what the slide draws, `text` when it names none. The body is Markdown, and its first line, when it is a level-1 heading (`# ...`), is the slide's heading.
- A folder with no `present.yml` is no deck yet, and the view says so.

### Where decks are

- **The portfolio deck**, the deck of the hub as a whole: the folder `portfolio_deck` names, relative to the hub. oculus's `config/defaults/sources.yml` sets it to `deck`, and the hub's `.oculus/config.yml` sets another. The Present view opens it when a pane names no deck.
- **A project's deck**: the `present/` folder of a project's folder. Its slides carry the project's facts at their foot, and its `{{project.<field>}}` placeholders are filled from the project.
- **Any other folder**, opened as a deck from Files.

The deck menu of the Present view opens each of them. A deck's name is its folder's name, and the name of a project's deck is the name of the project's folder.

## present.yml

Every key, with what it holds, what it does and what it is when the file does not set it. The reader reads these keys and no other: a key it does not read changes nothing, and the YAML editor marks it. A value it cannot read is a finding, named below with the key, and the rest of the file is read.

```yaml
deck:
  title: "Lab update"
  frame: { width: 1280, height: 720 }
defaults:
  tag_tones: { measured: green }
groups:
  members:
    find: { folders: "projects/*/*/present", tiers: [research], stages: [in-prep], forms: [article], status: [active] }
    discover: true
    slides: [alpha, beta]
order:
  - slides.md
  - { slides: members }
  - { kind: summary, of: members, title: "Where each project stands", foot: "From the last runs." }
  - { kind: grid, of: members, title: "The ideas", lede: "One card each.", foot: "Drawn by stage." }
```

### deck

- `deck.title`, text. The deck's title: the words of its tab, of its entry in the deck menu, of the Overview's heading and of the audience window. No slide of its own deck draws it; the summary and grid slides of a deck whose group holds it draw it for a member deck that is no project's, in its summary row and on its grid card when it has no idea slide. With none, or a value that is not text, the deck's name. `title: "Lab update"`
- `deck.frame`, a map `{ width, height }` in px. The size every slide of the deck is laid out in, in the pane, the presenter screen, the audience window and the PDF. With none, the setting `defaults.frame`, 1280 by 720 unless Settings or the workspace file's `settings:` says otherwise. The width is a whole number from 320 to 3840 and the height one from 240 to 2160. A value that is no map, a key that is neither `width` nor `height`, a missing side or a side out of its range is a finding on `deck.frame`, and the setting's frame is used. `frame: { width: 1920, height: 1080 }`
- A deck placed inside another (by a group) is laid out in the frame of the deck that is shown; its own `deck.frame` is read for its findings only.

### defaults

- `defaults.tag_tones`, a map from a tag class to the name of a palette hue. The hue the chip of a project slide's `tag:` wears, by the tag's `class`. The deck's map is laid over oculus's (`measured: green`, `design: amber`, `proof: purple`, `mixed: cyan`, in `config/defaults/present.yml`) and the workspace file's `settings:`; an entry whose hue is not text, or is empty, is left out. With none, oculus's map. `tag_tones: { measured: green, draft: grey }`
- `defaults:` holds no other key a deck reads. The frame is `deck.frame`.

### groups

- `groups`, a map from a group's name to the group. A group gathers other decks, so one deck can show the slides of several, count them, list them in a summary and draw them as cards. With none, the deck has no group. A value that is no map is the finding `groups is not a map`, and no group is read; a group that is no map is not read, and says so. `groups: { members: { slides: [alpha] } }`
- `find`, a map. Where the group looks for decks and which of them it keeps. With none, the group's `slides:` name decks of the hub's projects. A value that is no map is a finding, and the group is read as one with no `find:`. `find: { folders: "projects/*/*/present" }`
  - `folders`, a folder glob or a list of them, relative to the root the deck is in. Each folder that holds a `present.yml` is a deck the group finds, the deck itself left out. A `find:` with no folders is a finding and finds nothing; a glob with `..` in it or one that starts at `/` is a finding and is not looked in. `folders: [projects/*/*/present, talks/*]`
  - `tiers`, a list of words of `tiers:`. A found deck is kept when its project's `tier` is one of them. With none, every tier. `tiers: [research]`
  - `stages`, a list of words of `stages:`. A found deck is kept when its project's `stage` is one of them; a grid of the group draws these stages as its legend. With none, every stage. `stages: [in-prep, submitted]`
  - `forms`, a list of words of `forms:`. A found deck is kept when its project's `form` is one of them. With none, every form. `forms: [article]`
  - `status`, a list of words of `chips:`. A found deck is kept when its project's `status.chips` holds one of them. With none, every deck. `status: [active]`
  - Each of the four is a list: a single word written without brackets reads as an empty list, which keeps no deck. A found deck that is no project's deck is kept only while none of the four is set.
- `discover`, `true` or `false`. Whether the group also takes the decks `find:` keeps that no group of the deck names. With none, or any value but `true`, false. `discover: true`
- `slides`, a list of deck names. The decks the group shows, in this order. A name is matched to a deck by its name: among the decks `find:` keeps, or among the hub's projects' decks when the group has no `find:`. With none, the group names no deck. `slides: [alpha, beta]`

### order

- `order`, a list. What the deck shows, in order; the entries are listed under [The order](#the-order). With none, a value that is no list or an empty list, the deck shows nothing, and that is the finding `order is empty; the deck draws no slides`. `order: [slides.md]`

## How a group picks its decks

1. The decks `slides:` names, in its order. A name written twice is placed once, and a name that matches no deck the group can see is a finding.
2. With `discover: true`, then every deck `find:` keeps that no group of the deck names, in the deck order: category by category, the categories of `categories:` in the order `deck_order` gives (`config/catalogs/vocab.yml`, which a hub's settings file replaces with its own) and then the categories it leaves out, in the order of `categories:`; inside a category by the row's `sort:` and then the board's own order (stage, then title); then the decks whose project no row holds, and the decks of no project, by folder. A deck's category is its project's, the first row that holds it, as on the boards; two decks the words do not tell apart go by folder. A deck reads no pin: a board puts its pinned cards first, and a pinned project's deck is placed as any other.
3. The filter's controls then narrow a group of project decks (see [The filter](#the-filter)).

What the group cannot place is told, in the Overview's group heading and as a finding of `present.yml`:

- A name of `slides:` no deck answers, such as a project whose folder holds no `present/` deck: the heading reads "alpha: no deck has this name", and the finding "group members names alpha, which matches no deck".
- A deck two discovering groups both find, and neither names: it is in neither group. The heading reads "beta is found by talks too", and the finding "deck beta is found by the discovering groups members, talks and named by none; it is in neither". Naming it in one group's `slides:` places it there.
- Two decks of one name that one group sees: neither is placed under that name, and the finding names both folders.

The Overview's Add tile lists the decks the group's rule finds that it does not hold, and Edit Rule sets its `find:` and `discover:`.

## The order

Each entry of `order:` is one of four things. Any other entry is the finding `an order entry is not a slide file, a slides group, a summary or a grid; it is not placed`, and the rest of the list is read.

- **A slide file**, its name relative to the deck's folder: every slide of the file, in its order. A file the folder lacks, or a name that leaves the root, is a finding. `- slides.md`
- **A group's slides**, `{ slides: <group> }`: every slide of each deck of the group, each in its own order. A group the deck does not define is a finding. A deck that would hold itself through its groups is a finding, and the repeat is not placed. `- { slides: members }`
- **A summary**, `{ kind: summary, of: <group>, title, foot }`: one table slide with a row for each deck of the group. `title` is its heading and `foot` the line under the table. `- { kind: summary, of: members, title: "Where each project stands" }`
- **A grid**, `{ kind: grid, of: <group>, title, lede, foot }`: one slide of cards, a card for each deck of the group. `title` is its heading, `lede` the words under it and `foot` the line under the cards. `- { kind: grid, of: members, title: "The ideas" }`

`title`, `lede` and `foot` are text, empty when they are not set; a summary draws no `lede`. A summary or a grid of a group the deck does not define is a finding.

### Counts

`{{<group>.count}}` anywhere in a slide, its front matter included, is written out as the number of slides the group's decks hold, as the group draws them. Spaces inside the braces are allowed. A group the deck does not define stays as written, and is a finding.

```markdown
# {{members.count}} slides from the members
```

## Slides

- A slide file is cut into slides at each line that holds only `---`, with spaces after it allowed. A `---` inside a fenced code block or an HTML comment does not cut.
- A slide opens with its front matter when the `---` before it is followed at once, with no blank line, by YAML lines and a closing `---`, and those lines read as a map with a key. The file's first slide opens with its front matter when the file's first line is `---`. A slide with no front matter leaves a blank line after its `---`.
- A front matter that does not parse stays in the slide's body as words; for the file's first slide it is also a finding.
- The body is Markdown. Its first line that is not blank, when it is a level-1 heading, is the slide's heading, and what follows is read by the slide's kind. An image is named relative to the slide file's folder; an image the folder lacks is drawn as a gap and is a finding.
- A `kind:` that is no kind of the list below is a finding, and the slide is not drawn.

A slide is laid out in its deck's frame, and the frame keeps its shape and is scaled to the screen, so a slide is laid out the same in the pane, on the presenter screen, in an Overview tile, in the audience window and in the PDF. Its figures are placed by their proportions in the room under the slide's title: a figure narrower than the room's own proportions is a column at the right with the text beside it, the text keeping at least 360 px; a wider one goes under the text across the room's width; several figures stand side by side or stacked, whichever draws them larger; a slide with no text gives its figures the whole room, centred. A figure is drawn whole and larger than its pixels where the room allows, its caption and explanation under it inside the room. The text takes the room the figures leave and is drawn at the largest size that fits it, between three quarters and one and a quarter of its design size, the title and headings with it; the project facts strip keeps its own size. An image in a slide's Markdown, the lede of a title, section or grid slide included, is drawn no taller than the room under the slide's heading leaves once the rest of the slide's Markdown is drawn. The key hint of a deck's first slide is drawn under the slide in the frame's margin and takes no room where it fits the margin; in a narrow frame or at a large text size it takes the room it passes the margin by. A slide is too tall only when its text, or a figure with its caption, does not fit the room at the least size.

## Slide kinds

Each kind with an example and what it draws. `summary` and `grid` are no front-matter kind: an entry of `order:` draws them, so their examples are entries of `present.yml`.

### title

```markdown
---
kind: title
kicker: Group meeting
---
# Lab update

What moved this month.
```

The opening slide: the kicker, the heading as the headline, the words under it as the lede, the group legend `legend:` names and a `contact:` line.

### section

```markdown
---
kind: section
---
# Three results

What the month gave.

1. **Faster** The model trains in half the time.
2. **Smaller** It needs a third of the memory.

Measured on the first cohort.
```

A heading, the words before the numbered list as the lede, each item of the list as a numbered card whose bold words open it as the card's title, and the words after the list as the foot, which `foot:` replaces.

### text

```markdown
---
kind: text
---
# Next steps

- Write the methods section.
- Run the second cohort.
```

The body as it is written, heading included; a slide with no `kind:` is a text slide.

### image

```markdown
---
kind: image
---
# The learning curve

![Loss per epoch](figure.png)
```

The heading and the body's first image, with its words as its alt text; the rest of the body is not drawn. The image takes the whole room under the heading at its own proportions, centred, so a tall image fills the room's height and a wide one its width. An image that fails to load is drawn as the words of a missing figure.

### columns

```markdown
---
kind: columns
---
# Before and after

The old pipeline read every file.

|||

The new one reads the cache.
```

The heading, then the words before a line that holds only `|||` in the left column and the words after it in the right.

### equation

```markdown
---
kind: equation
---
# The loss

$$ L = \sum_i (y_i - \hat{y}_i)^2 $$

Summed over the samples.
```

The heading, the body's first `$$ ... $$` formula as the display formula, and the rest of the words under it.

### code

````markdown
---
kind: code
---
# The call

```python
model.fit(data, epochs=10)
```
````

The heading and the body's first fenced code block; the rest of the body is not drawn.

### closing

```markdown
---
kind: closing
contact: "name@example.org"
---
# Questions

Thank you.
```

The last slide, drawn as a title slide is: the kicker, the heading, the lede, the legend and the contact line.

### project

```markdown
---
kind: project
title: "Alpha"
sub: "A smaller model for the same task"
hook: "Half the training time."
tag: { class: measured, text: "Measured" }
eli5: { purpose: "Train faster.", plain: "It learns the same with less work." }
equation: "L = \\sum_i (y_i - \\hat{y}_i)^2"
specs:
  - { label: "Data", value: "two cohorts" }
panels:
  - { figure: figure.png, caption: "Loss per epoch", explain: "Lower is better." }
method: ["Train on the first cohort.", "Test on the second."]
results: ["Half the training time."]
mechanism: "A smaller model"
headline: "Half the training time"
---
```

A project's slide: the project's domain and stage chips and the tag, the title, the sub line and the hook, the spec chips, the plain-words callout, the method and results lists beside the formula and the figures. The figures of `panels` are placed by their proportions under the title, each with its caption and explanation under it: a tall figure is a column beside the text, a wide one goes under the text, and several stand side by side or stacked, whichever draws them larger. A diagram (`diagram_html`) and the words of a missing figure are drawn with the text. A project slide that sets none of `title`, `sub`, `hook`, `tag`, `eli5`, `equation`, `specs`, `panels`, `method` and `results` draws its body instead. `mechanism` and `headline` are what a summary of another deck reads from it.

### idea

```markdown
---
kind: idea
desc: "A model that learns the same with less work."
---
```

One card: the project's short name (its title when it has none), the description `desc:` gives or else the body, and the project's domain and stage. In a deck that is no project's, the card is named by `title:`, else by the deck's name.

### summary

```yaml
order:
  - { kind: summary, of: members, title: "Where each project stands", foot: "From the last runs." }
```

A table with a row for each deck of the group: its field (the project's domain), the project's short name (its title, or the deck's title for a deck that is no project's), and the `mechanism` and `headline` of the deck's first project slide.

### grid

```yaml
order:
  - { kind: grid, of: members, title: "The ideas", lede: "One card each.", foot: "Drawn by stage." }
```

A card for each deck of the group: the card of its first idea slide, or else a card of the project's name, domain and stage (the deck's title for a deck that is no project's), under a legend of the stages the group's `find:` keeps.

## Front-matter keys

Every key a slide's front matter is read for, with its shape, the kinds that read it, what it does and what it is when the slide does not set it. A key no kind below reads changes nothing, and a value of the wrong shape is read as absent.

- `kind`, one word of the kinds above; every kind. What the slide draws. With none, `text`. `kind: section`
- `notes`, text; every kind. The presenter's notes, shown under Notes on the presenter screen. With none, "No notes for this slide." `notes: "Say where the data came from."`
- `legend`, a group's name; `title`, `section` and `closing`. A legend of the domains of the group's projects, each once, in the group's order. A group the deck does not define is a finding. With none, no legend. `legend: members`
- `kicker`, text; `title` and `closing`. The small line over the heading. With none, no kicker. `kicker: Group meeting`
- `contact`, text; `title` and `closing`. A line under the lede, for an address or a link. With none, no line. `contact: "name@example.org"`
- `foot`, text; `section`. The foot under the cards, in place of the words after the list. With none, those words. `foot: "Measured on the first cohort."`
- `title`, text; `project` and `idea`. A project slide's title. With none, its project's short name, or in a deck that is no project's the slide's heading. An idea slide is named by its project; in a deck that is no project's it is named by `title:`, and with none by the deck's name. `title: "Alpha"`
- `desc`, text; `idea`. The card's description. With none, the slide's body. `desc: "A model that learns the same with less work."`
- `sub`, text; `project`. The line under the title. With none, no line. `sub: "A smaller model for the same task"`
- `hook`, text; `project`. The one sentence under the sub line. With none, no hook. `hook: "Half the training time."`
- `tag`, a map of `class` and `text`; `project`. A chip with `text` as its words in the hue `defaults.tag_tones` gives `class`; a tag with no `text` draws no chip. With none, no chip. `tag: { class: measured, text: "Measured" }`
- `eli5`, a map of `purpose` and `plain`; `project`. The callout of what the work is for (Purpose) and what it does in plain words (In plain words). With none, no callout. `eli5: { purpose: "Train faster.", plain: "It learns the same with less work." }`
- `equation`, LaTeX; `project`. The slide's formula. A value that names an image file (ending in `.png`, `.jpg`, `.jpeg`, `.svg` or `.webp`) is a finding and is not drawn. With none, no formula. `equation: "E = mc^2"`
- `specs`, a list of `{ label, value }`; `project`. The spec chips, each its label and its value. With none, no chips. `specs: [{ label: "Data", value: "two cohorts" }]`
- `panels`, a list of `{ figure, diagram_html, caption, explain }`; `project`. The figures, each an image file named relative to the slide file's folder, or markup in `diagram_html`, with its caption and a line explaining it. A figure the folder lacks is drawn as a gap and is a finding. With none, no figure. `panels: [{ figure: figure.png, caption: "Loss per epoch" }]`
- `method`, a list of text; `project`. The Method list. With none, no list. `method: ["Train on the first cohort."]`
- `results`, a list of text; `project`. The Results list. With none, no list. `results: ["Half the training time."]`
- `mechanism`, text; `project`. The Core mechanism cell of a summary row of a deck that places this deck in a group. With none, empty. `mechanism: "A smaller model"`
- `headline`, text; `project`. The Headline result cell of that row. With none, empty. `headline: "Half the training time"`

## Notes, images and tags

- **Notes.** A slide's `notes:` are its presenter's notes, shown under Notes on the presenter screen beside the slide. A slide with none shows "No notes for this slide." there.
- **A dropped image.** Drop one image file on a slide of the deck's own files, a slide a file entry of `order:` placed. oculus copies it into the folder of the slide's file, under its own name, or `<name>-2.<ext>` and on when that name is taken, and adds `![<name>](<file>)` at the end of the slide; History undoes it. It takes a PNG, JPEG, GIF, WebP or SVG of 32 MB at most. A drop on a slide of another deck says "Only a slide of the deck's own files takes an image.", and a drop of several files "Drop one image at a time."
- **The tag and its tone.** A project slide's `tag:` is a chip beside its domain and stage chips: `text` is its words, and `class` picks its hue from the deck's tag tones (`defaults.tag_tones`). Edit, beside the deck's title in the Overview, sets the title and the tag tones.

## The filter

- A deck whose groups hold project decks draws the Projects board's filter under the toolbar: the same bar and the same rules, over the projects whose decks those groups hold. Line 1 holds the search, the stale, deadline and waiting toggles, Mine only and the Role group while a person is marked as you, the group buttons with the rest in More, and the Hub group while the workspace has more than one hub. Line 2 holds the slices by category, how many projects are shown, and Clear all. The counts on the toggles and the badges are over those projects before any filter, and each project counts once however many groups hold its deck. A deck with no group of project decks draws no bar.
- Mine only is on by default where it applies, as on a board: a deck one of whose projects is not yours opens narrowed to your projects and those naming no one.
- A control that narrows the bar narrows every group of project decks to the decks of the projects the bar shows, and leaves out of such a group a deck that is no project's. It narrows what each group places: the slides of `{ slides: <group> }`, `{{<group>.count}}`, the summary rows, the grid cards, the legends and the Overview's tiles and counts, on the pane, the presenter screen, the audience window and the PDF. A group of other decks keeps every deck.
- While a control narrows, line 2 reads "5 of 16 shown", and "16 projects" while every project is shown. Clear all takes every group's and slice's pick out and leaves the search and the toggles.
- The controls are the pane's: kept with it when its page comes back, and set back as a board starts (Mine only on, nothing else) when it opens another deck. No control writes `present.yml` or a slide file.

## The project facts strip

- Each slide that comes from a project's deck carries a strip of the project's facts at its foot: a slide of the project's own files, a slide a group places from a project's deck, and a summary or a grid a project's deck places. It is drawn on the pane, the presenter screen, the Overview's tiles, the audience window and the PDF.
- The strip shows each field that holds a value as a labelled chip, in the words and hues of the project card, in this order: form, stage, status chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced and tier.
- The stage is drawn as it is, `failed` and `stopped` included. The strip is two lines at most, and a chip too long for its room ends in an ellipsis, its tooltip giving the whole.
- The project's domain, on its slides, the strip, a legend, a summary row and a grid card, is the domain the manifest's `domain:` names in the project's own hub, else in the one other hub of the workspace that holds the key. A key no hub holds names no domain: the finding is the manifest's, "domain is heart, which is not a key of domains" on its `domain:` line under Findings, and the project's slides are drawn in the neutral tone. A key two or more other hubs hold and the own hub does not names no domain either, with the finding of that reference. An empty `domain:` names no domain and is that same finding of the manifest. A deck raises no finding of its own on a project's domain.
- The Project facts toggle in the toolbar, drawn while the slide on screen comes from a project's deck, shows or hides the strip's words. It is on by default and kept with the pane, also when it opens another deck. The strip keeps its room while hidden, so the slide's layout and its Too tall finding do not change with the toggle.

## Project fields in a slide

`{{project.<field>}}` anywhere in a slide, its front matter included, is filled from the manifest of the project whose deck holds the slide, in the strip's words, the words of a list joined with ", ". Spaces inside the braces are allowed, and the field's name is written as it is listed.

```markdown
# Alpha at {{project.stage}}

Led by {{project.lead}}, for {{project.venue}}.
```

| Field | Filled from the manifest |
| --- | --- |
| `form` | `form`, by its label in `forms:` |
| `stage` | `stage`, by its label in `stages:` |
| `chips` | `status.chips`, each by its label in `chips:` |
| `domain` | `domain`, by the domain's title |
| `pillars` | `pillars`, each by the pillar's title |
| `datasets` | `datasets`, each by its key |
| `lead` | `lead`, each by the person's name |
| `supervisors` | `supervisors`, each by the person's name |
| `collaborators` | `collaborators`, each by the person's name |
| `year` | `year`, as it is written |
| `venue` | `venue`, by the venue's short name, else its name |
| `funding` | `funding`, each by its key |
| `compute` | `compute`, each by the resource's name |
| `code` | `code_availability.status`: deposited, anon for `review-anon`, pending for `none`, no code for any other |
| `reproduced` | `reproduced.date`, else the word reproduced |
| `tier` | `tier`, by its label in `tiers:` |

- A word with no label or no record is the key itself; a reference no record of the hub answers is left out.
- The words are written so the slide draws them as they are: escaped as Markdown in the body and in most keys, as they are in a code block, a code span, a formula, `notes`, `tag.text`, `panels.figure` and `equation`, and escaped as HTML in `panels.diagram_html`.
- A field with no value is filled with nothing, and is the finding "{{project.venue}} holds no value for the project alpha; it is filled with nothing".
- A name that is no field, `{{project.Venue}}` among them, stays as written, and is a finding that lists the sixteen fields.
- A placeholder in a deck that is no project's stays as written, and is the finding "{{project.stage}} is in a deck that is no project's; it stays as written".
- `{{project.count}}` is the count of a group named `project`. In a deck with no such group it stays as written, with the count's finding alone.

## Slide findings

Two findings are about a slide itself. Each is listed under Findings for the portfolio deck and the projects' decks, at the slide's file and line.

- **No title of its own.** "slide 2 of slides.md has no title of its own; give it a level-1 heading, or a title: in its front matter for a project or an idea slide". A slide of every kind but `project` and `idea` is titled by its level-1 heading; a project slide by its `title:` or its project's short name; an idea slide by its project's name, or by its `title:` in a deck that is no project's.
- **Too tall.** "slide too tall: Three results runs 40 px past its frame of 1280 by 720 px", when the Present view draws a slide more than 1 px taller than its frame. A slide's figures are placed in the room under its title and its text is drawn smaller to fit the room they leave, so a slide is too tall only when its text, or a figure with its caption, does not fit that room at its least size, three quarters of its design size; such a slide scrolls in the pane and is scaled down on its PDF page. Its Overview tile is marked Too tall. The finding and the mark stay until the slide fits, leaves the deck or the page is reloaded.
