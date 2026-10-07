<script lang="ts">
    // Layer 3, shared view. The problems a build reported for one main file: errors first, then
    // warnings, each with its place (the file and the line, a file alone, or none) and its message.
    // A press opens the file at the line. A problem that names no file is the main file's, and one
    // that names no line opens the top of its file.

    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import type { LatexIssue } from '$lib/state/sessions/latex/latex-state';
    import { useState } from '$lib/state/client/use';
    import { openSourceFile } from '../links/source-file';
    import { placeOf, problemFile, problemRows } from './places';

    type Props = {
        /** The root the files are against. */
        root: string;
        /** The main file, against the root, which a problem with no file belongs to. */
        mainPath: string;
        errors: LatexIssue[];
        warnings: LatexIssue[];
    };

    let { root, mainPath, errors, warnings }: Props = $props();

    const client = useState();

    const issues = $derived(problemRows(errors, warnings));
</script>

<ul class="issues">
    {#each issues as { issue, severity }, at (at)}
        <li class={severity} data-severity={severity}>
            <RowButton onclick={() => openSourceFile(client, problemFile(issue, root, mainPath))}>
                <span class="line">
                    <span class="at">{placeOf(issue)}</span>
                    <span class="msg">{issue.message}</span>
                </span>
            </RowButton>
        </li>
    {/each}
</ul>

<style>
    .issues {
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
    }

    .issues li {
        display: flex;
        font-size: var(--fs-md);
        overflow-wrap: anywhere;
    }

    .line {
        display: flex;
        gap: 6px;
    }

    .at {
        font-family: var(--font-mono);
        color: var(--muted-txt, var(--muted));
    }

    .msg {
        color: var(--ink-txt, var(--ink));
    }

    .warning .msg {
        color: var(--muted-txt, var(--muted));
    }
</style>
