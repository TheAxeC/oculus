// Layer 3, view helper of views/sources/repositories/diff/DiffSection.svelte. The comment box of
// one file section: the line it is after and on which side, the comment as written (kept while the
// box is closed or moved), whether a send is in flight, what the last refused or failed send said,
// and the line saying where the last comment went. One box per section: a second line moves it and
// keeps the text, `close` keeps the text, `drop` clears it, and a send that ends after its box
// closed, moved or went hands nothing back. What is sent and said is state/sources/repositories/
// review-comment.ts; this holds the box's state and runs the send with what the section hands in.
// The section creates one while it is made, since it registers effects.

import {
    NOTICE_MS,
    commentOutcome,
    commentPrompt,
    commentRefusal,
    pathOfSide,
    refusalLine,
    sendGuard,
    sendOnce,
    type DiffSide,
    type SendDeps
} from '$lib/state/sources/repositories/review-comment';

/** What a section hands its comment box: where the file is and what a send reaches. */
export type DraftSource = {
    /** The file's old and new path, which name the commented side. */
    file: () => { oldPath: string; newPath: string };
    /** Whether the diff is the staged one. */
    staged: () => boolean;
    /** What the session is called in the lines about a send. */
    who: () => string;
    /** Whether the box may stay open after a line of this side. */
    allowed: (side: DiffSide) => boolean;
    /** The pieces of a send, read when the send starts. */
    deps: () => SendDeps;
};

export class CommentDraft {
    /** The line the box is after, on which side, or null while it is closed. */
    at: { side: DiffSide; line: number } | null = $state(null);
    /** The comment as written. */
    text = $state('');
    sending = $state(false);
    /** What the last refused or failed send said, or the empty string. */
    failure = $state('');
    /** Where the last comment went, shown for NOTICE_MS. */
    notice = $state('');
    /** How often the box was asked to open, so the box takes the focus on a move along a side. */
    opened = $state(0);

    private readonly guard = sendGuard();
    private readonly source: DraftSource;

    constructor(source: DraftSource) {
        this.source = source;
        // The box closes, keeping the text, when its side is no longer offered.
        $effect(() => {
            if (this.at !== null && !source.allowed(this.at.side)) this.close();
        });
        // The line saying where a comment went goes after a while.
        $effect(() => {
            if (this.notice === '') return;
            const timer = setTimeout(() => (this.notice = ''), NOTICE_MS);
            return () => clearTimeout(timer);
        });
        // A send still in flight when the section goes no longer belongs to a box.
        $effect(() => () => this.guard.cancel());
    }

    /** Open the box after a line, or move it there with its text. */
    open = (side: DiffSide, line: number): void => {
        if (this.at?.side !== side || this.at.line !== line) this.guard.cancel();
        this.at = { side, line };
        this.failure = '';
        this.opened += 1;
    };

    /** Close the box with its text kept; a send still in flight no longer belongs to it. */
    close = (): void => {
        this.guard.cancel();
        this.at = null;
        this.failure = '';
    };

    /** Close the box and clear its text. */
    drop = (): void => {
        this.text = '';
        this.close();
    };

    /** The text changed: what the last send said no longer applies. */
    write = (next: string): void => {
        this.text = next;
        this.failure = '';
    };

    /**
     * Send the comment: closes the box and says where it went, or keeps it open and says why not.
     */
    send = async (): Promise<void> => {
        if (this.at === null || this.sending) return;
        const { side, line } = this.at;
        const prompt = commentPrompt({
            path: pathOfSide(this.source.file(), side),
            line,
            side,
            staged: this.source.staged(),
            text: this.text
        });
        const refusal = commentRefusal(prompt);
        if (refusal === 'empty') return;
        if (refusal !== null) {
            this.failure = refusalLine(refusal);
            return;
        }
        this.sending = true;
        this.failure = '';
        const result = await sendOnce(this.guard, prompt, this.source.deps());
        this.sending = false;
        if (result === null) return;
        const outcome = commentOutcome(result, this.source.who());
        if (!outcome.done) {
            this.failure = outcome.line;
            return;
        }
        this.notice = outcome.line;
        this.drop();
    };
}
