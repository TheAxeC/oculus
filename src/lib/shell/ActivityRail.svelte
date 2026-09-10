<script module lang="ts">
    import type { Registration } from '$lib/views/registry';

    /** One group of the rail: a heading and the view ids it claims, as `nav_groups` in the config. */
    export type NavGroup = { label: string; keys: string[] };

    /** The rail as it is drawn: a group's registrations, or the ungrouped ones under no heading. */
    type Section = { label: string | null; items: Registration[] };

    /**
     * The registrations under the groups that name them, in the groups' order, and everything no
     * group names after them. A group no registration matches is not drawn: the groups are the
     * cockpit's tab keys and most of them name views that do not exist yet.
     */
    export function arrange(registrations: Registration[], groups: NavGroup[]): Section[] {
        const sections: Section[] = [];
        const taken = new Set<string>();
        for (const group of groups) {
            const items = registrations.filter((view) => group.keys.includes(view.id));
            for (const item of items) taken.add(item.id);
            if (items.length > 0) sections.push({ label: group.label, items });
        }
        const rest = registrations.filter((view) => !taken.has(view.id));
        if (rest.length > 0) sections.push({ label: null, items: rest });
        return sections;
    }
</script>

<script lang="ts">
    // Layer 3, shell. The strip down the left: one button per registered view, then the appearance
    // and the panel's dock at the foot. A click opens or activates the view in the main area and a
    // shift-click does it in the panel, which is the whole of what the rail decides; where a view
    // then lands inside that tree is the store's.

    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu from '$lib/ui/Menu.svelte';
    import { dock, dockedAt, openView } from '$lib/state/layout.svelte';
    import { crt, setCrt, setTheme, theme } from '$lib/state/ui.svelte';
    import { lookup, t, themeLabel, themeOrder } from '$lib/state/text';
    import { views } from '$lib/views/registry';
    import type { Dock } from '$lib/state/layout';

    type Props = {
        /** The `nav_groups`-shaped list from the merged config; the page reads it and passes it on. */
        groups?: NavGroup[];
    };

    let { groups = [] }: Props = $props();

    const sections = $derived(arrange(views(), groups));

    const themes = $derived(
        themeOrder().map((name) => ({
            id: name,
            label: themeLabel(name),
            active: name === theme()
        }))
    );

    const docks = $derived([
        { id: 'right', label: t('ui.dock_right'), active: dockedAt() === 'right' },
        { id: 'bottom', label: t('ui.dock_bottom'), active: dockedAt() === 'bottom' },
        { id: 'hidden', label: t('ui.dock_hidden'), active: dockedAt() === 'hidden' }
    ]);

    const dockLabel = $derived(docks.find((item) => item.active)?.label ?? t('ui.dock_right'));
</script>

<nav class="rail" aria-label={t('ui.rail')}>
    <div class="views">
        <!-- Keyed by position: two config groups may carry the same label, and a duplicate key
             would be an error rather than a repeated heading. -->
        {#each sections as section, index (index)}
            {#if section.label !== null}
                <p class="group">{section.label}</p>
            {/if}
            {#each section.items as view (view.id)}
                <button
                    type="button"
                    class="view"
                    data-view={view.id}
                    title={lookup(view.label)}
                    aria-label={lookup(view.label)}
                    onclick={(event) => openView(view.id, event.shiftKey ? 'panel' : 'main')}
                >
                    <Glyph name={lookup(view.glyph)} />
                </button>
            {/each}
        {/each}
    </div>

    <div class="controls">
        <Menu
            label={t('ui.theme')}
            glyph={lookup('ui.theme_glyph')}
            compact
            items={themes}
            onpick={(name) => setTheme(name)}
        />
        <button
            type="button"
            class="crt"
            title={t('ui.crt')}
            aria-pressed={crt()}
            onclick={() => setCrt(!crt())}
        >
            {lookup('js.theme.crt_on')}
        </button>
        <Menu
            label={dockLabel}
            glyph={lookup('ui.dock_glyph')}
            compact
            items={docks}
            onpick={(where) => dock(where as Dock)}
        />
    </div>
</nav>

<style>
    .rail {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
        flex: 0 0 auto;
        width: 52px;
        padding: 6px 4px;
        box-sizing: border-box;
        background: var(--bg);
        border-right: 1px solid var(--line);
        /* The two menus at the foot open beside the rail; hiding overflow here would clip them to
           the rail's 52 px, which is what happened on first sight. The view list scrolls on its own. */
        overflow: visible;
    }

    .views,
    .controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
    }

    .views {
        overflow-y: auto;
    }

    .group {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-3xs);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .view {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 34px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-xl);
        cursor: pointer;
    }

    .crt {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-xs);
        padding: 4px 2px;
        cursor: pointer;
    }

    .view:hover,
    .crt:hover {
        border-color: var(--accent);
    }

    .crt[aria-pressed='true'] {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent);
    }

    .view:focus-visible,
    .crt:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
