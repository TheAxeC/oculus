// Layer 4, view test. Which of a project card's marks wear the capsule. The status words and the
// project type are chips; everything else the card lists, its domain, its deadline, its code state,
// its compute and its cross-link entries, is a tag in the muted text colour; the one other chip is
// a control (a filter toggle, a pill that opens something), which carries no tone. The rule is
// asserted off one rendered card rather than left to each view's own test, so a mark that gains a
// capsule somewhere fails here.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import ProjectCard from '../../../src/lib/views/shared/card/ProjectCard.svelte';
import type { BoardItem } from '../../../src/lib/state/boards/board/index.ts';
import type { Project } from '../../../src/lib/data/model/index.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import {
    chipLabel,
    setVocab,
    statusTone,
    typeTone
} from '../../../src/lib/state/shared/words/tones.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { treeFiles } from '../../checks/walk.ts';
import { fixtureProject } from '../../fixtures/entities-fixture.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

/** The status the card carries, which is a key of the configured legend. */
const STATUS = 'submitted';
const TYPE = 'manuscript';
const DATASET = 'DATA-ONE';
const DOMAIN = 'Cardiology';

function project(): Project {
    return fixtureProject({
        id: 'one',
        title: 'One',
        tier: 'manuscripts',
        type: TYPE,
        chips: [STATUS],
        datasetIds: ['data-one'],
        folder: 'projects/manuscripts/one',
        file: 'projects/manuscripts/one/project.yml'
    });
}

function item(): BoardItem {
    return {
        id: 'one',
        project: project(),
        tone: typeTone(TYPE),
        domain: { id: 'cardio', label: DOMAIN, tone: 'teal' },
        venue: null,
        pillars: [],
        funding: [],
        datasets: [{ id: 'data-one', label: DATASET }],
        collaborators: [],
        software: [],
        authors: '',
        bucket: '',
        code: 'public',
        compute: [{ id: 'this-mac', label: 'This Mac', kind: 'machine', order: 1 }],
        reproduced: true,
        year: '',
        sessions: 'none',
        chips: [STATUS],
        haystack: ''
    };
}

function card(): string {
    return render(ProjectCard, {
        context: clientContext(client),
        props: {
            item: item(),
            open: false,
            cursor: false,
            label: 'One',
            tab: 'One',
            now: Date.parse('2026-09-15T00:00:00Z'),
            staleLag: 30,
            onsaid: noop
        }
    }).body;
}

/** Which of the two primitives the mark carrying these words is drawn by, read off its class. */
function primitiveOf(body: string, words: string): string {
    const at = body.indexOf(`>${words}</span>`);
    expect(at, words).toBeGreaterThan(-1);
    const chip = body.lastIndexOf('class="chip ', at);
    const tag = body.lastIndexOf('class="tag ', at);
    expect(Math.max(chip, tag), words).toBeGreaterThan(-1);
    return chip > tag ? 'chip' : 'tag';
}

const LIB = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', 'src', 'lib');

/**
 * The tone expressions a chip may be given at its own call site. A status word is toned by its own
 * status and the type pill by its type; `item.tone` is the board item's type tone, which
 * state/boards/board/items.ts reads with typeTone(); `badge.tone` is the hue a view registration's
 * badge hook names for the state it marks.
 */
const CHIP_TONES = ['statusTone(', 'typeTone(', 'item.tone', 'badge.tone'];

/**
 * The one helper a file may tone its chips through instead: the gallery hands each chip a tone it
 * derived from the chip vocabulary, and state/shared/words/tones.ts chipTone() is typeTone()
 * falling back to statusTone().
 */
const TONE_HELPER = 'chipTone(';

function svelteFiles(at: string): string[] {
    return treeFiles(at).filter((rel) => rel.endsWith('.svelte'));
}

/** Every `<Chip ... />` in one file, with the braces inside it balanced. */
export function chipTags(source: string): string[] {
    return balancedTags(source, /<Chip\b/g);
}

/** Every tag one pattern opens, from its name to the `/>` that closes it outside every brace. */
function balancedTags(source: string, opener: RegExp): string[] {
    const tags: string[] = [];
    for (const opened of source.matchAll(opener)) {
        let at = opened.index + opened[0].length;
        let depth = 0;
        let quote = '';
        while (at < source.length) {
            const char = source[at];
            if (quote !== '') {
                if (char === quote) quote = '';
            } else if (char === '"' || char === "'") {
                quote = char;
            } else if (char === '{') {
                depth += 1;
            } else if (char === '}') {
                depth -= 1;
            } else if (depth === 0 && char === '/' && source[at + 1] === '>') {
                tags.push(source.slice(opened.index, at + 2));
                break;
            }
            at += 1;
        }
    }
    return tags;
}

