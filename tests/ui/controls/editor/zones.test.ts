// The bars an editor draws above its lines keep their room through every model the editor is given:
// an editor drops its view zones with its model and keeps its overlay widgets, so a bar placed
// before the model came, or kept across a model change, would stay out of sight, and with it the
// merge editor's Accept buttons.
//
// The editor here follows Monaco's own rules for zones: a zone can be made only while the editor
// holds a model (codeEditorWidget.js, changeViewZones), and giving the editor another model, or
// none, drops every zone at once. The file does not cover Monaco itself drawing a zone and calling
// its top back; the look at landing covers that.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Monaco from 'monaco-editor';
import { lineBars, type LineBars } from '../../../../src/lib/ui/controls/editor/zones.ts';

type Zone = Monaco.editor.IViewZone;

type FakeEditor = {
    editor: Monaco.editor.ICodeEditor;
    zones: Map<string, Zone>;
    widgets: Set<Monaco.editor.IOverlayWidget>;
    /** How many times the editor was asked to change its zones, with a model or without. */
    changes: () => number;
    /** The model-change subscriptions held now, and how many were disposed. */
    subscriptions: { held: () => number; disposed: () => number };
    /** Give the editor another model, or none: its zones go and its widgets stay. */
    model(next: object | null): void;
    /** Draw the zones after a line, or every zone, at a top, as Monaco does on a layout. */
    draw(top: number, after?: number): void;
};

/** An editor that makes zones only with a model, drops them with it, and keeps its widgets. */
function fakeEditor(): FakeEditor {
    const zones = new Map<string, Zone>();
    const widgets = new Set<Monaco.editor.IOverlayWidget>();
    const listeners = new Set<() => void>();
    let changes = 0;
    let model: object | null = null;
    let made = 0;
    let disposed = 0;
    const editor = {
        getModel: () => model,
        getLayoutInfo: () => ({
            width: 400,
            minimap: { minimapWidth: 40 },
            verticalScrollbarWidth: 10
        }),
        addOverlayWidget: (widget: Monaco.editor.IOverlayWidget) => widgets.add(widget),
        removeOverlayWidget: (widget: Monaco.editor.IOverlayWidget) => widgets.delete(widget),
        changeViewZones: (change: (accessor: Monaco.editor.IViewZoneChangeAccessor) => void) => {
            changes += 1;
            if (model === null) return;
            change({
                addZone: (zone: Zone) => {
                    made += 1;
                    zones.set(String(made), zone);
                    return String(made);
                },
                removeZone: (id: string) => zones.delete(id),
                layoutZone: () => undefined
            });
        },
        onDidLayoutChange: () => ({ dispose: () => undefined }),
        onDidChangeModel: (listener: () => void) => {
            listeners.add(listener);
            return {
                dispose: () => {
                    disposed += 1;
                    listeners.delete(listener);
                }
            };
        }
    } as unknown as Monaco.editor.ICodeEditor;
    return {
        editor,
        zones,
        widgets,
        changes: () => changes,
        subscriptions: { held: () => listeners.size, disposed: () => disposed },
        model(next) {
            model = next;
            zones.clear();
            for (const listener of [...listeners]) listener();
        },
        draw(top, after) {
            for (const zone of zones.values()) {
                if (after === undefined || zone.afterLineNumber === after) zone.onDomNodeTop?.(top);
            }
        }
    };
}

/** A bar's element as far as zones.ts reads and writes it. */
function bar(offsetHeight = 28): HTMLElement {
    return { style: {}, offsetHeight } as unknown as HTMLElement;
}

/** Place an element as a bar after a line, and give back what takes it away. */
function place(bars: LineBars, after: number, node: HTMLElement): () => void {
    const off = bars.above(after)(node);
    if (typeof off !== 'function') throw new Error('a bar placed hands back its way out');
    return off;
}

/** The lines and heights of the zones an editor holds now, in the order they were made. */
function shapes(fake: FakeEditor): number[][] {
    return [...fake.zones.values()].map((zone) => [zone.afterLineNumber, zone.heightInPx ?? 0]);
}

