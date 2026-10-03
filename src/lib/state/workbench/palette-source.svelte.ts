// Layer 2, client state. The reactive values the shell palette indexes when it opens, and the two
// run dates the update tray draws beside its tasks. This adapter keeps the pure index in palette.ts
// free of stores while exposing only the snapshot, socket feeds, merged config and triage-notes run
// date the shell needs, and the two things the language picker does beyond painting a tab: write a
// file association and open the Settings view on the language settings.

import type { EntitiesStore, WriteAnswer } from '../shared/stores/shapes.ts';
import type { FeedsStore } from '../feeds/feeds.svelte.ts';
import type { PaletteFeeds } from './palette.ts';
import type { Snapshot } from '../../data/model/index.ts';
import { withSettingsQuery } from '../system/config/typed.ts';
import type { LayoutStore } from './layout.svelte.ts';
import { associateEnding } from './navigation/status.ts';
import { SETTINGS_VIEW } from './navigation/rail.ts';
import type { UiStore } from './ui.svelte.ts';

/** The search that shows the language settings row of the Settings view and nothing else. */
const LANGUAGE_SETTINGS = '@id:editor.languages';

/** What the language picker acts through: the configuration write, the layout and the UI store. */
export type PaletteActions = {
    writeConfigValue: Parameters<typeof associateEnding>[0];
    layout: Pick<LayoutStore, 'openView' | 'currentPage'>;
    ui: Pick<UiStore, 'instanceState' | 'setInstanceState'>;
};

export type PaletteSource = {
    snapshot: Snapshot | null;
    feeds: PaletteFeeds;
    config: Record<string, unknown>;
    /**
     * The day the triage skill last wrote its notes, which the update tray shows beside its task.
     */
    notesRun: string | null;
};

/** What one client's palette indexes when it opens. */
export type PaletteSourceStore = {
    paletteSource: () => PaletteSource;
    /**
     * Hold a file ending under a language in the `languages` map of config/sources.yml. Null, and
     * no write, when the map is not one or the language already holds the ending.
     */
    associate: (ending: string, language: string) => Promise<WriteAnswer | null>;
    /**
     * Show the Settings view on the page on screen, its search holding the editor's language
     * settings; the instance it activated. It asks for no rail list in view, which would clear the
     * search.
     */
    openLanguageSettings: () => string;
};

export function createPaletteSource(
    entities: EntitiesStore,
    feeds: FeedsStore,
    actions: PaletteActions
): PaletteSourceStore {
    /** A fresh object so a caller's derived reads every store access in this function. */
    function paletteSource(): PaletteSource {
        return {
            snapshot: entities.portfolio(),
            feeds: {
                leads: feeds.feed('leads'),
                radar: feeds.feed('radar'),
                linkedin: feeds.feed('linkedin')
            },
            config: entities.config()?.config ?? {},
            notesRun: entities.inbox()?.notesRun ?? null
        };
    }

    function associate(ending: string, language: string): Promise<WriteAnswer | null> {
        const languages = entities.config()?.config.languages;
        return associateEnding(actions.writeConfigValue, languages, ending, language);
    }

    function openLanguageSettings(): string {
        const { openView, currentPage } = actions.layout;
        const id = openView(SETTINGS_VIEW, undefined, currentPage().id);
        const state = actions.ui.instanceState(id);
        actions.ui.setInstanceState(id, withSettingsQuery(state, LANGUAGE_SETTINGS));
        return id;
    }

    return { paletteSource, associate, openLanguageSettings };
}
