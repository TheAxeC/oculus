<script lang="ts">
    // Layer 3, view partial. The numbered steps of one cluster of `slurm.resource` in Account
    // setup: the user name; the key file, filled from the hub's `clusters.key_file` and changeable
    // until the key is made; Make key; the host's key, read when `~/.ssh/known_hosts` does not hold
    // the host and shown as its fingerprints for the reader to confirm, the next step offered only
    // once it is trusted; Put the key on the cluster, with a password field whose value goes to
    // that one ssh and is emptied once it is sent; and Save, which writes this machine's
    // `clusters:` row. Under them is what `ssh -G` resolves the connection to. Every step is a
    // request to POST /api/clusters, and its sentence is drawn under the step.
    //
    // Beside the Put step, the public key of the key file in the field is drawn with its copy press
    // whenever the server found a `.pub` file beside it, read when the section is drawn and again
    // when Make key or Put the key answers, so a cluster that takes the key another way needs no
    // password typed to show it. A cluster that takes no password also gets its `access` text,
    // which says how the key reaches it instead.

    import { untrack } from 'svelte';
    import CopyValue from './CopyValue.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Field from '$lib/ui/forms/Field.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { ClusterSetupCluster, StepAnswer } from '$lib/state/system/machine/hpc/setup';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        hpc: { setupStep }
    } = useState();

    type Props = {
        cluster: ClusterSetupCluster;
        /** The sentence naming the key setting Make key lacks, or ''. */
        keyMissing: string;
        /** Read the setup again, once a row was saved. */
        onsaved: () => void;
    };

    let { cluster, keyMissing, onsaved }: Props = $props();

    let user = $state(untrack(() => cluster.user));
    let keyFile = $state(
        untrack(() => (cluster.keyFile !== '' ? cluster.keyFile : cluster.suggested))
    );
    let password = $state('');
    /** The key file Make key made or found, which fixes the field. */
    let made = $state('');
    /** Whether the host is trusted, unknown until asked, and the fingerprints to confirm. */
    let known: boolean | null = $state(null);
    let fingerprints: string[] = $state([]);
    let noPassword: { publicKey: string; access: string } | null = $state(null);
    /** The public key the server last read, and the key file it was read for. */
    let shown = $state(
        untrack(() => ({
            file: cluster.keyFile !== '' ? cluster.keyFile : cluster.suggested,
            key: cluster.publicKey
        }))
    );
    /** The public key of the key file in the field, or '' when none was read for it. */
    const publicKey = $derived(shown.file === keyFile ? shown.key : '');
    /** The answer each step drew last, by step. */
    let said: Partial<Record<string, StepAnswer>> = $state({});
    let running = $state('');

    /** Run one step and keep its answer under it. */
    async function step(name: string, body: Record<string, unknown>): Promise<StepAnswer> {
        running = name;
        try {
            const answer = await setupStep({ ...body, resource: cluster.resource });
            said = { ...said, [name]: answer };
            return answer;
        } finally {
            running = '';
        }
    }

    async function makeKey(): Promise<void> {
        const answer = await step('make', { action: 'make_key', keyFile });
        if (!answer.refused && answer.path !== undefined) {
            made = answer.path;
            keyFile = answer.path;
            shown = { file: answer.path, key: answer.publicKey ?? '' };
        }
    }

    async function hostKey(): Promise<void> {
        const answer = await step('host', { action: 'host_key' });
        if (answer.refused) return;
        known = answer.known ?? false;
        fingerprints = answer.fingerprints ?? [];
    }

    async function trust(): Promise<void> {
        const answer = await step('host', { action: 'trust_host', fingerprints });
        if (!answer.refused) {
            known = true;
            fingerprints = [];
        }
    }

    async function putKey(): Promise<void> {
        const typed = password;
        const file = keyFile;
        password = '';
        const answer = await step('put', {
            action: 'put_key',
            user,
            keyFile: file,
            password: typed
        });
        noPassword = answer.noPassword ?? null;
        if (noPassword !== null) shown = { file, key: noPassword.publicKey };
    }

    async function save(): Promise<void> {
        const answer = await step('save', { action: 'save', user, keyFile });
        if (!answer.refused) onsaved();
    }

    /** The resolution's line, or ssh's refusal of it. */
    const resolved = $derived.by(() => {
        const held = cluster.resolution;
        if (held === null) return '';
        if ('error' in held) return t('hpc.resolution_error', held.error);
        const files = held.identityfile.join(', ');
        return t('hpc.resolution', held.hostname, held.user, held.port, files);
    });
