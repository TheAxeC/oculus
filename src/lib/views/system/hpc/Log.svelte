<script lang="ts">
    // Layer 3, view partial. The log box owns loading, output, empty, and failure states while its
    // controls repeat or close the selected tail.
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    let {
        id,
        status,
        output,
        live,
        onrefresh,
        onclose
    }: {
        id: string;
        status: string;
        output: string;
        /**
         * Whether the cluster is answering; the tail runs an ssh command, so it waits until it is.
         */
        live: boolean;
        onrefresh: () => void;
        onclose: () => void;
    } = $props();
    const body = $derived(
        status === 'loading'
            ? t('hpc.loading')
            : status === 'error' || status === 'timeout'
              ? t('hpc.fetch_failed')
              : output || t('hpc.no_output')
    );
</script>

<section>
    <header>
        <b>{t('hpc.log_job', id)}</b>
        <span>
            <ToolButton
                label={t('hpc.tail')}
                disabled={!live}
                title={live ? undefined : t('hpc.controls_offline')}
                onclick={onrefresh}
            />
            <ToolButton label={t('hpc.close')} onclick={onclose} />
        </span>
    </header>
    <pre>{body}</pre>
</section>

<style>
    section {
        border: 1px solid var(--line);
        margin-top: 10px;
    }
    header {
        display: flex;
        justify-content: space-between;
        padding: 6px;
        font-size: var(--fs-sm);
    }
    header span {
        display: flex;
        gap: 4px;
    }
    pre {
        max-height: 24em;
        overflow: auto;
        margin: 0;
        padding: 8px;
        background: var(--bg);
        color: var(--ink-txt, var(--ink));
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
    }
</style>
