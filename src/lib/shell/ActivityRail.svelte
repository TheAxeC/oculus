<script module lang="ts">
    import type { Registration } from '$lib/views/registry';
    import type { RailOrder } from './keys';

    /** One configured rail group. View registrations name its stable id and their own order. */
    export type NavGroup = { id: string; label: string; glyph?: string; chord?: string };

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
    type Section = {
        label: string | null;
        items: Registration[];
        glyph?: string;
        chord?: string;
    };

    /**
     * How many views a group may hold and still be drawn as a heading over one button per view. A
     * larger group is drawn as one button with a list beside it. The ungrouped trailing section has
     * no heading to name such a button and stays as buttons however many it holds.
     */
    export const GROUP_MAX = 4;

    /**
     * The registrations under their configured groups, sorted by their own order and then id. A
     * group with no matching registration is not drawn; registrations with no configured group
     * trail without a heading.
     */
    export function arrange(registrations: Registration[], groups: NavGroup[]): Section[] {
        const sections: Section[] = [];
        const ranked = (items: Registration[]): Registration[] =>
            [...items].sort(
                (left, right) => left.order - right.order || left.id.localeCompare(right.id)
            );
        const configured = new Set(groups.map((group) => group.id));
        for (const group of groups) {
            const items = ranked(registrations.filter((view) => view.group === group.id));
            if (items.length === 0) continue;
            const section: Section = { label: group.label, items };
            if (group.glyph !== undefined) section.glyph = group.glyph;
            if (group.chord !== undefined) section.chord = group.chord;
            sections.push(section);
        }
        const rest = ranked(registrations.filter((view) => !configured.has(view.group)));
        if (rest.length > 0) sections.push({ label: null, items: rest });
        return sections;
    }

    /** Direct digits, every view in display order, and the configured entries behind flyout chords. */
    export function railOrder(registrations: Registration[], groups: NavGroup[]): RailOrder {
        const sections = arrange(registrations, groups);
        const direct = sections
            .filter((section) => section.label === null || section.items.length <= GROUP_MAX)
            .flatMap((section) => section.items.map((view) => view.id));
        const all = sections.flatMap((section) => section.items.map((view) => view.id));
        const chords: Record<string, string[]> = {};
        for (const section of sections) {
            if (section.items.length <= GROUP_MAX || section.chord === undefined) continue;
            chords[section.chord] = section.items.map((view) => view.id);
        }
        return { direct, all, chords };
    }
</script>

