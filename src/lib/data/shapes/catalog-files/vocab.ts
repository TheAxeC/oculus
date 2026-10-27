// Layer 1, data. The whole-file shape of config/catalogs/vocab.yml, the controlled vocabularies the
// boards and the schemas draw from, with a description on every key at every level. The
// descriptions say what the file's head comments and readers say each key holds. A hub sets every
// key in its `.oculus/config.yml`, laid over oculus's value by the key's shape (merge/in-place.ts),
// and the merged value is checked by this shape; the lead key `leads_fit` is a hub's alone, since
// oculus ships none.

import { z } from 'zod';
import { HEX_COLOUR, colour, flag, text, textMap } from './common.ts';

/** One row of a keyed list: its `key` and the words it is drawn with. */
const keyed = z.strictObject({
    key: text.describe('The word the row is named by, which the files that pick a row write.'),
    label: text.optional().describe('The words the row is drawn with.'),
    icon: text.optional().describe('The glyph name the row is drawn with, a key of glyphs.yml.'),
    color: colour.optional().describe('The colour the row is drawn in, a hex the palette maps.'),
    glyph: text.optional().describe('The glyph name the row is drawn with, a key of glyphs.yml.'),
    assignable: z
        .boolean()
        .optional()
        .describe(
            "false keeps a venue tier out of the choices a venue's `tier` offers; it stays a word the views draw, as the fallback for a venue with no tier."
        )
});

/**
 * What a move onto a Focus lane writes: one field, the stage a lane of `stages` writes or the chip
 * a lane of `chips` adds, a word the lane lists (data/sources/config/sections/vocab.ts says what
 * else is wrong with it).
 */
const moveWrites = z.strictObject({
    stage: text
        .optional()
        .describe(
            "The stage a move onto a lane of `stages` writes when the project's stage is none of the lane's, a word of the lane's `stages`."
        ),
    chip: text
        .optional()
        .describe(
            "The chip a move onto a lane of `chips` adds when the project carries none of the lane's chips, a word of the lane's `chips`."
        )
});

/**
 * One row of `focus_lanes`: a lane's words, glyph, colour and cluster, the stages or the chips that
 * put a project on it, and what a move onto it writes. A row names `stages` or `chips`, never both
 * and never neither.
 */
