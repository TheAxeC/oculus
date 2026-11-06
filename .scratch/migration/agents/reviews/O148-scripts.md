# O148, the builder's file-changing commands, quoted whole

Each command the build after the cases ruling ran that changed a file, as `agents/reviews/O148-report.md`'s section "Scripts that changed files, every command" lists it, quoted whole from its row of the builder's transcript (`agent-ad2be83c04b20cac7.jsonl`, rows counted from 0), in row order, with its length. The orchestrator copied them here at O148's landing, under plan.md's ruling "Unapproved builder scripts".

## Row 458 (668 characters in the report's table, 668 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && perl -0pi -e 's/\/\*\*\n \* A project\. Every field comes from the manifest key of the same meaning, and nothing else does\.\n \*\/\nfunction project\(/\/**\n * A project. Every field comes from the manifest key of the same meaning, and nothing else does.\n * The snapshot build'"'"'s deck read (data\/index.ts `deckProjects`) reads a project'"'"'s facts from it too.\n *\/\nexport function manifestProject(/; s/        project\(manifest, raw\.docs/        manifestProject(manifest, raw.docs/' src/lib/data/snapshot/normalise.ts && grep -n "manifestProject" -B3 src/lib/data/snapshot/normalise.ts
````

## Row 462 (1352 characters in the report's table, 1352 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/sources/deck/kinds.ts'
s=open(p).read()
s=s.replace("""import { projectSlide, type Figures } from './project.ts';""","""import type { ProjectFact } from '../../shapes/project-facts.ts';
import { projectSlide, type Figures } from './project.ts';""")
s=s.replace("""/** What the reader knows of the project a deck belongs to. */
export type DeckProject = {""","""/**
 * What the reader knows of the project a deck belongs to: where it is, what it is called, the words
 * a `find:` keeps its deck by, and its facts, which its slides' strip draws and its
 * `{{project.<field>}}` placeholders are filled from.
 */
export type DeckProject = {""")
s=s.replace("""    form?: string;
    domain?: string;
};""","""    form?: string;
    /**
     * The manifest's `domain`: the internal id on the deck route's read, which the slide carries for
     * the client's hue and title, and the key on the snapshot build's; the reader checks its key
     * against the domains registry.
     */
    domain?: string;
    /** The project's facts, each field that holds a value (data/shapes/project-facts.ts). */
    facts: ProjectFact[];
};""")
open(p,'w').write(s)
EOF
grep -n "project.domain\|project\.stage\|DeckProject" src/lib/data/sources/deck/*.ts | head -20
````

## Row 492 (9079 characters in the report's table, 9079 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/sources/deck/read.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""// what a filter can pick and how many decks it keeps.
""","""// what a filter can pick and how many decks it keeps.
//
// A slide built from a project's deck carries that project's key (`project`): a slide of a member
// deck its member's, a slide of the deck's own files and a summary or a grid it places the deck's
// own, and a slide of a deck that is no project's none. The answer carries the facts of each
// project its slides name (`projects`), which the strip at the foot of those slides draws. A
// slide's `{{project.<field>}}` is filled from the same facts after its counts are: the words of
// the field, a list's joined with ", ", written so the slide draws them as they are. A field with
// no value is filled with nothing, and a name that is no field, or a placeholder in a deck that is
// no project's, is left as written; each is a Finding on the slide's file at its line.
""")
rep("""import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
""","""import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import { keyOf } from '../../helpers/hub-names.ts';
import { isFactField, type ProjectFact } from '../../shapes/project-facts.ts';
""")
rep("""    /** The keys of the hub's domains registry, which a project's `domain:` is checked against. */""",
"""    /**
     * The keys of the hub's domains registry, which the key of a project's `domain:` is checked
     * against.
     */""")
rep("""    return value;
}

/** A reader over one hub. */""","""    return value;
}

const PROJECT = /\\{\\{\\s*project\\.([\\w-]+)\\s*\\}\\}/g;

/**
 * The parts of Markdown whose characters are drawn as written, which a filled value is put in
 * unescaped: a fenced code block, an inline code span and a formula in the four delimiters the
 * page typesets (views/academic/present/markup.ts).
 */
