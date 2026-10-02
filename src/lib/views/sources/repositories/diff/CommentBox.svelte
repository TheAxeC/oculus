<script lang="ts">
    // Layer 3, partial of views/sources/repositories/diff/DiffSection.svelte. The box a comment on
    // a line of a session's diff is written in, drawn as a bar after that line: a head naming the
    // session the comment goes to, a text area that takes the focus when the box opens, a line for
    // what a refused or failed send said, and Send and Cancel. Ctrl+Enter or Cmd+Enter sends on
    // every platform, as the commit box does, and Escape closes the box with its text kept; the
    // Escape is stopped here so it does not also restore a maximised pane. The text, the send and
    // the outcome belong to the section: this draws them and reports what was pressed.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { commentKey } from '$lib/state/sources/repositories/review-comment';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** What the session is called: its title, or its id when it has none. */
        title: string;
        text: string;
        /** Whether a send is in flight, which Send waits for. */
        sending: boolean;
        /** What the last refused or failed send said, or the empty string. */
        failure: string;
        /** How often the box was asked to open; the text area is focused each time it rises. */
        opened: number;
        oninput: (text: string) => void;
        onsend: () => void;
        /** Escape: close the box, keeping the text. */
        onclose: () => void;
        /** Cancel: close the box and drop the text. */
        oncancel: () => void;
    };

    let { title, text, sending, failure, opened, oninput, onsend, onclose, oncancel }: Props =
        $props();

    /**
     * Put the focus in the text area once the bar has been placed in the editor and is shown, and
     * again each time the box is asked to open, since a move along one side keeps this element.
     */
    function focusText(node: HTMLElement, asked: number): void {
        if (asked < 1) return;
        queueMicrotask(() => node.querySelector('textarea')?.focus({ preventScroll: true }));
    }

    function keyed(event: KeyboardEvent): void {
        const asked = commentKey(event);
        if (asked === null) return;
        event.preventDefault();
        if (asked === 'send') {
            onsend();
            return;
        }
        event.stopPropagation();
        onclose();
    }
</script>

<div class="comment" data-comment-box {@attach (node: HTMLElement) => focusText(node, opened)}>
    <div class="head">{t('sessions.comment_head', title)}</div>
    <div class="field">
        <TextArea
            value={text}
            label={t('sessions.comment_label')}
            rows={3}
            bare
            {oninput}
            onkeydown={keyed}
        />
    </div>
    {#if failure !== ''}
        <div class="failure" data-comment-failure>
            <Empty error message={failure} />
        </div>
    {/if}
    <div class="foot">
        <ToolButton small label={t('sessions.comment_send')} disabled={sending} onclick={onsend} />
        <ToolButton small label={t('sessions.comment_cancel')} onclick={oncancel} />
    </div>
</div>

<style>
    .comment {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px 8px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: var(--chip);
        font-size: var(--fs-sm);
    }

    .comment:focus-within {
        border-top-color: var(--accent);
    }

    .head {
        color: var(--muted-txt, var(--muted));
    }

    .field {
        padding: 4px 6px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--panel);
    }

    .field:focus-within {
        border-color: var(--accent);
    }

    .foot {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :global(body.wall) .comment {
        background: var(--chip-on-wall);
    }

    :global(body.wall) .field {
        background: transparent;
    }
</style>
