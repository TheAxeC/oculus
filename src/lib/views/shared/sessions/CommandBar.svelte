<script lang="ts">
    // Layer 3, shared view. The commands of one repository as a row of buttons: one per command up
    // to five, the rest in an overflow menu, then the control that adds a command. A press runs the
    // command as a task terminal; one that has not been approved asks first. The question and the
    // form that saves a command are drawn by the shell (shell/commands/CommandAsk.svelte), which
    // the bar opens through the commands store. The tooltip of a button is the command's line and
    // where it was read from. A right-click on a button opens its menu: Edit, Schedule... and
    // Delete for a command saved through the form, Open File at its entry for one read from a file
    // or found. Schedule... opens the schedule dialog for the command over the update tray.
    //
    // The bar holds the repository's list while it is drawn (the commands store's `watch`), so a
    // repository nobody draws is not asked for. It draws nothing until the list is read, and a
    // repository with no commands draws only the control that adds one. A file of commands that
    // could not be read is marked beside the buttons, with each finding in its tooltip.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { draftOf, entryPath } from '$lib/state/sessions/terminal/commands.svelte';
    import type { ProjectCommand } from '$lib/state/sessions/terminal/commands.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import AskConfirm from '../writes/AskConfirm.svelte';
    import type { Ask } from '../writes/ask';
    import {
        DELETE,
        EDIT,
        OPEN,
        RUN,
        SCHEDULE,
        SHOWN,
        commandKey,
        commandLabel,
        commandMenu,
        commandTip,
        findingLines,
        overflowMenu,
        pickOf
    } from './commands';

    type Props = {
        /** The repository's absolute path, as the `git` channel names it. */
        repo: string;
    };

    let { repo }: Props = $props();

    const {
        commands: { commands, openAt, openForm, press, remove, watch },
        notices,
        schedule,
        ui
    } = useState();

    // The list is held while this bar is drawn.
    $effect(() => watch(repo));

    const list = $derived(commands(repo));
    const bar = $derived(list?.commands.slice(0, SHOWN) ?? []);
    const rest = $derived(list?.commands.slice(SHOWN) ?? []);

    /** The delete waiting for its yes. */
    let asking: Ask | null = $state(null);

    function run(command: ProjectCommand): void {
        void press(repo, command.name, command.source);
    }

    function ask(command: ProjectCommand): void {
        asking = {
            message: t('commands.delete_ask', command.name),
            detail: command.run,
            confirm: t('commands.delete'),
            act: () => {
                void remove(repo, command.name).then((done) => {
                    if (!done.ok) notices.post(done.error, { tone: 'error' });
                });
            }
        };
    }

    /** A pick of a command's menu. */
    function picked(action: string, command: ProjectCommand): void {
        if (action === RUN) run(command);
        else if (action === EDIT) openForm(repo, draftOf(repo, command));
        else if (action === SCHEDULE) {
            schedule.openDialog({ command: command.name, folder: repo, name: command.name });
            ui.requestUpdateTray();
        } else if (action === DELETE) ask(command);
        else if (action === OPEN) open(command);
    }

    function open(command: ProjectCommand): void {
        const path = entryPath(repo, command);
        if (path !== null && command.entry !== undefined) {
            openAt(repo, path, command.entry.line);
        }
    }

    /** A pick of the overflow menu: the command it names, and what to do with it. */
    function overflowPicked(pick: string): void {
        const parsed = pickOf(pick);
        if (parsed === null) return;
        const command = list?.commands.find(
            (one) => one.source === parsed.source && one.name === parsed.name
        );
        if (command !== undefined) picked(parsed.action, command);
    }
</script>

{#if list !== null}
    <span class="bar" data-command-bar>
        {#each bar as command (commandKey(command))}
            <span class="one" data-command={command.name} data-command-source={command.source}>
                <ContextMenu
                    label={commandLabel(command, list.commands)}
                    items={commandMenu(repo, command)}
                    own
                    onpick={(pick: string) => picked(pick, command)}
                >
                    <ToolButton
                        small
                        label={commandLabel(command, list.commands)}
                        title={commandTip(command)}
                        onclick={() => run(command)}
                    />
                </ContextMenu>
            </span>
        {/each}
        {#if rest.length > 0}
            <span class="one" data-command-more>
                <Menu
                    small
                    label={t('commands.more')}
                    items={overflowMenu(repo, rest, list.commands)}
                    placement="down"
                    align="right"
                    onpick={overflowPicked}
                />
            </span>
        {/if}
        <span class="one" data-command-add>
            <ToolButton
                small
                label={t('commands.add')}
                title={t('commands.add_tip')}
                onclick={() => openForm(repo, null)}
            />
        </span>
        {#if list.findings.length > 0}
            <span class="one" data-command-findings title={findingLines(list.findings)}>
                <Tag
                    label={t('commands.findings', list.findings.length)}
                    glyph="warn"
                    tone="amber"
                />
            </span>
        {/if}
    </span>
{/if}

<AskConfirm {asking} onclose={() => (asking = null)} />

<style>
    .bar {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    .one {
        display: inline-flex;
    }
</style>
