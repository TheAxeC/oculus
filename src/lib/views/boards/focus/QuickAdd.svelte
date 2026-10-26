<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. Quick add: a follow-up note, a
    // subtask or a deadline on a project or an entry of a collection, without opening it first.
    //
    // A press opens the kind and record dropdowns and the add form under them
    // (views/shared/forms/dated/RecordPick.svelte), which writes through
    // state/client/writes.svelte.ts like every other write on this board and says the answer on
    // the board's outcome line; a second press of the same control closes it. The form is inline
    // rather than a dialog: a dialog over a board whose whole point is one glance costs the glance.
    // Escape closes it, and acts only while the form is on screen: a pane keeps the view of a tab
    // it hides mounted, and a key pressed in another tab is not one this form was asked to answer.
    //
    // Over a wallpaper the label and the controls are read off a `Surface`.

    import Surface from '$lib/ui/frame/Surface.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RecordPick from '$lib/views/shared/forms/dated/RecordPick.svelte';
    import type { DatedKind } from '$lib/views/shared/card/record/record-menu';
    import type { Project } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The projects the form may write to, already filtered to the live ones by the board. */
        projects: Project[];
        /** What the write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { projects, onsaid }: Props = $props();

    /** What the open form adds, and nothing when no form is open. */
    let kind = $state<DatedKind | null>(null);
    let box: HTMLElement | undefined = $state();

    function toggle(next: DatedKind): void {
        kind = kind === next ? null : next;
    }

    function keyed(event: KeyboardEvent): void {
        if (event.key === 'Escape' && kind !== null && box?.checkVisibility() === true) kind = null;
    }
</script>

<svelte:window onkeydown={keyed} />

<Surface>
    <section class="qa" bind:this={box}>
        <div class="bar">
            <span class="lbl">{t('focus.quick_add')}</span>
            <ToolButton
                label={t('focus.add_followup')}
                active={kind === 'followup'}
                onclick={() => toggle('followup')}
            />
            <ToolButton
                label={t('focus.add_subtask')}
                active={kind === 'subtask'}
                onclick={() => toggle('subtask')}
            />
            <ToolButton
                label={t('focus.add_deadline')}
                active={kind === 'deadline'}
                onclick={() => toggle('deadline')}
            />
        </div>

        {#if kind !== null}
            <RecordPick {kind} {projects} {onsaid} onclose={() => (kind = null)} />
        {/if}
    </section>
</Surface>

<style>
    .qa {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }
</style>
