<script lang="ts">
    // Layer 3, shared view. The main files of one LaTeX target, a project or any folder of a served
    // root: one block each (Main.svelte), and the sentence and the retry control of a folder that
    // could not be read. The LaTeX view draws it for a folder and the project tab draws it for the
    // project, so a main file behaves the same in both. Opening the drawing on a folder marks the
    // folder's state held, so the files that changed while nothing watched it are read.

    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { LatexTarget } from '$lib/state/sessions/latex.svelte';
    import { targetKey } from '$lib/state/sessions/terminal/latex-target';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import Main from './Main.svelte';

    type Props = {
        /** The folder whose main files are drawn. */
        target: LatexTarget;
    };

    let { target }: Props = $props();

    const {
        latex: { invalidate, reread, state: latexOf }
    } = useState();

    const held = $derived(latexOf(target));
    const folder = $derived(targetKey(target).join('\n'));

    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- the read is the dependency
        folder;
        untrack(() => reread(target));
    });
</script>

{#if held.error !== ''}
    <Empty error message={t('latex.read_failed', held.error)}>
        {#snippet action()}
            <ToolButton small label={t('latex.retry')} onclick={() => invalidate(target)} />
        {/snippet}
    </Empty>
{/if}
{#each held.mains as row (row.main)}
    <Main {target} {row} root={held.root} dir={held.dir} />
{/each}
