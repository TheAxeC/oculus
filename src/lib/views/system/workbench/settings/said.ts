// Layer 3, view helper. The words of the Settings view that depend on a value: a message of the
// rows module worded from the catalog, the default line of a row, and the count of a list. Nothing
// here is drawn; the partials call these so each sentence is worded in one place.

import { t } from '$lib/state/shared/words/text';
import type { Message } from '$lib/state/system/config/messages';
import { listShape, textShape, type ConfigRow } from '$lib/state/system/config/rows';

/** A message of the rows module worded, its values put in. */
export function said(message: Message): string {
    return t(message.key, ...message.args);
}

/** A count of list items worded: one item, or N items. */
export function itemsWords(count: number): string {
    return count === 1 ? t('workbench.settings_item_one') : t('workbench.settings_items', count);
}

/** A value as the words show it: a string as it is, a number or boolean spelled, else JSON. */
export function plainText(value: unknown): string {
    const scalar = textShape.safeParse(value);
    return scalar.success ? String(scalar.data) : JSON.stringify(value);
}

/** The line saying what a row's default is, or the empty string for a family, which has none. */
export function defaultWords(row: ConfigRow): string {
    if (row.control === 'family') return '';
    const value = row.default;
    const items = listShape.safeParse(value);
    if (items.success) {
        if (items.data.length === 0) return t('workbench.settings_default_empty');
        return items.data.length === 1
            ? t('workbench.settings_default_item_one')
            : t('workbench.settings_default_items', items.data.length);
    }
    if (value === '' || value === null || value === undefined) {
        return t('workbench.settings_default_empty');
    }
    return t('workbench.settings_default', plainText(value));
}