const laneRow = z
    .strictObject({
        key: text.describe('The word the lane is named by.'),
        label: text.optional().describe('The words the lane is drawn with.'),
        icon: text
            .optional()
            .describe('The glyph name the lane is drawn with, a key of glyphs.yml.'),
        sub: text.optional().describe("The line drawn under the lane's label."),
        color: colour
            .optional()
            .describe("The colour of the lane's header, a hex the palette maps."),
        cluster: text
            .optional()
            .describe(
                'The key of the row of `focus_clusters` the lane is drawn in; a lane naming none, or one no readable row has, is not drawn.'
            ),
        stages: z
            .array(text)
            .optional()
            .describe(
                "The stages of `stages` whose projects sit on the lane, compared with a project's stage as written; a move onto the lane keeps a stage the list holds and writes `move_writes.stage` otherwise."
            ),
        chips: z
            .array(text)
            .optional()
            .describe(
                "The chips of `chips` that put a project on the lane whatever its stage, unless its stage carries `terminal`, compared with its chips as written, which decide before any lane's `stages` do; a move onto the lane adds `move_writes.chip` when the project carries none of them."
            ),
        move_writes: moveWrites
            .optional()
            .describe(
                'What a move onto the lane writes, `stage` for a lane of `stages` or `chip` for a lane of `chips`; a lane without it takes no move.'
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

/**
 * One row of `focus_clusters`, a group the Focus board draws its lanes in: the dotted keys of the
 * text-catalog words it is headed by, and how it is drawn.
 */
const clusterRow = z.strictObject({
    key: text.describe("The word the cluster is named by, which a lane's `cluster` names."),
    label: text
        .optional()
        .describe(
            'The dotted key of the text-catalog word the cluster is headed by; with none the cluster has no heading words.'
        ),
    glyph: text
        .optional()
        .describe(
            "The dotted key of the text-catalog word holding the glyph drawn before the cluster's heading; with none it is drawn with no glyph."
        ),
    muted: z.boolean().optional().describe('true draws the cluster in muted colours.'),
    layout: z
        .enum(['columns', 'full_width'])
        .describe(
            "columns draws the cluster's lanes side by side under its heading; full_width draws each of its lanes as a full-width section headed by the lane's label."
        ),
    sort: z
        .enum(['title'])
        .optional()
        .describe(
            "title orders a lane's cards by title; with none they go by deadline, then title."
        ),
    awaiting: z
        .boolean()
        .optional()
        .describe(
            "true counts the projects on the cluster's lanes in the Focus board's awaiting box."
        )
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
        "The idea group: the cross-link group of ideas, and the Focus board's unplaced projects, which list a project of any tier at such a stage that no lane takes. The Idea lane holds only `nascent`."
    ),
    live: flag(
        "The in-flight group: the audit's rules over in-flight work, the Focus board's unplaced projects and manifests behind, a pillar card's in-flight count and tier strip, a venue's concentration marker and the Funding tab's card of unfunded work."
    ),
    terminal: flag(
        'The done group, a done or closed outcome: the cross-link group of done projects, the boards that take or leave out done work by it, quick add, which offers no such project, and the Focus chip lanes, which hold none; the audit lists such a project that carries a chip of a chip lane.'
    ),
    dead: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            "A dead outcome, as its place in the Pillars view's Archival band from 1: the band lists its groups in that order. The `dead-ends` row of `categories` takes these stages, and the cross-link groups leave a project at such a stage out."
        ),
    on_map: flag(
        'A stage that keeps a Pillars or Domains card awake: a card none of whose members is at such a stage is dormant.'
    ),
    placed: flag('A stage that has a venue, so the audit asks for one.'),
    public: flag(
        "A public outcome: the audit of the website's publications asks for its project on the site, in the sections the hub's `audit.website.kinds` gives."
    ),
    negative: flag(
        "A negative result, which stays in the hub: the audit of the website's publications reports its project when the site shows it."
    ),
    dead_end: flag(
        "A dead end: the audit of the website's publications reports its project when the site shows it, to be given another stage or taken off the site."
    ),
    pauses_countdown: flag(
        "A stage that stops a card's and a lane's countdown, and that the Focus board's awaiting box counts as submitted work held at its venue."
    ),
    deadline_met: flag(
        "A stage that ends a project's own deadline, which then leaves the deadline radar."
    ),
    new_idea: flag(
        'The stage a new idea is made with, carried by one stage at most: with none, or with two carrying it (a finding), the new manifest names no stage.'
    )
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
        "A chip the Focus board's awaiting box counts as blocked and a project board counts in the red badge of its Situation button, which the wait line of a board card and of a lane card says, and which flags the cross-link group of in-flight projects it is in; a project's chips are compared as written."
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
        "The status ends a funding entry's or another entry's own deadline, so it leaves the deadline radar, and a funding entry carrying it is listed in the Focus board's awaiting box under Grants, an entry of a file flagged `awaiting` under Applications; compared trimmed and in lower case."
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
        "The status of the Applications entry a Position Lead's apply control makes, carried by one word at most: with two carrying it (a finding) the entry is made with no status."
    ),
    default_task: flag(
        'The status of a task added from the palette, carried by one word at most: with two carrying it (a finding) the task is added with no status.'
    ),
    obtained: flag(
        "The status is funding obtained, which the career banner's track record counts; compared trimmed and in lower case."
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
        'A Position Lead the reader declined, which the Leads view hides until asked, and the word the decline control writes, carried by one word at most: with two carrying it (a finding) the control is drawn disabled.'
    ),
    lead_applied: flag(
        'A Position Lead the reader applied to, which offers no apply control, and the word the apply control writes, carried by one word at most: with two carrying it (a finding) the control is drawn disabled.'
    ),
    default_lead: flag(
        'The status a new Position Lead gets and a reopened one goes back to, and the one status the decline control is offered on, carried by one word at most: with two carrying it (a finding) neither is read for it.'
    )
});

