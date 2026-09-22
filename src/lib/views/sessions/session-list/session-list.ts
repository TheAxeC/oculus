// Layer 3, view support. Session-list menu builders live here because row actions change
// independently of the parent view and are unit-tested without a DOM.

import type { MenuItem } from '$lib/ui/menu/menu-items';
import { t } from '$lib/state/words/text';

export type SessionRow = { id: string; live: boolean; cwd: string | null };

/** The actions in a session row's menu, including the pinned pane available on every row. */
export function sessionRowItems(row: SessionRow, armedResume: string): MenuItem[] {
    const items: MenuItem[] = [
        {
            id: 'pinned',
            label: t('sessions.open_pinned'),
            title: t('sessions.open_pinned_tip')
        },
        {
            id: 'transcript',
            label: t('sessions.transcript_open'),
            glyph: t('sessions.transcript_glyph')
        }
    ];
    if (!row.live) {
        items.push({
            id: 'resume',
            label:
                armedResume === row.id
                    ? t('sessions.resume_confirm', row.cwd ?? '')
                    : t('sessions.resume'),
            glyph: t('sessions.resume_glyph')
        });
    }
    return items;
}

/** The action in a terminal row's menu. */
export function terminalRowItems(): MenuItem[] {
    return [
        {
            id: 'pinned',
            label: t('sessions.open_pinned'),
            title: t('sessions.open_pinned_tip')
        }
    ];
}
