// Layer 2, client-state tests. The language a file name opens in: `languageOf(name, map)` over a
// hand-written map, so each rule of the lookup is held by a map that carries only what the case
// needs, and the selector that hands the config's map to a view: empty until the config has come,
// the config's map after.
//
// What this does NOT cover: the content of the tracked map
// (tests/data/helpers/files/languages.test.ts), the grammars that colour a language
// (tests/ui/controls/editor/kit/) and that readers of one config share one map inside an effect
// (languages-selector.client.test.ts).

import { describe, expect, it } from 'vitest';
import { languageMap } from '../../../../src/lib/data/helpers/files/languages.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { languageOf, languages } from '../../../../src/lib/state/sources/fs.ts';

const CONFIG = loadConfig(engineDir()).config;
const TRACKED = languageMap(CONFIG);

/** A map with a whole name, a name that begins like one, and the endings the cases below read. */
const MAP = languageMap({
    languages: {
        python: ['.py', '.pyi'],
        typescript: ['.ts'],
        makefile: ['Makefile', '.mk'],
        cmake: ['CMakeLists.txt'],
        plaintext: ['.txt']
    }
});

/** The language each name opens in, as a list of pairs a failure prints whole. */
function opened(names: string[], map = MAP): [string, string][] {
    return names.map((name) => [name, languageOf(name, map)]);
}

describe('the language of a name', () => {
    it('reads a whole name before an extension, in any case', () => {
        expect(
            opened(['Makefile', 'makefile', 'src/MAKEFILE', 'CMakeLists.txt', 'notes.txt', 'a.mk'])
        ).toEqual([
            ['Makefile', 'makefile'],
            ['makefile', 'makefile'],
            ['src/MAKEFILE', 'makefile'],
            ['CMakeLists.txt', 'cmake'],
            ['notes.txt', 'plaintext'],
            ['a.mk', 'makefile']
        ]);
    });

    it('reads a name in any case and a path by its last name', () => {
        expect(opened(['X.PY', 'dir.py/readme', 'a/b/x.d.ts', 'x.test.ts', 'x.txt.py'])).toEqual([
            ['X.PY', 'python'],
            ['dir.py/readme', 'plaintext'],
            ['a/b/x.d.ts', 'typescript'],
            ['x.test.ts', 'typescript'],
            ['x.txt.py', 'python']
        ]);
    });

    it('reads a dotfile, and a name that only begins like a whole name, as plain text', () => {
        expect(opened(['.bashrc', '.py', 'CMakeLists.txt.in'])).toEqual([
            ['.bashrc', 'plaintext'],
            ['.py', 'plaintext'],
            ['CMakeLists.txt.in', 'plaintext']
        ]);
    });

    it('opens every name as plain text in a map the config does not carry', () => {
        const none = languageMap({});
        expect(opened(['Makefile', 'x.py'], none).map(([, language]) => language)).toEqual([
            'plaintext',
            'plaintext'
        ]);
    });

    it('lists the languages a map names once each, and plain text', () => {
        expect(languages(MAP).sort()).toEqual([
            'cmake',
            'makefile',
            'plaintext',
            'python',
            'typescript'
        ]);
        expect(
            languages(languageMap({ languages: { python: ['.py'], bash: ['.sh'] } })).sort()
        ).toEqual(['bash', 'plaintext', 'python']);
        expect(languages(new Map()).sort()).toEqual(['plaintext']);
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
        expect([...selected()]).toEqual([...TRACKED]);
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
