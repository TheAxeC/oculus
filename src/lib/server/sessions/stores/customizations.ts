// Layer 2, server. What an agent reads before its first turn, for one workspace and one account:
// its instructions, skills, subagents, hooks, MCP servers, plugins and the tools a file names. The
// Customizations section at the foot of the sessions list shows it, and the viewer opens one of its
// files.
//
// Every read is of the agents' own files and is only a read. Each kind is a fixed list of places,
// the places Claude Code and Codex read themselves, so a row's `looked` is the whole of where it
// looked: a missing file counts nothing, and a file that is there and does not parse is a finding
// on its row rather than a count of zero. The file served for one item is served only when it is
// one of the paths the same listing gives, so the viewer cannot be asked for any other file.
//
// A listed item's `path` is the file's real path (a link followed to its target), because the
// roots boundary decides where a file opens by where the file is: a link into a folder no root
// holds is opened by this viewer, and one into a root is opened by the source tab. A name is kept
// as found.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`inside`).

import { json } from '@sveltejs/kit';
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import type {
    AgentId,
    CustomizationFinding,
    CustomizationItem,
    CustomizationKind,
    CustomizationRow,
    CustomizationsAnswer
} from '../../../data/model/index.ts';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import { inside } from '../../core/paths.ts';

/** The rows in the order the section lists them. */
export const CUSTOMIZATION_KINDS: CustomizationKind[] = [
    'instructions',
    'skills',
    'agents',
    'hooks',
    'mcp',
    'plugins',
    'tools'
];

/** The largest file the viewer serves. */
export const CUSTOMIZATION_MAX = 1_000_000;

/** What one read asks for: the agent, its account's folder, the workspace, the roots above it. */
export type CustomizationScope = {
    agent: AgentId;
    account: string;
    workspace: string;
    /** The folders a walk from the workspace upward stops at, the deepest holding it first. */
    roots: string[];
};

/** Whether a path is a file, following a link, and false for anything missing. */
function isFile(path: string): boolean {
    try {
        return statSync(path).isFile();
    } catch {
        return false;
    }
}

/** A folder's entries in name order, or none for a folder that is not there. */
function entries(dir: string): string[] {
    try {
        return readdirSync(dir).sort();
    } catch {
        return [];
    }
}

/**
 * The folders from the workspace up to the deepest root holding it, both included, nearest first.
 * A workspace no root holds is walked up to the filesystem's root, as the agents walk it.
 */
export function upward(workspace: string, roots: string[]): string[] {
    const start = resolve(workspace);
    const holding = roots
        .map((one) => resolve(one))
        .filter((one) => inside(start, one))
        .sort((a, b) => b.length - a.length)
        .at(0);
    const dirs: string[] = [];
    let dir = start;
    for (;;) {
        dirs.push(dir);
        if (holding !== undefined && dir === holding) break;
        const up = dirname(dir);
        if (up === dir) break;
        dir = up;
    }
    return dirs;
}

/** The global file Claude Code keeps beside an account: ~/.claude.json for the default folder. */
export function claudeJsonOf(account: string): string {
    return resolve(account) === join(homedir(), '.claude')
        ? join(homedir(), '.claude.json')
        : join(account, '.claude.json');
}

type Collect = {
    items: CustomizationItem[];
    looked: string[];
    findings: CustomizationFinding[];
};

function collect(): Collect {
    return { items: [], looked: [], findings: [] };
}

/** A path with its links followed, and the path as found when that fails. */
function realPath(path: string): string {
    try {
        return realpathSync(path);
    } catch {
        return path;
    }
}

function rowOf(kind: CustomizationKind, found: Collect, counted = true): CustomizationRow {
    return {
        kind,
        count: counted ? found.items.length : null,
        items: found.items.map((item) => ({ ...item, path: realPath(item.path) })),
        looked: found.looked,
        findings: found.findings
    };
}

