<script lang="ts">
    // Layer 3, shell. The strip down the left: one button per registered view, then the appearance
    // controls at the foot. A click opens or activates the view in the pane a view lands in and a
    // shift-click opens it in a new pane beside that one, which is the whole of what the rail
    // decides; where a view then lands in the tree is the store's.

    import {
        type Bookmark,
        GROUP_MAX,
        type NavGroup,
        type Section,
        arrange,
        documentState
    } from '$lib/shell/rail';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { t } from '$lib/state/text';
    import { themes as themeList, wallpaperOnTheme } from '$lib/state/appearance';
    import { badgeOf, registrationGlyph, registrationLabel } from '$lib/views/registry';
    import { useState } from '$lib/state/use';

    const client = useState();

    const {
        layout: { openBeside, openView },
        ui: {
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
        },
        registry: { views }
    } = client;

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

    /** The default for a callback the page did not pass: the control is drawn and does nothing. */
    function ignore(): void {
        // A rail without a search or update owner still draws its buttons.
    }

    let { groups = [], bookmarks = [], onsearch = ignore, onupdate = ignore }: Props = $props();

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

    /** A plain click opens the view where a view lands; a shift-click opens it in a pane beside. */
    function open(view: string, event: MouseEvent): void {
        if (event.shiftKey) openBeside(view);
        else openView(view);
    }

    /** The views of one group as the choices of its list, each with its own glyph and words. */
    function groupItems(section: Section): MenuItem[] {
        return section.items.map((view) => {
            const badge = badgeOf(view, client);
            return {
                id: view.id,
                label: registrationLabel(view),
                glyph: registrationGlyph(view),
                badge: badge.text,
                badgeGlyph: badge.glyph,
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
                        onpick={(id: string, event: MouseEvent) => open(id, event)}
                    />
                </div>
            {:else}
                {#if label !== null}
                    <p class="group">{label}</p>
                {/if}
                {#each section.items as view (view.id)}
                    {@const badge = badgeOf(view, client)}
                    <div class="control">
                        <ToolButton
                            label={registrationLabel(view)}
                            glyph={registrationGlyph(view)}
                            dataView={view.id}
                            compact
                            rail
                            stacked
                            onclick={(event: MouseEvent) => open(view.id, event)}
                        />
                        {#if badge.glyph !== ''}
                            <span
                                class="badge"
                                style={badgeStyle(badge.tone)}
                                title={badge.title}
                                aria-hidden="true"
                            >
                                <Glyph name={badge.glyph} />{badge.text}
                            </span>
                        {:else if badge.text !== ''}
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
                        onclick={() => openView('document', documentState(mark))}
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
            onpick={(name: string) => setTheme(name)}
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
       which leaves the theme menu unreachable. */
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
       it does: the two are one surface to the eye once the picture shows through them.
       The filter makes the rail the stacking context of every fixed thing it holds, its flyout lists
       and its tooltips, so the rail carries the order that context paints in: above the panes beside
       it, and below the drag layer at 10 and the overlays above that. */
    :global(body.wall) .rail {
        position: relative;
        z-index: 5;
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
