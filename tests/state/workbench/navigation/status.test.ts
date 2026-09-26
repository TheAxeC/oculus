// The words of the status bar that the page makes and the bar draws: the server, usage, HPC and
// live-session items from what their channels hold, the repository of the tab on screen from the
// `git` channel and the served roots, and the source items' words, the caret, the indentation and
// the language list. The rules of state/workbench/navigation/status.ts over hand-built payloads.
//
// What this does NOT cover: the bar drawing the words, which is
// tests/shell/status/status-bar.test.ts's, and an item pressed, which is tests/browser/status/'s.

import { describe, expect, it } from 'vitest';
import {
    caretWords,
    findingsCount,
    hpcWords,
    indentWords,
    languageChoices,
    languageName,
    liveCount,
    repoStatus,
    socketWords,
    statusWords,
    tabFile,
    usageWords
} from '../../../../src/lib/state/workbench/navigation/status.ts';
import type {
    GitPayload,
    GitState,
    HpcPayload,
    SessionsPayload,
    UsagePayload
} from '../../../../src/lib/data/model/index.ts';
import { git } from '../../../fixtures/sessions-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { registered } from '../../../../src/lib/state/shared/words/languages.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { allFindings, entityCount } from '../../../../src/lib/state/workbench/navigation/status.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A usage payload whose accounts carry refreshers in these states. */
function usage(...states: string[]): UsagePayload {
    return {
        accounts: states.map((state) => ({
            tool: 'claude',
            label: state,
            dir: '/x',
            refresher: { state, since: '2026-09-23T10:00:00Z', lastRefresh: '' }
        })),
        history: []
    } as unknown as UsagePayload;
}

/** One repository's state as the `git` channel carries it, on `main` tracking `origin/main`. */
function repo(changes: Partial<GitState> = {}): GitState {
    return git({
        upstream: true,
        log: [{ hash: 'a'.repeat(40), short: 'aaaaaaa', subject: 'one', when: '' }],
        branches: [
            { name: 'main', upstream: 'origin/main', current: true },
            { name: 'draft', upstream: '', current: false }
        ],
        ...changes
    });
}

/** The served roots: the hub, a project root added to the file browser, and a folder of notes. */
const ROOTS = [
    { key: 'hub', dir: '/work/hub', fixed: true },
    { key: 'engine', dir: '/work/hub/tools/oculus/config', fixed: true },
    { key: 'paper', dir: '/work/hub/projects/paper', fixed: false },
    { key: 'notes', dir: '/work/notes', fixed: false }
];

describe('the server item', () => {
    it('names each of the three socket states in its own word', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:99 => if (state === 'open') return t('statusbar.server_closed');
        expect(socketWords('closed')).toBe(t('statusbar.server_closed'));
        expect(socketWords('connecting')).toBe(t('statusbar.server_connecting'));
        expect(socketWords('open')).toBe(t('statusbar.server_open'));
    });
});

describe('the usage item', () => {
    it('takes the refreshers together: down wins, then refreshing, and none says so', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:112 => delete
        expect(usageWords(null)).toBe(t('statusbar.usage_none'));
        expect(usageWords(usage('running', 'down', 'refreshing'))).toBe(t('statusbar.usage_down'));
        expect(usageWords(usage('running', 'refreshing'))).toBe(t('statusbar.usage_refreshing'));
        expect(usageWords(usage('running'))).toBe(t('statusbar.usage_ok'));
    });
});

describe('the HPC item', () => {
    it('says the poll is starting, then counts the queue in few words and whole in the tooltip', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:130 => short: t('hpc.queue_summary', data.running, data.pending, data.total),
        expect(hpcWords(null)).toEqual({
            short: t('statusbar.hpc_polling'),
            long: t('hpc.polling')
        });
        const live = {
            status: 'ok',
            total: 3,
            running: 2,
            pending: 1,
            jobs: [],
            updated: '2026-09-23T10:00:00Z',
            pollMin: 2
        } as unknown as HpcPayload;
        expect(hpcWords(live)).toEqual({
            short: t('statusbar.hpc_live', 2, 1),
            long: t('hpc.queue_summary', 2, 1, 3)
        });
        expect(hpcWords({ ...live, status: 'unreachable' }).short).toBe(t('hpc.unreachable'));
    });
});