const LITERAL =
    /(?:^|\\n)(```|~~~)[^\\n]*\\n[\\s\\S]*?(?:\\n\\1[^\\n]*(?=\\n|$)|$)|`[^`\\n]*`|\\$\\$[\\s\\S]+?\\$\\$|\\\\\\[[\\s\\S]+?\\\\\\]|\\\\\\([\\s\\S]+?\\\\\\)|(?<!\\\\)\\$(?!\\s)[^$\\n]+?(?<!\\s)\\$/g;

/** The characters Markdown, HTML or the page's formulas read as markup. */
const MARKUP = /[\\\\`*_[\\]<>&~|$#!]/g;

/** Words written so Markdown draws them as they are: each markup character backslash-escaped. */
export function escapeMarkdown(words: string): string {
    return words.replace(MARKUP, (char) => `\\\\${char}`);
}

/**
 * A Markdown text with each `{{project.<field>}}` replaced by what `fill` gives, escaped outside
 * the literal parts and as it is inside them; a placeholder `fill` answers null for is left.
 */
function filledMarkdown(text: string, fill: (field: string) => string | null): string {
    const replaced = (part: string, literal: boolean): string =>
        part.replace(PROJECT, (whole, field: string) => {
            const words = fill(field);
            if (words === null) return whole;
            return literal ? words : escapeMarkdown(words);
        });
    let out = '';
    let from = 0;
    for (const match of text.matchAll(LITERAL)) {
        out += replaced(text.slice(from, match.index), false) + replaced(match[0], true);
        from = match.index + match[0].length;
    }
    return out + replaced(text.slice(from), false);
}

/**
 * The words of a slide's front matter or body with each `{{project.<field>}}` filled. The front
 * matter's `notes` are drawn as plain text, so they take the words unescaped.
 */
function filledProject(value: unknown, fill: (field: string) => string | null, key = ''): unknown {
    if (typeof value === 'string') {
        return key === 'notes'
            ? value.replace(PROJECT, (whole, field: string) => fill(field) ?? whole)
            : filledMarkdown(value, fill);
    }
    if (Array.isArray(value)) return value.map((one) => filledProject(one, fill, key));
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([name, one]) => [
                name,
                filledProject(one, fill, key === '' ? name : key)
            ])
        );
    }
    return value;
}

/** A reader over one hub. */""")
rep("""        if (project.domain !== undefined && !context.domains.includes(project.domain)) {
            raiseFor(project.file)(
                'domain',
                'findings.deck.domain_unknown',
                project.id,
                project.domain
            );""","""        if (project.domain !== undefined && !context.domains.includes(keyOf(project.domain))) {
            raiseFor(project.file)(
                'domain',
                'findings.deck.domain_unknown',
                project.id,
                keyOf(project.domain)
            );""")
rep("""        for (const [number, slide] of (raw ?? []).entries()) {
            const key = `${entry.file}#${number}`;
            const meta =
                slide.meta === null ? null : (counted(slide.meta, fill) as Record<string, unknown>);
            const filled: RawSlide = {
                meta,
                body: counted(slide.body, fill) as string
            };""","""        const project = doc.project;
        for (const [number, slide] of (raw ?? []).entries()) {
            const key = `${entry.file}#${number}`;
            const line = firstLines.get('path' in from ? from.path : '')?.[number] ?? 1;
            const raiseHere = 'path' in from ? raiseAt(from.path, line) : raise;
            const words = (field: string): string | null => {
                const whole = `{{project.${field}}}`;
                if (project === null) {
                    raiseHere('project', 'findings.deck.project_none', whole);
                    return null;
                }
                if (!isFactField(field)) {
                    raiseHere('project', 'findings.deck.project_field_unknown', whole);
                    return null;
                }
                const fact = project.facts.find((one) => one.field === field);
                if (fact === undefined) {
                    raiseHere('project', 'findings.deck.project_field_empty', whole, project.id);
                    return '';
                }
                return fact.words.join(', ');
            };
            const meta =
                slide.meta === null
                    ? null
                    : (filledProject(counted(slide.meta, fill), words) as Record<string, unknown>);
            const filled: RawSlide = {
                meta,
                body: filledProject(counted(slide.body, fill), words) as string
            };""")
rep("""            const built = buildSlide(filled, number, kind);
            if (built === null) continue;
            const line = firstLines.get('path' in from ? from.path : '')?.[number] ?? 1;
            if (under !== null) {""","""            const built = buildSlide(filled, number, kind);
            if (built === null) continue;
            if (project !== null) built.slide.project = project.id;
            if (under !== null) {""")
rep("""        const title = entry.title.replace(/<[^>]*>/g, '');
        const members = drawnOf(found);""","""        const title = entry.title.replace(/<[^>]*>/g, '');
        const owner = doc.project === null ? {} : { project: doc.project.id };
        const members = drawnOf(found);""")
rep("""            return {
                key,
                source,
                kind: 'grid',""","""            return {
                key,
                source,
                ...owner,
                kind: 'grid',""")
rep("""        return {
            key,
            source,
            kind: 'summary',""","""        return {
            key,
            source,
            ...owner,
            kind: 'summary',""")
rep("""            keys: null,
            findings: [...raised]
        };
    }
""","""            keys: null,
            projects: {},
            findings: [...raised]
        };
    }

    /** The facts of each project the slides name, by the project's key. */
    function factsOf(slides: DeckSlide[]): Record<string, ProjectFact[]> {
        const facts: Record<string, ProjectFact[]> = {};
        for (const one of slides) {
            if (one.project === undefined || Object.hasOwn(facts, one.project)) continue;
            const project = context.projects.find((held) => held.id === one.project);
            if (project !== undefined) facts[one.project] = project.facts;
        }
        return facts;
    }
""")
rep("""            keys: doc.spec?.keys ?? null,
            findings: [...raised]""","""            keys: doc.spec?.keys ?? null,
            projects: factsOf(slides),
            findings: [...raised]""")
open(p,'w').write(s)
EOF
grep -n "LITERAL =" -A2 src/lib/data/sources/deck/read.ts; grep -n "const MARKUP\|=> \`" src/lib/data/sources/deck/read.ts | head
````

## Row 496 (229 characters in the report's table, 229 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && sed -i '' 's/^export function escapeMarkdown/function escapeMarkdown/' src/lib/data/sources/deck/read.ts && sed -n 96,112p src/lib/data/sources/deck/kinds.ts
````

## Row 500 (1314 characters in the report's table, 1314 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/sources/deck/kinds.ts'
s=open(p).read()
a="""/** A heading's words turned into the plain words the overview names the slide with. */
function plain(text: string): string {
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/[`*_#]/g, '')
        .replace(/\\s+/g, ' ')
        .trim();
}"""
b="""/** A markup character written backslash-escaped, as a filled `{{project.<field>}}` writes it. */
const ESCAPED = /\\\\([\\\\`*_[\\]<>&~|$#!])/;

/**
 * A heading's words turned into the plain words the overview names the slide with: tags and the
 * marks of emphasis and code dropped, and an escaped markup character kept as the character.
 */
function plain(text: string): string {
    return text
        .split(ESCAPED)
        .map((part, at) =>
            at % 2 === 1
                ? part
                : part
                      .replace(/<[^>]*>/g, ' ')
                      .replace(/&amp;/g, '&')
                      .replace(/[`*_#]/g, '')
        )
        .join('')
        .replace(/\\s+/g, ' ')
        .trim();
}"""
assert s.count(a)==1
s=s.replace(a,b)
open(p,'w').write(s)
EOF
grep -n "const ESCAPED" src/lib/data/sources/deck/kinds.ts
````

## Row 507 (3048 characters in the report's table, 3048 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && grep -n "DECK_GAP" src/lib/data/model/index.ts; python3 - <<'EOF'
p='src/lib/data/model/model-deck.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""    notes?: string;
    /** Absent for a slide the deck does not read from a file. */
    source?: DeckSlideSource;
};""","""    notes?: string;
    /** Absent for a slide the deck does not read from a file. */
    source?: DeckSlideSource;
    /**
     * The key of the project whose deck's file holds the slide, or whose deck places the summary or
     * the grid; absent for a slide of a deck that is no project's. The strip at the slide's foot
     * draws that project's facts (`Deck.projects`).
     */
    project?: string;
};

/** The fields of a project's facts, in the order the strip at a slide's foot draws them. */
export const FACT_FIELDS = [
    'form',
    'stage',
    'chips',
    'domain',
    'pillars',
    'datasets',
    'lead',
    'supervisors',
    'collaborators',
    'year',
    'venue',
    'funding',
    'compute',
    'code',
    'reproduced',
    'tier'
] as const;

/** One field of a project's facts, which `{{project.<field>}}` names too. */
export type FactField = (typeof FACT_FIELDS)[number];

/**
 * One field of a project that holds a value: its words, in the manifest's order. The form, the
 * stage and the chips also carry their words of the vocabulary and the domain its id, which the
 * strip draws their hue by, and compute the kind of each resource, which its glyph is read by:
 * `keys` holds one entry per word, for those five fields alone.
 */
export type ProjectFact = { field: FactField; words: string[]; keys?: string[] };""")
rep("""/**
 * One slide of a deck as the view draws it. Words are Markdown, with the group counts in them
 * already replaced. A `legend` is the domain keys of the group the slide names.
 */""","""/**
 * One slide of a deck as the view draws it. Words are Markdown, with the group counts and the
 * `{{project.<field>}}` placeholders in them already replaced. A `legend` is the domains of the
 * group the slide names.
 */""")
rep("""    /** The keys the Overview sets, as the file holds them; null for a file that was not read. */
    keys: DeckKeys | null;
    findings: Finding[];
};""","""    /** The keys the Overview sets, as the file holds them; null for a file that was not read. */
    keys: DeckKeys | null;
    /** The facts of each project a slide names (`project`), by the project's key. */
    projects: Record<string, ProjectFact[]>;
    findings: Finding[];
};""")
open(p,'w').write(s)
p='src/lib/data/model/index.ts'
s=open(p).read()
rep("""    DeckSummaryRow,
    PresentEli5,""","""    DeckSummaryRow,
    FactField,
    PresentEli5,""")
rep("""    PresentTag,
    SlideKind
} from './model-deck.ts';""","""    PresentTag,
    ProjectFact,
    SlideKind
} from './model-deck.ts';""")
open(p,'w').write(s)
EOF
grep -n "DECK_GAP\|model-deck" src/lib/data/model/index.ts
````

## Row 515 (1453 characters in the report's table, 1453 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && sed -i '' 's/^export { DECK_GAP } from .\/model-deck.ts.;/export { DECK_GAP, FACT_FIELDS } from ".\/model-deck.ts";/' src/lib/data/model/index.ts && sed -i '' "s|^export { DECK_GAP, FACT_FIELDS } from \"./model-deck.ts\";|export { DECK_GAP, FACT_FIELDS } from './model-deck.ts';|" src/lib/data/model/index.ts && grep -n "FACT_FIELDS" src/lib/data/model/index.ts && python3 - <<'EOF'
p='src/lib/data/shapes/project-facts.ts'
s=open(p).read()
start=s.index("/** The fields of a project's facts, in the order the strip draws them. */")
end=s.index("/** The registries whose records a project's facts name. */")
s=s[:start]+s[end:]
s=s.replace("""import type { Project } from '../model/index.ts';""","""import {
    FACT_FIELDS,
    type FactField,
    type Project,
    type ProjectFact
} from '../model/index.ts';""")
s=s.replace("""                : [{ word: reproduced.date || text('board.repro_yes'), key: '' }],""","""                : [
                      {
                          word:
                              reproduced.date === undefined || reproduced.date === ''
                                  ? text('board.repro_yes')
                                  : reproduced.date,
                          key: ''
                      }
                  ],""")
open(p,'w').write(s)
EOF
grep -n "^export\|^import\|^const\|^type" src/lib/data/shapes/project-facts.ts
````

## Row 519 (1375 characters in the report's table, 1375 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/model/index.ts'
s=open(p).read()
a="export { DECK_GAP } from './model-deck.ts';"
assert s.count(a)==1
s=s.replace(a,"export { DECK_GAP, FACT_FIELDS } from './model-deck.ts';")
open(p,'w').write(s)
p='src/lib/data/shapes/project-facts.ts'
s=open(p).read()
start=s.index("/** The fields of a project's facts, in the order the strip draws them. */")
end=s.index("/** The registries whose records a project's facts name. */")
s=s[:start]+s[end:]
s=s.replace("""import type { Project } from '../model/index.ts';""","""import {
    FACT_FIELDS,
    type FactField,
    type Project,
    type ProjectFact
} from '../model/index.ts';""")
a="""                : [{ word: reproduced.date || text('board.repro_yes'), key: '' }],"""
assert s.count(a)==1
s=s.replace(a,"""                : [
                      {
                          word:
                              reproduced.date === undefined || reproduced.date === ''
                                  ? text('board.repro_yes')
                                  : reproduced.date,
                          key: ''
                      }
                  ],""")
open(p,'w').write(s)
EOF
grep -n "^export\|^import\|^const\|^type" src/lib/data/shapes/project-facts.ts; grep -n FACT_FIELDS src/lib/data/model/index.ts
````

## Row 525 (1303 characters in the report's table, 1303 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
import re
p='src/lib/data/sources/deck/read.ts'
s=open(p).read()
s=s.replace("import { isFactField, type ProjectFact } from '../../shapes/project-facts.ts';","import { isFactField } from '../../shapes/project-facts.ts';")
s=s.replace("""    Finding
} from '../../model/index.ts';""","""    Finding,
    ProjectFact
} from '../../model/index.ts';""",1)
open(p,'w').write(s)
p='src/lib/data/sources/deck/kinds.ts'
s=open(p).read()
s=s.replace("import type { ProjectFact } from '../../shapes/project-facts.ts';\n","")
s=s.replace("""    type PresentSlide,
    type SlideKind
} from '../../model/index.ts';""","""    type PresentSlide,
    type ProjectFact,
    type SlideKind
} from '../../model/index.ts';""")
open(p,'w').write(s)
p='src/lib/data/shapes/project-facts.ts'
s=open(p).read()
k="""/** The fields whose facts carry their keys, for a hue or a glyph. */
const KEYED: ReadonlySet<FactField> = new Set(['form', 'stage', 'chips', 'domain', 'compute']);

"""
s=s.replace(k,"")
s=s.replace("/** One word with the key it is drawn by. */", k+"/** One word with the key it is drawn by. */")
open(p,'w').write(s)
EOF
grep -n "ProjectFact" src/lib/data/sources/deck/kinds.ts src/lib/data/sources/deck/read.ts | head
````

## Row 529 (4260 characters in the report's table, 4260 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/server/content/deck/read.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""// The roots are the folders of the open workspace""","""// Each project the reader holds carries its facts, which the strip at the foot of its deck's slides
// draws and its `{{project.<field>}}` placeholders are filled from. They are worked out here from
// the project's ids in the snapshot, the snapshot's records and the words of the hub the deck is
// read under (data/shapes/project-facts.ts), so a deck of a second hub draws that hub's words.
//
// The roots are the folders of the open workspace""")
rep("""import { hubDomainsOf } from '../../../data/index.ts';
import { frameSetting } from '../../../data/sources/config.ts';
import type { DeckProject } from '../../../data/sources/deck/kinds.ts';
import type { Deck, PortfolioConfig, Project } from '../../../data/model/index.ts';
import { bareId, ofHub } from '../../../data/helpers/hub-names.ts';""","""import { hubDomainsOf } from '../../../data/index.ts';
import { frameSetting } from '../../../data/sources/config.ts';
import type { DeckProject } from '../../../data/sources/deck/kinds.ts';
import type { Deck, PortfolioConfig, Project } from '../../../data/model/index.ts';
import { byKey, isMap } from '../../../data/helpers/guards.ts';
import { bareId, rootOf } from '../../../data/helpers/hub-names.ts';
import {
    projectFacts,
    type FactRecordKind,
    type FactWords
} from '../../../data/shapes/project-facts.ts';""")
rep("""/**
 * What a deck is read over: the roots it may be in, the primary hub (null with none), its settings,
 * the portfolio's projects and the hubs other than the primary. A deck in the root of one of those
 * hubs is read over that hub's folder, settings and projects; a deck in any other root is read over
 * the primary.
 */
export type DeckSource = {
    roots: Root[];
    primary: { key: string; dir: string } | null;
    config: PortfolioConfig;
    projects: Project[];
    hubs?: HubTarget[];
};

/** What the reader needs of a project of the snapshot. */
function deckProject(project: Project): DeckProject {
    const one: DeckProject = {""","""/**
 * What a deck is read over: the roots it may be in, the primary hub (null with none), its settings,
 * the portfolio's projects, the snapshot's records the projects' facts name, and the hubs other
 * than the primary. A deck in the root of one of those hubs is read over that hub's folder,
 * settings and projects; a deck in any other root is read over the primary.
 */
export type DeckSource = {
    roots: Root[];
    primary: { key: string; dir: string } | null;
    config: PortfolioConfig;
    projects: Project[];
    /** One entity map of the snapshot by internal id, or null while none was published. */
    entities: (kind: FactRecordKind) => Record<string, unknown> | null;
    hubs?: HubTarget[];
};

/**
 * What the reader needs of a project of the snapshot, its facts among it. The domain stays the
 * internal id, which the client's hue and title of a domain read.
 */
function deckProject(project: Project, words: FactWords): DeckProject {
    const one: DeckProject = {""")
rep("""        short: project.short ?? '',
        title: project.title
    };""","""        short: project.short ?? '',
        title: project.title,
        facts: projectFacts(project, words)
    };""")
rep("""        projects: ofHub(source.projects, hub.key).map(deckProject),""","""        projects: source.projects
            .filter((project) => rootOf(project) === hub.key)
            .map((project) => deckProject(project, words)),""")
rep("""            : { key: owner.key, dir: owner.hub };
    const reader = createReader({""","""            : { key: owner.key, dir: owner.hub };
    const words: FactWords = {
        record: (kind, id) => {
            const held = byKey(source.entities(kind) ?? {}, id);
            return isMap(held) ? held : undefined;
        },
        vocab: config.merged,
        catalog: config.text
    };
    const reader = createReader({""")
open(p,'w').write(s)
EOF
grep -n "ofHub\|bareId" src/lib/server/content/deck/read.ts
````

## Row 533 (4038 characters in the report's table, 4038 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('src/routes/api/(docs)/deck/+server.ts',[
("""// Layer 2, server route. The deck endpoint only joins Kit's request, the open workspace's folders,
// its primary hub and the portfolio's projects to the server module, because route modules may
// export only HTTP verbs. The roots are the workspace's folders and nothing else, so a folder the
// reader added in the file browser is a root a deck can be opened from. The projects are the ones
// this request's server last published, and the configuration""","""// Layer 2, server route. The deck endpoint only joins Kit's request, the open workspace's folders,
// its primary hub and the portfolio's projects and records to the server module, because route
// modules may export only HTTP verbs. The roots are the workspace's folders and nothing else, so a
// folder the reader added in the file browser is a root a deck can be opened from. The projects
// and the records their facts name are the ones this request's server last published, and the
// configuration"""),
("import { projects } from '$lib/server/sessions/stores/hooks';","import { entities, projects } from '$lib/server/sessions/stores/hooks';"),
("""        projects: projects(locals.server.hub),
""","""        projects: projects(locals.server.hub),
        entities: (kind) => entities(locals.server.hub, kind),
""")])
edit('src/lib/server/edit/writes/config/lists/deck/deck-files.ts',[
("""/** What a deck is read over for a write: the roots, the primary hub, its settings and projects. */""",
"""/**
 * What a deck is read over for a write: the roots, the primary hub, its settings, its projects and
 * the records their facts name, none for a target built without them.
 */"""),
("""        projects: into.projects(),
        hubs: into.hubs""","""        projects: into.projects(),
        entities: into.entities ?? (() => null),
        hubs: into.hubs""")])
edit('src/lib/server/sessions/stores/hooks.ts',[
("""/**
 * One entity map of the last published `portfolio` payload (the domains, the resources, the
 * people), for a config write that checks a value against them; null while the process has
 * published none.
 */
export function entities(
    hub: HubLike,
    kind: 'domains' | 'resources' | 'people'
): Record<string, unknown> | null {""","""/**
 * One entity map of the last published `portfolio` payload, for a config write that checks a value
 * against the domains, the resources or the people, and for the deck read, which names a project's
 * facts by the records of each registry they name; null while the process has published none.
 */
export function entities(hub: HubLike, kind: FactRecordKind): Record<string, unknown> | null {""")])
edit('src/lib/server/edit/writes.ts',[
("""    /**
     * One entity map (the domains, the resources, the people) of the portfolio this server last
     * published, or null while it has published none, which the config writes check a choice
     * against. A target built without it checks those choices for their type alone.
     */
    entities?: (kind: 'domains' | 'resources' | 'people') => Record<string, unknown> | null;""","""    /**
     * One entity map of the portfolio this server last published, or null while it has published
     * none: the config writes check a choice against the domains, the resources or the people, and
     * the deck writes read a project's facts from the records of each registry they name. A target
     * built without it checks those choices for their type alone, and its decks name no record.
     */
    entities?: (kind: FactRecordKind) => Record<string, unknown> | null;""")])
EOF
grep -n "^import" src/lib/server/sessions/stores/hooks.ts | head -20; grep -n "^import" src/lib/server/edit/writes.ts | head -30; grep -n "entitiesOf" src/lib/server/edit/writes.ts
````

## Row 536 (848 characters in the report's table, 848 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('src/lib/server/sessions/stores/hooks.ts',[("import { addressOf } from '../../../data/helpers/hub-names.ts';\n","import { addressOf } from '../../../data/helpers/hub-names.ts';\nimport type { FactRecordKind } from '../../../data/shapes/project-facts.ts';\n")])
edit('src/lib/server/edit/writes.ts',[("import { keyOf } from '../../data/helpers/hub-names.ts';\n","import { keyOf } from '../../data/helpers/hub-names.ts';\nimport type { FactRecordKind } from '../../data/shapes/project-facts.ts';\n")])
EOF
grep -rn "entities?: (kind\|kind: 'domains' | 'resources' | 'people'" src --include=*.ts | head
````

## Row 547 (4512 characters in the report's table, 4512 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/index.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""/** What the deck reader needs to know of each project: where it is and what it is called. */
function deckProjects(manifests: RawManifest[], tiers: readonly string[]): DeckProject[] {
    return manifests.map((manifest) => {
        const status = isMap(manifest.status) ? manifest.status : {};
        const project: DeckProject = {
            id: manifest.id,
            file: manifest.file,
            folder: manifest.folder,
            chips: strings(status.chips),
            short: str(manifest.short) ?? '',
            title: str(manifest.title) ?? manifest.id
        };""","""/**
 * What the deck reader needs to know of each project: where it is, what it is called and its facts,
 * read from the project as the snapshot reads it from the manifest and named by the records of the
 * hub's own registries, a key they lack left out as the merge leaves it out.
 */
function deckProjects(
    manifests: RawManifest[],
    tiers: readonly string[],
    words: FactWords
): DeckProject[] {
    return manifests.map((manifest) => {
        const status = isMap(manifest.status) ? manifest.status : {};
        const project: DeckProject = {
            id: manifest.id,
            file: manifest.file,
            folder: manifest.folder,
            chips: strings(status.chips),
            short: str(manifest.short) ?? '',
            title: str(manifest.title) ?? manifest.id,
            facts: projectFacts(manifestProject(manifest, undefined, undefined, tiers), words)
        };""")
rep("""/**
 * The portfolio deck and every project deck read, with what was wrong in them. `domains` are the
 * keys of the hub's domains registry, which a project's `domain:` is checked against.
 */
function decks(
    hub: string,
    name: string,
    manifests: RawManifest[],
    config: PortfolioConfig,
    domains: string[]
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const root = { key: name, dir: hub };
    const reader = createReader({
        hub: root,
        projects: deckProjects(manifests, vocabKeys(config.merged.tiers)),
        domains,""","""/**
 * The portfolio deck and every project deck read, with what was wrong in them. The hub's
 * registries give the keys of its domains, which a project's `domain:` is checked against, and the
 * records its projects' facts name.
 */
function decks(
    hub: string,
    name: string,
    manifests: RawManifest[],
    config: PortfolioConfig,
    registries: Record<RegistryName, RawRegistry>
): { decks: Record<Id, RawDeck>; findings: Finding[] } {
    const root = { key: name, dir: hub };
    const held = new Map<string, Map<string, RawRegistryEntry>>();
    const words: FactWords = {
        record: (kind, id) => {
            let entries = held.get(kind);
            if (entries === undefined) {
                entries = new Map(registries[kind].entries.map((entry) => [entry.key, entry]));
                held.set(kind, entries);
            }
            return entries.get(id);
        },
        vocab: config.merged,
        catalog: config.text
    };
    const reader = createReader({
        hub: root,
        projects: deckProjects(manifests, vocabKeys(config.merged.tiers), words),
        domains: registries.domains.entries.map((entry) => entry.key),""")
rep("""    const domainKeys = registries.domains.entries.map((entry) => entry.key);
    const deck = decks(hub, root, manifests.manifests, config, domainKeys);""","""    const deck = decks(hub, root, manifests.manifests, config, registries);""")
rep("""        const color = domainColorOf(entry);
        const title = str(entry.title);
        domains[key] = {
            ...(color === undefined ? {} : { color }),
            label: title === undefined || title === '' ? key : title
        };""","""        const color = domainColorOf(entry);
        domains[key] = {
            ...(color === undefined ? {} : { color }),
            label: titleOr(str(entry.title), key)
        };""")
rep("""import { normalise } from './snapshot/normalise.ts';""","""import { manifestProject, normalise } from './snapshot/normalise.ts';
import { projectFacts, titleOr, type FactWords } from './shapes/project-facts.ts';""")
open(p,'w').write(s)
EOF
grep -n "RawRegistryEntry\|RawRegistry,\|RegistryName" src/lib/data/index.ts | head
````

## Row 551 (1467 characters in the report's table, 1467 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && grep -n "from './model/index.ts'" -B25 src/lib/data/index.ts | grep -n "Raw\|import type {" | head; python3 - <<'EOF'
p='src/lib/data/shapes/project-facts.ts'
s=open(p).read()
pairs=[("""/** A person's words: the name of their record, and their key for a record with no name. */
export function personName(name: string, id: string): string {
    return name === '' ? keyOf(id) : name;
}

/** A pillar's or a domain's words: its title, and its key for a record with no title. */
export function titleOr(title: string | undefined, id: string): string {
    return title === undefined || title === '' ? keyOf(id) : title;
}""","""/** A person's words: the name of their record, and their key for a record with no name. */
export function personName(name: string, key: string): string {
    return name === '' ? key : name;
}

/** A pillar's or a domain's words: its title, and its key for a record with no title. */
export function titleOr(title: string | undefined, key: string): string {
    return title === undefined || title === '' ? key : title;
}"""),
("""        word: personName(str(record.name) ?? '', id),""","""        word: personName(str(record.name) ?? '', keyOf(id)),"""),
("""        word: titleOr(str(record.title), id),""","""        word: titleOr(str(record.title), keyOf(id)),""")]
for a,b in pairs:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
````

## Row 557 (457 characters in the report's table, 457 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/index.ts'
s=open(p).read()
a="""    RawPortfolio,
    RepositoryRoot,"""
assert s.count(a)==1
s=s.replace(a,"""    RawPortfolio,
    RawRegistry,
    RawRegistryEntry,
    RegistryName,
    RepositoryRoot,""")
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx tsc --noEmit -p tsconfig.json 2>&1 | head -40
````

## Row 568 (3564 characters in the report's table, 3564 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && perl -pi -e 's/\bpersonName\(/personWords(/g; s/\btitleOr\(/titleWords(/g; s/\bvenueShort\(/venueWords(/g; s/\bvocabWord\(/vocabWords(/g' src/lib/data/shapes/project-facts.ts && perl -pi -e 's/\btitleOr\b/titleWords/g' src/lib/data/index.ts && grep -n "titleWords\|personWords\|venueWords\|vocabWords" src/lib/data/shapes/project-facts.ts src/lib/data/index.ts && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('src/lib/state/boards/person.ts',[
("import { holdersOf, keyOf, resolveKey, rootOf } from '../../data/helpers/hub-names.ts';","import { holdersOf, keyOf, resolveKey, rootOf } from '../../data/helpers/hub-names.ts';\nimport { personWords } from '../../data/shapes/project-facts.ts';"),
("        names[one.id] = one.name === '' ? keyOf(one.id) : one.name;","        names[one.id] = personWords(one.name, keyOf(one.id));"),
("    return held === undefined || held.name === '' ? keyOf(id) : held.name;","    return personWords(held?.name ?? '', keyOf(id));"),
])
edit('src/lib/state/boards/board/items.ts',[
("import { categoryOf } from '../../../data/shapes/boards/categories.ts';","import { categoryOf } from '../../../data/shapes/boards/categories.ts';\nimport { titleWords, venueWords } from '../../../data/shapes/project-facts.ts';"),
("        const made = tag(id, held?.title ?? own(id));","        const made = tag(id, titleWords(held?.title, own(id)));"),
("""                      short:
                          venue.short !== undefined && venue.short !== ''
                              ? venue.short
                              : venue.name,""","""                      short: venueWords(venue.short, venue.name),"""),
])
edit('src/lib/views/shared/card/card.ts',[
("""/** The catalogued label for a code-deposit state. */
export function codeLabel(value: string, translate: Translate): string {
    if (value === 'deposited') return translate('board.code_deposited');
    if (value === 'review-anon') return translate('board.code_anon');
    if (value === 'none') return translate('board.code_pending');
    return translate('board.code_none');
}""","""/** The catalogued label for a code-deposit state (`codeWordKey`). */
export function codeLabel(value: string, translate: Translate): string {
    return translate(codeWordKey(value));
}"""),
("import { resourceGlyph } from '$lib/state/forms/schema';","import { resourceGlyph } from '$lib/state/forms/schema';\nimport { codeWordKey } from '$lib/data/shapes/project-facts';"),
])
edit('src/lib/state/shared/words/tones.ts',[
("import { unionWords } from '../../../data/shapes/vocab-keys.ts';","import { unionWords } from '../../../data/shapes/vocab-keys.ts';\nimport { vocabWords } from '../../../data/shapes/project-facts.ts';"),
("""/** A word of `stages`, `forms` or `chips`: the icon and the label it may leave out. */
const legendRowShape = z.object({
    icon: z.string().catch(''),
    label: z.string().optional().catch(undefined)
});""","""/** A word of `stages`, `forms` or `chips`: the icon it may leave out. */
const legendRowShape = z.object({ icon: z.string().catch('') });"""),
("""        return held === null ? [] : [{ key, icon: held.icon, label: held.label ?? key }];""","""        return held === null ? [] : [{ key, icon: held.icon, label: vocabWords(row, key) }];"""),
])
EOF
grep -n "import" src/lib/views/shared/card/card.ts | sed -n 1,25p | grep "\$lib/data"
````

## Row 586 (1505 characters in the report's table, 1505 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('config/text/findings.yml',[("""            count_unknown: a count of group {0}, which the deck does not define, stays as written
""","""            count_unknown: a count of group {0}, which the deck does not define, stays as written
            project_none: "{0} is in a deck that is no project's; it stays as written"
            project_field_unknown: "{0} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
            project_field_empty: '{0} holds no value for the project {1}; it is filled with nothing'
""")])
edit('config/text/views/academic/present.yml',[("""        overview: Overview
        overview_glyph: cards
""","""        overview: Overview
        overview_glyph: cards
        facts: Project facts
        facts_tip: Show the strip of the project's facts at the foot of its slides, here and in the presenter screen, the audience window and the PDF
        fact: '{0}: {1}'
        fact_chips: Status chips
        fact_pillars: Pillars
""")])
EOF
python3 -c "import yaml;[yaml.safe_load(open(f)) for f in ['config/text/findings.yml','config/text/views/academic/present.yml']];print('ok')"
````

## Row 590 (544 characters in the report's table, 544 here)

````
cd /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && python3 - <<'EOF'
s=open('cases.ts').read()
s=s.replace("    entities: snapshot.entities\n","    entities: (kind: string) => snapshot.entities[kind] ?? null\n")
open('cases.ts','w').write(s)
EOF
node cases.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 > after-run.txt 2>&1; echo exit $?; sed -n 7,200p after-run.txt | cut -c1-900
````

## Row 598 (3367 characters in the report's table, 3367 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/state/life/present.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""    /** The values picked in its filter's groups; a group with no pick is not in it. */
    filters: DeckFilters;
};""","""    /** The values picked in its filter's groups; a group with no pick is not in it. */
    filters: DeckFilters;
    /**
     * Whether the strip of a project's facts at the foot of its slides shows its words, in the pane
     * and in its presenter screen, audience window and PDF; on unless the pane turned it off.
     */
    facts: boolean;
};""")
rep("""    filters: z.record(z.string(), z.array(z.string())).catch(() => ({}))
});""","""    filters: z.record(z.string(), z.array(z.string())).catch(() => ({})),
    facts: z.boolean().catch(true)
});""")
rep("""        filters: filtersOf(held?.filters ?? {})
    };
}""","""        filters: filtersOf(held?.filters ?? {}),
        facts: held?.facts ?? true
    };
}""")
rep("""/** The part of an answer the pane depends on; the slides are the server's own and are kept. */""","""/**
 * The part of an answer the pane depends on, the project each slide names and each project's facts
 * among it; the slides are the server's own and are kept.
 */""")
rep("""        slides: z.array(z.object({ key: z.string(), kind: z.string(), title: z.string() })),""","""        slides: z.array(
            z.object({
                key: z.string(),
                kind: z.string(),
                title: z.string(),
                project: z.string().optional()
            })
        ),""")
rep("""        findings: z.array(z.unknown())
    })
);""","""        projects: z.record(
            z.string(),
            z.array(z.object({ field: z.string(), words: z.array(z.string()) }))
        ),
        findings: z.array(z.unknown())
    })
);""")
rep(""" * The audience page, when it opens, and the print page, before it reads the deck, ask which
 * projects the filter keeps (`keep-asked`, `from` naming which of the two asks). The answer is a
 * `keep`, the kept list or null for no filter: the presenting pane answers the audience page with
 * `at` 0, and says it again with `at` 0 whenever its kept list changes; the exporting pane answers
 * the print page with `at` the moment of the press, in milliseconds.""",""" * The audience page, when it opens, and the print page, before it reads the deck, ask which
 * projects the filter keeps and whether the strip of a project's facts shows its words
 * (`keep-asked`, `from` naming which of the two asks). The answer is a `keep`: the kept list or
 * null for no filter, and the pane's Project facts toggle (`facts`). The presenting pane answers
 * the audience page with `at` 0, and says it again with `at` 0 whenever its kept list or its
 * toggle changes; the exporting pane answers the print page with both as they were at the press
 * and `at` the moment of the press, in milliseconds.""")
rep("""        keep: z.array(z.string()).nullable(),
        at: z.number().int().nonnegative()""","""        keep: z.array(z.string()).nullable(),
        facts: z.boolean(),
        at: z.number().int().nonnegative()""")
open(p,'w').write(s)
EOF
grep -n "kind: 'keep'" src --include=* -r; grep -rn "kind: 'keep'" src
````

## Row 608 (5561 characters in the report's table, 5561 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/state/life/present.svelte.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""// instance id, so it outlives the pane's component: a tab switch, a page switch and any redraw of
// the panes leave it on, and it ends when the instance leaves the layout. The kept list of the
// pane's filter is read through the pane's link as its slide is, so the audience page is answered
// it when it asks and told it again whenever it changes, while the pane is drawn or not.
//
// The print and audience routes hold no store: they read the deck through `readDeck` under the
// kept list they were told, and the print page asks the exporting pane for it (`exportKeep`).""","""// instance id, so it outlives the pane's component: a tab switch, a page switch and any redraw of
// the panes leave it on, and it ends when the instance leaves the layout. The kept list of the
// pane's filter and its Project facts toggle are read through the pane's link as its slide is, so
// the audience page is answered both when it asks and told both again whenever either changes,
// while the pane is drawn or not.
//
// The print and audience routes hold no store: they read the deck through `readDeck` under the
// kept list they were told and draw the strip of a project's facts by the toggle they were told,
// and the print page asks the exporting pane for both (`exportKeep`).""")
rep("""    /** The kept list of the pane's filter: null for none, undefined while it is not known. */
    keep: () => Keep;""","""    /** The kept list of the pane's filter: null for none, undefined while it is not known. */
    keep: () => Keep;
    /** Whether the pane's Project facts toggle is on. */
    facts: () => boolean;""")
rep("""/**
 * The kept list the exporting pane answers the print page with over the deck's channel: the first
 * `keep` an export sends (`at` above 0) within `wait` ms of the ask, or undefined when none comes,
 * which the page reads as a deck it cannot print as the pane filters it.
 */
export function exportKeep(ref: DeckRef, wait: number): Promise<Keep> {
    return new Promise((answer) => {
        const channel = new BroadcastChannel(presentName(ref));
        const done = (keep: Keep): void => {
            clearTimeout(timer);
            channel.close();
            answer(keep);
        };
        const timer = setTimeout(() => done(undefined), wait);
        channel.onmessage = (event: MessageEvent<unknown>) => {
            const message = parseMessage(event.data);
            if (message?.kind === 'keep' && message.at > 0) done(message.keep);
        };""","""/** What the exporting pane tells the print page: its kept list and its Project facts toggle. */
export type ExportKeep = { keep: readonly string[] | null; facts: boolean };

/**
 * The kept list and the Project facts toggle the exporting pane answers the print page with over
 * the deck's channel: the first `keep` an export sends (`at` above 0) within `wait` ms of the ask,
 * or undefined when none comes, which the page reads as a deck it cannot print as the pane filters
 * it.
 */
export function exportKeep(ref: DeckRef, wait: number): Promise<ExportKeep | undefined> {
    return new Promise((answer) => {
        const channel = new BroadcastChannel(presentName(ref));
        const done = (held: ExportKeep | undefined): void => {
            clearTimeout(timer);
            channel.close();
            answer(held);
        };
        const timer = setTimeout(() => done(undefined), wait);
        channel.onmessage = (event: MessageEvent<unknown>) => {
            const message = parseMessage(event.data);
            if (message?.kind === 'keep' && message.at > 0) {
                done({ keep: message.keep, facts: message.facts });
            }
        };""")
rep("""    /**
     * Tell the audience window the kept list of the pane's filter; one that cannot be worked out
     * yet is told once it can.
     */
    function sendKeep(held: Held): void {
        const keep = held.link.keep();
        if (keep !== undefined) held.channel.postMessage({ kind: 'keep', keep, at: 0 });
    }""","""    /**
     * Tell the audience window the kept list of the pane's filter and the pane's Project facts
     * toggle; while the kept list cannot be worked out yet nothing is told, and both are told once
     * it can.
     */
    function sendKeep(held: Held): void {
        const keep = held.link.keep();
        const facts = held.link.facts();
        if (keep !== undefined) held.channel.postMessage({ kind: 'keep', keep, facts, at: 0 });
    }""")
rep("""            // The kept list is said at the start and again each time it changes; a push that
            // leaves it as it was says nothing.
            let said: string | null = null;
            $effect(() => {
                const keep = link.keep();
                const now = JSON.stringify(keep);""","""            // The kept list and the toggle are said at the start and again each time either
            // changes; a push that leaves both as they were says nothing.
            let said: string | null = null;
            $effect(() => {
                const keep = link.keep();
                const now = JSON.stringify([keep, link.facts()]);""")
open(p,'w').write(s)
EOF
grep -rn "exportKeep\|PresentLink\b" src --include=*.svelte --include=*.ts 2>/dev/null | grep -v "present.svelte.ts" ; grep -rln "exportKeep\|PresentLink" src
````

## Row 622 (4386 characters in the report's table, 4386 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('acts/export.ts',[
("""// The print route's address names the deck and nothing else, so the PDF learns the pane's filter
// over the deck's channel: from the press until the print page has asked for the kept list and been
// answered, or for `EXPORT_HOLD_MS`, the pane holds the deck's export under a Web Lock named for it
// (`exportName`) and answers the page's `keep-asked` with its kept list and the moment of the
// press.""","""// The print route's address names the deck and nothing else, so the PDF learns the pane's filter
// and its Project facts toggle over the deck's channel: from the press until the print page has
// asked for them and been answered, or for `EXPORT_HOLD_MS`, the pane holds the deck's export under
// a Web Lock named for it (`exportName`) and answers the page's `keep-asked` with its kept list and
// its toggle as they were at the press, and the moment of the press."""),
("""    /** The kept list of the pane's filter, null for none, which the print page is answered. */
    keep: readonly string[] | null;""","""    /** The kept list of the pane's filter, null for none, which the print page is answered. */
    keep: readonly string[] | null;
    /** The pane's Project facts toggle at the press, which the print page is answered too. */
    facts: boolean;"""),
("""/** The longest an export holds the deck's export for its print page to ask for the kept list. */""","""/**
 * The longest an export holds the deck's export for its print page to ask for the kept list and
 * the toggle.
 */"""),
("""/**
 * Answer the print page's ask for the kept list over the deck's channel, once, with `at` the moment
 * of the press, after `grant`; an ask heard before it is answered at `grant`. Done once it is
 * answered, after `EXPORT_HOLD_MS`, or when stopped.
 */
function answerPrint(ref: DeckRef, keep: readonly string[] | null, at: number): KeepReply {""","""/**
 * Answer the print page's ask for the kept list and the Project facts toggle over the deck's
 * channel, once, with `at` the moment of the press, after `grant`; an ask heard before it is
 * answered at `grant`. Done once it is answered, after `EXPORT_HOLD_MS`, or when stopped.
 */
function answerPrint(
    ref: DeckRef,
    keep: readonly string[] | null,
    facts: boolean,
    at: number
): KeepReply {"""),
("""            channel.postMessage({ kind: 'keep', keep, at });""","""            channel.postMessage({ kind: 'keep', keep, facts, at });"""),
("""    const print = answerPrint(deps.ref, deps.keep, Date.now());""","""    const print = answerPrint(deps.ref, deps.keep, deps.facts, Date.now());"""),
("""        const print = answerPrint(deps.ref, deps.keep, at);""","""        const print = answerPrint(deps.ref, deps.keep, deps.facts, at);"""),
])
edit('acts/acts.svelte.ts',[
("""    /** The kept list of the pane's filter, which the print route is answered with. */
    keep: () => Keep;""","""    /** The kept list of the pane's filter, which the print route is answered with. */
    keep: () => Keep;
    /** The pane's Project facts toggle, which the print route is answered with too. */
    facts: () => boolean;"""),
("""            keep,
            frame: saved.frame,""","""            keep,
            facts: reads.facts(),
            frame: saved.frame,"""),
])
edit('acts/presentation.svelte.ts',[
("""// it over the deck as saved, with the link the presenting store reads the pane through (the slide
// it is on and the kept list of its filter, each read from the pane's saved state at the call, so
// the presentation goes on while the pane is not drawn),""","""// it over the deck as saved, with the link the presenting store reads the pane through (the slide
// it is on, the kept list of its filter and its Project facts toggle, each read from the pane's
// saved state at the call, so the presentation goes on while the pane is not drawn),"""),
("""            keep: () => reads.keepFor(id, ref),""","""            keep: () => reads.keepFor(id, ref),
            facts: () => parsePresentState(instanceState(id)).facts,"""),
])
EOF
grep -n "kept list" acts/export.ts | head
````

## Row 637 (3379 characters in the report's table, 3379 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
p='Present.svelte'
s=open(p).read()
start=s.index("    /** Whether `target` is, or is inside, a control of the slide that acts on a press itself. */")
end=s.index("    /** Show a slide picked in the grid, and close the grid over it. */")
mid=s[start:end]
step_start=mid.index("    /**\n     * Move, and put the keys in force")
step_end=mid.index("    /** The deck's own keys:")
step=mid[step_start:step_end]
new = step + """    const { keys, focusLeft, advance, boxClicked } = createBoxKeys({
        box: () => box,
        rows: () => rows,
        slide: () => held.slide,
        shown: () => shown,
        grid: () => grid,
        full: () => full,
        presented: () => presented,
        cursor: () => cursor !== null,
        write,
        toggleFull: screen.toggle,
        leaveFull: screen.leave,
        present: () => present(),
        endPresenting: () => presenting.end(instance.id)
    });

"""
s=s[:start]+new+s[end:]
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""    import { CONTROLS, heldBack, inField, keepTab, moveOf } from './screen/keys';
""","""    import { createBoxKeys } from './screen/box';
""")
rep("""        leftDeck,
        movedKey,
        nothingToShow,""","""        leftDeck,
        nothingToShow,""")
rep("""    // The keys are the pane's own, bound to the view's box rather than to the window: the shell""","""    // The keys are the pane's own (screen/box.ts), bound to the view's box rather than to the window: the shell""")
rep("""        keep: filter.keep,
        shown: () => shown,""","""        keep: filter.keep,
        facts: () => held.facts,
        shown: () => shown,""")
rep("""        overview={grid}
        {full}""","""        overview={grid}
        facts={shown?.project === undefined ? null : held.facts}
        onfacts={() => {
            write({ facts: !held.facts });
            box?.focus();
        }}
        {full}""")
rep("""                {ref}
                current={shown?.key ?? ''}""","""                {ref}
                facts={held.facts}
                current={shown?.key ?? ''}""")
rep("""                        {deck}
                        at={at + 1}""","""                        {deck}
                        facts={held.facts}
                        at={at + 1}""")
rep("""                    <Framed row={shown} {deck} first={at === 0} bare={full} />""","""                    <Framed
                        row={shown}
                        {deck}
                        facts={held.facts}
                        first={at === 0}
                        bare={full}
                    />""")
rep("""    // A slide has a menu on a right-click""","""    // A slide that comes from a project's deck carries the strip of the project's facts at its foot,
    // on the pane, the presenter screen, the tiles, the audience window and the PDF. The toolbar's
    // Project facts toggle, drawn while the slide on screen carries a project, shows or hides its
    // words; it is the pane's, kept with the instance and through a change of deck.
    //
    // A slide has a menu on a right-click""")
open(p,'w').write(s)
EOF
grep -n "stepKey\|movedKey\|inControl\|deckKey" Present.svelte; wc -l Present.svelte
````

## Row 641 (1104 characters in the report's table, 1104 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
p='Present.svelte'
s=open(p).read()
a="""    // The keys are the pane's own (screen/box.ts), bound to the view's box rather than to the window: the shell
    // owns the digits and the chords, and a deck that swallowed an arrow key wherever the reader
    // was looking would take the pane strip's own keys with it. The box takes the focus when the
    // view is mounted and on a press inside it, so the arrows work from the moment the deck is
    // opened."""
b="""    // The keys are the pane's own (screen/box.ts), bound to the view's box rather than to the
    // window: the shell owns the digits and the chords, and a deck that swallowed an arrow key
    // wherever the reader was looking would take the pane strip's own keys with it. The box takes
    // the focus when the view is mounted and on a press inside it, so the arrows work from the
    // moment the deck is opened."""
assert s.count(a)==1
s=s.replace(a,b)
open(p,'w').write(s)
EOF
sed -n 40,56p Present.svelte
````

## Row 644 (909 characters in the report's table, 909 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
p='Present.svelte'
s=open(p).read()
a="""    // moment the deck is opened. The keys are the arrows, Page Up and Page Down, Home and End, Space (the next slide,
    // Shift+Space the previous one), `O` for the grid, `F` for full screen, `P` for the presenter
    // screen and Escape to close the grid, and then to end the presentation."""
b="""    // moment the deck is opened. The keys are the arrows, Page Up and Page Down, Home and End,
    // Space (the next slide, Shift+Space the previous one), `O` for the grid, `F` for full screen,
    // `P` for the presenter screen and Escape to close the grid, and then to end the presentation."""
assert s.count(a)==1
s=s.replace(a,b)
open(p,'w').write(s)
EOF
awk 'length > 100 {print FILENAME": "FNR": "length}' Present.svelte screen/box.ts
````

## Row 650 (2026 characters in the report's table, 2026 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
p='Present.svelte'
s=open(p).read()
pairs=[("""    // `P` for the presenter screen and Escape to close the grid, and then to end the presentation. A key pressed in a
    // field inside the box (an input, a text area, a select, editable text) is the field's, so a
    // form of the overview keeps what is typed in it; Escape in a field closes the grid unless the
    // field or the form around it took it. On a button or a link the deck's keys act, except
    // Space, which presses the control.""","""    // `P` for the presenter screen and Escape to close the grid, and then to end the presentation.
    // A key pressed in a field inside the box (an input, a text area, a select, editable text) is
    // the field's, so a form of the overview keeps what is typed in it; Escape in a field closes
    // the grid unless the field or the form around it took it. On a button or a link the deck's
    // keys act, except Space, which presses the control."""),
("""    // A slide that comes from a project's deck carries the strip of the project's facts at its foot,
    // on the pane, the presenter screen, the tiles, the audience window and the PDF. The toolbar's
    // Project facts toggle, drawn while the slide on screen carries a project, shows or hides its
    // words; it is the pane's, kept with the instance and through a change of deck.""","""    // A slide that comes from a project's deck carries the strip of the project's facts at its
    // foot, on the pane, the presenter screen, the tiles, the audience window and the PDF. The
    // toolbar's Project facts toggle, drawn while the slide on screen carries a project, shows or
    // hides its words; it is the pane's, kept with the instance and through a change of deck.""")]
for a,b in pairs:
    assert s.count(a)==1
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
awk 'length > 100 {print FILENAME": "FNR": "length}' Present.svelte
````

## Row 657 (1516 characters in the report's table, 1516 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && grep -n "title\|tooltip\|export let\|Props\|glyph" ../../../ui/controls/Chip.svelte | head -20; python3 - <<'EOF'
p='Bar.svelte'
s=open(p).read()
pairs=[("""    // buttons, the overview, full-screen and presenter controls, the Export to PDF button, while a""","""    // buttons, the overview control, the Project facts toggle while the slide on screen comes from
    // a project's deck, the full-screen and presenter controls, the Export to PDF button, while a"""),
("""        overview: boolean;
        full: boolean;""","""        overview: boolean;
        /**
         * The pane's Project facts toggle, null while the slide on screen carries no project, when
         * the toggle is not drawn.
         */
        facts: boolean | null;
        onfacts: () => void;
        full: boolean;"""),
("""        overview,
        full,
        presenting,""","""        overview,
        facts,
        onfacts,
        full,
        presenting,"""),
("""        pressed={overview}
        onclick={onoverview}
    />""","""        pressed={overview}
        onclick={onoverview}
    />
    {#if facts !== null}
        <Chip
            label={t('present.facts')}
            title={t('present.facts_tip')}
            pressed={facts}
            onclick={onfacts}
        />
    {/if}""")]
for a,b in pairs:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
sed -n 1,12p Bar.svelte
````

## Row 684 (508 characters in the report's table, 508 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && mkdir -p src/lib/views/academic/present/parts/project && mv src/lib/views/academic/present/parts/Project.svelte src/lib/views/academic/present/parts/project/Project.svelte && grep -rn "parts/Project\|\./Equation\|\.\./Panel\|\./Words" src docs tests README.md --exclude=local.yml 2>/dev/null | grep -v "^src/lib/views/academic/present/parts/[A-Z]" | head -20; grep -n "import" src/lib/views/academic/present/parts/project/Project.svelte
````

## Row 687 (600 characters in the report's table, 600 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && sed -i '' "s#    import Equation from './Equation.svelte';#    import Equation from '../Equation.svelte';#; s#    import Panel from '../Panel.svelte';#    import Panel from '../../Panel.svelte';#; s#    import Words from './Words.svelte';#    import Words from '../Words.svelte';#" src/lib/views/academic/present/parts/project/Project.svelte && grep -rn "Project\.svelte\|parts/Project" src docs tests README.md .scratch/migration/agents/guarded.md 2>/dev/null | grep -i "present" | head; ls src/lib/views/academic/present/parts
````

## Row 699 (3424 characters in the report's table, 3424 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && sed -i '' 's#    /\*\* The glyph the card draws a field with, for the four fields that carry one. \*/#    /** The glyph the card draws a field with, for the three fields whose glyph is fixed. */#' parts/project/Facts.svelte && grep -n "three fields" parts/project/Facts.svelte && grep -n "filled\|tone?:" ../../../ui/controls/Chip.svelte | head -4 && python3 - <<'EOF'
p='Slide.svelte'
s=open(p).read()
pairs=[("""    // The first slide of a deck carries the key hint in its foot when the pane draws it; no deck
    // file holds one. A Stage that measures the slide leaves the hint out of the measure.

    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Project from './parts/Project.svelte';""","""    // The slide's foot, under its content, holds the key hint and then the strip of a project's
    // facts. The first slide of a deck carries the key hint when the pane draws it; no deck file
    // holds one. A slide that comes from a project's deck (`row.project`) carries the strip of that
    // project's facts (`deck.projects`), on every surface that draws a slide, its words shown by
    // the pane's Project facts toggle (`facts`) and hidden, their room kept, when it is off. A
    // Stage that measures the slide leaves the hint out of the measure and counts the strip.

    import Grid from './parts/Grid.svelte';
    import Plain from './parts/Plain.svelte';
    import Facts from './parts/project/Facts.svelte';
    import Project from './parts/project/Project.svelte';"""),
("""    import { tagToneOf } from '$lib/state/life/present';""","""    import { tagToneOf } from '$lib/state/life/present';
    import { byKey } from '$lib/data/helpers/guards';"""),
("""        /** Whether this is the deck's first slide, which names the keys in its foot. */
        first: boolean;
    };

    let { row, deck, first }: Props = $props();""","""        /** Whether this is the deck's first slide, which names the keys in its foot. */
        first: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
    };

    let { row, deck, first, facts }: Props = $props();

    /** The facts of the project the slide comes from, null for a slide of no project's deck. */
    const held = $derived(row.project === undefined ? null : (byKey(deck.projects, row.project) ?? null));"""),
("""    {#if first}
        <p class="keys" data-key-hint>{t('present.key_hint')}</p>
    {/if}
</div>""","""    {#if first || held !== null}
        <div class="foot">
            {#if first}
                <p class="keys" data-key-hint>{t('present.key_hint')}</p>
            {/if}
            {#if held !== null}
                <Facts facts={held} shown={facts} hub={deck.hub} />
            {/if}
        </div>
    {/if}
</div>"""),
("""    .keys {
        margin: auto 0 0;
        padding-top: 1.2em;""","""    /* The foot sits at the bottom of the reading column, under the slide's content. */
    .foot {
        display: flex;
        flex-direction: column;
        gap: 0.6em;
        margin-top: auto;
        padding-top: 1.2em;
    }

    .keys {
        margin: 0;""")]
for a,b in pairs:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
sed -n 60,80p screen/Stage.svelte
````

## Row 705 (1347 characters in the report's table, 1347 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
p='Slide.svelte'
s=open(p).read()
pairs=[("""            {#if held !== null}
                <Facts facts={held} shown={facts} hub={deck.hub} />
            {/if}""","""            {#if held !== null}
                <div class="strip">
                    <Facts facts={held} shown={facts} hub={deck.hub} />
                </div>
            {/if}"""),
("""    /* The foot sits at the bottom of the reading column, under the slide's content. */
    .foot {
        display: flex;
        flex-direction: column;
        gap: 0.6em;
        margin-top: auto;
        padding-top: 1.2em;
    }

    .keys {
        margin: 0;""","""    /* The foot sits at the bottom of the reading column, under the slide's content. Each of its
       parts holds its own space above it, so the measure that leaves the key hint out leaves its
       space out with it. */
    .foot {
        margin-top: auto;
    }

    .strip {
        padding-top: 1.2em;
    }

    .keys + .strip {
        padding-top: 0.6em;
    }

    .keys {
        margin: 0;
        padding-top: 1.2em;""")]
for a,b in pairs:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
sed -n 95,130p Slide.svelte; sed -n 1,30p screen/Stage.svelte
````

## Row 709 (1733 characters in the report's table, 1733 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib/views/academic/present && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('screen/Stage.svelte',[("""    // frame's own px, and the difference is rounded once. The slide is measured each time""","""    // frame's own px, and the difference is rounded once. The strip of a project's facts at the
    // slide's foot is counted: it keeps its room whether its words are shown or not, so the measure
    // is the same with the pane's Project facts toggle on and off. The slide is measured each time""")])
edit('screen/Framed.svelte',[
("""    // drawn.
""","""    // drawn. The strip of a project's facts shows its words by the pane's Project facts toggle
    // (`facts`), and keeps its room either way, so the measure does not change with the toggle.
"""),
("""        /** Whether the frame goes edge to edge with no border and no corner, as on the monitor. */
        bare?: boolean;
    };

    let { row, deck, first, bare = false }: Props = $props();""","""        /** Whether the frame goes edge to edge with no border and no corner, as on the monitor. */
        bare?: boolean;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
    };

    let { row, deck, first, bare = false, facts }: Props = $props();"""),
("""    <Slide {row} {deck} {first} />""","""    <Slide {row} {deck} {first} {facts} />""")])
EOF
grep -n "Framed\|type Props" -A0 presenter/Presenter.svelte arrange/Tile.svelte arrange/Overview.svelte; sed -n 50,60p ../../../state/life/arrange.ts
````

## Row 715 (3311 characters in the report's table, 3311 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/lib && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('views/academic/present/presenter/Presenter.svelte',[
("""    // (screen/Framed.svelte), and the next slide's room takes the frame's proportions.""","""    // (screen/Framed.svelte), and the next slide's room takes the frame's proportions; both draw
    // the strip of a project's facts by the pane's Project facts toggle (`facts`)."""),
("""        next: DeckSlide | null;
        deck: Deck;
        /** The 1-based""","""        next: DeckSlide | null;
        deck: Deck;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
        /** The 1-based"""),
("""    let { row, next, deck, at, count, timer, onadvance, onpause, onresume, onreset, onend }: Props =
        $props();""","""    let {
        row,
        next,
        deck,
        facts,
        at,
        count,
        timer,
        onadvance,
        onpause,
        onresume,
        onreset,
        onend
    }: Props = $props();"""),
("""        <Framed {row} {deck} first={false} />""","""        <Framed {row} {deck} {facts} first={false} />"""),
("""                    <Framed row={next} {deck} first={false} />""","""                    <Framed row={next} {deck} {facts} first={false} />""")])
edit('views/academic/present/arrange/Tile.svelte',[
("""                <Framed {row} deck={view.deck} first={false} />""","""                <Framed {row} deck={view.deck} facts={view.facts} first={false} />""")])
edit('state/life/arrange.ts',[
("""/**
 * What every tile of one Overview reads: the deck, the words of a slide's place, the key of the
 * slide the reader was on, the card the shell's cursor is on (null for none) and the press that
 * shows a slide.
 */
export type TileView = {
    deck: Deck;""","""/**
 * What every tile of one Overview reads: the deck, the pane's Project facts toggle the strip of a
 * project's facts shows its words by, the words of a slide's place, the key of the slide the reader
 * was on, the card the shell's cursor is on (null for none) and the press that shows a slide.
 */
export type TileView = {
    deck: Deck;
    facts: boolean;""")])
edit('views/academic/present/arrange/Overview.svelte',[
("""        ref: DeckRef | null;
        /** The key of the slide the reader was on, marked as the one in force. */""","""        ref: DeckRef | null;
        /** Whether the strip of a project's facts shows its words on the tiles: the pane's toggle. */
        facts: boolean;
        /** The key of the slide the reader was on, marked as the one in force. */"""),
("""    let { deck, saved, ref, current, cursor, onpick, onact, say }: Props = $props();""","""    let { deck, saved, ref, facts, current, cursor, onpick, onact, say }: Props = $props();"""),
("""    const view: TileView = $derived({ deck, placeOf, current, cursor, onpick });""","""    const view: TileView = $derived({ deck, facts, placeOf, current, cursor, onpick });""")])
EOF
sed -n 1,12p views/academic/present/arrange/Tile.svelte; sed -n 1,20p views/academic/present/arrange/Overview.svelte | head -20
````

## Row 719 (3854 characters in the report's table, 3854 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/routes/present && python3 - <<'EOF'
def edit(p, pairs):
    s=open(p).read()
    for a,b in pairs:
        assert s.count(a)==1, (p,a[:60])
        s=s.replace(a,b)
    open(p,'w').write(s)
edit('show/+page.svelte',[
("""    // The deck is drawn as the presenting pane filters it. The address names the deck alone, so
    // the page asks over the channel which projects the pane's filter keeps (`keep-asked`) when it
    // opens, reads the deck once the presenter screen answers (a `keep` with `at` 0), and reads it
    // again whenever the screen says the kept list changed; an answer that arrives after a later
    // one is dropped.""","""    // The deck is drawn as the presenting pane filters it. The address names the deck alone, so
    // the page asks over the channel which projects the pane's filter keeps (`keep-asked`) when it
    // opens, reads the deck once the presenter screen answers (a `keep` with `at` 0), and reads it
    // again whenever the screen says the kept list changed; an answer that arrives after a later
    // one is dropped. The same answer carries the pane's Project facts toggle, which the strip of a
    // project's facts at the foot of its slides shows its words by: a change of the toggle alone is
    // drawn at once, with no read of the deck."""),
("""    let keep: readonly string[] | null | undefined = undefined;""","""    let keep: readonly string[] | null | undefined = undefined;
    /** The presenting pane's Project facts toggle, on until the screen has said otherwise. */
    let facts = $state(true);"""),
("""        else if (message.kind === 'keep' && message.at === 0) {
            if (keep !== undefined && JSON.stringify(message.keep) === JSON.stringify(keep)) return;""","""        else if (message.kind === 'keep' && message.at === 0) {
            facts = message.facts;
            if (keep !== undefined && JSON.stringify(message.keep) === JSON.stringify(keep)) return;"""),
("""                <Slide row={shown} {deck} first={false} />""","""                <Slide row={shown} {deck} {facts} first={false} />""")])
edit('print/+page.svelte',[
("""    let deck = $state<Deck | null>(null);""","""    let deck = $state<Deck | null>(null);
    /** The exporting pane's Project facts toggle at the press. */
    let facts = $state(true);"""),
("""    /**
     * Read the deck the address names, under the kept list the exporting pane answers; what the
     * page fails with when it is not answered.
     */
    async function read(): Promise<Deck | string> {
        const asked = new URLSearchParams(window.location.search);
        const ref = { root: asked.get('root') ?? '', path: asked.get('path') ?? '' };
        const keep = await exportKeep(ref, KEEP_WAIT_MS);
        if (keep === undefined) return t('present.print_unanswered', String(KEEP_WAIT_MS / 1000));
        return readDeck(ref, data.token, keep);
    }""","""    /**
     * Read the deck the address names, under the kept list the exporting pane answers, and keep the
     * pane's Project facts toggle it answers with; what the page fails with when it is not
     * answered.
     */
    async function read(): Promise<Deck | string> {
        const asked = new URLSearchParams(window.location.search);
        const ref = { root: asked.get('root') ?? '', path: asked.get('path') ?? '' };
        const held = await exportKeep(ref, KEEP_WAIT_MS);
        if (held === undefined) return t('present.print_unanswered', String(KEEP_WAIT_MS / 1000));
        facts = held.facts;
        return readDeck(ref, data.token, held.keep);
    }"""),
("""                    <Slide {row} {deck} first={false} />""","""                    <Slide {row} {deck} {facts} first={false} />""")])
EOF
sed -n 1,30p print/+page.svelte | grep -n "keep\|filter\|strip"
````

## Row 725 (1480 characters in the report's table, 1480 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148/src/routes/present && python3 - <<'EOF'
p='print/+page.svelte'
s=open(p).read()
a="""    // `exportKeep`) and reads the deck under it. With no answer within `KEEP_WAIT_MS`, well inside
    // the desktop host's wait, the page says so and fails, and prints no deck."""
b="""    // `exportKeep`) and reads the deck under it. The answer carries the pane's Project facts
    // toggle as it was at the press, which the strip of a project's facts at the foot of its slides
    // shows its words by. With no answer within `KEEP_WAIT_MS`, well inside the desktop host's
    // wait, the page says so and fails, and prints no deck."""
assert s.count(a)==1
s=s.replace(a,b)
s=s.replace("""    /** The longest the page waits for the exporting pane to say which projects its filter keeps. */""","""    /**
     * The longest the page waits for the exporting pane to say which projects its filter keeps and
     * whether the strip shows its words.
     */""")
open(p,'w').write(s)
EOF
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npx prettier --write $(git status --short | awk '{print $2}' | grep -E '\.(ts|svelte)$'; echo src/lib/views/academic/present/parts/project/*.svelte src/lib/data/shapes/project-facts.ts src/lib/views/academic/present/screen/box.ts) >/dev/null && npx svelte-check --threshold error 2>&1 | tail -25
````

## Row 728 (402 characters in the report's table, 402 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && files=$( (git status --short --untracked-files=all | awk '{print $NF}'; ) | grep -E '\.(ts|svelte)$' | while read f; do [ -f "$f" ] && echo "$f"; done ); echo "$files"; npx prettier --write $files >/dev/null && npx svelte-check --threshold error 2>&1 | tail -25
````

## Row 732 (559 characters in the report's table, 559 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && SP=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad && git status --short --untracked-files=all | awk '{print $NF}' | grep -E '\.(ts|svelte)$' | while read f; do [ -f "$f" ] && echo "$f"; done > $SP/changed.txt; tr '\n' '\0' < $SP/changed.txt | xargs -0 npx prettier --write > /dev/null && echo formatted; npx svelte-check --threshold error 2>&1 | tail -25
````

## Row 747 (8488 characters in the report's table, 8488 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='tests/data/sources/present.test.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""        short: id,
        title: id,
        ...extra
    };
}""","""        short: id,
        title: id,
        facts: [],
        ...extra
    };
}""")
rep("""        expect(readHub(dir).findings).toEqual([]);
    });
});
""","""        expect(readHub(dir).findings).toEqual([]);
    });

    it("gives each slide the project of the deck whose file holds it, and fills {{project.<field>}} from that project's facts", () => {
        const dir = plantScratch('oculus-deck-facts-', {
            'projects/manuscripts/alpha/present/present.yml': [
                'deck: { title: Alpha }',
                'groups:',
                '    kin:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [beta]',
                'order: [main.md, { kind: summary, of: kin, title: Kin }]'
            ].join('\\n'),
            'projects/manuscripts/alpha/present/main.md': [
                '---',
                'kind: project',
                'title: "At {{project.venue}}"',
                'specs:',
                '  - { label: Venue, value: "{{project.venue}}" }',
                'notes: "Lead {{project.lead}}"',
                '---',
                '---',
                '',
                '# Text {{project.venue}}',
                '',
                'Lead {{project.lead}}, year {{ project.year }}, code `{{project.venue}}`.',
                '',
                '```',
                '{{project.venue}}',
                '```'
            ].join('\\n'),
            'projects/manuscripts/beta/present/present.yml': [
                'deck: { title: Beta }',
                'order: [main.md]'
            ].join('\\n'),
            'projects/manuscripts/beta/present/main.md':
                '# Beta\\n\\nVenue {{project.venue}}, {{project.nope}}, {{project.Venue}}.\\n',
            'deck/present.yml': [
                'deck: { title: Portfolio }',
                'groups:',
                '    project:',
                '        find: { folders: projects/*/*/present }',
                '        slides: [alpha]',
                'order:',
                '    - title.md',
                '    - { slides: project }',
                '    - { kind: summary, of: project, title: Overview }'
            ].join('\\n'),
            'deck/title.md': '# Portfolio\\n\\n{{project.count}} and {{project.venue}}\\n'
        });
        const facts = [
            { field: 'venue' as const, words: ['A*B_<x>'] },
            { field: 'lead' as const, words: ['Ann Example', 'Bo'] },
            { field: 'year' as const, words: ['2026'] }
        ];
        const reader = createReader({
            hub: { key: 'hub', dir },
            projects: [project('alpha', 'research', { facts }), project('beta', 'research')],
            domains: [],
            tagTones: {},
            frame: frameSetting(loadConfig(engineDir()).config),
            catalog: CATALOG
        });
        const escaped = 'A\\\\*B\\\\_\\\\<x\\\\>';
        const filled = {
            project: {
                title: 'At A*B_<x>',
                heading: `At ${escaped}`,
                spec: escaped,
                notes: 'Lead Ann Example, Bo'
            },
            text: {
                title: 'Text A*B_<x>',
                body: [
                    `# Text ${escaped}`,
                    '',
                    'Lead Ann Example, Bo, year 2026, code `A*B_<x>`.',
                    '',
                    '```',
                    'A*B_<x>',
                    '```'
                ].join('\\n')
            }
        };
        /** What a slide carries: its project, and its words where a placeholder may stand. */
        const carried = (slide: DeckSlide) => ({
            key: slide.key,
            project: slide.project,
            ...(slide.kind === 'project'
                ? {
                      title: slide.title,
                      heading: slide.slide.title,
                      spec: slide.slide.specs?.[0]?.value,
                      notes: slide.notes
                  }
                : {}),
            ...(slide.kind === 'text' ? { title: slide.title, body: slide.body } : {})
        });
        const beta = 'projects/manuscripts/beta/present/main.md';
        const rows: {
            row: string;
            path: string;
            slides: ReturnType<typeof carried>[];
            projects: string[];
            findings: [string, number | undefined, string][];
        }[] = [
            {
                row: "a deck that is no project's, placing a project deck and a summary of it",
                path: 'deck',
                slides: [
                    {
                        key: 'title.md#0',
                        project: undefined,
                        title: 'Portfolio',
                        body: '# Portfolio\\n\\n3 and {{project.venue}}'
                    },
                    { key: 'alpha/main.md#0', project: 'alpha', ...filled.project },
                    { key: 'alpha/main.md#1', project: 'alpha', ...filled.text },
                    { key: 'alpha/summary:kin', project: 'alpha' },
                    { key: 'summary:project', project: undefined }
                ],
                projects: ['alpha'],
                findings: [
                    [
                        'deck/title.md',
                        1,
                        "{{project.venue}} is in a deck that is no project's; it stays as written"
                    ]
                ]
            },
            {
                row: "a project's own deck, its summary of another project's deck its own",
                path: 'projects/manuscripts/alpha/present',
                slides: [
                    { key: 'main.md#0', project: 'alpha', ...filled.project },
                    { key: 'main.md#1', project: 'alpha', ...filled.text },
                    { key: 'summary:kin', project: 'alpha' }
                ],
                projects: ['alpha'],
                findings: []
            },
            {
                row: 'a field with no value, a name that is no field and one of another case',
                path: 'projects/manuscripts/beta/present',
                slides: [
                    {
                        key: 'main.md#0',
                        project: 'beta',
                        title: 'Beta',
                        body: '# Beta\\n\\nVenue , {{project.nope}}, {{project.Venue}}.'
                    }
                ],
                projects: ['beta'],
                findings: [
                    [
                        beta,
                        1,
                        '{{project.venue}} holds no value for the project beta; it is filled with nothing'
                    ],
                    [
                        beta,
                        1,
                        "{{project.nope}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
                    ],
                    [
                        beta,
                        1,
                        "{{project.Venue}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
                    ]
                ]
            }
        ];
        for (const one of rows) {
            const before = reader.findings().length;
            const deck = reader.read({ key: 'hub', dir }, one.path);
            expect(deck.slides.map(carried), one.row).toEqual(one.slides);
            expect(Object.keys(deck.projects), one.row).toEqual(one.projects);
            expect(
                deck.findings
                    .slice(before)
                    .map((found) => [found.file.slice(dir.length + 1), found.line, found.message]),
                one.row
            ).toEqual(one.findings);
        }
    });
});
""")
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/data/sources/present.test.ts 2>&1 | tail -60
````

## Row 751 (4636 characters in the report's table, 4636 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='tests/data/sources/present.test.ts'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1, a[:60]
    s=s.replace(a,b)
rep("""        const reader = createReader({
            hub: { key: 'hub', dir },
            projects: [project('alpha', 'research', { facts }), project('beta', 'research')],
            domains: [],
            tagTones: {},
            frame: frameSetting(loadConfig(engineDir()).config),
            catalog: CATALOG
        });
        const escaped""","""        const context = {
            hub: { key: 'hub', dir },
            projects: [project('alpha', 'research', { facts }), project('beta', 'research')],
            domains: [],
            tagTones: {},
            frame: frameSetting(loadConfig(engineDir()).config),
            catalog: CATALOG
        };
        const escaped""")
rep("""        const beta = 'projects/manuscripts/beta/present/main.md';
        const rows: {""","""        const beta = 'projects/manuscripts/beta/present/main.md';
        /** What a summary over beta's deck raises, since it reads beta's slides. */
        const betaFindings: [string, number | undefined, string][] = [
            [
                beta,
                1,
                '{{project.venue}} holds no value for the project beta; it is filled with nothing'
            ],
            [
                beta,
                1,
                "{{project.nope}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
            ],
            [
                beta,
                1,
                "{{project.Venue}} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written"
            ]
        ];
        const rows: {""")
rep("""                findings: [
                    [
                        'deck/title.md',
                        1,
                        "{{project.venue}} is in a deck that is no project's; it stays as written"
                    ]
                ]
            },""","""                findings: [
                    ...betaFindings,
                    [
                        'deck/title.md',
                        1,
                        "{{project.venue}} is in a deck that is no project's; it stays as written"
                    ]
                ]
            },""")
rep("""                projects: ['alpha'],
                findings: []
            },""","""                projects: ['alpha'],
                findings: betaFindings
            },""")
start=s.index("""                projects: ['beta'],
                findings: [""")
end=s.index("""        for (const one of rows) {
            const before""")
s=s[:start]+"""                projects: ['beta'],
                findings: betaFindings
            }
        ];
"""+s[end:]
rep("""        for (const one of rows) {
            const before = reader.findings().length;
            const deck = reader.read({ key: 'hub', dir }, one.path);
            expect(deck.slides.map(carried), one.row).toEqual(one.slides);
            expect(Object.keys(deck.projects), one.row).toEqual(one.projects);
            expect(
                deck.findings
                    .slice(before)
                    .map((found) => [found.file.slice(dir.length + 1), found.line, found.message]),
                one.row
            ).toEqual(one.findings);
        }""","""        const real = realpathSync(dir);
        for (const one of rows) {
            const deck = createReader(context).read({ key: 'hub', dir }, one.path);
            expect(deck.slides.map(carried), one.row).toEqual(one.slides);
            expect(Object.keys(deck.projects), one.row).toEqual(one.projects);
            const found = deck.findings.map((finding) => [
                relative(real, finding.file),
                finding.line,
                finding.message
            ]);
            expect(found.sort(), one.row).toEqual([...one.findings].sort());
        }""")
rep("""import { describe, expect } from 'vitest';""","""import { realpathSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect } from 'vitest';""")
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/data/sources/present.test.ts 2>&1 | tail -40
````

## Row 780 (842 characters in the report's table, 842 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && SP=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad && mkdir -p $SP/vocabcheck/hub/.oculus && printf 'scan:\n  - { dir: . }\nstages:\n  submitted: { label: "sent out", icon: brown, color: "#0ea5e9" }\n' > $SP/vocabcheck/hub/.oculus/config.yml && cat > $SP/vocabcheck/check.ts <<EOF
const { engineDir, loadConfig } = await import('$PWD/src/lib/data/sources/config.ts');
const loaded = loadConfig(engineDir(), { hub: '$SP/vocabcheck/hub' });
console.log(JSON.stringify(loaded.config.stages?.submitted ?? loaded.config.vocab?.stages?.submitted), Object.keys(loaded.config).slice(0,10));
EOF
node $SP/vocabcheck/check.ts; rm -rf $SP/vocabcheck
````

## Row 814 (8449 characters in the report's table, 8449 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='tests/routes/docs/deck.test.ts'
s=open(p).read()
def rep(a,b,c=1):
    global s
    assert s.count(a)==c, a[:60]
    s=s.replace(a,b)
rep("""            config: portfolioConfigFrom(loadConfig(engineDir()).config),
            projects: []
        }""","""            config: portfolioConfigFrom(loadConfig(engineDir()).config),
            projects: [],
            entities: () => null
        }""")
rep("""                config: portfolioConfigFrom(loaded.config, loaded.from),
                projects: []
            };""","""                config: portfolioConfigFrom(loaded.config, loaded.from),
                projects: [],
                entities: () => null
            };""")
rep("""import { it, plantScratch } from '../../fixtures/scratch.ts';""","""import type { Deck } from '../../../src/lib/data/model/index.ts';
import { factsWorkspace } from '../../fixtures/hubs/deck-hub.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';""")
s=s.rstrip('\n')
assert s.endswith('});')
s=s[:-3]+"""
    it("answers each project's facts in the words of the hub its deck is read under, and each slide's domain", async () => {
        const { source } = factsWorkspace();
        const read = async (root: string, path: string): Promise<Deck> =>
            (await ask(source, `root=${root}&path=${encodeURIComponent(path)}`).json()) as Deck;
        const research = { field: 'tier', words: ['Research'] };
        const rows: {
            row: string;
            root: string;
            path: string;
            projects: Record<string, unknown[]>;
            slides: [string, string | undefined][];
        }[] = [
            {
                row: 'a portfolio deck placing a deck with every field and a repository project',
                root: 'hub',
                path: 'deck',
                projects: {
                    hccnet: [
                        {
                            field: 'stage',
                            words: ['submitted / under review'],
                            keys: ['submitted']
                        },
                        { field: 'domain', words: ['Graph learning'], keys: ['hub:graphs'] },
                        {
                            field: 'pillars',
                            words: [
                                'Graph learning over evolving relational structure and streaming interaction data'
                            ]
                        },
                        { field: 'datasets', words: ['synthgraph'] },
                        { field: 'lead', words: ['Dr. Dana Example', 'B. Coauthor'] },
                        {
                            field: 'collaborators',
                            words: ['C. Senior', 'B. Colleague', 'Ana Rivera']
                        },
                        { field: 'year', words: ['2026'] },
                        { field: 'venue', words: ['A*B_<x>'] },
                        { field: 'funding', words: ['ecf'] },
                        { field: 'compute', words: ['Demo cluster'], keys: ['cluster'] },
                        { field: 'code', words: ['deposited'] },
                        research
                    ],
                    kit: [
                        {
                            field: 'stage',
                            words: ['submitted / under review'],
                            keys: ['submitted']
                        },
                        { field: 'lead', words: ['Dr. Dana Example'] },
                        research
                    ]
                },
                slides: [
                    ['title.md#0', undefined],
                    ['hccnet/main.md#0', 'hccnet'],
                    ['kit/main.md#0', 'kit']
                ]
            },
            {
                row: 'a project deck with a few fields',
                root: 'hub',
                path: 'projects/ideas/quantum/present',
                projects: {
                    quantum: [
                        { field: 'stage', words: ['nascent (concept)'], keys: ['nascent'] },
                        {
                            field: 'domain',
                            words: ['Methods (domain-agnostic)'],
                            keys: ['hub:method']
                        },
                        {
                            field: 'pillars',
                            words: [
                                'Graph learning over evolving relational structure and streaming interaction data',
                                'Structured tensor methods'
                            ]
                        },
                        { field: 'lead', words: ['Dr. Dana Example'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'quantum']]
            },
            {
                row: 'a failed project',
                root: 'hub',
                path: 'projects/archive/failedp/present',
                projects: {
                    failedp: [
                        { field: 'stage', words: ['failed (no-go or disproved)'], keys: ['failed'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'failedp']]
            },
            {
                row: 'a stopped project',
                root: 'hub',
                path: 'projects/archive/stoppedp/present',
                projects: {
                    stoppedp: [
                        {
                            field: 'stage',
                            words: ['stopped (dropped or abandoned)'],
                            keys: ['stopped']
                        },
                        research
                    ]
                },
                slides: [['main.md#0', 'stoppedp']]
            },
            {
                row: 'a person and a venue no registry holds, a person with no name and a reproduction with a note alone',
                root: 'hub',
                path: 'projects/manuscripts/ghost/present',
                projects: {
                    ghost: [
                        { field: 'stage', words: ['exploring'], keys: ['exploring'] },
                        { field: 'lead', words: ['Dr. Dana Example', 'nameless'] },
                        { field: 'reproduced', words: ['reproduced'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'ghost']]
            },
            {
                row: 'empty values',
                root: 'hub',
                path: 'projects/manuscripts/empty/present',
                projects: {
                    empty: [{ field: 'stage', words: ['exploring'], keys: ['exploring'] }, research]
                },
                slides: [['main.md#0', 'empty']]
            },
            {
                row: "a deck in a second hub's root, in that hub's words",
                root: 'lab',
                path: 'projects/manuscripts/labp/present',
                projects: {
                    labp: [
                        { field: 'stage', words: ['sent out'], keys: ['submitted'] },
                        { field: 'lead', words: ['Dana of Lab'] },
                        research
                    ]
                },
                slides: [['main.md#0', 'labp']]
            }
        ];
        for (const one of rows) {
            const deck = await read(one.root, one.path);
            expect(deck.projects, one.row).toEqual(one.projects);
            expect(
                deck.slides.map((slide) => [slide.key, slide.project]),
                one.row
            ).toEqual(one.slides);
        }
        const graphs = await read('hub', 'projects/active/graph-bandits/present');
        const domains = graphs.slides.map((slide) => (slide.kind === 'project' ? slide.domain : null));
        expect(domains, 'a project slide of a project with a domain').toContain('hub:graphs');
        expect(
            graphs.findings.filter((one) => one.message.includes('domains registry')),
            'a domain the registry holds'
        ).toEqual([]);
    });
});
"""
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/routes/docs/deck.test.ts 2>&1 | grep -v "^$" | tail -60
````

## Row 818 (598 characters in the report's table, 598 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && grep -rn "collaborators" src/lib/data/snapshot/*.ts | grep -i "sort" | head -3; python3 - <<'EOF'
p='tests/routes/docs/deck.test.ts'
s=open(p).read()
a="""                            words: ['C. Senior', 'B. Colleague', 'Ana Rivera']"""
assert s.count(a)==1
s=s.replace(a,"""                            words: ['B. Colleague', 'C. Senior', 'Ana Rivera']""")
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/routes/docs/deck.test.ts 2>&1 | grep -v "^$" | tail -40
````

## Row 829 (4402 characters in the report's table, 4402 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/data/model/model-deck.ts'
s=open(p).read()
a=" * One field of a project that holds a value: its words, in the manifest's order. The form, the"
assert s.count(a)==1
s=s.replace(a," * One field of a project that holds a value: its words, in the order the project lists them. The form, the")
open(p,'w').write(s)
EOF
cat > tests/data/hubs/deck-facts.test.ts <<'EOF'
// Layer 1, data tests. The snapshot build's read of a hub's decks (data/index.ts `decks()`): the
// findings a slide's `{{project.<field>}}` raises, which the Findings view lists, are the ones the
// deck route's read of the same deck raises. The workspace is planted in a temporary directory
// (tests/fixtures/hubs/deck-hub.ts); nothing outside it is read or written.
// @module-tag slow: it builds two copies of the demo hub.

import { relative } from 'node:path';
import { describe, expect } from 'vitest';
import { readDeck } from '../../../src/lib/server/content/deck/read.ts';
import { factsWorkspace } from '../../fixtures/hubs/deck-hub.ts';
import { it } from '../../fixtures/scratch.ts';

describe("the snapshot build's read of the decks", () => {
    it('raises for each {{project.<field>}} the finding the deck route raises, and none for a field with a value', () => {
        const { hub, findings, source } = factsWorkspace();
        const placeholder = (message: string) => message.startsWith('{{project.');
        const built = findings
            .filter((one) => placeholder(one.message))
            .map((one) => `${relative(hub, one.file)}:${String(one.line)} ${one.message}`)
            .sort();
        const rows = [
            {
                row: 'a project whose venue holds a value',
                path: 'projects/manuscripts/hccnet/present',
                findings: [] as string[],
                title: 'At A*B_<x>'
            },
            {
                row: 'a project with no venue',
                path: 'projects/ideas/quantum/present',
                findings: [
                    'projects/ideas/quantum/present/main.md:1 {{project.venue}} holds no value for the project quantum; it is filled with nothing'
                ],
                title: 'Quantum'
            },
            {
                row: 'a project whose venue no registry holds',
                path: 'projects/manuscripts/ghost/present',
                findings: [
                    'projects/manuscripts/ghost/present/main.md:1 {{project.venue}} holds no value for the project ghost; it is filled with nothing'
                ],
                title: 'Ghost'
            },
            {
                row: 'a project with empty values',
                path: 'projects/manuscripts/empty/present',
                findings: [
                    'projects/manuscripts/empty/present/main.md:1 {{project.lead}} holds no value for the project empty; it is filled with nothing',
                    'projects/manuscripts/empty/present/main.md:1 {{project.venue}} holds no value for the project empty; it is filled with nothing',
                    'projects/manuscripts/empty/present/main.md:1 {{project.year}} holds no value for the project empty; it is filled with nothing'
                ],
                title: 'Empty'
            }
        ];
        for (const one of rows) {
            const deck = readDeck(source, 'hub', one.path);
            if (deck === 'outside') throw new Error(`${one.path} is outside`);
            const read = deck.findings
                .filter((found) => placeholder(found.message))
                .map((found) => `${relative(hub, found.file)}:${String(found.line)} ${found.message}`)
                .sort();
            expect(read, one.row).toEqual(one.findings);
            expect(
                built.filter((line) => line.startsWith(one.path)),
                one.row
            ).toEqual(one.findings);
            expect(deck.slides[0]?.title, one.row).toBe(one.title);
        }
    });
});
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx prettier --write tests/data/hubs/deck-facts.test.ts tests/fixtures/hubs/deck-hub.ts tests/routes/docs/deck.test.ts tests/data/sources/present.test.ts src/lib/data/model/model-deck.ts >/dev/null; npx vitest run tests/data/hubs/deck-facts.test.ts 2>&1 | grep -v "^$" | tail -40
````

## Row 835 (1563 characters in the report's table, 1563 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='tests/data/hubs/deck-facts.test.ts'
s=open(p).read()
s=s.replace("import { relative } from 'node:path';\n","")
s=s.replace("""        const { hub, findings, source } = factsWorkspace();
        const placeholder = (message: string) => message.startsWith('{{project.');""","""        const { findings, source } = factsWorkspace();
        const placeholder = (message: string) => message.startsWith('{{project.');
        /** A finding as its place in the hub `hub` and its message; the deck route names real paths. */
        const line = (found: { file: string; line?: number; message: string }) =>
            `${found.file.slice(found.file.lastIndexOf('/hub/') + 5)}:${String(found.line)} ${found.message}`;""")
s=s.replace("""            .map((one) => `${relative(hub, one.file)}:${String(one.line)} ${one.message}`)""","""            .map(line)""")
s=s.replace("""                .map((found) => `${relative(hub, found.file)}:${String(found.line)} ${found.message}`)""","""                .map(line)""")
s=s.replace("""                built.filter((line) => line.startsWith(one.path)),""","""                built.filter((held) => held.startsWith(one.path)),""")
open(p,'w').write(s)
EOF
grep -n "relative\|hub, " tests/data/hubs/deck-facts.test.ts; export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx prettier --write tests/data/hubs/deck-facts.test.ts >/dev/null; npx vitest run tests/data/hubs/deck-facts.test.ts 2>&1 | grep -v "^$" | tail -30
````

## Row 838 (595 characters in the report's table, 595 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
import re
p='tests/data/hubs/deck-facts.test.ts'
s=open(p).read()
s=re.sub(r"\.map\(\s*\(found\) => `\$\{relative\(hub, found\.file\)\}:\$\{String\(found\.line\)\} \$\{found\.message\}`\s*\)", ".map(line)", s)
open(p,'w').write(s)
EOF
grep -n "relative" tests/data/hubs/deck-facts.test.ts; export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx prettier --write tests/data/hubs/deck-facts.test.ts >/dev/null; npx vitest run tests/data/hubs/deck-facts.test.ts 2>&1 | grep -v "^$" | tail -30
````

## Row 845 (604 characters in the report's table, 604 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='tests/checks/config/integrity.test.ts'
s=open(p).read()
a="""        short: project.short ?? '',
        title: project.title
    }));"""
assert s.count(a)==1
s=s.replace(a,"""        short: project.short ?? '',
        title: project.title,
        facts: []
    }));""")
open(p,'w').write(s)
EOF
grep -n "deckProjects\|What the deck reader needs" tests/checks/config/integrity.test.ts | head; export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx svelte-check --threshold error 2>&1 | tail -4
````

## Row 849 (603 characters in the report's table, 603 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && sed -i '' 's#^/\*\* What the deck reader needs of a project of the snapshot. \*/#/** What the deck reader needs of a project of the snapshot, with no facts: no equation reads them. */#' tests/checks/config/integrity.test.ts && sed -n 87p tests/checks/config/integrity.test.ts && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/checks/config/integrity.test.ts tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/data/hubs/deck-facts.test.ts 2>&1 | grep -v "^$" | tail -8
````

## Row 857 (1997 characters in the report's table, 1997 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='docs/HELP.md'
s=open(p).read()
a="""    - An entry that places no slide is a placeholder tile naming what is wrong; a deck that draws no slide is a title tile.
"""
assert s.count(a)==1
s=s.replace(a,a+"""    - A slide of a project's deck carries a strip of the project's facts at its foot, in the pane, the presenter screen, the Overview's tiles, the audience window and the PDF: each of form, stage, status chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced and tier that holds a value, as a labelled chip in the words and hues of the project card, the stage as it is (`failed` and `stopped` included), on two lines at most, a chip too long for its room cut with an ellipsis.
    - The Project facts toggle in the toolbar, drawn while the slide on screen comes from a project's deck, shows or hides the strip's words in the pane and its presenter screen, audience window and PDF. It is on by default, kept with the pane and when it opens another deck. The strip keeps its room while hidden, so the slide's layout and its Too tall finding do not change with the toggle.
    - `{{project.<field>}}` in a slide's text, front matter included, is filled from the manifest of the project whose deck holds the slide, in the strip's words, a list's joined with ", ": the fields are `form`, `stage`, `chips`, `domain`, `pillars`, `datasets`, `lead`, `supervisors`, `collaborators`, `year`, `venue`, `funding`, `compute`, `code`, `reproduced` and `tier`, spaces inside the braces allowed. A field with no value is filled with nothing, and a name that is no field (`{{project.Venue}}` among them) or a placeholder in a deck that is no project's stays as written; each is a finding of the slide's file. `{{project.count}}` stays the count of a group named `project`.
