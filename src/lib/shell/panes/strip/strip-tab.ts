// Layer 3, shell. The strip's tab for one instance: the registry's words and glyph, or the view's
// own id when it has none. A state carrying a `label` shows that instead of the view's name, so two
// documents read as two. A tab showing a file carries its path, which the strip draws the file's
// icon for.

import type { ClientState } from '$lib/state/client/context';
import type { Instance } from '$lib/state/workbench/layout';
import { instanceLabel } from '$lib/state/workbench/layout';
import { shownFileOfTab } from '$lib/state/workbench/navigation/pages';
import {
    badgeOf,
    registrationGlyph,
    registrationLabel,
    type Registration
} from '$lib/state/workbench/navigation/registry';
import type { Tab } from '$lib/ui/tabs/tab-strip';
import { stripMark, tabHint } from '../pane-view';

type Words = (key: string, ...args: (string | number)[]) => string;

/** What a tab reads of the stores: the registry, the terminals' marks, the path and the dirt. */
export type StripTabFacts = {
    viewFor: (view: string) => Registration | undefined;
    client: ClientState;
    mark: (instance: Instance) => { glyph?: string; token?: string };
    pathOf: (instance: Instance) => string | null;
    dirty: (id: string) => boolean;
};

export function stripTab(instance: Instance, facts: StripTabFacts, t: Words): Tab {
    const found = facts.viewFor(instance.view);
    if (found === undefined) {
        return { id: instance.id, label: t('ui.unknown_view', instance.view) };
    }
    const own = instanceLabel(instance.state);
    const badge = badgeOf(found, facts.client);
    const preview = instance.preview === true;
    return {
        id: instance.id,
        label: own ?? registrationLabel(found),
        ...stripMark(registrationGlyph(found), facts.mark(instance)),
        file: shownFileOfTab(instance)?.path,
        preview,
        pinned: instance.pinned === true,
        hint: tabHint(
            {
                preview,
                path: facts.pathOf(instance),
                viewWords: own === null ? undefined : registrationLabel(found)
            },
            t
        ),
        badge: badge.tabText,
        badgeGlyph: badge.glyph,
        badgeTone: badge.tone,
        badgeTitle: badge.title,
        cells: badge.text === '' ? undefined : badge.cells,
        dirty: facts.dirty(instance.id)
    };
}
