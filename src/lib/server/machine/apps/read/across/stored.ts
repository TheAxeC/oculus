// Layer 2, server. What the configuration stores that belongs to the apps, judged against what the
// apps declare: the values of `app_settings:` in config/behavior.yml and the file icon theme
// `file_icons:` of config/appearance.yml names. Only the watcher holds the declarations, so the
// findings are made here, after every app is read.
//
// A stored value is judged against the setting of an approved, enabled app that declares its key.
// A key no such app declares is a finding, and so is a value that breaks its declaration (its type,
// its list of values or its bounds); the app reads its default for it. A `file_icons` value of an
// app's icon theme is a finding when no approved, enabled app offers that theme, and the file icons
// are Seti then. Both findings are keyed by the file they are about.

import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import { appActive } from '../../../../../data/helpers/files/apps/apps.ts';
import { splitAppChoice } from '../../../../../data/helpers/files/apps/choices.ts';
import { appSettingValues, readSettings } from '../../../../../data/helpers/files/apps/settings.ts';
import type { AppSetting, Finding } from '../../../../../data/model/index.ts';
import type { AppsHeld, HeldApp } from '../held.ts';

/** What the stored values are judged with. */
export type StoredInput = {
    config: Record<string, unknown>;
    catalog: TextCatalog;
    /** The file the `app_settings:` map is stored in. */
    settingsFile: string;
    /** The file `file_icons:` is written in. */
    appearanceFile: string;
};

/** The finding a value that breaks each part of its declaration is worded by. */
const FLAW_TEXT = {
    type: 'findings.apps.setting_type',
    enum: 'findings.apps.setting_enum',
    minimum: 'findings.apps.setting_minimum',
    maximum: 'findings.apps.setting_maximum'
} as const;

/** The approved, enabled apps that declare settings, in the Views list's order. */
function settingApps(held: AppsHeld): HeldApp[] {
    return held.apps.filter(
        (app) => appActive(app.row) && app.row.contributes.configuration !== null
    );
}

/** The settings an app declares. */
function declaredBy(app: HeldApp): AppSetting[] {
    return app.row.contributes.configuration?.properties ?? [];
}

/** The findings of the stored values of the apps' settings. */
function settingFindings(held: AppsHeld, input: StoredInput): Finding[] {
    const stored = appSettingValues(input.config);
    const apps = settingApps(held);
    const found: Finding[] = [];
    const note = (text: string, ...args: string[]): void => {
        found.push({
            file: input.settingsFile,
            key: 'config/behavior.yml',
            message: findingText(input.catalog, text, ...args)
        });
    };
    for (const key of Object.keys(stored)) {
        if (!apps.some((app) => declaredBy(app).some((one) => one.key === key))) {
            note('findings.apps.setting_undeclared', key);
        }
    }
    for (const app of apps) {
        const own = Object.fromEntries(
            declaredBy(app)
                .filter((one) => Object.hasOwn(stored, one.key))
                .map((one) => [one.key, stored[one.key]])
        );
        for (const read of readSettings(declaredBy(app), own)) {
            if (read.flaw !== null) note(FLAW_TEXT[read.flaw], read.key, app.row.title);
        }
    }
    return found;
}

/** The finding for a `file_icons` value that names an icon theme no approved app offers. */
function iconFindings(held: AppsHeld, input: StoredInput): Finding[] {
    const saved = input.config.file_icons;
    const named = typeof saved === 'string' ? splitAppChoice(saved) : null;
    if (typeof saved !== 'string' || named === null) return [];
    const app = held.apps.find((one) => one.id === named.view);
    const offered =
        app !== undefined &&
        appActive(app.row) &&
        app.row.contributes.iconThemes.some((one) => one.id === named.name);
    if (offered) return [];
    return [
        {
            file: input.appearanceFile,
            key: 'config/appearance.yml',
            message: findingText(input.catalog, 'findings.apps.icon_theme_unavailable', saved)
        }
    ];
}

/** Add the findings of the stored values to what the read found. */
export function judgeStored(held: AppsHeld, input: StoredInput): void {
    held.findings.push(...settingFindings(held, input), ...iconFindings(held, input));
}
