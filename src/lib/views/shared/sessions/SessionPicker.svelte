<script lang="ts">
    // Layer 3, shared view. The one control a session view picks its session through, on the
    // view's bar: a menu of every session grouped by workspace, and beside it the pin that keeps
    // the view on the session it shows. A view that follows the selection picks by selecting, so
    // the other views that follow it move too; a view pinned to a session is pinned to the one
    // picked instead, and the rest are left where they are.
    //
    // A view that follows the selection keeps the session the selection shows it in its own state
    // (`keepShown`), which it reads while the selection names none, so a reload, which starts with
    // no selection, shows the view's session again (state/workbench/selection.svelte.ts).

    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { MenuGroup } from '$lib/ui/menu/menu-items';
    import { keepShown, pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The view instance that picks. */
        instance: string;
    };

    let { instance }: Props = $props();

    const {
        layout: { instanceLayoutState, pinInstance, restateInstance, unpinInstance },
        selection: { select, selected },
        selectors: { sessionFor, sessionsByWorkspace }
    } = useState();

    const record = $derived(sessionFor(instance));
    const pinned = $derived(pinnedSession(instanceLayoutState(instance)));

    keepShown({
        state: () => instanceLayoutState(instance),
        selected,
        shown: () => record?.id ?? null,
        write: (state) => restateInstance(instance, state)
    });

    const groups = $derived(
        sessionsByWorkspace(false).map((workspace): MenuGroup => ({
            id: workspace.key,
            heading: workspace.name === '' ? t('sessions.no_workspace') : workspace.name,
            items: workspace.areas
                .flatMap((area) => area.sessions)
                .map((row) => ({
                    id: row.id,
                    label: row.title === '' ? row.id : row.title,
                    active: row.id === record?.id
                }))
        }))
    );

    function picked(id: string): void {
        const row = sessionsByWorkspace(true)
            .flatMap((workspace) => workspace.areas.flatMap((area) => area.sessions))
            .find((one) => one.id === id);
        if (row === undefined) return;
        if (pinned !== null) pinInstance(instance, row.id, row.title);
        else select(row.id);
    }

    /** Pin the view to what it shows, or return it to following the selection. */
    function togglePin(): void {
        if (pinned !== null) {
            unpinInstance(instance);
            return;
        }
        if (record !== null) pinInstance(instance, record.id, record.title);
    }
</script>

<span class="picker" data-session-picker>
    <Menu
        label={record === null ? t('sessions.pick_session') : record.title}
        title={t('sessions.pick_session_tip')}
        glyph={t('sessions.rail_glyph')}
        placement="down"
        items={[]}
        {groups}
        onpick={picked}
    />
</span>
{#if record !== null || pinned !== null}
    <ToolButton
        label={pinned === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
        title={pinned === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
        pressed={pinned !== null}
        onclick={togglePin}
    />
{/if}

<style>
    .picker {
        display: inline-flex;
        min-width: 0;
        max-width: 60%;
    }
</style>
