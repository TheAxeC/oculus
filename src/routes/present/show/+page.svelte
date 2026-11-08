<script lang="ts">
    // Layer 3, route. The slide on show, alone: the audience's window while the presenter screen of
    // the Present view is on. `?root=&path=` name the deck, which the deck route answers as it does
    // for the print route, and the slide is drawn by the same components in its frame, the largest
    // box of the slide's shape the window holds, with no toolbar, rail or counter, and at the app's
    // text size (the `text_size` option, as the shell draws it), so the slide lays itself out as
    // the Present view lays it out. The page installs the config once, when it opens (+page.ts),
    // and has no socket, so it draws the text size and the theme the config held then; a change of
    // either reaches it when the window opens again. The page measures nothing: the Present view's
    // own stages say which slides are too tall.
    //
    // The page and the presenter screen keep one slide over a BroadcastChannel named for the deck
    // (state/life/present.ts): the page draws the key it is sent, says when it opened, and sends a
    // move when its own keys or a click move the slide, so a clicker moves both windows whichever
    // has the focus. The presenter screen holds a Web Lock of the same name while it presents; the
    // page asks for it, and is granted it only when the presenter screen is gone (a reload, a
    // closed tab, a crash): then the page says so and offers to close. When the screen says it
    // ended, the page closes its own window, or says so when it cannot. The deck is read again
    // when the presenter screen says it changed, and a read that fails reloads the page once
    // before the page says the presentation ended. A reload of this window says it closed and
    // then opened, and the presenter screen keeps the presentation when it opens in time.
    //
    // The deck is drawn as the presenting pane filters it. The address names the deck alone, so
    // the page asks over the channel which projects the pane's filter keeps (`keep-asked`) when it
    // opens, reads the deck once the presenter screen answers (a `keep` with `at` 0), and reads it
    // again whenever the screen says the kept list changed; an answer that arrives after a later
    // one is dropped. The same answer carries the pane's Project facts toggle, which the strip of a
    // project's facts at the foot of its slides shows its words by: a change of the toggle alone is
    // drawn at once, with no read of the deck.
    //
    // A browser enters full screen only from a press in the window, so the page has a Full Screen
    // control and the key F. The control shows at the load, goes after the pointer has rested,
    // comes back with the pointer and is not drawn while the window fills the screen, which is the
    // document's full screen, a browser's own or the desktop host's simple full screen.

    import { onMount } from 'svelte';
    import Slide from '$lib/views/academic/present/Slide.svelte';
    import Stage from '$lib/views/academic/present/screen/Stage.svelte';
    import { CONTROLS, moveOf } from '$lib/views/academic/present/screen/keys';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        deckLabel,
        movedKey,
        parseMessage,
        presentName,
        slideAt,
        stepKey,
        type Deck,
        type DeckRef
    } from '$lib/state/life/present';
    import { readDeck } from '$lib/state/life/present.svelte';
    import { configuredLook } from '$lib/state/shared/words/appearance';
    import { desktopOf } from '$lib/state/shared/stores/desktop';
    import { t } from '$lib/state/shared/words/text';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { createHtmlMemo, provideHtmlMemo } from '$lib/ui/html';
    import { drawConfiguredTheme } from '$lib/ui/theme/app-theme';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    provideTipIds(createTipIds());
    provideHtmlMemo(createHtmlMemo());

    /** How long the pointer rests before the Full Screen control goes. */
    const POINTER_REST_MS = 2000;

    /** How far the window may fall short of the screen and still fill it, in px. */
    const SCREEN_SLACK = 1;

    let deck = $state<Deck | null>(null);
    let key = $state('');
    let ended = $state(false);
    let full = $state(false);
    let resting = $state(false);
    /** Whether the page may close its own window: a browser opened it, or the desktop host did. */
    let closable = $state(false);

    const shown = $derived(deck === null ? null : slideAt(deck.slides, key));

    let channel: BroadcastChannel | null = null;
    let name = '';
    let ref: DeckRef = { root: '', path: '' };
    /** The kept list of the presenting pane's filter; undefined until the screen has said it. */
    let keep: readonly string[] | null | undefined = undefined;
    /** The presenting pane's Project facts toggle, on until the screen has said otherwise. */
    let facts = $state(true);
    /** How many reads the page has asked for, so only the last one's answer is drawn. */
    let reads = 0;
    /** Whether the page is going on purpose, so the presenter screen is not told it closed. */
    let leaving = false;
    let restTimer: ReturnType<typeof setTimeout> | undefined;

    /** Whether the window is the document's full-screen element or fills the screen. */
    function filling(): boolean {
        return (
            document.fullscreenElement !== null ||
            (Math.abs(window.innerWidth - screen.width) <= SCREEN_SLACK &&
                Math.abs(window.innerHeight - screen.height) <= SCREEN_SLACK)
        );
    }

    function syncFull(): void {
        full = filling();
    }

    /** Show the Full Screen control, and take it away again once the pointer has rested. */
    function rouse(): void {
        clearTimeout(restTimer);
        resting = false;
        restTimer = setTimeout(() => (resting = true), POINTER_REST_MS);
    }

    function toggleFull(): void {
        const request =
            document.fullscreenElement === null
                ? document.documentElement.requestFullscreen()
                : document.exitFullscreen();
        request.catch(() => undefined);
    }

    /** The page's one reload on a failed read is kept in the tab, under the deck's name. */
    function reloaded(): boolean {
        try {
            return sessionStorage.getItem(name) !== null;
        } catch {
            return true;
        }
    }

    function mark(on: boolean): void {
        try {
            if (on) sessionStorage.setItem(name, '');
            else sessionStorage.removeItem(name);
        } catch {
            // A tab that keeps nothing reloads no more than once, since reloaded() says it did.
        }
    }

    function finish(): void {
        ended = true;
        channel?.close();
    }

    /** Read the deck again; a read that fails reloads the page once, and then the page ends. */
    async function read(): Promise<void> {
        if (keep === undefined) return;
        reads += 1;
        const asked = reads;
        const held = await readDeck(ref, data.token, keep);
        if (asked !== reads || ended) return;
        if (typeof held !== 'string' && held.slides.length > 0) {
            mark(false);
            deck = held;
        } else if (reloaded()) {
            // The presenter screen is told the window is gone, so it ends after its wait.
            channel?.postMessage({ kind: 'closed' });
            finish();
        } else {
            mark(true);
            leaving = true;
            location.reload();
        }
    }

    function hear(event: MessageEvent<unknown>): void {
        const message = parseMessage(event.data);
        if (message === null || ended) return;
        if (message.kind === 'slide') key = message.key;
        else if (message.kind === 'changed') void read();
        else if (message.kind === 'keep' && message.at === 0) {
            facts = message.facts;
            if (keep !== undefined && JSON.stringify(message.keep) === JSON.stringify(keep)) return;
            keep = message.keep;
            void read();
        } else if (message.kind === 'left') finish();
        else if (message.kind === 'end') {
            finish();
            if (closable) window.close();
        }
    }

    /** Show a slide and tell the presenter screen. */
    function go(next: string): void {
        key = next;
        channel?.postMessage({ kind: 'move', key: next });
    }

    function inControl(target: EventTarget | null): boolean {
        return target instanceof Element && target.closest(CONTROLS) !== null;
    }

    function keys(event: KeyboardEvent): void {
        if (ended || deck === null || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'f' || event.key === 'F') {
            event.preventDefault();
            if (!event.repeat) toggleFull();
            return;
        }
        const move = moveOf(event);
        if (move === null || (event.key === ' ' && inControl(event.target))) return;
        event.preventDefault();
        if (event.key !== ' ' || !event.repeat) go(movedKey(deck.slides, key, move));
    }

    /** A click on the slide shows the next one, except on a control of the slide or a selection. */
    function advance(event: MouseEvent): void {
        if (ended || deck === null || inControl(event.target)) return;
        if (window.getSelection()?.isCollapsed === false) return;
        go(stepKey(deck.slides, key, 1));
    }

    $effect(() => {
        // Read inside the effect, the text size is drawn again whenever the page's config is
        // installed anew.
        const scale = String(configuredLook().textSize);
        document.documentElement.style.setProperty('--text-scale', scale);
    });

    onMount(() => {
        void drawConfiguredTheme(document, desktopOf(window, '') !== undefined, data.appThemes);
        const asked = new URLSearchParams(window.location.search);
        ref = { root: asked.get('root') ?? '', path: asked.get('path') ?? '' };
        name = presentName(ref);
        closable = window.opener !== null || desktopOf(window, '') !== undefined;
        syncFull();
        rouse();
        channel = new BroadcastChannel(name);
        channel.onmessage = hear;
        // The presenter screen holds the lock while it presents, so the request waits until it is
        // gone; with no presenter screen at all the page is granted it at once and says so.
        void navigator.locks.request(name, finish);
        channel.postMessage({ kind: 'opened' });
        channel.postMessage({ kind: 'keep-asked', from: 'audience' });
        const closed = (): void => {
            if (!leaving && !ended) channel?.postMessage({ kind: 'closed' });
        };
        window.addEventListener('pagehide', closed);
        return () => {
            window.removeEventListener('pagehide', closed);
            clearTimeout(restTimer);
            channel?.close();
        };
    });
