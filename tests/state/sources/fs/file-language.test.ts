// Layer 2, client-state test. The language a file name opens in: `languageOf(name, map)` over the
// map the checked-in config/sources.yml holds, so a change to the file's `languages:` is held to
// every name the research tree carries. The map is the tracked one in every case but those of
// "a map the config does not carry".
//
// The last describe covers the selector that hands the map to a view: empty until the config has
// come, the tracked map after. What this does NOT cover: the grammars that colour a language
// (tests/ui/controls/editor/kit/) and that readers of one config share one map inside an effect
// (languages-selector.client.test.ts).

import { describe, expect, it } from 'vitest';
import { languageMap } from '../../../../src/lib/data/helpers/files/languages.ts';
import { registered } from '../../../../src/lib/data/prose/languages.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { languageOf, languages, typeOfFile } from '../../../../src/lib/state/sources/fs.ts';

const CONFIG = loadConfig(engineDir()).config;
const MAP = languageMap(CONFIG);

/** The language each name opens in, as a list of pairs a failure prints whole. */
function opened(names: string[], map = MAP): [string, string][] {
    return names.map((name) => [name, languageOf(name, map)]);
}

describe('the language of a name, over the tracked map', () => {
    it('opens the names a research tree carries in their languages', () => {
        expect(
            opened([
                'run_all.sh',
                'job.slurm',
                'main.tex',
                'refs.bib',
                'notes.md',
                'Paper.ipynb',
                'config.yml'
            ])
        ).toEqual([
            ['run_all.sh', 'bash'],
            ['job.slurm', 'bash'],
            ['main.tex', 'latex'],
            ['refs.bib', 'latex'],
            ['notes.md', 'markdown'],
            ['Paper.ipynb', 'json'],
            ['config.yml', 'yaml']
        ]);
    });

    it('reads a stub file as Python and a Svelte component as Svelte', () => {
        expect(opened(['stubs.pyi', 'Component.svelte', 'a/b/View.SVELTE'])).toEqual([
            ['stubs.pyi', 'python'],
            ['Component.svelte', 'svelte'],
            ['a/b/View.SVELTE', 'svelte']
        ]);
    });

    it('reads a whole name before an extension, in any case', () => {
        expect(
            opened([
                'Makefile',
                'makefile',
                'src/MAKEFILE',
                'CMakeLists.txt',
                'notes.txt',
                'build.cmake'
            ])
        ).toEqual([
            ['Makefile', 'makefile'],
            ['makefile', 'makefile'],
            ['src/MAKEFILE', 'makefile'],
            ['CMakeLists.txt', 'cmake'],
            ['notes.txt', 'plaintext'],
            ['build.cmake', 'cmake']
        ]);
    });

    it('reads the languages beyond the first eighteen', () => {
        expect(
            opened([
                'main.c',
                'rite.cpp',
                'x.hpp',
                'x.h',
                'init.lua',
                'Gemfile',
                'a.rb',
                's.scss',
                'A.java',
                'm.dart',
                'm.f90',
                'old.f',
                't.jinja',
                't.j2',
                'x.rite'
            ])
        ).toEqual([
            ['main.c', 'c'],
            ['rite.cpp', 'cpp'],
            ['x.hpp', 'cpp'],
            ['x.h', 'cpp'],
            ['init.lua', 'lua'],
            ['Gemfile', 'ruby'],
            ['a.rb', 'ruby'],
            ['s.scss', 'scss'],
            ['A.java', 'java'],
            ['m.dart', 'dart'],
            ['m.f90', 'fortran'],
            ['old.f', 'fortran-fixed'],
            ['t.jinja', 'jinja'],
            ['t.j2', 'jinja'],
            ['x.rite', 'rite']
        ]);
    });

    it('leaves Wren and Graphviz as plain text', () => {
        expect(opened(['x.wren', 'g.dot', 'g.gv']).map(([, language]) => language)).toEqual([
            'plaintext',
            'plaintext',
            'plaintext'
        ]);
    });

    // Each language's names and aliases, used as an extension, and the whole name Makefile, each
    // with the language the tracked map gives it.
    it('gives each listed name and ending the language the tracked map gives it', () => {
        const aliases: Record<string, string[]> = {
            bash: ['bash', 'sh', 'zsh', 'slurm'],
            css: ['css'],
            diff: ['diff', 'patch'],
            ini: ['ini', 'toml'],
            javascript: ['javascript', 'js', 'jsx', 'mjs', 'cjs'],
            json: ['json', 'jsonc', 'json5', 'ipynb'],
            julia: ['julia', 'jl'],
            latex: ['latex', 'tex', 'bib', 'sty', 'cls'],
            lisp: ['lisp', 'el', 'scm'],
            makefile: ['makefile', 'mk', 'mak', 'make'],
            markdown: ['markdown', 'md', 'mkdown', 'mkd'],
            matlab: ['matlab', 'm'],
            ocaml: ['ocaml', 'ml', 'mli'],
            plaintext: ['plaintext', 'text', 'txt'],
            python: ['python', 'py', 'gyp', 'ipython'],
            r: ['r'],
            typescript: ['typescript', 'ts', 'tsx', 'mts', 'cts'],
            xml: [
                'xml',
                'html',
                'xhtml',
                'rss',
                'atom',
                'xjb',
                'xsd',
                'xsl',
                'plist',
                'wsf',
                'svg'
            ],
            yaml: ['yaml', 'yml']
        };
        const wanted: [string, string][] = [];
        for (const [language, list] of Object.entries(aliases)) {
            for (const alias of list) wanted.push([`x.${alias}`, language]);
        }
        wanted.push(['Makefile', 'makefile'], ['src/makefile', 'makefile']);
        expect(opened(wanted.map(([name]) => name))).toEqual(wanted);
        expect(registered().every((name) => languages(MAP).includes(name))).toBe(true);
    });

    it('reads a name in any case and a path by its last name', () => {
        expect(opened(['X.PY', 'dir.py/readme', 'a/b/x.d.ts', 'x.test.ts'])).toEqual([
            ['X.PY', 'python'],
            ['dir.py/readme', 'plaintext'],
            ['a/b/x.d.ts', 'typescript'],
            ['x.test.ts', 'typescript']
        ]);
    });

    it('reads a dotfile as plain text, whatever follows the dot, and a double extension by its last', () => {
        expect(
            opened(['.bashrc', '.gitignore', '.py', '.c', '.makefile', 'CMakeLists.txt.in'])
        ).toEqual([
            ['.bashrc', 'plaintext'],
            ['.gitignore', 'plaintext'],
            ['.py', 'plaintext'],
            ['.c', 'plaintext'],
            ['.makefile', 'plaintext'],
            ['CMakeLists.txt.in', 'plaintext']
        ]);
    });

    it('reads a name an object inherits as plain text', () => {
        expect(opened(['constructor', 'toString', '__proto__', 'x.constructor'])).toEqual([
            ['constructor', 'plaintext'],
            ['toString', 'plaintext'],
            ['__proto__', 'plaintext'],
            ['x.constructor', 'plaintext']
        ]);
    });

    it('lists every language the map names, plain text among them', () => {
        expect(languages(MAP).sort()).toEqual([...registered()].sort());
        expect(languages(new Map()).sort()).toEqual(['plaintext']);
    });
});

