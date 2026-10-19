<script lang="ts">
    // Layer 3, Recover view partial. The access of each service the dataset's sources need
    // (PhysioNet for a credentialed set, Kaggle, Synapse), as the server's login request with the
    // `downloads` row of the primary hub's `local.yml` found it. A service whose row is missing or
    // refused shows the setup steps: the row to add under `downloads:` and the file it goes in.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        accessWords,
        serviceWords,
        setupRow,
        setupSecret,
        type RecoverAccess
    } from '$lib/state/system/machine/recover-words';

    let { access }: { access: RecoverAccess[] } = $props();

    /** The tone of an access state. */
    function tone(state: RecoverAccess['state']): string {
        return state === 'ok' ? 'green' : state === 'missing' ? 'red' : 'amber';
    }
</script>

<section class="access" aria-label={t('recover.access')}>
    {#each access as one (one.service)}
        <div class="line">
            <Tag label={serviceWords(one.service)} tone={tone(one.state)} />
            <span>{accessWords(one)}</span>
        </div>
        {#if one.state === 'missing'}
            <ol class="steps">
                <li><CodeText text={t('recover.setup_file')} /></li>
                <li><CodeText text={t('recover.setup_add', setupRow(one.service))} /></li>
                <li><CodeText text={setupSecret(one.service)} /></li>
                <li>{t('recover.setup_again')}</li>
            </ol>
        {/if}
    {/each}
</section>

<style>
    .access {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 6px 8px;
    }

    .line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: var(--fs-md);
    }

    .steps {
        margin: 0;
        padding-left: 20px;
        color: var(--muted-txt);
        font-size: var(--fs-md);
    }
</style>
