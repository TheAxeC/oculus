<script lang="ts">
    // Layer 3, shell. The strip down the left: one button per page of the `rail:` list of
    // config/layout.yml, then the reader's bookmarks, then Search and Update at the foot. A page
    // button shows its page, made from its arrangement the first time and switched to after that,
    // which is the whole of what the rail decides; what a page holds is the layout store's, and
    // every view is reached from the catalogue on the Views and Settings page. A button draws the
    // badges of the views its page holds, in the order of the page's tabs, as each tab draws its
    // own.

    import { documentState, railStop, type Bookmark } from '$lib/shell/rail/rail';
    import RailList from './RailList.svelte';
    import Glyph from '$lib/ui/controls/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { railPageViews } from '$lib/state/workbench/navigation/pages';
    import { badgeOf, type RegistrationBadge } from '$lib/views/registry';
    import { heldStop } from '$lib/ui/tree/roving';
    import type { RailPage } from '$lib/state/workbench/navigation/rail';
    import { t } from '$lib/state/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        layout: { currentPage, openRailPage, openView, pages: allPages },
        registry: { viewFor }
    } = client;

    type Props = {
        /** The rail's pages, read by the page out of the merged config and handed on. */
        pages?: RailPage[];
        /**
         * The reader's own bookmarks, from ~/.oculus/bookmarks.yml; the page reads them off the fs
         * store and passes them on, since the shell may not read that store itself.
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

    let { pages = [], saved = [], onsearch = ignore, onupdate = ignore }: Props = $props();

    /** How many rail pages a digit reaches: the bare digits 1 to 9, resolved in shell/keys. */
    const SHORTCUTS = 9;

    /** The rail key of the page on screen, which is the button drawn as the one in force. */
    const shown = $derived(currentPage().rail);

    /**
     * The hover words of one page button: the digit that reaches it for the first nine, and the
     * label alone after them.
     */
    function hint(entry: RailPage, index: number): string {
        return index < SHORTCUTS ? t('ui.page_shortcut', entry.label, index + 1) : entry.label;
    }

    /**
     * The badges one page button draws: those of the views its page holds, in the order of the
     * page's tabs, leaving out a view whose badge is empty.
     */
    function badgesOf(entry: RailPage): RegistrationBadge[] {
        return railPageViews(allPages(), entry.page, entry.node).flatMap((id) => {
            const found = viewFor(id);
            if (found === undefined) return [];
            const badge = badgeOf(found, client);
            return badge.text === '' && badge.glyph === '' ? [] : [badge];
        });
    }

    /**
     * The status pair for a badge's tone; absent leaves the accent pair in the stylesheet.
     */
    function badgeStyle(tone: string | undefined): string | undefined {
        return tone === undefined
            ? undefined
            : `--badge-bg: var(--c-${tone}); --badge-fg: var(--on-c-${tone})`;
    }

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

    /**
     * Every control of the rail that takes the keyboard, in the order they are drawn. The rail is
     * one stop of the browser's focus order, so this list is the ring the arrow keys move along and
     * the name of each entry is what its button renders for this component to find it by.
     */
    const stops = $derived([
        ...pages.map((entry) => `page:${entry.page}`),
        ...saved.map((_, at) => `mark:${at}`),
        'search',
        'update'
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

    // A control that leaves the ring under the focus (a page taken out of the rail list by a save,
    // a bookmark taken away in the Files view) drops the focus to the document. The stop moves to
    // the control that took its place and takes the keyboard back with it.
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
     * Take the keyboard back for the stop, and only where nothing else holds it: the control that
     * went took the focus with it, and the browser left it on the document.
     */
    function recoverStop(id: string): void {
        queueMicrotask(() => {
            const at = document.activeElement;
            if (at === null || at === document.body || !at.isConnected) focusStop(id);
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
     * rail, wrapping at either end, by `railStop` of shell/rail/rail.ts. Each control answers for
     * itself, and a key held with a modifier belongs to the shell.
     */
    function ringKeys(id: string): (event: KeyboardEvent) => void {
        return (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            const next = railStop(event.key, id, stops);
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
     * nowhere from a control still on the page, which is a click on the page's blank space. The one
     * departure the rail keeps holding through is its control leaving the page under the focus,
     * which is told apart once the update that took it away is done.
     */
    function departed(event: FocusEvent): void {
        if (event.relatedTarget !== null) {
            holding = false;
            return;
        }
        const from = event.target;
        queueMicrotask(() => {
            if (!(from instanceof HTMLElement) || from.isConnected) holding = false;
        });
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
            <!-- Keyed by the arrangement key, which the rule over the list holds unique. -->
            {#each pages as entry, index (entry.page)}
                {@const badges = badgesOf(entry)}
                <div class="control" data-rail-page={entry.page}>
                    <ToolButton
                        label={entry.label}
                        title={hint(entry, index)}
                        glyph={entry.glyph}
                        active={shown === entry.page}
                        compact
                        rail
                        stacked
                        stop={`page:${entry.page}`}
                        tabindex={stopIndex(`page:${entry.page}`)}
                        onkeydown={ringKeys(`page:${entry.page}`)}
                        onclick={() => openRailPage(entry.page, entry.label, entry.node)}
                    />
                    {#if badges.length > 0}
                        <span class="badges" aria-hidden="true" data-rail-badges>
                            <!-- Keyed by position: the list is the page's views in tab order. -->
                            {#each badges as badge, at (at)}
                                <span
                                    class="badge"
                                    style={badgeStyle(badge.tone)}
                                    title={badge.title}
                                >
                                    {#if badge.glyph !== ''}<Glyph
                                            name={badge.glyph}
                                        />{/if}{badge.text}
                                </span>
                            {/each}
                        </span>
                    {/if}
                </div>
            {/each}

            <!-- The reader's own bookmarks, which the Files view adds and takes away. -->
            {#if saved.length > 0}
                <p class="group">{t('ui.docs')}</p>
                <!-- Keyed by position: two bookmarks may name one file under two labels, and a
                     duplicate key would be an error rather than a second button. -->
                {#each saved as mark, at (at)}
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

        <!-- Every control draws its glyph over a short name of its own, so the foot reads without a
             hover. -->
        <div class="controls" data-foot>
            <div data-action="search">
                <ToolButton
                    label={t('app.search')}
                    title={t('app.search_tip')}
                    glyph="cmd"
                    compact
                    rail
                    stacked
                    stop="search"
                    tabindex={stopIndex('search')}
                    onkeydown={ringKeys('search')}
                    onclick={onsearch}
                />
            </div>
            <div data-action="update">
                <ToolButton
                    label={t('app.update')}
                    title={t('app.update_tip')}
                    glyph="refresh"
                    compact
                    rail
                    stacked
                    stop="update"
                    tabindex={stopIndex('update')}
                    onkeydown={ringKeys('update')}
                    onclick={onupdate}
                />
            </div>
        </div>
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
        /* A tooltip opens beside the rail; hiding overflow here would clip it to the rail's width.
           The list scrolls on its own. */
        overflow: visible;
    }

    /* The controls fill the rail between its edges: the pages and bookmarks at the top and the two
       openers at the foot. */
    .ring {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1 1 auto;
        min-height: 0;
        overflow: visible;
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

    /* The badges of a page button sit on a row of their own under it, one after another in the
       order of the page's tabs, and wrap rather than run over the button's name. */
    .badges {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1px;
        margin-top: 1px;
        pointer-events: none;
    }

    .badge {
        padding: 0 3px;
        border-radius: var(--radius-pill);
        background: var(--badge-bg, var(--chip));
        color: var(--badge-fg, var(--accent-txt, var(--accent)));
        font-family: var(--font-num);
        font-size: var(--fs-3xs);
    }

    /* On a short window the list is what gives way, and it scrolls. Without the flex-shrink the
       foot shrinks with it and its buttons pile over each other. */
    .controls {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
        flex-shrink: 0;
    }

    /* Over a wallpaper the rail goes translucent with the panes, and takes the pane's colour while
       it does: the two are one surface to the eye once the picture shows through them. The rail
       holds nothing drawn past its own box, since a tooltip's bubble is drawn on the body, so it
       needs no depth over the panes beside it. */
    :global(body.wall) .rail {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
