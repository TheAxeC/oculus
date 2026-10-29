<script lang="ts">
    // Layer 3, view partial. The scope bar of the Settings view, under the search: the pick of the
    // scope (Workspace, Primary hub, Hub, This machine, Repository), beside it for Hub and This
    // machine the pick of one of the workspace's hubs and for Repository one of its repositories,
    // the file the scope reads and writes with how it stands, the count of the scope's unsaved
    // changes, its Save and Save All. A kind with nothing to pick (Primary hub with no primary,
    // Repository with no repository) is not offered. Under the bar stand the sentence the last Save
    // of the scope's file left, the other files that hold changes with their count, and each file
    // whose hub or folder left the workspace with its changes kept and a Discard; nothing is
    // written to such a file. While the unsaved workspace's changes wait for a name, the name
    // question of Save Workspace As is asked (ui/forms/Prompt.svelte), and its answer saves the
    // workspace under that name and then its changes.

    import Prompt from '$lib/ui/forms/Prompt.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { PromptRequest } from '$lib/ui/forms/prompt';
    import { t } from '$lib/state/shared/words/text';
    import type { ScopeFile } from '$lib/state/system/config/scopes/rows';
    import {
        SCOPE_KINDS,
        pickOf,
        picks,
        scopeOfKind,
        withPick,
        type Scope,
        type ScopeGround,
        type ScopeKind
    } from '$lib/state/system/config/scopes/scope';
    import { said } from '../said';
    import type { Scopes } from './scopes.svelte';

    type Props = {
        scope: Scope;
        ground: ScopeGround;
        scopes: Scopes;
        /** The file of the scope on screen. */
        file: ScopeFile;
        onpick: (scope: Scope) => void;
    };

    let { scope, ground, scopes, file, onpick }: Props = $props();

    /** The words of a kind of scope. */
    function kindWord(kind: ScopeKind): string {
        switch (kind) {
            case 'workspace':
                return t('settings.scope_workspace');
            case 'primary':
                return t('settings.scope_primary');
            case 'hub':
                return t('settings.scope_hub');
            case 'local':
                return t('settings.scope_local');
            case 'repo':
                return t('settings.scope_repo');
        }
    }

    /** The kinds the workspace offers a scope of. */
    const kinds = $derived(
        SCOPE_KINDS.filter((kind) => scopeOfKind(kind, ground) !== null).map((kind) => ({
            id: kind,
            label: kindWord(kind)
        }))
    );

    const offered = $derived(picks(scope.kind, ground));
    const picked = $derived(pickOf(scope));

    /** The name of the scope on screen's file, as its changes are kept. */
    const here = $derived(scopes.file());
    const count = $derived(scopes.changes.count(here));
    const held = $derived(scopes.changes.files());

    /** The files other than the scope's own that hold changes, each with where they go. */
    const others = $derived(
        held
            .filter((name) => name !== here)
            .map((name) => ({ name, count: scopes.changes.count(name), to: scopes.target(name) }))
    );

    /** How the scope's file stands, in words. */
    const standing = $derived.by(() => {
        if (file.name === '') return t('settings.scope_unsaved');
        if (file.blocked !== null) return said(file.blocked);
        return file.present
            ? t('settings.scope_file', file.name)
            : t('settings.scope_file_new', file.name);
    });

    const last = $derived(scopes.said(here));

    function pickKind(kind: string): void {
        const next = SCOPE_KINDS.find((one) => one === kind);
        if (next === undefined) return;
        const made = scopeOfKind(next, ground);
        if (made !== null) onpick(made);
    }

    /** The name question, while a Save waits on it. */
    const asking = $derived.by((): PromptRequest | null => {
        if (scopes.asking() === null) return null;
        return {
            message: t('settings.scope_name_ask'),
            detail: t('settings.scope_name_detail'),
            fields: [{ label: t('settings.scope_name_label'), value: '', required: true }],
            verb: t('settings.scope_name_verb'),
            act: ([name]) => void scopes.named(name)
        };
    });
</script>

<div class="bar" data-scope-bar>
    <span class="kind">
        <Select
            value={scope.kind}
            label={t('settings.scope_kind')}
            choices={kinds}
            onchange={pickKind}
        />
    </span>
    {#if offered.length > 0 && picked !== null}
        <span class="pick">
            <Select
                value={picked}
                label={scope.kind === 'repo'
                    ? t('settings.scope_pick_repo')
                    : t('settings.scope_pick_hub')}
                choices={offered.map((name) => ({ id: name, label: name }))}
                onchange={(name: string) => onpick(withPick(scope, name))}
            />
        </span>
    {/if}
    <span class="file" data-scope-file={file.name} role="status">{standing}</span>
    <span class="count" role="status">
        {count === 0
            ? t('settings.scope_clean')
            : count === 1
              ? t('settings.scope_unsaved_one')
              : t('settings.scope_unsaved_many', count)}
    </span>
    <ToolButton
        label={t('settings.scope_save')}
        glyph="save"
        compact
        disabled={count === 0}
        onclick={() => void scopes.save()}
    />
    <ToolButton
        label={t('desktop.menu.save_all')}
        glyph="save"
        compact
        disabled={held.length === 0}
        onclick={() => void scopes.saveAll()}
    />
</div>
{#if last !== null}
    <p class="said" role="status">{said(last)}</p>
{/if}
{#each others as other (other.name)}
    {@const answer = scopes.said(other.name)}
    <p class="other" data-scope-held={other.name} role="status">
        {#if other.to.kind === 'gone'}
            {t('settings.scope_gone_held', other.to.name, other.count)}
            <ToolButton
                label={t('settings.scope_discard')}
                glyph="trash"
                compact
                onclick={() => scopes.discard(other.name)}
            />
        {:else}
            {t(
                'settings.scope_held',
                other.to.kind === 'ready' ? other.to.name : other.name,
                other.count
            )}
        {/if}
        {#if answer !== null}
            <span class="note">{said(answer)}</span>
        {/if}
    </p>
{/each}
{#if asking !== null}
    <Prompt request={asking} cancel={t('ui.confirm_cancel')} oncancel={() => scopes.cancelName()} />
{/if}

<style>
    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 6px 12px 0;
    }

    .kind,
    .pick {
        width: 180px;
        max-width: 100%;
    }

    .file,
    .count,
    .other,
    .note {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .file {
        font-family: var(--font-mono);
        overflow-wrap: anywhere;
    }

    .said,
    .other {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 4px 12px 0;
    }

    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
