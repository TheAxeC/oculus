<script lang="ts">
    // Layer 3, view partial. The workspace file's own rows, above the settings of the Workspace
    // scope: the primary hub, picked among the workspace's hubs, and the name of each folder, typed
    // in a box. Each is held as a change of the Workspace scope (settings/scopes/scopes.svelte.ts)
    // and written by its Save, a renamed folder that is the primary carrying `primary` with it; a
    // name that is empty, not a folder name or the name of another folder is refused by the Save,
    // naming it, and the change is kept. A box holds its text until Enter or leaving it holds the
    // change, and Escape drops the text. While a change is held the row shows it. A search hides
    // the rows with the `hidden` attribute, so a keystroke mounts nothing and a text typed in a box
    // is there when the search is cleared.

    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { PRIMARY_NAME, folderName } from '$lib/state/system/config/scopes/changes';
    import { hubsOf, type ScopeGround } from '$lib/state/system/config/scopes/scope';
    import type { Scopes } from './scopes.svelte';

    type Props = {
        ground: ScopeGround;
        scopes: Scopes;
        /** Whether a query stands, which leaves these rows out. */
        hidden: boolean;
    };

    let { ground, scopes, hidden }: Props = $props();

    /** The primary the row shows: the one held, else the file's. */
    const primary = $derived.by(() => {
        const held = scopes.heldWorkspace(PRIMARY_NAME);
        return held !== undefined && 'primary' in held ? held.primary : (ground.primary ?? '');
    });

    /** The text typed in each folder's box, by the folder's name, until it is held. */
    let typed = $state<Record<string, string>>({});

    /** The name a folder's box shows: the text typed, the name held, else the folder's own. */
    function nameOf(folder: string): string {
        if (Object.hasOwn(typed, folder)) return typed[folder];
        const held = scopes.heldWorkspace(folderName(folder));
        return held !== undefined && 'name' in held ? held.name : folder;
    }

    function pickPrimary(hub: string): void {
        scopes.stageWorkspace(PRIMARY_NAME, hub === ground.primary ? null : { primary: hub });
    }

    /** Hold the text typed for a folder as its new name, or drop the change for its own name. */
    function settle(folder: string, name: string): void {
        const { [folder]: _done, ...rest } = typed;
        typed = rest;
        scopes.stageWorkspace(folderName(folder), name === folder ? null : { folder, name });
    }

    function revert(event: KeyboardEvent, folder: string): void {
        if (event.key !== 'Escape' || !Object.hasOwn(typed, folder)) return;
        event.stopPropagation();
        const { [folder]: _dropped, ...rest } = typed;
        typed = rest;
    }
</script>

<div class="rows" data-workspace-rows {hidden}>
    <div class="row" data-setting="workspace:primary">
        <span class="title">{t('settings.workspace_primary')}</span>
        <p class="description">{t('settings.workspace_primary_help')}</p>
        <span class="box">
            <Select
                value={primary}
                label={t('settings.workspace_primary')}
                empty={t('settings.workspace_primary_none')}
                choices={hubsOf(ground).map((hub) => ({ id: hub, label: hub }))}
                onchange={pickPrimary}
            />
        </span>
    </div>
    <div class="row" data-setting="workspace:folders">
        <span class="title">{t('settings.workspace_folders')}</span>
        <p class="description">{t('settings.workspace_folders_help')}</p>
        {#each ground.folders as folder (folder.key)}
            <span class="box" role="presentation" onkeydown={(event) => revert(event, folder.key)}>
                <TextInput
                    value={nameOf(folder.key)}
                    label={t('settings.workspace_folder_name', folder.key)}
                    oninput={(value: string) => (typed = { ...typed, [folder.key]: value })}
                    onenter={(value: string) => settle(folder.key, value)}
                    onblur={(value: string) => {
                        if (Object.hasOwn(typed, folder.key)) settle(folder.key, value);
                    }}
                />
            </span>
        {/each}
    </div>
</div>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        padding: 8px 0 0;
    }

    .rows[hidden] {
        display: none;
    }

    .row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px 14px 12px;
    }

    .title {
        font-size: var(--fs-md);
        font-weight: 600;
    }

    .description {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .box {
        width: 420px;
        max-width: 100%;
    }
</style>
