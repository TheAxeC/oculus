<script lang="ts">
    // Layer 3, view partial. The prompt box under a running session: Send types the message into
    // the session's terminal and presses Enter, and Stop presses Escape, which interrupts the turn
    // and keeps the session. Ending a session is the terminal's own stop, elsewhere. A by-hand
    // terminal is typed into like any other. A session that runs in no terminal the page lists, or
    // in a `foreign` one, cannot be typed into from here, and the box says so and holds no controls
    // that would pretend otherwise, as it does for a tab the reader locked and for a session that
    // ended, each with a line of its own. Its text box and that line are at `--fs-sm`, since the
    // box sits in a Terminal tab's transcript body, whose text is `--fs-sm`.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import TextArea from '$lib/ui/forms/TextArea.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { promptKey } from '$lib/state/sessions/terminal/composer/composer';
    import type { Terminal } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The terminal the session runs in, by-hand or not, or null for none on the page. */
        terminal: Terminal | null;
        /** Whether the tab that draws the box is locked, which leaves it read-only. */
        locked?: boolean;
        /** Whether the session ended, which the line says for a box with no terminal. */
        ended?: boolean;
    };

    let { terminal, locked = false, ended = false }: Props = $props();

    const {
        terminals: { interruptTerminal, steerTerminal }
    } = useState();

    let text = $state('');
    let failure = $state('');
    let sending = $state(false);

    /** The terminal the last answer was for, so an answer for one never lands on another. */
    let asked = '';

    const usable = $derived(terminal !== null && terminal.foreign !== true && !locked);

    /** What the box says while it is read-only. */
    const refusal = $derived.by(() => {
        if (locked) return t('composer.locked');
        return ended ? t('composer.ended') : t('composer.elsewhere');
    });

    /** The terminal shown now, which an answer is checked against when it lands. */
    function shownId(): string | null {
        return terminal?.id ?? null;
    }

    async function send(): Promise<void> {
        if (terminal === null || !usable || sending || text.trim() === '') return;
        const id = terminal.id;
        asked = id;
        sending = true;
        failure = '';
        const answer = await steerTerminal(id, text);
        sending = false;
        if (asked !== id || shownId() !== id) return;
        if (!answer.ok) {
            failure = answer.error;
            return;
        }
        text = '';
    }

    async function stop(): Promise<void> {
        if (terminal === null || !usable) return;
        const id = terminal.id;
        asked = id;
        failure = '';
        const answer = await interruptTerminal(id);
        if (asked === id && shownId() === id && !answer.ok) failure = answer.error;
    }

    function keyed(event: KeyboardEvent): void {
        if (promptKey(event) !== 'send') return;
        event.preventDefault();
        void send();
    }
</script>

<div class="steer" data-steer>
    <div class="box" class:off={!usable}>
        <div class="field">
            <TextArea
                value={text}
                label={t('composer.steer')}
                rows={2}
                bare
                readOnly={!usable}
                oninput={(value: string) => (text = value)}
                onkeydown={keyed}
            />
        </div>
        <div class="foot">
            <span class="grow"></span>
            <ToolButton
                label={t('composer.interrupt')}
                title={t('composer.interrupt_title')}
                glyph="cross"
                disabled={!usable}
                onclick={() => void stop()}
            />
            <ToolButton
                label={t('composer.send')}
                title={t('composer.send_title')}
                glyph="arrow_to"
                disabled={!usable || sending || text.trim() === ''}
                onclick={() => void send()}
            />
        </div>
    </div>
    {#if !usable}
        <p class="elsewhere" data-steer-elsewhere>{refusal}</p>
    {:else if failure !== ''}
        <div class="failure" data-steer-failure>
            <Empty error message={failure} />
        </div>
    {/if}
</div>

<style>
    .steer {
        flex: none;
        min-width: 0;
        padding-top: 6px;
    }

    .box {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
    }

    .box.off {
        opacity: 0.6;
    }

    .box:focus-within {
        border-color: var(--accent);
    }

    .field {
        padding: 4px 8px 0;
    }

    .foot {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 6px;
    }

    .grow {
        flex: 1 1 auto;
    }

    .failure {
        margin-top: 4px;
    }

    .elsewhere {
        margin: 4px 0 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .steer :global(.oculus-field) {
        font-size: var(--fs-sm);
    }

    /* Over the wallpaper the box sits on the tinted box of the view, which is its surface there. */
    :global(body.wall) .box {
        background: transparent;
    }

    :global(body.rice) .box {
        background: none;
    }

    /* The monospace face, while the rice theme's option `rice.monospace` is on. */
    :global(body.rice:where(:not(.rice-sans))) .box {
        font-family: var(--font-mono);
    }
</style>
