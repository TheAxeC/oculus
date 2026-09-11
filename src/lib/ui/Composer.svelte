<script lang="ts">
    // Layer 3, primitive. A box to write a message in and a control to send it: the way a prompt is
    // given to an agent without typing it into the raw grid, and the way it is sent to a terminal
    // other than the one on screen (DESIGN.md, "PTY", human routing into another session).
    //
    // What it keeps for itself is the last ten texts it sent, recalled with the up arrow on an empty
    // first line, and which of them the arrow is standing on. Where the text goes is the caller's:
    // this reports a send and a routed send and holds neither terminal.

    import Menu, { type MenuItem } from './Menu.svelte';
    import TextArea from './TextArea.svelte';
    import ToolButton from './ToolButton.svelte';

    /** How many sent texts the arrow can walk back through. */
    const KEPT = 10;

    type Props = {
        /** The box's accessible name, already translated by the caller. */
        label: string;
        /** The send control's words, already translated. */
        send: string;
        onsend: (text: string) => void;
        /**
         * Where else the text may go, as the menu beside the send control lists them. An empty list
         * draws no menu, which is a page with one terminal on it.
         */
        routes?: MenuItem[];
        /** The menu's own words, already translated. */
        routeLabel?: string;
        onroute?: (id: string, text: string) => void;
    };

    let { label, send, onsend, routes = [], routeLabel = '', onroute }: Props = $props();

    let text = $state('');

    /** The texts already sent, newest first. */
    let history: string[] = $state([]);

    /** Where the up arrow stands in the history, or -1 when it stands on what is being typed. */
    let at = $state(-1);

    function remember(sent: string): void {
        history = [sent, ...history.filter((one) => one !== sent)].slice(0, KEPT);
        at = -1;
        text = '';
    }

    function sendIt(): void {
        const sent = text.trim();
        if (sent === '') return;
        onsend(sent);
        remember(sent);
    }

    function routeIt(id: string): void {
        const sent = text.trim();
        if (sent === '' || onroute === undefined) return;
        onroute(id, sent);
        remember(sent);
    }

    // Enter sends and Shift-Enter breaks a line, which is the way round a chat box works and the
    // opposite of a text box; the up arrow recalls only while nothing has been typed over it, so a
    // multi-line draft is walked through rather than thrown away.
    function pressed(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendIt();
            return;
        }
        if (event.key === 'ArrowUp' && (text === '' || at >= 0) && history.length > 0) {
            event.preventDefault();
            at = Math.min(at + 1, history.length - 1);
            text = history[at];
            return;
        }
        if (event.key === 'ArrowDown' && at >= 0) {
            event.preventDefault();
            at -= 1;
            text = at < 0 ? '' : history[at];
        }
    }
</script>

<div class="composer">
    <TextArea
        value={text}
        {label}
        rows={2}
        oninput={(next) => {
            text = next;
            at = -1;
        }}
        onkeydown={pressed}
    />
    <div class="controls">
        <ToolButton label={send} onclick={sendIt} />
        {#if routes.length > 0 && onroute !== undefined}
            <Menu
                label={routeLabel}
                items={routes}
                placement="up"
                align="right"
                onpick={(id) => routeIt(id)}
            />
        {/if}
    </div>
</div>

<style>
    .composer {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        min-width: 0;
        padding: 6px 0 0;
    }

    .composer :global(.area) {
        flex: 1 1 auto;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: 0 0 auto;
    }
</style>
