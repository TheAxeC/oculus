<script lang="ts">
    // Layer 3, view partial. "Edit in <file>": the control that opens the file the user's value of
    // a setting lives in, in a source tab at the line of the key. Settings whose value the Settings
    // view cannot draw are set there. The file is the open workspace file, or for a key of the hub
    // list the settings file of the hub the row reads, the primary's or the one chosen on the row
    // (the row's place), and it is opened through the workspace folder that holds it; with no such
    // folder the control says so instead, and with the unsaved workspace it offers Save Workspace
    // As... in its place.
    //
    // A key the file does not hold yet is first added holding a copy of the value in force (a write
    // with `copy`, which adds the key even though the value does not change, naming the hub chosen
    // on the row when it is not the primary), and the file opens at the key's line once the config
    // channel's push has brought the row's new line; a refusal of that write is said under the
    // control and nothing opens. A row that says why it writes nothing opens nothing and sends no
    // copy.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { openTarget } from '$lib/state/system/config/config-files';
    import {
        placeName,
        placeOf,
        writtenWhole,
        type ConfigRow
    } from '$lib/state/system/config/rows';
    import { useState } from '$lib/state/client/use';

    const {
        fs: { workspaces },
        layout: { openView },
        ui: { requestPalette },
        writes: { writeConfigKey, writeConfigValue }
    } = useState();

    let { row }: { row: ConfigRow } = $props();

    const place = $derived(placeOf(row));
    const target = $derived(
        place === null ? null : openTarget(place.root, place.file, workspaces())
    );

    /** The name the file is shown under, the hub's before it for a hub other than the primary. */
    const named = $derived(placeName(row) ?? '');

    /** Whether the copy of the key was written and the file waits for its line to open. */
    let waiting = $state(false);

    /** The reason the copy of the key was refused, or the empty string. */
    let refused = $state('');

    function open(line?: number): void {
        if (target !== null) openView('source', sourceTabState(target.root, target.path, line));
    }

    async function edit(): Promise<void> {
        if (row.blocked !== undefined) return;
        if (row.own || row.value === undefined) {
            open(row.line);
            return;
        }
        refused = '';
        const answer = writtenWhole(row.control)
            ? await writeConfigValue(row.file, row.key, row.value, row.value, true, row.hub)
            : await writeConfigKey(row.file, row.key, row.value, true, row.hub);
        if (answer.ok) waiting = true;
        else refused = answer.refused.map((one) => one.reason).join('; ') || (answer.error ?? '');
    }

    // The push of the config channel brings the line of the key the copy added.
    $effect(() => {
        if (!waiting || row.line === undefined) return;
        waiting = false;
        open(row.line);
    });
</script>

{#if row.place.path === null}
    <ToolButton
        label={t('settings.save_workspace')}
        glyph="save"
        title={t('settings.save_workspace_tip')}
        onclick={() => requestPalette(':workspace-save ')}
    />
{:else if target !== null}
    <ToolButton
        label={t('workbench.settings_edit_in', named)}
        glyph="edit"
        title={t('workbench.settings_edit_in_tip', named)}
        onclick={() => void edit()}
    />
{:else}
    <span class="unavailable">{t('workbench.settings_open_unavailable', named)}</span>
{/if}
{#if refused !== ''}
    <p class="refused" role="status">{t('workbench.settings_refused', refused)}</p>
{/if}

<style>
    .unavailable {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .refused {
        margin: 6px 0 0;
        color: var(--c-red-txt);
        font-size: var(--fs-md);
    }
</style>
