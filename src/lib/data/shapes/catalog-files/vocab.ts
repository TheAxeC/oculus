// Layer 1, data. The whole-file shape of config/catalogs/vocab.yml, the controlled vocabularies
// the boards and the schemas draw from, with a description on every key at every level. The
// descriptions say what the file's head comments and readers say each key holds. The career and
// lead keys are a hub's own, set in its `.oculus/config.yml` and checked by this shape.

import { z } from 'zod';
import { colour, flag, text, textMap } from './common.ts';

/** One row of a keyed list: its `key` and the words it is drawn with. */
const keyed = z.strictObject({
    key: text.describe('The word the row is named by, which the files that pick a row write.'),
    label: text.optional().describe('The words the row is drawn with.'),
    icon: text.optional().describe('The glyph name the row is drawn with, a key of glyphs.yml.'),
    color: colour.optional().describe('The colour the row is drawn in, a hex the palette maps.'),
    glyph: text.optional().describe('The glyph name the row is drawn with, a key of glyphs.yml.'),
    sub: text.optional().describe("The line drawn under a Focus lane's label."),
    cluster: text
        .optional()
        .describe('The group a Focus lane belongs to on the board: now, parked or incubate.'),
    flames: z.number().optional().describe("The number of flames a priority's badge draws."),
    assignable: z
        .boolean()
        .optional()
        .describe(
            "false keeps a venue tier out of the choices a venue's `tier` offers; it stays a word the views draw, as the fallback for a venue with no tier."
        )
});

/**
 * One word of `statuses`: its words, glyph and colour, and the flags the code reads. Each help
 * sentence says how the code compares a word with the flag's words: `wordFlag` trims a record's
 * status and puts it in lower case, `anyWord` compares a project's chips as written.
 */
const statusWord = z.strictObject({
    label: text.optional().describe('The words the status is drawn with.'),
    icon: text.optional().describe('The glyph name a chip of the status is drawn with.'),
    color: colour
        .optional()
        .describe(
            'The colour the status is drawn in; a word with a colour is a status a collection entry takes.'
        ),
    chip: flag(
        "A status chip a manifest's `status.chips` picks from (the status legend), offered by the project form in this order."
    ),
    closes_deadline: flag(
        "The status ends a collection entry's deadline on the deadline radar; the status is compared trimmed and in lower case."
    ),
    deadline_met: flag(
        "The status ends a project's own deadline (a chip whose word carries `closes_deadline` alone does not); compared trimmed and in lower case."
    ),
    live_subtasks: flag(
        "A status with `closes_deadline` under which an entry's subtasks and follow-up notes stay on the radar; compared trimmed and in lower case."
    ),
    waiting: flag(
        "An entry waiting on someone else, which the audit asks a date to track by; the audit compares the entry's status in lower case."
    ),
    acknowledged: flag(
        "A funding entry a manuscript acknowledges, so it needs a `statement`; the entry's status is compared as written."
    ),
    lead_closed: flag(
        'A Position Lead that is closed, counted and listed as done; compared trimmed and in lower case.'
    ),
    lead_declined: flag(
        'A Position Lead the reader declined, which the Leads view hides until asked; the first such word is what the decline control writes, and a status is compared trimmed and in lower case.'
    ),
    lead_applied: flag(
        'A Position Lead the reader applied to, which offers no apply control; the first such word is what the apply control writes, and a status is compared trimmed and in lower case.'
    ),
    default_lead: flag(
        'The status a new Position Lead gets and a reopened one goes back to, and the one status the decline control is offered on; compared trimmed and in lower case.'
    ),
    default_application: flag(
        "The status of the Applications entry a Position Lead's apply control makes: the first word carrying it is written."
    ),
    default_task: flag(
        'The status of a task added from the palette: the first word carrying it is written.'
    ),
    new_idea: flag('The chip a new idea is made with: the first word carrying it is written.'),
    pauses_countdown: flag(
        "A chip that stops a card's and a lane's countdown, and that the Focus board and the board statistics count as submitted work; a project's chips are compared as written."
    ),
    blocked: flag(
        "A chip the Focus board and the board statistics count as blocked, which also keeps a project out of the backlog; a project's chips are compared as written."
    ),
    submit_ready: flag(
        "A chip the board statistics count as ready to go out; a project's chips are compared as written."
    ),
    published: flag(
        "The chip the audit expects on a published project; a project's chips are compared as written."
    )
});

