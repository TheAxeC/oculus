<script lang="ts">
    // Layer 3, view partial. What an app that is not approved shows in its tab in place of its
    // frame: what the app is and everything the reader approves by approving it. Approving is of
    // the content hash this panel was drawn for, so an app that changed while the panel was open is
    // not approved by the press.
    //
    // Every word that comes from the manifest, the title, the description and the origins included,
    // is drawn as text by interpolation and never as markup, so a title holding markup shows the
    // markup. The channels and the writes are worded by the catalog (`apps.read.<channel>` and
    // `apps.write.<kind>`); a root app's `git` and `files` are the root's own part, worded
    // `apps.read_root.<channel>`.

    import type { AppRow } from '$lib/state/system/apps/apps.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { readWords, writeWords } from '$lib/state/system/apps/words';

    type Props = {
        row: AppRow;
        /** Whether the tab ran an earlier version of this app. */
        changed: boolean;
        /** The refusal of the last press, already in words, or the empty string. */
        error: string;
        pending: boolean;
        onapprove: (keep: boolean) => void;
        onfolder: () => void;
    };

    let { row, changed, error, pending, onapprove, onfolder }: Props = $props();

    const root = $derived(row.root !== '');
    const title = $derived(root ? `${row.title} (${row.root})` : row.title);

    /** The size of the app's files in the unit that keeps the number short. */
    function size(bytes: number): string {
        return bytes >= 1024 * 1024
            ? t('apps.size_mb', (bytes / (1024 * 1024)).toFixed(1))
            : t('apps.size_kb', Math.max(1, Math.round(bytes / 1024)).toString());
    }
</script>

<div class="panel" data-app-panel={row.name}>
    <h2>{t('apps.approve_title')}</h2>
    <h3 class="title">{title}</h3>
    {#if row.description !== ''}
        <p class="description">{row.description}</p>
    {/if}
    {#if changed}
        <p class="changed" role="status">{t('apps.changed')}</p>
    {/if}
    <p class="meta">{t('apps.name_line', row.name)}</p>
    <p class="meta">{t('apps.folder_line', row.folder)}</p>
    <p class="meta">{t('apps.size_line', row.files.toString(), size(row.bytes))}</p>
    <p class="question">{t('apps.approve_question')}</p>
    <ul>
        {#each row.reads as channel (channel)}
            <li>{readWords(channel, root)}</li>
        {:else}
            <li>{t('apps.reads_none')}</li>
        {/each}
        {#each row.writes as kind (kind)}
            <li>{writeWords(kind)}</li>
        {:else}
            <li>{t('apps.writes_none')}</li>
        {/each}
        {#each row.connects as origin (origin)}
            <li>{t('apps.connects', origin)}</li>
        {:else}
            <li>{t('apps.connects_none')}</li>
        {/each}
        <li>
            {root ? t('apps.store_root', row.storeFile) : t('apps.store_machine', row.storeFile)}
        </li>
    </ul>
    {#if error !== ''}
        <p class="error" role="alert">{error}</p>
    {/if}
    <div class="controls">
        <ToolButton
            label={t('apps.approve')}
            primary
            disabled={pending}
            onclick={() => onapprove(false)}
        />
        {#if !root}
            <ToolButton
                label={t('apps.keep_approved')}
                disabled={pending}
                onclick={() => onapprove(true)}
            />
        {/if}
        <ToolButton label={t('apps.open_folder')} onclick={onfolder} />
    </div>
</div>

<style>
    .panel {
        box-sizing: border-box;
        max-width: 640px;
        margin: 0 auto;
        padding: 16px 20px;
        color: var(--ink);
        overflow-wrap: anywhere;
    }

    h2 {
        margin: 0 0 4px;
        font-size: 14px;
        color: var(--muted-txt, var(--muted));
        font-weight: 600;
    }

    .title {
        margin: 0 0 6px;
        font-size: 16px;
    }

    .description {
        margin: 0 0 8px;
    }

    .changed {
        margin: 0 0 8px;
        color: var(--c-amber-txt, var(--c-amber));
    }

    .meta {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: 12px;
    }

    .question {
        margin: 12px 0 4px;
    }

    ul {
        margin: 0 0 12px;
        padding-left: 20px;
    }

    .error {
        margin: 0 0 8px;
        color: var(--c-red-txt, var(--c-red));
    }

    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
</style>
