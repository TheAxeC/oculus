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
    flames: z.number().optional().describe("The number of flames a priority's badge draws."),
    assignable: z
        .boolean()
        .optional()
        .describe(
            "false keeps a venue tier out of the choices a venue's `tier` offers; it stays a word the views draw, as the fallback for a venue with no tier."
        )
});

/**
 * One row of `focus_lanes`: a lane's words, colour and cluster, and the stages or the chips that
 * put a project on it. A row names `stages` or `chips`, never both and never neither, so a move
 * onto the lane has one defined write.
 */
const laneRow = z
    .strictObject({
        key: text.describe('The word the lane is named by.'),
        label: text.optional().describe('The words the lane is drawn with.'),
        sub: text.optional().describe("The line drawn under the lane's label."),
        color: colour
            .optional()
            .describe("The colour of the lane's header, a hex the palette maps."),
        cluster: text
            .optional()
            .describe(
                'The group the lane belongs to on the board: now, parked or incubate, drawn as three clusters, or backlog, a lane drawn full width under them that takes only a project of a tier carrying `backlog`.'
            ),
        stages: z
            .array(text)
            .optional()
            .describe(
                "The stages of `stages` whose projects sit on the lane, compared with a project's stage as written; a move onto the lane keeps a stage the list holds and writes its first stage otherwise."
            ),
        chips: z
            .array(text)
            .optional()
            .describe(
                "The chips of `chips` that put a project on the lane whatever its stage, compared with its chips as written, which decide before any lane's `stages` do; a move onto the lane adds its first chip."
            )
    })
    .refine((row) => {
        const byStage = (row.stages ?? []).length > 0;
        const byChip = (row.chips ?? []).length > 0;
        return byStage !== byChip;
    });

/** The rows of `focus_lanes`, each stage word held by one row only. */
const laneRows = z.array(laneRow).superRefine((rows, context) => {
    const seen = new Set<string>();
    rows.forEach((row, at) => {
        for (const stage of row.stages ?? []) {
            if (seen.has(stage)) context.addIssue({ code: 'custom', path: [at, 'stages'] });
            seen.add(stage);
        }
    });
});

/** One stage of `stages`: its words, glyph and colour, and the flags the code reads. */
const stageWord = z.strictObject({
    label: text
        .optional()
        .describe('The words the stage is drawn with on a card, the form and an idea card.'),
    icon: text.optional().describe('The glyph name a chip of the stage is drawn with.'),
    color: colour
        .optional()
        .describe(
            "The colour of a project at the stage wherever it is drawn: its board card, the Map, the Present view's project chip."
        ),
    idea: flag(
        "The idea group: the cross-link group of ideas, and the Focus board's unplaced projects, which list an idea of a tier carrying `backlog` that neither the backlog lane nor another lane takes."
    ),
    live: flag(
        "The in-flight group: the audit's rules over in-flight work, the Focus board's unplaced projects and manifests behind, a pillar card's in-flight count and tier strip, a venue's concentration marker and the Funding tab's card of unfunded work."
    ),
    terminal: flag('The done group, a done or closed outcome; no rule of oculus reads it.'),
    dead: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            "A dead outcome, the only kind that is not real work, as its place in the Pillars view's Archival band from 1: the band lists its groups in that order, and a project at the stage on a tier carrying `finished` is left out of a pillar's and a domain's members, a venue's use counts and the cross-link groups. A stage with no number is real work."
        ),
    archive_outcome: flag(
        'A `stage:` a project is archived with, and the name of its archive/<outcome>/ filing folder; the audit lists an archived project whose `stage:` differs from its folder.'
    ),
    on_map: flag(
        'A stage that keeps a Pillars or Domains card awake: a card none of whose members is at such a stage is dormant.'
    ),
    placed: flag('A stage that has a venue, so the audit asks for one.'),
    standard: flag('The stages the audit holds to the one-README standard.'),
    public: flag(
        "A public outcome: the audit of the website's publications asks for its project on the site, in the sections `publication_kinds` gives."
    ),
    negative: flag(
        "A negative result, which stays in the hub: the audit of the website's publications reports its project when the site shows it."
    ),
    dead_end: flag(
        "A dead end: the audit of the website's publications reports its project when the site shows it, to be given another stage or taken off the site."
    ),
    submit_ready: flag('A stage the board statistics count as ready to go out.'),
    pauses_countdown: flag(
        "A stage that stops a card's and a lane's countdown, and that the Focus board's awaiting box counts as submitted work held at its venue."
    ),
    deadline_met: flag(
        "A stage that ends a project's own deadline, which then leaves the deadline radar."
    ),
    new_idea: flag(
        'The stage a new idea is made with: the first stage carrying it is written, and with none the new manifest names no stage.'
    ),
    published: flag('The stage the audit expects only on a tier carrying `finished`.')
});

/** One form of `forms`: the words and the glyph it is drawn with. */
const formWord = z.strictObject({
    label: text.optional().describe('The words the form is drawn with on a card and in the form.'),
    icon: text.optional().describe('The glyph name a chip of the form is drawn with.')
});

