// Layer 4, test fixture. What the workbench view suites share: the real config with its catalog and
// glyphs installed, and a Settings row's item (settings/Item.svelte) rendered on the server with
// the lists of the shipped config and its changes held in a stage in memory.

import { render } from 'svelte/server';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/shared/words/text.ts';
import { setAppearance } from '../../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../../src/lib/data/places/code-rules.ts';
import { listsOf } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import type { ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    createRowWriter,
    heldKey,
    type Held,
    type Stage
} from '../../../../src/lib/state/system/config/scopes/write.ts';
import Item from '../../../../src/lib/views/system/workbench/settings/Item.svelte';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

const config = loadConfig(engineDir()).config;

export const catalog = textCatalog(config);

setCatalog(catalog);
setGlyphs(glyphCatalog(config));
const codeThemeClasses = vscodeRuleIds();
setAppearance(config, codeThemeClasses);

/**
 * A stage of the unsaved changes of one scope, held in memory by the key the writers keep a row's
 * state under.
 */
export function memoryStage(): Stage & { changes: Map<string, Held> } {
    const changes = new Map<string, Held>();
    return {
        changes,
        set: (row, value) => void changes.set(heldKey(row), { value }),
        reset: (row) => void changes.set(heldKey(row), { reset: true }),
        drop: (row) => void changes.delete(heldKey(row)),
        held: (row) => changes.get(heldKey(row))
    };
}

/**
 * The markup of one row's item, drawn in the Settings tab `id` of the client's page outside a
 * Settings view, with its changes held in a stage of its own.
 */
export function drawnItem(row: ConfigRow, client: ClientState, id: string): string {
    const lists = listsOf({
        config,
        portfolio: null,
        views: [],
        tiers: null,
        themeClasses: [],
        codeThemeClasses,
        offers: { themes: [], icons: [] },
        folder: () => ({ state: 'ready', entries: [] })
    });
    const stage = memoryStage();
    const writer = createRowWriter(
        stage,
        () => undefined,
        () => lists
    );
    const editors = createEditorWriter({
        stage,
        changed: () => undefined,
        ended: () => undefined,
        held: () => undefined,
        stale: () => false,
        lists: () => lists
    });
    const { body } = render(Item, {
        props: { row, id, writer, editors, lists, onrepo: () => undefined },
        context: clientContext(client)
    });
    return body;
}
