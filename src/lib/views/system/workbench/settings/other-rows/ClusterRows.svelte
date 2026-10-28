<script lang="ts">
    // Layer 3, view partial. The editor under the `clusters:` row of Settings' This machine
    // section: this machine's rows, each with its user name and key file in boxes and its Save and
    // Remove, and a row added for a cluster of `slurm.resource` that has none. Every write goes to
    // POST /api/clusters, which writes the row alone into the primary hub's `.oculus/local.yml`
    // through the one writer of such a row, the one Account setup's Save uses; a refusal stands
    // under the row. The rows are read when the editor is drawn and again after each write.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { ClusterRow, ClusterSetup } from '$lib/state/system/machine/hpc/setup';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        hpc: { readSetup, setupStep }
    } = useState();

    let setup: ClusterSetup | null = $state(null);
    let failed = $state(false);
    /** The fields typed per row, by the row's cluster, until a write takes them. */
    let typed: Record<string, { user: string; keyFile: string }> = $state({});
    let said: Record<string, string> = $state({});
    let adding = $state('');
    let busy = $state(false);

    async function load(): Promise<void> {
        const read = await readSetup();
        failed = read === null;
        if (read !== null) {
            setup = read;
            typed = {};
        }
    }

    $effect(() => {
        void load();
    });

    /** The fields of a row as typed, else as the file holds them. */
    function fieldsOf(row: ClusterRow): { user: string; keyFile: string } {
        return typed[row.resource] ?? { user: row.user, keyFile: row.keyFile };
    }

    function edit(row: ClusterRow, field: 'user' | 'keyFile', value: string): void {
        typed = { ...typed, [row.resource]: { ...fieldsOf(row), [field]: value } };
    }

    /** Write one row; whether the server took it. */
    async function write(resource: string, body: Record<string, unknown>): Promise<boolean> {
        busy = true;
        try {
            const answer = await setupStep({ ...body, resource });
            said = { ...said, [resource]: answer.refused ? answer.said : '' };
            if (!answer.refused) await load();
            return !answer.refused;
        } finally {
            busy = false;
        }
    }

    async function add(): Promise<void> {
        if (await write(adding, { action: 'save', user: '', keyFile: '' })) adding = '';
    }

    /** The clusters of `slurm.resource` this machine has no row of. */
    const unrowed = $derived.by(() => {
        const held: ClusterSetup | null = setup;
        if (held === null) return [];
        return held.clusters
            .filter((one) => !held.rows.some((row) => row.resource === one.resource))
            .map((one) => ({ id: one.resource, label: one.name }));
    });
</script>

<div class="clusters" data-cluster-rows>
    {#if setup === null && failed}
        <Empty error message={t('accounts.cluster_unreachable')} />
    {:else if setup !== null}
        {#each setup.rows as row (row.resource)}
            <div class="row" data-cluster-row={row.resource}>
                <code>{row.resource}</code>
                {#if row.hub !== ''}
                    <span class="hub">{t('workbench.settings_clusters_in', row.hub)}</span>
                {/if}
                <Field label={t('accounts.cluster_user')}>
                    <TextInput
                        value={fieldsOf(row).user}
                        label={t('accounts.cluster_user')}
                        oninput={(value: string) => edit(row, 'user', value)}
                    />
                </Field>
                <Field label={t('accounts.cluster_key_file')}>
                    <TextInput
                        value={fieldsOf(row).keyFile}
                        label={t('accounts.cluster_key_file')}
                        oninput={(value: string) => edit(row, 'keyFile', value)}
                    />
                </Field>
                <div class="buttons">
                    <ToolButton
                        label={t('accounts.cluster_save')}
                        disabled={busy}
                        onclick={() =>
                            void write(row.resource, { action: 'save', ...fieldsOf(row) })}
                    />
                    <ToolButton
                        label={t('accounts.remove')}
                        disabled={busy}
                        onclick={() => void write(row.resource, { action: 'remove' })}
                    />
                </div>
                {#if (said[row.resource] ?? '') !== ''}
                    <Empty error message={said[row.resource]} />
                {/if}
            </div>
        {/each}
        {#if unrowed.length > 0}
            <div class="add">
                <Select
                    value={adding}
                    label={t('workbench.settings_clusters_add')}
                    empty={t('workbench.settings_clusters_add')}
                    choices={unrowed}
                    onchange={(value: string) => (adding = value)}
                />
                <ToolButton
                    label={t('workbench.settings_clusters_add_go')}
                    disabled={busy || adding === ''}
                    onclick={() => void add()}
                />
                {#if adding !== '' && (said[adding] ?? '') !== ''}
                    <Empty error message={said[adding]} />
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    .clusters {
        display: grid;
        gap: 10px;
    }
    .row {
        display: grid;
        gap: 4px;
    }
    .hub {
        color: var(--muted);
        font-size: var(--fs-md);
    }
    .buttons,
    .add {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
    }
</style>
