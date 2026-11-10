// Layer 1, data tests. The readers of the list keys a hub sets in its own settings file, in
// src/lib/data/sources/config/settings/hub-rows.ts: `feed_registries`, `update_tasks` and
// `project_docs`, each read by the shipped options entry of sources.yml with its default replaced
// by one that differs from the shipped default, so a default written in code instead of read from
// the entry fails a row. One row per input that gives a different outcome: what the reader answers
// and the problems it found, as key and kind. Over oculus's shipped configuration, the findings of
// a field that leaves its row unread say so, and the layout holds the cluster folder and the
// audit's skipped folders to their forms.

import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import {
    feedRegistries,
    hubLayout,
    projectDocList,
    updateTasks
} from '../../../../../src/lib/data/sources/config/settings/hub-rows.ts';
import { hubRowFindings } from '../../../../../src/lib/data/sources/config/catalogs.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { outcome, SOURCES } from './synthetic.ts';

/** oculus's shipped merged map, whose options entries and text catalog the findings read. */
const SHIPPED = loadConfig(engineDir()).config;

/** The default each synthetic entry answers, every one different from the shipped default. */
const FEEDS_DEFAULT = ['radar'];
const TASKS_DEFAULT = [{ task: 'lit', label: 'Lit', note: 'n', view: 'radar', last_run: 'radar' }];
const DOCS_DEFAULT = [{ name: 'notes/a.md', label: 'A' }];

/**
 * A merged map holding the three synthetic entries, the defaults layer that holds their defaults
 * as the merge of config/defaults/ does, and `held` as the hub's keys laid over it.
 */
function mapWith(held: Record<string, unknown>): Record<string, unknown> {
    return {
        options: {
            'sources.yml': {
                feed_registries: { ...SOURCES.feed_registries, default: FEEDS_DEFAULT },
                update_tasks: { ...SOURCES.update_tasks, default: TASKS_DEFAULT },
                project_docs: { ...SOURCES.project_docs, default: DOCS_DEFAULT }
            }
        },
        feed_registries: FEEDS_DEFAULT,
        update_tasks: TASKS_DEFAULT,
        project_docs: DOCS_DEFAULT,
        ...held
    };
}

/** A row of `update_tasks` that reads, with `over` laid over its fields. */
function task(over: Record<string, unknown> = {}): Record<string, unknown> {
    return { task: 'scout', label: 'Scout', note: 'openings', view: 'leads', ...over };
}

describe('feedRegistries', () => {
    const read = (value: unknown) =>
        outcome((p) =>
            feedRegistries(mapWith(value === undefined ? {} : { feed_registries: value }), p)
        );

    it.each([
        { input: 'no key', value: undefined, words: FEEDS_DEFAULT, problems: [] },
        { input: 'an empty list', value: [], words: [], problems: [] },
        { input: 'leads alone', value: ['leads'], words: ['leads'], problems: [] },
        {
            input: 'both, radar first',
            value: ['radar', 'leads'],
            words: ['radar', 'leads'],
            problems: []
        },
        {
            input: 'a word no feed has',
            value: ['foo'],
            words: [],
            problems: ['feed_registries[0]: choice']
        },
        {
            input: 'a feed and a word no feed has',
            value: ['leads', 'foo'],
            words: ['leads'],
            problems: ['feed_registries[1]: choice']
        },
        {
            input: 'a registry that is no feed',
            value: ['datasets'],
            words: [],
            problems: ['feed_registries[0]: choice']
        },
        {
            input: 'the folder feed',
            value: ['linkedin'],
            words: [],
            problems: ['feed_registries[0]: choice']
        },
        { input: 'one word as a text', value: 'leads', words: ['leads'], problems: [] },
        { input: 'a number', value: 5, words: FEEDS_DEFAULT, problems: ['feed_registries: words'] },
        {
            input: 'a word given twice',
            value: ['leads', 'leads'],
            words: ['leads'],
            problems: ['feed_registries: repeat']
        }
    ])('reads $input', ({ value, words, problems }) => {
        expect(read(value)).toStrictEqual({ value: words, problems });
    });
});

