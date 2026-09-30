<script lang="ts">
    // Layer 3, view partial. The find bar over a terminal grid's top right, as VS Code's terminal
    // find widget draws one: the text box, the Match Case, Match Whole Word and Use Regular
    // Expression toggles, the count, Previous, Next and Close, inside the floating frame of
    // ui/frame/FloatingBar.svelte, which paints the surface. It holds nothing of its own: the
    // grid keeps the text, the toggles and the search addon, so a search, the count and the marks
    // stay with the grid while the bar is closed and opened again.
    //
    // Its keys are read before the text box's own (a capture listener on the bar), by the table
    // the grid's keys go by (terminal-list.ts, `findKey`): Enter and Shift+Enter move between the
    // matches, and Escape closes the bar where the box alone would clear its text. The box takes
    // the focus, its text selected, each time the bar is asked for.

    import FloatingBar from '$lib/ui/frame/FloatingBar.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        findCount,
        findKey,
        type FindAction,
        type FindResults,
        type FindToggles
    } from '../terminal-list';

    type Props = {
        /** The text searched for. */
        term: string;
        /** The three toggles the search runs with. */
        toggles: FindToggles;
        /** What the last search reported, or null before one. */
        results: FindResults | null;
        /** Whether the page runs on macOS, where the modifier of the find keys is Cmd. */
        mac: boolean;
        /** How many times the bar was asked for; each new ask puts the focus in its box. */
        asked: number;
        /** The text as typed. */
        onterm: (term: string) => void;
        /** The toggles after one was pressed. */
        ontoggles: (toggles: FindToggles) => void;
        /** A find key or a press of Previous, Next or Close. */
        onaction: (action: FindAction) => void;
    };

    let { term, toggles, results, mac, asked, onterm, ontoggles, onaction }: Props = $props();

    /** The toggles in the order the bar draws them, each with its name, its words and its mark. */
    const toggleRows: { name: keyof FindToggles; label: string; mark: string }[] = $derived([
        { name: 'matchCase', label: t('sessions.find_case'), mark: t('sessions.find_case_mark') },
        { name: 'wholeWord', label: t('sessions.find_word'), mark: t('sessions.find_word_mark') },
        { name: 'regex', label: t('sessions.find_regex'), mark: t('sessions.find_regex_mark') }
    ]);

    /** The bar, whose text box takes the focus when the bar is asked for. */
    let bar = $state<HTMLDivElement | null>(null);

    $effect(() => {
        if (asked < 1) return;
        const box = bar?.querySelector('input');
        box?.focus();
        box?.select();
    });

    function pressed(event: KeyboardEvent): void {
        const action = findKey(event, { mac, where: 'bar', open: true });
        if (action === null) return;
        event.preventDefault();
        event.stopPropagation();
        onaction(action);
    }

    function flip(name: keyof FindToggles): void {
        ontoggles({ ...toggles, [name]: !toggles[name] });
    }
</script>

<!-- The bar reads its keys before the text box does; each control in it is a button or a box. -->
<FloatingBar>
    <div
        class="find"
        role="search"
        aria-label={t('sessions.find_bar')}
        data-terminal-find
        bind:this={bar}
        onkeydowncapture={pressed}
    >
        <Search value={term} placeholder={t('sessions.find_input')} oninput={onterm} />
        {#each toggleRows as toggle (toggle.name)}
            <ToolButton
                label={toggle.label}
                title={toggle.label}
                pressed={toggles[toggle.name]}
                onclick={() => flip(toggle.name)}
            >
                <span class="mark">{toggle.mark}</span>
            </ToolButton>
        {/each}
        <span class="count" aria-live="polite" data-find-count>
            {findCount(results, t)}
        </span>
        <ToolButton
            label={t('sessions.find_previous')}
            glyph="prev_change"
            compact
            onclick={() => onaction('previous')}
        />
        <ToolButton
            label={t('sessions.find_next')}
            glyph="next_change"
            compact
            onclick={() => onaction('next')}
        />
        <ToolButton
            label={t('sessions.find_close')}
            glyph="dismiss"
            compact
            onclick={() => onaction('close')}
        />
    </div>
</FloatingBar>

<style>
    .find {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .mark {
        font-family: var(--font-mono);
    }

    .count {
        min-width: 7em;
        padding: 0 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        white-space: nowrap;
    }
</style>
