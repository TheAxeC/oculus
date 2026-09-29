// The editor status store: what each source tab publishes for the status bar, taken away when the
// tab goes, and the asks the bar makes of one tab, each numbered so it is performed once.
//
// What this does NOT cover: the source tab performing an ask on its text.

import { describe, expect, it } from 'vitest';
import {
    createEditorStatus,
    sourceOnScreen,
    type EditorStatus
} from '../../../../src/lib/state/workbench/navigation/editor-status.svelte.ts';

const SAID: EditorStatus = {
    caret: { line: 2, column: 5, selected: 0 },
    lines: 10,
    indent: { tabs: false, size: 4 },
    ending: 'LF',
    language: 'python',
    writable: true,
    blame: '',
    actions: []
};

describe('the editor status store', () => {
    it('keeps what each tab said apart, and forgets a tab that goes', () => {
        const store = createEditorStatus();
        store.publish('one', SAID);
        store.publish('two', { ...SAID, language: 'yaml' });
        store.publish('', SAID);
        expect(store.statusOf('one')?.language).toBe('python');
        expect(store.statusOf('two')?.language).toBe('yaml');
        expect(store.statusOf('')).toBe(null);
        store.forget('one');
        store.forget('never');
        expect(store.statusOf('one')).toBe(null);
        expect(store.statusOf('two')?.language).toBe('yaml');
    });

    it('asks a tab that has said something, numbering each ask, and no other tab', () => {
        const store = createEditorStatus();
        expect(store.ask('one', { kind: 'goto', line: 3 })).toBe(false);
        expect(store.asked('one')).toBe(null);
        store.publish('one', SAID);
        store.publish('two', SAID);
        expect(store.ask('one', { kind: 'goto', line: 3 })).toBe(true);
        expect(store.asked('one')).toEqual({ kind: 'goto', line: 3, instance: 'one', seq: 1 });
        expect(store.asked('two')).toBe(null);
        store.ask('one', { kind: 'ending', ending: 'CRLF' });
        expect(store.asked('one')?.seq).toBe(2);
        store.ask('two', { kind: 'language', language: 'r' });
        // The last ask was the other tab's, so this one has nothing waiting.
        expect(store.asked('one')).toBe(null);
        expect(store.asked('two')).toMatchObject({ language: 'r', seq: 3 });
    });

    // An audit at run time, since the store keeps any ask it is handed: red under `npm run check`
    // when EditorAsk has no `action` kind.
    it('asks a tab to run one editor action by its id', () => {
        const store = createEditorStatus();
        store.publish('one', SAID);
        expect(store.ask('one', { kind: 'action', id: 'editor.action.addCommentLine' })).toBe(true);
        expect(store.asked('one')).toEqual({
            kind: 'action',
            id: 'editor.action.addCommentLine',
            instance: 'one',
            seq: 1
        });
    });

    it('finds the source tab on screen that has said something, and no other tab', () => {
        const store = createEditorStatus();
        store.publish('one', SAID);
        expect(sourceOnScreen({ id: 'one', view: 'source' }, store.statusOf)).toEqual({
            instance: 'one',
            status: SAID
        });
        expect(sourceOnScreen({ id: 'one', view: 'file' }, store.statusOf)).toBe(null);
        expect(sourceOnScreen({ id: 'two', view: 'source' }, store.statusOf)).toBe(null);
        expect(sourceOnScreen(null, store.statusOf)).toBe(null);
    });
});
