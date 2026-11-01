// The control-mode protocol, on recorded text. No tmux runs here: every case feeds the parser the
// bytes a `tmux -C attach-session` child printed on this machine.

import { describe, expect, it } from 'vitest';
import {
    createParser,
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

/** Each chunk as one read from the child's stdout, for bytes `feed`'s latin1 would change. */
function feedBytes(chunks: Buffer[]): ReturnType<typeof recorder> {
    const held = recorder();
    for (const chunk of chunks) held.parser.feed(chunk);
    return held;
}

/** ASCII protocol text and raw bytes, joined in stream order. */
function stream(...parts: (string | Buffer)[]): Buffer {
    return Buffer.concat(parts.map((part) => Buffer.from(part)));
}

/** The record glyph, e-acute, a box character and an emoji, as tmux writes them. */
const RAW = Buffer.from('e28fbac3a9e29480f09f9880', 'hex');
const TEXT = '\u{23fa}\u{e9}\u{2500}\u{1f600}';

/** The record glyph alone, as tmux writes it. */
const GLYPH = Buffer.from('e28fba', 'hex');

const REPLY = stream('%begin 1793554567 290 1\nA', RAW, 'Z\n%end 1793554567 290 1\n');

const REFUSAL = stream(
    '%begin 1793554567 291 1\nparse error: unknown command: foo-bad-',
    GLYPH,
    '\n%error 1793554567 291 1\n'
);

const OUTPUT = stream(
    '%begin 1793554580 290 1\nok\n%end 1793554580 290 1\n',
    '%output %0 q\\134x',
    Buffer.from('e28fbac3a9', 'hex'),
    '\\015\\012\n',
    '%begin 1793554580 292 1\ndone\n%end 1793554580 292 1\n'
);

const CUT = REPLY.indexOf(RAW) + 1;

const REPLY_ROWS: {
    name: string;
    chunks: Buffer[];
    replies: ControlReply[];
    outputs: [string, Buffer][];
}[] = [
    {
        name: 'a line of characters above ASCII',
        chunks: [REPLY],
        replies: [{ number: '290', lines: [`A${TEXT}Z`], error: false }],
        outputs: []
    },
    {
        name: 'the same bytes cut inside a character',
        chunks: [REPLY.subarray(0, CUT), REPLY.subarray(CUT)],
        replies: [{ number: '290', lines: [`A${TEXT}Z`], error: false }],
        outputs: []
    },
    {
        name: 'an %error line above ASCII',
        chunks: [REFUSAL],
        replies: [
            {
                number: '291',
                lines: ['parse error: unknown command: foo-bad-\u{23fa}'],
                error: true
            }
        ],
        outputs: []
    },
    {
        name: 'a reply of ASCII alone',
        chunks: [Buffer.from('%begin 1793554580 290 1\nok\n%end 1793554580 290 1\n')],
        replies: [{ number: '290', lines: ['ok'], error: false }],
        outputs: []
    },
    {
        name: 'an %output line between two ASCII replies',
        chunks: [OUTPUT],
        replies: [
            { number: '290', lines: ['ok'], error: false },
            { number: '292', lines: ['done'], error: false }
        ],
        outputs: [['%0', stream('q\\x', Buffer.from('e28fbac3a9', 'hex'), '\r\n')]]
    },
    {
        name: 'a pane line that begins %end',
        chunks: [
            stream(
                '%begin 1793556060 298 1\nfirst\n%end of the abstract\nafter one\n',
                '%end 1793556060 298 1\n'
            )
        ],
        replies: [
            {
                number: '298',
                lines: ['first', '%end of the abstract', 'after one'],
                error: false
            }
        ],
        outputs: []
    },
    {
        name: 'a pane line that begins %error',
        chunks: [
            stream(
                '%begin 1793556060 299 1\nfirst\n%error bars from bootstrap\n',
                '%end 1793556060 299 1\n'
            )
        ],
        replies: [{ number: '299', lines: ['first', '%error bars from bootstrap'], error: false }],
        outputs: []
    },
    {
        name: 'pane lines that begin %end and %output, which hand on no output',
        chunks: [
            stream(
                '%begin 1793556060 300 1\nfirst\n%end x\n%output %0 injected\n',
                '%end 1793556060 300 1\n'
            )
        ],
        replies: [
            { number: '300', lines: ['first', '%end x', '%output %0 injected'], error: false }
        ],
        outputs: []
    }
];

describe('the control stream', () => {
    it.each(REPLY_ROWS)(
        'decodes a reply to the text the pane holds: $name',
        ({ chunks, replies, outputs }) => {
            const held = feedBytes(chunks);
            expect(held.replies).toEqual(replies);
            expect(held.outputs).toEqual(outputs);
        }
    );

    it('keeps two panes apart while their output interleaves', () => {
        const held = feed('%output %0 one\n%output %1 two\n%output %0 three\n');
        expect(held.outputs.map(([pane]) => pane)).toEqual(['%0', '%1', '%0']);
        expect(held.outputs.map(([, bytes]) => bytes.toString('utf8'))).toEqual([
            'one',
            'two',
            'three'
        ]);
    });
});
