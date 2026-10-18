<script lang="ts">
    // Layer 3, view partial. The lines under the `editor.languages` row about the folders that
    // override it: each folder of the workspace whose `.oculus/settings.yml` sets a language, a
    // folder whose file was not read and why, one with no file that reads as text, and the entries
    // of a read file that were skipped. The settings texts come with the folder list. The folder's
    // name opens its settings file in a source tab.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { sourceTabState } from '$lib/state/sessions/source/draft';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { repoOrigins } from '$lib/state/system/config/editors/origins';
    import { REPO_SETTINGS } from '$lib/state/workbench/navigation/editor-text';

    const {
        fs: { workspaces },
        layout: { openView },
        selectors: { repoSettings }
    } = useState();

    /** The folders of the open workspace, in the order the workspace gives them. */
    const roots = $derived(workspaces().folders);
    const origins = $derived(repoOrigins(roots, repoSettings));
</script>

{#each origins as origin (`${origin.kind}:${origin.root}:${origin.tail}`)}
    <p class="origin" data-origin={origin.kind}>
        {origin.lead}<ToolButton
            label={origin.label}
            title={t('workbench.settings_edit_in_tip', `${origin.root}/${REPO_SETTINGS}`)}
            plain
            onclick={() => openView('source', sourceTabState(origin.root, REPO_SETTINGS))}
        />{origin.tail}
    </p>
{/each}

<style>
    .origin {
        margin: 6px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .origin[data-origin='unread'] {
        color: var(--c-red-txt);
    }
</style>