describe('the live sessions item', () => {
    it('counts the live sessions alone', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:137 => return (sessions?.records ?? []).length;
        const held = {
            records: [{ live: true }, { live: false }, { live: true }]
        } as unknown as SessionsPayload;
        expect(liveCount(held)).toBe(2);
        expect(liveCount(null)).toBe(0);
    });

    it('hands the page every item at once, the machine, findings and repository as it was given them', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:233 => findings: 0,
        const host = { name: 'desk', address: 'http://127.0.0.1:8790' };
        expect(
            statusWords('open', usage('down'), null, null, { host, findings: 4, repo: null })
        ).toEqual({
            host,
            socket: t('statusbar.server_open'),
            usage: t('statusbar.usage_down'),
            hpc: { short: t('statusbar.hpc_polling'), long: t('hpc.polling') },
            live: 0,
            findings: 4,
            repo: null
        });
    });
});

describe('the findings item', () => {
    it("counts the Findings view's list, the snapshot's findings and the config channel's", () => {
        // revert: src/lib/state/workbench/navigation/status.ts:205 => return snapshot?.findings?.length ?? 0;
        expect(findingsCount({ findings: [1, 2] }, { findings: [3] })).toBe(3);
        expect(findingsCount(null, { findings: [3] })).toBe(1);
        expect(findingsCount({ findings: [1] }, null)).toBe(1);
        expect(findingsCount(null, null)).toBe(0);
        expect(findingsCount({}, {})).toBe(0);
    });
});

describe('the repository of the tab on screen', () => {
    it('reads a file tab state as its root key and path, and anything else as no file', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:146 => if (typeof root !== 'string' || typeof path !== 'string') return null;
        expect(tabFile({ root: 'hub', path: 'a.md', label: 'a.md' })).toEqual({
            root: 'hub',
            path: 'a.md'
        });
        expect(tabFile({ root: '', path: 'a.md' })).toBe(null);
        expect(tabFile({ path: 'a.md' })).toBe(null);
        expect(tabFile(null)).toBe(null);
        expect(tabFile(['hub', 'a.md'])).toBe(null);
    });

    it('is the innermost repository holding the file, found through the root its key serves', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:176 => .sort((left, right) => left.length - right.length);
        const git: GitPayload = {
            '/work/hub': repo({ ahead: 1 }),
            '/work/hub/projects/paper': repo({ branch: 'draft', ahead: 2, behind: 3 })
        };
        const inHub = repoStatus({ root: 'hub', path: 'feeds/a.yml' }, ROOTS, git, 'hub');
        expect(inHub).toEqual({
            root: '/work/hub',
            name: 'hub',
            branch: 'main',
            head: '',
            tracked: true,
            upstream: 'origin/main',
            ahead: 1,
            behind: 0,
            branches: ['main', 'draft'],
            remotes: []
        });
        // The project's own repository sits inside the hub's, and holds the file.
        const inPaper = repoStatus(
            { root: 'hub', path: 'projects/paper/main.tex' },
            ROOTS,
            git,
            'hub'
        );
        expect(inPaper?.root).toBe('/work/hub/projects/paper');
        expect(inPaper?.branch).toBe('draft');
        expect(repoStatus({ root: 'paper', path: 'x.tex' }, ROOTS, git, 'hub')?.root).toBe(
            '/work/hub/projects/paper'
        );
        // A root whose folder only starts with the same letters is not inside it.
        const near = { '/work/hub/projects/pap': repo() };
        expect(repoStatus({ root: 'paper', path: 'x.tex' }, ROOTS, near, 'hub')).toBe(null);
    });

    it('reads a tab holding no file as the hub, and a file in no repository as none', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:168 => const key = file?.root ?? 'nowhere';
        const git: GitPayload = { '/work/hub': repo() };
        expect(repoStatus(null, ROOTS, git, 'hub')?.root).toBe('/work/hub');
        expect(repoStatus({ root: 'notes', path: 'a.md' }, ROOTS, git, 'hub')).toBe(null);
        expect(repoStatus({ root: 'unknown', path: 'a.md' }, ROOTS, git, 'hub')).toBe(null);
        expect(repoStatus(null, ROOTS, null, 'hub')).toBe(null);
        // A folder that is no repository, and one whose read failed, hold no branch to draw.
        const off = {
            '/work/hub': repo({ repository: false }),
            '/work/hub/projects/paper': repo({ error: 'git failed' })
        };
        expect(repoStatus({ root: 'paper', path: 'x.tex' }, ROOTS, off, 'hub')).toBe(null);
    });

    it('names the commit of a detached head, and says a branch with no upstream tracks none', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:186 => head: '',
        const detached = repoStatus(
            null,
            ROOTS,
            { '/work/hub': repo({ detached: true, branch: 'HEAD', upstream: false }) },
            'hub'
        );
        expect(detached).toMatchObject({
            branch: '',
            head: 'aaaaaaa',
            tracked: false,
            upstream: ''
        });
        const lone = repoStatus(null, ROOTS, { '/work/hub': repo({ upstream: false }) }, 'hub');
        expect(lone).toMatchObject({ branch: 'main', tracked: false, upstream: '' });
    });
});