/**
 * A tone a tag may carry. A state keeps its hue, so a tag that stands for one is toned by the same
 * lookup its chip was, and a tag that stands for a name or a count carries none. What is checked
 * here is that a tone is a hue the palette declares or an expression that reaches one: a token no
 * theme declares would paint nothing at all.
 */
const TONE_LOOKUP = /[Tt]one(?:Of|For)?\(|\.tone\b|TONE\[|TONES\[|\{tone\}|\{[a-z]+Tone\}/;

/** The hue names config/catalogs/vocab.yml's palette declares, the only ones a theme paints. */
function paletteHues(): string[] {
    const palette = vocabCatalog(config).palette;
    const tokens = Object.values(palette as Record<string, string>);
    return tokens
        .filter((token) => token.startsWith('c-'))
        .map((token) => token.slice('c-'.length));
}

/** The `tone` one tag is given, as written, or nothing when it is given none. */
export function toneAttribute(tag: string): string | null {
    if (tag.includes('{tone}')) return '{tone}';
    const quoted = /\btone="([^"]*)"/.exec(tag);
    if (quoted !== null) return quoted[1];
    const at = tag.indexOf('tone={');
    if (at === -1) return null;
    let depth = 0;
    for (let i = at + 'tone='.length; i < tag.length; i += 1) {
        if (tag[i] === '{') depth += 1;
        else if (tag[i] === '}') {
            depth -= 1;
            if (depth === 0) return tag.slice(at + 'tone='.length, i + 1);
        }
    }
    return null;
}

/** Every tag whose tone names no hue the palette declares and reaches no tone lookup. */
export function looseTags(root: string, hues: string[]): string[] {
    const loose: string[] = [];
    for (const file of svelteFiles(root)) {
        for (const tag of tagTags(readFileSync(join(root, file), 'utf8'))) {
            const words = tag.replace(/\s+/g, ' ');
            const tone = toneAttribute(words);
            if (tone === null) continue;
            if (TONE_LOOKUP.test(tone)) continue;
            if (hues.some((hue) => tone.includes(`'${hue}'`) || tone === hue)) continue;
            loose.push(`${file}: ${words}`);
        }
    }
    return loose.sort();
}

/** The files whose chips are toned through the helper rather than at the call site. */
export function helperFiles(root: string): string[] {
    return svelteFiles(root)
        .filter((file) => readFileSync(join(root, file), 'utf8').includes(TONE_HELPER))
        .sort();
}

/** Every `<Tag ... />` in one file, with the braces inside it balanced. */
export function tagTags(source: string): string[] {
    return balancedTags(source, /<Tag\b/g);
}

/**
 * Whether a chip breaks the rule: it names a tone that is none of CHIP_TONES, or it names none and
 * is no control. A chip that is a control (a filter toggle pressed or not, or a pill that opens
 * something) is the one chip that carries no state of its own to tone, so it may carry no tone;
 * pressed, it fills in the accent.
 */
export function isLooseChip(tag: string): boolean {
    const words = tag.replace(/\s+/g, ' ');
    if (CHIP_TONES.some((tone) => words.includes(tone))) return false;
    const control = /\s(?:pressed|onclick)=/.test(words);
    return !(control && toneAttribute(words) === null);
}

/** Every chip that breaks the rule above, by file and tag. */
export function looseChips(root: string): string[] {
    const loose: string[] = [];
    for (const file of svelteFiles(root)) {
        const source = readFileSync(join(root, file), 'utf8');
        if (source.includes(TONE_HELPER)) continue;
        for (const tag of chipTags(source)) {
            if (!isLooseChip(tag)) continue;
            loose.push(`${file}: ${tag.replace(/\s+/g, ' ')}`);
        }
    }
    return loose.sort();
}

describe('the chip audit over every view', () => {
    it('audits that finds a chip toned by a status, a project type or a badge, or a control with no tone', () => {
        expect(looseChips(LIB)).toEqual([]);
    });

    it('audits that lets one file tone its chips through the helper, and no other', () => {
        expect(helperFiles(LIB)).toEqual(['views/system/gallery/Gallery.svelte']);
    });

    it('audits that counts the chips there are, so the check above is not vacuous', () => {
        const counted = svelteFiles(LIB).flatMap((file) =>
            chipTags(readFileSync(join(LIB, file), 'utf8'))
        );
        expect(counted.length).toBeGreaterThanOrEqual(9);
    });

    it('audits that finds every tag toned by a hue the palette declares, or by none', () => {
        expect(looseTags(LIB, paletteHues())).toEqual([]);
    });

    it('audits that counts the toned and the plain tags, so neither side of the ruling is vacuous', () => {
        const tags = svelteFiles(LIB).flatMap((file) =>
            tagTags(readFileSync(join(LIB, file), 'utf8'))
        );
        const toned = tags.filter((tag) => toneAttribute(tag.replace(/\s+/g, ' ')) !== null);
        expect(toned.length).toBeGreaterThanOrEqual(34);
        expect(tags.length - toned.length).toBeGreaterThanOrEqual(55);
    });

    it('audits that catches a tag toned by a token no theme paints, and passes the four chip forms', () => {
        const hues = paletteHues();
        expect(looseTagsIn('<Tag label={one} tone="nonesuch" />', hues)).toEqual([
            '<Tag label={one} tone="nonesuch" />'
        ]);
        expect(looseTagsIn('<Tag label={one} tone={whatever} />', hues)).toEqual([
            '<Tag label={one} tone={whatever} />'
        ]);
        for (const form of [
            '<Tag label={one} tone="amber" />',
            '<Tag label={one} tone={statusTone(chip)} />',
            '<Tag label={one} tone={typeTone(kind)} />',
            '<Tag label={one} tone={item.tone} />',
            '<Tag label={one} tone={toneFor(key)} />',
            '<Tag label={one} {tone} />',
            '<Tag label={one} />'
        ]) {
            expect(looseTagsIn(form, hues), form).toEqual([]);
        }
    });

    it('audits that catches a chip given a tone of its own, and a tag it would have to be', () => {
        expect(looseChipsIn('<Chip label={one} tone="teal" />')).toEqual([
            '<Chip label={one} tone="teal" />'
        ]);
        expect(looseChipsIn('<Chip label={one} />')).toEqual(['<Chip label={one} />']);
        // A control carries no tone of its own, and a tone it does name is still checked.
        expect(looseChipsIn('<Chip label={one} pressed={on} onclick={flip} />')).toEqual([]);
        expect(looseChipsIn('<Chip label={one} pressed={on} tone="teal" />')).toEqual([
            '<Chip label={one} pressed={on} tone="teal" />'
        ]);
        expect(looseChipsIn('<Chip label={one} tone={statusTone(chip)} filled />')).toEqual([]);
        // A tone written over two lines, which is how the longer call sites read.
        expect(looseChipsIn('<Chip\n    label={one}\n    tone={typeTone(kind)}\n/>')).toEqual([]);
    });
});

/** The loose tags of one piece of markup, which is what the negative case above reads. */
function looseTagsIn(source: string, hues: string[]): string[] {
    return tagTags(source).filter((tag) => {
        const tone = toneAttribute(tag.replace(/\s+/g, ' '));
        if (tone === null || TONE_LOOKUP.test(tone)) return false;
        return !hues.some((hue) => tone.includes(`'${hue}'`) || tone === hue);
    });
}

/** The loose chips of one piece of markup, which is what the negative case above reads. */
function looseChipsIn(source: string): string[] {
    return chipTags(source).filter(isLooseChip);
}

describe('the capsule on a project card', () => {
    it('is worn by the status word, in the tone of its status', () => {
        const body = card();
        expect(primitiveOf(body, chipLabel(STATUS))).toBe('chip');
        expect(body).toContain(`--tone: var(--c-${statusTone(STATUS)})`);
    });

    it('is worn by the project type, in the tone of its type', () => {
        const body = card();
        expect(primitiveOf(body, TYPE)).toBe('chip');
        expect(body).toContain(`--tone: var(--c-${typeTone(TYPE)})`);
    });

    it('is worn by nothing else the card lists', () => {
        const body = card();
        for (const words of [DOMAIN, DATASET, catalog['board.repro_yes'], 'This Mac']) {
            expect(primitiveOf(body, words), words).toBe('tag');
        }
    });

    it('is worn twice on the whole card and no more', () => {
        expect(card().match(/class="chip/g)).toHaveLength(2);
    });
});
