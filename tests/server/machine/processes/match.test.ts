// The rule that says which command lines the Processes view lists, and which are an agent. A
// pattern is a program name; it matches the file name of the first word of the command line or of
// its second word, exactly, so a script run by its interpreter matches by the script's name and a
// path that merely holds the name does not match.

import { describe, expect, it } from 'vitest';
import { agentOf, matches } from '../../../../src/lib/server/machine/processes/match.ts';

describe('matches', () => {
    it('matches the first word by its file name', () => {
        expect(matches('claude --resume 6266a558', ['claude'])).toBe(true);
        expect(matches('/usr/local/bin/claude --resume x', ['claude'])).toBe(true);
    });

    it('matches the second word by its file name, so an interpreter run script matches', () => {
        expect(matches('node /usr/local/bin/codex', ['codex'])).toBe(true);
        expect(matches('node /usr/local/bin/codex', ['node'])).toBe(true);
        expect(matches('node /usr/local/bin/codex', ['python3'])).toBe(false);
    });

    it('matches a program by its name exactly, never a longer name or a framework path', () => {
        expect(matches('python3.12 x.py', ['python3'])).toBe(false);
        expect(
            matches(
                '/Library/Frameworks/Python.framework/Versions/3.12/Resources/Python.app/Contents/MacOS/Python x.py',
                ['python3']
            )
        ).toBe(false);
        expect(matches('python3 x.py', ['python3'])).toBe(true);
    });

    it.each([
        ['an empty command line', '', ['python3']],
        ['a blank command line', '   ', ['python3']],
        ['an empty pattern list', 'python3 x.py', []],
        [
            'a shell given a path with the name',
            '/bin/zsh -c source /Users/x/.claude/shell-snapshots/s.sh',
            ['claude']
        ],
        [
            'a path with the name, split at a space',
            '/Applications/X.app/.codex/plugins/ChatGPT for Chrome chrome-extension://a',
            ['codex']
        ],
        [
            'a wrapper naming it as a later word',
            'bash /opt/homebrew/libexec/pyenv-exec python3 -',
            ['python3']
        ]
    ])('matches nothing for %s', (_name, line, patterns) => {
        expect(matches(line, patterns)).toBe(false);
    });

    it('matches when any pattern of the list matches', () => {
        expect(matches('latexmk -pdf main.tex', ['python3', 'latexmk'])).toBe(true);
    });

    it('splits on any run of white space', () => {
        expect(matches('node\t/usr/local/bin/codex', ['codex'])).toBe(true);
        expect(matches('  claude   --resume x', ['claude'])).toBe(true);
    });
});

describe('agentOf', () => {
    it('names claude and codex by the same rule, whatever the patterns', () => {
        expect(agentOf('claude --resume x')).toBe('claude');
        expect(agentOf('codex resume x')).toBe('codex');
        expect(agentOf('node /usr/local/bin/codex')).toBe('codex');
    });

    it('names no agent for any other program or for a path that merely holds the name', () => {
        expect(agentOf('python3 x.py')).toBeNull();
        expect(agentOf('/bin/zsh -c source /Users/x/.claude/shell-snapshots/s.sh')).toBeNull();
        expect(agentOf('')).toBeNull();
    });
});
