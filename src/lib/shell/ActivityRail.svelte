<script module lang="ts">
    import type { Registration } from '$lib/views/registry';

    /**
     * One group of the rail: a heading and the view ids it claims, as `nav_groups` in the config.
     * `glyph` is a name in config/glyphs.yml and is drawn only where the group is one button with a
     * list; a group that has none and is drawn that way carries its first view's glyph.
     */
    export type NavGroup = { label: string; keys: string[]; glyph?: string };

    /**
     * One entry of the rail's Docs section, as `bookmarks` in the config: a local file under one of
     * the roots of sources.yml, which the `document` view opens as a tab of its own.
     */
    export type Bookmark = { label: string; root: string; path: string };

    /**
     * What openView is handed for a bookmark. The `id` is what makes two bookmarks two tabs: a state
     * carrying one names which instance is wanted, so a second click on the same bookmark activates
     * the tab it already has and a click on the other one opens a second tab beside it.
     */
    export function documentState(mark: Bookmark): {
        id: string;
        root: string;
        path: string;
        label: string;
    } {
        return {
            id: `${mark.root}/${mark.path}`,
            root: mark.root,
            path: mark.path,
            label: mark.label
        };
    }

    /** The rail as it is drawn: a group's registrations, or the ungrouped ones under no heading. */
    type Section = { label: string | null; items: Registration[]; glyph?: string };

    /**
     * How many views a group may hold and still be drawn as a heading over one button per view. A
     * larger group is drawn as one button with a list beside it, which is DESIGN.md's decision of
     * 2026-09-10: the rail does not grow an icon per view. The ungrouped trailing section has no
     * heading to name such a button and stays as buttons however many it holds.
     */
    export const GROUP_MAX = 4;

    /**
     * The registrations under the groups that name them, in the groups' order, and everything no
     * group names after them. A group no registration matches is not drawn: the groups are the
     * cockpit's tab keys and most of them name views that do not exist yet.
     */
    export function arrange(registrations: Registration[], groups: NavGroup[]): Section[] {
        const sections: Section[] = [];
        const taken = new Set<string>();
        for (const group of groups) {
            // In the group's own order, which is what the config promises; a key naming no
            // registration, or one already drawn, contributes nothing.
            const items: Registration[] = [];
            for (const key of group.keys) {
                const found = registrations.find((view) => view.id === key);
                if (found === undefined || taken.has(found.id)) continue;
                taken.add(found.id);
                items.push(found);
            }
            if (items.length === 0) continue;
            const section: Section = { label: group.label, items };
            if (group.glyph !== undefined) section.glyph = group.glyph;
            sections.push(section);
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
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Tooltip from '$lib/ui/Tooltip.svelte';
    import { dock, dockedAt, openView } from '$lib/state/layout.svelte';
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
        /** The `bookmarks` list of the merged config; the page reads it and passes it on. */
        bookmarks?: Bookmark[];
    };

    let { groups = [], bookmarks = [] }: Props = $props();

    /* A view registered as not listed (the editor, a project, a document) is opened from a card or a
       bookmark and has nothing to show when opened bare, so the rail draws no button for it. */
    const sections = $derived(
        arrange(
            views().filter((view) => view.listed !== false),
            groups
        )
    );

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
        { id: 'hidden', label: t('ui.dock_hidden'), active: dockedAt() === 'hidden' }
    ]);

    const dockLabel = $derived(docks.find((item) => item.active)?.label ?? t('ui.dock_right'));

    /** Where the panel goes. The menu holds the three docks and nothing else. */
    function pick(id: string): void {
        dock(id as Dock);
    }

    /** The views of one group as the choices of its list, each with its own glyph and words. */
    function groupItems(section: Section): MenuItem[] {
        return section.items.map((view) => ({
            id: view.id,
            label: lookup(view.label),
            glyph: lookup(view.glyph)
        }));
    }

    /** The glyph a group's button carries: the group's own, or its first view's when it has none. */
    function groupGlyph(section: Section): string {
        return section.glyph ?? lookup(section.items[0].glyph);
    }

    /** The wallpaper toggle is drawn only where there is one to switch: it is config and a theme. */
    const offersWallpaper = $derived(wallpaperOnTheme(theme()));
