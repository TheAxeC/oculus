// Layer 3, view helper. What a slide's act does once picked: Edit Slide opens the slide's file in a
// source tab beside the pane at the slide's first line, New, Duplicate and Delete Slide write
// through `deck-edit` and show the slide the answer names, and an image dropped on a slide is added
// to its folder and its text. Delete asks first, naming the slide's title and its file; every
// refusal and every failure is said in the pane's status line in the sentence the server gave.
//
// A write names the file text the page read (`base`), so the server refuses an act over a file that
// changed since; the text is read here, from the file route the source tab reads. Once an act has
// written, a source tab over a file of the deck's folder that holds no typed text reads it again,
// so Edit Slide's tab shows what the act wrote rather than the text a later save would put back.

import { base64Of, encoded } from '$lib/ui/forms/file/file-data';
import type { Ask } from '$lib/views/shared/writes/ask';
import { deckFile, deleteQuestion, dropRefusal, type SlideAct } from '$lib/state/life/present';
import { loadSource, sourceTabState } from '$lib/state/sessions/source/draft';
import { t } from '$lib/state/shared/words/text';
import type { WriteAnswer, WritesStore } from '$lib/state/shared/stores/shapes';
import type { Deck, DeckRef, DeckSlide } from '$lib/state/life/present';

/** What an act needs from the pane it was picked in. */
export type ActDeps = {
    ref: DeckRef;
    deck: Deck;
    write: WritesStore['writeDeckEdit'];
    /** Open a view beside the pane, with the state that names what it shows. */
    openBeside: (view: string, state?: unknown) => string;
    /** Show the slide with this key, once the deck holds it. */
    show: (key: string) => void;
    /** Say a line in the pane's status line. */
    say: (line: string) => void;
    /** Hold a question the pane draws, whose yes runs the act. */
    ask: (question: Ask) => void;
    /** Have each source tab over a file of the deck's folder that holds no typed text read it. */
    reread: () => void;
};

/** The sentence an answer that wrote nothing gives, and the empty string for one that wrote. */
function refusalOf(answer: WriteAnswer): string {
    if (answer.ok && answer.refused.length === 0) return '';
    return answer.refused.at(0)?.reason ?? answer.error ?? t('present.failed_network');
}

/** The text of the file a slide is in as the page reads it, or the sentence for why it cannot. */
async function baseOf(row: DeckSlide): Promise<{ text: string } | { said: string }> {
    const source = row.source;
    if (source === undefined) return { said: t('present.drop_not_own') };
    const read = await loadSource(source.root, source.path);
    return read.ok ? { text: read.content } : { said: t('present.read_failed', read.error) };
}

/** Open the slide's file beside the pane at the slide's first line. */
function edit(deps: ActDeps, row: DeckSlide): void {
    const source = row.source;
    if (source === undefined) return;
    deps.openBeside('source', sourceTabState(source.root, source.path, source.line));
}

/** Say what an answer came to, and show the slide it names when it wrote. */
function settled(deps: ActDeps, answer: WriteAnswer, said: string): void {
    const refusal = refusalOf(answer);
    deps.say(refusal === '' ? said : refusal);
    if (refusal === '') deps.reread();
    if (refusal === '' && answer.id !== undefined && answer.id !== '') deps.show(answer.id);
}

/** Run one act picked for `row`, which is null on a deck that holds no slide. */
export async function runAct(deps: ActDeps, act: SlideAct, row: DeckSlide | null): Promise<void> {
    const root = deps.ref.root;
    const path = deckFile(deps.ref);
    if (act === 'new') {
        settled(
            deps,
            await deps.write(
                { act: 'new', root, path, ...(row === null ? {} : { after: row.key }) },
                true
            ),
            t('present.said_new')
        );
        return;
    }
    if (row === null) return;
    if (act === 'edit') {
        edit(deps, row);
        return;
    }
    const send = async (): Promise<void> => {
        const base = await baseOf(row);
        if ('said' in base) {
            deps.say(base.said);
            return;
        }
        const written = await deps.write(
            { act, root, path, slide: row.key, base: base.text },
            true
        );
        settled(
            deps,
            written,
            act === 'delete' ? t('present.said_deleted') : t('present.said_copied')
        );
    };
    if (act === 'duplicate') return send();
    const question = deleteQuestion(row);
    deps.ask({ ...question, confirm: t('present.delete_yes'), act: () => void send() });
}

/**
 * Add the image dropped on a slide: refused with its reason when the drop is not one image on a
 * slide of the deck's own files, else read and sent with the slide's file text.
 */
export async function dropImage(
    deps: ActDeps,
    row: DeckSlide | null,
    files: readonly File[]
): Promise<void> {
    const refusal = dropRefusal(deps.deck, row, files);
    if (refusal !== '') {
        deps.say(refusal);
        return;
    }
    const file = files[0];
    if (row === null) return;
    const base = await baseOf(row);
    if ('said' in base) {
        deps.say(base.said);
        return;
    }
    let data: string;
    try {
        data = base64Of(await encoded(file));
    } catch {
        deps.say(t('present.read_failed', file.name));
        return;
    }
    const answer = await deps.write(
        {
            act: 'image',
            root: deps.ref.root,
            path: deckFile(deps.ref),
            slide: row.key,
            base: base.text,
            name: file.name,
            data
        },
        true
    );
    const refused = refusalOf(answer);
    deps.say(refused === '' ? t('present.said_added', file.name) : refused);
    if (refused === '') deps.reread();
}
