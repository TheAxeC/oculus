// Layer 3, view state tests. The keys a LaTeX source tab binds (views/sources/source/latex/
// latex-tab.svelte.ts, `actions`) in each kind of file it shows, set against the files LaTeX
// Workshop v10.19.0's package.json binds each key in: a TeX file takes every key; a `.bib` file the
// text and math chords alone, so Cmd+Alt+B and Cmd+Alt+C reach the editor (Cmd+Alt+C toggles the
// find widget's case); a class or a package Build, Clean and View alone, so Cmd+L selects the line
// and Cmd+Alt+[ and ] fold and unfold. A command a file takes no key for stays listed, so the
// palette runs it.
//
// The tab is made in an effect root as Source.svelte makes it, over a fresh client whose root
// question never answers, with one text chord and one math chord in its tables and the editing
// commands of the editor's LaTeX extension handed in, as the extension hands them once it starts.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { createLatexTab } from '../../../../src/lib/views/sources/source/latex/latex-tab.svelte.ts';
import type { LatexCommands } from '../../../../src/lib/ui/controls/editor/kit/latex/latex-editing.ts';
import { emptyClient, type ClientState } from '../../../fixtures/client.ts';
import { rooted } from '../../../ui/frame/rooted.svelte.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));

/** One text chord and one math chord, the tables' rows the tab binds under its two first keys. */
const CHORDS = { text: { b: 'textbf' }, math: { b: 'mathbf' } };

/** The editing commands of the editor's LaTeX extension, each doing nothing. */
const COMMANDS: LatexCommands = {
    navigate: () => undefined,
    selectEnvironment: () => undefined,
    selectContent: () => undefined,
    selectName: () => undefined,
    cursorsInName: () => undefined,
    toggleEquation: () => undefined,
    closeEnvironment: () => undefined,
    wrapEnvironment: () => undefined,
    surround: () => undefined,
    item: () => undefined,
    keyword: () => undefined,
    promote: () => undefined,
    demote: () => undefined,
    selectSection: () => undefined,
    selectLine: () => undefined,
    tabFocus: () => undefined
};

let client: ClientState;
let stops: (() => void)[] = [];

beforeEach(() => {
    client = emptyClient();
    client.latexActions.rootOfFile = () => new Promise(() => undefined);
    const tables = client.latex.editing();
    client.latex.editing = () => ({ ...tables, chords: CHORDS });
});

afterEach(() => {
    for (const stop of stops) stop();
    stops = [];
});

/** The actions of a LaTeX tab on `path`, a file of `language` on disk under the root `hub`. */
function actionsOf(path: string, language: string): { id: string; keyed: boolean }[] {
    const made = rooted(() =>
        createLatexTab({
            client,
            instance: () => 'tab-1',
            root: () => 'hub',
            path: () => path,
            language: () => language,
            onDisk: () => true,
            draft: () => ({ text: '', saved: '' }),
            caret: () => ({ line: 1, column: 1, selected: 0 }),
            editing: () => true,
            save: () => Promise.resolve()
        })
    );
    stops.push(made.stop);
    made.value.commands = COMMANDS;
    return made.value.actions().map((one) => ({ id: one.id, keyed: one.key !== undefined }));
}

/** The commands of the tab whose keys LaTeX Workshop binds, by the name after `oculus.latex.`. */
type Keyed =
    | 'build'
    | 'clean'
    | 'view'
    | 'synctex'
    | 'mathPreview'
    | 'promote'
    | 'demote'
    | 'item'
    | 'surround'
    | 'selectLine'
    | 'tabFocus'
    | 'text.textbf'
    | 'math.mathbf';

type Row = { kind: string; path: string; language: string; keyed: Keyed[]; listed: Keyed[] };

const EVERY: Keyed[] = [
    'build',
    'clean',
    'view',
    'synctex',
    'mathPreview',
    'promote',
    'demote',
    'item',
    'surround',
    'selectLine',
    'tabFocus',
    'text.textbf',
    'math.mathbf'
];

// `keyed` are the commands the file kind takes a key for, `listed` those it lists with no key.
const ROWS: Row[] = [
    { kind: 'a TeX file', path: 'paper/main.tex', language: 'latex', keyed: EVERY, listed: [] },
    {
        kind: 'a .bib file',
        path: 'paper/refs.bib',
        language: 'bibtex',
        keyed: ['text.textbf', 'math.mathbf'],
        listed: [
            'build',
            'clean',
            'promote',
            'demote',
            'item',
            'surround',
            'selectLine',
            'tabFocus'
        ]
    },
    {
        kind: 'a package',
        path: 'paper/style.sty',
        language: 'latex',
        keyed: ['build', 'clean', 'view'],
        listed: [
            'synctex',
            'mathPreview',
            'promote',
            'demote',
            'item',
            'surround',
            'selectLine',
            'tabFocus',
            'text.textbf',
            'math.mathbf'
        ]
    },
    {
        kind: 'a class',
        path: 'paper/paper.cls',
        language: 'latex',
        keyed: ['build', 'clean', 'view'],
        listed: [
            'synctex',
            'mathPreview',
            'promote',
            'demote',
            'item',
            'surround',
            'selectLine',
            'tabFocus',
            'text.textbf',
            'math.mathbf'
        ]
    }
];

/** The commands among `EVERY` the actions carry, keyed or not, by their name. */
function named(actions: { id: string; keyed: boolean }[], keyed: boolean): string[] {
    return actions
        .filter((one) => one.keyed === keyed)
        .map((one) => one.id.replace(/^oculus\.latex\./, ''))
        .filter((name) => (EVERY as string[]).includes(name))
        .sort();
}

describe('the keys of a LaTeX tab, by the kind of file it shows', () => {
    it.each(ROWS)('$kind takes the keys LaTeX Workshop binds there', (row) => {
        const actions = actionsOf(row.path, row.language);
        expect(named(actions, true)).toEqual([...row.keyed].sort());
        expect(named(actions, false)).toEqual([...row.listed].sort());
    });
});
