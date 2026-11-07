// Layer 2, client state tests. The words of each hub's records: the server reads every hub's
// vocabulary under that hub's own `.oculus/config.yml` (`workspaceVocabs`), the page installs them
// (`setVocab`), and a lookup made with a record's hub reads that hub's words, with no primary as
// with one, while a folder that is no hub reads oculus's own. A lookup made with no hub, for a list
// drawn over several hubs, reads the union of every hub's words: the primary's first, each word
// once with the row of the first hub that holds it. A stage reads by the label of its row of
// `stages` (`stageLabel`), also where a hub's `chips` list the same word. A venue is drawn with
// the glyph, tone and label of its row of `venue_tiers` in its own hub's words, whichever hub's
// project names it (`venueTierMark`). The hubs are planted in scratch folders, except that the
// rows of the venue tier case read words built in the case.

import { describe, expect } from 'vitest';
import { portfolioConfigFrom, readOtherHub, workspaceVocabs } from '../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import type { Venue } from '../../../src/lib/data/model/index.ts';
import { createChecker } from '../../../src/lib/data/snapshot/schema/check.ts';
import { folderGlobs } from '../../../src/lib/data/sources/documents/folder-globs.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { buildHubs } from '../../../src/lib/server/root/watch/build.ts';
import { boardItemFor } from '../../../src/lib/state/boards/board/items.ts';
import { presetFor } from '../../../src/lib/state/boards/board/presets.ts';
import { venueTierMark } from '../../../src/lib/state/boards/structure/lines.ts';
import { fitTone } from '../../../src/lib/state/feeds/leads.ts';
import { setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import {
    chipLabel,
    setVocab,
    stageLabel,
    stageTone,
    statusTone,
    vocabOf
} from '../../../src/lib/state/shared/words/tones.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

/** oculus's own parse, under no hub's settings. */
const OWN = loadConfig(engineDir());

/** The parse of the engine's folder under the settings of the hub at `dir`. */
const settingsOf = (dir: string) => loadConfig(engineDir(), { hub: dir });

/** A hub planted in a scratch folder with `settings` as its `.oculus/config.yml`. */
function hubWith(settings: string): string {
    return plantScratch('oculus-hub-words-', { [HUB_FILE]: settings });
}

/**
 * Install the words of a workspace whose folders are `folders` in order, each a hub (`dir`) or a
 * folder that is no hub (`dir: null`), with the primary `primary` or none. Answers the parse of a
 * hub's folder under its settings, each folder parsed once, so a case that also builds the
 * workspace's records reads them over the parses the words came from.
 */
function install(
    folders: { name: string; dir: string | null }[],
    primary: string | null
): (dir: string) => ReturnType<typeof settingsOf> {
    const parsed = new Map<string, ReturnType<typeof settingsOf>>();
    const parse = (dir: string): ReturnType<typeof settingsOf> => {
        const held = parsed.get(dir) ?? settingsOf(dir);
        parsed.set(dir, held);
        return held;
    };
    const hubs = folders.flatMap((one) =>
        one.dir === null ? [] : [{ key: one.name, dir: one.dir }]
    );
    const primaryDir = hubs.find((one) => one.key === primary)?.dir ?? null;
    const read = primaryDir === null ? OWN : parse(primaryDir);
    const { vocabs } = workspaceVocabs(
        { name: primary, dir: primaryDir },
        read,
        hubs.filter((one) => one.key !== primary),
        parse,
        { folders: folders.map((one) => one.name), own: OWN.config }
    );
    setVocab(vocabs);
    return parse;
}

describe("the words of each hub's records", () => {
    it("draws each hub's leads and entries in its own colours in a workspace with no primary", () => {
        const lab = hubWith(
            'leads_fit: { strong: "#16a34a" }\nstatuses: { pending: { color: "#2563eb", waiting: true } }\n'
        );
        const home = hubWith(
            'leads_fit: { strong: "#dc2626" }\nstatuses: { pending: { color: "#7c3aed", waiting: true } }\n'
        );
        install(
            [
                { name: 'lab', dir: lab },
                { name: 'home', dir: home }
            ],
            null
        );
        expect(vocabOf('lab').leads_fit).toEqual({ strong: '#16a34a' });
        expect(vocabOf('home').leads_fit).toEqual({ strong: '#dc2626' });
        expect(fitTone('strong', vocabOf('lab'))).toBe('green');
        expect(fitTone('strong', vocabOf('home'))).toBe('red');
        expect(statusTone('pending', 'lab')).toBe('blue');
        expect(statusTone('pending', 'home')).toBe('purple');
    });

    it("draws each hub's cards in its own stage words and orders and labels the stages of the slices from the union", () => {
        const lab = hubWith('stages: { exploring: { label: Experimenting, color: "#2563eb" } }\n');
        const home = hubWith(
            'stages: { trialling: { label: Trialling, color: "#0d9488", live: true } }\n'
        );
        install(
            [
                { name: 'lab', dir: lab },
                { name: 'home', dir: home }
            ],
            'lab'
        );
        expect(chipLabel('exploring', 'lab')).toBe('Experimenting');
        expect(chipLabel('exploring', 'home')).toBe('exploring');
        expect(stageTone('exploring', 'lab')).toBe('blue');
        expect(stageTone('exploring', 'home')).toBe('honey');
        const preset = presetFor('projects', OWN.config, vocabOf);
        const shipped = Object.keys(OWN.config.stages as object);
        expect(preset.stageOrder).toEqual([...shipped, 'trialling']);
        expect(preset.stageOrder.filter((word) => word === 'exploring')).toHaveLength(1);
        expect(chipLabel('exploring')).toBe('Experimenting');
        expect(chipLabel('trialling')).toBe('Trialling');
        expect(chipLabel('trialling', 'lab')).toBe('trialling');
        expect(stageLabel('exploring')).toBe('Experimenting');
        expect(stageLabel('exploring', 'lab')).toBe('Experimenting');
        expect(stageLabel('exploring', 'home')).toBe('exploring');
        expect(stageLabel('trialling')).toBe('Trialling');
    });

    it("labels a stage by its row of stages where the hub's chips list the same word", () => {
        const lab = hubWith('chips: { exploring: { label: "a chip word", icon: red } }\n');
        install([{ name: 'lab', dir: lab }], 'lab');
        expect(chipLabel('exploring', 'lab')).toBe('a chip word');
        expect(stageLabel('exploring', 'lab')).toBe('exploring');
        expect(chipLabel('exploring')).toBe('a chip word');
        expect(stageLabel('exploring')).toBe('exploring');
    });

    it("reads a folder that is no hub under oculus's own words in a workspace with no primary", () => {
        const lab = hubWith('stages: { exploring: { label: Experimenting, color: "#2563eb" } }\n');
        install(
            [
                { name: 'lab', dir: lab },
                { name: 'notes', dir: null }
            ],
            null
        );
        expect(chipLabel('exploring', 'lab')).toBe('Experimenting');
        expect(chipLabel('exploring', 'notes')).toBe('exploring');
        expect(stageTone('exploring', 'notes')).toBe('honey');
        expect(chipLabel('exploring')).toBe('Experimenting');
    });

    it("draws a venue with the glyph, tone and label of its tier row in its own hub's words", () => {
        setGlyphs({ star: '[*]', crown: '[^]', venue: '<>' });
        // The rows read each hub's words as the page holds them, oculus's palette with the hub's
        // own `venue_tiers`, so the rows cost no parse. The board item below reads the venue of a
        // planted hub through the server's parse, named by a project of the primary, a folder read
        // under oculus's own words, whose strong row is star, teal and `strong`; that hub's blank
        // glyph and its `specialist` row with no glyph, which oculus's own row gives a glyph, are
        // read through the server's parse too.
        const tiers: Record<string, unknown[]> = {
            lab: [
                { key: 'strong', glyph: 'star', color: '#0d9488', label: 'Strong' },
                { key: 'blank', glyph: '', color: '#0d9488', label: 'Blank' },
                { key: 'typo', glyph: 'stra', color: '#0d9488', label: 'Typo' },
                {
                    key: 'unrated',
                    glyph: 'crown',
                    color: '#123456',
                    label: 'Unrated',
                    assignable: false
                }
            ],
            home: [{ key: 'strong', glyph: 'crown', color: '#7c3aed', label: 'Top' }],
            plain: [
                { key: 'strong', color: '#0d9488', label: 'strong' },
                { key: 'unrated', color: '#94a3b8', label: 'unrated', assignable: false }
            ]
        };
        const wordsOf = (root?: string) => ({
            palette: OWN.config.palette,
            venue_tiers: tiers[root ?? '']
        });
        const venue = (root: string, tier?: string): Venue => ({
            id: `${root}:v`,
            root,
            name: 'V',
            themes: [],
            ...(tier === undefined ? {} : { tier })
        });
        const rows: [Venue, ReturnType<typeof venueTierMark>][] = [
            [venue('lab', 'strong'), { glyph: 'star', tone: 'teal', label: 'Strong' }],
            [venue('home', 'strong'), { glyph: 'crown', tone: 'purple', label: 'Top' }],
            [venue('plain', 'strong'), null],
            [venue('plain'), null],
            [venue('lab', 'blank'), null],
            [venue('lab', 'typo'), null],
            [venue('lab'), { glyph: 'crown', label: 'Unrated' }],
            [venue('lab', 'nope'), { glyph: 'crown', label: 'Unrated' }],
            [venue('home'), null]
        ];
        for (const [one, mark] of rows) expect(venueTierMark(one, wordsOf)).toEqual(mark);

        const lab = plantScratch('oculus-hub-words-', {
            [HUB_FILE]:
                'venue_tiers:\n  - { key: strong, glyph: crown, color: "#7c3aed", label: Top }\n' +
                '  - { key: blank, glyph: "", color: "#0d9488", label: Blank }\n' +
                '  - { key: specialist, color: "#0891b2", label: Specialist }\n',
            '.oculus/data/research/venues.yml':
                'schema:\n  - { field: id, type: text, primary_key: true }\n  - { field: name, type: text, display: 1 }\n  - { field: tier, type: text }\nentries:\n  - { id: bspc, name: Signal Processing, tier: strong }\n'
        });
        const home = plantScratch('oculus-hub-words-', {
            'projects/ideas/paper/project.yml':
                'title: Paper\ntier: research\nstage: nascent\nvenue: bspc\n'
        });
        const parse = install(
            [
                { name: 'home', dir: null },
                { name: 'lab', dir: lab }
            ],
            'home'
        );
        const portfolio = { ...portfolioConfigFrom(OWN.config), scan: [{ dir: 'projects/ideas' }] };
        const primary = { key: 'home', dir: home, portfolio, workspace: null };
        const others = [readOtherHub({ key: 'lab', dir: lab }, parse(lab))];
        const read = { primary, others, config: portfolio, order: ['home', 'lab'], self: '' };
        const { snapshot } = buildHubs(read, 0, createChecker(), null, folderGlobs());
        const project = snapshot.entities.projects['home:paper'];
        const item = boardItemFor(snapshot, project, presetFor('projects', OWN.config, vocabOf));
        expect(item.venue?.tier).toEqual({ glyph: 'crown', tone: 'purple', label: 'Top' });
        expect(venueTierMark(venue('lab', 'blank'), vocabOf)).toBeNull();
        expect(venueTierMark(venue('lab', 'specialist'), vocabOf)).toBeNull();
    });
});
