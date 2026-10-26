// Layer 4, test fixture. What the workbench view suites share: the real config with its catalog and
// glyphs installed, and a Settings row's item (settings/Item.svelte) rendered on the server with
// the lists of the shipped config and writes that answer done.

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
import { createRowWriter } from '../../../../src/lib/state/system/config/write.ts';
import Item from '../../../../src/lib/views/system/workbench/settings/Item.svelte';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';

const config = loadConfig(engineDir()).config;

export const catalog = textCatalog(config);

setCatalog(catalog);
setGlyphs(glyphCatalog(config));
const codeThemeClasses = vscodeRuleIds();
setAppearance(config, codeThemeClasses);

/** The markup of one row's item, drawn in the Settings tab `id` of the client's page. */
export function drawnItem(row: ConfigRow, client: ClientState, id: string): string {
    const done = () => Promise.resolve({ ok: true, changed: [], refused: [] });
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
    const writer = createRowWriter(
        done,
        done,
        () => undefined,
        () => lists
    );
    const editors = createEditorWriter(done, {
        reset: done,
        changed: () => undefined,
        ended: () => undefined,
        held: () => false,
        lists: () => lists
    });
    const { body } = render(Item, {
        props: { row, id, writer, editors, lists, onchoose: () => undefined },
        context: clientContext(client)
    });
    return body;
}
