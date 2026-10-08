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

/** One word of a status map: its colour and the flags the board reads. */
const statusWord = z.strictObject({
    color: colour.optional(),
    deadline_met: z.boolean().optional(),
    terminal: z.boolean().optional(),
    live_subtasks: z.boolean().optional()
});

/** One word of a map that is drawn with an icon, a label and a colour. */
const drawn = z.strictObject({
    icon: text.optional(),
    label: text.optional(),
    color: colour.optional()
});

/** A research domain: its colour and label. */
const domain = z.strictObject({ color: colour.optional(), label: text.optional() });

/** One stage of the funding pipeline. */
const fundStage = z.strictObject({
    label: text,
    color: colour.optional(),
    statuses: z.array(text).optional()
});

/** One column the career board scores a host by. */
const scoreDim = z.strictObject({ field: text, badge: text.optional(), label: text.optional() });

/** The lists of words the archive board's lifecycle is drawn from. */
const lifecycle = z.strictObject({
    archive_outcomes: z.array(text).optional(),
    live_chips: z.array(text).optional(),
    terminal_types: z.array(text).optional(),
    author_chips: z.array(text).optional(),
    contradictory_chips: z.array(z.array(text)).optional()
});

/** config/catalogs/vocab.yml: the controlled vocabularies the boards and the schemas draw from. */
const vocabFileShape = z.strictObject({
    palette: textMap.optional(),
    domains: z.record(z.string(), domain).optional(),
    type_color: textMap.optional(),
    type_order: z.array(text).optional(),
    status_legend: z.array(keyed).optional(),
    status_palette: z.record(z.string(), statusWord).optional(),
    focus_lanes: z.array(keyed).optional(),
    holding_color: colour.optional(),
    priority_levels: z.array(keyed).optional(),
    fund_stages: z.array(fundStage).optional(),
    focus_lane_tones: textMap.optional(),
    career_host_status: z.record(z.string(), drawn).optional(),
    side_project_status: z.record(z.string(), drawn).optional(),
    career_score_dims: z.array(scoreDim).optional(),
    archive_categories: z.array(text).optional(),
    archive_dead: z.array(text).optional(),
    leads_fit: textMap.optional(),
    lifecycle: lifecycle.optional(),
    arch_color: textMap.optional(),
    data_access: textMap.optional(),
    venue_categories: z.array(text).optional(),
    venue_tiers: z.array(keyed).optional(),
    venue_themes: z.array(keyed).optional(),
    data_themes: z.array(keyed).optional(),
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
    options: z.array(text).optional()
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
