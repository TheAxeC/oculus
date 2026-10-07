<script lang="ts">
    // Layer 3, partial of the Debug view. The Call Stack section: the frames of the paused program,
    // the top one first, each with its name and its `file:line`, the selected one marked. A press
    // selects the frame, which has the adapter answer the variables of that frame and opens its
    // file at its line.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { debug } = useState();

    const payload = $derived(debug.payload());
    const frames = $derived(debug.paused() ? payload.frames : []);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? frames.map((frame) => ({ id: `frame:${frame.id}`, parent: 'head' })) : [])
    ]);

    /** The file of a frame as the row says it: the last two parts of its path and the line. */
    function placeOf(path: string, line: number): string {
        return `${path.split('/').slice(-2).join('/')}:${line}`;
    }
</script>

<div class="stack" data-debug-stack>
    <TreeView label={t('debug.call_stack')} {rows} ontoggle={() => ontoggle()}>
        {#snippet children(nav: TreeNav)}
            <TreeSection
                label={t('debug.call_stack')}
                id="head"
                {nav}
                count={frames.length}
                {open}
                {ontoggle}
            >
                {#if frames.length === 0}
                    <li role="none">
                        <TreeItem label={t('debug.nothing_paused')} tone="muted" />
                    </li>
                {/if}
                {#each frames as frame (frame.id)}
                    <li role="none">
                        <TreeItem
                            label={frame.name}
                            id={`frame:${frame.id}`}
                            {nav}
                            level={2}
                            current={frame.id === payload.frame}
                            title={`${frame.path}:${frame.line}`}
                            onclick={() => void debug.selectFrame(frame.id)}
                        >
                            {#snippet detail()}{placeOf(frame.path, frame.line)}{/snippet}
                        </TreeItem>
                    </li>
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
