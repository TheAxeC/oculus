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

describe('the control stream', () => {
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