/**
 * One chip of `chips`: the words and the glyph it is drawn with, and the one flag the code reads.
 */
const chipWord = z.strictObject({
    label: text.optional().describe('The words the chip is drawn with on a card and in the form.'),
    icon: text.optional().describe('The glyph name the chip is drawn with.'),
    blocked: flag(
        "A chip the Focus board's awaiting box counts as blocked and a board's statistics strip counts in its blocked number, which the wait line of a board card and of a lane card says, and which flags the cross-link group of in-flight projects it is in; a project's chips are compared as written."
    )
});

/**
 * One status of `statuses`, a word a collection entry's `status` takes: its colour and the flags
 * the code reads. Each help sentence says how the code compares a status with the flag's words:
 * `wordFlag` trims an entry's status and puts it in lower case.
 */
const statusWord = z.strictObject({
    color: colour.optional().describe('The colour the status is drawn in.'),
    closes_deadline: flag(
        "The status ends an entry's deadline on the deadline radar; the status is compared trimmed and in lower case."
    ),
    deadline_met: flag(
        "The status ends a funding entry's or another entry's own deadline, so it leaves the deadline radar, and a funding entry carrying it is listed in the Focus board's awaiting box; compared trimmed and in lower case."
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
    default_application: flag(
        "The status of the Applications entry a Position Lead's apply control makes: the first word carrying it is written."
    ),
    default_task: flag(
        'The status of a task added from the palette: the first word carrying it is written.'
    )
});

/**
 * One status of `lead_statuses`, a word a Position Lead's `status` takes: its colour and the flags
 * the code reads, each compared trimmed and in lower case.
 */
const leadStatusWord = z.strictObject({
    color: colour.optional().describe('The colour the status is drawn in.'),
    lead_closed: flag('A Position Lead that is closed, counted and listed as done.'),
    lead_declined: flag(
        'A Position Lead the reader declined, which the Leads view hides until asked; the first such word is what the decline control writes.'
    ),
    lead_applied: flag(
        'A Position Lead the reader applied to, which offers no apply control; the first such word is what the apply control writes.'
    ),
    default_lead: flag(
        'The status a new Position Lead gets and a reopened one goes back to, and the one status the decline control is offered on.'
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
        "A tier whose `nascent` projects sit in the Focus board's backlog lane, the lane of the cluster `backlog`, which is where a new project of the tier starts."
    ),
    personal: flag("Projects the audit's research rules leave alone."),
    outcome_folders: flag(
        "A tier whose category folder is its project's outcome: the audit expects a project filed under a folder named by a stage carrying `archive_outcome` to be at that stage."
    ),
    stage_folders: z
        .array(text)
        .optional()
        .describe(
            "The category folders of a tier that name its project's stage, which the audit expects the project to be at."
        )
});

/** One row of `publication_kinds`: the sections it gives and the stages and forms it holds to. */
const publicationKind = z.strictObject({
    kind: z
        .array(text)
        .describe(
            "The sections of the website's publication feed a project this row matches may sit in."
        ),
    stages: z
        .array(text)
        .optional()
        .describe(
            "The stages of `stages` the row holds to, compared with a project's stage as written; absent, the row places no condition on the stage."
        ),
    forms: z
        .array(text)
        .optional()
        .describe(
            "The forms of `forms` the row holds to, compared with a project's form as written; absent, the row places no condition on the form."
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
    author_chips: z
        .array(text)
        .optional()
        .describe('The chips that mark the author role on finished or contributed work.')
});

/** config/catalogs/vocab.yml: the controlled vocabularies the boards and the schemas draw from. */
export const vocabFileShape = z.strictObject({
    palette: textMap
        .optional()
        .describe(
            'Each configured hex with the named colour token it is drawn as; a hex not listed is drawn as it is.'
        ),
    stages: z
        .record(z.string(), stageWord)
        .optional()
        .describe(
            "The project stages, by the manifest's `stage`, in the order the boards, the Map, the board statistics and the form list them, each with its words, glyph and colour and the flags that say what it decides."
        ),
    forms: z
        .record(z.string(), formWord)
        .optional()
        .describe(
            "The forms of a project's output, by the manifest's `form`, each with the words and the glyph it is drawn with."
        ),
    chips: z
        .record(z.string(), chipWord)
        .optional()
        .describe(
            "The chips a manifest's `status.chips` picks from, in the order the form offers them, each with its words, its glyph and its flag."
        ),
    statuses: z
        .record(z.string(), statusWord)
        .optional()
        .describe(
            "The statuses a collection entry's `status` takes, each with its colour and the flags that say what it decides."
        ),
    lead_statuses: z
        .record(z.string(), leadStatusWord)
        .optional()
        .describe(
            "The statuses a Position Lead's `status` takes, each with its colour and the flags that say what it decides."
        ),
    focus_lanes: laneRows
        .optional()
        .describe(
            'The lanes of the Focus board, in their order, each with its words, colour and cluster and the stages or the chips that put a project on it.'
        ),
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
            "The sections of the website's publication feed a project is expected in: the first row whose stages and forms match the project gives them."
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
