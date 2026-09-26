<script lang="ts">
    // Layer 3, view partial. The numbered steps that register a Microsoft Entra public-client
    // application, with the two redirect addresses on the port this server listens on and the
    // Graph permissions the connect flow asks for as values to copy.

    import CopyValue from './CopyValue.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';

    let { redirects, permissions }: { redirects: string[]; permissions: string[] } = $props();
</script>

<ol class="steps">
    <li>
        {t('accounts.microsoft_step_register')}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the address is the provider's own console page, rather than a route id resolve() takes -->
        <a href={t('accounts.microsoft_link_entra')} target="_blank" rel="noopener noreferrer"
            >{t('accounts.microsoft_link_entra')} <Glyph name={t('accounts.link_glyph')} /></a
        >
    </li>
    <li>{t('accounts.microsoft_step_accounts')}</li>
    <li>
        {t('accounts.microsoft_step_redirect')}
        <p class="note">{t('accounts.microsoft_redirects')}</p>
        <ul class="values" data-redirects>
            {#each redirects as redirect (redirect)}
                <li><CopyValue value={redirect} /></li>
            {/each}
        </ul>
    </li>
    <li>{t('accounts.microsoft_step_public')}</li>
    <li>
        {t('accounts.microsoft_step_permissions')}
        <p class="note">{t('accounts.microsoft_permissions')}</p>
        <ul class="values" data-permissions>
            {#each permissions as permission (permission)}
                <li><CopyValue value={permission} /></li>
            {/each}
        </ul>
        <p class="note">{t('accounts.microsoft_admin')}</p>
    </li>
    <li>{t('accounts.microsoft_step_copy')}</li>
</ol>

<style>
    .steps {
        display: grid;
        gap: 8px;
        margin: 0;
        padding-left: 20px;
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
