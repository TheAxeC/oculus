// loadLocal against synthetic local.yml files in a temporary directory.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PORT, loadLocal } from '../src/lib/data/sources/config.ts';

function scratch(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-config-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

function writeLocal(dir: string, body: string): void {
    const file = join(dir, 'local.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, body);
}

describe('loadLocal', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('falls back to the defaults when there is no file', () => {
        const dir = scratch();
        expect(loadLocal(dir)).toEqual({ hub: resolve(dir, '..', '..'), port: DEFAULT_PORT });
        expect(warn).not.toHaveBeenCalled();
    });

    it('takes both keys from the file', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\nport: 8791\n');
        expect(loadLocal(dir)).toEqual({ hub: '/srv/research-hub', port: 8791 });
    });

    it('reports an unknown key once and ignores it', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\ncolour: teal\n');
        expect(loadLocal(dir)).toEqual({ hub: '/srv/research-hub', port: DEFAULT_PORT });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(String(warn.mock.calls[0][0])).toContain('colour');
    });

    it('refuses a port that is not an integer', () => {
        const dir = scratch();
        writeLocal(dir, 'port: eight\n');
        expect(() => loadLocal(dir)).toThrow(/port must be an integer/);
    });
});
