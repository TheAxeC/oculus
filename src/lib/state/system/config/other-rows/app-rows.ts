// Layer 2, client state. The rows of the Settings view for the settings the apps declare: one row
// for each setting of every app that acts, under the heading Apps and the section named by the
// app's configuration title. The control a row is drawn with is the one its type gives: a toggle
// for a boolean, a number box for a number or an integer (held to the setting's bounds, a whole
// number for an integer), a choice for a text with an `enum`, a text box for any other text, and
// an inline list for a list of texts. A row is Modified when the file stores a value that differs
// from the default. The values are read from the merged configuration's `app_settings` map as the
// apps watcher reads them (data/helpers/files/apps/settings.ts), so a stored value that breaks its
// declaration shows the default.

import { isEqual } from 'lodash-es';
import { appSettingValues, readSettings } from '../../../../data/helpers/files/apps/settings.ts';
import type { AppRow, AppSetting } from '../../../../data/model/index.ts';
import type { CatalogEntry, Control } from '../../../../data/sources/config/catalog/options.ts';
import { titleOf, type RowBase } from '../rows.ts';

/** What is wrong with a value for an app's setting, for the control that holds it. */
export { settingFlaw } from '../../../../data/helpers/files/apps/settings.ts';

/** One setting an app declares. */
export type AppSettingRow = RowBase & {
    kind: 'app';
    /** The view id of the app that declares it. */
    app: string;
    setting: AppSetting;
    /** The control the row is drawn with. */
    control: Control;
    /** The spec the control is drawn from, in the options catalog's own terms. */
    entry: CatalogEntry;
    /** The value in force: the stored value, else the default. */
    value: unknown;
};

/** The spec of a setting's control. */
function entryOf(setting: AppSetting): CatalogEntry {
    const help = setting.description;
    switch (setting.type) {
        case 'boolean':
            return { help, control: 'toggle', default: setting.default };
        case 'number':
        case 'integer':
            return {
                help,
                control: 'number',
                default: setting.default,
                ...(setting.minimum === null ? {} : { min: setting.minimum }),
                ...(setting.maximum === null ? {} : { max: setting.maximum }),
                ...(setting.type === 'integer' ? { whole: true as const } : {})
            };
        case 'array':
            return { help, control: 'list', default: setting.default };
        case 'string':
            return setting.enum.length > 0
                ? {
                      help,
                      control: 'choice',
                      default: setting.default,
                      options: setting.enum.map(String)
                  }
                : { help, control: 'text', default: setting.default };
    }
}

/** The rows of the settings of the apps that act, with the values the file stores for them. */
export function appSettingRows(
    acting: readonly { id: string; row: AppRow }[],
    config: Record<string, unknown>
): AppSettingRow[] {
    const stored = appSettingValues(config);
    return acting.flatMap(({ id, row }) => {
        const configuration = row.contributes.configuration;
        if (configuration === null) return [];
        const read = readSettings(configuration.properties, stored);
        return configuration.properties.map((setting, at) => ({
            kind: 'app' as const,
            id: `app:${setting.key}`,
            title: titleOf(setting.key),
            help: setting.description,
            path: setting.key,
            section: configuration.title,
            modified:
                Object.hasOwn(stored, setting.key) && !isEqual(read[at].value, setting.default),
            app: id,
            setting,
            control: entryOf(setting).control ?? 'text',
            entry: entryOf(setting),
            value: read[at].value
        }));
    });
}
