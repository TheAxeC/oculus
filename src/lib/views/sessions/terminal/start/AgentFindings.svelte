<script lang="ts">
    // Layer 3, view partial. What config/catalogs/agents.yml was refused for, one line each in the
    // catalog's words with the line of the file and what it names. The composer draws it above its
    // box so a CLI release's value that the file cannot take is told rather than left out.

    import type { AgentChoicesFinding } from '$lib/state/sessions/agents.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = { findings: AgentChoicesFinding[] };

    let { findings }: Props = $props();

    /** One refusal of config/catalogs/agents.yml in words, with its line and what it names. */
    function findingWords(finding: AgentChoicesFinding): string {
        const line = String(finding.line);
        const what = finding.what;
        if (finding.why === 'parse') return t('composer.why_parse', line, what);
        if (finding.why === 'shape') return t('composer.why_shape', line, what);
        if (finding.why === 'unknown_key') return t('composer.why_unknown_key', line, what);
        if (finding.why === 'unknown_agent') return t('composer.why_unknown_agent', line, what);
        if (finding.why === 'no_default') return t('composer.why_no_default', line, what);
        if (finding.why === 'default_missing') return t('composer.why_default_missing', line, what);
        if (finding.why === 'flag') return t('composer.why_flag', line, what);
        if (finding.why === 'value') return t('composer.why_value', line, what);
        return t('composer.why_repeated', line, what);
    }
</script>

{#if findings.length > 0}
    <ul class="findings" data-agents-findings>
        {#each findings as finding (`${finding.line}:${finding.why}:${finding.what}`)}
            <li>{findingWords(finding)}</li>
        {/each}
    </ul>
{/if}

<style>
    .findings {
        margin: 0;
        padding: 0 0 0 16px;
        color: var(--c-amber-txt, var(--ink));
        font-size: var(--fs-md);
    }
</style>
