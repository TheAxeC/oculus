// Layer 1, data. Reads a project's PRESENT.md into the slides of the public deck, and checks the
// deck's own order against them. Server side only: it reads the filesystem and no client module may
// import it.
//
// A PRESENT.md is a YAML front matter and a markdown body. The front matter's `present:` map is the
// project's own slide and its `slides:` list holds the further slides of the same project, each with
// an `id:` of its own; a file with neither still yields one slide, carrying the body, so a project
// that has written only the narrative is in the deck rather than missing from it. A file that
// declared a slide leaves its body on disk: that slide is what the deck draws, and the narrative
// would be the one long document in a snapshot that carries none.
//
// Nothing here throws and nothing is repaired: a file that cannot be read, a slide id used twice and
// a figure that names no file are each a Finding, and the rest of the file still reaches the deck.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRESENT_DOC } from '../helpers/deck.ts';
import { byKey, fields, isMap, str, strings } from '../helpers/guards.ts';
import { findingText, type TextCatalog } from '../helpers/finding-text.ts';
import { readFrontmatter, splitFrontmatter } from './docs.ts';
import type {
    Finding,
    Id,
    PresentEli5,
    PresentPanel,
    PresentSlide,
    PresentSpec,
    PresentTag
} from '../model.ts';

export { PRESENT_DOC };

/**
 * The folder a project's slide figures live in; the file itself is data/helpers/deck.ts's
 * PRESENT_DOC.
 */
export const PRESENT_DIR = 'present';

/** The heading the deck strips off the body, so the narrative starts at its first paragraph. */
const BODY_HEADING = /^\s*#\s*PRESENT\b.*?(\n|$)/;

/** The suffixes that make an `equation:` the name of a rendered image rather than LaTeX text. */
export const IMAGE_SUFFIXES = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

/**
 * Whether an `equation:` names an image file. A value ending in an image suffix is a file rendered
 * elsewhere, which this reader resolves against the disk; anything else is LaTeX the page typesets.
 */
export function equationIsImage(equation: string): boolean {
    const lowered = equation.toLowerCase();
    return IMAGE_SUFFIXES.some((suffix) => lowered.endsWith(suffix));
}

/** The kinds of deck-level slide, and whether each names a ref. `project` is a project's own. */
const DECK_KINDS: Record<string, 'none' | 'framing' | 'summaries'> = {
    title: 'none',
    closing: 'none',
    ideas: 'none',
    framing: 'framing',
    summary: 'summaries'
};

