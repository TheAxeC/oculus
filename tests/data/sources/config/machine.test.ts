// Layer 1, data tests. The machine's values of a workspace, joined from the `.oculus/local.yml` of
// each hub it lists (readMachine): a key that is one per oculus comes from the primary hub's file
// alone and a hub that is not the primary and sets it is a problem naming the hub and the key; the
// three account lists are the rows of every hub's file in folder order, each row marked with its
// hub, a label two files both give is a problem that leaves the later row out, and the default
// accounts stand once when no file sets any. `commit_message_account` is a key of the primary's
// file whose label is checked against the Claude rows joined from every hub, compared reduced: a
// label no such row holds is a finding naming the key, with no value of the file in it, and no
// account is used. A key the reader does not know is ignored and warned of. Every hub is a scratch
// folder under the system temporary directory.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    DEFAULT_PORT,
    engineDir,
    loadConfig,
    localDefaults,
    localFile,
    localFindings,
    readMachine
} from '../../../../src/lib/data/sources/config.ts';
import { readLocal } from '../../../../src/lib/data/sources/config/local.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

/** A scratch hub folder whose `.oculus/local.yml` holds the text, or no file for null. */
function hubWith(text: string | null): string {
    const hub = scratchDir('oculus-machine-');
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    if (text !== null) writeFileSync(localFile(hub), text);
    return hub;
}

describe('the keys that are one per oculus', () => {
    it("are the primary hub's, with a problem naming the other hub that sets one", () => {
        const first = hubWith('port: 8800\nclaude_bin: x\nhpc_host: h\nmail_dir: rel/mail\n');
        const second = hubWith('port: 8801\n');
        const read = readMachine(
            [
                { name: 'first', dir: first },
                { name: 'second', dir: second }
            ],
            'first'
        );
        expect(read.config.port).toBe(8800);
        expect(read.config.claudeBin).toBe('x');
        expect(read.config.hpcHost).toBe('h');
        expect(read.config.mailDir).toBe(join(first, 'rel/mail'));
        expect(
            read.problems.map(({ file, problem }) => [
                file,
                problem.key,
                problem.kind,
                'hub' in problem ? problem.hub : ''
            ])
        ).toEqual([[localFile(second), 'port', 'other-hub', 'second']]);
        expect(read.set.sort()).toEqual(['claude_bin', 'hpc_host', 'mail_dir', 'port']);
    });

    it('are the defaults when the workspace has no primary', () => {
        const first = hubWith('port: 8800\nclaude_bin: x\n');
        const read = readMachine([{ name: 'first', dir: first }], null);
        expect(read.config.port).toBe(DEFAULT_PORT);
        expect(read.config.claudeBin).toBe(localDefaults().claudeBin);
        expect(read.set).toEqual([]);
    });
});

describe('the account lists', () => {
    const claude = (label: string, dir: string): string =>
        `accounts:\n  - { tool: claude, dir: ${dir}, label: ${label} }\n`;

    it("are the rows of every hub's file, each marked with the hub that holds it", () => {
        const first = hubWith(claude('main', '/a'));
        const second = hubWith(claude('other', '/b'));
        const read = readMachine(
            [
                { name: 'first', dir: first },
                { name: 'second', dir: second }
            ],
            'first'
        );
        expect(read.config.accounts.map((one) => [one.label, one.hub])).toEqual([
            ['main', 'first'],
            ['other', 'second']
        ]);
        expect(read.problems).toEqual([]);
    });

    it('leave out the later row of a label two files give, with a problem naming that file', () => {
        const first = hubWith(claude('same', '/a'));
        const second = hubWith(claude('same', '/b'));
        const read = readMachine(
            [
                { name: 'first', dir: first },
                { name: 'second', dir: second }
            ],
            'first'
        );
        expect(read.config.accounts.map((one) => [one.label, one.dir])).toEqual([['same', '/a']]);
        expect(read.problems.map(({ file, problem }) => [file, problem.key, problem.kind])).toEqual(
            [[localFile(second), 'accounts', 'repeat']]
        );
    });

    it('are the default accounts once when no file sets any, with no problem', () => {
        const read = readMachine(
            [
                { name: 'first', dir: hubWith(null) },
                { name: 'second', dir: hubWith('port: 8790\n') }
            ],
            'first'
        );
        expect(read.config.accounts.map((one) => one.label)).toEqual(['claude', 'codex']);
        expect(read.config.accounts.every((one) => one.hub === undefined)).toBe(true);
        expect(read.problems.filter((one) => one.problem.key === 'accounts')).toEqual([]);
    });
});

describe('commit_message_account', () => {
    const config = loadConfig(engineDir()).config;
    const work = 'accounts:\n  - { tool: claude, dir: /w, label: Work }\n';
    const codex = 'accounts:\n  - { tool: codex, dir: /c, label: nobody-codex }\n';

    it.each([
        {
            name: "a label of a Claude row in the second hub's accounts",
            primary: 'commit_message_account: work\n',
            second: work,
            account: 'work',
            problems: []
        },
        {
            name: 'a label no row holds',
            primary: 'commit_message_account: nobody\n',
            second: work,
            account: undefined,
            problems: [['first', 'commit_message_account', 'label']]
        },
        {
            name: 'the label of a Codex row',
            primary: 'commit_message_account: nobody-codex\n',
            second: codex,
            account: undefined,
            problems: [['first', 'commit_message_account', 'label']]
        },
        {
            name: "the default's label when the primary's accounts hold no Claude row",
            primary: `commit_message_account: claude\n${codex}`,
            second: null,
            account: undefined,
            problems: [['first', 'commit_message_account', 'label']]
        },
        {
            name: "a value in the second hub's file alone",
            primary: work,
            second: 'commit_message_account: work\n',
            account: undefined,
            problems: [['second', 'commit_message_account', 'other-hub']]
        }
    ])(
        'takes $name as the run account or as a finding',
        ({ primary, second, account, problems }) => {
            const hubs = { first: hubWith(primary), second: hubWith(second) };
            const read = readMachine(
                [
                    { name: 'first', dir: hubs.first },
                    { name: 'second', dir: hubs.second }
                ],
                'first'
            );
            expect(read.config.commitMessageAccount).toBe(account);
            expect(
                read.problems.map(({ file, problem }) => [
                    file === localFile(hubs.first) ? 'first' : 'second',
                    problem.key,
                    problem.kind
                ])
            ).toEqual(problems);
            for (const finding of localFindings(config, read.problems)) {
                expect(finding.message).toContain('commit_message_account');
                for (const value of ['nobody', 'work']) {
                    expect(finding.message.toLowerCase()).not.toContain(value);
                }
            }
        }
    );
});

describe('a key the reader does not know', () => {
    it('is warned of and ignored, for `hub` and `workspaces` as for any other', () => {
        const hub = hubWith('hub: /h\nworkspaces: /w\nport: 8802\n');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const read = readLocal(hub, true);
            expect(read.unknown).toEqual(['hub', 'workspaces']);
            expect(read.config.port).toBe(8802);
            expect(read.config).not.toHaveProperty('hub');
            expect(read.config).not.toHaveProperty('workspaces');
            expect(warn).toHaveBeenCalledTimes(1);
            expect(String(warn.mock.calls[0][0])).toContain(
                'ignoring unknown key(s) hub, workspaces'
            );
        } finally {
            warn.mockRestore();
        }
    });
});
