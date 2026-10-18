<script lang="ts">
    // Layer 3, primitive. The tree an explorer's rows are drawn in, run by zag's tree-view machine
    // (@zag-js/tree-view through @zag-js/svelte): one stop of the browser's focus order, moved
    // along the rows by the machine's keys. Up and Down step a row, Home and End go to the ends,
    // Right opens a closed row and steps into an open one, Left closes an open row and steps out to
    // its parent, and a letter moves to the next row whose label starts with it. A character with
    // Meta or Ctrl held never reaches the machine, except Cmd+A (Ctrl+A off macOS), which is handed
    // to the caller's `onkey` as `select-all` and always prevented, so the page never selects its
    // text from a tree whether or not the caller selects rows. A lowercase `a`, which the machine's
    // key map reads as select-all and drops, is sent to it as a type-ahead letter
    // (ui/tree/tree-keys.ts's keyRoute).
    //
    // The caller hands the rows as the keyboard reads them and draws them with the `nav` this
    // passes to its snippet, so a caller's rows remain the one statement of what is drawn: the
    // machine's collection is built from them (ui/tree/tree-keys.ts), its expanded value is read
    // from each row's `open`, and a change it asks for is the caller's `ontoggle` for the row it
    // changes, never for a row held `fixed`. Left on a `fixed` row steps out to its parent rather
    // than asking to close it. The row at the stop is the caller's `current` when it gives one and
    // the row is drawn, else the last row the focus was on, else the first row. A focus move made
    // by a key of the tree is the caller's `onfocusrow`.
    //
    // The tree box carries the machine's tabindex of -1, so it is no stop of the focus order itself
    // and a press on its blank space keeps the focus inside it.
    //
    // A press on a row stays the row's own (ui/tree/TreeItem.svelte), so the machine's click
    // handlers are not spread and its selection is not drawn: selecting and opening are the
    // caller's. The machine's keys are taken only from a row element itself, never from a control
    // inside a row, and neither `*` (open every sibling) nor Space outside a type-ahead reaches it,
    // since neither is a key of this tree. A list that draws only the rows in view registers here
    // through `nav.list`, and a key moving to one of its rows not drawn hands the move to it. The
    // list keeps drawn the rows `nav.kept` names, the row at the stop and the row the focus is in,
    // so Tab always finds the stop and a scroll never takes the focus out of the page. Each row's
    // index path in the collection is read from a map built once per collection, and the labels the
    // type-ahead reads are kept to the rows the caller hands. A caller asks for a row to be brought
    // into view and focused with `reveal`, answered once its row is among the rows.

    import { untrack, type Snippet } from 'svelte';
    import * as tree from '@zag-js/tree-view';
    import { normalizeProps, useMachine } from '@zag-js/svelte';
    import {
        expandedOf,
        focusOf,
        indexPaths,
        boundAction,
        keyRoute,
        pressOf,
        toggledBy,
        treeNodes,
        type Chord,
        type KeyRow,
        type RowList,
        type RowNode,
        type TreeNav
    } from './tree-keys.ts';

    type Props = {
        /** The tree's accessible name, already translated. */
        label: string;
        rows: KeyRow[];
        /** The row the caller keeps at the stop; omitted, the tree holds its own. */
        current?: string;
        /** The focus moved to a row by a key. */
        onfocusrow?: (id: string) => void;
        /** A key asked for a row to open or close. */
        ontoggle?: (id: string) => void;
        /**
         * The caller's own keys: a press matching a chord is handed to `onkey` with the chord's
         * action and the row it was pressed on, and neither the machine nor the row acts on it.
         * `onkey` answers false for a press it leaves to the browser, which is then not prevented.
         */
        keymap?: readonly Chord[];
        onkey?: (action: string, id: string, event: KeyboardEvent) => boolean | undefined;
        /**
         * A row to bring into view and focus once the rows hold it, as a paste shows the item it
         * placed: each new ask (`seq`) is answered once.
         */
        reveal?: { id: string; seq: number } | null;
        children: Snippet<[TreeNav]>;
    };

    let {
        label,
        rows,
        current,
        onfocusrow,
        ontoggle,
        keymap,
        onkey,
        reveal = null,
        children
    }: Props = $props();

    const uid = $props.id();

    /** The last row the focus was on, for a tree whose caller keeps no stop of its own. */
    let held = $state('');
    /** The row the focus is in (on the row or one of its controls), the empty string for none. */
    let inside = $state('');
    /** Whether the focus is moving by a key of the tree, which is when the caller is told. */
    let keyed = false;
    /** The labels of the rows drawn, which the type-ahead reads. */
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- written while a row is drawn and read only by a key, so nothing is drawn from it
    const labels = new Map<string, string>();
    /** The lists drawing only the rows in view, which hold rows the tree may not have drawn. */
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- registered by the lists and read only by a key, so nothing is drawn from it
    const lists = new Set<RowList>();

    const byId = $derived(new Map(rows.map((row) => [row.id, row])));
    const expanded = $derived(expandedOf(rows));
    const root = $derived(treeNodes(rows));
    const paths = $derived(indexPaths(root));
    const collection = $derived(
        tree.collection<RowNode>({
            rootNode: root,
            nodeToString: (node) => labelOf(node.value)
        })
    );
    /** The last reveal asked for that a list answered. */
    let revealed = -1;
    // A reveal waits for its row to be among the rows, and is handed to the list that draws it.
    $effect(() => {
        const ask = reveal;
        if (ask === null || ask.seq === revealed || !byId.has(ask.id)) return;
        untrack(() => {
            for (const list of lists) {
                if (!list.reveal(ask.id)) continue;
                revealed = ask.seq;
                return;
            }
        });
    });

    /** The row holding the stop: the machine's focused row, else its first row. */
    const stop = $derived(focusOf(rows, current ?? held) ?? root.children.at(0)?.value ?? '');

    /** A label is kept only while its row is among the rows. */
    $effect.pre(() => {
        const ids = new Set(rows.map((row) => row.id));
        for (const id of [...labels.keys()]) {
            if (!ids.has(id)) labels.delete(id);
        }
    });

    /** A row's label for the type-ahead: the one drawn, else its list's, else its id. */
    function labelOf(id: string): string {
        const drawn = labels.get(id);
        if (drawn !== undefined) return drawn;
        for (const list of lists) {
            const listed = list.label(id);
            if (listed !== undefined) return listed;
        }
        return id;
    }

    const service = useMachine(tree.machine, () => ({
        id: uid,
        collection,
        expandedValue: expanded,
        focusedValue: focusOf(rows, current ?? held),
        translations: { treeLabel: label },
        onExpandedChange: (details: tree.ExpandedChangeDetails<RowNode>) => {
            for (const id of toggledBy(rows, expanded, details.expandedValue)) ontoggle?.(id);
        },
        onFocusChange: (details: tree.FocusChangeDetails<RowNode>) => {
            const id = details.focusedValue;
            if (id === null) return;
            held = id;
            if (keyed) onfocusrow?.(id);
        },
        scrollToIndexFn: (details: tree.ScrollToIndexDetails<RowNode>) => {
            for (const list of lists) {
                if (list.reveal(details.node.value)) return;
            }
        }
    }));

    const api = $derived(tree.connect(service, normalizeProps));
    /** The machine's own attributes of the tree box, and its key handler. */
    const treeProps = $derived(api.getTreeProps() as Record<string, unknown>);
    const boxProps: Record<string, unknown> = $derived({
        id: treeProps.id,
        'data-scope': treeProps['data-scope'],
        'data-part': treeProps['data-part'],
        tabindex: treeProps.tabindex
    });

    /**
     * What one row spreads from the machine. A row that opens is the machine's branch control,
     * which Right and Left open and close; any other row is its item. The role is a treeitem either
     * way, with the level and the open state the machine reads from the rows.
     */
    function rowProps(id: string, text: string): Record<string, unknown> {
        labels.set(id, text);
        const indexPath = paths.get(id);
        const node = indexPath === undefined ? undefined : collection.at(indexPath);
        if (indexPath === undefined || node === undefined) return {};
        const at = { node, indexPath };
        const state = api.getNodeState(at);
        const branch = byId.get(id)?.open !== undefined;
        const own = (branch ? api.getBranchControlProps(at) : api.getItemProps(at)) as Record<
            string,
            unknown
        >;
        return {
            id: own.id,
            'data-scope': own['data-scope'],
            'data-part': own['data-part'],
            'data-value': own['data-value'],
            'data-path': own['data-path'],
            role: 'treeitem',
            'aria-level': state.depth,
            'aria-expanded': branch ? state.expanded : undefined,
            tabindex: own.tabindex,
            onfocus: (event: FocusEvent) => {
                if (event.target === event.currentTarget) service.send({ type: 'NODE.FOCUS', id });
            }
        };
    }

    const nav: TreeNav = {
        row: rowProps,
        list: (list: RowList) => {
            lists.add(list);
            return () => lists.delete(list);
        },
        focus: (id: string) => api.focus(id),
        kept: () => [...new Set([stop, inside])].filter((id) => id !== ''),
        // Read when a row asks, so a keymap that changes after the first draw is the one asked.
        get bound() {
            const map = keymap;
            return map === undefined
                ? undefined
                : (event: KeyboardEvent) => boundAction(map, pressOf(event)) !== null;
        }
    };

    /** The keys of a row element, handed to the machine as the tree's own. */
    function pressedKey(event: KeyboardEvent): void {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const part = target.dataset.part;
        if (part !== 'item' && part !== 'branch-control') return;
        const row = byId.get(target.dataset.value ?? '');
        if (row === undefined) return;
        const held = pressOf(event);
        const route = keyRoute(event.key, held, service.computed('isTypingAhead'), keymap);
        if (route === 'withhold') return;
        if (route === 'select-all') {
            event.preventDefault();
            onkey?.('select-all', row.id, event);
            return;
        }
        if (route === 'bound') {
            const action = boundAction(keymap ?? [], pressOf(event));
            if (action === null) return;
            if (onkey?.(action, row.id, event) !== false) event.preventDefault();
            return;
        }
        keyed = true;
        if (route === 'type-ahead') {
            event.preventDefault();
            service.send({ type: 'TREE.TYPEAHEAD', key: event.key, id: row.id });
            return;
        }
        if (event.key === 'ArrowLeft' && row.fixed === true && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            service.send({ type: 'NODE.ARROW_LEFT', id: row.id });
            return;
        }
        (treeProps.onkeydown as ((event: KeyboardEvent) => void) | undefined)?.(event);
    }

    /** The row the focus went into, which a list keeps drawn while the focus is in it. */
    function entered(event: FocusEvent): void {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const row = target.closest<HTMLElement>('[data-part="item"], [data-part="branch-control"]');
        const id = row?.dataset.value ?? '';
        inside = byId.has(id) ? id : '';
    }

    /** The focus leaving the tree, or a pointer pressing in it, ends a run of key moves. */
    function left(event: FocusEvent): void {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget instanceof Node) {
            if (event.currentTarget.contains(next)) return;
        }
        keyed = false;
        inside = '';
    }
</script>

<div
    class="tree"
    {...boxProps}
    role="tree"
    aria-label={label}
    onkeydown={pressedKey}
    onfocusin={entered}
    onfocusout={left}
    onpointerdown={() => (keyed = false)}
>
    {@render children(nav)}
</div>

<style>
    .tree {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
</style>
