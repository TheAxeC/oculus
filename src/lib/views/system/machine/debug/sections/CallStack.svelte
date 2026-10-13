<script lang="ts">
    // Layer 3, partial of the Debug view. The Call Stack section: the frames of the paused program,
    // the top one first, each with its name and its `file:line`, the selected one marked. A press
    // selects the frame, which has the adapter answer the variables of that frame and opens its
    // file at its line. A right-click on a frame lists the entries apps contribute to
    // `debug/callstack/context` under `callStackItemType` `stackFrame`; a command takes the frame
    // as `{ session, threadId, frameId }`, the session being the host's `DebugSession` when an
    // app's debugger runs it. The list shows frames only, so no other item type is drawn.

    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { appMenu } from '$lib/views/shared/explorer/control/app-menu';

    type Props = {
        open: boolean;
        ontoggle: () => void;
    };

    let { open, ontoggle }: Props = $props();

    const { appShell, debug } = useState();
    const menu = appMenu(appShell);

    const payload = $derived(debug.payload());
    const frames = $derived(debug.paused() ? payload.frames : []);

    const rows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? frames.map((frame) => ({ id: `frame:${frame.id}`, parent: 'head' })) : [])
    ]);

    /** The entries apps contribute for a frame, read as the menu opens. */
    function entriesOf() {
        return menu.items('debug/callstack/context', {
            keys: { ...debug.contextKeys(), callStackItemType: 'stackFrame' }
        });
    }

    /** Run an entry on a frame. */
    function run(pick: string, frame: number, event: MouseEvent): void {
        menu.run(
            pick,
            [{ session: debug.sessionArg(), threadId: payload.thread, frameId: frame }],
            event
        );
    }

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
                        <ContextMenu
                            label={frame.name}
                            read={entriesOf}
                            onpick={(pick: string, event: MouseEvent) => run(pick, frame.id, event)}
                        >
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
                        </ContextMenu>
                    </li>
                {/each}
            </TreeSection>
        {/snippet}
    </TreeView>
</div>
