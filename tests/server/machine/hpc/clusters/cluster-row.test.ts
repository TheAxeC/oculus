// Layer 4, server test. The one writer of a `clusters:` row of the primary hub's
// `.oculus/local.yml` (`writeClusterRow`), which Account setup's Save and Settings' This machine
// section write through: the row alone written, every other byte of the file kept, the result read
// back by the machine's reader before it is written, and a row the reader refuses written nowhere.
// Every case runs over a scratch hub; no other file is written.

import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { localFile } from '../../../../../src/lib/data/sources/config/local.ts';
import { writeClusterRow } from '../../../../../src/lib/server/edit/writes/config/config-key.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const TEXT = textCatalog(loadConfig(engineDir()).config);

/** A hub whose `.oculus/local.yml` holds `body`, or none for null. */
function hubWith(body: string | null): { hub: string; file: string } {
    const hub = scratchDir('oculus-cluster-row-');
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    const file = localFile(hub);
    if (body !== null) writeFileSync(file, body, { mode: 0o644 });
    return { hub, file };
}

const HELD = [
    '# this machine',
    'port: 8790 # the port',
    'clusters:',
    '  - { resource: a, user: axel }',
    '  # the second cluster',
    '  - { resource: b, user: old, key_file: ~/.ssh/old }',
    'self: me',
    ''
].join('\n');

describe('the clusters: row of the primary hub', () => {
    it('replaces the row of the resource and keeps every other byte, the comments included (G8)', () => {
        const { hub, file } = hubWith(HELD);
        const row = { resource: 'b', user: 'axel', keyFile: '~/.ssh/k' };
        expect(writeClusterRow(hub, 'b', row, TEXT)).toEqual({ path: file });
        expect(readFileSync(file, 'utf8')).toBe(
            HELD.replace(
                '{ resource: b, user: old, key_file: ~/.ssh/old }',
                '{ resource: b, user: axel, key_file: ~/.ssh/k }'
            )
        );
    });

    it('adds a row at the end of the list, and makes the list in a file that has none (G8)', () => {
        const { hub, file } = hubWith(HELD);
        writeClusterRow(hub, 'c', { resource: 'c', user: 'me', keyFile: '' }, TEXT);
        expect(readFileSync(file, 'utf8')).toBe(
            HELD.replace(
                '  - { resource: b, user: old, key_file: ~/.ssh/old }\n',
                '  - { resource: b, user: old, key_file: ~/.ssh/old }\n  - { resource: c, user: me }\n'
            )
        );
        const bare = hubWith('port: 8790\n');
        writeClusterRow(bare.hub, 'a', { resource: 'a', user: 'me', keyFile: '' }, TEXT);
        const written = readFileSync(bare.file, 'utf8');
        expect(written.startsWith('port: 8790\n')).toBe(true);
        expect(written).toContain('{ resource: a, user: me }');
    });

    it('takes the row out alone, and answers nothing to do for a resource with no row (G8)', () => {
        const { hub, file } = hubWith(HELD);
        expect(writeClusterRow(hub, 'a', null, TEXT)).toEqual({ path: file });
        expect(readFileSync(file, 'utf8')).toBe(
            HELD.replace('  - { resource: a, user: axel }\n', '')
        );
        const before = readFileSync(file, 'utf8');
        expect(writeClusterRow(hub, 'z', null, TEXT)).toBeNull();
        expect(readFileSync(file, 'utf8')).toBe(before);
    });

    it('makes a file that is not there at mode 600 and names it in .gitignore, and keeps the mode of one that is there (G8)', () => {
        const made = hubWith(null);
        writeClusterRow(made.hub, 'a', { resource: 'a', user: 'me', keyFile: '' }, TEXT);
        expect(statSync(made.file).mode & 0o777).toBe(0o600);
        expect(readFileSync(join(made.hub, '.oculus', '.gitignore'), 'utf8')).toContain(
            'local.yml'
        );
        const held = hubWith(HELD);
        chmodSync(held.file, 0o640);
        writeClusterRow(held.hub, 'a', { resource: 'a', user: 'me', keyFile: '' }, TEXT);
        expect(statSync(held.file).mode & 0o777).toBe(0o640);
    });

    it.each([
        ['a user name that would read as an option', { user: '-oProxyCommand=x', keyFile: '' }],
        ['a user name holding a space', { user: 'a b', keyFile: '' }],
        ['a relative key file', { user: 'me', keyFile: 'relative/k' }],
        ['a public key file', { user: 'me', keyFile: '~/.ssh/k.pub' }]
    ])(
        'refuses %s with the sentence naming the field, and writes nothing (G8)',
        (_name, fields) => {
            const { hub, file } = hubWith(HELD);
            const answer = writeClusterRow(hub, 'a', { resource: 'a', ...fields }, TEXT);
            expect(answer !== null && 'refused' in answer ? answer.refused : '').toContain(
                'clusters'
            );
            expect(readFileSync(file, 'utf8')).toBe(HELD);
        }
    );
});
