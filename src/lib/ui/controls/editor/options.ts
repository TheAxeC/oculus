// Layer 3, primitive. The options a parent hands the editors (word wrap, rulers, the minimap,
// whitespace and sticky scroll) as Monaco names them, the call that applies a change to a live
// editor, the indentation of a model, and the id of the action that toggles word wrap, which the
// parent hands the editor with the rest of its own actions (types.ts `EditorOwnAction`). Monaco is
// only a type here: the editor passes in the editor and the model it holds.
//
// It also holds where the editors draw what Monaco draws outside the text. The pop-ups Monaco marks
// as overflowing the editor (the hover, the suggest list and its details, the parameter hints, the
// rename box, the colour picker, the message and the paste-as widget) are drawn in a node of the
// editor's own on the document body, and every context view (the right-click menu, the code action
// list, the select lists of Monaco's action bars) in one node for the page, both over the page and
// over every float, since a pane, a split, the diff list or a float clips what is drawn inside it
// and a blurred box is the containing block of what is fixed inside it (DESIGN.md, Theming). What
// Monaco places in the text on purpose stays in the editor's box (the find widget, the peek zone,
// the lightbulb, CodeLens, inline completions, the sticky scroll), and so does the quick input (Go
// to Line, Go to Symbol), which Monaco scopes to its editor. The nodes carry the class
// `monaco-editor`, which Monaco's colour variables and widget rules are written for, the theme type
// class of the editor's root (`vs`, `vs-dark`, `hc-black`, `hc-light`), and the size the text had
// in the box. A node of widgets belongs to one editor box: Monaco counts focus inside the node as
// the editor's own, so a node shared by two boxes would make the editors of both hold the widget
// focus whenever one widget does. A peek's editor and the two sides of a diff editor draw in the
// node of the box they stand in.
//
// A widget outside the box hears no key through the box, so the keys typed in it are dispatched
// again in the editor that owns it. Monaco places a fixed widget against the window only when the
// editor draws, so an ancestor of the box that scrolls closes the editor's context view, hover,
// suggest list and parameter hints, and draws the editor again when another widget (the rename
// box, a message, the paste-as button) is still open, which places it against the text again.
import type * as Monaco from 'monaco-editor';
import type { ContextViewService } from 'monaco-editor/platform/contextview/browser/contextViewService';
import type { EditorIndent } from './types';
import './kit/theme/widgets.css';

/**
 * The options a parent hands an editor, each left to Monaco's own while absent: a diff editor is
 * handed no minimap, and a parent that has not yet read the configuration hands no option at all.
 */
export type EditorOptions = {
    wordWrap?: Monaco.editor.IEditorOptions['wordWrap'];
    rulers?: number[];
    minimap?: boolean;
    renderWhitespace?: Monaco.editor.IEditorOptions['renderWhitespace'];
    stickyScroll?: boolean;
};

/** An editor that takes options: the code editor and the diff editor both do. */
type Updatable = { updateOptions(options: Monaco.editor.IEditorOptions): void };

/** The options as Monaco's option names, leaving out each one that is not handed. */
export function monacoOptions(options: EditorOptions): Monaco.editor.IEditorOptions {
    const named: Monaco.editor.IEditorOptions = {};
    if (options.wordWrap !== undefined) named.wordWrap = options.wordWrap;
    if (options.rulers !== undefined) named.rulers = options.rulers;
    if (options.minimap !== undefined) named.minimap = { enabled: options.minimap };
    if (options.renderWhitespace !== undefined) named.renderWhitespace = options.renderWhitespace;
    if (options.stickyScroll !== undefined) named.stickyScroll = { enabled: options.stickyScroll };
    return named;
}

/** Put the options on a live editor in one update. */
export function applyOptions(editor: Updatable, options: EditorOptions): void {
    editor.updateOptions(monacoOptions(options));
}

/** Give a model its indentation: the width of a step, and a tab or spaces. */
export function applyIndent(
    model: Pick<Monaco.editor.ITextModel, 'updateOptions'>,
    indent: EditorIndent
): void {
    model.updateOptions({
        tabSize: indent.size,
        indentSize: indent.size,
        insertSpaces: !indent.tabs
    });
}

/** The id of the action that toggles word wrap, which a parent gives Alt+Z. */
export const WRAP_ACTION = 'oculus.toggleWordWrap';

/** The class of every node Monaco draws widgets in. */
const WIDGET_CLASS = 'monaco-editor';

