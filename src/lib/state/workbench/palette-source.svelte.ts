// Layer 2, client state. The reactive values the shell palette indexes when it opens, and the two
// run dates the update tray draws beside its tasks. This adapter keeps the pure index in palette.ts
// free of stores while exposing only the snapshot, socket feeds, merged config and triage-notes run
// date the shell needs, and what the palette does beyond painting a tab: write a file association,
// open the Settings view on the language settings, and open a file the file mode chose in the view
// that can show it.
//
// A view in focus also offers the palette its own commands: the Present view's slide actions and
// Export to PDF. A view says which commands it offers while it is mounted, keyed by its instance,
// the palette lists the ones of the tab on screen, and choosing one runs the command the view
// handed in.

import { untrack } from 'svelte';
import type { EntitiesStore, WriteAnswer } from '../shared/stores/shapes.ts';
import type { FeedsStore } from '../feeds/feeds.svelte.ts';
import type { PaletteFeeds } from './palette.ts';
import { tabForKind, type AppOpens } from './layout/index.ts';
import type { Snapshot } from '../../data/model/index.ts';
import { withSettingsQuery } from '../system/config/typed.ts';
import type { LayoutStore } from './layout.svelte.ts';
import { associateEnding } from './navigation/status.ts';
import { SETTINGS_VIEW } from './navigation/rail.ts';
import type { UiStore } from './ui.svelte.ts';

/** The search that shows the language settings row of the Settings view and nothing else. */
const LANGUAGE_SETTINGS = '@id:editor.languages';

/**
 * What the palette acts through: the configuration write, the layout, the UI store, the read of a
 * file's kind and what opening a file asks of the apps.
 */
export type PaletteActions = {
    writeConfigValue: Parameters<typeof associateEnding>[0];
    layout: Pick<LayoutStore, 'openView' | 'currentPage' | 'keepPreview' | 'askFocus'>;
    ui: Pick<UiStore, 'instanceState' | 'setInstanceState'>;
    readFileKind: (root: string, path: string) => Promise<{ kind: string }>;
    opens: AppOpens;
};

/** One command a view offers the palette: the label it is listed by, and what choosing it does. */
type ViewCommand = { id: string; label: string; run: () => void };

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
    /**
     * Open a file of a served root as a kept tab in the view that can show it, and give the
     * keyboard to the tab; the instance it opened. The file's kind is read first, so a text file
     * opens in the source tab, an HTML file in the document view and anything else in the file
     * view. `page` is the page or float it opens on, the one the reader is in when none is named.
     */
    openFile: (root: string, path: string, page?: string) => Promise<string>;
    /** Say which commands one view offers, replacing what it offered before. */
    offer: (instance: string, commands: ViewCommand[]) => void;
    /** Take a view's commands away, which is what an unmounted view does. */
    withdraw: (instance: string) => void;
    /** The commands one view offers, none for a view that offers none. */
    offered: (instance: string) => ViewCommand[];
    /** Run one command a view offers; false when the view does not offer it. */
    runOffered: (instance: string, id: string) => boolean;
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

    async function openFile(root: string, path: string, page?: string): Promise<string> {
        const type = await actions.readFileKind(root, path);
        const tab = tabForKind(type.kind, root, path, undefined, actions.opens);
        const id = actions.layout.openView(tab.view, tab.state, page, { preview: false });
        actions.layout.keepPreview(id);
        actions.layout.askFocus(id);
        return id;
    }

    let held = $state<Record<string, ViewCommand[]>>({});

    // A view offers from an effect, so the write reads what is held without subscribing to it:
    // an effect that reads and writes one value runs again at once, without end.
    function offer(instance: string, commands: ViewCommand[]): void {
        held = { ...untrack(() => held), [instance]: commands };
    }

    function withdraw(instance: string): void {
        held = Object.fromEntries(
            Object.entries(untrack(() => held)).filter(([id]) => id !== instance)
        );
    }

    function offered(instance: string): ViewCommand[] {
        return held[instance] ?? [];
    }

    function runOffered(instance: string, id: string): boolean {
        const command = offered(instance).find((one) => one.id === id);
        if (command === undefined) return false;
        command.run();
        return true;
    }

    return {
        paletteSource,
        associate,
        openLanguageSettings,
        openFile,
        offer,
        withdraw,
        offered,
        runOffered
    };
}
