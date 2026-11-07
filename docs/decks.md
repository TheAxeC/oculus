# Writing a deck

A deck is a folder holding a `present.yml` and Markdown slide files, which the Present view draws. The Present view itself is in [Help](HELP.md).

## Contents

[TOC]

---

## A deck's files

- `present.yml` names the deck's title, its frame (the size its slides are laid out in), its groups (each a set of other decks it gathers) and its `order:`, the list of what the deck shows. A deck folder needs its `present.yml`, and one that lacks it is a finding: a fault oculus reports in the Findings view, with the file and the line.
- A slide file is a Markdown file of the deck's folder, or of a folder below it, that `order:` names. One file holds one slide or several.
- An image is a file named in a slide relative to the slide file's folder.
- An image dropped on a slide of the deck's own files is copied into that folder under its own name, or `<name>-2.<ext>` and on when the name is taken. Oculus adds `![<name>](<file>)` at the end of the slide. The drop takes a PNG, JPEG, GIF, WebP or SVG of 32 MB at most, and the History view's Undo takes it back.
- The portfolio deck is the folder `portfolio_deck` names in the hub's `.oculus/config.yml`, `deck` unless the hub sets another. A pane that names no deck shows it.
- A project's deck is the `present/` folder of the project's folder. A deck of no project is any other deck.
- You open any other folder as a deck from Files.
- A deck's name is its folder's name.

Two files make a deck of four slides:

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

## present.yml

Oculus reads the keys below from `present.yml`. It reads the rest of the file past a value it cannot read, and reports that value as a finding on its key.

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

| Key | What it holds | When unset |
|---|---|---|
| `deck.title` | the title the Present view names the deck by | the deck's name |
| `deck.frame` | `{ width, height }` in px, the size every slide of the deck is laid out in, in the pane, the presenter screen, the audience window and the PDF; the width is a whole number from 320 to 3840 and the height from 240 to 2160 | the Settings option `defaults.frame` of Present, 1280 by 720 |
| `defaults.tag_tones` | a map from a project slide's `tag.class` to a palette hue, laid over oculus's (`measured: green`, `design: amber`, `proof: purple`, `mixed: cyan`) | oculus's map |
| `groups` | a map from a group's name to a group, which gathers other decks | no group |
| `groups.<name>.find` | where the group looks for decks and which it keeps (below) | the group's `slides:` name decks of the hub's projects |
| `groups.<name>.find.folders` | a folder glob, or a list of them, relative to the root the deck is in; each folder that holds a `present.yml` is a deck the group finds | a finding, and the group finds nothing |
| `groups.<name>.find.tiers` | a list of words of the hub's `tiers:` ([Data map](data-map.md#the-hubs-settings)). A found deck is kept when its project's `tier` is one of them | every tier |
| `groups.<name>.find.stages` | a list of words of the hub's `stages:`. A found deck is kept when its project's `stage` is one of them. A grid of the group draws them as its legend | every stage |
| `groups.<name>.find.forms` | a list of words of the hub's `forms:`. A found deck is kept when its project's `form` is one of them | every form |
| `groups.<name>.find.status` | a list of words of the hub's `chips:`. A found deck is kept when its project's `status.chips` holds one of them | every deck |
| `groups.<name>.discover` | `true` to also take the decks `find:` keeps that no group of the deck names | false |
| `groups.<name>.slides` | a list of deck names, the decks the group shows first, in this order | no deck named |
| `order` | a list of the entries the deck shows, in order (below) | the deck shows nothing, and that is a finding |

A frame that is anything but a map of `width` and `height`, each in its range, is a finding on `deck.frame`, and the deck takes the frame of `defaults.frame`. A deck placed inside another by a group is laid out in the frame of the deck that is shown.

Each of `tiers`, `stages`, `forms` and `status` is a list, written in brackets even for one word. A single word written bare keeps no deck. A found deck of no project is kept only while all four are unset.

The group skips a glob with `..` in it, or one that starts at `/`, and reports it as a finding.

## The order

Each entry of `order:` is one of the four below. Oculus reads the rest of the list past any other entry, and reports that entry as a finding.

