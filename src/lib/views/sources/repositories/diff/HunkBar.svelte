<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/DiffSection.svelte. The bar above one
    // hunk of a file's diff: git's hunk head and the actions the file allows, Stage Block and
    // Revert Block, or Unstage Block in a staged diff, each over the lines the selections choose
    // in that hunk while they choose any (`count`). A file with no block actions draws the
    // sentence that says where to act on it instead, or, for a path in conflict, where to resolve
    // it. What the buttons do is the section's: the bar reports the press. A diff against the
    // original an app's source control gives also draws the actions of the app's `scm/change/title`
    // menu before them.
    //
    // The bar sits inside the editor's own width, left of its scrollbar and overview ruler, which
    // a narrow pane makes less than the buttons' words need. The bar keeps the width its buttons
    // took with their words when it last drew them so, and draws them `compact` (the glyph alone,
    // the words as the tooltip and the accessible name) while its own width, as a ResizeObserver
    // reports it, is less than that width and room for the head's first characters. It draws their
    // words again once the bar is wide enough. The head and the sentence are cut with an ellipsis
    // inside the bar, the sentence with its whole words as the tooltip.

    import type { Attachment } from 'svelte/attachments';
    import { untrack } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import ActionStrip, { type StripAction } from '$lib/ui/tabs/ActionStrip.svelte';
    import Tooltip from '$lib/ui/menu/Tooltip.svelte';
    import {
        hunkHead,
        type DiffActions,
        type Hunk
    } from '$lib/state/sources/repositories/diff/diff-hunks';
    import type { PatchMode } from '$lib/state/sources/repositories/diff/diff-patch';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The hunk, whose head the bar says as git writes it, `@@ -a,b +c,d @@`. */
        hunk: Hunk;
        /** How many lines each side of the file holds, which the head's context stays inside. */
        sides: { original: number; modified: number };
        /** The hunk's place in the file, which the bar's ids carry. */
        at: number;
        /** The bar's id among the pane's bars: the file's place and the hunk's. */
        id: string;
        /** The actions the file allows, or `read` for a diff nothing may act on. */
        actions: DiffActions | 'read';
        /** How many selected lines the bar acts on, 0 while the selections choose none here. */
        count: number;
        /** Whether the file's path is in conflict, which is settled in the merge editor. */
        conflicted: boolean;
        staged: boolean;
        busy: boolean;
        /** Whether the pane is at this hunk. */
        current: boolean;
        /** A button was pressed. */
        onact: (mode: PatchMode) => void;
        /** The actions an app's source control offers on the change (`scm/change/title`). */
        offered?: StripAction[];
        /** One of the offered actions was pressed. */
        onoffer?: (id: string, event: MouseEvent) => void;
    };

    let {
        hunk,
        sides,
        at,
        id,
        actions,
        count,
        conflicted,
        staged,
        busy,
        current,
        onact,
        offered = [],
        onoffer
    }: Props = $props();

    /** The hunk's head in git's words, its context widened inside each side's lines. */
    const head = $derived.by(() => {
        const span = hunkHead(hunk, sides.original, sides.modified);
        return t(
            'repositories.hunk_head',
            span.oldStart,
            span.oldCount,
            span.newStart,
            span.newCount
        );
    });

    /** The width the bar keeps for the head's first characters, its padding and gaps with them. */
    const ROOM = 96;

    type Button = { mode: PatchMode; label: string; glyph: string };

    const buttons = $derived<Button[]>(
        actions === 'read' || actions === 'none'
            ? []
            : staged
              ? [
                    {
                        mode: 'unstage',
                        label:
                            count === 1
                                ? t('repositories.lines_unstage_one')
                                : count > 1
                                  ? t('repositories.lines_unstage', count)
                                  : t('repositories.hunk_unstage'),
                        glyph: 'unstage'
                    }
                ]
              : [
                    {
                        mode: 'stage',
                        label:
                            count === 1
                                ? t('repositories.lines_stage_one')
                                : count > 1
                                  ? t('repositories.lines_stage', count)
                                  : t('repositories.hunk_stage'),
                        glyph: 'stage'
                    },
                    {
                        mode: 'revert',
                        label:
                            count === 1
                                ? t('repositories.lines_revert_one')
                                : count > 1
                                  ? t('repositories.lines_revert', count)
                                  : t('repositories.hunk_revert'),
                        glyph: 'note_back'
                    }
                ]
    );
    const sentence = $derived(
        actions === 'none'
            ? conflicted
                ? t('repositories.diff_conflicted')
                : staged
                  ? t('repositories.diff_whole_staged')
                  : t('repositories.diff_whole')
            : ''
    );

    /** The bar's own width. */
    let width = $state(0);
    let group: HTMLElement | undefined = $state();
    /** The width the buttons took with their words, and the words it was taken for. */
    let took = $state({ words: '', width: 0 });

    const words = $derived(buttons.map((button) => button.label).join('\n'));
    const compact = $derived(took.words === words && width > 0 && width < took.width + ROOM);

    /** Note the width of the buttons while they are drawn with their words. */
    function measure(node: HTMLElement): void {
        const next = { words, width: node.offsetWidth };
        const held = untrack(() => took);
        if (held.words !== next.words || held.width !== next.width) took = next;
    }

    $effect(() => {
        if (group === undefined || compact || buttons.length === 0) return;
        measure(group);
    });

    /** The bar's width, kept as the editor lays the bar out and the pane is resized. */
    const watch: Attachment<HTMLElement> = (node) => {
        width = node.offsetWidth;
        if (typeof ResizeObserver === 'undefined') return;
        const seen = new ResizeObserver(() => {
            width = node.offsetWidth;
        });
        seen.observe(node);
        return () => seen.disconnect();
    };

    /** The buttons' width, kept as their words are drawn at another size. */
    const watchGroup: Attachment<HTMLElement> = (node) => {
        if (typeof ResizeObserver === 'undefined') return;
        const seen = new ResizeObserver(() => {
            if (!compact) measure(node);
        });
        seen.observe(node);
        return () => seen.disconnect();
    };
</script>

<div class="hunk" class:current data-hunk={at} data-hunk-id={id} {@attach watch}>
    <span class="head">{head}</span>
    {#if sentence !== ''}
        <Tooltip text={sentence}>
            <span class="whole">{sentence}</span>
        </Tooltip>
    {/if}
    {#if offered.length > 0}
        <ActionStrip
            label={t('repositories.app_change_actions')}
            actions={offered}
            onpick={(pick: string, event: MouseEvent) => onoffer?.(pick, event)}
        />
    {/if}
    {#if buttons.length > 0}
        <span class="buttons" bind:this={group} {@attach watchGroup}>
            {#each buttons as button (button.mode)}
                <ToolButton
                    label={button.label}
                    glyph={button.glyph}
                    {compact}
                    disabled={busy}
                    onclick={() => onact(button.mode)}
                />
            {/each}
        </span>
    {/if}
</div>

<style>
    .hunk {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 1px 6px;
        border-top: 1px solid var(--line);
        background: var(--chip);
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    .hunk.current {
        border-top-color: var(--accent);
    }

    /* The head gives way first, cut with an ellipsis, and the buttons keep the room they need. */
    .head {
        min-width: 0;
        margin-right: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-mono);
    }

    /* The sentence of a file with no block actions is cut inside the bar. */
    .whole {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .buttons {
        display: flex;
        flex: none;
        align-items: center;
        gap: 6px;
    }

    /* Over a wallpaper the bar is read off its file's section, the surface
       (diff/DiffSection.svelte), and paints nothing of its own. */
    :global(body.wall) .hunk {
        background: transparent;
    }
</style>
