<script lang="ts">
    // Layer 3, partial of tree/Tree.svelte. The row where a name is typed, a new file's or folder's
    // or a row's new name, drawn with the row's icon and an input in place of its name. The input
    // opens with the row's name selected, a file's stem alone on a rename, and says what is wrong
    // with the text as it is typed (nameMessage in row-ops.ts), after the first key. A title is any
    // line of text, so the input of a new presentation's title checks no file name and accepts the
    // text it was opened with unchanged.
    //
    // Enter and leaving the input accept a valid name, and Escape cancels it. An empty name and an
    // unchanged name cancel. A name that is refused is kept by Enter, with its message under it,
    // and is cancelled by leaving the input. The row's request is the caller's, handed the accepted
    // text.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import NameField from '$lib/ui/tree/row/NameField.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { rowKey, type TreeRow } from '$lib/state/sources/fs';
    import { stemLength } from '$lib/state/sources/explorer/ops.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { nameMessage } from './menu/row-ops';

    type Props = {
        /** The row being named, which `treeRows()` marked `editing`; a new item's name is empty. */
        row: TreeRow;
        /** The tree's keys, which the row takes its place among. */
        nav: TreeNav;
        /** Whether the folder already holds a name, as the folder compares names. */
        taken: (name: string) => boolean;
        onaccept: (name: string) => void;
        oncancel: () => void;
    };

    let { row, nav, taken, onaccept, oncancel }: Props = $props();

    /** The name the row has, and the empty string for a new item. */
    const value = $derived(row.name);
    /** How many characters from the start open selected: a file's stem on a rename, else all. */
    const select = $derived(
        row.editing === 'rename' && row.kind === 'file' ? stemLength(row.name) : undefined
    );
    /** Whether the text is the title of a new presentation and not a file name. */
    const title = $derived(row.editing === 'title');

    /** The text as it stands, and whether a key has been typed in the box. */
    let text = $derived(value);
    let typed = $state(false);

    /**
     * Whether the row has been answered, so the focus leaving a row that is going does not answer
     * it twice.
     */
    let settled = false;

    const message = $derived(typed && !title ? nameMessage(text, taken, t) : null);

    function finish(now: string, enter: boolean): void {
        if (settled) return;
        if (now.trim() === '' || (now === value && !title)) {
            settled = true;
            oncancel();
            return;
        }
        if (!title && nameMessage(now, taken, t)?.error === true) {
            if (enter) {
                typed = true;
                return;
            }
            settled = true;
            oncancel();
            return;
        }
        settled = true;
        onaccept(now);
    }
</script>

<TreeItem
    label=""
    name={t('files.name_label')}
    id={rowKey(row)}
    {nav}
    level={row.depth + 1}
    glyph={row.kind === 'dir' ? t('files.folder_glyph') : undefined}
    file={row.kind === 'file' && row.name !== '' ? row.name : undefined}
    folder={row.kind === 'dir' && row.name !== '' ? row.name : undefined}
    depth={row.depth}
    selected
>
    {#snippet field()}
        <NameField
            {value}
            label={t('files.name_label')}
            {select}
            {message}
            oninput={(next: string) => {
                text = next;
                typed = true;
            }}
            onsubmit={(now: string) => finish(now, true)}
            onleave={(now: string) => finish(now, false)}
            oncancel={() => {
                settled = true;
                oncancel();
            }}
        />
    {/snippet}
</TreeItem>