</script>

<svelte:head>
    <title
        >{deck === null ? t('present.title') : t('present.audience_title', deckLabel(deck))}</title
    >
</svelte:head>

<svelte:window onkeydown={keys} onresize={syncFull} onpointermove={rouse} />
<svelte:document onfullscreenchange={syncFull} />

<div
    class="show"
    data-audience
    data-ended={ended ? '' : undefined}
    data-slide-key={shown?.key ?? ''}
>
    {#if ended}
        <div class="ended">
            <p>{t('present.audience_ended')}</p>
            {#if closable}
                <ToolButton label={t('present.audience_close')} onclick={() => window.close()} />
            {:else}
                <p>{t('present.audience_close_tab')}</p>
            {/if}
        </div>
    {:else if deck === null || shown === null}
        <p class="loading">{t('present.loading')}</p>
    {:else}
        <!-- A click on the slide is the reader's way to the next one; the keys are the page's. -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="slide" onclick={advance}>
            <Stage bare={full}>
                <Slide row={shown} {deck} {facts} />
            </Stage>
        </div>
        {#if !full && !resting}
            <div class="control">
                <ToolButton
                    label={t('present.audience_full')}
                    title={t('present.audience_full_tip')}
                    onclick={toggleFull}
                />
            </div>
        {/if}
    {/if}
</div>

<style>
    .show {
        position: fixed;
        inset: 0;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
    }

    .slide {
        width: 100%;
        height: 100%;
    }

    .control {
        position: absolute;
        top: 8px;
        right: 8px;
    }

    .ended,
    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        height: 100%;
        margin: 0;
        font-size: var(--fs-2xl);
    }

    .ended p {
        margin: 0;
    }
</style>