/**
 * The depth of the nodes: over every free and docked float of the page area, whose depths start at
 * 5 and rise by two a float (shell/panes/floats/float-geometry.ts), and under the dialogs, which
 * start at 60 (ui/frame/Modal.svelte), and the tooltips at 80 (ui/menu/Tooltip.svelte).
 */
const WIDGET_DEPTH = 50;

/** The classes Monaco puts on the root of an editor for the type of its colour theme. */
const THEME_TYPES = ['vs', 'vs-dark', 'hc-black', 'hc-light'] as const;

/**
 * The commands that close the hover, the suggest list and the parameter hints of an editor. Each
 * does nothing for a widget that is not open.
 */
const CLOSING = ['editor.action.hideHover', 'hideSuggestWidget', 'closeParameterHints'] as const;

/** The editors Monaco holds on the page, a peek's and a diff editor's sides included. */
type Editors = () => readonly Monaco.editor.ICodeEditor[];

/**
 * A node on the document body that holds one depth for what is drawn in it. The page's node is as
 * large as the window, which is what Monaco sizes its lists by, and the nodes of the editors have
 * no size, so what is drawn in them is placed against the window. A node takes no pointer itself,
 * the widgets in it do (widgets.css), it paints no background, and its text is the size the text of
 * an editor's box has (`--fs-sm`, set on the box by Editor.svelte and DiffEditor.svelte).
 */
function widgetNode(kind: 'widgets' | 'menus'): HTMLElement {
    const node = document.createElement('div');
    const whole = kind === 'menus';
    node.className = WIDGET_CLASS;
    node.dataset.editorWidgets = kind;
    Object.assign(node.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: whole ? '100%' : '0',
        height: whole ? '100%' : '0',
        zIndex: String(WIDGET_DEPTH),
        pointerEvents: 'none',
        background: 'transparent',
        fontSize: 'var(--fs-sm)'
    });
    document.body.appendChild(node);
    return node;
}

/**
 * Give every widgets node the theme type class the editors' roots carry. Monaco's theme is one for
 * the page, so the root of any editor on the page tells it; with no editor on the page there is
 * nothing to follow.
 */
function followTheme(): void {
    const root = document.querySelector('.monaco-editor:not([data-editor-widgets])');
    if (root === null) return;
    for (const node of document.querySelectorAll<HTMLElement>('[data-editor-widgets]')) {
        for (const type of THEME_TYPES) node.classList.toggle(type, root.classList.contains(type));
    }
}

/** The focusable parts of a widget, in the order Tab walks them. */
const FOCUSABLE = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';

/**
 * Whether a Tab typed on `target` leaves the widget it was typed in. The widget is the element of
 * `node` that holds the target, one level under the node's own children (Monaco's containers of
 * the overflowing widgets and of the context view); a Tab leaves it from its last focusable part,
 * a Shift+Tab from its first, and any Tab from a widget with no focusable part.
 */
function leaves(press: KeyboardEvent, node: HTMLElement): boolean {
    let widget = press.target instanceof HTMLElement ? press.target : null;
    while (widget !== null && widget.parentElement?.parentElement !== node) {
        widget = widget.parentElement;
    }
    if (widget === null) return true;
    const parts = [widget, ...widget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (part) => part.matches(FOCUSABLE) && part.checkVisibility()
    );
    const at = parts.indexOf(press.target as HTMLElement);
    if (parts.length === 0 || at === -1) return true;
    return press.shiftKey ? at === 0 : at === parts.length - 1;
}

/** Whether a widget drawn in the node is open: shown, not merely kept in the page by Monaco. */
function shows(node: HTMLElement): boolean {
    return [...node.querySelectorAll<HTMLElement>(':scope > * > *')].some((widget) =>
        widget.checkVisibility({ visibilityProperty: true, opacityProperty: true })
    );
}

/** The listener Monaco's layout events are given, which no event of this layout ever reaches. */
const NEVER = (): Monaco.IDisposable => ({ dispose: () => undefined });

/** A copy of a key press that can be dispatched again, with the fields Monaco reads a key by. */
function copyOfKey(press: KeyboardEvent): KeyboardEvent {
    return new KeyboardEvent('keydown', {
        key: press.key,
        code: press.code,
        location: press.location,
        repeat: press.repeat,
        ctrlKey: press.ctrlKey,
        shiftKey: press.shiftKey,
        altKey: press.altKey,
        metaKey: press.metaKey,
        isComposing: press.isComposing,
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Monaco reads the key by it
        keyCode: press.keyCode,
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Monaco reads the key by it
        charCode: press.charCode,
        bubbles: true,
        cancelable: true,
        composed: true
    });
}