/**
 * One word of `types`: its colour and the flags the code reads, each compared with a project's
 * `type` as the manifest writes it. `dead` is a number, the type's place in the Archival band.
 */
const typeWord = z.strictObject({
    color: colour
        .optional()
        .describe(
            "The colour of a project of the type wherever it is drawn: its board card, the Map, the Present view's project chip."
        ),
    dead: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            "A dead or paused outcome, the only kind that is not real work, as its place in the Pillars view's Archival band from 1: the band lists its groups in that order, and the type is left out of a pillar's and a domain's members. A type with no number is real work."
        ),
    terminal: flag('A done or closed outcome, which the audit holds to no live chip.'),
    archive_outcome: flag(
        'A `type:` a project is archived with, and the name of its archive/<outcome>/ filing folder; the audit lists an archived project whose `type:` differs from its folder.'
    ),
    live: flag(
        "Work in flight: the audit's rules over in-flight work, the cross-link group of in-flight projects, a venue's in-flight papers, the Map's in-flight members, the Focus lanes and the backlog."
    ),
    on_map: flag('A type the Map draws as a node of the portfolio.'),
    placed: flag('A type that has a venue, so the audit asks for one.'),
    standard: flag('The types of the projects tier the audit expects there.'),
    idea: flag('The backlog of ideas on the Focus board.'),
    public: flag(
        "A public outcome: the audit of the website's publications asks for its project on the site, in the sections `publication_kinds` gives."
    ),
    negative: flag(
        "A negative result, which stays in the hub: the audit of the website's publications reports its project when the site shows it."
    ),
    dead_end: flag(
        "A dead end: the audit of the website's publications reports its project when the site shows it, to be retyped or taken off the site."
    )
});

/** One word of `tiers`: the flags the code reads, each compared with the tier as written. */
const tierWord = z.strictObject({
    finished: flag(
        "Finished or contributed work: the audit's rules over finished work, the cross-link group of finished projects, a venue's past papers, the Map's finished members."
    ),
    software: flag(
        "Software projects: a card's and a board's software line, and a board that offers no New project."
    ),
    main: flag(
        "The research board's tier: the venue load of the Command Center and the Inbox, the manifests behind, the projects quick add writes to, and the tier a new project is made in when none is named."
    ),
    backlog: flag(
        'A tier whose projects may sit in the Focus backlog (`focus: holding`), where a new project of the tier starts.'
    ),
    personal: flag("Projects the audit's research rules leave alone."),
    outcome_folders: flag(
        "A tier whose category folder is its project's outcome: the audit expects a project filed under a folder named by a type carrying `archive_outcome` to have that type."
    ),
    type_folders: z
        .array(text)
        .optional()
        .describe(
            "The category folders of a tier that name its project's type, which the audit expects the project to have."
        )
});

/** One row of `publication_kinds`: the sections it gives and the types and chips it holds to. */
const publicationKind = z.strictObject({
    kind: z
        .array(text)
        .describe(
            "The sections of the website's publication feed a project this row matches may sit in."
        ),
    types: z
        .array(text)
        .optional()
        .describe(
            "The types of `types` the row holds to, compared with a project's type as written; absent, the row places no condition on the type."
        ),
    chips: z
        .array(text)
        .optional()
        .describe(
            'The status chips the row holds to, of which a project must carry one, compared as written; absent, the row places no condition on the chips.'
        )
});

/**
 * One status of the career card's host pipeline: drawn, whether it is outreach in flight, whether
 * the awaiting-a-response box lists it, and whether a host row with no status is at it.
 */
const hostStatus = z.strictObject({
    icon: text.optional().describe('The glyph name the status is drawn with.'),
    label: text.optional().describe('The words the status is drawn with.'),
    color: colour.optional().describe('The colour the status is drawn in.'),
    in_flight: flag('Outreach in flight.'),
    waiting: flag("A status the career card's awaiting-a-response box lists."),
    default: flag('The status a host row with no `status:` is at.')
});