/**
 * A JSON file's value: undefined for a file that is not there, and a finding on the row for one
 * that is there and does not parse.
 */
function jsonFile(path: string, found: Collect): unknown {
    found.looked.push(path);
    if (!isFile(path)) return undefined;
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as unknown;
    } catch {
        found.findings.push({ path, reason: 'malformed' });
        return undefined;
    }
}

/** A map field that must be a map when present: a finding when it is something else. */
function mapField(
    value: unknown,
    field: string,
    path: string,
    found: Collect
): Record<string, unknown> | null {
    if (!isMap(value) || !(field in value)) return null;
    const inner = isMap(value[field]) ? value[field] : null;
    if (inner === null) found.findings.push({ path, reason: 'malformed' });
    return inner;
}

/** The instruction files, account first, then the workspace and each folder above it. */
function instructions(scope: CustomizationScope): Collect {
    const found = collect();
    const names =
        scope.agent === 'claude'
            ? ['CLAUDE.md', join('.claude', 'CLAUDE.md'), 'CLAUDE.local.md']
            : ['AGENTS.override.md', 'AGENTS.md'];
    const account = scope.agent === 'claude' ? ['CLAUDE.md'] : ['AGENTS.override.md', 'AGENTS.md'];
    const places: string[] = account.map((name) => join(scope.account, name));
    for (const dir of upward(scope.workspace, scope.roots)) {
        for (const name of names) places.push(join(dir, name));
    }
    for (const path of places) {
        found.looked.push(path);
        if (isFile(path)) found.items.push({ name: path, path });
    }
    return found;
}

/** Every `<folder>/*\/SKILL.md`, named by its folder. */
function skillsIn(dir: string, found: Collect): void {
    found.looked.push(join(dir, '*', 'SKILL.md'));
    for (const name of entries(dir)) {
        const path = join(dir, name, 'SKILL.md');
        if (isFile(path)) found.items.push({ name, path });
    }
}

function skills(scope: CustomizationScope): Collect {
    const found = collect();
    skillsIn(join(scope.account, 'skills'), found);
    if (scope.agent === 'claude') skillsIn(join(scope.workspace, '.claude', 'skills'), found);
    return found;
}

/** Every `<folder>/*.md`, named by its file. */
function agentsIn(dir: string, found: Collect): void {
    found.looked.push(join(dir, '*.md'));
    for (const name of entries(dir)) {
        const path = join(dir, name);
        if (name.endsWith('.md') && isFile(path)) {
            found.items.push({ name: basename(name, '.md'), path });
        }
    }
}

function agents(scope: CustomizationScope): Collect {
    const found = collect();
    if (scope.agent !== 'claude') return found;
    agentsIn(join(scope.account, 'agents'), found);
    agentsIn(join(scope.workspace, '.claude', 'agents'), found);
    return found;
}

/** The three settings files Claude Code reads for one account and one workspace. */
function settingsFiles(scope: CustomizationScope): string[] {
    return [
        join(scope.account, 'settings.json'),
        join(scope.workspace, '.claude', 'settings.json'),
        join(scope.workspace, '.claude', 'settings.local.json')
    ];
}

/** A hook: its command, or the empty text for a hook that is no map or has none. */
const hookShape = z.object({ command: z.string().catch('') }).catch(() => ({ command: '' }));

/** The event's groups: null for a group that is no map or holds no `hooks` list. */
const hookGroupsShape = z
    .array(
        z
            .object({ hooks: z.array(hookShape) })
            .nullable()
            .catch(null)
    )
    .nullable()
    .catch(null);

