<script lang="ts">
    // Layer 3, Present partial. The presenter screen: what the reader sees while the audience sees
    // the slide alone in a window of its own. The slide on show is large, with the next slide
    // smaller, or a sentence after the last, and the notes of the slide on show as plain text,
    // scrolling when long. Above them sit the place in the deck, the time of day, a timer that
    // counts from the press that started the presentation, with Pause, Resume and Reset, and the
    // End control.
    //
    // Under the meters one grid holds the slide on show and the side, so the next slide's room is
    // no wider and no taller than the current slide's at every pane size. In a pane of 596 px or
    // more (the screen's content width of 572 px, the size container being the screen) the slide
    // and the side are columns of 3fr and 1fr in one row, and the side holds the next slide and the
    // notes in rows of 3fr and 2fr. Below it the slide and the side are rows of 3fr and 2fr, and
    // the side's row holds the next slide and the notes as two equal columns. The notes keep their
    // share and their scrolling at every size.
    //
    // The component holds no state of the deck or the presentation: Present.svelte hands in the
    // slides, the timer and what each control does. A click on the slide on show moves to the next
    // slide; a click on the next slide or on the notes does nothing. Only the clock and the timer
    // are read again on a tick of their own. Both slides are drawn in the slide's shape, each at
    // the largest box of it its room holds, and measured (screen/Framed.svelte); both draw the
    // strip of a project's facts by the pane's Project facts toggle (`facts`).
    //
    // Over a wallpaper each slide's frame is its own surface, and the meters, the captions, the
    // end-of-deck line and the notes are read off a `Surface`.

    import Surface from '$lib/ui/frame/Surface.svelte';
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
    import Framed from '../screen/Framed.svelte';

    type Props = {
        /** The slide on show, and the one after it (null after the last). */
        row: DeckSlide;
        next: DeckSlide | null;
        deck: Deck;
        /** Whether the strip of a project's facts shows its words: the pane's toggle. */
        facts: boolean;
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

    let {
        row,
        next,
        deck,
        facts,
        at,
        count,
        timer,
        onadvance,
        onpause,
        onresume,
        onreset,
        onend
    }: Props = $props();

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
        <Surface inline>
            <span class="meter" data-counter>{t('present.counter', String(at), String(count))}</span
            >
            <span class="meter" data-clock aria-label={t('present.presenter_clock')}>
                {clockText(new Date(now))}
            </span>
            <span class="meter" data-timer aria-label={t('present.presenter_timer')}
                >{timerText(spent)}</span
            >
        </Surface>
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
    <div class="slides">
        <!-- A click on the slide is the way to the next one; the keys are the pane's own. -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="current" data-current onclick={onadvance}>
            <Framed {row} {deck} {facts} />
        </div>
        <div class="side">
            <section class="next" data-next aria-label={t('present.presenter_next')}>
                <Surface>
                    <h3 class="caption">{t('present.presenter_next')}</h3>
                    {#if next === null}
                        <p class="done">{t('present.presenter_end_of_deck')}</p>
                    {/if}
                </Surface>
                {#if next !== null}
                    <div class="preview">
                        <Framed row={next} {deck} {facts} />
                    </div>
                {/if}
            </section>
            <section class="notes" aria-label={t('present.presenter_notes')}>
                <Surface>
                    <h3 class="caption">{t('present.presenter_notes')}</h3>
                </Surface>
                <div class="text" data-notes>
                    <Surface>
                        {#if notes === ''}
                            <p class="none">{t('present.presenter_no_notes')}</p>
                        {:else}
                            <p class="words">{notes}</p>
                        {/if}
                    </Surface>
                </div>
            </section>
        </div>
    </div>
</div>

<style>
    /* The screen is the size container of the switch below, and the meters stand over the grid of
       the slides. */
    .presenter {
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 12px;
        container-type: size;
    }

    .meters {
        display: flex;
        flex: 0 0 auto;
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

    /* A narrow pane: the slide over the side, the side's cells two equal columns. */
    .slides {
        display: grid;
        flex: 1 1 0;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: minmax(0, 3fr) minmax(0, 2fr);
        gap: 12px;
        min-height: 0;
    }

    .current {
        min-width: 0;
        min-height: 0;
        cursor: pointer;
    }

    .side {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: minmax(0, 1fr);
        gap: 12px;
        min-width: 0;
        min-height: 0;
    }

    /* A pane of 596 px or more, 572 px of content: the side a column beside the slide, its cells
       the next slide over the notes. */
    @container (min-width: 572px) {
        .slides {
            grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
            grid-template-rows: minmax(0, 1fr);
        }

        .side {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: minmax(0, 3fr) minmax(0, 2fr);
        }
    }

    /* The caption over a room for the next slide, which draws the largest box of the slide's shape
       its cell holds. */
    .next {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr);
        min-width: 0;
        min-height: 0;
    }

    .preview {
        min-width: 0;
        min-height: 0;
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

    /* The notes fill their cell, and scroll inside it when they are long. */
    .notes {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
    }

    .text {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        font-size: var(--fs-xl);
    }

    /* The scroller clips what it holds at its padding box, so over a wallpaper it takes the room
       the notes' surface reaches past their words as padding, and gives it back as margin: the
       words stay where they are and their surface is drawn whole. */
    :global(body.wall) .text {
        margin: -4px -8px;
        padding: 4px 8px;
    }
</style>
