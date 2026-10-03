// Layer 3, primitive test. The bracket folding of the languages Monaco ships no language service
// for: the ranges a text gives, the string, character and comment rules of each language, the C++
// access labels, and the registration that hands a model's lines to them.
//
// What this does NOT cover: that Monaco takes a registered provider for the folding gutter and for
// sticky scroll, which the look does.

import { describe, expect, it } from 'vitest';
import {
    foldingRanges,
    registerFolding
} from '../../../../../src/lib/ui/controls/editor/kit/folding.ts';

/** The ranges of a text, as `[start, end]` pairs of 1-based lines. */
function ranges(language: string, text: string): [number, number][] {
    return foldingRanges(language, text.split('\n')).map((range) => [range.start, range.end]);
}

const C_TEXT = [
    'void f() {',
    '  puts("{");',
    "  char c = '{';",
    '  // {',
    '  /* { */',
    '  /*',
    '  {',
    '  */',
    '  char d = \'\\\'\'; puts("\\"{");',
    '}'
].join('\n');

const CLASS = [
    'namespace n {',
    'class K {',
    'public:',
    '  int a;',
    'private:',
    '  int b;',
    '};',
    '}'
].join('\n');

describe('the ranges of a text', () => {
    // Red when a range runs past its block, a brace inside a string, a character literal or a
    // comment opens or closes one, or a C++ access label opens none or runs past the next label.
    it.each([
        [
            'nested braces, to the line before the matching }',
            'c',
            ['int main() {', '  if (x) {', '    y();', '  }', '  z();', '}'].join('\n'),
            [
                [1, 5],
                [2, 3]
            ]
        ],
        [
            'blocks of fewer than two lines',
            'c',
            'int a[] = {1, 2};\nvoid f() {\n}\nvoid g() { h(); }',
            []
        ],
        ['a { never closed', 'c', 'void f() {\n  g();\n  h();', []],
        ['C comments, strings and characters', 'c', C_TEXT, [[1, 9]]],
        ['the same in C++', 'cpp', C_TEXT, [[1, 9]]],
        ['the same in Java', 'java', C_TEXT, [[1, 9]]],
        ['the same in Dart', 'dart', C_TEXT, [[1, 9]]],
        [
            'a } after a block comment on its line',
            'c',
            'void f() {\n  g();\n  h();\n/* done */ }',
            [[1, 3]]
        ],
        [
            'an R comment and both quote kinds',
            'r',
            ['f <- function() {', '  # {', '  x <- "{"', "  y <- '{'", '}'].join('\n'),
            [[1, 4]]
        ],
        [
            'a rite ; comment and a string',
            'rite',
            ['(def f {', '  ; {', '  "{"', '})'].join('\n'),
            [[1, 3]]
        ],
        [
            'a // in R, which is no comment there',
            'r',
            ['x <- {', '  a // {', '  b', '}'].join('\n'),
            [[2, 3]]
        ],
        [
            'C++ access labels',
            'cpp',
            CLASS,
            [
                [1, 7],
                [2, 6],
                [3, 4],
                [5, 6]
            ]
        ],
        [
            'a Java class, which has no labels',
            'java',
            CLASS,
            [
                [1, 7],
                [2, 6]
            ]
        ],
        [
            'protected: with trailing spaces, and a label inside a comment',
            'cpp',
            ['class K {', 'protected:  ', '  int a;', '  int b;', '  // private:', '};'].join('\n'),
            [
                [1, 5],
                [2, 5]
            ]
        ],
        [
            'a label of a nested block',
            'cpp',
            [
                'class A {',
                'public:',
                '  struct B {',
                '  private:',
                '    int x;',
                '    int y;',
                '  };',
                '  int z;',
                '};'
            ].join('\n'),
            [
                [1, 8],
                [2, 8],
                [3, 6],
                [4, 6]
            ]
        ]
    ] as [string, string, string, [number, number][]][])(
        'folds %s',
        (_name, language, text, expected) => {
            expect(ranges(language, text)).toEqual(expected);
        }
    );
});

describe('the registration', () => {
    it('registers one provider per language, answering from the model it is handed', () => {
        const registered = new Map<string, { provideFoldingRanges: (model: never) => unknown }>();
        registerFolding({
            languages: {
                registerFoldingRangeProvider: (
                    language: string,
                    provider: { provideFoldingRanges: (model: never) => unknown }
                ) => {
                    registered.set(language, provider);
                    return { dispose: () => undefined };
                }
            }
        } as never);
        expect([...registered.keys()].sort()).toEqual(['c', 'cpp', 'dart', 'java', 'r', 'rite']);
        const lines = ['void f() {', '  g();', '}'];
        const model = { getLanguageId: () => 'c', getLinesContent: () => lines };
        expect(registered.get('c')?.provideFoldingRanges(model as never)).toEqual([
            { start: 1, end: 2 }
        ]);
    });
});
