<script lang="ts">
    // Layer 3, shell. One pane of a tree: the tab strip over its instances, and the active
    // instance's view mounted below it. It reaches a view only through the registry, so no module
    // in the shell names a view, and a saved arrangement naming a view this release does not have
    // still renders: the tab says so and the body is empty, which is the rule state/layout.ts
    // states for a ViewId the registry does not hold.

    import Tabs, { type Tab } from '$lib/ui/Tabs.svelte';
    import { activateInstance, closeInstanceIn } from '$lib/state/layout.svelte';
    import { lookup, t } from '$lib/state/text';
    import { viewFor } from '$lib/views/registry';
    import type { Instance, Layout, Target } from '$lib/state/layout';

    type Props = {
        /** The node SplitView handed the snippet. Only a pane is drawn; a split never reaches here. */
        node: Layout;
        /** Which of the workbench's two trees this pane is in, so a close names the right one. */
        target: Target;
    };

    let { node, target }: Props = $props();

    const instances = $derived<Instance[]>(node.kind === 'pane' ? node.tabs : []);
    const active = $derived(node.kind === 'pane' ? node.active : '');
    const shown = $derived(instances.find((instance) => instance.id === active));
    const registration = $derived(shown === undefined ? undefined : viewFor(shown.view));

    /** A tab per instance: the registry's words and glyph, or the view's own id when it has none. */
    const tabs = $derived<Tab[]>(
        instances.map((instance) => {
            const found = viewFor(instance.view);
            if (found === undefined) {
                return { id: instance.id, label: t('ui.unknown_view', instance.view) };
            }
            return { id: instance.id, label: lookup(found.label), glyph: lookup(found.glyph) };
        })
    );
</script>

<div class="pane">
    <Tabs
        {tabs}
        {active}
        onselect={(id) => activateInstance(target, id)}
        onclose={(id) => closeInstanceIn(target, id)}
    />
    <div class="body">
        {#if shown !== undefined && registration !== undefined}
            {@const View = registration.component}
            <View instance={shown} />
        {/if}
    </div>
</div>

<style>
    .pane {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-sizing: border-box;
        overflow: hidden;
    }

    /* The only thing on the page that scrolls is what a view puts in here. */
    .body {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    .body > :global(*) {
        height: 100%;
    }
</style>
