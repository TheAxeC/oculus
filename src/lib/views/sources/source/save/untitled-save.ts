// Layer 3, view partial of Source.svelte. The first Save of an untitled text (New Text File): it
// asks which served root of the current workspace and what name to make the file under, makes it
// there, writes the draft to it and turns the tab into a tab over that file. A name with folders in
// it makes them, as the Files view's New File does; a name that leaves the root is refused.

import type { PromptRequest } from '$lib/ui/forms/prompt';
import type { ClientState } from '$lib/state/client/context';
import { refusalSentence } from '$lib/state/shared/answers/answers';
import { sourceTabState } from '$lib/state/sessions/source.svelte';
import { t } from '$lib/state/shared/words/text';

/** What the first Save of one untitled tab reads of the tab and calls on it. */
export type UntitledDeps = {
    id: string;
    /** The tab's title, which the name field shows as its placeholder. */
    title: () => string;
    /** The roots of the current workspace, which the question offers as a choice. */
    roots: () => { key: string }[];
    create: ClientState['explorer']['create'];
    saveDraft: (id: string, root: string, path: string) => Promise<void>;
    restate: (id: string, state: unknown) => void;
    /** Show a sentence under the editor. */
    said: (words: string) => void;
    /** Show the question, or take it away with null. */
    ask: (request: PromptRequest | null) => void;
};

/**
 * The first Save of an untitled tab: asks for the root, the first one selected, and the file's
 * name under it, and acts on the answer.
 */
export function askUntitledName(deps: UntitledDeps): void {
    const roots = deps.roots();
    const first = roots.at(0);
    if (first === undefined) {
        deps.said(t('source.untitled_no_root'));
        return;
    }
    deps.ask({
        message: t('source.untitled_save'),
        detail: t('source.untitled_where'),
        fields: [
            {
                label: t('source.untitled_root'),
                value: first.key,
                choices: roots.map((root) => ({ id: root.key, label: root.key }))
            },
            { label: t('source.untitled_name'), value: '', placeholder: deps.title() }
        ],
        verb: t('editor.save'),
        act: ([root, name]) => {
            deps.ask(null);
            void saveAs(deps, root, name.trim());
        }
    });
}

/** Whether a name leaves the root it is made under: it starts with a slash or holds `..`. */
function leavesRoot(name: string): boolean {
    return /^[\\/]/.test(name) || name.split(/[\\/]/).includes('..');
}

/** Make the file the prompt named, write the draft to it, and become a tab over it. */
async function saveAs(deps: UntitledDeps, into: string, name: string): Promise<void> {
    if (name === '') return;
    if (leavesRoot(name)) {
        deps.said(t('source.untitled_outside'));
        return;
    }
    const made = await deps.create({ root: into, path: '' }, name, false);
    if (!made.ok) {
        deps.said(
            made.error === 'network' ? t('files.refused_network') : refusalSentence(made.error)
        );
        return;
    }
    const created = made.paths.at(0) ?? name;
    await deps.saveDraft(deps.id, into, created);
    deps.restate(deps.id, sourceTabState(into, created));
}
