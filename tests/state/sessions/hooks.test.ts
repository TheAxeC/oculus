// Layer 2, client-state tests. The hooks block is JSON Claude Code reads: two events, one command
// hook each, the second-long caps, and the origin it was given in the address it posts to.

import { describe, expect, it } from 'vitest';
import { hooksSnippet } from '../../../src/lib/state/sessions/hooks.ts';

/** The block's shape as JSON.parse gives it back. */
type Snippet = {
    hooks: Record<string, { hooks: { type: string; timeout: number; command: string }[] }[]>;
};

describe('hooksSnippet', () => {
    it('is one command hook per event, each posting to the origin with a second-long cap', () => {
        const parsed = JSON.parse(hooksSnippet('http://127.0.0.1:8790')) as Snippet;
        expect(Object.keys(parsed.hooks)).toEqual(['Notification', 'Stop']);
        for (const matchers of Object.values(parsed.hooks)) {
            expect(matchers).toHaveLength(1);
            expect(matchers[0].hooks).toHaveLength(1);
            const hook = matchers[0].hooks[0];
            expect(hook.type).toBe('command');
            expect(hook.timeout).toBe(1);
            for (const part of [
                'curl -s ',
                ' -m 1 ',
                '-X POST',
                'http://127.0.0.1:8790/api/hook',
                "-H 'Content-Type: application/json'",
                '-d @-',
                '>/dev/null 2>&1',
                '|| true'
            ]) {
                expect(hook.command).toContain(part);
            }
        }
    });

    it.each([
        ['another port', 'http://127.0.0.1:8793'],
        ['no port', 'http://oculus.local'],
        ['a scheme and a port', 'https://oculus.local:8443']
    ])('carries the origin whole, for %s, and never the default port', (_name, origin) => {
        const text = hooksSnippet(origin);
        expect(JSON.parse(text)).toBeTypeOf('object');
        expect(text).toContain(`${origin}/api/hook`);
        expect(text).not.toContain('8790');
    });
});
