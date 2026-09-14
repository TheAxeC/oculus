// The control-mode protocol, on recorded text. No tmux runs here: every case feeds the parser the
// bytes a `tmux -C attach-session` child printed on this machine, so the decoding, the
// reply pairing and the key map are checked without a process, a socket or a session.

import { describe, expect, it } from 'vitest';
import {
    commandLine,
    createParser,
    decodeOutput,
    keyName,
    quote,
    splitKeys,
    type ControlEvent,
    type ControlReply
} from '../../../src/lib/server/pty/tmux.ts';

/** A parser with every callback recorded, so a case reads what came out of the bytes it fed. */
function recorder() {
    const outputs: [string, Buffer][] = [];
    const replies: ControlReply[] = [];
    const events: ControlEvent[] = [];
    const parser = createParser({
        output: (pane, bytes) => outputs.push([pane, bytes]),
        reply: (reply) => replies.push(reply),
        event: (event) => events.push(event)
    });
    return { parser, outputs, replies, events };
}

function feed(text: string): ReturnType<typeof recorder> {
    const held = recorder();
    held.parser.feed(Buffer.from(text, 'latin1'));
    return held;
}

describe('the control stream', () => {
    it('pairs a %begin with its %end and hands back the reply text', () => {
        const held = feed('%begin 1757500000 3 1\nfirst line\nsecond line\n%end 1757500000 3 1\n');
        expect(held.replies).toHaveLength(1);
        expect(held.replies[0].number).toBe('3');
        expect(held.replies[0].error).toBe(false);
        expect(held.replies[0].lines).toEqual(['first line', 'second line']);
    });

    it('marks a block that ended in %error', () => {
        const held = feed('%begin 1757500000 4 1\nno such session\n%error 1757500000 4 1\n');
        expect(held.replies).toHaveLength(1);
        expect(held.replies[0].error).toBe(true);
        expect(held.replies[0].lines).toEqual(['no such session']);
    });

    it('decodes the octal escapes of %output, a backslash written either way included', () => {
        const held = feed('%output %0 hi\\015\\012\n%output %0 a\\134b\n%output %0 c\\\\d\n');
        expect(held.outputs[0][1].toString('utf8')).toBe('hi\r\n');
        expect(held.outputs[1][1].toString('utf8')).toBe('a\\b');
        expect(held.outputs[2][1].toString('utf8')).toBe('c\\d');
    });

    it('keeps two panes apart while their output interleaves', () => {
        const held = feed('%output %0 one\n%output %1 two\n%output %0 three\n');
        expect(held.outputs.map(([pane]) => pane)).toEqual(['%0', '%1', '%0']);
        expect(held.outputs.map(([, bytes]) => bytes.toString('utf8'))).toEqual([
            'one',
            'two',
            'three'
        ]);
    });

    it('holds a line that arrived in two reads, a UTF-8 sequence split between them', () => {
        const held = recorder();
        // The euro sign is e2 82 ac; tmux writes a byte above 0x7f through as itself, so the split
        // lands inside the character and only the line buffer can put it back together.
        held.parser.feed(Buffer.from([0x25, 0x6f, 0x75, 0x74, 0x70, 0x75, 0x74, 0x20, 0x25, 0x30]));
        held.parser.feed(Buffer.from([0x20, 0x61, 0xe2]));
        held.parser.feed(Buffer.from([0x82, 0xac, 0x62, 0x0a]));
        expect(held.outputs).toHaveLength(1);
        expect(held.outputs[0][1].toString('utf8')).toBe('a\u20acb');
    });

    it('forwards a notification that is neither a reply nor output', () => {
        const held = feed('%session-changed $1 oculus-a1b2c3-shell\n%exit\n');
        expect(held.events.map((event) => event.name)).toEqual(['session-changed', 'exit']);
        expect(held.events[0].rest).toBe('$1 oculus-a1b2c3-shell');
    });

    it('decodes a lone escape that is not three octal digits as the characters it is', () => {
        expect(decodeOutput('a\\9b').toString('utf8')).toBe('a\\9b');
    });
});

describe('the argument quoting', () => {
    it('escapes a backslash, a double quote and a dollar', () => {
        expect(quote('plain')).toBe('"plain"');
        expect(quote('a"b')).toBe('"a\\"b"');
        expect(quote('a\\b')).toBe('"a\\\\b"');
        // tmux expands $name inside double quotes, so the dollar of a typed $HOME is escaped too.
        expect(quote('$HOME')).toBe('"\\$HOME"');
    });

    it('writes one command per line', () => {
        expect(commandLine(['send-keys', '-t', 'oculus-a1b2c3-shell', '-l', '--', 'ls'])).toBe(
            '"send-keys" "-t" "oculus-a1b2c3-shell" "-l" "--" "ls"\n'
        );
    });
});

describe('the key map', () => {
    it('names every control character xterm.js sends', () => {
        const expected: [string, string][] = [
            ['\r', 'Enter'],
            ['\n', 'Enter'],
            ['\t', 'Tab'],
            ['\u001b', 'Escape'],
            ['\u007f', 'BSpace'],
            ['\u0008', 'BSpace'],
            ['\u0000', 'C-Space'],
            ['\u0001', 'C-a'],
            ['\u0003', 'C-c'],
            ['\u0004', 'C-d'],
            ['\u001a', 'C-z']
        ];
        for (const [character, name] of expected) expect(keyName(character)).toBe(name);
        expect(keyName('a')).toBeNull();
        expect(keyName('\u00e9')).toBeNull();
    });

    it('names the arrows, Home, End and the two page keys in both their forms', () => {
        const expected: [string, string][] = [
            ['\u001b[A', 'Up'],
            ['\u001b[B', 'Down'],
            ['\u001b[C', 'Right'],
            ['\u001b[D', 'Left'],
            ['\u001bOA', 'Up'],
            ['\u001bOD', 'Left'],
            ['\u001b[H', 'Home'],
            ['\u001b[F', 'End'],
            ['\u001bOH', 'Home'],
            ['\u001bOF', 'End'],
            ['\u001b[1~', 'Home'],
            ['\u001b[4~', 'End'],
            ['\u001b[3~', 'DC'],
            ['\u001b[5~', 'PageUp'],
            ['\u001b[6~', 'PageDown']
        ];
        for (const [sequence, name] of expected)
            expect(splitKeys(sequence)).toEqual([{ key: name }]);
    });

    it('splits typed text into the runs send-keys can carry', () => {
        expect(splitKeys('ls -la\r')).toEqual([{ literal: 'ls -la' }, { key: 'Enter' }]);
        expect(splitKeys('ab\u001b[Dc')).toEqual([
            { literal: 'ab' },
            { key: 'Left' },
            { literal: 'c' }
        ]);
        expect(splitKeys('')).toEqual([]);
        expect(splitKeys('\u0003')).toEqual([{ key: 'C-c' }]);
    });

    it('keeps a character above ASCII as literal text rather than as a key', () => {
        expect(splitKeys('caf\u00e9')).toEqual([{ literal: 'caf\u00e9' }]);
    });
});