describe('the bars above the lines of an editor', () => {
    beforeEach(() => {
        vi.stubGlobal('document', { createElement: () => ({}) });
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps a bar out of sight and asks for no room while the editor holds no model', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        bars.mount(fake.editor, 18);
        const node = bar();
        place(bars, 1, node);
        expect(fake.widgets.size).toBe(1);
        expect(fake.zones.size).toBe(0);
        expect(node.style.top).toBe('-1000px');
    });

    it('makes the room of a bar placed before the model once the model is set', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        bars.mount(fake.editor, 18);
        const node = bar();
        place(bars, 1, node);
        fake.model({});
        expect(fake.widgets.size).toBe(1);
        expect(shapes(fake)).toEqual([[1, 28]]);
        fake.draw(36);
        expect(node.style.top).toBe('36px');
    });

    it('makes the room of every bar again when the model is replaced, and takes each away with its bar', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        fake.model({});
        bars.mount(fake.editor, 18);
        const first = bar();
        const second = bar();
        const offFirst = place(bars, 1, first);
        const offSecond = place(bars, 5, second);
        expect(shapes(fake)).toEqual([
            [1, 28],
            [5, 28]
        ]);
        fake.model({});
        expect(shapes(fake)).toEqual([
            [1, 28],
            [5, 28]
        ]);
        expect([first.style.top, second.style.top]).toEqual(['-1000px', '-1000px']);
        fake.draw(54, 1);
        fake.draw(180, 5);
        expect([first.style.top, second.style.top]).toEqual(['54px', '180px']);
        offFirst();
        expect(fake.zones.size).toBe(1);
        expect(fake.widgets.size).toBe(1);
        offSecond();
        expect(fake.zones.size).toBe(0);
        expect(fake.widgets.size).toBe(0);
    });

    it('reaches a bar with no model change once the bars are taken out of the editor', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        bars.mount(fake.editor, 18);
        fake.model({});
        place(bars, 1, bar());
        bars.unmount();
        expect(fake.subscriptions.disposed()).toBe(1);
        expect(fake.subscriptions.held()).toBe(0);
        expect(fake.zones.size).toBe(0);
        expect(fake.widgets.size).toBe(0);
        fake.model({});
        expect(fake.zones.size).toBe(0);
    });

    it('gives a bar of no height the height of a line', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        fake.model({});
        bars.mount(fake.editor, 18);
        place(bars, 2, bar(0));
        expect(shapes(fake)).toEqual([[2, 18]]);
    });

    it('keeps a bar through a null model and gives it a new zone for the next one', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        fake.model({});
        bars.mount(fake.editor, 18);
        const node = bar();
        place(bars, 3, node);
        fake.draw(54);
        expect(node.style.top).toBe('54px');
        fake.model(null);
        expect(fake.zones.size).toBe(0);
        expect(fake.widgets.size).toBe(1);
        expect(node.style.top).toBe('-1000px');
        fake.model({});
        expect(shapes(fake)).toEqual([[3, 28]]);
        fake.draw(72);
        expect(node.style.top).toBe('72px');
    });

    it('makes one zone for a bar, not one per model change, when the model changes twice before a draw', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        bars.mount(fake.editor, 18);
        const node = bar();
        place(bars, 1, node);
        fake.model({});
        fake.model({});
        expect(shapes(fake)).toEqual([[1, 28]]);
        fake.draw(36);
        expect(node.style.top).toBe('36px');
    });

    it('takes a bar away that holds a widget and no zone without asking the editor to remove a zone', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        fake.model({});
        bars.mount(fake.editor, 18);
        const off = place(bars, 2, bar());
        fake.model(null);
        expect(fake.widgets.size).toBe(1);
        expect(fake.zones.size).toBe(0);
        const before = fake.changes();
        expect(off).not.toThrow();
        expect(fake.widgets.size).toBe(0);
        expect(fake.changes()).toBe(before);
    });

    it('makes the room of a bar placed on an editor that already holds a model at once', () => {
        const fake = fakeEditor();
        const bars = lineBars();
        fake.model({});
        bars.mount(fake.editor, 18);
        const node = bar();
        place(bars, 4, node);
        expect(shapes(fake)).toEqual([[4, 28]]);
        expect(node.style.top).toBe('-1000px');
        fake.draw(72);
        expect(node.style.top).toBe('72px');
    });
});
