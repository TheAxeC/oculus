// Layer 3, shell test. Closing the tab of a custom editor (state/system/apps/apps.svelte.ts and
// shell/panes/strip/close-question.svelte.ts): once the editor's frame calls `document.dirty(true)`
// the tab holds unsaved changes and closing it asks whether to save them, with the Save every close
// question over unsaved text has, which saves through the frame; once the frame calls
// `document.dirty(false)` closing it asks nothing. This is the custom editor's row of G28.
//
// The page's client state is the real one over a frame whose connection is a double that hands the
// page's methods back to the test. What this does NOT cover: the dialog that draws the question,
// which needs a DOM and is seen at the look.

import { describe, expect } from 'vitest';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createCloseQuestion } from '../../../../src/lib/shell/panes/strip/close-question.svelte.ts';
import { serialiseLayout } from '../../../../src/lib/state/workbench/layout/index.ts';
import type { FrameOptions } from '../../../../src/lib/state/system/apps/frame/bridge.ts';
import type { Methods } from '../../../../src/lib/state/system/apps/frame/methods.ts';
import { createClientState } from '../../../fixtures/client.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    fakeStorage,
    openLayout,
    heldPages,
    pageAround
} from '../../../state/workbench/layout/layout-fixture.ts';

const merged = loadConfig(engineDir()).config;
setCatalog(textCatalog(merged));

/** The frame's link with nothing to tell: the test calls the page's methods itself. */
const LINK = {
    deliver: () => undefined,
    theme: () => undefined,
    store: () => undefined,
    host: () => undefined,
    command: () => Promise.resolve(undefined),
    visibility: () => undefined,
    settings: () => undefined,
    save: () => Promise.resolve(undefined),
    revert: () => Promise.resolve(undefined),
    cancel: () => undefined,
    destroy: () => undefined
};

/**
 * A client whose page holds the tab `editor` of a custom editor and a source tab `other`. The
 * frame's save runs `saving` with the page's methods, as a frame that saves its document and clears
 * its mark does.
 */
function tabs(saving: (methods: Methods) => Promise<unknown> = () => Promise.resolve()) {
    const client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: {
            config: merged,
            hubs: { primary: null, lists: {} },
            text: textCatalog(merged),
            icons: {},
            host: { name: 'host', address: '' },
            findings: []
        }
    });
    const pane = {
        kind: 'pane' as const,
        tabs: [
            { id: 'editor', view: 'app-editor', state: {} },
            { id: 'other', view: 'source', state: {} }
        ],
        active: 'editor'
    };
    openLayout(
        client.layout,
        fakeStorage(serialiseLayout(heldPages([pageAround('main', pane)], [])))
    );
    const page = client.layout.currentPage().id;
    const instances = () =>
        client.layout.layout(page).kind === 'pane'
            ? (client.layout.layout(page) as typeof pane).tabs
            : [];
    const question = createCloseQuestion({
        client,
        instances,
        labelOf: (id) => `tab ${id}`,
        page: () => page
    });
    const connected: { methods: Methods | null } = { methods: null };
    client.apps.mount({
        frame: { contentWindow: {} } as unknown as HTMLIFrameElement,
        connect: (options: FrameOptions) => {
            connected.methods = options.methods;
            return { ...LINK, save: () => saving(options.methods) };
        },
        instance: 'editor',
        id: 'app:notes',
        theme: () => ({ dark: true }) as never,
        focused: () => false,
        forwardKey: () => undefined,
        tabFor: () => ({ view: 'source', state: {} }),
        name: '',
        view: '',
        document: { root: 'one', path: 'data.json' }
    });
    const frame = connected.methods;
    if (frame === null) throw new Error('the mount handed no methods to the frame');
    return { client, question, frame, open: () => instances().map((one) => one.id) };
}

type Row = {
    row: string;
    /** The marks the frame sets, in turn, before the close. */
    marks: boolean[];
    /** Whether the frame's save clears the mark. */
    clears: boolean;
    closes: string;
    asks: string | null;
    answer?: 'cancel' | 'save';
    open: string[];
};

const ROWS: Row[] = [
    {
        row: 'asks once the frame marked the document dirty, and Cancel closes nothing',
        marks: [true],
        clears: false,
        closes: 'editor',
        asks: t('ui.tab_close_dirty'),
        answer: 'cancel',
        open: ['editor', 'other']
    },
    {
        row: "saves through the frame on Save and closes the tab once the frame's save cleared the mark",
        marks: [true],
        clears: true,
        closes: 'editor',
        asks: t('ui.tab_close_dirty'),
        answer: 'save',
        open: ['other']
    },
    {
        row: "keeps the tab on Save while the frame's save leaves the mark",
        marks: [true],
        clears: false,
        closes: 'editor',
        asks: t('ui.tab_close_dirty'),
        answer: 'save',
        open: ['editor', 'other']
    },
    {
        row: 'asks nothing once the frame cleared the mark',
        marks: [true, false],
        clears: false,
        closes: 'editor',
        asks: null,
        open: ['other']
    },
    {
        row: 'asks nothing for a tab no frame marked',
        marks: [],
        clears: false,
        closes: 'other',
        asks: null,
        open: ['editor']
    }
];

describe('closing the tab of a custom editor', () => {
    it.each(ROWS)('$row', async (row) => {
        const { client, question, frame, open } = tabs((methods) =>
            row.clears ? methods.documentDirty(false) : Promise.resolve()
        );
        for (const mark of row.marks) await frame.documentDirty(mark);
        expect(client.ui.unsaved('editor')).toBe(row.marks.at(-1) ?? false);
        await question.closeTab(row.closes);
        expect([question.message(), question.saves()]).toEqual([row.asks, row.asks !== null]);
        if (row.answer === 'cancel') question.cancel();
        if (row.answer === 'save') await question.save();
        expect(open()).toEqual(row.open);
    });
});
