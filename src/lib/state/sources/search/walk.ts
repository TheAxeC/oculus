// Layer 2, client state, pure. Walking the texts a Search box ran, as Up and Down do in VS Code's
// two boxes: Up goes to the next older text, Down to the next newer one and, past the newest, back
// to the text the reader was typing. The position is the box's own and is not saved with the page;
// typing into the box or running the search ends a walk.

/** One box's walk through its remembered texts, newest first. */
export type Walk = {
    /** The next older text, or null at the oldest text or when there is none. */
    older: (texts: string[], current: string) => string | null;
    /** The next newer text, or the text typed before the walk began; null when not walking. */
    newer: (texts: string[]) => string | null;
    /** End the walk, so the next Up starts again from the newest text. */
    reset: () => void;
};

/** A walk at the text being typed. */
export function createWalk(): Walk {
    let at = -1;
    let draft = '';

    return {
        older(texts: string[], current: string): string | null {
            const next = Math.min(at + 1, texts.length - 1);
            if (next < 0 || next === at) return null;
            if (at === -1) draft = current;
            at = next;
            return texts[next];
        },
        newer(texts: string[]): string | null {
            if (at === -1) return null;
            at -= 1;
            return at === -1 ? draft : (texts.at(at) ?? draft);
        },
        reset(): void {
            at = -1;
            draft = '';
        }
    };
}
