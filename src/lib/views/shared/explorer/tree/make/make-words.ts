// Layer 3, view helper of the make dialogs. The words of a group of a make dialog and the one
// short line of each row, from what oculus's docs/templates.md says of each file and collection,
// each through its own catalog key. A collection the switch does not name, one a newer
// templates page lists, draws no line.

import { t } from '$lib/state/shared/words/text';
import type { MakeGroup } from '../control/making.svelte';

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

/** The line of a collection, by its key. */
function collectionLine(key: string): string {
    switch (key) {
        case 'data':
            return t('files.make_collection_line_data');
        case 'venues':
            return t('files.make_collection_line_venues');
        case 'pillars':
            return t('files.make_collection_line_pillars');
        case 'domains':
            return t('files.make_collection_line_domains');
        case 'statements':
            return t('files.make_collection_line_statements');
        case 'people':
            return t('files.make_collection_line_people');
        case 'organisations':
            return t('files.make_collection_line_organisations');
        case 'resources':
            return t('files.make_collection_line_resources');
        case 'funding':
            return t('files.make_collection_line_funding');
        case 'events':
            return t('files.make_collection_line_events');
        case 'education':
            return t('files.make_collection_line_education');
        case 'applications':
            return t('files.make_collection_line_applications');
        case 'joint-work':
            return t('files.make_collection_line_joint_work');
        case 'tasks':
            return t('files.make_collection_line_tasks');
        case 'literature':
            return t('files.make_collection_line_literature');
        case 'leads':
            return t('files.make_collection_line_leads');
        case 'radar':
            return t('files.make_collection_line_radar');
        default:
            return '';
    }
}

/** The line of a row of a group: what the file or the collection holds. */
export function rowLine(group: MakeGroup['id'], key: string): string {
    return group === 'collections' ? collectionLine(key) : fileLine(key);
}