/** The hooks each settings file names, one item per command, named by its event. */
function hooks(scope: CustomizationScope): Collect {
    const found = collect();
    if (scope.agent !== 'claude') return found;
    for (const path of settingsFiles(scope)) {
        const events = mapField(jsonFile(path, found), 'hooks', path, found);
        if (events === null) continue;
        for (const [event, groups] of Object.entries(events)) {
            const held = hookGroupsShape.parse(groups);
            if (held === null) {
                found.findings.push({ path, reason: 'malformed' });
                continue;
            }
            for (const group of held) {
                if (group === null) {
                    found.findings.push({ path, reason: 'malformed' });
                    continue;
                }
                for (const { command: said } of group.hooks) {
                    found.items.push({ name: said === '' ? event : `${event}: ${said}`, path });
                }
            }
        }
    }
    return found;
}

/** The server names of one `mcpServers` map, each named once. */
function serversOf(servers: Record<string, unknown> | null, path: string, found: Collect): void {
    if (servers === null) return;
    for (const name of Object.keys(servers)) {
        if (!found.items.some((one) => one.name === name)) found.items.push({ name, path });
    }
}

/**
 * A Codex config.toml parsed whole by smol-toml, or null for one that does not parse: a file with
 * one error in it is a finding, and names nothing, since what a broken file means is not known.
 */
function tomlDocument(text: string): Record<string, unknown> | null {
    try {
        return parseToml(text);
    } catch {
        return null;
    }
}

/** A TOML value when it is a table, and null for a scalar, a date or an array. */
function tomlTable(value: unknown): Record<string, unknown> | null {
    return value instanceof Date || !isMap(value) ? null : value;
}

/**
 * The servers a Codex config.toml names: the keys of its `mcp_servers` table, however the file
 * writes it (`[mcp_servers.<name>]` headers, dotted keys or an inline table). A value of
 * `mcp_servers` that is not a table names none; a file that does not parse is malformed and names
 * none.
 */
export function tomlServers(text: string): { names: string[]; malformed: boolean } {
    const document = tomlDocument(text);
    if (document === null) return { names: [], malformed: true };
    return { names: Object.keys(tomlTable(document.mcp_servers) ?? {}), malformed: false };
}

/** A Codex config.toml's text, or null for a file that is not there or cannot be read. */
function tomlText(path: string, found: Collect): string | null {
    found.looked.push(path);
    if (!isFile(path)) return null;
    try {
        return readFileSync(path, 'utf8');
    } catch {
        found.findings.push({ path, reason: 'unreadable' });
        return null;
    }
}

function mcp(scope: CustomizationScope): Collect {
    const found = collect();
    if (scope.agent === 'codex') {
        const path = join(scope.account, 'config.toml');
        const text = tomlText(path, found);
        if (text === null) return found;
        const read = tomlServers(text);
        if (read.malformed) found.findings.push({ path, reason: 'malformed' });
        for (const name of read.names) found.items.push({ name, path });
        return found;
    }
    const project = join(scope.workspace, '.mcp.json');
    serversOf(mapField(jsonFile(project, found), 'mcpServers', project, found), project, found);
    const settings = join(scope.account, 'settings.json');
    serversOf(mapField(jsonFile(settings, found), 'mcpServers', settings, found), settings, found);
    const global = claudeJsonOf(scope.account);
    const projects = mapField(jsonFile(global, found), 'projects', global, found);
    const held = projects?.[resolve(scope.workspace)];
    const entry = isMap(held) ? held : null;
    serversOf(mapField(entry, 'mcpServers', global, found), global, found);
    return found;
}

/** The plugins the account's installed-plugins file lists, named as the file names them. */
function plugins(scope: CustomizationScope): Collect {
    const found = collect();
    if (scope.agent !== 'claude') return found;
    const path = join(scope.account, 'plugins', 'installed_plugins.json');
    const listed = mapField(jsonFile(path, found), 'plugins', path, found);
    if (listed === null) return found;
    for (const name of Object.keys(listed)) found.items.push({ name, path });
    return found;
}

/**
 * The tools a Codex config.toml switches on in its `tools` table, one per key set to `true`. A key
 * set to anything else names no tool that is on, a value of `tools` that is not a table names
 * none, and so does a file that does not parse.
 */
