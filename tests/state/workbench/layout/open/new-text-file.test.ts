// Layer 2, client state test. New Text File's opener over the layout's openInPane
// (state/workbench/layout/open/new-text-file.ts): it opens a source tab on an untitled text, with
// the lowest "Untitled-N" no open tab holds, in the pane the menu was opened on.
//
// What this does NOT cover: the tab's editor and its Save As question, which are
// tests/state/sessions/source.test.ts for the draft and the look for the question.

import { beforeAll, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    newTextFileOpener,
    untitledLabel
} from '../../../../../src/lib/state/workbench/layout/index.ts';

beforeAll(() => setCatalog(textCatalog(loadConfig(engineDir()).config)));

describe('the label of an untitled text', () => {
    // Revert: always answer Untitled-1.
    it('is the lowest number no open tab holds', () => {
        expect(untitledLabel([])).toBe('Untitled-1');
        expect(untitledLabel(['Untitled-1', 'Untitled-3'])).toBe('Untitled-2');
        expect(untitledLabel(['Untitled-1', 'Untitled-2'])).toBe('Untitled-3');
    });

    it('ignores a label that is no untitled one', () => {
        expect(untitledLabel(['notes.md', 'Untitled', 'Untitled-x'])).toBe('Untitled-1');
    });
});

describe('New Text File', () => {
    // Revert: open a 'note' tab instead of a source tab.
    it('opens a source tab on an untitled text in the pane the menu was opened on', () => {
        const calls: unknown[][] = [];
        const open = newTextFileOpener(
            (...args: unknown[]) => {
                calls.push(args);
                return 'tab-9';
            },
            () => ['Untitled-1']
        );
        open('p', [1, 0]);
        expect(calls).toEqual([['source', { untitled: true, label: 'Untitled-2' }, 'p', [1, 0]]]);
    });
});