function isFile(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/** The `tag:` map, or nothing when the slide declares none. */
function tag(value: unknown): PresentTag | undefined {
    if (!isMap(value)) return undefined;
    const held: PresentTag = {};
    const name = str(value.class);
    const text = str(value.text);
    if (name !== undefined) held.class = name;
    if (text !== undefined) held.text = text;
    return Object.keys(held).length === 0 ? undefined : held;
}

/** The `eli5:` callout, or nothing when the slide declares none. */
function eli5(value: unknown): PresentEli5 | undefined {
    if (!isMap(value)) return undefined;
    const held: PresentEli5 = {};
    const purpose = str(value.purpose);
    const plain = str(value.plain);
    if (purpose !== undefined) held.purpose = purpose;
    if (plain !== undefined) held.plain = plain;
    return Object.keys(held).length === 0 ? undefined : held;
}

/** The `specs:` chips. An entry missing either half carries the empty string for it. */
function specs(value: unknown): PresentSpec[] {
    if (!Array.isArray(value)) return [];
    const held: PresentSpec[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        held.push({ label: str(item.label) ?? '', value: str(item.value) ?? '' });
    }
    return held;
}

/** The `panels:` visuals, each a figure name or inline diagram markup with its words. */
function panels(value: unknown): PresentPanel[] {
    if (!Array.isArray(value)) return [];
    const held: PresentPanel[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        const panel: PresentPanel = {};
        const figure = str(item.figure);
        const diagram = str(item.diagram_html);
        const caption = str(item.caption);
        const explain = str(item.explain);
        if (figure !== undefined) panel.figure = figure;
        if (diagram !== undefined) panel.diagramHtml = diagram;
        if (caption !== undefined) panel.caption = caption;
        if (explain !== undefined) panel.explain = explain;
        if (Object.keys(panel).length > 0) held.push(panel);
    }
    return held;
}

/** One slide out of one front-matter map, under the id the caller minted for it. */
function slide(id: Id, projectId: Id, value: Record<string, unknown>): PresentSlide {
    const built: PresentSlide = {
        id,
        projectId,
        specs: specs(value.specs),
        panels: panels(value.panels),
        method: strings(value.method),
        results: strings(value.results)
    };
    const chip = tag(value.tag);
    const plain = eli5(value.eli5);
    const title = str(value.title);
    const sub = str(value.sub);
    const hook = str(value.hook);
    const equation = str(value.equation);
    if (chip !== undefined) built.tag = chip;
    if (title !== undefined) built.title = title;
    if (sub !== undefined) built.sub = sub;
    if (hook !== undefined) built.hook = hook;
    if (plain !== undefined) built.eli5 = plain;
    if (equation !== undefined) built.equation = equation;
    return built;
}

/** Where a project's PRESENT.md sits, and where the deck keeps its rendered equation images. */
export type PresentPaths = {
    /** Absolute path of the research hub. */
    hub: string;
    /** The project's folder relative to the hub, which is what a resolved path is built from. */
    folder: string;
    /** The deck's `equations_dir`, hub-relative; empty when the deck names none. */
    equationsDir: string;
};

/** A hub-relative path with forward slashes, whatever the platform's separator is. */
function hubPath(parts: string[]): string {
    return parts.filter((part) => part !== '').join('/');
}

/**
 * The file an `equation:` naming an image resolves to, hub-relative, and nothing when neither place
 * holds it. The shared folder is tried first and the project's own `present/` second, which is the
 * order a slide's author may rely on: an equation rendered for the whole deck wins over a name a
 * project happens to reuse.
 */
function equationPath(paths: PresentPaths, name: string): string | undefined {
    const shared = hubPath([paths.equationsDir, name]);
    if (paths.equationsDir !== '' && existsSync(join(paths.hub, shared))) return shared;
    const own = hubPath([paths.folder, PRESENT_DIR, name]);
    return existsSync(join(paths.hub, own)) ? own : undefined;
}

/**
 * Resolve one slide's files against the disk: the figure of every panel, and the equation when it
 * names an image rather than LaTeX. A panel whose figure is not there is marked so the view draws
 * the gap rather than a dead image, and every miss is a finding.
 */
function resolveFiles(
    slide: PresentSlide,
    paths: PresentPaths,
    file: string,
    catalog: TextCatalog,
    findings: Finding[]
) {
    for (const panel of slide.panels) {
        if (panel.figure === undefined) continue;
        if (existsSync(join(paths.hub, paths.folder, PRESENT_DIR, panel.figure))) continue;
        panel.missing = true;
        findings.push({
            file,
            key: slide.id,
            message: findingText(
                catalog,
                'findings.present.figure_missing',
                panel.figure,
                PRESENT_DIR
            )
        });
    }
    if (slide.equation === undefined || !equationIsImage(slide.equation)) return;
    const found = equationPath(paths, slide.equation);
    if (found !== undefined) {
        slide.equationImage = found;
        return;
    }
    slide.equationMissing = true;
    findings.push({
        file,
        key: slide.id,
        message: findingText(
            catalog,
            'findings.present.equation_missing',
            slide.equation,
            PRESENT_DIR
        )
    });
}

/** The deck-level keys a project slide id may not be, since the two share one key space. */
const RESERVED = ['title', 'closing', 'ideas'];

/** Whether a project slide's id would be read as a deck-level slide's key. */
function collides(id: string): boolean {
    return RESERVED.includes(id) || id.startsWith('framing:') || id.startsWith('summary:');
}

/**
 * The slides one project's PRESENT.md declares, in file order, and what was wrong with it.
 *
 * A folder with no PRESENT.md has no slides and no findings, which is most of the hub. A front
 * matter block that does not parse is a finding and the file still yields its narrative slide, so a
 * YAML typo costs the rich slide and never the project's place in the deck.
 */
export function readPresent(
    paths: PresentPaths,
    id: Id,
    catalog: TextCatalog
): { slides: PresentSlide[]; findings: Finding[] } {
    const folder = join(paths.hub, paths.folder);
    const file = join(folder, PRESENT_DOC);
    if (!isFile(file)) return { slides: [], findings: [] };

    let text: string;
    try {
        text = readFileSync(file, 'utf8');
    } catch {
        const message = findingText(catalog, 'findings.present.unreadable');
        return { slides: [], findings: [{ file, key: '', message }] };
    }

    const findings: Finding[] = [];
    const split = splitFrontmatter(text);
    let front: Record<string, unknown> = {};
    if (split.block !== null) {
        const read = readFrontmatter(split.block, file, catalog);
        if ('message' in read) findings.push(read);
        else front = read.frontmatter;
    }

    const slides: PresentSlide[] = [];
    const seen = new Set<string>();

    const own = front.present;
    if (isMap(own)) slides.push(slide(id, id, own));

    const more = Array.isArray(front.slides) ? front.slides : [];
    for (const [at, item] of more.entries()) {
        if (!isMap(item)) continue;
        const slug = str(item.id);
        if (slug === undefined || slug === '') {
            findings.push({
                file,
                key: `slides[${at}]`,
                message: findingText(catalog, 'findings.present.slide_no_id')
            });
            continue;
        }
        slides.push(slide(`${id}/${slug}`, id, item));
    }

    // A file that declares no slide is the narrative alone, which is the one slide it still draws.
    // A file that declared one leaves its narrative on disk: the deck draws the front matter, and
    // the body would be the one long document in a snapshot that carries none.
    if (slides.length === 0) {
        slides.push({
            id,
            projectId: id,
            specs: [],
            panels: [],
            method: [],
            results: [],
            body: split.body.replace(BODY_HEADING, '')
        });
    }

    const kept: PresentSlide[] = [];
    for (const one of slides) {
        if (seen.has(one.id)) {
            findings.push({
                file,
                key: 'slides',
                message: findingText(catalog, 'findings.present.slide_twice', one.id)
            });
            continue;
        }
        seen.add(one.id);
        kept.push(one);
        resolveFiles(one, paths, file, catalog, findings);
    }

    return { slides: kept, findings };
}

/**
 * What is wrong with the deck's own order: an entry naming no kind or a kind the deck has no slide
 * of, a framing or summary entry naming a key the deck lacks, a project entry naming no slide at
 * all, and a project slide whose id is a deck-level key. A project entry naming a slide this hub
 * does not hold is not one of them, and neither is a saved `selection:` or `slide_order:` naming
 * one: all three are written over one hub and read over whatever the hub holds now, so a key for a
 * slide that is gone places nothing rather than failing the deck.
 */
export function deckFindings(
    deck: unknown,
    slideIds: Iterable<string>,
    file: string,
    catalog: TextCatalog
): Finding[] {
    const known = new Set(slideIds);
    const map = fields(deck);
    const findings: Finding[] = [];
    // A project slide is named by its bare id and a deck slide by its kind, so a project called
    // `title` would be placed as the deck's opening slide and never as its own.
    for (const id of [...known].sort()) {
        if (!collides(id)) continue;
        findings.push({
            file,
            key: 'deck',
            message: findingText(catalog, 'findings.present.slide_is_deck_key', id)
        });
    }
    const raw = Array.isArray(map.order) ? map.order : [];
    for (const [at, item] of raw.entries()) {
        const key = `deck.order[${at}]`;
        if (!isMap(item)) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.file.not_a_map')
            });
            continue;
        }
        const kind = str(item.slide);
        const ref = str(item.ref);
        if (kind === undefined) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.present.order_no_kind')
            });
            continue;
        }
        // A project entry naming a slide this hub does not declare places nothing and is not a
        // finding: the order is written over one hub and read over whatever the hub holds now, the
        // same ground the saved selection stands on. An entry naming no slide at all is a finding,
        // because it says nothing a hub could answer.
        if (kind === 'project') {
            if (ref === undefined) {
                findings.push({
                    file,
                    key,
                    message: findingText(catalog, 'findings.present.order_no_project')
                });
            }
            continue;
        }
        const owner = byKey(DECK_KINDS, kind);
        if (owner === undefined) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.present.order_unknown_kind', kind)
            });
            continue;
        }
        if (owner === 'none') continue;
        if (ref === undefined) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.present.order_no_ref', kind)
            });
            continue;
        }
        if (byKey(fields(map[owner]), ref) === undefined) {
            findings.push({
                file,
                key,
                message: findingText(catalog, 'findings.present.order_ref_missing', owner, ref)
            });
        }
    }
    return findings;
}
