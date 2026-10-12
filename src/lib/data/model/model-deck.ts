// Layer 1, data. A project's deck: the slides, groups and order a `present.yml` holds, and the deck
// as the deck route answers it. It is a concern module of its own beside model-entities.ts, reached
// through the index.ts facade alone, because a deck changes for deck reasons: a slide kind, a
// panel, a state word.

import type { Finding } from './model-entities.ts';

/** The status chip of a slide: the class its colour comes from, and the word it wears. */
export type PresentTag = {
    class?: string;
    text?: string;
};

/** One chip of a slide's spec strip. */
export type PresentSpec = {
    label: string;
    value: string;
};

/** The plain-language callout of a slide: what the work is for, and what it does in plain words. */
export type PresentEli5 = {
    purpose?: string;
    plain?: string;
};

/**
 * One visual of a slide. `figure` is the file name as the slide wrote it and `src` the address the
 * file route answers it at, which is absent for a figure the deck's root does not hold;
 * `diagramHtml` is inline markup the sanitiser filters.
 */
export type PresentPanel = {
    figure?: string;
    src?: string;
    diagramHtml?: string;
    caption?: string;
    explain?: string;
    /** The named figure is not in the folder, so the view draws the gap and not a dead image. */
    missing?: boolean;
};

/**
 * The rich project slide, read from the front matter of a `kind: project` slide of a deck.
 * `equation` is LaTeX the page typesets; a value that names an image is a finding and is not kept
 * (data/sources/deck/project.ts). `body` is the Markdown under the front matter, which is what a
 * project slide with no rich key draws. `mechanism` and `headline` are what a summary row of
 * another deck reads from it.
 */
export type PresentSlide = {
    tag?: PresentTag;
    title?: string;
    sub?: string;
    hook?: string;
    eli5?: PresentEli5;
    equation?: string;
    specs: PresentSpec[];
    panels: PresentPanel[];
    method: string[];
    results: string[];
    body?: string;
    mechanism?: string;
    headline?: string;
};

/** The kinds a slide of a deck is, from the `kind:` of its front matter or computed by the deck. */
export type SlideKind =
    | 'title'
    | 'section'
    | 'text'
    | 'image'
    | 'columns'
    | 'equation'
    | 'code'
    | 'closing'
    | 'project'
    | 'idea'
    | 'summary'
    | 'grid';

/** One numbered card of a section slide. */
export type DeckCard = {
    n: string;
    title: string;
    body: string;
};

/** One card of the idea grid and the one slide of an `idea` kind. */
export type DeckIdeaCard = {
    name: string;
    desc: string;
    /** The project's `domain:` key, which the card's colour and words are read from. */
    domain?: string;
    /** The status chip of the project that says how far the idea is. */
    maturity?: string;
};

/** One row of a summary table. */
export type DeckSummaryRow = {
    /** The project's `domain:` key; the field is that domain's label. */
    domain?: string;
    project: string;
    mechanism: string;
    headline: string;
};

/**
 * Where a slide is written: the served root and the file under it, the slide's place in that file
 * counted from 0, and `entry`, the place in the shown deck's `order:` of the entry that placed it
 * (a group's entry for a slide of a member deck). For a summary or a grid the file is the deck's
 * `present.yml` and `index` is its entry's place, the same as `entry`. `line` is the 1-based line
 * of the file the slide starts on: the entry's line in `present.yml` for a summary or a grid.
 */
type DeckSlideSource = {
    root: string;
    path: string;
    index: number;
    entry: number;
    line: number;
};

/** What every slide of a deck carries. */
type SlideBase = {
    /** The slide's key inside its deck, which a pane keeps to stay on the slide. */
    key: string;
    /** Plain words naming the slide in the overview grid. */
    title: string;
    notes?: string;
    /** Absent for a slide the deck does not read from a file. */
    source?: DeckSlideSource;
};

/**
 * The address a slide's Markdown image is given when the deck's folder lacks the file, which the
 * view draws as the gap, with the file's name as the image's alt text.
 */
