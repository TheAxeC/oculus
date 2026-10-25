// Layer 2, client state tests. The words of each hub's records: the server reads every hub's
// vocabulary under that hub's own `.oculus/config.yml` (`workspaceVocabs`), the page installs them
// (`setVocab`), and a lookup made with a record's hub reads that hub's words, with no primary as
// with one, while a folder that is no hub reads oculus's own. A lookup made with no hub, for a
// list drawn over several hubs, reads the union of every hub's words: the primary's first, each
// word once with the row of the first hub that holds it. The hubs are planted in scratch folders.

import { describe, expect } from 'vitest';
import { workspaceVocabs } from '../../../src/lib/data/index.ts';
import { HUB_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { presetFor } from '../../../src/lib/state/boards/board/presets.ts';
import { fitTone } from '../../../src/lib/state/feeds/leads.ts';
import {
    chipLabel,
    setVocab,
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
 * folder that is no hub (`dir: null`), with the primary `primary` or none.
 */
function install(folders: { name: string; dir: string | null }[], primary: string | null): void {
    const hubs = folders.flatMap((one) =>
        one.dir === null ? [] : [{ key: one.name, dir: one.dir }]
    );
    const primaryDir = hubs.find((one) => one.key === primary)?.dir ?? null;
    const read = primaryDir === null ? OWN : settingsOf(primaryDir);
    const { vocabs } = workspaceVocabs(
        { name: primary, dir: primaryDir },
        read,
        hubs.filter((one) => one.key !== primary),
        settingsOf,
        { folders: folders.map((one) => one.name), own: OWN.config }
    );
    setVocab(vocabs);
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

    it("draws each hub's cards in its own stage words and builds the board's buttons from the union", () => {
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
});
