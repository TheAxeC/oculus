// The control-mode protocol, on recorded text. No tmux runs here: every case feeds the parser the
// bytes a `tmux -C attach-session` child printed on this machine, so the decoding, the reply
// pairing and the cutting of typed input are checked without a process, a socket or a session.

import { describe, expect, it } from 'vitest';
import {
    commandLine,
    createParser,
    decodeOutput,
    inputChunks,
    INPUT_MOST,
    quote,
    type ControlEvent,
    type ControlReply
} from '../../../../src/lib/server/machine/pty/tmux.ts';

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

describe('the input pieces', () => {
    /** The byte count of each piece, after checking the pieces put back together are the input. */
    function sizes(input: Buffer, most?: number): number[] {
        const pieces = most === undefined ? inputChunks(input) : inputChunks(input, most);
        expect(Buffer.concat(pieces).equals(input)).toBe(true);
        return pieces.map((piece) => piece.length);
    }

    it('keeps a mouse report whole, as one piece of its 11 bytes', () => {
        const report = Buffer.from('\u001b[<0;20;14M');
        expect(sizes(report)).toEqual([11]);
    });

    it('keeps a typed line whole', () => {
        expect(sizes(Buffer.from('ls -la\r'))).toEqual([7]);
    });

    it('cuts a long text at the most one command carries', () => {
        expect(INPUT_MOST).toBe(996);
        expect(sizes(Buffer.from('a'.repeat(INPUT_MOST + 904)))).toEqual([INPUT_MOST, 904]);
        expect(sizes(Buffer.from('a'.repeat(5000)), 4096)).toEqual([4096, 904]);
    });

    it('never cuts inside a UTF-8 character', () => {
        const text = `${'a'.repeat(INPUT_MOST - 1)}\u00e9`;
        expect(sizes(Buffer.from(text))).toEqual([INPUT_MOST - 1, 2]);
        expect(sizes(Buffer.from(`${'a'.repeat(4095)}\u00e9`), 4096)).toEqual([4095, 2]);
    });

    it('never cuts inside a CSI sequence', () => {
        const report = '\u001b[<0;20;14M';
        expect(sizes(Buffer.from(`${'a'.repeat(INPUT_MOST - 6)}${report}`))).toEqual([
            INPUT_MOST - 6,
            11
        ]);
        expect(sizes(Buffer.from(`${'a'.repeat(4090)}${report}`), 4096)).toEqual([4090, 11]);
    });

    it('keeps an OSC answer whole up to its BEL', () => {
        const answer = '\u001b]11;rgb:0000/0000/0000\u0007';
        const input = Buffer.from(`${'a'.repeat(INPUT_MOST - 16)}${answer}`);
        const pieces = inputChunks(input);
        expect(pieces.map((piece) => piece.length)).toEqual([INPUT_MOST - 16, answer.length]);
        expect(pieces[1].toString('latin1')).toBe(answer);
        expect(sizes(Buffer.from(`${'a'.repeat(4080)}${answer}`), 4096)).toEqual([
            4080,
            answer.length
        ]);
    });

    it('ends an SS3, a string closed by ESC backslash, and any other ESC x where they end', () => {
        // Each sequence straddles the cut at 8 bytes, so each is pushed whole into the next piece.
        expect(sizes(Buffer.from('aaaaaaa\u001bOA'), 8)).toEqual([7, 3]);
        expect(sizes(Buffer.from('aaaaaa\u001bPq\u001b\\b'), 8)).toEqual([6, 6]);
        expect(sizes(Buffer.from('aaaaaaa\u001b7b'), 8)).toEqual([7, 3]);
    });

    it('cuts a sequence longer than a piece at the last character boundary', () => {
        const title = `\u001b]0${'\u00e9'.repeat(10)}\u0007`;
        // 3 bytes of opener, then two-byte characters: a cut at 8 would fall inside the third one.
        expect(sizes(Buffer.from(title), 8)).toEqual([7, 8, 8, 1]);
    });

    it('gives no piece for no input', () => {
        expect(inputChunks(Buffer.alloc(0))).toEqual([]);
    });
});
