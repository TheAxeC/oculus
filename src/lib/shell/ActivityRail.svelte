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
    import {
        applyArrangement,
        arranged,
        dock,
        dockedAt,
        openView,
        restoreArrangement
    } from '$lib/state/layout.svelte';
    import {
        crt,
        setCrt,
        setTheme,
        setUnicode,
        setWallpaper,
        theme,
        unicode,
        wallpaper
    } from '$lib/state/ui.svelte';
    import { lookup, t } from '$lib/state/text';
    import { themes as themeList, wallpaperOnTheme } from '$lib/state/appearance';
    import { views } from '$lib/views/registry';
    import type { Dock } from '$lib/state/layout';

    type Props = {
        /** The `nav_groups`-shaped list from the merged config; the page reads it and passes it on. */
        groups?: NavGroup[];
        /**
         * The `arrangements.sessions` node of the merged config, unread: state/layout.ts is what
         * turns it into a workbench, and the shell may not read the config itself.
         */
        arrangement?: unknown;
    };

    let { groups = [], arrangement = null }: Props = $props();

    /** The id of the control that swaps the workbench for the saved arrangement, and back. */
    const ARRANGE = 'arrange';

    const sections = $derived(arrange(views(), groups));

    const themes = $derived(
        themeList().map((entry) => ({
            id: entry.name,
            label: entry.label,
            active: entry.name === theme()
        }))
    );

    const docks = $derived([
        { id: 'right', label: t('ui.dock_right'), active: dockedAt() === 'right' },
        { id: 'bottom', label: t('ui.dock_bottom'), active: dockedAt() === 'bottom' },
        { id: 'hidden', label: t('ui.dock_hidden'), active: dockedAt() === 'hidden' },
        {
            id: ARRANGE,
            label: arranged() ? t('ui.arrange_restore') : t('ui.arrange_sessions'),
            active: arranged()
        }
    ]);

    const dockLabel = $derived(
        docks.find((item) => item.id !== ARRANGE && item.active)?.label ?? t('ui.dock_right')
    );

    /**
     * The one control that is not a dock: it puts the sessions arrangement on screen, keeping the
     * workbench that was there, and puts that workbench back the next time it is picked. A saved
     * arrangement of the viewer's own is therefore never lost by opening this one.
     */
    function pick(id: string): void {
        if (id !== ARRANGE) {
            dock(id as Dock);
            return;
        }
        if (arranged()) restoreArrangement();
        else applyArrangement(arrangement);
    }

    /** The wallpaper toggle is drawn only where there is one to switch: it is config and a theme. */
    const offersWallpaper = $derived(wallpaperOnTheme(theme()));
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
            class="toggle"
            title={t('ui.crt')}
            aria-pressed={crt()}
            onclick={() => setCrt(!crt())}
        >
            {t('ui.crt_on')}
        </button>
        {#if offersWallpaper}
            <button
                type="button"
                class="toggle"
                title={t('ui.wallpaper_title')}
                aria-pressed={wallpaper()}
                onclick={() => setWallpaper(!wallpaper())}
            >
                {t('ui.wallpaper')}
            </button>
        {/if}
        <button
            type="button"
            class="toggle"
            title={t('ui.unicode_title')}
            aria-pressed={unicode()}
            onclick={() => setUnicode(!unicode())}
        >
            {t('ui.unicode')}
        </button>
        <Menu
            label={dockLabel}
            glyph={lookup('ui.dock_glyph')}
            compact
            items={docks}
            onpick={(where) => pick(where)}
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

    /* The three switches at the foot: the overlay, the wallpaper and the glyphs. The rail is 52 px
       wide and the words come from the catalog, so a long one wraps rather than being cut. */
    .toggle {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
        font: inherit;
        font-size: var(--fs-3xs);
        line-height: 1.3;
        text-align: center;
        overflow-wrap: anywhere;
        padding: 4px 2px;
        cursor: pointer;
    }

    .view:hover,
    .toggle:hover {
        border-color: var(--accent);
    }

    .toggle[aria-pressed='true'] {
        color: var(--accent-txt, var(--accent));
        border-color: var(--accent);
    }

    .view:focus-visible,
    .toggle:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }

    /* Over a wallpaper the rail goes translucent with the panes, and takes the pane's colour while
       it does: the two are one surface to the eye once the picture shows through them. */
    :global(body.wall) .rail {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
        -webkit-backdrop-filter: blur(var(--wall-blur));
    }
</style>
