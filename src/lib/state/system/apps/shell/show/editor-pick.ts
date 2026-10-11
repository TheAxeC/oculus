// Layer 2, client state. Choosing the editor a file opens in: the quick pick Open With... and
// Reopen Editor With... ask, which lists Text Editor and every custom editor that matches the file,
// as VS Code words it. The pick is a request of this page alone, drawn by the quick input, and its
// answer is the place of the chosen row.

import { nameOf } from '../../../../../data/helpers/files/paths.ts';
import { t } from '../../../../shared/words/text.ts';
import type { EditorOffer } from '../contributions.ts';
import type { RequestsStore } from '../requests.svelte.ts';

/** The editor chosen: the text editor, or the custom editor `viewType` of an app. */
export type EditorChoice = { kind: 'text' } | { kind: 'editor'; app: string; viewType: string };

/**
 * Ask which of the editors opens a file. The custom editor the file opens in without being asked
 * is marked as the default. Null when the pick was dismissed.
 */
export async function pickEditor(
    requests: Pick<RequestsStore, 'ask'>,
    offers: readonly EditorOffer[],
    path: string
): Promise<EditorChoice | null> {
    const first = offers.find((one) => one.editor.priority === 'default');
    const items = [
        { label: t('apps.text_editor'), description: '', detail: '', picked: false },
        ...offers.map((one) => ({
            label: one.editor.displayName,
            description: one.appTitle,
            detail: one === first ? t('apps.editor_default') : '',
            picked: false
        }))
    ];
    const asked = requests.ask('', {
        kind: 'quickPick',
        items,
        title: t('apps.open_with_title', nameOf(path)),
        placeHolder: '',
        canPickMany: false,
        matchOnDescription: true,
        matchOnDetail: false
    });
    const answer = await asked.answer;
    const at = Array.isArray(answer) && typeof answer[0] === 'number' ? answer[0] : -1;
    if (at === 0) return { kind: 'text' };
    const chosen = offers.at(at - 1);
    return at < 1 || chosen === undefined
        ? null
        : { kind: 'editor', app: chosen.app, viewType: chosen.editor.viewType };
}