/**
 * A key typed in a widget, handed to the editor that owns the widget. Monaco hears a key through
 * listeners on its editors' boxes, so the key is dispatched again on the editor's root, where the
 * editor's key handlers and the page's read it as a key typed in the editor. The original is
 * stopped at the node after the listeners that the window and the document hold in the capture
 * phase have read it, so those hear the original and the copy: each of them only marks a press
 * (shell/panes/PaneBody.svelte) or closes a tooltip (ui/menu/Tooltip.svelte). The original keeps
 * its effect in the widget (the letters typed in the rename box) unless Monaco took the key. A Tab
 * that nothing took moves between the widget's own parts, as it does in a focused hover, and one
 * that would leave the widget returns the focus to the editor, since the next control after a node
 * on the body is not where a reader leaves the editor.
 */
function forward(
    press: KeyboardEvent,
    editor: Monaco.editor.ICodeEditor | null,
    node: HTMLElement
): void {
    const root = editor?.getDomNode();
    if (editor === null || root === null || root === undefined) return;
    press.stopPropagation();
    if (!root.dispatchEvent(copyOfKey(press))) {
        press.preventDefault();
    } else if (press.key === 'Tab' && leaves(press, node)) {
        press.preventDefault();
        editor.focus();
    }
}

/** The node of one editor box's widgets, and the ties between it and the editors in the box. */
export type Widgets = {
    /** The options that draw the editor's widgets in the node. */
    options: { fixedOverflowWidgets: true; overflowWidgetsDomNode: HTMLElement };
    /**
     * Follow the editors drawn in the box once they are made: the node takes the theme type class
     * of their root each time an editor is given a model, which is when Monaco makes its root.
     */
    tie: (editors: Monaco.editor.ICodeEditor[]) => void;
    /** Take the node away and stop listening. */
    dispose: () => void;
};

/** What the page shares of the widgets, made once when Monaco loads. */
export type PageWidgets = {
    /** The services Monaco is started with (kit/load.ts hands them to its first editor). */
    services: Monaco.editor.IEditorOverrideServices;
    /** The widgets node of the editors that stand in `box`. */
    of: (box: HTMLElement) => Widgets;
    /** Give every node the theme type class again, after the page's theme is painted. */
    follow: () => void;
};

/** The id of the box a node or an element in a box draws widgets for. */
function boxOf(element: HTMLElement | undefined): string | undefined {
    if (element === undefined) return undefined;
    return (
        element.dataset.widgetsOf ??
        element.closest<HTMLElement>('[data-widgets-id]')?.dataset.widgetsId
    );
}

/**
 * The widgets of the page. `listed` answers every editor Monaco holds, and `Base` is Monaco's
 * context view service, which the page's own extends: Monaco hands its context views a container
 * that is an editor's own box (the code action list) or an editor's node (the right-click menu),
 * and the service draws every one of them in the page's node, so no context view is clipped by a
 * pane or blur or drawn under a float.
 *
 * Monaco takes the service overrides of the first editor made on the page and fixes its defaults at
 * its first call into a service, so `services` is handed to a detached editor that the loader makes
 * before any other call (kit/load.ts).
 */
