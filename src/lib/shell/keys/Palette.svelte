<script lang="ts">
    // Layer 3, shell. The Cmd-K overlay over the workbench. It builds a fresh pure index whenever
    // it opens, then either matches every query word or lists the colon commands; choosing a result
    // changes layout or appearance state and never mounts a view of its own. Every row is one grid
    // line: what it is in words, then the control that opens it filling the rest.

    import Search from '$lib/ui/controls/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { openPaletteItem } from '$lib/shell/keys/palette-open';
    import {
        buildIndex,
        commands,
        kindWord,
        match,
        parseCommand,
        type PaletteCommand,
        type PaletteItem
    } from '$lib/state/workbench/palette';
    import { t } from '$lib/state/words/text';
    import { registrationLabel } from '$lib/views/registry';
    import { untrack } from 'svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        layout: { openView },
        paletteSource: { paletteSource },
        ui: { setCrt, setTheme, crt },
        registry: { views }
    } = client;

    type Props = {
        open: boolean;
        onclose: () => void;
        onupdate: () => void;
        /** The text installed on this opening, empty for Cmd-K and colon for command mode. */
        prefill?: string;
    };

    let { open, onclose, onupdate, prefill = '' }: Props = $props();
    let query = $state(untrack(() => prefill));
    let selected = $state(0);
    let ground: HTMLDivElement | undefined = $state();

    const current = $derived(paletteSource());
    const knownViews = $derived(
        views().map((view) => ({ id: view.id, label: registrationLabel(view) }))
    );
    const index = $derived(open ? buildIndex(current.snapshot, current.feeds, knownViews) : []);
    const parsed = $derived(parseCommand(query));
    const commandList = $derived(
        parsed === null
            ? []
            : commands(current.config).filter((command) => command.name.startsWith(parsed.name))
    );
    const matches = $derived(parsed === null ? match(index, query).slice(0, 30) : []);
    const count = $derived(parsed === null ? matches.length : commandList.length);

    $effect(() => {
        if (!open || ground === undefined) return;
        query = prefill;
        selected = 0;
        ground.querySelector<HTMLInputElement>('input')?.focus();
    });

    $effect(() => {
        if (count === 0) selected = 0;
        else if (selected >= count) selected = count - 1;
    });

    function move(delta: number): void {
        if (count === 0) return;
        selected = (selected + delta + count) % count;
    }

    function choose(item: PaletteItem): void {
        onclose();
        openPaletteItem(client.layout, client.ui, item);
    }

    function run(command: PaletteCommand): void {
        if (!command.available || parsed === null) return;
        const argument = parsed.argument;
        if (command.name === 'theme') {
            const configured = Array.isArray(current.config.themes)
                ? current.config.themes.flatMap((row) => {
                      if (typeof row !== 'object' || row === null || Array.isArray(row)) return [];
                      const name = (row as Record<string, unknown>).name;
                      return typeof name === 'string' ? [name] : [];
                  })
                : [];
            if (configured.includes(argument)) setTheme(argument);
        } else if (command.name === 'crt') {
            setCrt(!crt());
        } else if (command.name === 'tab') {
            if (knownViews.some((view) => view.id === argument)) openView(argument);
        } else if (command.name === 'goto') {
            const project = current.snapshot?.entities.projects[argument];
            if (project !== undefined) {
                openView('project', {
                    id: project.id,
                    label: project.short ?? project.title
                });
            }
        } else if (command.name === 'update') {
            onupdate();
        }
        onclose();
    }

    function keys(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            move(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (parsed === null) {
                const item = matches.at(selected);
                if (item !== undefined) choose(item);
            } else {
                const command = commandList.at(selected);
                if (command !== undefined) run(command);
            }
        }
    }
</script>

{#if open}
    <div
        class="ground"
        bind:this={ground}
        role="presentation"
        onkeydown={keys}
        onclick={(event) => {
            if (event.target === event.currentTarget) onclose();
        }}
    >
        <div class="palette" role="dialog" aria-modal="true" aria-label={t('app.search')}>
            <Search
                value={query}
                placeholder={t('app.palette.cmdk_placeholder')}
                oninput={(value: string) => {
                    query = value;
                    selected = 0;
                }}
            />
            <div class="list" role="listbox">
                {#if parsed === null}
                    {#each matches as item, at (item.id)}
                        <div
                            class="result"
                            class:selected={selected === at}
                            role="option"
                            aria-selected={selected === at}
                        >
                            <span class="kind">{kindWord(item.kind, t)}</span>
                            <ToolButton label={item.label} onclick={() => choose(item)} />
                        </div>
                    {/each}
                {:else}
                    {#each commandList as command, at (command.name)}
                        <div
                            class="result"
                            class:selected={selected === at}
                            role="option"
                            aria-selected={selected === at}
                        >
                            <span class="kind">:</span>
                            <ToolButton
                                label={`${command.name}${command.hint === '' ? '' : ` ${command.hint}`}`}
                                disabled={!command.available}
                                title={!command.available
                                    ? t('app.palette_unavailable')
                                    : undefined}
                                onclick={() => run(command)}
                            />
                            {#if !command.available}
                                <span class="unavailable">{t('app.palette_unavailable')}</span>
                            {/if}
                        </div>
                    {/each}
                {/if}
                {#if count === 0}
                    <p class="empty">
                        {parsed === null ? t('app.palette_empty') : t('app.palette.cmd_unknown')}
                    </p>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .ground {
        position: fixed;
        inset: 0;
        z-index: 70;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 10vh 16px 16px;
    }

    .ground::before {
        position: absolute;
        inset: 0;
        content: '';
        background: var(--bg);
        opacity: 0.72;
    }

    .palette {
        position: relative;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        width: min(42rem, 100%);
        max-height: 70vh;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        background: var(--panel);
        box-shadow: var(--shadow);
    }

    /* A palette floats over a pane, so at the pane's own opacity it would be read through two translucent layers and the picture. It keeps more of its colour than the pane does. */
    :global(body.wall) .palette {
        background: color-mix(in srgb, var(--panel) var(--wall-popover), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .palette :global(input) {
        width: 100%;
        box-sizing: border-box;
    }

    .list {
        display: grid;
        gap: 4px;
        min-height: 0;
        overflow: auto;
    }

    .result {
        display: grid;
        grid-template-columns: minmax(5rem, auto) 1fr auto;
        align-items: center;
        gap: 6px;
        padding: 2px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
    }

    .result.selected {
        border-color: var(--accent);
    }

    .result :global(.tool) {
        justify-content: flex-start;
        width: 100%;
        text-align: left;
        white-space: normal;
    }

    .kind,
    .unavailable,
    .empty {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .kind {
        text-align: right;
    }

    .empty {
        margin: 0;
        padding: 8px;
    }
</style>
