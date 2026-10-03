// Layer 2, server test. The Customizations reader (server/sessions/stores/customizations.ts) over a
// planted account folder and a planted workspace: each of the seven rows counts what is there, a
// file that does not parse is a finding on its row, the viewer is served only a listed file, and
// GET /api/customizations checks what it is asked before it reads anything.
//
// Every folder here is a scratch folder; nothing under ~/.claude, ~/.codex or the hub is read.

import { realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
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
    ACCOUNT = realpathSync(plantAccount());
    ROOT = realpathSync(plantRoot());
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

    it('reads a tool only inside the tools table', () => {
        expect(tomlTools('a = true\n[tools]\nx = true\ny = 1\n[tools.z]\nz = true\n')).toEqual([
            'x'
        ]);
    });

    it('reads the tools a table or a dotted key switches on, and none from a broken file', () => {
        expect(tomlTools('[tools]\nweb_search = true\nview_image = false\n')).toEqual([
            'web_search'
        ]);
        expect(tomlTools('tools.web_search = true\n')).toEqual(['web_search']);
        expect(tomlTools('tools = 3\n')).toEqual([]);
        expect(tomlTools('[tools]\nweb_search = true\n[mcp_servers.a\n')).toEqual([]);
    });

    it('reads a server table name bare or quoted, and a header that does not close as a finding', () => {
        expect(tomlServers('[mcp_servers.a]\n[mcp_servers."b c"]\n[[x]]\n[other]\n')).toEqual({
            names: ['a', 'b c'],
            malformed: false
        });
        expect(tomlServers('[mcp_servers.a\n')).toEqual({ names: [], malformed: true });
    });

    it('reads a server named by a header, a dotted key, an inline table or a quoted key', () => {
        const names = (text: string): string[] => tomlServers(text).names;
        expect(names('[mcp_servers.a]\ncommand = "x"\n[mcp_servers.b]\ncommand = "y"\n')).toEqual([
            'a',
            'b'
        ]);
        expect(names('mcp_servers.c.command = "x"\n')).toEqual(['c']);
        expect(names('mcp_servers = { d = { command = "x" } }\n')).toEqual(['d']);
        expect(names('[mcp_servers.\'e f\']\ncommand = "x"\n')).toEqual(['e f']);
    });

    it('names no server from a bracket inside a string, a value that is not a table or nothing', () => {
        expect(tomlServers('note = """\n[mcp_servers.fake]\n"""\n')).toEqual({
            names: [],
            malformed: false
        });
        expect(tomlServers('mcp_servers = 3\n')).toEqual({ names: [], malformed: false });
        expect(tomlServers('[[mcp_servers]]\ncommand = "x"\n')).toEqual({
            names: [],
            malformed: false
        });
        expect(tomlServers('')).toEqual({ names: [], malformed: false });
    });

    it('lists no server of a file whose last header does not close, and marks it', () => {
        expect(tomlServers('[mcp_servers.a]\ncommand="x"\n[mcp_servers.b\n')).toEqual({
            names: [],
            malformed: true
        });
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

describe('the hooks of a settings file whose shape is wrong', () => {
    /** The hooks row of an account whose settings file is the given value. */
    function hooksOf(settingsFile: unknown): CustomizationRow {
        const account = plantScratch('oculus-custom-hooks-', {
            'settings.json': JSON.stringify(settingsFile)
        });
        const rows = customizationRows({ agent: 'claude', account, workspace: account, roots: [] });
        return row(rows, 'hooks');
    }

    it('gives one malformed finding for a group list that is no list', () => {
        expect(hooksOf({ hooks: { Stop: 3 } }).findings).toHaveLength(1);
    });

    it('gives one malformed finding for a group whose hooks are no list', () => {
        expect(hooksOf({ hooks: { Stop: [3] } }).findings).toHaveLength(1);
    });

    it('names a hook whose command is not text by its event alone', () => {
        const wrong = { hooks: { Stop: [{ hooks: [{ command: 5 }] }] } };
        expect(hooksOf(wrong).items.map((item) => item.name)).toEqual(['Stop']);
    });
});

describe('the path a listed item gives', () => {
    /** An account whose agents folder holds links to files in and out of the roots. */
    function plantLinks(): { account: string; outside: string } {
        const outside = realpathSync(
            plantScratch('oculus-custom-outside-', { 'real.md': '# out' })
        );
        const account = realpathSync(
            plantScratch('oculus-custom-links-', { 'agents/plain.md': '# plain' })
        );
        symlinkSync(join(outside, 'real.md'), join(account, 'agents', 'out.md'));
        symlinkSync(join(ROOT, 'CLAUDE.md'), join(account, 'agents', 'in.md'));
        symlinkSync(join(outside, 'gone.md'), join(account, 'agents', 'dangling.md'));
        return { account, outside };
    }

    it('is the real path of a link into a folder no root holds, the name staying as found', () => {
        const { account, outside } = plantLinks();
        const items = row(customizationRows(scope({ account })), 'agents').items;
        expect(items.find((item) => item.name === 'out')).toEqual({
            name: 'out',
            path: join(outside, 'real.md')
        });
    });

    it('is the real path under the root for a link that resolves inside a root', () => {
        const { account } = plantLinks();
        const items = row(customizationRows(scope({ account })), 'agents').items;
        expect(items.find((item) => item.name === 'in')?.path).toBe(join(ROOT, 'CLAUDE.md'));
    });

    it('lists no dangling link, and keeps the path of a plain file', () => {
        const { account } = plantLinks();
        const items = row(customizationRows(scope({ account })), 'agents').items;
        expect(items.some((item) => item.name === 'dangling')).toBe(false);
        expect(items.find((item) => item.name === 'plain')?.path).toBe(
            join(account, 'agents', 'plain.md')
        );
    });

    it('serves the file a link points at when the viewer is asked for the path it listed', () => {
        const { account, outside } = plantLinks();
        expect(customizationFile(scope({ account }), join(outside, 'real.md'))).toBe('# out');
    });

    it('serves the file a link points at when the viewer is asked for the link path', () => {
        const { account } = plantLinks();
        expect(customizationFile(scope({ account }), join(account, 'agents', 'out.md'))).toBe(
            '# out'
        );
    });

    it('serves nothing for a path the listing does not give, a file beside the target included', () => {
        const { account, outside } = plantLinks();
        writeFileSync(join(outside, 'other.md'), '# other');
        expect(customizationFile(scope({ account }), join(outside, 'other.md'))).toBe(null);
        expect(customizationFile(scope({ account }), join(account, 'agents', 'dangling.md'))).toBe(
            null
        );
    });

    it('serves nothing for a link the listing does not give whose target it does not hold', () => {
        const { account, outside } = plantLinks();
        writeFileSync(join(outside, 'other.md'), '# other');
        symlinkSync(join(outside, 'other.md'), join(outside, 'sneak.md'));
        expect(customizationFile(scope({ account }), join(outside, 'sneak.md'))).toBe(null);
    });
});