export function pageWidgets(listed: Editors, Base: typeof ContextViewService): PageWidgets {
    let menus: HTMLElement | null = null;
    let view: PageContextView | null = null;

    /** The editor that owns the context view on screen, when it is drawn for an editor's box. */
    const keyed = (): Monaco.editor.ICodeEditor | null => {
        const open = view?.container;
        return listed().find((editor) => editor.getDomNode() === open) ?? null;
    };
    const host = (): HTMLElement => {
        if (!menus?.isConnected) {
            menus = widgetNode('menus');
            const page = menus;
            page.addEventListener('keydown', (press) => forward(press, keyed(), page));
        }
        return menus;
    };

    class PageContextView extends Base {
        /** What Monaco handed the context view on screen as its container. */
        container: HTMLElement | undefined;

        showContextView(
            delegate: object,
            container?: HTMLElement,
            shadowRoot?: boolean,
            whole?: boolean
        ): { close(): void } {
            this.container = container;
            const owner = boxOf(container);
            if (owner === undefined) host().removeAttribute('data-widgets-of');
            else host().dataset.widgetsOf = owner;
            return super.showContextView(delegate, container, shadowRoot, container ? true : whole);
        }

        hideContextView(data?: unknown): void {
            this.container = undefined;
            host().removeAttribute('data-widgets-of');
            super.hideContextView(data);
        }

        /** Close the context view when it was drawn for one of the containers. */
        closeFor(containers: HTMLElement[]): void {
            if (this.container !== undefined && containers.includes(this.container)) {
                this.hideContextView();
            }
        }
    }

    const area = (): { width: number; height: number } => ({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const layoutService = {
        _serviceBrand: undefined,
        get mainContainer() {
            return host();
        },
        get activeContainer() {
            return host();
        },
        get containers() {
            return [host()];
        },
        getContainer: () => host(),
        get mainContainerDimension() {
            return area();
        },
        get activeContainerDimension() {
            return area();
        },
        mainContainerOffset: { top: 0, quickPickTop: 0 },
        activeContainerOffset: { top: 0, quickPickTop: 0 },
        onDidLayoutMainContainer: NEVER,
        onDidLayoutActiveContainer: NEVER,
        onDidLayoutContainer: NEVER,
        onDidChangeActiveContainer: NEVER,
        onDidAddContainer: NEVER,
        whenContainerStylesLoaded: () => undefined,
        focus: () => undefined
    };
    view = new PageContextView(layoutService);

    function of(box: HTMLElement): Widgets {
        const node = widgetNode('widgets');
        const id = crypto.randomUUID();
        node.dataset.widgetsOf = id;
        box.dataset.widgetsId = id;
        let last: Monaco.editor.ICodeEditor | null = null;
        let ties: Monaco.IDisposable[] = [];
        let frame = 0;

        /** The editors that stand in the box: its own, a peek's and a diff editor's two. */
        const group = (): Monaco.editor.ICodeEditor[] =>
            listed().filter((editor) => {
                const root = editor.getDomNode();
                return root !== null && box.contains(root);
            });

        /** The editor a key typed in a widget of the node belongs to. */
        function owner(): Monaco.editor.ICodeEditor | null {
            const all = group();
            const remembered = last !== null && all.includes(last) ? last : null;
            return (
                all.find((editor) => editor.hasTextFocus()) ??
                remembered ??
                all.find((editor) => editor.hasWidgetFocus()) ??
                null
            );
        }

        /** The innermost editor of the box that takes the focus is the one a widget is for. */
        function focused(event: FocusEvent): void {
            const target = event.target;
            if (!(target instanceof Node)) return;
            const inside = group().filter((editor) => editor.getDomNode()?.contains(target));
            last = inside.at(-1) ?? last;
        }

        /**
         * Close the context view and the hover, suggest list and parameter hints of the editors of
         * the box, and place what stays open (the rename box, which holds typed text, a message,
         * the paste-as button) against the text again, since Monaco places a fixed widget only
         * when the editor draws. An editor with nothing shown is not drawn.
         */
        function close(): void {
            const editors = group();
            const boxes = editors.flatMap((editor) => editor.getDomNode() ?? []);
            view?.closeFor([node, ...boxes]);
            if (!shows(node)) return;
            for (const editor of editors) {
                for (const command of CLOSING) editor.trigger('oculus', command, null);
            }
            if (!shows(node)) return;
            for (const editor of editors) editor.render(true);
        }

        function scrolled(event: Event): void {
            const target = event.target;
            if (frame !== 0 || !(target instanceof Node) || !target.contains(box)) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                close();
            });
        }

        node.addEventListener('keydown', (press) => forward(press, owner(), node));
        document.addEventListener('focusin', focused, true);
        document.addEventListener('scroll', scrolled, { capture: true, passive: true });
        return {
            options: { fixedOverflowWidgets: true, overflowWidgetsDomNode: node },
            tie(editors) {
                ties = editors.map((editor) => editor.onDidChangeModel(followTheme));
                followTheme();
            },
            dispose() {
                for (const tie of ties) tie.dispose();
                document.removeEventListener('focusin', focused, true);
                document.removeEventListener('scroll', scrolled, { capture: true });
                if (frame !== 0) cancelAnimationFrame(frame);
                node.remove();
            }
        };
    }

    return { services: { layoutService, contextViewService: view }, of, follow: followTheme };
}