""")
open(p,'w').write(s)
EOF
grep -n "Project facts toggle" docs/HELP.md | head -2
````

## Row 864 (1545 characters in the report's table, 1545 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/state/life/present.ts'
s=open(p).read()
pairs=[("""// with their words, the groups with their members. What is here is the pane's own state (the
// slide it is on, whether its grid is open, the decks it has shown and its filter's picks), the""","""// with their words, the groups with their members. What is here is the pane's own state (the
// slide it is on, whether its grid is open, the decks it has shown, its filter's picks and its
// Project facts toggle), the"""),
("""/** What one Present pane holds of its own: its place in the deck it shows and its history. */""","""/**
 * What one Present pane holds of its own: its place in the deck it shows, its history, its filter
 * and its Project facts toggle.
 */"""),
(""" * A pane's own state after it leaves the deck it showed (`shown`, null when none is resolved) for
 * `next`: the first slide, the grid closed, no filter, since its picks are values of the members
 * of the deck it left, and that deck remembered.""",""" * A pane's own state after it leaves the deck it showed (`shown`, null when none is resolved) for
 * `next`: the first slide, the grid closed, no filter, since its picks are values of the members
 * of the deck it left, and that deck remembered. The Project facts toggle is a setting of the pane
 * and stays as it was.""")]
