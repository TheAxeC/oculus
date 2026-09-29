// Layer 2, server test. The Customizations reader (server/sessions/stores/customizations.ts) over a
// planted account folder and a planted workspace: each of the seven rows counts what is there, a
// file that does not parse is a finding on its row, the viewer is served only a listed file, and
// GET /api/customizations checks what it is asked before it reads anything.
//
// Every folder here is a scratch folder; nothing under ~/.claude, ~/.codex or the hub is read.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    CUSTOMIZATION_KINDS,
    CUSTOMIZATION_MAX,
    claudeJsonOf,
    customizationFile,
    customizationRows,
    handleCustomizations,
    tomlServers,
    tomlTools,
    upward,
    type CustomizationScope
} from '../../../../src/lib/server/sessions/stores/customizations.ts';
import type {
    CustomizationRow,
    CustomizationsAnswer
} from '../../../../src/lib/data/model/index.ts';
import { it, plantScratch, test } from '../../../fixtures/scratch.ts';

const settings = {
    hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }],
        Notification: [{ hooks: [{ type: 'command', command: 'notify' }, {}] }]
    },
    permissions: { allow: ['Bash(npm test)', 'Read'], deny: ['WebFetch'] },
    mcpServers: { global: { command: 'g' } }
};

// The account folder and the workspace are planted before the file's first case, so a run that
// skips every case plants neither.
let ACCOUNT = '';
let ROOT = '';
let WORK = '';

test.beforeAll(() => {
    ACCOUNT = plantAccount();
    ROOT = plantRoot();
    WORK = join(ROOT, 'work');
});

function plantAccount(): string {
    return plantScratch('oculus-custom-account-', {
        'CLAUDE.md': '# account',
        'settings.json': JSON.stringify(settings),
        'skills/review/SKILL.md': '# review',
        'skills/empty/notes.txt': 'no skill here',
        'agents/explorer.md': '# explorer',
        'agents/notes.txt': 'not an agent',
        'plugins/installed_plugins.json': JSON.stringify({ plugins: { 'a@b': {}, 'c@d': {} } }),
        '.claude.json': JSON.stringify({ projects: {} }),
        'AGENTS.md': '# codex account',
        'config.toml':
            '[mcp_servers.docs]\ncommand = "d"\n[mcp_servers."two words"]\n[model]\n' +
            '[tools]\nweb_search = true # on\nview_image = false\n'
    });
}

function plantRoot(): string {
    return plantScratch('oculus-custom-root-', {
        'CLAUDE.md': '# root',
        'work/CLAUDE.local.md': '# local',
        'work/.claude/CLAUDE.md': '# nested',
        'work/.claude/settings.json': '{ not json',
        'work/.claude/settings.local.json': JSON.stringify({ hooks: { Stop: 'nope' } }),
        'work/.claude/skills/fix/SKILL.md': '# fix',
        'work/.claude/agents/writer.md': '# writer',
        'work/.mcp.json': JSON.stringify({ mcpServers: { local: {}, global: {} } }),
        'work/AGENTS.md': '# codex work',
        'work/AGENTS.override.md': '# codex override'
    });
}

function scope(over: Partial<CustomizationScope> = {}): CustomizationScope {
    return { agent: 'claude', account: ACCOUNT, workspace: WORK, roots: [ROOT], ...over };
}

function row(rows: CustomizationRow[], kind: string): CustomizationRow {
    const found = rows.find((one) => one.kind === kind);
    if (found === undefined) throw new Error(`no ${kind} row`);
    return found;
}

describe('the customizations of a Claude workspace', () => {
    let rows: CustomizationRow[] = [];
    test.beforeAll(() => {
        rows = customizationRows(scope());
    });

    it('audits that lists the seven rows in the section order', () => {
        expect(rows.map((one) => one.kind)).toEqual([
            'instructions',
            'skills',
            'agents',
            'hooks',
            'mcp',
            'plugins',
            'tools'
        ]);
        expect(CUSTOMIZATION_KINDS).toHaveLength(7);
    });

    it('reads the instructions of the account, then the workspace and each folder up to its root', () => {
        const names = row(rows, 'instructions').items.map((item) => item.path);
        expect(names).toEqual([
            join(ACCOUNT, 'CLAUDE.md'),
            join(WORK, '.claude', 'CLAUDE.md'),
            join(WORK, 'CLAUDE.local.md'),
            join(ROOT, 'CLAUDE.md')
        ]);
        expect(upward(WORK, [ROOT])).toEqual([WORK, ROOT]);
        expect(upward(ROOT, [ROOT])).toEqual([ROOT]);
    });

    it('counts the skills of the account and of the workspace, a folder with no SKILL.md not among them', () => {
        const skills = row(rows, 'skills');
        expect(skills.items.map((item) => item.name)).toEqual(['review', 'fix']);
        expect(skills.count).toBe(2);
    });

    it('counts the subagents, each by its file name', () => {
        expect(row(rows, 'agents').items.map((item) => item.name)).toEqual(['explorer', 'writer']);
    });

    it('counts one hook per command, and says which settings files do not parse', () => {
        const hooks = row(rows, 'hooks');
        expect(hooks.items.map((item) => item.name)).toEqual([
            'Stop: say done',
            'Notification: notify',
            'Notification'
        ]);
        expect(hooks.findings).toEqual([
            { path: join(WORK, '.claude', 'settings.json'), reason: 'malformed' },
            { path: join(WORK, '.claude', 'settings.local.json'), reason: 'malformed' }
        ]);
    });

    it('counts each MCP server once, from the project file, the account settings and the account global file', () => {
        expect(row(rows, 'mcp').items.map((item) => item.name)).toEqual(['local', 'global']);
    });

    it('counts the installed plugins', () => {
        expect(row(rows, 'plugins').items.map((item) => item.name)).toEqual(['a@b', 'c@d']);
    });

    it('counts no tools for Claude and looks in no file, since no file of Claude Code lists them', () => {
        const tools = row(rows, 'tools');
        expect(tools.count).toBe(null);
        expect(tools.looked).toEqual([]);
        // the settings' permission rules name what may run, which is not the tools the agent has
        expect(tools.items).toEqual([]);
    });
});

