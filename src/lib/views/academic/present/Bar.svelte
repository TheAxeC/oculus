<script lang="ts">
    // Layer 3, Present partial. The toolbar of the Present pane: the deck menu, the two step
    // buttons, the overview and the full-screen controls, the button that opens the Slides view on
    // this deck, the Export to PDF button, the status line of the last slide act, and the place in
    // the deck. It holds no state of its own; Present.svelte owns the deck and the position and
    // hands each action in.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { DeckChoice } from '$lib/state/life/present';

    type Props = {
        choices: DeckChoice[];
        /** The menu id of the deck on screen. */
        chosen: string;
        onchoose: (id: string) => void;
        /** How many slides the deck holds, and the 1-based place of the one shown (0 for none). */
        count: number;
        at: number;
        overview: boolean;
        full: boolean;
        onstep: (by: number) => void;
        onoverview: () => void;
        onpresent: () => void;
        onslides: () => void;
        onexport: () => void;
        /** What the last act of a slide came to, empty for none. */
        said: string;
    };

    let {
        choices,
        chosen,
        onchoose,
        count,
        at,
        overview,
        full,
        onstep,
        onoverview,
        onpresent,
        onslides,
        onexport,
        said
    }: Props = $props();
</script>

<Toolbar label={t('present.toolbar')}>
    <Select value={chosen} label={t('present.deck_menu')} {choices} onchange={onchoose} />
    <ToolButton label={t('present.previous')} onclick={() => onstep(-1)} disabled={count === 0} />
    <ToolButton label={t('present.next')} onclick={() => onstep(1)} disabled={count === 0} />
    <Chip
        label={t('present.overview')}
        glyph={t('present.overview_glyph')}
        pressed={overview}
        onclick={onoverview}
    />
    <ToolButton
        label={t('present.present')}
        title={t('present.present_tip')}
        pressed={full}
        active={full}
        onclick={onpresent}
        disabled={count === 0}
    />
    <ToolButton label={t('slides.open')} title={t('slides.open_tip')} onclick={onslides} />
    <ToolButton
        label={t('present.export')}
        title={t('present.export_tip')}
        onclick={onexport}
        disabled={count === 0}
    />
    <span class="said" role="status">{said}</span>
    <span class="counter">{t('present.counter', String(at), String(count))}</span>
</Toolbar>

<style>
    /* The status line takes the room between the controls and the place in the deck. */
    .said {
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The place in the deck closes the bar. */
    .counter {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