| Entry | What it places |
|---|---|
| `- slides.md` | every slide of the file, in its order; a file the folder lacks, or a name that leaves the root, is a finding |
| `- { slides: members }` | every slide of each deck of the group, each deck in its own order. A deck that would hold itself through its groups is placed once, and is a finding |
| `- { kind: summary, of: members, title, foot }` | one table slide, with `title` as its heading and `foot` as the line under the table. Each row is a deck of the group: the project's domain, its short name, else its title, and the `mechanism` and `headline` of the deck's first project slide. A deck of no project shows the deck's title |
| `- { kind: grid, of: members, title, lede, foot }` | one slide of cards, a card per deck of the group: the card of its first idea slide, or else the project's short name, domain and stage, under a legend of the stages of the group's `find:` |

`title`, `lede` (the line under the heading) and `foot` are text, empty when unset. A group the deck does not define is a finding in each of the three group entries.

## A group's decks

1. The decks `slides:` names, in its order. A name written twice is placed once, and a name that matches no deck the group can see is a finding.
2. With `discover: true`, every deck `find:` keeps that no group of the deck names, ordered by category. A deck's category is its project's category on the boards, the first row of the hub's `categories` that holds it ([Data map](data-map.md#keys-and-links)). The decks are placed in this order:
   1. category by category, the categories in the order of the hub's `deck_order` and then those it leaves out;
   2. inside a category, by the `sort:` of the category's row, then by stage and title;
   3. then the decks of no category, by folder.
3. A deck two discovering groups both find and neither names is in neither group, and that is a finding. Naming it in one group's `slides:` places it there.

`deck_order` is set in the hub's `.oculus/config.yml` ([Data map](data-map.md#the-hubs-settings)), and oculus's value is in `config/catalogs/vocab.yml`.

The Overview is the Present view's grid of the deck's slides as tiles, in which each group has its own heading. A group's Add a deck tile, its last tile, lists the decks the group's rule finds outside the group. The group's Edit Rule control sets its `find:` and `discover:`.

## Slides

- A slide file is cut into slides at each line that holds only `---`, spaces after it allowed, outside a fenced code block and an HTML comment.
- A slide opens with its front matter when the `---` before it is followed at once, with no blank line, by YAML lines and a closing `---` that read as a map with a key. The file's first slide opens with front matter when the file's first line is `---`. A blank line after a slide's `---` starts its body at once.
- A front matter that fails to parse stays in the slide's body as words, and for the file's first slide it is also a finding.
- The body is Markdown. Its first line with words, when it is a level-1 heading (`# ...`), is the slide's heading. A slide needs a heading, or for a project or an idea slide a title from its front matter or its project. A slide that lacks both is a finding.
- An image the slide file's folder lacks is drawn as a gap and is a finding.
- `{{<group>.count}}` anywhere in a slide, its front matter included, is the number of slides the group's decks hold. For a group the deck does not define, the text stays as written and is a finding.

## Front-matter keys

A key of the wrong shape is read as absent.

| Key | Kinds | What it holds | When unset |
|---|---|---|---|
| `kind` | every kind | what the slide draws, one of the kinds below | `text` |
| `notes` | every kind | the presenter's notes, shown under Notes on the presenter screen | "No notes for this slide." |
| `legend` | `title`, `section`, `closing` | a group's name: a legend of the domains of its projects, each once; a group the deck lacks is a finding | no legend |
| `kicker` | `title`, `closing` | the small line over the heading | none |
| `contact` | `title`, `closing` | a line under the lede, for an address or a link | none |
| `foot` | `section` | the foot under the cards | the words after the numbered list |
| `title` | `project`, `idea` | the slide's title. An idea slide of a project's deck takes the project's short name, else its title, instead | a project slide: its project's short name, or in a deck of no project its heading. An idea slide of a deck of no project: the deck's name |
| `desc` | `idea` | the card's description | the slide's body |
| `sub` | `project` | the line under the title | none |
| `hook` | `project` | the sentence under the sub line | none |
| `tag` | `project` | `{ class, text }`: a chip of `text` in the hue `defaults.tag_tones` gives `class` | no chip |
| `eli5` | `project` | `{ purpose, plain }`: the callout of what the work is for and what it does in plain words | no callout |
| `equation` | `project` | the slide's formula, in LaTeX; a value ending in `.png`, `.jpg`, `.jpeg`, `.svg` or `.webp` is a finding and is not drawn | no formula |
| `specs` | `project` | a list of `{ label, value }`, the spec chips | no chips |
| `panels` | `project` | a list of `{ figure, diagram_html, caption, explain }`: an image named relative to the slide file's folder or markup in `diagram_html`, with its caption and a line explaining it; a figure the folder lacks is a finding | no figure |
| `method` | `project` | a list of text, the Method list | no list |
| `results` | `project` | a list of text, the Results list | no list |
| `mechanism` | `project` | the Core mechanism cell of a summary row of a deck that places this deck in a group | empty |
| `headline` | `project` | the Headline result cell of that row | empty |

