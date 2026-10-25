// Layer 2, server. The shape of an app's `contributes` key: VS Code's contribution points by their
// own names, each a zod shape of the fields oculus reads. The shape is part of `appShape`, so the
// editor's JSON Schema of `app.yml` marks the same fields this reader refuses. What the shape
// cannot say (an id that starts with the app's name, a clause that parses, a file that exists) is
// checked after it by `reader.ts`.

import { z } from 'zod';
import { TOOL_POINTS } from './shape-tools.ts';

const text = z.string();

const command = z.strictObject({
    command: text.min(1),
    title: text.min(1),
    category: text.optional(),
    icon: text.optional(),
    enablement: text.optional()
});

const keybinding = z.strictObject({
    command: text.min(1),
    key: text.min(1),
    mac: text.optional(),
    linux: text.optional(),
    win: text.optional(),
    when: text.optional(),
    args: z.unknown().optional()
});

const menuEntry = z.strictObject({
    command: text.min(1).optional(),
    submenu: text.min(1).optional(),
    when: text.optional(),
    group: text.optional(),
    alt: text.optional()
});

const container = z.strictObject({ id: text.min(1), title: text.min(1), icon: text.optional() });

const view = z.strictObject({
    id: text.min(1),
    name: text.min(1),
    type: z.enum(['tree', 'webview']).optional(),
    when: text.optional(),
    entry: text.optional()
});

const customEditor = z.strictObject({
    viewType: text.min(1),
    displayName: text.min(1),
    selector: z.array(z.strictObject({ filenamePattern: text.min(1) })).min(1),
    priority: z.enum(['default', 'option']).optional(),
    entry: text.min(1)
});

const setting = z.strictObject({
    type: z.enum(['boolean', 'number', 'integer', 'string', 'array']),
    default: z.unknown().optional(),
    description: text.optional(),
    markdownDescription: text.optional(),
    enum: z.array(z.union([text, z.number()])).optional(),
    enumDescriptions: z.array(text).optional(),
    minimum: z.number().optional(),
    maximum: z.number().optional(),
    items: z.strictObject({ type: z.literal('string') }).optional()
});

const configuration = z.strictObject({
    title: text.optional(),
    properties: z.record(text, setting)
});

const theme = z.strictObject({
    label: text.min(1),
    uiTheme: z.enum(['vs', 'vs-dark', 'hc-black', 'hc-light']),
    path: text.min(1)
});

const iconTheme = z.strictObject({ id: text.min(1), label: text.min(1), path: text.min(1) });

const localization = z.strictObject({
    languageId: text.min(1),
    languageName: text.min(1),
    localizedLanguageName: text.optional(),
    translations: z.array(z.strictObject({ id: text.min(1), path: text.min(1) })).min(1)
});

/** The shape of each contribution point, by the name the manifest writes it under. */
export const POINTS = {
    commands: z.array(command),
    keybindings: z.array(keybinding),
    menus: z.record(text, z.array(menuEntry)),
    viewsContainers: z.record(text, z.array(container)),
    views: z.record(text, z.array(view)),
    customEditors: z.array(customEditor),
    configuration,
    themes: z.array(theme),
    iconThemes: z.array(iconTheme),
    localizations: z.array(localization),
    ...TOOL_POINTS
};

/** The names of the contribution points. */
export type PointName = keyof typeof POINTS;

/** The whole `contributes` key. */
export const contributesShape = z.strictObject(POINTS).partial();
