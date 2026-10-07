<script lang="ts">
    // Layer 3, partial of the Debug view. The Breakpoints section: every line breakpoint by file
    // and line, each with an enable box and a remove, and the function breakpoints by name. A
    // breakpoint the adapter does not hold yet is drawn as a warning and its tooltip is the
    // adapter's own message; a breakpoint turned off is muted. A press on a line breakpoint opens
    // its file at its line. The head adds a function breakpoint (typed in a row of its own),
    // enables, disables and removes every breakpoint. The list is flat: there is no tree by folder.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import NameField from '$lib/ui/tree/NameField.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import type { BreakpointRow } from '$lib/state/system/machine/debug/debug-lists';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { debug } = useState();

    const lines = $derived(debug.rows());
    const functions = $derived(debug.functionRows());
    const count = $derived(lines.length + functions.length);

    /** Whether the name of a new function breakpoint is being typed. */
    let adding = $state(false);

    const keyOf = (row: BreakpointRow): string => `line:${row.path}:${row.line}`;

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open
            ? [
                  ...lines.map((row) => ({ id: keyOf(row), parent: 'head' })),
                  ...functions.map((row) => ({ id: `function:${row.name}`, parent: 'head' })),
                  ...(adding ? [{ id: 'function:new', parent: 'head' }] : [])
              ]
            : [])
    ]);

    function add(): void {
        if (!open) ontoggle();
        adding = true;
    }

    function keep(name: string): void {
        if (!adding) return;
        adding = false;
        debug.addFunction(name);
    }

    /** The folder a file sits in, as its last part, and the file's name. */
    function partsOf(path: string): { name: string; folder: string } {
        const parts = path.split('/');
        return { name: parts.at(-1) ?? path, folder: parts.at(-2) ?? '' };
    }

    function titleOf(row: BreakpointRow): string {
        if (row.state === 'unverified' && row.message !== '') return row.message;
        return `${row.path}:${row.line}`;
    }
</script>

<div class="breakpoints" data-debug-breakpoints>
    <TreeView label={t('debug.breakpoints')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('debug.breakpoints')}
                id="head"
                {nav}
                {count}
                {open}
                {ontoggle}
                showActions
            >
                {#snippet actions(reach: number)}
                    <ToolButton
                        label={t('debug.function_add')}
                        glyph="add"
                        compact
                        tabindex={reach}
                        onclick={add}
                    />
                    <ToolButton
                        label={t('debug.enable_all')}
                        glyph="checkbox_on"
                        compact
                        tabindex={reach}
                        disabled={lines.length === 0}
                        onclick={() => debug.setAll(true)}
                    />
                    <ToolButton
                        label={t('debug.disable_all')}
                        glyph="checkbox_off"
                        compact
                        tabindex={reach}
                        disabled={lines.length === 0}
                        onclick={() => debug.setAll(false)}
                    />
                    <ToolButton
                        label={t('debug.remove_all')}
                        glyph="clear_all"
                        compact
                        tabindex={reach}
                        disabled={count === 0}
                        onclick={() => {
                            debug.removeAll();
                            for (const one of functions) debug.removeFunction(one.name);
                        }}
                    />
                {/snippet}
                {#if count === 0 && !adding}
                    <li role="none">
                        <TreeItem label={t('debug.no_breakpoints')} tone="muted" />
                    </li>
                {/if}
                {#each lines as row (keyOf(row))}
                    {@const place = partsOf(row.path)}
                    <li role="none">
                        <TreeItem
                            label={`${place.name}:${row.line}`}
                            id={keyOf(row)}
                            {nav}
                            level={2}
                            tone={row.state === 'unverified'
                                ? 'warn'
                                : row.state === 'disabled'
                                  ? 'muted'
                                  : undefined}
                            title={titleOf(row)}
                            showActions
                            onclick={() => debug.openAt(row.path, row.line)}
                        >
                            {#snippet detail()}{place.folder}{/snippet}
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('debug.enable_box')}
                                    glyph={row.enabled ? 'checkbox_on' : 'checkbox_off'}
                                    compact
                                    pressed={row.enabled}
                                    tabindex={reach}
                                    onclick={() => debug.enable(row.path, row.line, !row.enabled)}
                                />
                                <ToolButton
                                    label={t('debug.remove')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    onclick={() => debug.remove(row.path, row.line)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
                {#each functions as row (row.name)}
                    <li role="none">
                        <TreeItem
                            label={row.name}
                            id={`function:${row.name}`}
                            {nav}
                            level={2}
                            glyph="debug_breakpoint"
                            tone={row.state === 'unverified' ? 'warn' : undefined}
                            title={row.message === '' ? row.name : row.message}
                            showActions
                        >
                            {#snippet actions(reach: number)}
                                <ToolButton
                                    label={t('debug.remove')}
                                    glyph="trash"
                                    compact
                                    tabindex={reach}
                                    onclick={() => debug.removeFunction(row.name)}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/each}
                {#if adding}
                    <li role="none">
                        <TreeItem
                            label=""
                            name={t('debug.function_field')}
                            id="function:new"
                            {nav}
                            level={2}
                            selected
                        >
                            {#snippet field()}
                                <NameField
                                    value=""
                                    label={t('debug.function_field')}
                                    oninput={() => undefined}
                                    onsubmit={keep}
                                    oncancel={() => (adding = false)}
                                    onleave={keep}
                                />
                            {/snippet}
                        </TreeItem>
                    </li>
                {/if}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