describe('updateTasks', () => {
    const read = (value: unknown) =>
        outcome((p) => updateTasks(mapWith(value === undefined ? {} : { update_tasks: value }), p));
    const row = (over: Record<string, unknown>, at = 'update_tasks[0]') => ({
        task: 'scout',
        label: 'Scout',
        note: 'openings',
        view: 'leads',
        lastRun: null,
        at,
        ...over
    });

    it.each([
        {
            input: 'no key',
            value: undefined,
            rows: [
                {
                    task: 'lit',
                    label: 'Lit',
                    note: 'n',
                    view: 'radar',
                    lastRun: 'radar',
                    at: 'update_tasks[0]'
                }
            ],
            problems: []
        },
        { input: 'a row with no last_run', value: [task()], rows: [row({})], problems: [] },
        {
            input: 'a row with a last_run',
            value: [task({ last_run: 'linkedin' })],
            rows: [row({ lastRun: 'linkedin' })],
            problems: []
        },
        {
            input: 'two rows, read in their order',
            value: [task({ task: 'b-2' }), task({ task: 'a' })],
            rows: [row({ task: 'b-2' }), row({ task: 'a' }, 'update_tasks[1]')],
            problems: []
        },
        {
            input: 'an empty label',
            value: [task({ label: '' })],
            rows: [],
            problems: ['update_tasks[0].label: empty']
        },
        {
            input: 'an empty note',
            value: [task({ note: ' ' })],
            rows: [],
            problems: ['update_tasks[0].note: empty']
        },
        {
            input: 'an empty view',
            value: [task({ view: '' })],
            rows: [],
            problems: ['update_tasks[0].view: empty']
        },
        {
            input: 'a last_run outside the four',
            value: [task({ last_run: 'foo' })],
            rows: [],
            problems: ['update_tasks[0].last_run: choice']
        },
        {
            input: 'an empty task',
            value: [task({ task: '' })],
            rows: [],
            problems: ['update_tasks[0].task: form']
        },
        {
            input: 'a task that climbs out',
            value: [task({ task: '../x' })],
            rows: [],
            problems: ['update_tasks[0].task: form']
        },
        {
            input: 'a task with a capital',
            value: [task({ task: 'Scout' })],
            rows: [],
            problems: ['update_tasks[0].task: form']
        },
        {
            input: 'a task an earlier row took',
            value: [task(), task({ label: 'Again' })],
            rows: [row({})],
            problems: ['update_tasks: repeat']
        },
        {
            input: 'a number',
            value: 5,
            rows: [
                {
                    task: 'lit',
                    label: 'Lit',
                    note: 'n',
                    view: 'radar',
                    lastRun: 'radar',
                    at: 'update_tasks[0]'
                }
            ],
            problems: ['update_tasks: records']
        }
    ])('reads $input', ({ value, rows, problems }) => {
        expect(read(value)).toStrictEqual({ value: rows, problems });
    });
});

describe('projectDocList', () => {
    const read = (value: unknown) =>
        outcome((p) =>
            projectDocList(mapWith(value === undefined ? {} : { project_docs: value }), p)
        );
    const TEX = { name: 'manuscript/paper.tex', label: 'TEX' };

    it.each([
        { input: 'no key', value: undefined, docs: DOCS_DEFAULT, problems: [] },
        { input: 'a document of the project', value: [TEX], docs: [TEX], problems: [] },
        {
            input: 'a name that climbs out',
            value: [{ name: '../other/README.md', label: 'R' }],
            docs: [],
            problems: ['project_docs[0].name: form']
        },
        {
            input: 'an absolute name',
            value: [{ name: '/etc/x.md', label: 'X' }],
            docs: [],
            problems: ['project_docs[0].name: form']
        },
        {
            input: 'an empty name',
            value: [{ name: '', label: 'E' }],
            docs: [],
            problems: ['project_docs[0].name: form']
        },
        {
            input: 'an empty label',
            value: [{ name: 'a.md', label: '' }],
            docs: [],
            problems: ['project_docs[0].label: empty']
        },
        {
            input: 'a name an earlier row took',
            value: [TEX, { name: 'manuscript/paper.tex', label: 'PAPER' }],
            docs: [TEX],
            problems: ['project_docs: repeat']
        },
        {
            input: 'a label an earlier row took',
            value: [TEX, { name: 'manuscript/other.tex', label: 'TEX' }],
            docs: [TEX],
            problems: ['project_docs: repeat']
        },
        { input: 'a number', value: 5, docs: DOCS_DEFAULT, problems: ['project_docs: records'] }
    ])('reads $input', ({ value, docs, problems }) => {
        expect(read(value)).toStrictEqual({ value: docs, problems });
    });
});

describe('the findings of a refused value of a hub key', () => {
    it('says that the row of a refused or empty field is not read (G13)', () => {
        const config = {
            ...SHIPPED,
            update_tasks: [task({ task: '' }), task({ task: 'b', label: '' })],
            project_docs: [{ name: '../x.md', label: 'X' }, { name: 'y.md' }]
        };
        expect(hubRowFindings(config, 'hub.yml').map((one) => one.message)).toEqual([
            'update_tasks[0].task must be lowercase letters, digits and dashes starting with a letter, not ""; its row is not read',
            'update_tasks[1].label must not be empty; its row is not read',
            'project_docs[0].name must be a path inside the folder it is read in, written relative to it, with no .. and no backslash, not "../x.md"; its row is not read',
            'project_docs[1].label must be text and is not set; its row is not read'
        ]);
    });

    it('holds slurm.cluster_folder and audit.skip_folders to their forms (G13)', () => {
        const layout = (slurm: unknown, audit: unknown) =>
            outcome((p) => {
                const read = hubLayout({ ...SHIPPED, slurm, audit }, p);
                return [read.clusterFolder, read.auditSkipFolders];
            });
        expect(layout({ cluster_folder: '~/projects/{id}' }, { skip_folders: ['a/b'] })).toEqual({
            value: ['~/projects/{id}', ['a/b']],
            problems: []
        });
        expect(layout({ cluster_folder: '/scratch/{id}-run' }, {})).toEqual({
            value: ['/scratch/{id}-run', []],
            problems: []
        });
        for (const folder of ['rel/x', '~/a/../b', '~/a/', '/a b']) {
            expect(layout({ cluster_folder: folder }, {})).toEqual({
                value: ['', []],
                problems: ['slurm.cluster_folder: form']
            });
        }
        expect(layout({}, { skip_folders: ['../x'] })).toEqual({
            value: ['', []],
            problems: ['audit.skip_folders: form']
        });
    });
});