</script>

<nav class="rail" aria-label={t('ui.rail')}>
    <div class="views">
        <!-- Keyed by position: two config groups may carry the same label, and a duplicate key
             would be an error rather than a repeated heading. -->
        {#each sections as section, index (index)}
            {@const label = section.label}
            <!-- A large group is one button with a list beside it, so the rail does not grow an
                 icon per view; a small one stays a heading over its buttons. The list opens where
                 the theme menu at the foot does, since `compact` is what fixes it beside the rail. -->
            {#if label !== null && section.items.length > GROUP_MAX}
                <div class="flyout" data-group={label}>
                    <Menu
                        {label}
                        glyph={groupGlyph(section)}
                        compact
                        items={groupItems(section)}
                        onpick={(id, event) => openView(id, event.shiftKey ? 'panel' : 'main')}
                    />
                </div>
            {:else}
                {#if label !== null}
                    <p class="group">{label}</p>
                {/if}
                {#each section.items as view (view.id)}
                    <Tooltip text={lookup(view.label)} placement="beside">
                        <button
                            type="button"
                            class="view"
                            data-view={view.id}
                            aria-label={lookup(view.label)}
                            onclick={(event) =>
                                openView(view.id, event.shiftKey ? 'panel' : 'main')}
                        >
                            <Glyph name={lookup(view.glyph)} />
                        </button>
                    </Tooltip>
                {/each}
            {/if}
        {/each}

        <!-- The documents of config/layout.yml. They are not registrations, so they sit under a
             heading of their own rather than in a section arrange() built. -->
        {#if bookmarks.length > 0}
            <p class="group">{t('ui.docs')}</p>
            {#each bookmarks as mark (`${mark.root}/${mark.path}`)}
                <Tooltip text={mark.label} placement="beside">
                    <button
                        type="button"
                        class="view"
                        data-bookmark={`${mark.root}/${mark.path}`}
                        aria-label={mark.label}
                        onclick={() => openView('document', 'main', documentState(mark))}
                    >
                        <Glyph name={t('views.document_glyph')} />
                    </button>
                </Tooltip>
            {/each}
        {/if}
    </div>

    <div class="controls">
        <Menu
            label={t('ui.theme')}
            glyph={lookup('ui.theme_glyph')}
            compact
            items={themes}
            onpick={(name) => setTheme(name)}
        />
        <Tooltip text={t('ui.crt')} placement="beside">
            <button
                type="button"
                class="toggle"
                aria-pressed={crt()}
                onclick={() => setCrt(!crt())}
            >
                {t('ui.crt_on')}
            </button>
        </Tooltip>
        {#if offersWallpaper}
            <Tooltip text={t('ui.wallpaper_title')} placement="beside">
                <button
                    type="button"
                    class="toggle"
                    aria-pressed={wallpaper()}
                    onclick={() => setWallpaper(!wallpaper())}
                >
                    {t('ui.wallpaper')}
                </button>
            </Tooltip>
        {/if}
        <Tooltip text={t('ui.unicode_title')} placement="beside">
            <button
                type="button"
                class="toggle"
                aria-pressed={unicode()}
                onclick={() => setUnicode(!unicode())}
            >
                {t('ui.unicode')}
            </button>
        </Tooltip>
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
        width: var(--rail-width);
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

    /* The list scrolls on a short window, with no scrollbar drawn: a bar in a 52 px strip covers the
       glyphs it sits beside, and the wheel and the trackpad reach every entry without it. */
    .views {
        overflow-y: auto;
        scrollbar-width: none;
    }

    .views::-webkit-scrollbar {
        display: none;
    }

    /* On a short window the view list is what gives way, and it scrolls. Without this the foot
       shrinks with it, its buttons pile over each other and the last ones fall below the window,
       which is how the theme menu and the panel's dock came to be unreachable. */
    .controls {
        flex-shrink: 0;
    }

    /* The group's button is a Menu, which is a flex row of its own; this gives it the top margin a
       heading would have had, so a flyout sits where the heading it replaces sat. */
    .flyout {
        margin-top: 6px;
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
