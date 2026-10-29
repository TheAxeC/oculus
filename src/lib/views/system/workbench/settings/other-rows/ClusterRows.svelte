<script lang="ts">
    // Layer 3, view partial. The editor under the `clusters:` row of Settings' This machine
    // section: the family editor of the row (../../editors/Editor.svelte), whose `resource` choice
    // offers a new row the clusters of `slurm.resource` that no row of the merged `clusters:`
    // holds and keeps a row's own cluster in its choice, each drawn by its name
    // (state/system/config/other-rows/cluster-rows.ts). The clusters and every hub's rows are the
    // cluster setup's (POST /api/clusters), read when the editor is drawn and again whenever the
    // row's value moves, as after a Save. Every change is held and saved as every other change of
    // This machine is: by the scope's Save, Save All and the digest check, with no Save here.

    import { useState } from '$lib/state/client/use';
    import { draftOf } from '$lib/state/system/config/editors/draft';
    import { savedDraft } from '$lib/state/system/config/editors/slots';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import type { EditorWriter } from '$lib/state/system/config/editors/writer';
    import { clusterChoice, clusterLists } from '$lib/state/system/config/other-rows/cluster-rows';
    import type { ConfigRow } from '$lib/state/system/config/rows';
    import type { ClusterSetup } from '$lib/state/system/machine/hpc/setup';
    import Editor from '../../editors/Editor.svelte';

    const {
        hpc: { readSetup },
        ui: { instanceState }
    } = useState();

    let {
        row,
        id,
        editors,
        lists
    }: { row: ConfigRow; id: string; editors: EditorWriter; lists: Lists } = $props();

    let setup: ClusterSetup | null = $state(null);
    let failed = $state(false);

    /**
     * Read the setup for the value the file gives the row (`_value`, which a Save moves); the
     * function returned drops an answer that comes after the value moved again.
     */
    function readFor(_value: unknown): () => void {
        let gone = false;
        void readSetup().then((read) => {
            if (gone) return;
            failed = read === null;
            if (read !== null) setup = read;
        });
        return () => {
            gone = true;
        };
    }

    // The setup is read when the editor is drawn and again when the file's value of the row moves.
    $effect(() => readFor(row.value));

    /** The draft the editor draws: the tab's, else the change held or the file's value. */
    const draft = $derived.by(() => {
        const sent = editors.shown(row);
        return (
            savedDraft(instanceState(id), row) ??
            draftOf(sent === undefined ? row : { ...row, value: sent })
        );
    });

    const narrowed = $derived(
        clusterLists(lists, setup === null ? null : clusterChoice(setup, row, draft), failed)
    );
</script>

<Editor {row} {id} {editors} lists={narrowed} />
