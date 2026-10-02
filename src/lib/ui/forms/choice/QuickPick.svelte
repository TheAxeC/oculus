<script lang="ts">
    // Layer 3, primitive. VS Code's quick pick, the
    // box Reopen Closed Repositories and Compare with... ask a choice in: a title, an input that
    // narrows the rows by the letters typed, and one row per choice, the first one in force. The
    // arrow keys move the choice in force (and wrap), Enter picks it and Escape, or a press on the
    // ground beside the box, closes it, on the modal ground ui/frame/Modal.svelte draws at the
    // palette's level. A row marked `rule` is drawn after a rule, which is how VS Code sets All
    // Repositories apart from the repositories.
    //
    // The box holds the typed text and the row in force and nothing else: the choices are the
    // caller's, already worded, and a pick is handed out by the id the choice carries.

    import Modal from '../../frame/Modal.svelte';
    import TextInput from '../TextInput.svelte';
    import ToolButton from '../../controls/ToolButton.svelte';

    import type { Choice } from './quick-pick';

    type Props = {
        title: string;
        placeholder: string;
        choices: readonly Choice[];
        onpick: (id: string) => void;
        onclose: () => void;
    };

    let { title, placeholder, choices, onpick, onclose }: Props = $props();

    let box: HTMLDivElement | undefined = $state();
    let query = $state('');
    let at = $state(0);

    /** The rows whose words hold what was typed, in the order given. */
    const shown = $derived(
        choices.filter((one) => one.label.toLowerCase().includes(query.trim().toLowerCase()))
    );

    function typed(next: string): void {
        query = next;
        at = 0;
    }

    function keyed(event: KeyboardEvent): void {
        if (event.isComposing || shown.length === 0) return;
        if (event.key === 'ArrowDown') at = (at + 1) % shown.length;
        else if (event.key === 'ArrowUp') at = (at - 1 + shown.length) % shown.length;
        else if (event.key === 'Enter') onpick(shown[at].id);
        else return;
        event.preventDefault();
    }
</script>

<Modal level="palette" {onclose} onopen={() => box?.querySelector('input')?.focus()}>
    {#snippet children(props)}
        <div
            {...props}
            class="pick"
            aria-label={title}
            data-quick-pick
            bind:this={box}
            onkeydown={keyed}
        >
            <p class="heading">{title}</p>
            <TextInput value={query} label={placeholder} {placeholder} oninput={typed} />
            <ul class="list" role="listbox" aria-label={title}>
                {#each shown as choice, index (choice.id)}
                    <li
                        role="option"
                        aria-selected={index === at}
                        class:rule={choice.rule === true}
                        data-choice={choice.id}
                    >
                        <div class="row" class:now={index === at} role="presentation">
                            <ToolButton
                                plain
                                label={choice.label}
                                onclick={() => onpick(choice.id)}
                            />
                        </div>
                    </li>
                {/each}
            </ul>
        </div>
    {/snippet}
</Modal>

<style>
    .pick {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(36rem, 100%);
        max-height: 70vh;
        margin: 0;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        color: var(--ink-txt, var(--ink));
        box-shadow: var(--shadow);
    }

    :global(body.wall) .pick {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .pick :global(input) {
        width: 100%;
        box-sizing: border-box;
    }

    .heading {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .list {
        display: grid;
        gap: 2px;
        min-height: 0;
        margin: 0;
        padding: 0;
        overflow: auto;
        list-style: none;
    }

    li.rule {
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid var(--line);
    }

    /* One row is one line of the tree's row height, its words at the main size; the row in force
       is ringed by the application's one ring. */
    .row {
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        padding: 0 6px;
        border-radius: var(--radius-sm);
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .row:hover {
        background: var(--chip);
    }

    .row :global(.tool) {
        justify-content: flex-start;
        width: 100%;
        text-align: left;
    }

    .row.now {
        background: var(--chip);
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