describe('the source items words', () => {
    it('puts the line and the column, and the selection when there is one', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:241 => return at;
        expect(caretWords({ line: 12, column: 4, selected: 0 })).toBe('Ln 12, Col 4');
        expect(caretWords({ line: 3, column: 1, selected: 7 })).toBe('Ln 3, Col 1 (7 selected)');
    });

    it('says spaces or tabs and the width of one step', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:246-248 => return t('statusbar.indent_spaces', indent.size);
        expect(indentWords({ tabs: false, size: 2 })).toBe('Spaces: 2');
        expect(indentWords({ tabs: true, size: 4 })).toBe('Tab Size: 4');
    });

    it('names every language the highlighter paints, and a name it does not as Plain Text', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:253 => const known = name;
        for (const name of registered()) expect(languageName(name)).not.toContain('statusbar.');
        expect(languageName('python')).toBe('Python');
        expect(languageName('cobol')).toBe(t('statusbar.language_plaintext'));
    });

    it('lists Plain Text first and the rest by name, and narrows the list to a query', () => {
        // revert: src/lib/state/workbench/navigation/status.ts:275-280 => return all;
        const all = languageChoices('');
        expect(all.map((choice) => choice.name).sort()).toEqual([...registered()].sort());
        expect(all[0].name).toBe('plaintext');
        const rest = all.slice(1).map((choice) => choice.label);
        expect(rest).toEqual([...rest].sort((left, right) => left.localeCompare(right)));
        expect(languageChoices('PYT').map((choice) => choice.name)).toEqual(['python']);
        expect(languageChoices('script').map((choice) => choice.name)).toEqual([
            'javascript',
            'bash',
            'typescript'
        ]);
        expect(languageChoices('zzz')).toEqual([]);
    });
});

describe('the findings and the entity counts the page reads', () => {
    // revert: src/lib/state/workbench/navigation/status.ts:216 => return [...(snapshot?.findings ?? [])];
    it('lists the portfolio findings, then the configuration ones', () => {
        expect(allFindings({ findings: ['a', 'b'] }, { findings: ['c'] })).toEqual(['a', 'b', 'c']);
        expect(allFindings(null, { findings: ['c'] })).toEqual(['c']);
        expect(allFindings<string>(null, null)).toEqual([]);
    });

    // revert: src/lib/state/workbench/navigation/status.ts:292 => return snapshot === null ? 0 : 1;
    it('counts the entities of one kind, and none before the portfolio arrives', () => {
        const snapshot = {
            entities: { venues: { a: {}, b: {}, c: {} }, projects: {} }
        } as unknown as Parameters<typeof entityCount>[0];
        expect(entityCount(snapshot, 'venues')).toBe(3);
        expect(entityCount(snapshot, 'projects')).toBe(0);
        expect(entityCount(null, 'venues')).toBe(0);
    });
});
