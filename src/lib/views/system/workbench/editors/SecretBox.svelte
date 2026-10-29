<script lang="ts">
    // Layer 3, view partial. The control of a `secret` field of a row of a hub's `local.yml` (a
    // `downloads` row's password, key or token): a password box and the words saying whether the
    // row's secret is set, never the secret itself. The file's secret reaches the page only as
    // `true` (set), so the box starts empty; a text typed into it is held, by the row's service,
    // with the scope's unsaved changes (settings/scopes/), and replaces the stored secret when the
    // scope is saved. A box left empty holds nothing and keeps the stored secret. Clear holds the
    // taking out of the secret, which is its own change, and Keep drops a typed or cleared secret
    // again. The typed text lives in the box and in the scope's changes alone: no draft, instance
    // state or row value holds it.
    //
    // Drawn outside a Settings view, or for a row with no service yet, the box says the secret is
    // set or not set and holds nothing.

    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { scopesHere } from '../settings/scopes/context';

    type Props = {
        /** The box's accessible name, already translated by the view. */
        label: string;
        /** Whether the file holds a secret for the row. */
        stored: boolean;
        /** The row's service, which the secret is held by. */
        service: string;
    };

    let { label, stored, service }: Props = $props();

    const scopes = scopesHere();

    /** The secret held for the row: a text, null to take it out, undefined for none. */
    const held = $derived(
        scopes === null || service === ''
            ? undefined
            : scopes.changes.secret(scopes.file(), service)
    );

    /** The words of the secret's state, after what is held for it. */
    const state = $derived.by(() => {
        if (held === null) return t('settings.secret_cleared');
        if (typeof held === 'string') return t('settings.secret_typed');
        return stored ? t('settings.secret_set') : t('settings.secret_unset');
    });

    function type(text: string): void {
        if (scopes === null || service === '') return;
        if (text === '') scopes.changes.dropSecret(scopes.file(), service);
        else scopes.changes.stageSecret(scopes.file(), service, text);
    }
</script>

<span class="secret" data-secret={held === undefined ? (stored ? 'set' : 'unset') : 'held'}>
    <span class="box">
        <TextInput
            value={typeof held === 'string' ? held : ''}
            {label}
            secret
            disabled={scopes === null || service === ''}
            placeholder={t('settings.secret_placeholder')}
            oninput={type}
        />
    </span>
    <span class="state" role="status">{state}</span>
    {#if scopes !== null && service !== '' && held === undefined && stored}
        <ToolButton
            label={t('settings.secret_clear')}
            glyph="dismiss"
            compact
            onclick={() => scopes.changes.stageSecret(scopes.file(), service, null)}
        />
    {:else if scopes !== null && service !== '' && held !== undefined}
        <ToolButton
            label={t('settings.secret_keep')}
            glyph="revert"
            compact
            onclick={() => scopes.changes.dropSecret(scopes.file(), service)}
        />
    {/if}
</span>

<style>
    .secret {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }

    .box {
        width: 240px;
        max-width: 100%;
    }

    .state {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
