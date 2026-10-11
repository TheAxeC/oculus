// Layer 1, data. The settings apps declare. The values stored for them are the `app_settings:` map
// of config/behavior.yml, whose keys are the settings' whole keys (`notes.width` is one key, never
// split at its dot) and whose values are what the Settings view wrote; the first hub's layer of the
// file is where the map lives, so the merged configuration holds it. A value is judged against the
// setting its app declared for it, by its type, its `enum` and its bounds: the apps watcher judges
// each stored value with it and reads the default for one that fails, and the Settings view's
// control refuses such a value before it is written, so the page and the server cannot disagree
// about which values a setting takes.

import type { AppSetting } from '../../../model/index.ts';
import { isMap } from '../../guards.ts';

/** The key of config/behavior.yml that holds the stored values. */
export const APP_SETTINGS_KEY = 'app_settings';

/** The stored values of the merged configuration, empty when the key is absent or no map. */
export function appSettingValues(config: Record<string, unknown>): Record<string, unknown> {
    const held = config[APP_SETTINGS_KEY];
    return isMap(held) ? held : {};
}

/** Which part of the declaration a value breaks. */
export type SettingFlaw = 'type' | 'enum' | 'minimum' | 'maximum';

/** Whether a value is of the setting's type. */
function typed(setting: AppSetting, value: unknown): boolean {
    switch (setting.type) {
        case 'boolean':
            return typeof value === 'boolean';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'string':
            return typeof value === 'string';
        case 'array':
            return Array.isArray(value) && value.every((one) => typeof one === 'string');
    }
}

/** The part of its declaration a value breaks, or null when the value is one the setting takes. */
export function settingFlaw(setting: AppSetting, value: unknown): SettingFlaw | null {
    if (!typed(setting, value)) return 'type';
    if (setting.enum.length > 0 && !setting.enum.some((one) => one === value)) return 'enum';
    if (typeof value === 'number') {
        if (setting.minimum !== null && value < setting.minimum) return 'minimum';
        if (setting.maximum !== null && value > setting.maximum) return 'maximum';
    }
    return null;
}

/** What one stored value came to: the value read, and the flaw that made it the default. */
export type ReadSetting = { key: string; value: unknown; flaw: SettingFlaw | null };

/**
 * The value of every declared setting: the stored value when it passes, else the default (and the
 * flaw it failed with). A key that is stored and not declared is not here.
 */
export function readSettings(
    settings: readonly AppSetting[],
    stored: Readonly<Record<string, unknown>>
): ReadSetting[] {
    return settings.map((setting) => {
        if (!Object.hasOwn(stored, setting.key)) {
            return { key: setting.key, value: setting.default, flaw: null };
        }
        const flaw = settingFlaw(setting, stored[setting.key]);
        const value = flaw === null ? stored[setting.key] : setting.default;
        return { key: setting.key, value, flaw };
    });
}

/** The value of every setting an app declares, by whole key: the stored value or the default. */
export function settingValues(
    settings: readonly AppSetting[],
    stored: Readonly<Record<string, unknown>>
): Record<string, unknown> {
    return Object.fromEntries(readSettings(settings, stored).map((one) => [one.key, one.value]));
}
