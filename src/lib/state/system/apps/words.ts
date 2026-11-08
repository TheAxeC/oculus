// Layer 2, client state. The words the approval panel and the write question say a channel or a
// write kind in, and the state an app's row on the Apps view says it is in. The catalog holds one
// key per channel (`apps.read.<channel>`), one per kind for the panel (`apps.write.<kind>`) and one
// per kind that asks first for the question (`apps.ask.<kind>`). Each is read by a closure with its
// key written whole, so a key that no closure reads, or a closure naming a key the catalog lacks,
// is found by the key check.

import type { AppContributes, AppRow } from '../../../data/model/index.ts';
import { plural, t } from '../../shared/words/text.ts';

/** The sentence for a channel an app reads, by channel; a channel with no sentence has no entry. */
const READ: Record<string, (() => string) | undefined> = {
    portfolio: () => t('apps.read.portfolio'),
    feeds: () => t('apps.read.feeds'),
    git: () => t('apps.read.git'),
    hpc: () => t('apps.read.hpc'),
    audit: () => t('apps.read.audit'),
    config: () => t('apps.read.config'),
    files: () => t('apps.read.files'),
    inbox: () => t('apps.read.inbox'),
    calendar: () => t('apps.read.calendar'),
    sessions: () => t('apps.read.sessions'),
    usage: () => t('apps.read.usage')
};

/** The sentence for the two channels a root app reads in part. */
const READ_ROOT: Record<string, (() => string) | undefined> = {
    git: () => t('apps.read_root.git'),
    files: () => t('apps.read_root.files')
};

/** The sentence for a write kind an app may declare, by kind. */
const WRITE: Record<string, (() => string) | undefined> = {
    manifest: () => t('apps.write.manifest'),
    entry: () => t('apps.write.entry'),
    subtask: () => t('apps.write.subtask'),
    'subtask-add': () => t('apps.write.subtask-add'),
    followup: () => t('apps.write.followup'),
    'followup-add': () => t('apps.write.followup-add'),
    host: () => t('apps.write.host'),
    'new-entry': () => t('apps.write.new-entry'),
    reorder: () => t('apps.write.reorder'),
    'delete-entry': () => t('apps.write.delete-entry'),
    'feed-field': () => t('apps.write.feed-field'),
    'feed-delete': () => t('apps.write.feed-delete'),
    'lead-add': () => t('apps.write.lead-add'),
    'radar-add': () => t('apps.write.radar-add'),
    'linkedin-idea': () => t('apps.write.linkedin-idea'),
    'linkedin-post': () => t('apps.write.linkedin-post'),
    'new-idea': () => t('apps.write.new-idea')
};

/** The verb phrase of the question for a write kind that asks first, by kind. */
const ASK: Record<string, (() => string) | undefined> = {
    'delete-entry': () => t('apps.ask.delete-entry'),
    'feed-delete': () => t('apps.ask.feed-delete'),
    'new-idea': () => t('apps.ask.new-idea'),
    'linkedin-idea': () => t('apps.ask.linkedin-idea'),
    'linkedin-post': () => t('apps.ask.linkedin-post')
};

/** The sentence for a channel an app reads: the root's own part for a root app of `git` or `files`.
 * */
export function readWords(channel: string, root: boolean): string {
    const held = root ? (READ_ROOT[channel] ?? READ[channel]) : READ[channel];
    return held === undefined ? channel : held();
}

/** The sentence for a write kind, or the kind itself for one the catalog has no sentence for. */
export function writeWords(kind: string): string {
    const held = WRITE[kind];
    return held === undefined ? kind : held();
}

/** The verb phrase of the question for a write kind that asks first, or the kind itself. */
export function askWords(kind: string): string {
    const held = ASK[kind];
    return held === undefined ? kind : held();
}

/** The number of the entries of a list of views by container. */
function viewCount(views: AppContributes['views']): number {
    return Object.values(views).reduce((sum, list) => sum + list.length, 0);
}

/**
 * The sentence naming what an app adds to oculus: its commands, keys, menu entries, views, custom
 * editors, settings and themes, each with its count. The empty string for an app that adds none.
 */
export function addsWords(contributes: AppContributes): string {
    const menus = Object.values(contributes.menus).reduce((sum, list) => sum + list.length, 0);
    const commands = contributes.commands.length;
    const keys = contributes.keybindings.length;
    const views = viewCount(contributes.views);
    const editors = contributes.customEditors.length;
    const settings = contributes.configuration?.properties.length ?? 0;
    const themes = contributes.themes.length;
    const icons = contributes.iconThemes.length;
    const parts: [number, string][] = [
        [commands, plural('apps.adds.commands', commands, commands)],
        [keys, plural('apps.adds.keys', keys, keys)],
        [menus, plural('apps.adds.menus', menus, menus)],
        [views, plural('apps.adds.views', views, views)],
        [editors, plural('apps.adds.editors', editors, editors)],
        [settings, plural('apps.adds.settings', settings, settings)],
        [themes, plural('apps.adds.themes', themes, themes)],
        [icons, plural('apps.adds.icons', icons, icons)]
    ];
    const named = parts.flatMap(([count, said]) => (count === 0 ? [] : [said]));
    return named.length === 0 ? '' : t('apps.adds_line', named.join(', '));
}

/**
 * The state an app is in, in words, from what its row carries: disabled for this workspace by the
 * workspace's list, disabled, waiting for approval, changed since approval (a kept app whose files
 * left the hash that was approved), editing (a kept app), or approved. A changed app that is not
 * kept reads waiting for approval, since no record says it was approved before.
 */
export function appStateWords(
    row: Pick<AppRow, 'workspaceState' | 'disabled' | 'approved' | 'hashApproved' | 'kept'>
): string {
    if (row.workspaceState === 'disabled') return t('apps.state_disabled_workspace');
    if (row.disabled) return t('apps.state_disabled');
    if (!row.approved) return t('apps.state_waiting');
    if (row.kept && !row.hashApproved) return t('apps.state_changed');
    if (row.kept) return t('apps.state_editing');
    return t('apps.state_approved');
}
