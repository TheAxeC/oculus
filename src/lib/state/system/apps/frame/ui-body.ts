// Layer 2, client state. What a frame's `ui` call asks of the reader, read from the value the frame
// sent: a message, a quick pick, an input box or a progress, each with every field its request
// holds and its empty value for a field the frame left out. A value of another shape is no request.

import type { AppPickItem, AppRequestBody } from '../../../../data/model/index.ts';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const flag = (value: unknown): boolean => value === true;

/** The members of a plain object, or null for any other value. */
function members(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

/** The strings of a list; null when the value is no list of strings. */
function strings(value: unknown): string[] | null {
    if (value === undefined) return [];
    return Array.isArray(value) && value.every((one) => typeof one === 'string') ? value : null;
}

/** A choice of a quick pick: a text stands for a label, an object gives its fields. */
function pick(value: unknown): AppPickItem | null {
    if (typeof value === 'string')
        return { label: value, description: '', detail: '', picked: false };
    const held = members(value);
    if (held === null || typeof held.label !== 'string') return null;
    return {
        label: held.label,
        description: text(held.description),
        detail: text(held.detail),
        picked: flag(held.picked)
    };
}

/** The request a frame's `ui` call stands for, or null for a value that is none. */
export function uiBody(value: unknown): AppRequestBody | null {
    const held = members(value);
    if (held === null) return null;
    if (held.kind === 'message') {
        const items = strings(held.items);
        const tone = held.tone;
        if (items === null || typeof held.message !== 'string') return null;
        if (tone !== 'info' && tone !== 'warning' && tone !== 'error') return null;
        return { kind: 'message', tone, message: held.message, items, modal: flag(held.modal) };
    }
    if (held.kind === 'quickPick') {
        if (!Array.isArray(held.items)) return null;
        const items = held.items.map(pick);
        if (items.some((one) => one === null)) return null;
        return {
            kind: 'quickPick',
            items: items as AppPickItem[],
            title: text(held.title),
            placeHolder: text(held.placeHolder),
            canPickMany: flag(held.canPickMany),
            matchOnDescription: flag(held.matchOnDescription),
            matchOnDetail: flag(held.matchOnDetail)
        };
    }
    if (held.kind === 'inputBox') {
        return {
            kind: 'inputBox',
            title: text(held.title),
            prompt: text(held.prompt),
            value: text(held.value),
            placeHolder: text(held.placeHolder),
            password: flag(held.password),
            validate: false
        };
    }
    if (held.kind === 'progress') {
        if (held.location !== 'notification' && held.location !== 'window') return null;
        const percent = held.percent;
        return {
            kind: 'progress',
            location: held.location,
            title: text(held.title),
            cancellable: flag(held.cancellable),
            message: text(held.message),
            percent: typeof percent === 'number' && Number.isFinite(percent) ? percent : null
        };
    }
    return null;
}
