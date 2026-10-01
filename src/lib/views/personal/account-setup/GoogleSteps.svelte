<script lang="ts">
    // Layer 3, view partial. The numbered steps that register a Google Desktop OAuth client, with
    // the console's pages as links and the scopes the connect flow asks for as values to copy.

    import CopyValue from './CopyValue.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { scopes }: { scopes: string[] } = $props();
</script>

{#snippet link(href: string, words: string)}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the provider's own console page, rather than a route id resolve() takes -->
    <a {href} target="_blank" rel="noopener noreferrer"
        >{words} <Glyph name={t('accounts.link_glyph')} /></a
    >
{/snippet}

<ol class="steps">
    <li>
        {t('accounts.google_step_project')}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render link(t('accounts.google_link_console'), t('accounts.google_link_console'))}
    </li>
    <li>
        {t('accounts.google_step_api')}
        <span class="links">
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render link(
                t('accounts.google_link_api_calendar'),
                t('accounts.google_step_api_calendar')
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render link(t('accounts.google_link_api_gmail'), t('accounts.google_step_api_gmail'))}
        </span>
    </li>
    <li>
        {t('accounts.google_step_consent')}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render link(t('accounts.google_link_consent'), t('accounts.google_link_consent'))}
        <p class="note">{t('accounts.google_scopes')}</p>
        <ul class="values">
            {#each scopes as scope (scope)}
                <li><CopyValue value={scope} /></li>
            {/each}
        </ul>
    </li>
    <li>
        {t('accounts.google_step_client')}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render link(t('accounts.google_link_credentials'), t('accounts.google_link_credentials'))}
        <p class="note">{t('accounts.google_no_redirect')}</p>
    </li>
    <li>{t('accounts.google_step_copy')}</li>
</ol>

<style>
    /* A step is a line of the tree's row height, and a longer step grows by whole lines. */
    .steps {
        display: grid;
        gap: 4px;
        margin: 0;
        padding-left: 20px;
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }
    .links {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    .note {
        margin: 4px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
    .values {
        display: grid;
        gap: 2px;
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
    }
    a {
        color: var(--accent-txt, var(--accent));
        overflow-wrap: anywhere;
    }
</style>
