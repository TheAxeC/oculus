// Layer 3, view partial of Repositories.svelte. The groups of the view's `...` menu, in VS Code's
// order: the remote group (Pull, Push, Fetch and Sync where the repository has an upstream, and
// Publish Branch once per remote when the branch has none), the three stashes, the tags, and the
// group that reopens the repositories the tab closed, and the group that clones a repository of the
// reader's GitHub account. A repository the view cannot read offers the reopen and clone groups
// alone, and so does a tab that shows none.

import type { GitState } from '$lib/state/client/selectors.svelte';
import type { MenuGroup, MenuItem } from '$lib/ui/menu/menu-items';
import { canPublish, upstreamOf } from '$lib/state/sources/repositories/repositories';
import { t } from '$lib/state/shared/words/text';

/**
 * The menu's groups for a tab that has closed `closed` repositories and shows `held`, the state of
 * the repository it shows, or null when that state is not one the view reads.
 */
export function viewMenu(closed: number, held: GitState | null): MenuGroup[] {
    const clone: MenuGroup = {
        id: 'clone',
        heading: t('repositories.menu_clone'),
        items: [{ id: 'clone', label: t('repositories.clone'), glyph: 'clone' }]
    };
    const reopen: MenuGroup[] =
        closed === 0
            ? []
            : [
                  {
                      id: 'closed',
                      heading: t('repositories.menu_closed'),
                      items: [
                          {
                              id: 'reopen',
                              label: t('repositories.reopen_closed'),
                              glyph: 'repositories'
                          }
                      ]
                  }
              ];
    if (held === null) return [...reopen, clone];
    const upstream = upstreamOf(held);
    const remote = [
        { id: 'pull', label: t('repositories.pull'), glyph: 'pull' },
        { id: 'push', label: t('git.push'), glyph: 'push' },
        { id: 'fetch', label: t('repositories.fetch'), glyph: 'fetch' },
        { id: 'sync', label: t('repositories.sync'), glyph: 'sync' }
    ].filter((item) => item.id === 'fetch' || upstream !== '');
    const remotes: MenuItem[] = [...remote];
    // Publish Branch names its remote, one choice per remote the repository has.
    if (canPublish(held)) {
        for (const name of held.remotes) {
            remotes.push({
                id: `publish:${name}`,
                label: t('repositories.publish_to', name),
                glyph: 'publish'
            });
        }
    }
    return [
        { id: 'remote', heading: t('repositories.menu_remote'), items: remotes },
        {
            id: 'stash',
            heading: t('repositories.menu_stash'),
            items: [
                { id: 'tracked', label: t('repositories.stash_tracked'), glyph: 'stash' },
                { id: 'untracked', label: t('repositories.stash_untracked'), glyph: 'stash' },
                { id: 'staged', label: t('repositories.stash_staged'), glyph: 'stash' }
            ]
        },
        {
            id: 'tags',
            heading: t('repositories.menu_tags'),
            items: [
                { id: 'create', label: t('repositories.tag_create'), glyph: 'tag' },
                { id: 'push', label: t('repositories.tags_push'), glyph: 'push' }
            ]
        },
        ...reopen,
        clone
    ];
}
