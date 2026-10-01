// The editor's languages: every name the highlighter registers answers the Shiki grammar the editor
// colours it with, checked against the grammars the installed shiki bundles, and each grammar
// loaded into a real highlighter to tokenize a line of its language.

import { bundledLanguages, createHighlighter, type BundledLanguage } from 'shiki';
import { describe, expect, it } from 'vitest';
import {
    FIRST_LANGUAGES,
    SHIKI_LANGUAGES,
    SHIKI_NAMES,
    shikiId
} from '../../../../../src/lib/ui/controls/editor/kit/grammars.ts';
import { RITE_GRAMMAR } from '../../../../../src/lib/ui/controls/editor/kit/rite/rite.ts';
import { registered } from '../../../../../src/lib/state/shared/words/languages.ts';

describe('the language map', () => {
    // Red when a name answers an id the installed shiki does not bundle.
    it('answers a grammar shiki bundles for each of the thirty-two names, plaintext its own', () => {
        const names = registered();
        expect(names).toHaveLength(32);
        for (const name of names) {
            const id = shikiId(name);
            if (name === 'plaintext') expect(id).toBe('plaintext');
            else if (name === 'rite') expect(id).toBe('rite');
            else expect({ name, bundled: id in bundledLanguages }).toEqual({ name, bundled: true });
        }
    });

    // Red when the editor can colour a language the highlighter does not register, or the other
    // way round, since the map of config/sources.yml accepts the highlighter's names.
    it('holds the names the highlighter registers and no other, plaintext apart', () => {
        expect([...SHIKI_NAMES, 'plaintext'].sort()).toEqual([...registered()].sort());
    });

    // Red when one of the five names is looked up under oculus's spelling.
    it('maps the names shiki spells otherwise, and the rest by their own name', () => {
        expect(shikiId('lisp')).toBe('common-lisp');
        expect(shikiId('makefile')).toBe('make');
        expect(shikiId('bash')).toBe('shellscript');
        expect(shikiId('fortran')).toBe('fortran-free-form');
        expect(shikiId('fortran-fixed')).toBe('fortran-fixed-form');
        expect(shikiId('python')).toBe('python');
        expect(shikiId('latex')).toBe('latex');
        expect(shikiId('svelte')).toBe('svelte');
        expect(shikiId('cpp')).toBe('cpp');
    });

    // Red when an unknown name, or a name on Object's prototype, answers anything but plaintext.
    it('answers plaintext for a name outside the thirty-one', () => {
        expect(shikiId('cobol')).toBe('plaintext');
        expect(shikiId('')).toBe('plaintext');
        expect(shikiId('constructor')).toBe('plaintext');
        expect(shikiId('Python')).toBe('plaintext');
    });

    // Red when a grammar is loaded twice or plaintext is asked of Shiki.
    it('loads the eighteen first grammars once each and lists thirty-one in all', () => {
        expect(FIRST_LANGUAGES).toHaveLength(18);
        expect(new Set(FIRST_LANGUAGES).size).toBe(18);
        expect(SHIKI_LANGUAGES).toHaveLength(31);
        expect(new Set(SHIKI_LANGUAGES).size).toBe(31);
        expect(SHIKI_LANGUAGES).not.toContain('plaintext');
        for (const id of FIRST_LANGUAGES) expect(SHIKI_LANGUAGES).toContain(id);
    });

    // Red when a first grammar moves to the lazy ones: the first editor would paint it plain.
    it('keeps the eighteen first grammars of the first editor as they were', () => {
        expect([...FIRST_LANGUAGES].sort()).toEqual(
            [
                'shellscript',
                'css',
                'diff',
                'ini',
                'javascript',
                'json',
                'julia',
                'latex',
                'common-lisp',
                'make',
                'markdown',
                'matlab',
                'ocaml',
                'python',
                'r',
                'typescript',
                'xml',
                'yaml'
            ].sort()
        );
    });
});

