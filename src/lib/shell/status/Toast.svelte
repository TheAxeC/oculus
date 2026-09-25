<script lang="ts">
    // Layer 3, shell. One notification shown as a toast over the status bar's right end, as VS
    // Code shows one: for eight seconds, or until its Close is pressed, and then put away, its
    // entry kept in the centre's list. An action pressed on it puts it away too, since the reader
    // has answered it.

    import NoticeEntry from './NoticeEntry.svelte';
    import type { Notice } from '$lib/state/workbench/navigation/notices.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        notices: { settle }
    } = useState();

    let { notice }: { notice: Notice } = $props();

    /** How long a toast stands before it is put away, VS Code's own time. */
    const TOAST_MS = 8000;

    $effect(() => {
        const id = notice.id;
        const timer = setTimeout(() => settle(id), TOAST_MS);
        return () => clearTimeout(timer);
    });

    const answered = $derived({
        ...notice,
        actions: notice.actions.map((action) => ({
            label: action.label,
            run: () => {
                settle(notice.id);
                action.run();
            }
        }))
    });
</script>

<div class="toast" role={notice.tone === 'error' ? 'alert' : 'status'} data-toast={notice.id}>
    <NoticeEntry
        notice={answered}
        dismiss={t('statusbar.toast_close')}
        ondismiss={() => settle(notice.id)}
    />
</div>

<style>
    .toast {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    :global(body.wall) .toast {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
</style>
