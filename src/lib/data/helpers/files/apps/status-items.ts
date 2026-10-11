// Layer 1, data. The status bar item an app registers, from its first blank state to each change
// its host or its frame reports, which the server's registry (a host's items) and the page (a
// frame's items) fold the same way.

import type { AppStatusItem } from '../../../model/index.ts';

/** A status item before its owner fills in its fields. */
export function blankItem(
    id: string,
    alignment: 'left' | 'right',
    priority: number
): AppStatusItem {
    return {
        id,
        alignment,
        priority,
        visible: false,
        text: '',
        tooltip: '',
        command: '',
        name: '',
        background: '',
        accessibility: ''
    };
}

/** Fold the fields a change names into an item; a field of another type is left as it was. */
export function changeItem(item: AppStatusItem, options: Record<string, unknown>): void {
    const text = (key: string): string | undefined =>
        typeof options[key] === 'string' ? options[key] : undefined;
    item.visible = typeof options.visible === 'boolean' ? options.visible : item.visible;
    item.text = text('text') ?? item.text;
    item.tooltip = text('tooltip') ?? item.tooltip;
    item.command = text('command') ?? item.command;
    item.name = text('name') ?? item.name;
    item.accessibility = text('accessibility') ?? item.accessibility;
    const tone = text('background');
    if (tone === '' || tone === 'warning' || tone === 'error') item.background = tone;
}
