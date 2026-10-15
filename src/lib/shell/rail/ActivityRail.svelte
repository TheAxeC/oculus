<script lang="ts">
    // Layer 3, shell. The strip down the left, drawn as VS Code's activity bar: one icon per page
    // of the `rail:` list of config/layout.yml (RailPages.svelte), and at the foot Workbenches and
    // Update (RailFoot.svelte). A page button shows its page, made from its
    // arrangement the first time and switched to after that, which is the whole of what the rail
    // decides about pages; what a page holds is the layout store's, and every view is reached from
    // the catalogue on the System page. A workbench, a page that belongs to one folder, has no
    // button of its own: the Workbenches button at the foot lists the open ones and shows the
    // Workbenches view.
    //
    // A page button dragged to a new place, and Hide in its right-click menu, rewrite `rail:`
    // through the rail write the Settings view saves with, which the page reaches for the rail
    // since the shell may not write: the change is logged and undone as a save there is, and the
    // rail redraws from the config the watcher pushes back. A write the server refuses leaves the
    // rail as it was and says why in a notification, whose action is the Settings view with its
    // rail list in view, which is also what Settings in the same menu shows.
    //
    // Reset to its arrangement in the same menu makes the button's saved page again from the
    // button's arrangement, after a confirm naming the page and then the question closing each of
    // its tabs holding unsaved text asks, one at a time; a no to any leaves the page as it was. The
    // page keeps its id, so a page showing it keeps showing it.

    import RailFoot from './RailFoot.svelte';
    import RailList from './RailList.svelte';
    import RailPages from './RailPages.svelte';
    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import { RAIL_HIDE, RAIL_RESET, railHidden, railMoved, railStop } from '$lib/shell/rail/rail';
    import {
        questionFor,
        railPageViews,
        instancesOfPages,
        resetAfterAsking,
        resetAsk,
        tabNameOf,
        type Question
    } from '$lib/state/workbench/navigation/pages';
    import {
        SETTINGS_VIEW,
        WORKBENCHES_VIEW,
        type RailEntry,
        type RailPage
    } from '$lib/state/workbench/navigation/rail';
    import { heldStop } from '$lib/ui/tree/roving';
    import { focusIsFree } from '$lib/ui/frame/quiet-focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: {
            currentPage,
            heldInstance,
            openPage,
            openRailPage,
            openView,
            pages: allPages,
            resetPage,
            switchPage
        },
        notices: { post },
        registry: { viewFor },
        ui: { unsaved, busyTerminals, saveBeforeClose }
    } = useState();

    type Props = {
        /** The rail's pages, read by the page out of the merged config and handed on. */
        pages?: RailPage[];
        /**
         * Rewrite the `rail:` list with an edit, answering why the server refused the write or the
         * empty string when it was written. The page owns the write.
         */
        editRail?: (edit: (rail: RailEntry[]) => RailEntry[]) => Promise<string>;
        /** Open the update-task tray. */
        onupdate?: () => void;
    };

    /** The default for a callback the page did not pass: the control is drawn and does nothing. */
    function ignore(): void {
        // A rail without an update owner still draws its button.
    }

    /** The default for a rail with no owner of its list: nothing written, and nothing refused. */
    function unwritten(): Promise<string> {
        return Promise.resolve('');
    }

    let { pages = [], editRail = unwritten, onupdate = ignore }: Props = $props();

    /**
     * Write the rail's list as a drag or a Hide changed it, and say in a notification why the
     * server refused it when it did.
     */
    async function write(edit: (rail: RailEntry[]) => RailEntry[]): Promise<void> {
        const refused = await editRail(edit);
        if (refused === '') return;
        post(refused, {
            tone: 'error',
            actions: [{ label: t('statusbar.rail_settings'), run: openSettings }]
        });
    }

    /** A page button let go at a new place. */
    function moved(page: string, before: string | null): void {
        void write((rail) => railMoved(rail, page, before));
    }

    /** The question a reset is waiting on, or null while none is. */
    let question: Question | null = $state(null);
    const ask = questionFor((held) => (question = held));

    /**
     * A choice of a page button's right-click menu: Hide takes its entry out of `rail:`, Reset asks
     * before the button's page is made again from its arrangement, and Settings shows the Settings
     * view with its rail list in view.
     */
    function menuPick(page: string, pick: string): void {
        if (pick === RAIL_HIDE) {
            void write((rail) => railHidden(rail, page));
            return;
        }
        if (pick === RAIL_RESET) {
            askReset(page);
            return;
        }
        openSettings();
    }

    /**
     * Ask before the page of one button is made again from the button's arrangement, and then about
     * each of its tabs holding unsaved text.
     */
    function askReset(key: string): void {
        const entry = pages.find((one) => one.page === key);
        const all = allPages();
        const made = all.find((page) => page.rail === key);
        if (entry === undefined || made === undefined) return;
        const words = resetAsk(all, [made], [], made);
        void resetAfterAsking(
            all,
            words,
            [made],
            unsaved,
            saveBeforeClose,
            (instance) => tabNameOf(instance, viewFor),
            ask,
            () => {
                resetPage(made.id, entry);
            },
            () => busyTerminals(instancesOfPages([made]))
        );
    }

    /**
     * Show the Settings view with its rail list in view: the one a page or float holds, since
     * Settings is held once, else on the rail page whose arrangement names it, made first when it
     * is not made yet, or on the page on screen when no rail page names it.
     */
    function openSettings(): void {
        const holder = pages.find((entry) =>
            railPageViews(allPages(), entry.page, entry.node).includes(SETTINGS_VIEW)
        );
        if (holder !== undefined && heldInstance(SETTINGS_VIEW) === null) {
            openRailPage(holder.page, holder.label, holder.node);
        }
        openView(SETTINGS_VIEW, { reveal: 'rail' }, currentPage().id);
    }

    /**
     * Show the Workbenches view as a unique view is shown: the one a page or float holds, since it
     * is held once, else on the page on screen. A page that is a workbench never takes it, since a
     * Close or a Reset from one of its rows would take the view with it: when the page on screen is
     * a workbench the view goes to the rail page of the catalogue group the view sits in, made
     * first when it is not made yet, else to the first page that is no workbench, and to a new page
     * when every page is a workbench.
     */
    function openWorkbenches(): void {
        if (heldInstance(WORKBENCHES_VIEW) === null && currentPage().folder !== undefined) {
            const group = viewFor(WORKBENCHES_VIEW)?.group;
            const entry = pages.find((one) => one.page === group);
            if (entry !== undefined) {
                openRailPage(entry.page, entry.label, entry.node);
            } else {
                const other = allPages().find((page) => page.folder === undefined);
                if (other === undefined) openPage(t('ui.page_default', allPages().length + 1));
                else switchPage(other.id);
            }
        }
        openView(WORKBENCHES_VIEW, {}, currentPage().id);
    }

    /**
     * Every control of the rail that takes the keyboard, in the order they are drawn. The rail is
     * one stop of the browser's focus order, so this list is the ring the arrow keys move along and
     * the name of each entry is what its button renders for this component to find it by.
     */
    const stops = $derived([
        ...pages.map((entry) => `page:${entry.page}`),
        'workbenches',
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

    // A control that leaves the ring under the focus (a page taken out of the rail list by a save
    // or by Hide) drops the focus to the document. The stop moves to the control that took its
    // place and takes the keyboard back with it.
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
            if (focusIsFree()) focusStop(id);
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
            <RailPages {pages} {stopIndex} {ringKeys} onmove={moved} onmenu={menuPick} />
        </RailList>
        <RailFoot {stopIndex} {ringKeys} {onupdate} onworkbenches={openWorkbenches} />
    </div>
</nav>

<CloseQuestion
    message={question?.message ?? null}
    detail={question?.detail}
    onconfirm={() => question?.answer(true)}
    oncancel={() => question?.answer(false)}
/>

<style>
    /* VS Code's activity bar: the bar's width, no padding, the items flush one under the next, the
       ground's colour with the border on its right edge setting it off from the panes, as VS Code's
       Modern themes draw the bar in the side bar's colour with a border, and that border drawn
       inside the width, so an item is the bar's whole width. */
    .rail {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        width: var(--rail-width);
        padding: 0;
        box-sizing: border-box;
        background: var(--bg);
        box-shadow: inset -1px 0 0 var(--line);
        /* A tooltip opens beside the rail; hiding overflow here would clip it to the rail's width.
           The list scrolls on its own. */
        overflow: visible;
    }

    /* The controls fill the rail between its edges: the pages at the top and the foot at the
       bottom. */
    .ring {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0;
        overflow: visible;
    }

    /* Over a wallpaper the rail goes translucent with the panes, and takes the pane's colour while
       it does: the two are one surface to the eye once the picture shows through them. The rail
       holds nothing drawn past its own box, since a tooltip's bubble and a menu opened from it are
       drawn on the body, so it needs no depth over the panes beside it. */
    :global(body.wall) .rail {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
