<script lang="ts">
    // A caller of ui/tree/list/VirtualRows.svelte for the case in virtual-rows.client.test.ts. It
    // reads its items by index, as the Changes, Graph, Console, Tree and Problems views do, and
    // takes its list in from an effect, as a view does whose store a language client writes from
    // inside an editor's effect. Every index it is asked for that the list no longer holds is
    // written down, for the key and for an item's body apart.

    import type { Attachment } from 'svelte/attachments';
    import VirtualRows from '../../../../src/lib/ui/tree/list/VirtualRows.svelte';

    type Row = { id: string; name: string };
    type Props = {
        rows: () => Row[];
        past: { key: number[]; body: number[] };
    };

    let { rows, past }: Props = $props();

    let list: Row[] = $state.raw([]);
    $effect(() => {
        list = rows();
    });

    function key(at: number): string {
        if (at >= list.length) past.key.push(at);
        return list[at].id;
    }

    function rowAt(at: number): Row {
        if (at >= list.length) past.body.push(at);
        return list[at];
    }
</script>

<ul data-scroll>
    <VirtualRows count={list.length} {key} {item} />
</ul>

{#snippet item(at: number, measure: Attachment<HTMLElement>)}
    {@const row = rowAt(at)}
    {#if row.id !== ''}
        <li {@attach measure}>{row.name}</li>
    {/if}
{/snippet}
