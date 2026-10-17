// Layer 3, primitive tests. A text a source tab's draft was set to, brought into the editor's model
// (src/lib/ui/controls/editor/commands.ts, reachText), as an Apply of a Refactor Preview sets the
// draft of a tab drawn in another pane: the edits the text was reached by are made in the model
// when it takes them, and when the model refuses them (Monaco throws for ranges it will not take)
// the whole text replaces the model's, so the editor never keeps drawing the old text while the
// draft holds the new. Over a fake model that holds its text and records what it was asked.
//
// It does not cover which edits Monaco refuses or the editor's drawing, which the look does.

import type * as Monaco from 'monaco-editor';
import { describe, expect, it } from 'vitest';
import { reachText } from '../../../../src/lib/ui/controls/editor/commands.ts';

const monaco = {
    Range: class {
        constructor(
            readonly startLineNumber: number,
            readonly startColumn: number,
            readonly endLineNumber: number,
            readonly endColumn: number
        ) {}
    },
    editor: { EndOfLinePreference: { LF: 1 }, EndOfLineSequence: { LF: 0, CRLF: 1 } }
} as unknown as typeof Monaco;

/** A model holding `text` that refuses any edit but a whole replacement when `refuses` is set. */
function modelOf(text: string, refuses: boolean) {
    const held = { text, asked: [] as string[] };
    const model = {
        getValue: () => held.text,
        getFullModelRange: () => 'all',
        pushEOL: () => undefined,
        pushEditOperations: (_: unknown, operations: { range: unknown; text: string }[]) => {
            const whole = operations.length === 1 && operations[0].range === 'all';
            held.asked.push(whole ? 'whole' : 'edits');
            if (!whole && refuses) throw new Error('Overlapping ranges are not allowed!');
            held.text = whole ? operations[0].text : held.text.replace('guide/', 'docs/');
            return null;
        }
    };
    return { held, model: model as unknown as Monaco.editor.ITextModel };
}

const REACH = {
    from: '[a](guide/a.md)\n',
    edits: [
        {
            range: { start: { line: 0, character: 4 }, end: { line: 0, character: 10 } },
            newText: 'docs/'
        }
    ]
};

describe('a text brought into the editor model', () => {
    it('is made by its edits when the model takes them', () => {
        const { held, model } = modelOf(REACH.from, false);
        reachText(monaco, model, REACH, '[a](docs/a.md)\n', 'LF');
        expect(held).toEqual({ text: '[a](docs/a.md)\n', asked: ['edits'] });
    });

    it('replaces the whole text when the model refuses the edits', () => {
        const { held, model } = modelOf(REACH.from, true);
        reachText(monaco, model, REACH, '[a](docs/a.md)\n', 'LF');
        expect(held).toEqual({ text: '[a](docs/a.md)\n', asked: ['edits', 'whole'] });
    });
});
