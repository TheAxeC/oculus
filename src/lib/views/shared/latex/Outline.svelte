<script lang="ts">
    // Layer 3, shared view. The sections of one main file in reading order, followed through its
    // includes, each indented by its level; a press opens the file at the section's line. The files
    // the parser refused are named under the list as read in part, since the list holds the
    // sectioning commands a line scan found in them and none of the files they include, and the
    // files too large or unreadable are named as not read. The sentence that the file holds no
    // sections is said only when every file was read whole.
    //
    // The outline is the LaTeX store's: asked for when this is first drawn and again after the main
    // file is built again, and an answer that arrives after the list closed is held, not drawn.

    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import type { LatexTarget } from '$lib/state/sessions/latex.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { openSourceFile } from '../links/source-file';

    type Props = {
        target: LatexTarget;
        main: string;
        /** The root the files are against. */
        root: string;
    };

    let { target, main, root }: Props = $props();

    const client = useState();
    const {
        latex: { outline: outlineOf }
    } = client;

    const found = $derived(outlineOf(target, main));
</script>

{#if !found.loading}
    {#if found.error !== ''}
        <Empty error message={t('latex.outline_failed', found.error)} />
    {:else if found.sections.length === 0 && found.partial.length + found.unread.length === 0}
        <Empty message={t('latex.outline_empty')} />
    {:else}
        <ul class="sections">
            {#each found.sections as section, at (at)}
                <li style:--level={section.level}>
                    <RowButton
                        onclick={() =>
                            openSourceFile(client, {
                                root,
                                path: section.file,
                                line: section.line
                            })}
                    >
                        <span class="title">{section.title}</span>
                    </RowButton>
                </li>
            {/each}
        </ul>
    {/if}
    {#if found.partial.length > 0}
        <p class="skipped">{t('latex.outline_partial', found.partial.join(', '))}</p>
    {/if}
    {#if found.unread.length > 0}
        <p class="skipped">{t('latex.outline_unread', found.unread.join(', '))}</p>
    {/if}
{/if}

<style>
    .sections {
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
    }

    .sections li {
        display: flex;
        padding-left: calc(var(--level) * 12px);
        font-size: var(--fs-md);
    }

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .skipped {
        margin: 4px 0 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