## Slide kinds

A slide's `kind:` names one of the kinds below. The deck skips a slide of any other `kind:`, and reports it as a finding.

### title

The slide draws these parts:

- the kicker;
- the heading;
- the words under it, as the lede;
- the legend;
- the contact line.

```markdown
---
kind: title
kicker: Group meeting
---
# Lab update

What moved this month.
```

### section

The slide draws these parts:

- the heading;
- the words before the numbered list, as the lede;
- each item of the list, as a numbered card opened by its bold words;
- the words after the list, as the foot.

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

### text

The body as it is written, heading included.

```markdown
---
kind: text
---
# Next steps

- Write the methods section.
- Run the second cohort.
```

### image

The heading and the body's first image alone. The words in the image's brackets are its alt text.

```markdown
---
kind: image
---
# The learning curve

![Loss per epoch](figure.png)
```

### columns

The heading, the words before a line that holds only `|||` in the left column and the words after it in the right.

```markdown
---
kind: columns
---
# Before and after

The old pipeline read every file.

|||

The new one reads the cache.
```

### equation

The heading, the body's first `$$ ... $$` formula as the display formula, and the rest of the words under it.

```markdown
---
kind: equation
---
# The loss

$$ L = \sum_i (y_i - \hat{y}_i)^2 $$

Summed over the samples.
```

### code

The heading and the body's first fenced code block alone.

````markdown
---
kind: code
---
# The call

```python
model.fit(data, epochs=10)
```
````

### closing

Drawn as a title slide is.

```markdown
---
kind: closing
contact: "name@example.org"
---
# Questions

Thank you.
```

### project

A project slide, drawn from the keys of the table above. A project slide that sets none of `title`, `sub`, `hook`, `tag`, `eli5`, `equation`, `specs`, `panels`, `method` and `results` draws its body instead.

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

### idea

One card: the project's short name, else its title, the description, and the project's domain and stage.

```markdown
---
kind: idea
desc: "A model that learns the same with less work."
---
```

## The filter

- A deck whose groups hold project decks draws the Projects board's filter under the toolbar, with the board's rules, over the projects whose decks those groups hold. Its Mine only toggle, which keeps the projects that name you, starts on.
- The filter narrows every group of project decks to the decks of the projects it shows, and leaves a deck of no project out of such a group. A group of other decks keeps every deck.
- The narrowing reaches these parts of the deck:
  - the slides of `{ slides: <group> }`;
  - `{{<group>.count}}`;
  - the summary rows and the grid cards;
  - the legends;
  - the Overview.
- It holds on the pane, the presenter screen, the audience window and the PDF.
- The filter's controls belong to the pane and are kept with it. When the pane opens another deck, the controls go back to a board's starting state. They narrow the slides on screen and leave `present.yml` and the slide files as they are.

## The project facts strip

- These slides carry a strip of the project's facts at their foot:
  - a slide of the project's own files;
  - a slide a group places from a project's deck;
  - a summary or a grid a project's deck places.
- The strip gives each field of the table below that holds a value, in that order. A list shows its first entry and how many more, and its tooltip gives every entry.
- The Project facts toggle in the toolbar hides or shows the strip's words. It is on by default and kept with the pane. The strip keeps its room while hidden, so the slide's layout stays the same either way.

`{{project.<field>}}` anywhere in a slide of a project's deck, its front matter included, is filled from the project's manifest in the strip's words, every entry of a list joined with ", ". Spaces inside the braces are allowed.

```markdown
# Alpha at {{project.stage}}

Led by {{project.lead}}, for {{project.venue}}.
```

| Field | Filled from the manifest |
|---|---|
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

- A word with no label, or a record with no name or title, is shown as its key. A reference to a missing record is left out.
- A field with no value is filled with the empty text, and is a finding.
- A placeholder that names no field of the table keeps its text, and its finding lists the sixteen fields.
- In a deck of no project, a placeholder keeps its text, and is a finding.