for a,b in pairs:
    assert s.count(a)==1,a[:50]
    s=s.replace(a,b)
open(p,'w').write(s)
EOF
sed -n 1,12p src/lib/state/life/present.ts
````

## Row 867 (1456 characters in the report's table, 1456 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && python3 - <<'EOF'
p='src/lib/state/life/present.ts'
s=open(p).read()
a="""// A deck is read by the server (data/sources/deck/read.ts) and arrives whole: the slides in order
// with their words, the groups with their members. What is here is the pane's own state (the
// slide it is on, whether its grid is open, the decks it has shown, its filter's picks and its
// Project facts toggle), the
// deck a tab's layout state names, the moves over a deck's slides, the frame the slides are laid
// out in, and the one hue a slide's status tag wears."""
b="""// A deck is read by the server (data/sources/deck/read.ts) and arrives whole: the slides in order
// with their words, the groups with their members, the facts of each project a slide comes from.
// What is here is the pane's own state (the slide it is on, whether its grid is open, the decks it
// has shown, its filter's picks and its Project facts toggle), the deck a tab's layout state
// names, the moves over a deck's slides, the frame the slides are laid out in, and the one hue a
// slide's status tag wears."""
assert s.count(a)==1
s=s.replace(a,b)
open(p,'w').write(s)
EOF
export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx prettier --check $(cat /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/changed.txt | tr '\n' ' ') 2>&1 | tail -3
````