/** One word of `tiers`, a kind of project: the words it is drawn with. */
const tierWord = z.strictObject({
    label: text.optional().describe('The words the tier is drawn with in the project form.'),
    unmarked: z
        .boolean()
        .optional()
        .describe(
            "true leaves the tier off a Focus lane card's tags; any number of tiers may carry it, or none."
        ),
    default: flag(
        'The default tier, carried by one tier at most: a new project whose write names no tier gets it, and a board naming several tiers makes New project in it when it is one of them; with none, or two carrying it (a finding), such a write is refused.'
    )
});

/** The tiers the audit's research rules leave alone. */
const researchAudit = z.strictObject({
    skip_tiers: z
        .array(text)
        .optional()
        .describe(
            "The tiers of `tiers` the audit's research rules leave alone and whose projects the Pillars view's Orphans card leaves out."
        )
});

/** One row of `roles`: its key, its words and the field of a record it is read from. */
const roleRow = z.strictObject({
    key: text.describe("The word the role is named by, which a board's `role:` names."),
    label: text.optional().describe('The words the role is drawn with in the Role facet.'),
    field: text
        .optional()
        .describe(
            'The field of a project or a collection entry that lists people for this role; the user holds the role when the field holds the person `self` names. A row without a field is the role of a record that names people but not the user.'
        ),
    unmarked: z
        .boolean()
        .optional()
        .describe(
            "true leaves the role off a Focus lane card's tags; any number of roles may carry it, or none."
        )
});

/** A list of the words of a vocabulary map, in a word block. */
const blockList = (help: string) => z.array(text).optional().describe(help);

/**
 * A word block: the lists a project's word of one vocabulary map is held against, each list named
 * holding. A category's `stages:` and `forms:` are one, and so is the `stages` of a row of the
 * hub's `audit:` setting (server/content/audit/setting.ts), the `words` control of an option.
 */
export const wordBlock = z.strictObject({
    words: blockList("Words of the map, one of which is the project's."),
    not_words: blockList("Words of the map none of which is the project's."),
    flags: blockList("Flags of the map's rows, one of which the project's word carries."),
    not_flags: blockList("Flags of the map's rows none of which the project's word carries.")
});

/** One row of `categories`: a category of the boards, the stages and forms it holds, its flags. */
const categoryRow = z.strictObject({
    key: text.describe(
        "The word the category is named by, which a board's slice filter and its folded sections store."
    ),
    label: text.optional().describe('The words the category is drawn with.'),
    color: colour
        .optional()
        .describe(
            'The colour the category is drawn in; a row without one is a finding and is drawn in no colour.'
        ),
    stages: wordBlock.optional().describe("The block a project's `stage` is held against."),
    forms: wordBlock.optional().describe("The block a project's `form` is held against."),
    record: flag("The row is a record of the work's output."),
    rail: flag(
        'A board gives the rail the count of its projects in such rows, drawn in `rail_color`.'
    ),
    archival: flag(
        "The Pillars view's Archival band: such a project is no real work, left out of a venue's use counts, the Orphans card and a pillar's and a domain's members."
    )
});

/**
 * One stage stacked inside a column of the Focus band, the row of `fund_stages`, `position_stages`
 * and `teaching_stages` alike.
 */
const bandStage = z.strictObject({
    label: text.describe('The words the stage is drawn with in its Focus column.'),
    color: colour.optional().describe('The colour the stage is drawn in.'),
    statuses: z
        .array(text)
        .optional()
        .describe('The statuses of an entry that place it in this stage.')
});

/**
 * One word of `ticker_categories`, a deadline category of the command center: the dotted keys of
 * the text-catalog words it is drawn with, and the flag the code reads.
 */
