// Layer 3, shared view helpers. What the command bar, the project card and the Files menu say of a
// command: how many buttons a bar draws before the rest go into its overflow menu, the key and the
// words of a command, the tooltip of a command, and the items of its menu.
//
// A name can be held by two sources of one repository (the file and the saved commands), so a
// command is told apart by its source and its name together: that pair is its key in every list
// and the id of every pick, and a list that holds one name twice draws the source beside it.
//
// A command saved through the form has Edit and Delete; a command read from a file of the
// repository or found in one has Open File at its entry, which takes the reader to the line that
// defines it. A command has no other item, so a saved command never offers to open a file and a
// file command never offers to be deleted from the page.

import type { MenuItem } from '$lib/ui/menu/menu-items';
import {
    entryPath,
    type CommandSource,
    type ProjectCommand
} from '$lib/state/sessions/terminal/commands.svelte';
import { t } from '$lib/state/shared/words/text';

/** The most buttons a bar draws; the commands after them are in its overflow menu. */
export const SHOWN = 5;

/** The item ids of a command's menu. */
export const EDIT = 'edit';
export const DELETE = 'delete';
export const OPEN = 'open';
export const RUN = 'run';

/** The key of a command in a list and in a pick: its source and its name. */
export function commandKey(command: Pick<ProjectCommand, 'source' | 'name'>): string {
    return `${command.source}:${command.name}`;
}

/** The one word that names a source beside a name two sources hold. */
function sourceWord(source: CommandSource): string {
    if (source === 'file') return t('commands.word_file');
    if (source === 'saved') return t('commands.word_saved');
    return t('commands.word_found');
}

/**
 * What a command is called in a list: its name, and its source beside it when another command of
 * the repository's whole list has the same name.
 */
export function commandLabel(
    command: ProjectCommand,
    all: readonly Pick<ProjectCommand, 'name'>[]
): string {
    const shared = all.filter((one) => one.name === command.name).length > 1;
    return shared ? t('commands.named', command.name, sourceWord(command.source)) : command.name;
}

/** The words of the place a command was read from. */
function sourceWords(command: ProjectCommand): string {
    if (command.source === 'file') return t('commands.source_file');
    if (command.source === 'saved') return t('commands.source_saved');
    return t('commands.source_found');
}

/** The tooltip of a command: its line, and where it was read from. */
export function commandTip(command: ProjectCommand): string {
    return t('commands.tip', command.run, sourceWords(command));
}

/** The items of a command's menu, for the repository it belongs to. */
export function commandMenu(repo: string, command: ProjectCommand): MenuItem[] {
    if (command.source === 'saved') {
        return [
            { id: EDIT, label: t('commands.edit') },
            { id: DELETE, label: t('commands.delete') }
        ];
    }
    return entryPath(repo, command) === null ? [] : [{ id: OPEN, label: t('commands.open_entry') }];
}

/**
 * The overflow menu: each command beyond the bar runs on a pick, and a Manage submenu lists the
 * menu of each, so a command the bar has no button for can still be edited, deleted or opened.
 */
export function overflowMenu(
    repo: string,
    rest: readonly ProjectCommand[],
    all: readonly ProjectCommand[]
): MenuItem[] {
    const manage = rest.flatMap((command) => {
        const items = commandMenu(repo, command).map((item) => ({
            ...item,
            id: `${item.id}:${commandKey(command)}`
        }));
        return items.length === 0
            ? []
            : [{ id: `manage:${commandKey(command)}`, label: commandLabel(command, all), items }];
    });
    return [
        ...rest.map((command) => ({
            id: `${RUN}:${commandKey(command)}`,
            label: commandLabel(command, all),
            title: commandTip(command)
        })),
        ...(manage.length === 0
            ? []
            : [{ id: 'manage', label: t('commands.manage'), rule: true, items: manage }])
    ];
}

/** The source and the name a command's key holds, or null for text that is not such a key. */
export function keyOf(key: string): { source: CommandSource; name: string } | null {
    const [source, ...name] = key.split(':');
    if (source !== 'file' && source !== 'saved' && source !== 'found') return null;
    return { source, name: name.join(':') };
}

/**
 * The action of a pick and the source and name of the command it carries, or null for the heading
 * of a submenu. A name may hold a colon, an action and a source do not.
 */
export function pickOf(
    pick: string
): { action: string; source: CommandSource; name: string } | null {
    const at = pick.indexOf(':');
    const command = at < 0 ? null : keyOf(pick.slice(at + 1));
    return command === null ? null : { action: pick.slice(0, at), ...command };
}

/** The words of what the findings of a repository's command files say, one per line. */
export function findingLines(
    findings: readonly { file: string; field: string; message: string }[]
): string {
    return findings
        .map((one) => {
            const name = one.file.split('/').filter(Boolean).at(-1) ?? one.file;
            return `${name} ${one.field} ${one.message}`.replace(/\s+/g, ' ').trim();
        })
        .join('\n');
}