## Row 878 (657 characters in the report's table, 657 here)

````
SP=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; WT=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148; BASE=/Users/axelfaes/workspace/oculus/.agents/worktrees/O148-base; rm -rf $SP/basetree && mkdir -p $SP/basetree && cd $WT && for f in package.json package-lock.json tsconfig.json vite.config.ts eslint.config.js utils assets .svelte-kit svelte.config.js; do [ -e "$f" ] && cp -R "$f" $SP/basetree/; done; ls -a $WT | head -30; cp -R $BASE/src $BASE/config $SP/basetree/ && cp -R $WT/tests $SP/basetree/ && ln -s $WT/node_modules $SP/basetree/node_modules && ls $SP/basetree
````

## Row 886 (471 characters in the report's table, 471 here)

````
SP=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; cd $SP/basetree && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH; npx vitest run tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/data/hubs/deck-facts.test.ts -t "project|facts|placeholder" > $SP/base-tests.txt 2>&1; grep -n "AssertionError" $SP/base-tests.txt; grep -n "ERROR\|error" $SP/base-tests.txt | head -3
````

## Row 890 (242 characters in the report's table, 242 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npm run diagrams 2>&1 | tail -5 && npm run docs:palette 2>&1 | tail -5; git status --short | head -50
````

## Row 998 (808 characters in the report's table, 808 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; { git diff -U0 -- src tests config docs/HELP.md | grep -E '^\+' | grep -v '^+++'; for f in src/lib/data/shapes/project-facts.ts src/lib/views/academic/present/parts/project/Facts.svelte src/lib/views/academic/present/parts/project/Project.svelte src/lib/views/academic/present/screen/box.ts tests/data/hubs/deck-facts.test.ts tests/fixtures/hubs/deck-hub.ts; do sed "s|^|+$f: |" "$f"; done; } > $S/added.txt; wc -l $S/added.txt; grep -nE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b|\b[A-Z][0-9]{1,3}[a-z]?\b|20[0-9]{2}-[0-9]{2}" $S/added.txt
````

