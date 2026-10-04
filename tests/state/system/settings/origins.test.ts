// Layer 2, client-state tests. The lines the Settings view says under the `editor.languages` row
// about where a value comes from: each served root whose `.oculus/settings.yml` sets a language, a
// root whose file was not read and why, and the entries of a read file that were skipped, driven
// with a fake file store holding two roots.
//
// What this does NOT cover: the root label opening the file in a source tab, a press seen at the
// look.

import { describe, expect, it } from 'vitest';
import { refusedAnswer } from '../../../../src/lib/state/shared/answers/answers.ts';
import { repoOrigins } from '../../../../src/lib/state/system/config/editors/origins.ts';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import { NO_TEXT } from '../../../../src/lib/state/sources/fs-transport.ts';
import { text } from './fixture.ts';

const FILE = '.oculus/settings.yml';

/** A file store over these answers, by `root/path`; a root without an answer has no such file. */
function store(files: Record<string, FileText>) {
    const asked: string[] = [];
    return {
        asked,
        fileText: (root: string, path: string): FileText => {
            asked.push(`${root}/${path}`);
            return (
                files[`${root}/${path}`] ?? {
                    ...NO_TEXT,
                    loading: false,
                    error: refusedAnswer(404)
                }
            );
        }
    };
}

/** The lines a result says, each as the sentence it is drawn in. */
function said(origins: ReturnType<typeof repoOrigins>): string[] {
    return origins.map((one) => `${one.lead}${one.label}${one.tail}`);
}

describe('where an editor.languages value comes from', () => {
    // Red when a root's languages, an unread file or a skipped entry is not said, or a root with
    // nothing to say draws a line.
    it.each([
        [
            'the languages a root s file sets, by name, and nothing for a file without them',
            {
                [`alpha/${FILE}`]: text(
                    'languages:\n  python: { tab_size: 2 }\n  cpp: { rulers: [80] }\n'
                ),
                [`beta/${FILE}`]: text('other: 1\n')
            },
            ['alpha', 'beta'],
            [['also', 'Also set in alpha: cpp, python']]
        ],
        [
            'nothing for a root without the file, a file being read or an empty one',
            {
                [`b/${FILE}`]: { ...NO_TEXT },
                [`c/${FILE}`]: text(''),
                [`d/${FILE}`]: text('# nothing\n'),
                [`e/${FILE}`]: text('languages: {}\n')
            },
            ['a', 'b', 'c', 'd', 'e'],
            []
        ],
        [
            'a file that does not parse, with the parser s first line',
            { [`alpha/${FILE}`]: text('languages: [unclosed\n') },
            ['alpha'],
            [['unread', 'Not read: alpha/.oculus/settings.yml: ']]
        ],
        [
            'a languages that is not a map',
            { [`alpha/${FILE}`]: text('languages: [a, b]\n') },
            ['alpha'],
            [['unread', 'Not read: alpha/.oculus/settings.yml']]
        ],
        [
            'a file cut at the read limit, and a refused read with why',
            {
                [`cut/${FILE}`]: {
                    ...text('languages: { python: { tab_size: 8 } }\n'),
                    truncated: true
                },
                [`refused/${FILE}`]: { ...NO_TEXT, loading: false, error: refusedAnswer(500) }
            },
            ['cut', 'refused'],
            [
                ['unread', 'Not read: cut/.oculus/settings.yml'],
                ['unread', refusedAnswer(500)]
            ]
        ],
        [
            'each skipped entry under the languages read, and never the file s editor key',
            {
                [`alpha/${FILE}`]: text(
                    'languages: { klingon: { tab_size: 2 }, python: { tabsize: 2, tab_size: 8 } }\neditor: { tab_size: 7 }\n'
                )
            },
            ['alpha'],
            [
                ['also', 'Also set in alpha: python'],
                [
                    'skipped',
                    'Skipped in alpha: klingon: not one of the languages that have colours'
                ],
                ['skipped', 'Skipped in alpha: python.tabsize: not a field of a language record']
            ]
        ]
    ] as [string, Record<string, FileText>, string[], [string, string][]][])(
        'says %s',
        (_name, files, roots, lines) => {
            const origins = repoOrigins(
                roots.map((key) => ({ key })),
                store(files).fileText
            );
            expect(origins.map((one) => one.kind)).toEqual(lines.map(([kind]) => kind));
            said(origins).forEach((one, index) => {
                expect(one).toContain(lines[index][1]);
                expect(one).not.toContain('\n');
            });
        }
    );

    it('asks each root once, whatever the workspaces repeat', () => {
        const held = store({});
        repoOrigins([{ key: 'alpha' }, { key: 'alpha' }], held.fileText);
        expect(held.asked).toEqual([`alpha/${FILE}`]);
    });
});
