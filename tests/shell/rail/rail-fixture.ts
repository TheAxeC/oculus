// Layer 4, test fixture. The registrations, catalog and helpers the rail suites share: the views
// this suite registers of its own, and the renderers that draw the rail to HTML over them.

import { type DocEntry } from '../../../src/lib/state/workbench/navigation/catalogue.ts';
import {
    collectionKeys,
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog,
    vocabCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/words/text.ts';
import { setVocab } from '../../../src/lib/state/words/tones.ts';
import { setAppearance } from '../../../src/lib/state/words/appearance.ts';
import type { Registration, ViewProps } from '../../../src/lib/views/registry.ts';
import type { Component } from 'svelte';
import { noop } from '../../fixtures/doubles.ts';

export const { config } = loadConfig(engineDir());

export const catalog = textCatalog(config);

setCatalog(catalog);

setGlyphs(glyphCatalog(config));

setVocab(vocabCatalog(config));

setAppearance(config);

export const COLLECTIONS = collectionKeys(config);

/** A stand-in for a view component; the registry stores it and the rail never mounts it. */
export const component = noop as unknown as Component<ViewProps>;

/** A registration of this file's own, told apart from the application's by its id. */
export function probe(id: string, group = '', order = 0): Registration {
    return { id, label: 'views.status', glyph: 'views.status_glyph', component, group, order };
}

/** How many times a fragment occurs in a rendering. */
export function count(body: string, fragment: string): number {
    return body.split(fragment).length - 1;
}

/**
 * The rendered button carrying one attribute, or nothing when the attribute stayed on a wrapper.
 */
export function buttonWith(body: string, attribute: string): string | undefined {
    return [...body.matchAll(/<button\b[^>]*>/g)]
        .map(([button]) => button)
        .find((button) => button.includes(attribute));
}

/** A configured hub document, the shape of one entry of the `docs:` list of layout.yml. */
export function doc(path: string, group: string, label = path): DocEntry {
    return { label, path, group };
}
