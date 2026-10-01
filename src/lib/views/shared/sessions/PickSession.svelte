<script lang="ts">
    // Layer 3, shared view. What a session view draws while nothing it follows is picked: the line
    // saying so, and a control that opens the Sessions view, the view that lists every session and
    // terminal and where one is picked. The session views and the Terminal view draw it the same
    // way, so it lives here once.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** What is not picked, already translated by the view. */
        message: string;
        /** A name in `glyphs:`, drawn before the message. */
        glyph: string;
    };

    let { message, glyph }: Props = $props();

    const {
        layout: { openView }
    } = useState();
</script>

<div class="pick" data-pick-session>
    <Empty {message} {glyph} />
    <ToolButton
        label={t('sessions.open_sessions')}
        title={t('sessions.open_sessions_tip')}
        onclick={() => openView('session-list')}
    />
</div>

<style>
    /* The empty state is centred, so the control that opens the Sessions view is centred under
       it. */
    .pick {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
</style>
