// Layer 2, route tests. POST /api/terminal, the interactive chat action: the argv of the chat a
// project or the portfolio starts, the private index written before the session starts, and the
// section the index holds for each hub of the workspace.
//
// Nothing here runs tmux, `claude` or `codex`. handleTerminal is called with an options bag
// holding a `run` that records the argv and answers the list itself. The only real path any case
// touches is the temporary directory the fixture's test.beforeAll makes once per file.
//
// Every case runs in npm test.
// @module-tag slow: the chat cases write a workspace's index for each hub, which runs past the
// default timeout when the quick suite runs many files at once.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { it, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
import { chatIndexPath } from '../../../src/lib/server/machine/pty/start/chat.ts';
import {
    SERVER,
    TOKEN,
    makeTaskConfig,
    type TaskConfig,
    CHAT_CONFIG,
    CHAT_CATALOG,
    tmux,
    lineOf,
    request,
    command,
    answer,
    worldOf,
    chatWorld,
    type ChatFolder
} from './terminal-fixture.ts';

/** This file's scratch folder and what the fixture planted in it, made before its first case. */
let task: TaskConfig;

test.beforeAll(() => {
    task = makeTaskConfig();
});

test.afterAll(() => {
    SERVER.close();
});

describe('POST /api/terminal, the chat action', () => {
    function chatOptions(driver: ReturnType<typeof tmux>): TerminalOptions {
        return {
            ...worldOf(task.chatHub),
            engine: task.chatEngine,
            run: driver.run,
            projectFor: (id) =>
                id === 'hub:alpha'
                    ? { title: 'Alpha Study', folder: 'projects/active/alpha', root: 'hub' }
                    : null,
            configFor: () => CHAT_CONFIG
        };
    }

    it('starts a focused interactive Claude terminal and writes its private index first', async () => {
        const driver = tmux();
        const routed = chatOptions(driver);
        const run = routed.run;
        let indexAtStart = false;
        routed.run = async (args, options) => {
            if (args[0] === 'new-session') {
                const id = (args[3] ?? '').replace(/^oculus-/, '');
                indexAtStart = existsSync(chatIndexPath(join(task.chatState, 'sessions.json'), id));
            }
            return run === undefined ? '' : run(args, options);
        };
        const response = await handleTerminal(
            request({ action: 'chat', id: 'hub:alpha', cols: 101, rows: 31 }),
            TOKEN,
            routed
        );
        expect(response.status).toBe(200);
        const terminal = (await answer(response)).terminal as { id: string; name: string };
        expect(terminal.name).toBe(
            CHAT_CATALOG['server.chat.chat_name_focus'].replace('{0}', 'Alpha Study')
        );

        const index = chatIndexPath(join(task.chatState, 'sessions.json'), terminal.id);
        expect(index.startsWith(task.chatState + sep)).toBe(true);
        const written = readFileSync(index, 'utf8');
        expect(written).toContain(`# HUB hub: ${task.chatHub}\n`);
        expect(written).toContain('\n### projects/active/alpha\n');
        expect(statSync(index).mode & 0o777).toBe(0o600);
        const system = [
            CHAT_CATALOG['server.chat.chat_instruction']
                .replace('{0}', task.chatHub)
                .replace('{1}', task.chatProject)
                .replace('{2}', CHAT_CATALOG['server.chat.chat_user_fallback'])
                // The Markdown documents of oculus's `project_docs`, then the folder of its mains
                // and its `code_dir`, as a hub that sets none of them reads them.
                .replace('{3}', 'README.md, code/README.md, manuscript/ and code/'),
            CHAT_CATALOG['server.chat.chat_focus_note']
                .replace('{0}', 'alpha')
                .replace('{1}', 'Alpha Study')
                .replace('{2}', task.chatProject),
            CHAT_CATALOG['server.chat.chat_index_note'].replace('{0}', index)
        ].join('\n\n');
        expect(system).toContain(`This chat runs in the hub whose folder is \`${task.chatHub}\`.`);
        expect(system).toContain(
            "every folder in a section is relative to that hub's folder unless it is absolute"
        );
        expect(system).toContain('against the folder of the hub whose section lists it');
        expect(system).toContain(`Your working directory is \`${task.chatProject}\``);
        expect(system).not.toMatch(/\{[012]\}|CONTEXT\.md|NEXT\.md|METHOD_NOTES|RELATED_WORK/);
        const expected = command([
            '/opt/Claude CLI/claude',
            '--append-system-prompt',
            system,
            '--disallowedTools',
            'Bash,Edit,Write,WebFetch,WebSearch',
            '--model',
            'claude-opus-4-1',
            CHAT_CATALOG['server.chat.seed_focus'].replace('{0}', 'Alpha Study')
        ]);
        const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(started[started.indexOf('-c') + 1]).toBe(task.chatProject);
        expect(started[started.indexOf('-x') + 1]).toBe('101');
        expect(started[started.indexOf('-y') + 1]).toBe('31');
        expect(lineOf(started)).toEqual([expected]);
        expect(lineOf(started)[0]).not.toContain("'-p'");
        expect(indexAtStart).toBe(true);
        expect(system).toContain('research hub of its user (oculus)');
        expect(system).not.toMatch(/null|negative result| - /);

        const owned = tmux();
        const named = await handleTerminal(
            request({ action: 'chat', id: 'hub:alpha', cols: 101, rows: 31 }),
            TOKEN,
            { ...chatOptions(owned), userFor: () => 'John Smith' }
        );
        expect(named.status).toBe(200);
        const ownedStart = owned.calls.find((args) => args[0] === 'new-session') ?? [];
        expect(lineOf(ownedStart)[0]).toContain('research hub of John Smith (oculus)');
        expect(lineOf(ownedStart)[0]).not.toContain('its user');
    });

    const VENUES = '.oculus/data/research/venues.yml';
    const PILLARS = '.oculus/data/pillars/pillars.yml';
    const FUNDING = '.oculus/data/academic/funding.yml';
    const EVENTS = '.oculus/data/academic/events.yml';
    const PEOPLE = '.oculus/data/people/people.yml';
    const LEADS = '.oculus/data/academic/leads.yml';
    const MANIFESTS = '## PROJECT MANIFESTS (status/venue source of truth)';
    const manifest = (name: string): string => `projects/active/${name}/project.yml`;
    /** The lines of a file of a hub's section: its heading and its planted line. */
    const fileLines = (hub: string, path: string): string[] => [
        `## ${path}`,
        `planted: ${hub}/${path}`
    ];
    /** The lines of a project of a hub's section: its folder's heading and its planted line. */
    const projectLines = (hub: string, name: string): string[] => [
        `### projects/active/${name}`,
        `planted: ${hub}/${manifest(name)}`
    ];
    /**
     * The lines of the head's venue catalogue of the primary `hub`, headed by its absolute
     * path.
     */
    const venueLines = (at: (name: string) => string): string[] => [
        `# ${join(at('hub'), VENUES)} (venue catalogue)`,
        `planted: hub/${VENUES}`
    ];

    /**
     * Three hubs, `hub` the primary holding a pillars registry, none setting chat_context, `other`
     * holding a venue file too.
     */
    const THREE_HUBS: ChatFolder[] = [
        {
            name: 'hub',
            settings: '{}\n',
            files: [manifest('alpha'), VENUES, PILLARS, FUNDING, EVENTS, PEOPLE]
        },
        { name: 'other', settings: '{}\n', files: [manifest('beta'), VENUES, EVENTS] },
        { name: 'third', settings: '{}\n', files: [manifest('gamma')] }
    ];
    const threeHubLines = (at: (name: string) => string): string[] => [
        ...venueLines(at),
        `# ${join(at('hub'), PILLARS)}`,
        `planted: hub/${PILLARS}`,
        `# HUB hub: ${at('hub')}`,
        MANIFESTS,
        ...projectLines('hub', 'alpha'),
        ...fileLines('hub', FUNDING),
        ...fileLines('hub', EVENTS),
        `# HUB other: ${at('other')}`,
        MANIFESTS,
        ...projectLines('other', 'beta'),
        ...fileLines('other', EVENTS),
        `# HUB third: ${at('third')}`,
        MANIFESTS,
        ...projectLines('third', 'gamma')
    ];

    /**
     * One workspace per row: its folders in order, its primary, the chat (the portfolio, or a
     * project chat of beta, a project of `other`), and the index's lines that are not empty.
     */
    const INDEX_ROWS: {
        folders: ChatFolder[];
        primary?: string;
        chat: 'beta' | null;
        lines: (at: (name: string) => string) => string[];
    }[] = [
        { folders: THREE_HUBS, primary: 'hub', chat: null, lines: threeHubLines },
        { folders: THREE_HUBS, primary: 'hub', chat: 'beta', lines: threeHubLines },
        {
            folders: [
                { name: 'hub', settings: 'chat_context: [events]\n', files: [FUNDING, EVENTS] },
                { name: 'other', settings: 'chat_context: [funding]\n', files: [EVENTS, FUNDING] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                ...fileLines('hub', EVENTS),
                `# HUB other: ${at('other')}`,
                ...fileLines('other', FUNDING)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [] },
                { name: 'other', settings: 'chat_context: [leads]\n', files: [LEADS, EVENTS] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                `# HUB other: ${at('other')}`,
                ...fileLines('other', LEADS)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] },
                { name: 'tool', files: ['project.yml'] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `### ${at('tool')}`,
                'planted: tool/project.yml'
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] },
                { name: 'third', settings: '{}\n', files: [] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB third: ${at('third')}`
            ]
        },
        {
            folders: [
                { name: 'other', settings: '{}\n', files: [manifest('beta')] },
                { name: 'hub', settings: '{}\n', files: [manifest('alpha')] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB other: ${at('other')}`,
                MANIFESTS,
                ...projectLines('other', 'beta')
            ]
        },
        {
            folders: [
                { name: 'hub', settings: 'chat_context: [funding, funding]\n', files: [FUNDING] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [`# HUB hub: ${at('hub')}`, ...fileLines('hub', FUNDING)]
        },
        {
            folders: [{ name: 'hub', settings: 'chat_context: []\n', files: [FUNDING, EVENTS] }],
            primary: 'hub',
            chat: null,
            lines: (at) => [`# HUB hub: ${at('hub')}`]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [] },
                { name: 'other', settings: 'chat_context: [funding\n', files: [FUNDING, EVENTS] }
            ],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                `# HUB other: ${at('other')}`,
                ...fileLines('other', FUNDING),
                ...fileLines('other', EVENTS)
            ]
        },
        {
            folders: [
                { name: 'hub', settings: '{}\n', files: [manifest('alpha'), VENUES] },
                { name: 'other', settings: '{}\n', files: [manifest('beta'), VENUES] },
                { name: 'tool', files: ['project.yml'] }
            ],
            chat: 'beta',
            lines: (at) => [
                `# HUB hub: ${at('hub')}`,
                MANIFESTS,
                ...projectLines('hub', 'alpha'),
                `# HUB other: ${at('other')}`,
                MANIFESTS,
                ...projectLines('other', 'beta'),
                '# WORKSPACE FOLDERS (no hub)',
                MANIFESTS,
                `### ${at('tool')}`,
                'planted: tool/project.yml'
            ]
        },
        {
            folders: [{ name: 'hub', settings: 'chat_context: [venues]\n', files: [VENUES] }],
            primary: 'hub',
            chat: null,
            lines: (at) => [
                ...venueLines(at),
                `# HUB hub: ${at('hub')}`,
                `## ${VENUES}`,
                `planted: hub/${VENUES}`
            ]
        }
    ];

    it.each(INDEX_ROWS)(
        'writes one section per hub of the workspace into the index',
        async (row) => {
            const world = chatWorld(row.folders, row.primary);
            const response = await handleTerminal(
                request({ action: 'chat', id: row.chat, cols: 80, rows: 24 }),
                TOKEN,
                {
                    ...world.options,
                    engine: task.chatEngine,
                    run: tmux().run,
                    projectFor: (id) =>
                        id === 'beta'
                            ? { title: 'Beta', folder: 'projects/active/beta', root: 'other' }
                            : null
                }
            );
            expect(response.status).toBe(200);
            const terminal = (await answer(response)).terminal as { id: string };
            const index = readFileSync(chatIndexPath(world.sessions, terminal.id), 'utf8');
            expect(index.split('\n').filter((line) => line !== '')).toEqual(row.lines(world.at));
        }
    );
});
