// The manifest editor rendered to HTML on the server: one control per field of the schema, the
// project's own values in them, and the two states where there is nothing to edit.
//
// The catalog, the glyphs, the vocabulary and the schema are the real config, so the words and the
// widgets checked here are config/text.yml's and config/manifest-schema.yml's. The project is
// synthetic: what is checked is the view.
//
// What this does NOT cover: anything that needs a DOM. There is no browser in this suite, so nothing
// is typed, no Save is pressed and no write is posted; the write itself is tests/server/writes.test.ts
// and tests/routes/write.test.ts.

import { describe, expect, it } from 'vitest';
import { NO_FEEDS } from '../entities-fixture.ts';
import { render } from 'svelte/server';
import Editor from '../../src/lib/views/Editor.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../src/lib/state/text.ts';
import { setVocab } from '../../src/lib/state/tones.ts';
import { receive } from '../../src/lib/state/entities.svelte.ts';
import { formFields, formSections } from '../../src/lib/state/schema.ts';
import type { Id, Project, Snapshot } from '../../src/lib/data/model.ts';
import type { Instance } from '../../src/lib/state/layout.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setVocab(vocabCatalog(config));

const fields = formFields(config);
const sections = formSections(config);

function project(): Project {
    return {
        id: 'alpha',
        tier: 'manuscripts',
        ghost: false,
        type: 'manuscript',
        title: 'Alpha, the whole title',
        short: 'Alpha',
        lead: 'Faes',
        authors: ['Faes', 'Someone'],
        year: 2026,
        pin: true,
        chips: ['submitted'],
        statusLine: 'submit-ready, 16 pp',
        focus: 'run',
        eli5: 'what it is, in one line',
        next: 'Run the sweep.',
        latest: 'the latest thing',
        results: ['the first result', 'the second'],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        deadline: '2099-01-01',
        compute: 'hpc',
        codeAvailability: { status: 'deposited', url: 'https://example.invalid' },
        reproduced: { date: '2026-08-02' },
        relatedIds: [],
        venueId: 'bspc',
        fundingIds: [],
        datasetIds: [],
        programIds: ['tensor'],
        domainIds: ['method'],
        collaborators: [],
        docs: [],
        folder: 'projects/manuscripts/alpha',
        file: '/hub/projects/manuscripts/alpha/project.yml'
    };
}

function snapshot(): Snapshot {
    const projects: Record<Id, Project> = { alpha: project() };
    return {
        version: 1,
        entities: {
            feeds: NO_FEEDS,
            career: null,
            projects,
            venues: { bspc: { id: 'bspc', name: 'BSPC', short: 'BSPC', themes: [] } },
            datasets: {},
            programs: {
                tensor: { id: 'tensor', title: 'Tensors', fundingIds: [], projectIds: [] }
            },
            domains: { method: { id: 'method', title: 'Methods', projectIds: [] } },
            funding: {},
            collections: {}
        },
        relations: {
            projectVenue: [],
            projectFunding: [],
            projectDataset: [],
            projectProgram: [],
            projectDomain: [],
            projectRelated: [],
            fundingProgram: []
        },
        findings: []
    };
}

receive({ channel: 'portfolio', version: 1, payload: snapshot() });
receive({ channel: 'config', version: 1, payload: { config, text: catalog, findings: [] } });

/** The editor as an instance opened for one project, or for none. */
function html(state: unknown): string {
    const instance: Instance = { id: 'editor-one', view: 'editor', state };
    return render(Editor, { props: { instance } }).body;
}

/** How many controls a rendering drew. */
function controls(body: string): number {
    return ['<input', '<textarea', '<select'].reduce(
        (sum, tag) => sum + body.split(tag).length - 1,
        0
    );
}

describe('the editor of one project', () => {
    const body = html({ id: 'alpha' });

    it('draws one control per field of the schema', () => {
        expect(controls(body)).toBe(fields.length);
    });

    it('draws every section that has a field in it, by its own name', () => {
        // The rendering escapes what a section name holds, so the needle is escaped with it.
        const escaped = (name: string): string => name.replace(/&/g, '&amp;');
        const missing = sections.filter((name) => !body.includes(`>${escaped(name)}</h3>`));
        expect(missing).toEqual([]);
    });

    it('names every field the schema names', () => {
        const missing = fields.filter((one) => !body.includes(one.label));
        expect(missing.map((one) => one.field)).toEqual([]);
    });

    it('carries the project title as the pane title', () => {
        expect(body).toContain('Alpha, the whole title');
    });

    it('holds the current values of the text fields', () => {
        expect(body).toContain('value="Alpha, the whole title"');
        expect(body).toContain('value="submit-ready, 16 pp"');
        expect(body).toContain('value="https://example.invalid"');
        expect(body).toContain('value="2026"');
    });

    it('holds a list field as one item per line', () => {
        expect(body).toContain('the first result\nthe second');
    });

    it('holds the chosen items of a list of choices', () => {
        expect(body).toContain('Tensors');
        expect(body).toContain('submitted');
    });

    it('shows the id and the tier without letting them be edited', () => {
        expect(body).toContain('value="alpha" readonly');
        expect(body).toContain('value="manuscripts" readonly');
    });

    it('ticks the box of a pinned project', () => {
        expect(body).toContain('type="checkbox" checked');
    });

    it('says which fields the snapshot does not carry', () => {
        expect(body).toContain(catalog['editor.not_in_model']);
    });

    it('opens with nothing changed', () => {
        expect(body).toContain(catalog['editor.clean']);
    });
});

describe('the editor with nothing to edit', () => {
    it('says so when it was opened without a project', () => {
        const body = html({});
        expect(body).toContain(catalog['editor.none']);
        expect(controls(body)).toBe(0);
    });

    it('says so when the snapshot does not hold the project it was opened for', () => {
        const body = html({ id: 'nobody' });
        expect(body).toContain('nobody');
        expect(controls(body)).toBe(0);
    });
});
