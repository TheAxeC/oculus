<script module lang="ts">
    // Layer 3, partial support. What one side of the merge editor is handed per conflict.
    import type { Choice, Span } from '$lib/state/sources/repositories/diff/merge-regions';

    /** One conflict as this side draws it: where its lines are here and how it is settled. */
    export type SideConflict = { region: number; span: Span; choice: Choice };
</script>

<script lang="ts">
    // Layer 3, partial of views/sources/repositories/merge/Merge.svelte. One input of the three-way
    // merge editor, Incoming or Current: the whole version git holds for that side in a read-only
    // Monaco editor (ui/controls/editor/Editor.svelte), each conflict's lines tinted, and above
    // each conflict a code lens line with the choices this side offers for it (this side's lines,
    // both with this side's first, or neither), drawn as VS Code's merge editor draws them: small
    // links separated by bars. A conflict with no lines on this side draws its line where its lines
    // would sit and tints none. A conflict already settled says how, and one still open has its
    // line marked in the conflict colour, so the reader sees at a glance which are left.
    import Editor from '$lib/ui/controls/editor/Editor.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Which input this is, which picks its words and the choices it offers. */
        side: 'incoming' | 'current';
        text: string;
        conflicts: SideConflict[];
        /** A name unique to the pane instance and this side, which names the editor's model. */
        model: string;
        path: string;
        language: string;
        look: string;
        codeTheme: string;
        onchoose: (region: number, choice: Choice) => void;
    };

    let { side, text, conflicts, model, path, language, look, codeTheme, onchoose }: Props =
        $props();

    /** Each conflict's bar, above its first line here (a span counts lines from 0). */
    const bars = $derived(
        conflicts.map((one) => ({ id: String(one.region), after: one.span.start }))
    );
    const highlights = $derived(
        conflicts
            .filter((one) => one.span.count > 0)
            .map((one) => ({ line: one.span.start + 1, count: one.span.count }))
    );

    /** The choices this side offers for a conflict, in the order VS Code's code lens lists them. */
    const offered = $derived<{ choice: Choice; label: string; title?: string }[]>([
        side === 'incoming'
            ? { choice: 'incoming', label: t('repositories.accept_incoming') }
            : { choice: 'current', label: t('repositories.accept_current') },
        side === 'incoming'
            ? { choice: 'both-incoming', label: t('repositories.accept_both_incoming') }
            : { choice: 'both-current', label: t('repositories.accept_both_current') },
        {
            choice: 'base',
            label: t('repositories.accept_none'),
            title: t('repositories.accept_none_title')
        }
    ]);

    /** The words saying how a conflict is settled, the empty string for one still open. */
    function settledAs(choice: Choice): string {
        if (choice === 'incoming') return t('repositories.merge_took_incoming');
        if (choice === 'current') return t('repositories.merge_took_current');
        if (choice === 'both-current' || choice === 'both-incoming') {
            return t('repositories.merge_took_both');
        }
        if (choice === 'base') return t('repositories.merge_took_none');
        if (choice === 'edited') return t('repositories.merge_took_edited');
        return '';
    }
</script>

{#snippet conflictBar(id: string)}
    {@const conflict = conflicts.find((one) => String(one.region) === id)}
    {#if conflict !== undefined}
        {@const said = settledAs(conflict.choice)}
        <div class="lens" class:open={said === ''} data-conflict={conflict.region}>
            <div class="choices">
                {#each offered as one (one.choice)}
                    <span class="choice">
                        <span class="sep" aria-hidden="true">{t('sessions.meta_sep')}</span>
                        <span class="link">
                            <ToolButton
                                plain
                                label={one.label}
                                title={one.title}
                                onclick={() => onchoose(conflict.region, one.choice)}
                            />
                        </span>
                    </span>
                {/each}
                {#if said !== ''}
                    <span class="choice said">{said}</span>
                {/if}
            </div>
        </div>
    {/if}
{/snippet}

<section class="side" data-merge-side={side}>
    <p class="head">
        {side === 'incoming' ? t('repositories.merge_incoming') : t('repositories.merge_current')}
    </p>
    <div class="text">
        <Editor
            {text}
            {language}
            writable={false}
            {model}
            {path}
            {look}
            {codeTheme}
            {highlights}
            {bars}
            bar={conflictBar}
        />
    </div>
</section>

<style>
    .side {
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
    }

    .head {
        margin: 0 0 2px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
    }

    .text {
        flex: 1 1 auto;
        min-height: 0;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }

    /* VS Code's code lens: a line of small muted words above the conflict, each choice a link
       that takes the link colour and an underline under the pointer, the choices parted by bars.
       Each choice is one box with the bar before it, as wide as its words, so no box is ever
       narrower than the words it holds and none is drawn over the next: the line wraps between
       choices where the column is narrower than it, and a choice wider than the whole column
       wraps its own words. The row of choices starts one bar's width left of the lens and the
       lens clips it, so the bar of the choice that starts a line is never drawn, and a bar never
       stands alone on a line or starts one. The line's room in the editor grows with its lines. The
       line of a conflict still open carries a bar of the conflict colour at its start, as VS
       Code's merge editor marks an unhandled conflict; a settled one keeps the bar's room, so the
       choices of both stand at one place. The bar is a border of the line's own box, so it takes
       no room from the choices and lies on whatever the editor draws under it, a wallpaper
       theme's included. */
    .lens {
        display: block;
        padding: 2px 6px 0 4px;
        border-left: 2px solid transparent;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        line-height: 1.4;
        white-space: normal;
        overflow: hidden;
    }

    .choices {
        --sep-room: 13px;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        margin-left: calc(-1 * var(--sep-room));
    }

    .choice {
        display: inline-flex;
        align-items: baseline;
        min-width: 0;
        max-width: 100%;
    }

    .lens.open {
        border-left-color: var(--c-scm-conflict);
    }

    .link {
        display: inline-block;
        min-width: 0;
        max-width: 100%;
        vertical-align: baseline;
        overflow-wrap: anywhere;
    }

    /* The choice is a plain button, which takes this box's colour. The button is an atomic
       inline box, which an underline of this box does not reach, so the button carries it. */
    .link:hover,
    .link:has(:global(:focus-visible)) {
        color: var(--accent-txt, var(--accent));
    }

    .link:hover :global(button),
    .link :global(button:focus-visible) {
        text-decoration: underline;
    }

    .sep {
        flex: none;
        width: var(--sep-room);
        text-align: center;
        opacity: 0.7;
    }

    .said {
        padding-left: var(--sep-room);
        font-style: italic;
    }
</style>