describe('a map the config does not carry', () => {
    it('opens every name as plain text', () => {
        const none = languageMap({});
        expect(
            opened(['main.c', 'Makefile', 'x.py'], none).map(([, language]) => language)
        ).toEqual(['plaintext', 'plaintext', 'plaintext']);
    });

    it('follows a map that gives the ending to another language, or to none', () => {
        const mine = languageMap({ languages: { cpp: ['.h'], python: ['.py'] } });
        expect(opened(['x.h', 'x.py', 'x.c'], mine)).toEqual([
            ['x.h', 'cpp'],
            ['x.py', 'python'],
            ['x.c', 'plaintext']
        ]);
        const removed = languageMap({ languages: { python: ['.pyi'] } });
        expect(opened(['x.py', 'x.pyi'], removed)).toEqual([
            ['x.py', 'plaintext'],
            ['x.pyi', 'python']
        ]);
    });
});

describe('what a name says of how a file opens', () => {
    it('answers the kind alone', () => {
        expect(typeOfFile('manual.html')).toEqual({ kind: 'html' });
        expect(typeOfFile('paper.pdf')).toEqual({ kind: 'pdf' });
        expect(typeOfFile('a.png')).toEqual({ kind: 'image' });
        expect(typeOfFile('run.py', new TextEncoder().encode('x = 1\n'))).toEqual({ kind: 'text' });
        expect(typeOfFile('run.py')).toEqual({ kind: 'other' });
    });
});

describe('the selector that hands the map to a view', () => {
    let version = 0;

    function speak(client: ReturnType<typeof createClientState>, config: Record<string, unknown>) {
        version += 1;
        client.entities.receive({
            channel: 'config',
            version,
            payload: { config, text: textCatalog(CONFIG), findings: [] }
        });
    }

    it('answers no map until the config channel has spoken, then the tracked one', () => {
        const client = createClientState();
        const { languages: selected } = client.selectors;
        expect(selected().size).toBe(0);
        expect(languageOf('main.c', selected())).toBe('plaintext');

        speak(client, CONFIG);
        expect([...selected()]).toEqual([...MAP]);
        expect(languageOf('main.c', selected())).toBe('c');
    });

    it('follows a later change of the map', () => {
        const client = createClientState();
        speak(client, CONFIG);
        const first = client.selectors.languages();
        expect([...client.selectors.languages()]).toEqual([...first]);

        speak(client, { ...CONFIG, languages: { python: ['.py'] } });
        const second = client.selectors.languages();
        expect([...second]).toEqual([['.py', 'python']]);
        expect(languageOf('main.c', second)).toBe('plaintext');

        speak(client, { ...CONFIG, languages: undefined });
        expect(client.selectors.languages().size).toBe(0);
    });
});
