<script lang="ts">
    // Layer 3, shell. One quick input on the palette's ground. A quick pick is the title, a line
    // that narrows the rows by the letters typed (their label, and their description and detail
    // when the app asked to match them), and one row for each item with its description and detail;
    // the arrow keys move the row in force, Enter picks it, and a pick of many has a box on each
    // row, a Space that checks the row in force while nothing is typed, and an OK that answers the
    // places of the checked items. An input box is the title, the prompt, and a line, drawn as dots
    // for a password; Enter answers its text. When the app checks the text, the check is asked 150
    // ms after the last change and its message marks the line, and Enter answers once the check of
    // the text has come back empty. The answer of a pick is the places of the items in the app's
    // list.

    import { SvelteSet } from 'svelte/reactivity';
    import Modal from '$lib/ui/frame/Modal.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import type { ClientState } from '$lib/state/client/context';
    import { t } from '$lib/state/shared/words/text';

    /** The quick input in front: its request and the calls that answer and check it. */
    type QuickInput = NonNullable<ReturnType<ClientState['appShell']['requests']['quick']>>;

    type Props = { held: QuickInput };

    const { held }: Props = $props();

    // svelte-ignore state_referenced_locally
    const request = held.request;

    let box: HTMLDivElement | undefined = $state();
    let query = $state(request.kind === 'inputBox' ? request.value : '');
    let at = $state(0);
    let message = $state('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let asked = 0;
    const checked = new SvelteSet<number>(
        request.kind === 'quickPick'
            ? request.items.flatMap((item, index) => (item.picked ? [index] : []))
            : []
    );

    /** The rows whose words hold what was typed, each with its place in the app's list. */
    const rows = $derived.by(() => {
        if (request.kind !== 'quickPick') return [];
        const needle = query.trim().toLowerCase();
        return request.items.flatMap((item, index) => {
            const words = [
                item.label,
                request.matchOnDescription ? item.description : '',
                request.matchOnDetail ? item.detail : ''
            ];
            return words.some((one) => one.toLowerCase().includes(needle)) ? [{ item, index }] : [];
        });
    });

    /** Ask the app whether the text is acceptable; the message, empty for yes. */
    async function checkText(value: string): Promise<string> {
        if (held.validate === null) return '';
        asked += 1;
        const mine = asked;
        const answer = await held.validate(value);
        if (mine === asked) message = answer;
        return answer;
    }

    function typed(next: string): void {
        query = next;
        at = 0;
        if (request.kind !== 'inputBox' || held.validate === null) return;
        clearTimeout(timer);
        timer = setTimeout(() => void checkText(next), 150);
    }

    $effect(() => {
        if (request.kind === 'inputBox') void checkText(request.value);
        return () => clearTimeout(timer);
    });

    function toggle(index: number): void {
        if (checked.has(index)) checked.delete(index);
        else checked.add(index);
    }

    function confirmMany(): void {
        held.answer([...checked].sort((a, b) => a - b));
    }

    async function submit(value: string): Promise<void> {
        if ((await checkText(value)) === '') held.answer(value);
    }

    function keyed(event: KeyboardEvent): void {
        if (event.isComposing || request.kind !== 'quickPick') return;
        if (event.key === 'ArrowDown' && rows.length > 0) at = (at + 1) % rows.length;
        else if (event.key === 'ArrowUp' && rows.length > 0) {
            at = (at - 1 + rows.length) % rows.length;
        } else if (event.key === 'Enter') {
            if (request.canPickMany) confirmMany();
            else if (rows.length > 0) held.answer([rows[at].index]);
        } else if (event.key === ' ' && request.canPickMany && query === '' && rows.length > 0) {
            toggle(rows[at].index);
        } else return;
        event.preventDefault();
    }
</script>

<Modal
    level="palette"
    onclose={() => held.answer(undefined)}
    onopen={() => box?.querySelector('input')?.focus()}
>
    {#snippet children(props)}
        <div
            {...props}
            class="quick"
            aria-label={request.title}
            data-app-quick={request.kind}
            bind:this={box}
            onkeydown={keyed}
        >
            {#if request.title !== ''}
                <p class="heading">{request.title}</p>
            {/if}
            {#if request.kind === 'inputBox'}
                {#if request.prompt !== ''}
                    <p class="heading">{request.prompt}</p>
                {/if}
                <TextInput
                    value={query}
                    label={request.title === '' ? request.prompt : request.title}
                    placeholder={request.placeHolder}
                    secret={request.password}
                    invalid={message === '' ? undefined : message}
                    oninput={typed}
                    onenter={(value: string) => void submit(value)}
                />
                {#if message !== ''}
                    <p class="message">{message}</p>
                {/if}
            {:else}
                <TextInput
                    value={query}
                    label={request.title === '' ? request.placeHolder : request.title}
                    placeholder={request.placeHolder}
                    oninput={typed}
                />
                <ul class="list" role="listbox" aria-label={request.title}>
                    {#each rows as row, position (row.index)}
                        <li role="option" aria-selected={position === at} data-choice={row.index}>
                            <div class="row" class:now={position === at} role="presentation">
                                {#if request.canPickMany}
                                    <Checkbox
                                        checked={checked.has(row.index)}
                                        label={row.item.label}
                                        onchange={() => toggle(row.index)}
                                    />
                                {:else}
                                    <ToolButton
                                        plain
                                        label={row.item.label}
                                        onclick={() => held.answer([row.index])}
                                    />
                                {/if}
                                {#if row.item.description !== ''}
                                    <span class="description">{row.item.description}</span>
                                {/if}
                                {#if row.item.detail !== ''}
                                    <span class="detail">{row.item.detail}</span>
                                {/if}
                            </div>
                        </li>
                    {:else}
                        <li class="none">{t('apps.quick_none')}</li>
                    {/each}
                </ul>
                {#if request.canPickMany}
                    <div class="foot">
                        <span class="detail">{t('apps.quick_picked', checked.size)}</span>
                        <ToolButton label={t('apps.quick_ok')} onclick={confirmMany} />
                    </div>
                {/if}
            {/if}
        </div>
    {/snippet}
</Modal>

<style>
    .quick {
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

    :global(body.wall) .quick {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    /* The line spans the box, as the rows under it do. */
    .quick :global(input[type='text']),
    .quick :global(input[type='password']) {
        width: 100%;
        max-width: none;
        box-sizing: border-box;
    }

    .heading {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .message {
        margin: 0;
        color: var(--c-red-txt);
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

    .none {
        padding: 0 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        padding: 0 6px;
        border-radius: var(--radius-sm);
        font-size: var(--fs-md);
        line-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .row:hover {
        background: var(--chip);
    }

    .row.now {
        background: var(--chip);
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .description,
    .detail {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .foot {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
    }
</style>
