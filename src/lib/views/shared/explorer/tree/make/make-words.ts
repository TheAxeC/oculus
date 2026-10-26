// Layer 3, view helper of the make dialogs. The words of a group of a make dialog and the one
// short line of each row, from what oculus's docs/templates.md says of each file and collection:
// a file's line through its own catalog key, a collection's through the word its template line's
// `about:` names. A collection whose line names no word draws no line.

import { hasText, t } from '$lib/state/shared/words/text';
import type { MakeGroup, MakeRow } from '../control/making.svelte';

/** The heading of a group and the sentence saying what it is for. */
export function groupWords(id: MakeGroup['id']): { title: string; about: string } {
    if (id === 'hub-files') {
        return {
            title: t('files.make_group_hub_files'),
            about: t('files.make_group_hub_files_about')
        };
    }
    if (id === 'collections') {
        return {
            title: t('files.make_group_collections'),
            about: t('files.make_group_collections_about')
        };
    }
    return {
        title: t('files.make_group_repository'),
        about: t('files.make_group_repository_about')
    };
}

/** The line of a hub file or a repository configuration file, by its name. */
function fileLine(key: string): string {
    switch (key) {
        case 'config':
            return t('files.make_hub_line_config');
        case 'local':
            return t('files.make_hub_line_local');
        case 'schedules':
            return t('files.make_hub_line_schedules');
        case 'settings':
            return t('files.make_repo_line_settings');
        case 'commands':
            return t('files.make_repo_line_commands');
        case 'launch':
            return t('files.make_repo_line_launch');
        case 'cpp':
            return t('files.make_repo_line_cpp');
        default:
            return '';
    }
}

/**
 * The line of a row of a group: what the file or the collection holds, a collection's the word its
 * `about:` names, or none.
 */
export function rowLine(group: MakeGroup['id'], row: MakeRow): string {
    if (group !== 'collections') return fileLine(row.key);
    return row.about !== undefined && hasText(row.about) ? t(row.about) : '';
}