<script lang="ts">
    // Layer 3, shell. The strip down the left: one button per registered view, then the appearance
    // and the panel's dock at the foot. A click opens or activates the view in the main area and a
    // shift-click does it in the panel, which is the whole of what the rail decides; where a view
    // then lands inside that tree is the store's.

    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { dock, dockedAt, openView } from '$lib/state/layout.svelte';
    import {
        crt,
        setCrt,
        setTextScale,
        setTheme,
        setUnicode,
        setWallpaper,
        theme,
        textScale,
        unicode,
        wallpaper,
        stepTextScale
    } from '$lib/state/ui.svelte';
    import { t } from '$lib/state/text';
    import { themes as themeList, wallpaperOnTheme } from '$lib/state/appearance';
    import { badgeOf, registrationGlyph, registrationLabel, views } from '$lib/views/registry';
    import type { Dock } from '$lib/state/layout';

    type Props = {
        /** The `nav_groups`-shaped list from the merged config; the page reads it and passes it on. */
        groups?: NavGroup[];
        /** The `bookmarks` list of the merged config; the page reads it and passes it on. */
        bookmarks?: Bookmark[];
        /** Open the workbench search overlay. */
        onsearch?: () => void;
        /** Open the update-task tray. */
        onupdate?: () => void;
    };

    let { groups = [], bookmarks = [], onsearch = () => {}, onupdate = () => {} }: Props = $props();

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
        return section.items.map((view) => {
            const badge = badgeOf(view);
            return {
                id: view.id,
                label: registrationLabel(view),
                glyph: registrationGlyph(view),
                badge: badge.text,
                badgeTone: badge.tone,
                badgeTitle: badge.text === '' ? undefined : badge.title
            };
        });
    }

    /** The glyph a group's button carries: the group's own, or its first view's when it has none. */
    function groupGlyph(section: Section): string {
        return section.glyph ?? registrationGlyph(section.items[0]);
    }

    /** The status pair for a registration's badge; absent leaves the accent pair in the stylesheet. */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--badge-bg: var(--c-${tone}); --badge-fg: var(--on-c-${tone})`;
    }

    /** The wallpaper toggle is drawn only where there is one to switch: it is config and a theme. */
    const offersWallpaper = $derived(wallpaperOnTheme(theme()));
</script>

<nav class="rail" data-rail aria-label={t('ui.rail')}>
    <div class="views">
        <!-- Keyed by position: two config groups may carry the same label, and a duplicate key
             would be an error rather than a repeated heading. -->
        {#each sections as section, index (index)}
            {@const label = section.label}
            <!-- A large group is one button with a list beside it, so the rail does not grow an
                 icon per view; a small one stays a heading over its buttons. The list opens where
                 the theme menu at the foot does, since `compact` is what fixes it beside the rail. -->
            {#if label !== null && section.items.length > GROUP_MAX}
                <div class="flyout" data-group={label} data-chord={section.chord}>
                    <p class="group">{label}</p>
                    <Menu
                        {label}
                        glyph={groupGlyph(section)}
                        compact
                        rail
                        stacked
                        items={groupItems(section)}
                        onpick={(id, event) => openView(id, event.shiftKey ? 'panel' : 'main')}
                    />
                </div>
            {:else}
                {#if label !== null}
                    <p class="group">{label}</p>
                {/if}
                {#each section.items as view (view.id)}
                    {@const badge = badgeOf(view)}
                    <div class="control">
                        <ToolButton
                            label={registrationLabel(view)}
                            glyph={registrationGlyph(view)}
                            dataView={view.id}
                            compact
                            rail
                            stacked
                            onclick={(event) =>
                                openView(view.id, event.shiftKey ? 'panel' : 'main')}
                        />
                        {#if badge.text !== ''}
                            <span
                                class="badge"
                                style={badgeStyle(badge.tone)}
                                title={badge.title}
                                aria-hidden="true"
                            >
                                {badge.text}
                            </span>
                        {/if}
                    </div>
                {/each}
            {/if}
        {/each}

        <!-- The documents of config/layout.yml. They are not registrations, so they sit under a
             heading of their own rather than in a section arrange() built. -->
        {#if bookmarks.length > 0}
            <p class="group">{t('ui.docs')}</p>
            {#each bookmarks as mark (`${mark.root}/${mark.path}`)}
                <div class="control">
                    <ToolButton
                        label={mark.label}
                        glyph={t('views.document_glyph')}
                        dataBookmark={`${mark.root}/${mark.path}`}
                        compact
                        rail
                        stacked
                        onclick={() => openView('document', 'main', documentState(mark))}
                    />
                </div>
            {/each}
        {/if}
    </div>

    <div class="controls">
        <div data-action="search">
            <ToolButton
                label={t('app.search')}
                title={t('app.search_tip')}
                glyph="cmd"
                compact
                rail
                onclick={onsearch}
            />
        </div>
        <div data-action="update">
            <ToolButton
                label={t('app.tasks.update_tasks')}
                title={t('app.update_tip')}
                glyph="refresh"
                compact
                rail
                onclick={onupdate}
            />
        </div>
        <Menu
            label={t('ui.theme')}
            glyph={t('ui.theme_glyph')}
            compact
            rail
            items={themes}
            onpick={(name) => setTheme(name)}
        />
        <ToolButton
            label={t('app.text_smaller')}
            glyph="collapse"
            compact
            rail
            disabled={(textScale() ?? 1) <= 0.7}
            onclick={() => stepTextScale(-1)}
        />
        <ToolButton
            label={t('app.text_larger')}
            glyph="expand"
            compact
            rail
            disabled={(textScale() ?? 1) >= 1.6}
            onclick={() => stepTextScale(1)}
        />
        <ToolButton
            label={t('app.text_reset')}
            glyph="refresh"
            compact
            rail
            disabled={textScale() === null}
            onclick={() => setTextScale(null)}
        />
        <ToolButton
            label={t('ui.crt_on')}
            title={t('ui.crt_title')}
            glyph="crt"
            active={crt()}
            pressed={crt()}
            compact
            rail
            onclick={() => setCrt(!crt())}
        />
        {#if offersWallpaper}
            <ToolButton
                label={t('ui.wallpaper')}
                title={t('ui.wallpaper_title')}
                glyph="wallpaper"
                active={wallpaper()}
                pressed={wallpaper()}
                compact
                rail
                onclick={() => setWallpaper(!wallpaper())}
            />
        {/if}
        <ToolButton
            label={t('ui.unicode')}
            title={t('ui.unicode_title')}
            glyph="unicode"
            active={unicode()}
            pressed={unicode()}
            compact
            rail
            onclick={() => setUnicode(!unicode())}
        />
        <Menu
            label={dockLabel}
            glyph={t('ui.dock_glyph')}
            compact
            rail
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
           the rail's width. The view list scrolls on its own. */
        overflow: visible;
    }

    .views,
    .controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
    }

    /* The list scrolls on a short window, with no scrollbar drawn: a bar in the rail covers the
       controls it sits beside, and the wheel and the trackpad reach every entry without it. */
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

    .control {
        position: relative;
        display: block;
        width: 100%;
    }

    .badge {
        position: absolute;
        right: -2px;
        bottom: -2px;
        padding: 0 3px;
        border-radius: var(--radius-pill);
        background: var(--badge-bg, var(--chip));
        color: var(--badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
    }

    /* Over a wallpaper the rail goes translucent with the panes, and takes the pane's colour while
       it does: the two are one surface to the eye once the picture shows through them. */
    :global(body.wall) .rail {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
        -webkit-backdrop-filter: blur(var(--wall-blur));
    }
</style>
