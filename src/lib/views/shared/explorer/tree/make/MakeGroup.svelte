<script lang="ts">
    // Layer 3, shared view partial of the make dialogs. One group of a make dialog: its heading,
    // the sentence saying what it is for, and its rows. A row is a box, the file's or the
    // collection's name, one short line of what it holds, and under that line the paths it writes
    // in small text. A file every make writes is drawn with no box and the words for always
    // written, and a file the folder holds already with no box and the words for there.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { MakeGroup } from '../control/making.svelte';
    import { groupWords, rowLine } from './make-words';

    type Props = {
        group: MakeGroup;
        writing: boolean;
        ontick: (group: MakeGroup['id'], key: string, on: boolean) => void;
    };

    let { group, writing, ontick }: Props = $props();

    const words = $derived(groupWords(group.id));
</script>

<section class="group" aria-label={words.title}>
    <p class="heading">{words.title}</p>
    <p class="about">{words.about}</p>
    <ul class="rows">
        {#each group.rows as row (row.key)}
            <li data-make-row={row.key}>
                {#if row.fixed || row.there}
                    <span class="name">
                        {row.key}
                        <span class="state">
                            {row.fixed ? t('files.make_always') : t('files.make_there')}
                        </span>
                    </span>
                {:else}
                    <Checkbox
                        checked={row.ticked}
                        disabled={writing}
                        label={row.key}
                        onchange={(on: boolean) => ontick(group.id, row.key, on)}
                    />
                {/if}
                <span class="line">{rowLine(group.id, row)}</span>
                <span class="paths">{row.paths.join(', ')}</span>
            </li>
        {/each}
    </ul>
</section>

<style>
    .group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .heading {
        margin: 0;
        font-size: var(--fs-sm);
        font-weight: 600;
    }

    .about,
    .line,
    .paths,
    .state {
        color: var(--muted-txt, var(--muted));
    }

    .about {
        margin: 0;
        font-size: var(--fs-xs);
    }

    .rows {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .rows li {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    /* The line and the paths stand under the name, indented to the name past its box. */
    .line,
    .paths {
        padding-left: 22px;
        overflow-wrap: anywhere;
    }

    .line {
        font-size: var(--fs-sm);
    }

    .paths,
    .state {
        font-size: var(--fs-xs);
    }

    .name {
        padding-left: 22px;
        font-size: var(--fs-sm);
    }
</style>