describe('the customizations of a Codex workspace', () => {
    let rows: CustomizationRow[] = [];
    test.beforeAll(() => {
        rows = customizationRows(scope({ agent: 'codex' }));
    });

    it('reads AGENTS files and the config.toml servers, and nothing a Codex account does not have', () => {
        expect(row(rows, 'instructions').items.map((item) => item.path)).toEqual([
            join(ACCOUNT, 'AGENTS.md'),
            join(WORK, 'AGENTS.override.md'),
            join(WORK, 'AGENTS.md')
        ]);
        expect(row(rows, 'mcp').items.map((item) => item.name)).toEqual(['docs', 'two words']);
        for (const kind of ['agents', 'hooks', 'plugins']) {
            expect(row(rows, kind).count).toBe(0);
        }
    });

    it('counts the tools config.toml switches on, looking in that file alone', () => {
        const tools = row(rows, 'tools');
        expect(tools.items).toEqual([{ name: 'web_search', path: join(ACCOUNT, 'config.toml') }]);
        expect(tools.count).toBe(1);
        expect(tools.looked).toEqual([join(ACCOUNT, 'config.toml')]);
        const bare = plantScratch('oculus-custom-bare-', { 'x.txt': '' });
        const none = row(customizationRows(scope({ agent: 'codex', account: bare })), 'tools');
        expect(none.count).toBe(null);
        expect(none.looked).toEqual([join(bare, 'config.toml')]);
    });

    it('reads a tool only inside the tools table, each once', () => {
        expect(
            tomlTools('a = true\n[tools]\nx = true\nx = true\ny = 1\n[tools.z]\nz = true\n')
        ).toEqual(['x']);
    });

    it('reads a server table name bare or quoted, and a header that does not close as a finding', () => {
        expect(tomlServers('[mcp_servers.a]\n[mcp_servers."b c"]\n[[x]]\n[other]\n')).toEqual({
            names: ['a', 'b c'],
            malformed: false
        });
        expect(tomlServers('[mcp_servers.a\n').malformed).toBe(true);
    });
});

describe('a customization file for the viewer', () => {
    it('is served when the listing gives it, and refused for any other path', () => {
        expect(customizationFile(scope(), join(ACCOUNT, 'CLAUDE.md'))).toBe('# account');
        expect(customizationFile(scope(), join(ACCOUNT, 'agents', 'notes.txt'))).toBe(null);
        expect(customizationFile(scope(), join(ACCOUNT, '..', 'etc'))).toBe(null);
        expect(customizationFile(scope(), '')).toBe(null);
    });

    it('is refused when it is larger than the viewer shows', () => {
        const big = plantScratch('oculus-custom-big-', {
            'CLAUDE.md': 'x'.repeat(CUSTOMIZATION_MAX + 1)
        });
        expect(customizationFile(scope({ account: big }), join(big, 'CLAUDE.md'))).toBe(null);
    });

    it("keeps Claude's global file in the home folder for the default account, and beside any other", () => {
        expect(claudeJsonOf(ACCOUNT)).toBe(join(ACCOUNT, '.claude.json'));
        expect(claudeJsonOf(join(homedir(), '.claude'))).toBe(join(homedir(), '.claude.json'));
    });
});

describe('GET /api/customizations', () => {
    const ACCOUNTS: Parameters<typeof handleCustomizations>[1] = [];
    test.beforeAll(() => {
        ACCOUNTS.push(
            { tool: 'claude', label: 'Home', dir: ACCOUNT },
            { tool: 'codex', label: 'Work', dir: ACCOUNT }
        );
    });

    function get(query: Record<string, string>): Response {
        const url = new URL('http://127.0.0.1:8792/api/customizations');
        for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
        return handleCustomizations(
            new Request(url, {
                headers: { host: '127.0.0.1:8792', origin: 'http://127.0.0.1:8792' }
            }),
            ACCOUNTS,
            [ROOT]
        );
    }

    it('answers the rows for the agent, the account and the workspace', async () => {
        const response = get({ agent: 'claude', workspace: WORK });
        expect(response.status).toBe(200);
        const answer = (await response.json()) as CustomizationsAnswer;
        expect(answer.account).toBe('Home');
        expect(row(answer.rows, 'skills').count).toBe(2);
    });

    it('answers one listed file, and a 404 for one it does not list', async () => {
        const read = get({ agent: 'claude', workspace: WORK, file: join(ROOT, 'CLAUDE.md') });
        expect(await read.json()).toEqual({ path: join(ROOT, 'CLAUDE.md'), text: '# root' });
        const other = get({ agent: 'claude', workspace: WORK, file: join(ACCOUNT, 'config.toml') });
        expect(other.status).toBe(404);
    });

    it('refuses an agent it does not know, a workspace that is not a folder and an account it does not hold', () => {
        expect(get({ agent: 'shell', workspace: WORK }).status).toBe(400);
        expect(get({ agent: 'claude', workspace: 'work' }).status).toBe(400);
        expect(get({ agent: 'claude', workspace: join(WORK, 'CLAUDE.local.md') }).status).toBe(400);
        expect(get({ agent: 'claude', workspace: WORK, account: 'Nobody' }).status).toBe(400);
        expect(get({ agent: 'claude', workspace: WORK, account: 'Work' }).status).toBe(400);
    });
});