const tickerWord = z.strictObject({
    label: text
        .optional()
        .describe("The dotted key of the word the category's group is headed by."),
    glyph: text
        .optional()
        .describe("The dotted key of the word holding the glyph name the category's lines carry."),
    noun: text
        .optional()
        .describe(
            'The dotted key of the word a dated line of an entry or a lead is named by, as in "task in 3d".'
        ),
    overdue_noun: text
        .optional()
        .describe(
            'The dotted key of the word an overdue line of an entry is named by; absent, the `noun`.'
        ),
    manifests: flag(
        "The category of the project manifests' deadlines, carried by one word at most: with two carrying it (a finding) those deadlines have no category."
    )
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
            "The project stages, by the manifest's `stage`, in the order the boards, the Map and the form list them, each with its words, glyph and colour and the flags that say what it decides."
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
    focus_clusters: z
        .array(clusterRow)
        .optional()
        .describe(
            'The clusters the Focus board groups its lanes into, in drawing order, each with its heading words and glyph and how it is drawn.'
        ),
    focus_lanes: laneRows
        .optional()
        .describe(
            'The lanes of the Focus board, in their order, each with its words, colour and cluster, the stages or the chips that put a project on it, and what a move onto it writes.'
        ),
    fund_stages: z
        .array(bandStage)
        .optional()
        .describe(
            'The stages stacked inside the Focus Funding column, each with the statuses it matches.'
        ),
    position_stages: z
        .array(bandStage)
        .optional()
        .describe(
            'The stages stacked inside the Focus Job applications column, each with the statuses it matches.'
        ),
    teaching_stages: z
        .array(bandStage)
        .optional()
        .describe(
            'The stages stacked inside the Focus Teaching & supervision column, each with the statuses it matches.'
        ),
    focus_lane_tones: textMap
        .optional()
        .describe(
            'The hue name of the bar of each collection lane of the Focus board: funding, jobs and teaching.'
        ),
    ticker_categories: z
        .record(z.string(), tickerWord)
        .optional()
        .describe(
            "The command center's deadline categories, in the order it groups its dated lines, each with the words it is drawn with; a `collections:` entry's `ticker:` names one."
        ),
    facet_tones: textMap
        .optional()
        .describe(
            "The hue name of each filter group of a project board's bar, by the group: its heading in the More list, and the dot, the fill and the Venue bar of a value with no colour of its own."
        ),
    tiers: z
        .record(z.string(), tierWord)
        .optional()
        .describe(
            "The kinds of project a manifest's `tier` names, each with its words; the one carrying `default` is the tier of a new project whose write names none."
        ),
    research_audit: researchAudit
        .optional()
        .describe("The tiers the audit's research rules and the Orphans card leave alone."),
    roles: z
        .array(roleRow)
        .optional()
        .describe(
            "The user's roles on a project or a collection entry, highest first, each read from a field of the record."
        ),
    categories: z
        .array(categoryRow)
        .optional()
        .describe(
            'The categories a project is filed under on every board: the first row whose blocks it meets.'
        ),
    rail_color: text
        .regex(HEX_COLOUR)
        .optional()
        .describe(
            "The colour a project board's rail count is drawn in, written #rrggbb; a hub's value replaces oculus's."
        ),
    leads_fit: textMap.optional().describe("The colour of a Position Lead's fit chip, by its fit."),
    data_access: textMap
        .optional()
        .describe("The colour of a dataset's access chip, by its access word."),
    venue_categories: z
        .array(
            z.strictObject({
                key: text
                    .min(1)
                    .describe("The word a venue's `category` writes, which files it in the row."),
                label: text.describe(
                    "The words the row's section of the Venues view is headed by."
                ),
                ribbon: flag(
                    "true draws the month ribbon of the venues' deadlines and meetings over the row's section."
                )
            })
        )
        .optional()
        .describe(
            "The categories a venue's `category` takes, in the order the Venues view draws their sections and the venue form offers them."
        ),
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
