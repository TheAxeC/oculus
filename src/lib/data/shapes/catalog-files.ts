// Layer 1, data. The whole-file shapes of oculus's own catalogs, config/catalogs/*.yml, and of the
// text files, config/text/**: one zod object for each file, whose keys are the file's top-level
// keys. The JSON Schema of the file in the editor is `z.toJSONSchema` of the same object, and
// loadConfig parses each file's content with it, so every issue of the shape is a finding on the
// config channel (data/shapes/shape-issues.ts). The readers that take rows of a
// catalog build their row shapes from the shapes here (the glyph stand-in, the LaTeX rows), so a
// row the editor marks is a row the reader leaves out, for the same reason.
//
// A shape is strict: a key the file's reader does not name is refused. Each key is optional, since
// a reader takes a key that is missing as empty and the merged config may hold a file without it.

import { z } from 'zod';
import { AGENT_FLAGS, AGENTS, CONTROLS, FORMS, HEADINGS, SOURCES } from './catalog-words.ts';

/** A text. */
const text = z.string();

/** A map from a word to a text. */
const textMap = z.record(z.string(), text);

/** A colour written as a hex string, or any other text a stylesheet takes. */
const colour = text;

/** One row of a keyed list: its `key` and the words it is drawn with. */
const keyed = z.strictObject({
    key: text,
    label: text.optional(),
    icon: text.optional(),
    color: colour.optional(),
    glyph: text.optional(),
    sub: text.optional(),
    cluster: text.optional(),
    flames: z.number().optional(),
    assignable: z.boolean().optional()
});

/**
 * A flag of a vocabulary word, true where the word carries it and absent where it does not, with
 * the help sentence the editor shows for it on hover and in the suggest list.
 */
const flag = (help: string) => z.boolean().optional().describe(help);

/**
 * One word of `statuses`: its words, glyph and colour, and the flags the code reads. Each help
 * sentence says how the code compares a word with the flag's words: `wordFlag` trims a record's
 * status and puts it in lower case, `anyWord` compares a project's chips as written.
 */
