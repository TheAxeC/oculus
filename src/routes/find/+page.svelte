<script lang="ts">
    // Layer 3, route. The find bar of the desktop app: a page of its own that the app lays over a
    // window's top right as a view of its own, since the browser's find counts the text of a box in
    // the page it searches and a bar in the window's document would be counted as a match of the
    // query it holds. It draws the query box, the count `{0} of {1}`, previous, next, match case
    // and close, from the primitives and the catalog's words, in the window's theme, and holds no
    // client state, socket or rail: the app runs the find (`find`, `stopFind`, `closeFind` of the
    // bridge) on the window's page and tells this page the count (`on('found', ...)`).
    //
    // Enter finds the next match and Shift+Enter the previous one, Escape closes the bar, which
    // gives the keyboard back to the window's page.

    import { onMount } from 'svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { savedTheme, themeClass } from '$lib/state/shared/words/appearance';
    import { t } from '$lib/state/shared/words/text';
    import { createTipIds, provideTipIds } from '$lib/ui/menu/tip-ids';
    import { applyTheme } from '$lib/ui/theme';
    import { desktopOf } from '$lib/state/shared/stores/desktop';

    provideTipIds(createTipIds());

    const bridge = typeof window === 'undefined' ? undefined : desktopOf(window, '')?.bridge;

    let query = $state('');
    let matchCase = $state(false);
    let active = $state(0);
    let matches = $state(0);
    let input = $state<HTMLInputElement | null>(null);

    /** Run the find: a new query starts one, a step continues it. */
    function find(forward: boolean, fresh: boolean): void {
        bridge?.find(query, { forward, matchCase, fresh });
    }

    function typed(value: string): void {
        query = value;
        find(true, true);
    }

    function toggled(): void {
        matchCase = !matchCase;
        find(true, true);
    }

    function keys(event: KeyboardEvent): boolean {
        if (event.key === 'Enter') {
            find(!event.shiftKey, false);
            return true;
        }
        if (event.key === 'Escape') {
            bridge?.closeFind();
            return true;
        }
        return false;
    }

    onMount(() => {
        const theme = savedTheme(localStorage.getItem('oculus.ui.v1'));
        applyTheme(document, themeClass(theme), false);
        input?.focus();
        const stop = [
            bridge?.on('found', (count) => {
                active = count.active;
                matches = count.matches;
            }),
            bridge?.on('shown', () => {
                input?.focus();
                input?.select();
            })
        ];
        return () => stop.forEach((one) => one?.());
    });
</script>

<div class="bar">
    <Search
        value={query}
        placeholder={t('desktop.find.placeholder')}
        oninput={typed}
        onkey={keys}
        bind:input
        fill
    />
    <span class="count" aria-live="polite"
        >{query === '' ? '' : t('desktop.find.count', active, matches)}</span
    >
    <ToolButton label={t('desktop.find.case')} pressed={matchCase} onclick={toggled}>
        {t('desktop.find.case_mark')}
    </ToolButton>
    <ToolButton
        label={t('desktop.find.previous')}
        glyph="prev_change"
        compact
        onclick={() => find(false, false)}
    />
    <ToolButton
        label={t('desktop.find.next')}
        glyph="next_change"
        compact
        onclick={() => find(true, false)}
    />
    <ToolButton
        label={t('desktop.find.close')}
        glyph="dismiss"
        compact
        onclick={() => bridge?.closeFind()}
    />
</div>

<style>
    .bar {
        display: flex;
        align-items: center;
        gap: 6px;
        box-sizing: border-box;
        width: 100vw;
        height: 100vh;
        padding: 6px 8px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
    }

    .count {
        min-width: 4.5em;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        text-align: center;
        white-space: nowrap;
    }
</style>