export function tomlTools(text: string): string[] {
    const table = tomlTable(tomlDocument(text)?.tools) ?? {};
    return Object.keys(table).filter((name) => table[name] === true);
}

/**
 * The tools a file names. Codex's config.toml names the tools it switches on; no file of Claude
 * Code lists the tools its agent has (they are built into the CLI, and an MCP server's tools are
 * known only once the server runs), so a Claude row looks in no file. A row whose file names no
 * tool shows no count.
 */
function tools(scope: CustomizationScope): Collect {
    const found = collect();
    if (scope.agent !== 'codex') return found;
    const path = join(scope.account, 'config.toml');
    const text = tomlText(path, found);
    if (text === null) return found;
    for (const name of tomlTools(text)) found.items.push({ name, path });
    return found;
}

const READERS: Record<CustomizationKind, (scope: CustomizationScope) => Collect> = {
    instructions,
    skills,
    agents,
    hooks,
    mcp,
    plugins,
    tools
};

/** Every row for one scope, in the section's order. */
export function customizationRows(scope: CustomizationScope): CustomizationRow[] {
    return CUSTOMIZATION_KINDS.map((kind) => {
        const found = READERS[kind](scope);
        return rowOf(kind, found, kind !== 'tools' || found.items.length > 0);
    });
}

/**
 * One listed file's text for the viewer, or null when the path is not one the listing gives or
 * the file is too large to show. The asked path is followed to the file it names before it is
 * compared with the listing, which gives each item's real path, so a path saved while it was a
 * link still reads the file the link points to.
 */
export function customizationFile(scope: CustomizationScope, path: string): string | null {
    const wanted = realPath(resolve(path));
    const listed = customizationRows(scope).some((row) =>
        row.items.some((item) => resolve(item.path) === wanted)
    );
    if (!listed) return null;
    try {
        if (statSync(wanted).size > CUSTOMIZATION_MAX) return null;
        return readFileSync(wanted, 'utf8');
    } catch {
        return null;
    }
}

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** Whether a path is an existing folder. */
function isDir(path: string): boolean {
    try {
        return statSync(path).isDirectory();
    } catch {
        return false;
    }
}

/**
 * GET /api/customizations: the rows for `agent`, `account` (a label of local.yml's accounts, the
 * agent's first when empty) and `workspace` (an absolute folder), or with `file` the text of one
 * listed file. A read, so same-origin only.
 */
export function handleCustomizations(
    request: Request,
    accounts: { tool: string; label: string; dir: string }[],
    roots: string[]
): Response {
    const params = new URL(request.url).searchParams;
    const agent = params.get('agent');
    if (agent !== 'claude' && agent !== 'codex')
        return json({ error: 'agent must be claude or codex' }, { status: 400, headers: NO_STORE });
    const workspace = params.get('workspace') ?? '';
    if (!isAbsolute(workspace) || !isDir(workspace)) {
        return json(
            { error: 'workspace must be an absolute folder' },
            { status: 400, headers: NO_STORE }
        );
    }
    const label = params.get('account') ?? '';
    const own = accounts.filter((one) => one.tool === agent);
    const account = label === '' ? own[0] : own.find((one) => one.label === label);
    if (account === undefined)
        return json({ error: `no ${agent} account ${label}` }, { status: 400, headers: NO_STORE });
    const scope: CustomizationScope = { agent, account: account.dir, workspace, roots };
    const file = params.get('file');
    if (file !== null) {
        const text = customizationFile(scope, file);
        return text === null
            ? json(
                  { error: 'the file is not one this listing gives' },
                  { status: 404, headers: NO_STORE }
              )
            : json({ path: resolve(file), text }, { headers: NO_STORE });
    }
    const answer: CustomizationsAnswer = {
        agent,
        account: account.label,
        workspace: resolve(workspace),
        rows: customizationRows(scope)
    };
    return json(answer, { headers: NO_STORE });
}
