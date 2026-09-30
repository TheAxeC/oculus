// Layer 3, primitive. Bars a parent draws above lines of a Monaco editor: the diff pane's hunk bars
// and the merge editor's conflict bars. Each bar is an element the parent renders and hands over
// through an attachment, placed as Monaco places its own widgets between lines: an empty view zone
// above the line keeps the room, and the element sits over that room as an overlay widget, moved
// to the zone's top on every render. Content inside a view zone takes no pointer events, since the
// line layer lies above it, so the bar's buttons live in the overlay, which lies above the lines.
// The zone is made again for every model the editor is given, since the editor drops its zones
// with its model and makes none while it holds none.
//
// A bar's zone is drawn before any other zone after the same line (`ordinal` 0), so in an inline
// diff it sits above the removed lines Monaco draws there, and a diff editor gives the other side
// the same room, which keeps the two sides aligned.

import type * as Monaco from 'monaco-editor';
import type { Attachment } from 'svelte/attachments';

/** A bar's zone orders before Monaco's own zones after the same line. */
const FIRST = 0;

/** Where a bar sits while its zone has not been drawn: out of sight above the editor. */
const OUT_OF_SIGHT = '-1000px';

/** One bar held: the line it sits after, and its zone and widget while an editor holds it. */
type Held = {
    after: number;
    zone: string | null;
    widget: Monaco.editor.IOverlayWidget | null;
};

/** The bars of one editor, handed over by the parent's elements and placed once it exists. */
export type LineBars = {
    /** Place every bar held in the editor, and each one handed over after. */
    mount: (editor: Monaco.editor.ICodeEditor, lineHeight: number) => void;
    /** Take every bar out of the editor, which is going. */
    unmount: () => void;
    /** An attachment that places its element as a bar after the line given (0 for the top). */
    above: (after: number) => Attachment<HTMLElement>;
};

/** The bars of one editor, none yet. */
export function lineBars(): LineBars {
    let editor: Monaco.editor.ICodeEditor | null = null;
    let height = 0;
    let layout: Monaco.IDisposable | null = null;
    let modelled: Monaco.IDisposable | null = null;
    let made = 0;
    const held = new Map<HTMLElement, Held>();

    /** A bar spans the editor's text, the minimap and the scrollbar left clear. */
    function fit(on: Monaco.editor.ICodeEditor, node: HTMLElement): void {
        const info = on.getLayoutInfo();
        node.style.width = `${info.width - info.minimap.minimapWidth - info.verticalScrollbarWidth}px`;
    }

    function place(node: HTMLElement, entry: Held): void {
        const on = editor;
        if (on === null) return;
        made += 1;
        const id = `oculus.bar.${String(made)}`;
        node.style.position = 'absolute';
        node.style.left = '0';
        const widget: Monaco.editor.IOverlayWidget = {
            getId: () => id,
            getDomNode: () => node,
            getPosition: () => null
        };
        on.addOverlayWidget(widget);
        fit(on, node);
        entry.widget = widget;
        room(on, node, entry);
    }

    /**
     * Make the room of a bar above its line, and leave the bar out of sight until its zone is
     * drawn. An editor makes no zone while it holds no model, and drops its zones when it is given
     * another model or none while it keeps its overlay widgets, so this runs again on every model
     * for a bar whose widget stays.
     */
    function room(on: Monaco.editor.ICodeEditor, node: HTMLElement, entry: Held): void {
        node.style.top = OUT_OF_SIGHT;
        if (on.getModel() === null) return;
        const tall = Math.max(node.offsetHeight, height);
        on.changeViewZones((zones) => {
            entry.zone = zones.addZone({
                afterLineNumber: entry.after,
                heightInPx: tall,
                domNode: document.createElement('div'),
                ordinal: FIRST,
                suppressMouseDown: true,
                onDomNodeTop: (top) => {
                    node.style.top = `${String(top)}px`;
                }
            });
        });
    }

    function remove(entry: Held): void {
        const on = editor;
        if (on === null) return;
        const zone = entry.zone;
        if (zone !== null) on.changeViewZones((zones) => zones.removeZone(zone));
        if (entry.widget !== null) on.removeOverlayWidget(entry.widget);
        entry.zone = null;
        entry.widget = null;
    }

    return {
        mount(on, lineHeight) {
            editor = on;
            height = lineHeight;
            layout = on.onDidLayoutChange(() => {
                for (const node of held.keys()) fit(on, node);
            });
            modelled = on.onDidChangeModel(() => {
                for (const [node, entry] of held) {
                    entry.zone = null;
                    if (entry.widget !== null) room(on, node, entry);
                }
            });
            for (const [node, entry] of held) place(node, entry);
        },
        unmount() {
            for (const entry of held.values()) remove(entry);
            layout?.dispose();
            layout = null;
            modelled?.dispose();
            modelled = null;
            editor = null;
        },
        above(after) {
            return (node) => {
                const entry: Held = { after, zone: null, widget: null };
                held.set(node, entry);
                place(node, entry);
                return () => {
                    remove(entry);
                    held.delete(node);
                };
            };
        }
    };
}
