// Layer 4, test fixture. What the workbench view suites share: the real config with its catalog and
// glyphs installed, and a client that has had that config delivered on its channel, which is where
// the Views catalogue and the Settings view read the groups, the documents and the rail list from.

import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../../src/lib/state/words/text.ts';
import { setAppearance } from '../../../../src/lib/state/words/appearance.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

export const config = loadConfig(engineDir()).config;

export const catalog = textCatalog(config);

setCatalog(catalog);
setGlyphs(glyphCatalog(config));
setAppearance(config);

/** A fresh client holding the real config, as a page holds it once the first push has landed. */
export function configured(): ClientState {
    const client = createClientState();
    client.entities.receive({
        channel: 'config',
        version: 1,
        payload: { config, text: catalog, findings: [] }
    });
    return client;
}

/** The catalog's words for a key, with its arguments put in. */
export function words(key: string, ...args: (string | number)[]): string {
    return args.reduce<string>(
        (held, arg, at) => held.replace(`{${at}}`, String(arg)),
        catalog[key] ?? ''
    );
}
