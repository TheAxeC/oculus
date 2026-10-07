<script lang="ts">
    // Layer 3, Present partial. The presenter screen: what the reader sees while the audience sees
    // the slide alone in a window of its own. The slide on show is large, with the next slide
    // smaller beside it, or a sentence after the last, and under the next slide the notes of the
    // slide on show as plain text, scrolling when long. Above them sit the place in the deck, the
    // time of day, a timer that counts from the press that started the presentation, with Pause,
    // Resume and Reset, and the End control.
    //
    // The component holds no state of the deck or the presentation: Present.svelte hands in the
    // slides, the timer and what each control does. A click on the slide on show moves to the next
    // slide; a click on the next slide or on the notes does nothing. Only the clock and the timer
    // are read again on a tick of their own.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import {
        clockText,
        timerElapsed,
        timerText,
        type Deck,
        type DeckSlide,
        type Timer
    } from '$lib/state/life/present';
    import { t } from '$lib/state/shared/words/text';
    import Slide from '../Slide.svelte';
    import Stage from '../screen/Stage.svelte';

    type Props = {
        /** The slide on show, and the one after it (null after the last). */
        row: DeckSlide;
        next: DeckSlide | null;
        deck: Deck;
        /** The 1-based place of the slide on show, and how many slides the deck holds. */
        at: number;
        count: number;
        /** The presentation's timer, null once the presentation has ended. */
        timer: Timer | null;
        /** A click on the slide on show. */
        onadvance: (event: MouseEvent) => void;
        onpause: () => void;
        onresume: () => void;
        onreset: () => void;
        onend: () => void;
    };

    let { row, next, deck, at, count, timer, onadvance, onpause, onresume, onreset, onend }: Props =
        $props();

    /** How often the clock and the timer are read again. */
    const TICK_MS = 250;

    let now = $state(Date.now());

    $effect(() => {
        const tick = setInterval(() => (now = Date.now()), TICK_MS);
        return () => clearInterval(tick);
    });

    const running = $derived(timer !== null && timer.since !== null);
    const spent = $derived(timer === null ? 0 : timerElapsed(timer, now));
    const notes = $derived(row.notes ?? '');
</script>

<div class="presenter" data-presenter>
    <div class="meters">
        <span class="meter" data-counter>{t('present.counter', String(at), String(count))}</span>
        <span class="meter" data-clock aria-label={t('present.presenter_clock')}>
            {clockText(new Date(now))}
        </span>
        <span class="meter" data-timer aria-label={t('present.presenter_timer')}
            >{timerText(spent)}</span
        >
        {#if running}
            <ToolButton label={t('present.presenter_pause')} onclick={onpause} />
        {:else}
            <ToolButton label={t('present.presenter_resume')} onclick={onresume} />
        {/if}
        <ToolButton label={t('present.presenter_reset')} onclick={onreset} />
        <span class="space"></span>
        <ToolButton
            label={t('present.presenter_end')}
            title={t('present.presenter_end_tip')}
            onclick={onend}
        />
    </div>
    <!-- A click on the slide is the reader's way to the next one; the keys are the pane's own. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="current" data-current onclick={onadvance}>
        <Stage>
            <Slide {row} {deck} first={false} />
        </Stage>
    </div>
    <div class="side">
        <section class="next" data-next aria-label={t('present.presenter_next')}>
            <h3 class="caption">{t('present.presenter_next')}</h3>
            {#if next === null}
                <p class="done">{t('present.presenter_end_of_deck')}</p>
            {:else}
                <div class="preview">
                    <Stage>
                        <Slide row={next} {deck} first={false} />
                    </Stage>
                </div>
            {/if}
        </section>
        <section class="notes" aria-label={t('present.presenter_notes')}>
            <h3 class="caption">{t('present.presenter_notes')}</h3>
            <div class="text" data-notes>
                {#if notes === ''}
                    <p class="none">{t('present.presenter_no_notes')}</p>
                {:else}
                    <p class="words">{notes}</p>
                {/if}
            </div>
        </section>
    </div>
</div>

<style>
    /* The current slide and the side column share a row, and the side column wraps under the
       slide when the pane is too narrow for both, so the slide is never squeezed to nothing. */
    .presenter {
        display: flex;
        flex-wrap: wrap;
        align-content: stretch;
        gap: 12px;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 12px;
    }

    .meters {
        display: flex;
        flex: 1 0 100%;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    }

    .meter {
        white-space: nowrap;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xl);
    }

    .space {
        flex: 1 1 0;
    }

    .current {
        flex: 3 1 320px;
        min-width: 0;
        min-height: 0;
        cursor: pointer;
    }

    .side {
        display: flex;
        flex: 1 1 240px;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        min-height: 0;
    }

    .next {
        flex: 0 0 auto;
    }

    /* The next slide is a 16 by 9 room, which its stage fills and scales its frame to. */
    .preview {
        aspect-ratio: 16 / 9;
        width: 100%;
    }

    .caption {
        margin: 0 0 4px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        font-weight: normal;
    }

    .done,
    .none,
    .words {
        margin: 0;
    }

    .done,
    .none {
        color: var(--muted-txt, var(--muted));
    }

    .words {
        white-space: pre-wrap;
    }

    /* The notes take what the next slide leaves, and scroll inside it when they are long. */
    .notes {
        display: flex;
        flex: 1 1 0;
        flex-direction: column;
        min-height: 0;
    }

    .text {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        font-size: var(--fs-xl);
    }
</style>