export const DECK_GAP = '#gap';

/**
 * One slide of a deck as the view draws it. Words are Markdown, with the group counts in them
 * already replaced. A `legend` is the domain keys of the group the slide names.
 */
export type DeckSlide =
    | (SlideBase & {
          kind: 'title' | 'closing';
          kicker?: string;
          heading: string;
          lede: string;
          contact?: string;
          legend: string[];
      })
    | (SlideBase & {
          kind: 'section';
          heading: string;
          lede: string;
          cards: DeckCard[];
          foot: string;
          legend: string[];
      })
    | (SlideBase & { kind: 'text'; body: string })
    | (SlideBase & { kind: 'image'; heading: string; src: string; alt: string })
    | (SlideBase & { kind: 'columns'; heading: string; left: string; right: string })
    | (SlideBase & { kind: 'equation'; heading: string; equation: string; rest: string })
    | (SlideBase & { kind: 'code'; heading: string; code: string })
    | (SlideBase & {
          kind: 'project';
          slide: PresentSlide;
          /** The slide's project type, drawn as its chip. */
          type?: string;
          /** The project's `domain:` key. */
          domain?: string;
      })
    | (SlideBase & { kind: 'idea'; card: DeckIdeaCard })
    | (SlideBase & { kind: 'summary'; heading: string; rows: DeckSummaryRow[]; foot: string })
    | (SlideBase & {
          kind: 'grid';
          heading: string;
          lede: string;
          cards: DeckIdeaCard[];
          foot: string;
          /** The status chips the group looks for, which the maturity legend explains. */
          legend: string[];
      });

/** One deck a group holds or could hold: its name, its words and where it is under its root. */
type DeckMember = {
    name: string;
    title: string;
    /** The deck's folder under the root it was found in. */
    path: string;
    /** Whether the group's `slides:` names it; a member that is not was found by discovery. */
    named: boolean;
};

/** A deck two discovering groups both find and neither names, with the other groups. */
type DeckConflict = {
    name: string;
    path: string;
    others: string[];
};

/** One group of a deck, as the Slides view lists it. */
export type DeckGroup = {
    name: string;
    /** The group's `slides:` as the file holds it, which a write names as its `base`. */
    slides: string[];
    members: DeckMember[];
    /** Found by the group's `find:`, in no member's place. */
    candidates: DeckMember[];
    /** Names in `slides:` that match no deck. */
    missing: string[];
    conflicts: DeckConflict[];
    /** The slides the group holds, which `{{<group>.count}}` is. */
    count: number;
};

/**
 * One entry of a deck's `order:` as the Slides view lists it: its `token`, which a write names it
 * by, what it is (a slide file, a group's slides, a summary or a grid), the file or group it
 * names, and the words that show it (the title of a file's first slide, a summary's own title).
 */
export type DeckOrderEntry = {
    token: string;
    kind: 'file' | 'group' | 'summary' | 'grid';
    name: string;
    title: string;
};

/**
 * Why a deck draws nothing, or `ok` when it draws slides. `unnamed` is the portfolio deck of a hub
 * whose own `sources.yml` does not name `portfolio_deck`, when the engine's default folder is not
 * in that hub: the hub never asked for a deck, so its absence is no failure.
 */
export type DeckState = 'ok' | 'empty' | 'no_file' | 'unreadable' | 'missing' | 'unnamed';

/**
 * One deck as the deck route answers it: the slides in order, the groups with their members, and
 * what was wrong with the files. `tagTones` is a hue name per `tag.class`, the engine's defaults
 * under the deck's own.
 */
export type Deck = {
    root: string;
    /** The deck's folder under the root. */
    path: string;
    name: string;
    title: string;
    state: DeckState;
    slides: DeckSlide[];
    /** The entries of `order:` the reader knows, in the file's order. */
    order: DeckOrderEntry[];
    groups: DeckGroup[];
    tagTones: Record<string, string>;
    findings: Finding[];
};
