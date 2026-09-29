// Layer 4, test. The Claude status-line command preserves its input atomically and prints only
// present status fields.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const made: string[] = [];

function scratch(): string {
    const dir = scratchDir('oculus-claude-usage-');
    made.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('claude-usage.sh', () => {
    // Three sh + python3 spawns; under a loaded full run they pass 5 s, so the case gets 20 s.
    it(
        'preserves an existing target on malformed stdin and replaces it on valid stdin',
        { timeout: 20000 },
        () => {
            const home = scratch();
            const config = join(home, '.claude');
            const run = (input: string) =>
                spawnSync('sh', ['bin/claude-usage.sh'], {
                    cwd: process.cwd(),
                    env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: config },
                    input,
                    encoding: 'utf8'
                });
            const fixture = '{"session_id":"existing","model":{"display_name":"Opus"}}\n';
            const folder = join(home, '.oculus', 'usage', 'claude', '.claude');
            const target = join(folder, 'existing.json');
            expect(run(fixture).status).toBe(0);
            const malformed = run('{"session_id":"existing",');
            expect(malformed.status).not.toBe(0);
            expect(malformed.stdout).toBe('');
            expect(readFileSync(target, 'utf8')).toBe(fixture);
            expect(readdirSync(folder)).toEqual(['existing.json']);
            const replacement = '{"session_id":"existing","model":{"display_name":"Sonnet"}}\n';
            expect(run(replacement).status).toBe(0);
            expect(readFileSync(target, 'utf8')).toBe(replacement);
            expect(readdirSync(folder)).toEqual(['existing.json']);
        }
    );

    it('writes the input unchanged under the account and prints the complete status', () => {
        const home = scratch();
        const config = join(home, '.claude-work');
        const fixture =
            '{"session_id":"abc-123","model":{"id":"claude-opus","display_name":"Opus"},"context_window":{"used_percentage":12},"rate_limits":{"five_hour":{"used_percentage":34,"resets_at":1},"seven_day":{"used_percentage":56,"resets_at":2}},"cost":{"total_cost_usd":1.2},"cwd":"/tmp/work"}\n';
        const run = spawnSync('sh', ['bin/claude-usage.sh'], {
            cwd: process.cwd(),
            env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: config },
            input: fixture,
            encoding: 'utf8'
        });
        expect(run.status).toBe(0);
        expect(run.stdout).toBe('Opus | 12% context | 5h 34% | 7d 56%\n');
        expect(
            readFileSync(
                join(home, '.oculus', 'usage', 'claude', '.claude-work', 'abc-123.json'),
                'utf8'
            )
        ).toBe(fixture);
    });

    it('leaves absent status parts out', () => {
        const home = scratch();
        const fixture = '{"session_id":"only-id","context_window":{"context_window_size":200000}}';
        const run = spawnSync('sh', ['bin/claude-usage.sh'], {
            cwd: process.cwd(),
            env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: join(home, '.claude') },
            input: fixture,
            encoding: 'utf8'
        });
        expect(run.status).toBe(0);
        expect(run.stdout).toBe('\n');
        expect(
            readFileSync(
                join(home, '.oculus', 'usage', 'claude', '.claude', 'only-id.json'),
                'utf8'
            )
        ).toBe(fixture);
    });
});
