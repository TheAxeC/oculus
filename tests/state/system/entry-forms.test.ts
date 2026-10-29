// Layer 2, client state test. The forms of an entry of a repository's `.oculus` files and what
// their answers send: the Debug view's form of a launch.yml configuration
// (state/system/machine/debug/launch-form.ts) and the compile database list's form of a cpp.yml
// configuration (state/system/machine/lsp/clangd/cpp-form.ts). An answer left as the form was
// filled is no change, so the server leaves the file's key as it is written. A list or map whose
// line would not read back as it (a part that holds the separator `,` or space at either end, an
// empty part, a map key that holds `=`, a cpp part that is no text) is not drawn, and nothing is
// sent for it.
//
// What this does NOT cover: the server's write of the changes, which
// tests/routes/machine/debug.test.ts and tests/routes/machine/cpp.test.ts hold.

import { describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import type { DebugConfiguration, SchemaField } from '../../../src/lib/data/model/index.ts';
import type { ActingDebugger } from '../../../src/lib/data/helpers/files/apps/tools/debuggers.ts';
import {
    launchChanges,
    launchForm
} from '../../../src/lib/state/system/machine/debug/launch-form.ts';
import {
    cppChanges,
    cppFields
} from '../../../src/lib/state/system/machine/lsp/clangd/cpp-form.ts';

const RUN: DebugConfiguration = {
    name: 'run',
    type: 'rite',
    request: 'launch',
    args: { env: { DEPTH: 'deep' } },
    program: 'a.rite',
    cwd: '.'
};

/** An app's debugger whose launch request takes a list `list` and a map of words `words`. */
const ACTING: ActingDebugger = {
    app: 'app:rite',
    title: 'Rite',
    debugger: {
        type: 'rite',
        label: 'Rite',
        languages: [],
        program: 'rite.js',
        args: [],
        runtime: 'node',
        runtimeArgs: [],
        configurationAttributes: {
            launch: { properties: { list: { type: 'array' }, words: { type: 'object' } } },
            attach: {}
        },
        initialConfigurations: [],
        configurationSnippets: []
    }
};

const CPP: SchemaField[] = [
    { field: 'name', type: 'text', required: true },
    { field: 'compile_commands', type: 'text' },
    { field: 'fallback_flags', type: 'tags' }
];

describe('the changes an entry form sends', () => {
    it('sends only the launch fields answered otherwise than filled, an emptied one as null', () => {
        const form = launchForm(RUN, undefined);
        const answers = form.fields.map((field) => field.value);
        expect(launchChanges(form, answers)).toEqual({});
        answers[form.fields.findIndex((field) => field.key === 'program')] = 'b.rite';
        answers[form.fields.findIndex((field) => field.key === 'cwd')] = '';
        expect(launchChanges(form, answers)).toEqual({ program: 'b.rite', cwd: null });
    });

    it('sends the cpp fields changed, takes out a key the schema does not name, and a new entry whole', () => {
        const entry = { name: 'debug', compile_commands: 'out', compiler: 'cc' };
        const form = cppFields(CPP, entry);
        const answers = form.map((field) => field.value);
        expect(cppChanges(CPP, form, entry, answers)).toEqual({ compiler: null });
        answers[2] = '-Iinclude, -std=c++20';
        answers[1] = ' ';
        expect(cppChanges(CPP, form, entry, answers)).toEqual({
            compile_commands: null,
            fallback_flags: ['-Iinclude', '-std=c++20'],
            compiler: null
        });
        const fresh = cppFields(CPP, null);
        expect(cppChanges(CPP, fresh, null, ['flags-only', '', '-O2'])).toEqual({
            name: 'flags-only',
            fallback_flags: ['-O2']
        });
    });

    it.each([
        ['a part that holds the separator', ['-DLIST=a,b', '-O2']],
        ['a part that is a record', [{ flag: '-O2' }]],
        ['a part that is a number', [2, '-O2']],
        ['a part that is a flag', [true, '-O2']],
        ['an empty part', ['', '-O2']],
        ['a part with a space at its end', ['-O2 ', '-g']]
    ])('draws no cpp tags field whose list holds %s, and sends nothing for it', (_name, flags) => {
        const entry = { name: 'debug', fallback_flags: flags };
        const form = cppFields(CPP, entry);
        const answers = form.map((field) => field.value);
        answers[0] = 'renamed';
        expect(form.map((field) => field.key)).toEqual(['name', 'compile_commands']);
        expect(cppChanges(CPP, form, entry, answers)).toEqual({ name: 'renamed' });
    });

    it.each([
        [
            'a list part that holds the separator',
            { list: ['a,b', 'c'], words: { DEPTH: 'deep' } },
            'list'
        ],
        ['an empty list part', { list: ['', 'c'], words: { DEPTH: 'deep' } }, 'list'],
        [
            'a list part with a space at its start',
            { list: [' c'], words: { DEPTH: 'deep' } },
            'list'
        ],
        [
            'a map value that holds the separator',
            { list: ['c'], words: { DEPTH: 'deep,er' } },
            'words'
        ],
        [
            'a map value with a space at its end',
            { list: ['c'], words: { DEPTH: 'deep ' } },
            'words'
        ],
        ['a map key that holds the separator', { list: ['c'], words: { 'A,B': 'deep' } }, 'words'],
        ['a map key that holds =', { list: ['c'], words: { 'A=B': 'deep' } }, 'words'],
        ['a map key with a space at its start', { list: ['c'], words: { ' A': 'deep' } }, 'words']
    ])(
        'draws no launch attribute that holds %s, and sends nothing for it',
        (_name, args, undrawn) => {
            const configuration = { ...RUN, args };
            const form = launchForm(configuration, ACTING);
            const answers = form.fields.map((field) => field.value);
            answers[form.fields.findIndex((field) => field.key === 'program')] = 'b.rite';
            const drawn = ['list', 'words'].filter((key) => key !== undrawn);
            expect(form.fields.map((field) => field.key)).toEqual([
                'name',
                'program',
                'cwd',
                'before',
                ...drawn
            ]);
            expect(launchChanges(form, answers)).toEqual({ program: 'b.rite' });
        }
    );
});
