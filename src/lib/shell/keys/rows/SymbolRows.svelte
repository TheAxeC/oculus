<script lang="ts">
    // Layer 3, partial of shell/keys/Palette.svelte. The rows of the `#` list: the symbols of the
    // workspace whose names match what follows the `#`, asked of the language server that serves
    // the source tab on screen (its language and root) through the tab's own channel, so the list
    // is that server's answer and nothing else. Each row names the symbol's kind, its name, and
    // the container, file and line it is in. A press opens the file at the symbol: a file of a
    // served root, or a library file the server named, in a source tab. A tab that no server
    // answers for says so in the list.

    import { untrack } from 'svelte';
    import PaletteRow from '$lib/shell/keys/PaletteRow.svelte';
    import { symbolKindName } from '$lib/data/prose/symbol-kinds';
    import { libraryTabState, sourceTabState } from '$lib/state/sessions/source.svelte';
    import type { SymbolRow } from '$lib/state/system/machine/lsp/workspace-symbols';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const { workspaceSymbols, layout } = useState();

    type Props = {
        /** The source tab on screen the list is asked through, or null when none is. */
        instance: string | null;
        /** What follows the `#`. */
        query: string;
        onclose: () => void;
    };

    let { instance, query, onclose }: Props = $props();

    /** The rows of the latest answer, or null while none has arrived or no server answers. */
    let rows = $state<SymbolRow[] | null>(null);
    let loading = $state(false);

    // Each query is asked once the reader pauses; an answer that arrives after a newer question was
    // put is dropped.
    let asked = 0;
    $effect(() => {
        const what = query.trim();
        const tab = instance;
        if (tab === null) {
            rows = null;
            return;
        }
        const turn = (asked += 1);
        loading = true;
        const timer = setTimeout(() => {
            void workspaceSymbols.ask(tab, what).then((answer) => {
                if (turn !== asked) return;
                untrack(() => {
                    rows = answer;
                    loading = false;
                });
            });
        }, 120);
        return () => clearTimeout(timer);
    });

    function where(row: SymbolRow): string {
        const file = row.library ?? row.path;
        const place = `${file}:${row.line}`;
        return row.container === '' ? place : `${row.container}  ${place}`;
    }

    /** Open the symbol's file at its name, which the store finds in the file's text. */
    async function open(row: SymbolRow): Promise<void> {
        const { line, column } = await workspaceSymbols.placeOf(row);
        const state =
            row.library === undefined
                ? sourceTabState(row.root, row.path, line, column)
                : libraryTabState(row.path, row.library, line, column);
        onclose();
        layout.openView('source', state);
    }
</script>

{#if instance === null || (rows === null && !loading)}
    <p class="empty" data-palette-symbols-empty>{t('app.palette.symbols_unavailable')}</p>
{:else}
    {#each rows ?? [] as row, at (`symbol:${at}`)}
        <PaletteRow
            row={{
                value: `symbol:${at}`,
                kind: t(`app.palette.symbol_${symbolKindName(row.kind)}`),
                label: row.name,
                hint: where(row),
                pick: () => void open(row)
            }}
        />
    {/each}
    {#if rows !== null && rows.length === 0 && !loading}
        <p class="empty" data-palette-symbols-empty>{t('app.palette.symbols_none')}</p>
    {:else if rows === null}
        <p class="empty">{t('app.palette.symbols_loading')}</p>
    {/if}
{/if}

<style>
    .empty {
        margin: 0;
        padding: 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
