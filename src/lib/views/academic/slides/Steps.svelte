<script lang="ts">
    // Layer 3, view part. The two step controls of a row of the Slides view: move the row one place
    // earlier or one place later. A row moved to either end disables the control that moved it, and
    // the keyboard would be left on a control that takes no press, so the focus goes to the other
    // control once the update has been drawn.

    import { tick } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    let {
        at,
        count,
        title,
        onstep
    }: {
        /** The row's place in its list, from 0. */
        at: number;
        /** How many rows the list holds. */
        count: number;
        /** The words the row is named by in a control's tooltip. */
        title: string;
        /** The place the row is to take. */
        onstep: (to: number) => void;
    } = $props();

    /** Step to a place and keep the keyboard where it is when the pressed control is disabled. */
    async function step(event: MouseEvent, to: number, other: 'up' | 'down'): Promise<void> {
        const ends = other === 'down' ? to === 0 : to === count - 1;
        const pressed = event.currentTarget;
        onstep(to);
        if (!ends || !(pressed instanceof HTMLElement)) return;
        await tick();
        const row = pressed.closest('[role="listitem"]');
        const next = row?.querySelector(`[data-step="${other}"] button`);
        if (next instanceof HTMLElement) next.focus();
    }
</script>

<span class="steps">
    <span data-step="up">
        <ToolButton
            small
            label={t('slides.up')}
            title={t('slides.up_tip', title)}
            disabled={at === 0}
            onclick={(event: MouseEvent) => void step(event, at - 1, 'down')}
        />
    </span>
    <span data-step="down">
        <ToolButton
            small
            label={t('slides.down')}
            title={t('slides.down_tip', title)}
            disabled={at === count - 1}
            onclick={(event: MouseEvent) => void step(event, at + 1, 'up')}
        />
    </span>
</span>

<style>
    .steps {
        display: flex;
        flex: none;
        align-items: center;
        gap: 4px;
    }
</style>
