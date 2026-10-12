// Layer 4, test. The rows of `:clone`: the first row, which is always there and says an address can
// be typed or clones the address typed, which of the account's repositories the words narrow the
// list to after it, and the repository name an address ends in.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { cloneRows } from '../../../src/lib/state/workbench/palette.ts';
import type { GithubRepo } from '../../../src/lib/data/model/index.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

function repo(name: string, description = '', topics: string[] = []): GithubRepo {
    return {
        name,
        url: `https://github.com/someone/${name}`,
        visibility: 'PUBLIC',
        description,
        homepage: '',
        topics,
        date: '2024-05-06'
    };
}

const TYPE = 'clone:type';

const REPOS = [
    repo('game-engine', 'A small engine'),
    repo('yt-downloader', 'Fetch videos', ['python']),
    repo('rite', 'A scripting language', ['plt', 'language'])
];

describe('the rows of :clone', () => {
    const cases: { name: string; argument: string; values: string[] }[] = [
        {
            name: 'every repository for nothing typed',
            argument: '',
            values: [TYPE, ...REPOS.map((one) => `clone:${one.url}`)]
        },
        {
            name: 'the repositories whose name holds the word',
            argument: 'engine',
            values: [TYPE, 'clone:https://github.com/someone/game-engine']
        },
        {
            name: 'a repository by its description in any case',
            argument: 'SCRIPTING',
            values: [TYPE, 'clone:https://github.com/someone/rite']
        },
        {
            name: 'a repository by a topic',
            argument: 'python',
            values: [TYPE, 'clone:https://github.com/someone/yt-downloader']
        },
        { name: 'only the first row for words nothing holds', argument: 'zzz', values: [TYPE] },
        {
            name: 'a typed address first, and no other row',
            argument: 'https://example.org/team/tool.git',
            values: ['clone:https://example.org/team/tool.git']
        },
        {
            name: 'the repository itself for the address of one in the account',
            argument: 'https://github.com/someone/rite',
            values: ['clone:https://github.com/someone/rite']
        }
    ];
    it.each(cases)('lists $name', ({ argument, values }) => {
        expect(cloneRows(REPOS, argument).map((row) => row.value)).toEqual(values);
    });

    it('names a typed address by the last part of its path', () => {
        const [row] = cloneRows([], 'https://example.org/team/tool.git');
        expect(row.repo).toMatchObject({ name: 'tool', url: 'https://example.org/team/tool.git' });
    });

    it('offers a typed address when the account could not be listed', () => {
        expect(cloneRows([], 'git@github.com:me/thing.git').map((row) => row.repo?.name)).toEqual([
            'thing'
        ]);
    });

    it('has a first row that says an address can be typed when nothing is typed and no repository is listed', () => {
        const [row, ...rest] = cloneRows([], '');
        expect(rest).toEqual([]);
        expect(row).toMatchObject({ value: TYPE, label: t('app.palette.clone_type'), repo: null });
    });

    it('labels the first row of a typed address with the address', () => {
        const [row] = cloneRows(REPOS, 'https://example.org/team/tool.git');
        expect(row.label).toBe(t('app.palette.clone_typed', 'https://example.org/team/tool.git'));
    });

    it("takes the name of the account's repository for the address of one", () => {
        const [row] = cloneRows(REPOS, 'https://github.com/someone/rite');
        expect(row.repo).toEqual({ name: 'rite', url: 'https://github.com/someone/rite' });
    });
});

describe('the name a typed address clones under', () => {
    const cases: [string, string][] = [
        ['https://github.com/me/thing.git', 'thing'],
        ['https://github.com/me/thing/', 'thing'],
        ['git@github.com:me/thing', 'thing'],
        ['ssh://git@host/a/b/c.git', 'c'],
        ['https://github.com/', '']
    ];
    it.each(cases)('%s gives %s', (address, name) => {
        const [row] = cloneRows([], address);
        expect(row.repo?.name ?? '').toBe(name);
        expect(row.value).toBe(name === '' ? 'clone:type' : `clone:${address}`);
    });
});