const statusWord = z.strictObject({
    label: text.optional(),
    icon: text.optional(),
    color: colour.optional(),
    chip: flag(
        "A status chip a manifest's `status.chips` picks from (the status legend), offered by the project form in this order."
    ),
    terminal: flag(
        "The status ends a collection entry's deadline on the deadline radar; the status is compared trimmed and in lower case."
    ),
    deadline_met: flag(
        "The status ends a project's own deadline (a terminal chip alone does not); compared trimmed and in lower case."
    ),
    live_subtasks: flag(
        'A terminal entry whose subtasks still show on the radar; compared trimmed and in lower case.'
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
    color: colour.optional(),
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

/** One word of a map that is drawn with an icon, a label and a colour. */
const drawn = z.strictObject({
    icon: text.optional(),
    label: text.optional(),
    color: colour.optional()
});

/**
 * One status of the career card's host pipeline: drawn, whether it is outreach in flight, whether
 * the awaiting-a-response box lists it, and whether a host row with no status is at it.
 */
const hostStatus = drawn.extend({
    in_flight: flag('Outreach in flight.'),
    waiting: flag("A status the career card's awaiting-a-response box lists."),
    default: flag('The status a host row with no `status:` is at.')
});

/** One stage of the funding pipeline. */
const fundStage = z.strictObject({
    label: text,
    color: colour.optional(),
    statuses: z.array(text).optional()
});

/** One column the career board scores a host by. */
const scoreDim = z.strictObject({ field: text, badge: text.optional(), label: text.optional() });

/** The lists of words the audit's lifecycle guardrails read. */
const lifecycle = z.strictObject({
    live_chips: z.array(text).optional(),
    author_chips: z.array(text).optional(),
    contradictory_chips: z.array(z.array(text)).optional()
});

/**
 * config/catalogs/vocab.yml: the controlled vocabularies the boards and the schemas draw from. The
 * career and lead keys are a hub's own, set in its `.oculus/config.yml` and checked here.
 */
const vocabFileShape = z.strictObject({
    palette: textMap.optional(),
    types: z.record(z.string(), typeWord).optional(),
    statuses: z.record(z.string(), statusWord).optional(),
    focus_lanes: z.array(keyed).optional(),
    holding_color: colour.optional(),
    priority_levels: z.array(keyed).optional(),
    fund_stages: z.array(fundStage).optional(),
    focus_lane_tones: textMap.optional(),
    career_host_status: z.record(z.string(), hostStatus).optional(),
    career_score_dims: z.array(scoreDim).optional(),
    career_score_tones: textMap.optional(),
    archive_order: z.array(text).optional(),
    tiers: z.record(z.string(), tierWord).optional(),
    publication_kinds: z.array(publicationKind).optional(),
    leads_fit: textMap.optional(),
    lifecycle: lifecycle.optional(),
    data_access: textMap.optional(),
    venue_categories: z.array(text).optional(),
    venue_tiers: z.array(keyed).optional(),
    radar_buckets: z.array(keyed).optional()
});

/** The top-level keys of vocab.yml. */
export const VOCAB_FILE_KEYS: readonly string[] = Object.keys(vocabFileShape.shape);

/**
 * A glyph's stand-in: one to three printable ASCII characters, which a terminal font is sure to
 * hold and the three-character box of ui/display/Glyph.svelte is sure to fit.
 */
export const standInShape = z.string().regex(/^[\x20-\x7E]{1,3}$/);

/** config/catalogs/glyphs.yml: each glyph name with the stand-in a terminal theme draws for it. */
const glyphsFileShape = z.strictObject({
    glyphs: z.record(z.string(), standInShape).optional()
});

/** config/catalogs/icons.yml: each glyph name with the icon the package draws for it. */
const iconsFileShape = z.strictObject({ icons: z.record(z.string(), text).optional() });

/** config/catalogs/meta.yml: the title and subtitle oculus names itself with. */
const metaFileShape = z.strictObject({
    meta: z.strictObject({ title: text.optional(), subtitle: text.optional() }).optional()
});

/** config/catalogs/file-nesting.yml: the children that nest under each parent pattern. */
const nestingFileShape = z.strictObject({
    patterns: z.record(z.string(), z.array(text)).optional()
});

/** One value a picker of agents.yml offers. */
const agentValue = z.strictObject({
    id: text,
    label: text.optional(),
    pass: text.optional(),
    confirm: z.boolean().optional()
});

/** One picker of an agent: its flag, its default and its values. */
const agentList = z.strictObject({
    label: text.optional(),
    flag: z.enum([...AGENT_FLAGS.claude, ...AGENT_FLAGS.codex]).optional(),
    default: text.optional(),
    cache: text.optional(),
    values: z.array(agentValue).optional()
});

/** One agent of agents.yml: its label and its pickers. */
const agentEntry = z.strictObject({
    label: text.optional(),
    lists: z.record(z.string(), agentList).optional()
});

/** config/catalogs/agents.yml: the composer's pickers, per agent. */
const agentsFileShape = z.strictObject({ agents: z.record(z.enum(AGENTS), agentEntry).optional() });

/**
 * The keys agents.yml may hold at each level, taken from the shapes above: the file, one agent, one
 * picker and one value of a picker. The reader of the file's text (catalog/agents.ts) names a key
 * outside them, with its line.
 */
export const AGENT_FILE_KEYS = {
    top: Object.keys(agentsFileShape.shape),
    agent: Object.keys(agentEntry.shape),
    list: Object.keys(agentList.shape),
    value: Object.keys(agentValue.shape)
};

/** One `@` suggestion of latex.yml: what is typed after the `@`, the snippet it inserts. */
export const latexAtRow = z.strictObject({
    prefix: text.min(1),
    body: text.min(1),
    description: text.optional()
});

/** One environment `\envname` completes, with the arguments it takes after `\begin{name}`. */
export const latexEnvironmentRow = z.strictObject({
    name: text.regex(/^[A-Za-z]+\*?$/),
    arguments: text.optional()
});

/** One math symbol: its name, the TeX it is drawn from, the snippet it inserts. */
export const latexSymbolRow = z.strictObject({
    name: text.min(1),
    source: text.min(1),
    insert: text.min(1),
    keywords: text.optional()
});

/** One group of math symbols. */
const latexSymbolGroup = z.strictObject({ name: text.min(1), items: z.array(latexSymbolRow) });

/** The chords of a kind: the key (one character) and the name of the command it wraps in. */
const latexChords = z.record(z.string().regex(/^[A-Za-z0-9-]$/), text.regex(/^[A-Za-z]+$/));

/** config/catalogs/latex.yml: the editing tables of the LaTeX editor. */
const latexFileShape = z.strictObject({
    latex_editing: z
        .strictObject({
            notice: text.optional(),
            at: z.array(latexAtRow).optional(),
            environments: z.array(latexEnvironmentRow).optional(),
            chords: z
                .strictObject({ text: latexChords.optional(), math: latexChords.optional() })
                .optional(),
            symbols: z.array(latexSymbolGroup).optional()
        })
        .optional()
});

/** One Unicode math symbol: the command without its backslash, its glyph line and its words. */
export const latexUnimathRow = z.strictObject({
    command: text.regex(/^[A-Za-z]+$/),
    detail: text.min(1),
    documentation: text
});

/** config/catalogs/unimath.yml: the Unicode math symbols of the LaTeX completion. */
const unimathFileShape = z.strictObject({ latex_unimath: z.array(latexUnimathRow).optional() });

/** The words one control or field of the options catalog may carry. */
const optionWords = {
    help: text,
    control: z.enum(CONTROLS).optional(),
    options: z.array(text).optional(),
    from: z
        .union([
            z.enum(SOURCES),
            z.array(z.enum(SOURCES)),
            z.strictObject({ field: text, sources: z.record(z.string(), z.enum(SOURCES)) })
        ])
        .optional(),
    empty: z.union([z.literal(true), text]).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    whole: z.literal(true).optional(),
    form: z.enum(FORMS).optional(),
    slots: z.array(text).optional(),
    items: z.literal('number').optional(),
    joined: z.boolean().optional(),
    allow_missing: z.union([z.boolean(), text]).optional()
};

/** One field of a family: a help line alone, or the words of a control. */
type OptionField = string | Record<string, unknown>;

const optionField: z.ZodType<OptionField> = z.lazy(() =>
    z.union([
        text,
        z.strictObject({ ...optionWords, fields: z.record(z.string(), optionField).optional() })
    ])
);

/** One option of a config file, or one family of it. */
const optionEntry = z.strictObject({
    ...optionWords,
    fields: z.record(z.string(), optionField).optional(),
    default: z.unknown().optional(),
    heading: z.enum(HEADINGS).optional(),
    section: text.optional(),
    holds: z.literal('lists').optional()
});

/** config/catalogs/options.yml: every option of every config file, by file and dotted path. */
const optionsFileShape = z.strictObject({
    options: z.record(z.string(), z.record(z.string(), optionEntry)).optional()
});

/** A leaf of a text file: a text, or a number or a flag written out. */
const textLeaf = z.union([z.string(), z.number(), z.boolean()]);

/** A node of a text file: a leaf, or a map of nodes. */
type TextNode = string | number | boolean | { [key: string]: TextNode };

const textNode: z.ZodType<TextNode> = z.lazy(() =>
    z.union([textLeaf, z.record(z.string(), textNode)])
);

/** A fragment of config/text/**: the one key `text`, a nested map ending in texts. */
export const textFileShape = z.strictObject({ text: z.record(z.string(), textNode) });

/** Whether a dotted key of a file is one its own reader already words when it refuses it. */
type Owned = (key: string) => boolean;

/** The keys at or under any of these paths. */
function under(...paths: string[]): Owned {
    return (key) => paths.some((path) => key === path || key.startsWith(`${path}.`));
}

/**
 * The keys of options.yml that readSpec (data/sources/config/catalog/options.ts) words itself: a
 * control, a source, a form, a heading, a `whole`, a list of slots or a help line it refuses.
 */
const readSpecWords: Owned = (key) =>
    /(^|\.)(control|from|form|heading|whole|slots|help)(\.|$)/.test(key);

/**
 * The keys of agents.yml that parseAgents (data/sources/config/catalog/agents.ts) words itself:
 * every key but an agent's and a picker's `label` and a value's `pass`, which it reads as they are.
 */
const agentsWords: Owned = (key) =>
    !/^agents\.[^.]+(\.lists\.[^.]+)?\.label$|^agents\.[^.]+\.lists\.[^.]+\.values\.\d+\.pass$/.test(
        key
    );

/**
 * A catalog file of the config folder with the shape its content is read through, and the keys
 * its own reader already words when it drops them (`owned`), so the shape's issue about the same
 * row is not a second finding.
 */
export type CatalogFile = { name: string; file: string; shape: z.ZodType; owned: Owned };

/** The catalog files that have a whole-file shape, each named by the file under config/. */
export const CATALOG_FILES: readonly CatalogFile[] = [
    { name: 'catalogs/vocab', file: 'catalogs/vocab.yml', shape: vocabFileShape, owned: under() },
    {
        name: 'catalogs/glyphs',
        file: 'catalogs/glyphs.yml',
        shape: glyphsFileShape,
        owned: under('glyphs')
    },
    { name: 'catalogs/icons', file: 'catalogs/icons.yml', shape: iconsFileShape, owned: under() },
    {
        name: 'catalogs/agents',
        file: 'catalogs/agents.yml',
        shape: agentsFileShape,
        owned: agentsWords
    },
    {
        name: 'catalogs/file-nesting',
        file: 'catalogs/file-nesting.yml',
        shape: nestingFileShape,
        owned: under('patterns')
    },
    {
        name: 'catalogs/latex',
        file: 'catalogs/latex.yml',
        shape: latexFileShape,
        owned: under(
            'latex_editing.at',
            'latex_editing.environments',
            'latex_editing.chords',
            'latex_editing.symbols'
        )
    },
    { name: 'catalogs/meta', file: 'catalogs/meta.yml', shape: metaFileShape, owned: under() },
    {
        name: 'catalogs/unimath',
        file: 'catalogs/unimath.yml',
        shape: unimathFileShape,
        owned: under()
    },
    {
        name: 'catalogs/options',
        file: 'catalogs/options.yml',
        shape: optionsFileShape,
        owned: readSpecWords
    }
];

/** The widgets the project edit form draws a field with. */
const MANIFEST_WIDGETS = [
    'readonly',
    'text',
    'textarea',
    'lines',
    'select',
    'chips',
    'tags',
    'date',
    'checkbox',
    'keymap'
] as const;

/** One field of the project edit form: its label, widget, section, help line and choices. */
const manifestField = z.strictObject({
    label: text.optional(),
    type: z.enum(MANIFEST_WIDGETS),
    section: text.optional(),
    help: text.optional(),
    from: z.union([text, z.array(text)]).optional(),
    options: z.array(text).optional(),
    required: z.literal(true).optional()
});

/** config/schemas/manifest-schema.yml: the project edit form as data. */
export const manifestSchemaFileShape = z.strictObject({
    manifest_schema: z
        .strictObject({
            sections: z.record(z.string(), text).optional(),
            fields: z.record(z.string(), manifestField).optional()
        })
        .optional()
});

/** The shape a file of the config folder is read through, by its name relative to config/. */
export function fileShapeOf(name: string): { shape: z.ZodType; owned: Owned } | undefined {
    const norm = name.replaceAll('\\', '/');
    if (norm.startsWith('text/')) return { shape: textFileShape, owned: under('text') };
    const catalog = CATALOG_FILES.find((one) => one.file === norm);
    return catalog === undefined ? undefined : { shape: catalog.shape, owned: catalog.owned };
}