</script>

{#snippet answer(name: string)}
    {@const step = said[name]}
    {#if step !== undefined && step.said !== ''}
        {#if step.refused}
            <Empty error message={step.said} />
        {:else}
            <p class="said" role="status">{step.said}</p>
        {/if}
    {/if}
{/snippet}

<div class="cluster" data-cluster={cluster.resource}>
    {#if cluster.missing !== ''}
        <p class="missing">{cluster.missing}</p>
    {:else}
        <ol class="steps">
            <li>
                <Field label={t('accounts.cluster_user')}>
                    <TextInput
                        value={user}
                        label={t('accounts.cluster_user')}
                        oninput={(value: string) => (user = value)}
                    />
                </Field>
            </li>
            <li>
                <Field label={t('accounts.cluster_key_file')}>
                    <TextInput
                        value={keyFile}
                        label={t('accounts.cluster_key_file')}
                        disabled={made !== ''}
                        oninput={(value: string) => (keyFile = value)}
                    />
                </Field>
                {#if cluster.keyRefused !== ''}
                    <p class="missing">{cluster.keyRefused}</p>
                {/if}
            </li>
            <li>
                {#if keyMissing !== ''}
                    <p class="missing">{keyMissing}</p>
                {:else}
                    <ToolButton
                        label={t('accounts.cluster_make_key')}
                        disabled={running !== '' || keyFile === ''}
                        onclick={() => void makeKey()}
                    />
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render answer('make')}
            </li>
            <li>
                {t('accounts.cluster_host_step', cluster.host)}
                {#if known === true}
                    <p class="said" role="status">{t('accounts.cluster_host_known')}</p>
                {:else if fingerprints.length > 0}
                    <p>{t('accounts.cluster_host_compare')}</p>
                    <ul class="prints">
                        {#each fingerprints as print (print)}
                            <li><code>{print}</code></li>
                        {/each}
                    </ul>
                    <ToolButton
                        label={t('accounts.cluster_host_trust')}
                        disabled={running !== ''}
                        onclick={() => void trust()}
                    />
                {:else}
                    <ToolButton
                        label={t('accounts.cluster_host_read')}
                        disabled={running !== ''}
                        onclick={() => void hostKey()}
                    />
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render answer('host')}
            </li>
            {#if known === true || publicKey !== ''}
                <li>
                    {#if known === true}
                        <Field label={t('accounts.cluster_password')}>
                            <TextInput
                                value={password}
                                label={t('accounts.cluster_password')}
                                secret
                                oninput={(value: string) => (password = value)}
                            />
                        </Field>
                        <ToolButton
                            label={t('accounts.cluster_put_key')}
                            disabled={running !== '' || password === ''}
                            onclick={() => void putKey()}
                        />
                        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                        {@render answer('put')}
                    {/if}
                    {#if publicKey !== ''}
                        <p class="key">{t('accounts.cluster_public_key')}</p>
                        <CopyValue value={publicKey} />
                    {/if}
                    {#if noPassword !== null && noPassword.access !== ''}
                        <p class="access">{noPassword.access}</p>
                    {/if}
                </li>
            {/if}
            <li>
                <ToolButton
                    label={t('accounts.cluster_save')}
                    disabled={running !== ''}
                    onclick={() => void save()}
                />
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render answer('save')}
            </li>
        </ol>
        {#if resolved !== ''}
            <p class="resolution" data-resolution>{resolved}</p>
        {/if}
    {/if}
</div>

<style>
    .cluster {
        display: grid;
        gap: 8px;
    }
    .steps {
        display: grid;
        gap: 10px;
        margin: 0;
        padding-left: 20px;
    }
    .prints {
        margin: 4px 0;
        padding-left: 16px;
    }
    .key {
        margin: 4px 0 0;
        font-size: var(--fs-md);
    }
    .said {
        margin: 4px 0 0;
        color: var(--c-green-d-txt);
        font-size: var(--fs-md);
    }
    .missing,
    .access {
        margin: 4px 0 0;
        color: var(--c-amber-txt, var(--muted));
        font-size: var(--fs-md);
    }
    .resolution {
        margin: 0;
        color: var(--muted);
        font-size: var(--fs-sm);
    }
</style>