## Row 1070 (484 characters in the report's table, 484 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && sh utils/unused-exports.sh > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unused-after.txt 2>&1; echo "exit $?"; diff ../O148-base/unused-exports.txt /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/unused-after.txt
````

## Row 1119 (234 characters in the report's table, 234 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npm run diagrams 2>&1 | tail -5; npm run docs:palette 2>&1 | tail -3; git status --short docs
````

## Row 1147 (376 characters in the report's table, 376 here)

````
cd /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/cases && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && node cases.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 > final-run.txt 2>&1; echo "exit $?"; wc -l final-run.txt; diff after-run.txt final-run.txt && echo SAME
````

## Row 1170 (444 characters in the report's table, 444 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npm run test:quick > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-quick.txt 2>&1; echo "exit $?"; tail -40 /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-quick.txt
````

## Row 1415 (833 characters in the report's table, 833 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && { git diff --name-only --diff-filter=AM -- src tests; git ls-files --others --exclude-standard -- src tests; } | grep -E '\.(ts|svelte)$' > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-changed.txt; xargs npx prettier --check < /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-changed.txt 2>&1 | tail -3; xargs npx eslint < /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-changed.txt 2>&1 | tail -10; echo "eslint exit ${PIPESTATUS[0]}"; npx svelte-check --threshold error 2>&1 | tail -1
````

## Row 1423 (854 characters in the report's table, 854 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; npm run diagrams > $S/O148-diagrams.txt 2>&1; echo "diagrams exit $?"; npm run docs:palette > $S/O148-palette.txt 2>&1; echo "palette exit $?"; sh utils/unused-exports.sh > $S/unused-after.txt 2>&1; echo "unused exit $?"; diff ../O148-base/unused-exports.txt $S/unused-after.txt; echo "diff exit $?"; LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name local.yml); echo "gate exit $?"; sh utils/folder-check.sh; echo "folder exit $?"; git status --short docs
````

## Row 1431 (309 characters in the report's table, 309 here)

````
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O148 && export PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH && npm run test:quick > /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O148-quick2.txt 2>&1; echo "exit $?"
````

## Row 1496 (319 characters in the report's table, 319 here)

````
S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad; rm -rf $S/cases $S/basetree $S/changed.txt $S/added.txt $S/unused-after.txt $S/O148-changed.txt $S/O148-diagrams.txt $S/O148-palette.txt; ls -d $S/cases $S/basetree 2>&1; ls $S | grep -i "O148\|base-tests"
````