/** One stage of the funding pipeline. */
const fundStage = z.strictObject({
    label: text.describe('The words the stage is drawn with in the Focus Funding column.'),
    color: colour.optional().describe('The colour the stage is drawn in.'),
    statuses: z
        .array(text)
        .optional()
        .describe('The statuses of a funding entry that place it in this stage.')
});

/** One column the career board scores a host by. */
const scoreDim = z.strictObject({
    field: text.describe('The key of a host of the career file that holds the score.'),
    badge: text.optional().describe("The letters of the score's chip."),
    label: text.optional().describe('The words the chip shows on hover.')
});

/** The lists of words the audit's lifecycle guardrails read. */
const lifecycle = z.strictObject({
    live_chips: z
        .array(text)
        .optional()
        .describe('The in-flight chips a terminal project must not still carry.'),
    author_chips: z
        .array(text)
        .optional()
        .describe('The chips that mark the author role on finished or contributed work.'),
    contradictory_chips: z
        .array(z.array(text))
        .optional()
        .describe(
            'The pairs of chips that cannot both be true; the audit reports a project carrying a pair.'
        )
});

/** config/catalogs/vocab.yml: the controlled vocabularies the boards and the schemas draw from. */
export const vocabFileShape = z.strictObject({
    palette: textMap
        .optional()
        .describe(
            'Each configured hex with the named colour token it is drawn as; a hex not listed is drawn as it is.'
        ),
    types: z
        .record(z.string(), typeWord)
        .optional()
        .describe(
            "The project types, by the manifest's `type`, in the order the boards, the Map and the board statistics list them, each with its colour and the flags that say what it decides."
        ),
    statuses: z
        .record(z.string(), statusWord)
        .optional()
        .describe(
            "The status words of a project's chips and of a collection entry's `status`, each with what is drawn for it and the flags that say what it decides."
        ),
    focus_lanes: z
        .array(keyed)
        .optional()
        .describe(
            'The lanes of the Focus board, in their order, each with its words, colour and cluster.'
        ),
    holding_color: colour
        .optional()
        .describe("The colour of the Focus backlog's header and of a project's holding pill."),
    priority_levels: z
        .array(keyed)
        .optional()
        .describe('The priorities a card may carry, each with the flames of its count badge.'),
    fund_stages: z
        .array(fundStage)
        .optional()
        .describe(
            'The stages stacked inside the Focus Funding column, each with the statuses it matches.'
        ),
    focus_lane_tones: textMap
        .optional()
        .describe(
            'The hue name of the bar of each collection lane of the Focus board: funding, jobs and teaching.'
        ),
    career_host_status: z
        .record(z.string(), hostStatus)
        .optional()
        .describe(
            'The host pipeline of the career card: each status a host of the career file takes, with its glyph, words and colour, in the order the card offers them.'
        ),
    career_score_dims: z
        .array(scoreDim)
        .optional()
        .describe('The scored axes of a career host, each drawn as a chip.'),
    career_score_tones: textMap
        .optional()
        .describe(
            "The hue of a host's score chip by the tier its score falls in (strong, good, mid or weak); a tier with no hue draws muted."
        ),
    tiers: z
        .record(z.string(), tierWord)
        .optional()
        .describe('The project tiers, each with the flags that say what it decides.'),
    publication_kinds: z
        .array(publicationKind)
        .optional()
        .describe(
            "The sections of the website's publication feed a project is expected in: the first row whose types and chips match the project gives them."
        ),
    leads_fit: textMap.optional().describe("The colour of a Position Lead's fit chip, by its fit."),
    lifecycle: lifecycle.optional().describe("The chip words the audit's status guardrails read."),
    data_access: textMap
        .optional()
        .describe("The colour of a dataset's access chip, by its access word."),
    venue_categories: z.array(text).optional().describe("The words a venue's category takes."),
    venue_tiers: z
        .array(keyed)
        .optional()
        .describe(
            "The tiers a venue's `tier` takes, best first, each with its colour; a tier with `assignable: false` is drawn but not offered."
        ),
    radar_buckets: z
        .array(keyed)
        .optional()
        .describe(
            "The buckets the Lit Watch radar sorts a project's new papers into, each with its glyph, words and colour."
        )
});

/** The top-level keys of vocab.yml. */
export const VOCAB_FILE_KEYS: readonly string[] = Object.keys(vocabFileShape.shape);