/** One line of each language, with a construct its grammar scopes beyond a bare word. */
const SAMPLES: Record<string, string> = {
    bash: 'if [ -f "$1" ]; then echo done; fi',
    css: 'a { color: #fff; }',
    diff: '@@ -1,2 +1,2 @@',
    ini: '[section]',
    javascript: 'const x = 1;',
    json: '{"a": 1}',
    julia: 'function f(x) return x end',
    latex: '\\section{Title} % note',
    lisp: '(defun add (a b) (+ a b))',
    makefile: 'all: main.o',
    markdown: '# Title **bold**',
    matlab: 'function y = f(x)',
    ocaml: 'let x = 1 in x',
    python: 'def f(x): return x',
    r: 'x <- c(1, 2)',
    typescript: 'const x: number = 1;',
    xml: '<a b="c">d</a>',
    yaml: 'key: [1, 2]',
    c: '#include <stdio.h>',
    cpp: 'template <typename T> class A {};',
    cmake: 'project(demo VERSION 1.0)',
    lua: 'local function f(x) return x end',
    ruby: 'def f(x) x end',
    scss: '$gap: 4px; a { b { margin: $gap; } }',
    java: 'public class A { int x = 1; }',
    dart: 'void main() { final x = 1; }',
    fortran: 'program demo',
    'fortran-fixed': '      PROGRAM DEMO',
    jinja: '{% for item in items %}{{ item }}{% endfor %}',
    svelte: '<script lang="ts">let x = 1;</script><p>{x}</p>',
    rite: '(defn add [a b] (+ a b)) ; sum'
};

describe('each grammar, loaded into a real highlighter', () => {
    it('has a sample for every language the editor colours', () => {
        expect(Object.keys(SAMPLES).sort()).toEqual([...SHIKI_NAMES].sort());
    });

    // Red when an id does not load, or loads a grammar that scopes nothing in a line of its own
    // language. A theme is needed to tokenize and is irrelevant to the scopes.
    it.each(Object.entries(SAMPLES))('loads %s and scopes a line of it', async (name, line) => {
        const id = shikiId(name);
        const highlighter = await createHighlighter({ themes: ['github-dark'], langs: [] });
        await highlighter.loadLanguage(name === 'rite' ? RITE_GRAMMAR : (id as BundledLanguage));
        expect(highlighter.getLoadedLanguages()).toContain(id);
        const lines = highlighter.codeToTokensBase(line, {
            lang: id as BundledLanguage,
            includeExplanation: true
        });
        const scopes = new Set<string>();
        for (const token of lines.flat()) {
            for (const part of token.explanation ?? []) {
                for (const scope of part.scopes) scopes.add(scope.scopeName);
            }
        }
        expect({ name, distinct: scopes.size > 1 }).toEqual({ name, distinct: true });
        highlighter.dispose();
    });

    it('tokenizes a TypeScript block of a Svelte component with TypeScript scopes', async () => {
        const highlighter = await createHighlighter({ themes: ['github-dark'], langs: ['svelte'] });
        const lines = highlighter.codeToTokensBase(
            '<script lang="ts">\n    let x: number = 1;\n</script>\n<p>{x}</p>\n',
            { lang: 'svelte', includeExplanation: true }
        );
        const scopes = lines
            .flat()
            .flatMap((token) => token.explanation ?? [])
            .flatMap((part) => part.scopes.map((scope) => scope.scopeName));
        expect(scopes).toContain('source.ts');
        expect(scopes).toContain('support.type.primitive.ts');
        highlighter.dispose();
    });

    it('loads the rite grammar from the module with the scope source.rite', async () => {
        expect(RITE_GRAMMAR).toMatchObject({ name: 'rite', scopeName: 'source.rite' });
        const highlighter = await createHighlighter({
            themes: ['github-dark'],
            langs: [RITE_GRAMMAR]
        });
        const [line] = highlighter.codeToTokensBase('(def x "a") ; note', {
            lang: 'rite' as BundledLanguage,
            includeExplanation: true
        });
        const scopes = line.flatMap((token) =>
            (token.explanation ?? []).flatMap((part) => part.scopes.map((one) => one.scopeName))
        );
        expect(scopes).toContain('source.rite');
        expect(scopes).toContain('comment.line.semicolon.rite');
        expect(scopes).toContain('string.quoted.double.rite');
        highlighter.dispose();
    });
});
