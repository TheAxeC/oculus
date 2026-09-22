// The catalog, in the spec's own process. A spec locates a control by its accessible name, and that
// name is what the page read out of the owner files under config/text/, so the spec reads it
// through the same flattening and never from an English string typed into a spec.
//
// The flattening is data/sources/config.ts's, the same call tests/checks/source/text.test.ts makes.
// The lookup and the interpolation are repeated here rather than imported from state/words/text.ts,
// because that module pulls in state/words/glyphmode.svelte.ts and a rune outside a Svelte build is
// a ReferenceError; a Playwright spec runs under plain Node with no Svelte plugin.

import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { byKey } from '../../../src/lib/data/helpers/guards.ts';

const merged = loadConfig(engineDir()).config;
const catalog = textCatalog(merged);

/**
 * The vocabulary the page draws from config/catalogs/vocab.yml: a lane's key and label, a priority
 * level's key and label. A spec picks a menu item by the label and asserts the key in the manifest,
 * and both come from here rather than from words typed into the spec.
 */
export function vocabulary(key: string): { key: string; label: string }[] {
    const rows = merged[key];
    if (!Array.isArray(rows)) throw new Error(`config holds no list ${key}`);
    return rows.map((row: unknown) => {
        const map = row as Record<string, unknown>;
        return { key: String(map.key), label: String(map.label) };
    });
}

/**
 * The words for a dotted key, with {0} and {1} replaced. A key that is not in the catalog throws.
 */
export function t(key: string, ...args: (string | number)[]): string {
    const template = byKey(catalog, key);
    if (template === undefined) throw new Error(`text key not in the catalog: ${key}`);
    return template.replace(/\{(\d+)\}/g, (placeholder: string, index: string) => {
        const arg = args.at(Number(index));
        return arg === undefined ? placeholder : String(arg);
    });
}

/**
 * The accessible name of a tab with this label, clean or holding unsaved text: the label alone, or
 * the catalog's unsaved name around it. A spec that finds a tab by its label finds it either way,
 * and nothing else whose name only starts with the label.
 */
export function tabNamed(label: string): RegExp {
    const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^(?:${escape(label)}|${escape(t('ui.tab_unsaved', label))})$`);
}
