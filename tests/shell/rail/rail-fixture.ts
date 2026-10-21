// Layer 4, test fixture. The registrations, catalog and helpers the rail suites share: the views
// this suite registers of its own.

import { hubVocabs } from '../../../src/lib/data/index.ts';
import { type DocEntry } from '../../../src/lib/state/workbench/navigation/catalogue.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../../src/lib/state/shared/words/tones.ts';
import { setAppearance } from '../../../src/lib/state/shared/words/appearance.ts';
import { vscodeRuleIds } from '../../../src/lib/data/places/code-rules.ts';
import type {
    Registration,
    ViewProps
} from '../../../src/lib/state/workbench/navigation/registry.ts';
import type { Component } from 'svelte';
import { noop } from '../../fixtures/doubles.ts';

const { config } = loadConfig(engineDir());

export const catalog = textCatalog(config);

setCatalog(catalog);

setGlyphs(glyphCatalog(config));

setVocab(vocabCatalog(config), hubVocabs(null, null, []));

setAppearance(config, vscodeRuleIds());

/** A stand-in for a view component; the registry stores it and the rail never mounts it. */
const component = noop as unknown as Component<ViewProps>;

/** A registration of this file's own, told apart from the application's by its id. */
export function probe(id: string, group = '', order = 0): Registration {
    return { id, label: 'views.status', glyph: 'views.status_glyph', component, group, order };
}

/** A configured hub document, the shape of one entry of the `docs:` list of layout.yml. */
export function doc(path: string, group: string, label = path): DocEntry {
    return { label, path, group };
}
