<script lang="ts">
    // Layer 3, shell. The strip down the left: one button per registered view, then the appearance
    // controls at the foot. A click opens or activates the view in the pane a view lands in and a
    // shift-click opens it in a new pane beside that one, which is the whole of what the rail
    // decides; where a view then lands in the tree is the store's.

    import {
        DOC_PICK,
        type Bookmark,
        type DocEntry,
        type NavGroup,
        type Section,
        arrange,
        groupGlyph,
        TEXT_ROW,
        docState,
        documentState,
        isFlyout,
        railStop
    } from '$lib/shell/rail/rail';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import RailAppearance from './RailAppearance.svelte';
    import RailList from './RailList.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { heldStop } from '$lib/ui/tree/roving';
    import { t } from '$lib/state/words/text';
    import { wallpaperOnTheme } from '$lib/state/words/appearance';
    import { badgeOf, registrationGlyph, registrationLabel } from '$lib/views/registry';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: { openBeside, openView },
        ui: { theme, textScale },
        registry: { views }
    } = client;

    type Props = {
        /**
         * The `nav_groups`-shaped list from the merged config; the page reads it and passes it on.
         */
        groups?: NavGroup[];
        /** The `bookmarks` list of the merged config; the page reads it and passes it on. */
        bookmarks?: Bookmark[];
        /** The `docs` list of the merged config: the hub documents drawn inside their groups. */
        docs?: DocEntry[];
        /**
         * The reader's own bookmarks, from their own file rather than the configuration; the page
         * reads them off the fs store and passes them on, and they are drawn after the configured
         * ones under the same heading.
         */
        saved?: Bookmark[];
        /** Open the workbench search overlay. */
        onsearch?: () => void;
        /** Open the update-task tray. */
        onupdate?: () => void;
    };

    /** The default for a callback the page did not pass: the control is drawn and does nothing. */
    function ignore(): void {
        // A rail without a search or update owner still draws its buttons.
    }

    let {
        groups = [],
        bookmarks = [],
        docs = [],
        saved = [],
        onsearch = ignore,
        onupdate = ignore
    }: Props = $props();

    /**
     * Every bookmark the Docs section draws: the configured ones first, then the reader's own. A
     * saved one naming a file a configured one already names is left out, since the two would be
     * one button pressed twice; the configured one wins, as it does everywhere else.
     */
    const marks = $derived([
        ...bookmarks,
        ...saved.filter(
            (one) => !bookmarks.some((held) => held.root === one.root && held.path === one.path)
        )
    ]);

    /**
     * What one bookmark opens as, which the bookmark itself says. The file view is given the root,
     * the path and the label and no id of its own, so a file opened from here and the same file
     * opened from the tree are the one tab.
     */
    function openMark(mark: Bookmark): void {
        if (mark.view === 'file') {
            openView('file', { root: mark.root, path: mark.path, label: mark.label });
            return;
        }
        openView('document', documentState(mark));
    }

    /* A view registered as not listed (the editor, a project, a document) is opened from a card or
       a bookmark and has nothing to show when opened bare, so the rail draws no button for it. */
    const sections = $derived(
        arrange(
            views().filter((view) => view.listed !== false),
            groups,
            docs
        )
    );

    /** A plain click opens the view where a view lands; a shift-click opens it in a pane beside. */
    function open(view: string, event: MouseEvent): void {
        if (event.shiftKey) openBeside(view);
        else openView(view);
    }

    /** The view a configured hub document opens in, one instance per path. */
    const DOC_VIEW = 'doc';

    /** The same two paths for a document: where a view lands, or in a pane beside it. */
    function openDoc(entry: DocEntry, event: MouseEvent): void {
        if (event.shiftKey) openBeside(DOC_VIEW, docState(entry));
        else openView(DOC_VIEW, docState(entry));
    }

    /**
     * What picking one choice of a group's list means: a document by its path, or a view by its id.
     */
    function pick(section: Section, id: string, event: MouseEvent): void {
        if (!id.startsWith(DOC_PICK)) {
            open(id, event);
            return;
        }
        const path = id.slice(DOC_PICK.length);
        const entry = section.docs.find((one) => one.path === path);
        if (entry !== undefined) openDoc(entry, event);
    }

    /**
     * The entries of one group as the choices of its list: its views with their own glyph and
     * words, then its documents, which carry the document glyph and no badge.
     */
    function groupItems(section: Section): MenuItem[] {
        const items: MenuItem[] = section.items.map((view) => {
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
        return [
            ...items,
            ...section.docs.map((entry) => ({
                id: `${DOC_PICK}${entry.path}`,
                label: entry.label,
                glyph: t('views.doc_glyph')
            }))
        ];
    }

    /**
     * The status pair for a registration's badge; absent leaves the accent pair in the stylesheet.
     */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--badge-bg: var(--c-${tone}); --badge-fg: var(--on-c-${tone})`;
    }

    /**
     * The wallpaper toggle is drawn only where there is one to switch: it is config and a theme.
     */
    const offersWallpaper = $derived(wallpaperOnTheme(theme()));

    /**
     * The two text steps say what they cannot do, and a control that cannot be pressed is no stop.
     */
    const canShrink = $derived((textScale() ?? 1) > 0.7);
    const canGrow = $derived((textScale() ?? 1) < 1.6);
    const canReset = $derived(textScale() !== null);

    /**
     * Every control of the rail that takes the keyboard, in the order they are drawn. The rail is
     * one stop of the browser's focus order, so this list is the ring the arrow keys move along and
     * the name of each entry is what its button renders for this component to find it by. A control
     * that is not pressable is left out, since focus put on it would land nowhere.
     */
    const stops = $derived([
        ...sections.flatMap((section, index) =>
            section.label !== null && isFlyout(section)
                ? [`group:${index}`]
                : [
                      ...section.items.map((view) => `view:${view.id}`),
                      ...section.docs.map((entry) => `doc:${entry.path}`)
                  ]
        ),
        ...marks.map((_, at) => `mark:${at}`),
        'search',
        'update',
        'theme',
        ...(canShrink ? ['text-smaller'] : []),
        ...(canReset ? ['text-reset'] : []),
        ...(canGrow ? ['text-larger'] : []),
        'crt',
        ...(offersWallpaper ? ['wall'] : []),
        'unicode'
    ]);

    /** The control the rail's stop is on. A stop whose control has gone falls back to the first. */
    let held = $state('');
    const current = $derived(stops.includes(held) ? held : (stops[0] ?? ''));

    let box: HTMLElement | undefined = $state();

    /**
     * Whether the rail holds the keyboard, which decides who gets the focus back when a control
     * goes.
     */
    let holding = false;

    /**
     * The ring as it stood at the last change, so a control leaving it can be told from one
     * arriving.
     */
    let ring: string[] = [];

    // A control the reader's own press makes unavailable (the reset once the text size is back, a
    // step at its end, the wallpaper toggle under a theme without one) leaves the ring under the
    // focus, and the browser drops the focus to the document. The stop moves to the control that
    // took its place and takes the keyboard back with it.
    $effect(() => {
        const now = stops;
        const was = ring;
        ring = now;
        // `held` and not `current`, which has already fallen back to the first control by here.
        if (held === '' || was.length === 0 || now.includes(held)) return;
        const moved = heldStop(was, now, held);
        held = moved;
        if (holding) recoverStop(moved);
    });

    /**
     * One control's place in the browser's focus order: the stop is reached by Tab, the rest by the
     * arrows.
     */
    function stopIndex(id: string): number {
        return id === current ? 0 : -1;
    }

    /**
     * Take the keyboard back for the stop, and only where nothing else holds it. A control disabled
     * under the focus is left holding it until the browser hands it to the document, so both that
     * control and the document count as nothing.
     */
    function recoverStop(id: string): void {
        queueMicrotask(() => {
            const at = document.activeElement;
            const loose =
                at === null || at === document.body || !at.isConnected || at.matches('[disabled]');
            if (loose) focusStop(id);
        });
    }

    /**
     * Put the keyboard on one control of the rail, once the update that moved the stop is drawn.
     */
    function focusStop(id: string): void {
        queueMicrotask(() => {
            for (const node of box?.querySelectorAll<HTMLElement>('[data-stop]') ?? []) {
                if (node.dataset.stop === id) {
                    node.focus();
                    return;
                }
            }
        });
    }

    /**
     * The keyboard on one control of the ring: the up and down arrows carry the stop along the
     * rail, wrapping at either end, and the left and right arrows along the foot's row of text
     * steps, by `railStop` of shell/rail/rail.ts. Each control answers for itself, so an open
     * list's own arrows are never this, and a key held with a modifier belongs to the shell.
     */
    function ringKeys(id: string): (event: KeyboardEvent) => void {
        return (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const next = railStop(event.key, id, stops, TEXT_ROW);
            if (next === null) return;
            event.preventDefault();
            held = next;
            focusStop(next);
        };
    }

    /**
     * A control reached by the pointer becomes the stop, so the arrows carry on from where the
     * reader is.
     */
    function entered(event: FocusEvent): void {
        holding = true;
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const id = target.closest<HTMLElement>('[data-stop]')?.dataset.stop;
        if (id !== undefined && stops.includes(id)) held = id;
    }

    /**
     * The focus going to another control is the reader leaving the rail, and so is the focus going
     * nowhere from a control that can still be pressed, which is a click on the page's blank space.
     * The one departure the rail keeps holding through is a control disabled under the keyboard,
     * whose focus the browser hands to the document on its own.
     */
    function departed(event: FocusEvent): void {
        const from = event.target;
        const disabled = from instanceof HTMLElement && from.matches('[disabled]');
        if (event.relatedTarget !== null || !disabled) holding = false;
    }
</script>

<nav class="rail" data-rail aria-label={t('ui.rail')}>
    <!-- The controls are one stop of the browser's focus order with a ring inside it, which is what
         a toolbar is: the role tells a reader the arrow keys move along it, and it sits inside the
         landmark rather than on it so the rail is still a navigation region. The arrows are
         answered by each control, so this element needs no tabindex and takes no focus of its
         own. -->
    <div
        class="ring"
        role="toolbar"
        aria-orientation="vertical"
        aria-label={t('ui.rail')}
        bind:this={box}
        onfocusin={entered}
        onfocusout={departed}
    >
        <RailList>
            <!-- Keyed by position: two config groups may carry the same label, and a duplicate key
             would be an error rather than a repeated heading. -->
            {#each sections as section, index (index)}
                {@const label = section.label}
                <!-- A large group is one button with a list beside it, so the rail does not grow an
                     icon per view; a small one stays a heading over its buttons. The list opens
                     where the theme menu at the foot does, since `compact` is what fixes it beside
                     the rail. -->
                {#if label !== null && isFlyout(section)}
                    <div class="flyout" data-group={label} data-chord={section.chord}>
                        <p class="group">{label}</p>
                        <Menu
                            {label}
                            glyph={groupGlyph(section)}
                            compact
                            rail
                            stacked
                            stop={`group:${index}`}
                            tabindex={stopIndex(`group:${index}`)}
                            onkeydown={ringKeys(`group:${index}`)}
                            items={groupItems(section)}
                            onpick={(id: string, event: MouseEvent) => pick(section, id, event)}
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
                                stop={`view:${view.id}`}
                                tabindex={stopIndex(`view:${view.id}`)}
                                onkeydown={ringKeys(`view:${view.id}`)}
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
                    <!-- The group's documents, after its views: a configured hub document is not a
                     registration, so it is drawn here rather than by the loop above. -->
                    {#each section.docs as entry (entry.path)}
                        <div class="control">
                            <ToolButton
                                label={entry.label}
                                glyph={t('views.doc_glyph')}
                                dataDoc={entry.path}
                                compact
                                rail
                                stacked
                                stop={`doc:${entry.path}`}
                                tabindex={stopIndex(`doc:${entry.path}`)}
                                onkeydown={ringKeys(`doc:${entry.path}`)}
                                onclick={(event: MouseEvent) => openDoc(entry, event)}
                            />
                        </div>
                    {/each}
                {/if}
            {/each}

            <!-- The reader's own bookmarks. They are not registrations, so they sit under a heading
                 of their own rather than in a section arrange() built. -->
            {#if marks.length > 0}
                <p class="group">{t('ui.docs')}</p>
                <!-- Keyed by position, as the sections above are: two of the reader's own bookmarks
                     may name one file under two labels, and a duplicate key would be an error
                     rather than a second button. -->
                {#each marks as mark, at (at)}
                    <div class="control">
                        <ToolButton
                            label={mark.label}
                            glyph={t('views.document_glyph')}
                            dataBookmark={`${mark.root}/${mark.path}`}
                            compact
                            rail
                            stacked
                            stop={`mark:${at}`}
                            tabindex={stopIndex(`mark:${at}`)}
                            onkeydown={ringKeys(`mark:${at}`)}
                            onclick={() => openMark(mark)}
                        />
                    </div>
                {/each}
            {/if}
        </RailList>

        <RailAppearance
            {stopIndex}
            {ringKeys}
            {canShrink}
            {canGrow}
            {canReset}
            {offersWallpaper}
            {onsearch}
            {onupdate}
        />
    </div>
</nav>

<style>
    .rail {
        display: flex;
        flex-direction: column;
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

    /* The controls fill the rail between its edges: the list of views at the top and the appearance
       controls at the foot. */
    .ring {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1 1 auto;
        min-height: 0;
        overflow: visible;
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
       it does: the two are one surface to the eye once the picture shows through them. The filter
       makes the rail the stacking context of every fixed thing it holds, its flyout lists and its
       tooltips, so the rail carries the order that context paints in: above the panes beside it,
       and below the drag layer at 10 and the overlays above that. */
    :global(body.wall) .rail {
        position: relative;
        z-index: 5;
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
