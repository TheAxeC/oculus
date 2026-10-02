// The comment a reader leaves on a line of a session's diff, as it becomes a prompt and is sent:
// the prompt's text for each side of a diff, the refusal that holds on both paths, the send into
// the session's terminal or onto the clipboard, the guard over one send in flight, the words each
// outcome says, and the keys the comment box takes. Every dependency of a send is a fake passed in,
// so nothing here types into a terminal or touches a clipboard.
//
// What this does NOT cover: the box drawn on a diff, its focus and its keys inside Monaco's
// overlay, which the look does.

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    COMMENT_BAR,
    browserCopy,
    commentBars,
    commentKey,
    commentOutcome,
    commentPrompt,
    commentRefusal,
    commentTitle,
    pathOfSide,
    refusalLine,
    sendComment,
    sendGuard,
    sendOnce,
    type SendDeps
} from '../../../../../src/lib/state/sources/repositories/review-comment.ts';
import { STEER_MAX } from '../../../../../src/lib/data/model/index.ts';
import type { TerminalAnswer } from '../../../../../src/lib/state/sessions/terminal/pty-io.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** A comment on a line of the modified side of an unstaged diff, over the fields given. */
type Comment = Parameters<typeof commentPrompt>[0];

function comment(over: Partial<Comment> = {}): Comment {
    return {
        path: 'src/a.ts',
        line: 12,
        side: 'modified',
        staged: false,
        text: 'rename this',
        ...over
    };
}

describe('the prompt a comment becomes', () => {
    it('names the file and the line of the modified side, and says before the change for the original', () => {
        expect(commentPrompt(comment())).toBe('src/a.ts:12: rename this');
        expect(commentPrompt(comment({ side: 'original', line: 7 }))).toBe(
            'src/a.ts:7 (before the change): rename this'
        );
    });

    it('says staged for the modified side of a staged diff and nothing more for its original side', () => {
        expect(commentPrompt(comment({ staged: true }))).toBe('src/a.ts:12 (staged): rename this');
        expect(commentPrompt(comment({ staged: true, side: 'original', line: 7 }))).toBe(
            'src/a.ts:7 (before the change): rename this'
        );
    });

    it('names the old path for a line of the original side of a renamed file', () => {
        const file = { oldPath: 'old.ts', newPath: 'new.ts' };
        expect(
            commentPrompt(
                comment({ path: pathOfSide(file, 'original'), side: 'original', line: 3 })
            )
        ).toBe('old.ts:3 (before the change): rename this');
        expect(commentPrompt(comment({ path: pathOfSide(file, 'modified') }))).toBe(
            'new.ts:12: rename this'
        );
    });

    it('takes the path of whichever side a created or a deleted file has', () => {
        expect(pathOfSide({ oldPath: '', newPath: 'made.ts' }, 'original')).toBe('made.ts');
        expect(pathOfSide({ oldPath: 'gone.ts', newPath: '' }, 'modified')).toBe('gone.ts');
        expect(pathOfSide({ oldPath: 'same.ts', newPath: 'same.ts' }, 'original')).toBe('same.ts');
    });

    it('writes the five real cases of the decision as they are given', () => {
        expect(
            commentPrompt(
                comment({
                    path: 'src/lib/server/machine/pty/sessions.ts',
                    line: 528,
                    text: 'use the shared check here'
                })
            )
        ).toBe('src/lib/server/machine/pty/sessions.ts:528: use the shared check here');
        expect(
            commentPrompt(comment({ path: 'HELP.md', line: 132, text: 'say what the + does' }))
        ).toBe('HELP.md:132: say what the + does');
        expect(
            commentPrompt(
                comment({
                    path: 'src/lib/ui/controls/editor/DiffEditor.svelte',
                    line: 143,
                    side: 'original',
                    text: 'why was the menu on?'
                })
            )
        ).toBe(
            'src/lib/ui/controls/editor/DiffEditor.svelte:143 (before the change): why was the menu on?'
        );
        expect(
            commentPrompt(
                comment({
                    path: 'registries/organisations.yml',
                    line: 13,
                    text: '  keep the comment  '
                })
            )
        ).toBe('registries/organisations.yml:13: keep the comment');
        expect(
            commentPrompt(
                comment({
                    path: 'projects/manuscripts/raw-pls/project.yml',
                    line: 13,
                    text: 'two lines:\nfirst\nsecond'
                })
            )
        ).toBe('projects/manuscripts/raw-pls/project.yml:13: two lines:\nfirst\nsecond');
    });

    it('keeps the inside of a two line comment whole, and trims only its ends', () => {
        expect(commentPrompt(comment({ text: 'a\nb' }))).toBe('src/a.ts:12: a\nb');
        expect(commentPrompt(comment({ text: '\n a  b \n' }))).toBe('src/a.ts:12: a  b');
    });

    it('writes ./ before a path an agent prompt box would read as a command, a memory or a mention', () => {
        for (const path of ['!x.ts', '#x.ts', '@x.ts', '/x.ts']) {
            expect(commentPrompt(comment({ path }))).toBe(`./${path}:12: rename this`);
        }
        expect(commentPrompt(comment({ path: '!x.ts', side: 'original' }))).toBe(
            './!x.ts:12 (before the change): rename this'
        );
    });

    it('leaves a path with a space or a colon as it is', () => {
        expect(commentPrompt(comment({ path: 'my file.ts' }))).toBe('my file.ts:12: rename this');
        expect(commentPrompt(comment({ path: 'a:b.ts' }))).toBe('a:b.ts:12: rename this');
    });

    it('is the empty prompt for a blank comment, which commentRefusal then refuses', () => {
        expect(commentPrompt(comment({ text: '   \n ' }))).toBe('');
        expect(commentRefusal(commentPrompt(comment({ text: '' })))).toBe('empty');
    });
});

describe('the refusal that holds on the terminal path and the clipboard path alike', () => {
    it('refuses a blank comment as empty', () => {
        expect(commentRefusal('   ')).toBe('empty');
        expect(commentRefusal('')).toBe('empty');
        expect(commentRefusal(' \n\t')).toBe('empty');
    });

    it('refuses a control character the steer refuses, and none of the ones it types', () => {
        expect(commentRefusal('a\u001bb')).toBe('control');
        for (const code of [0x00, 0x08, 0x0b, 0x0d, 0x1f, 0x7f]) {
            expect(commentRefusal(`a${String.fromCharCode(code)}b`)).toBe('control');
        }
        expect(commentRefusal('a\nb')).toBeNull();
        expect(commentRefusal('a\tb')).toBeNull();
    });

    it('refuses a prompt past the longest steer and takes one of exactly that length', () => {
        expect(commentRefusal('x'.repeat(STEER_MAX + 1))).toBe('long');
        expect(commentRefusal('x'.repeat(STEER_MAX))).toBeNull();
    });

    it('says why in words for the two refusals that keep the box open', () => {
        expect(refusalLine('control')).toContain('control character');
        expect(refusalLine('long')).toContain(String(STEER_MAX));
        expect(refusalLine('empty')).toBe('');
    });
});

/** The fakes of a send, and what they were asked. */
function fakes(
    over: {
        terminal?: { id: string } | null;
        answer?: Promise<TerminalAnswer>;
        copy?: ((text: string) => Promise<void>) | null;
    } = {}
): { deps: SendDeps; steered: [string, string][]; copied: string[] } {
    const steered: [string, string][] = [];
    const copied: string[] = [];
    const deps: SendDeps = {
        terminal: () => (over.terminal === undefined ? { id: 'term-one' } : over.terminal),
        steer: (id, text) => {
            steered.push([id, text]);
            return over.answer ?? Promise.resolve({ ok: true, id, error: '' });
        },
        copy:
            over.copy === undefined
                ? (text) => {
                      copied.push(text);
                      return Promise.resolve();
                  }
                : over.copy
    };
    return { deps, steered, copied };
}

describe('the send', () => {
    it('types the prompt into the terminal of the session, once, and copies nothing', async () => {
        const { deps, steered, copied } = fakes();
        expect(await sendComment('src/a.ts:12: hi', deps)).toEqual({ kind: 'sent' });
        expect(steered).toEqual([['term-one', 'src/a.ts:12: hi']]);
        expect(copied).toEqual([]);
    });

    it('copies the prompt, once, for a session with no oculus terminal and types nothing', async () => {
        const { deps, steered, copied } = fakes({ terminal: null });
        expect(await sendComment('src/a.ts:12: hi', deps)).toEqual({ kind: 'copied' });
        expect(copied).toEqual(['src/a.ts:12: hi']);
        expect(steered).toEqual([]);
    });

    it('fails with the error the terminal answered, or with the empty string when it gave none', async () => {
        const refused = fakes({
            answer: Promise.resolve({ ok: false, id: '', error: 'tmux: no server' })
        });
        expect(await sendComment('p', refused.deps)).toEqual({
            kind: 'failed',
            error: 'tmux: no server'
        });
        const silent = fakes({ answer: Promise.resolve({ ok: false, id: '', error: '' }) });
        expect(await sendComment('p', silent.deps)).toEqual({ kind: 'failed', error: '' });
        expect(silent.copied).toEqual([]);
    });

    it('fails with the message of a steer that throws instead of rejecting the send', async () => {
        const { deps } = fakes({ answer: Promise.reject(new Error('socket closed')) });
        expect(await sendComment('p', deps)).toEqual({ kind: 'failed', error: 'socket closed' });
    });

    it('is refused when there is no terminal and the clipboard is absent or rejects or throws', async () => {
        expect(await sendComment('p', fakes({ terminal: null, copy: null }).deps)).toEqual({
            kind: 'refused'
        });
        const rejecting = fakes({ terminal: null, copy: () => Promise.reject(new Error('no')) });
        expect(await sendComment('p', rejecting.deps)).toEqual({ kind: 'refused' });
        const throwing = fakes({
            terminal: null,
            copy: () => {
                throw new TypeError('clipboard is undefined');
            }
        });
        expect(await sendComment('p', throwing.deps)).toEqual({ kind: 'refused' });
    });

    it('asks for the terminal when it sends, so a terminal that ended is not typed into', async () => {
        let terminal: { id: string } | null = { id: 'term-one' };
        const { deps, steered, copied } = fakes();
        const live: SendDeps = { ...deps, terminal: () => terminal };
        terminal = null;
        expect(await sendComment('p', live)).toEqual({ kind: 'copied' });
        expect(steered).toEqual([]);
        expect(copied).toEqual(['p']);
    });
});

describe('one send at a time per box', () => {
    it('does not steer a second time while the first is in flight', async () => {
        let land: (answer: TerminalAnswer) => void = () => undefined;
        const held = new Promise<TerminalAnswer>((resolve) => (land = resolve));
        const { deps, steered } = fakes({ answer: held });
        const guard = sendGuard();
        const first = sendOnce(guard, 'p', deps);
        expect(await sendOnce(guard, 'p', deps)).toBeNull();
        expect(steered).toHaveLength(1);
        land({ ok: true, id: 'term-one', error: '' });
        expect(await first).toEqual({ kind: 'sent' });
        // Once the first has landed, the next send goes.
        expect(await sendOnce(guard, 'p', fakes().deps)).toEqual({ kind: 'sent' });
    });

    it('hands back nothing for an answer that lands after the box was closed or moved', async () => {
        let land: (answer: TerminalAnswer) => void = () => undefined;
        const held = new Promise<TerminalAnswer>((resolve) => (land = resolve));
        const { deps } = fakes({ answer: held });
        const guard = sendGuard();
        const first = sendOnce(guard, 'p', deps);
        guard.cancel();
        land({ ok: true, id: 'term-one', error: '' });
        expect(await first).toBeNull();
    });

    it('keeps a send in flight counted until it lands even after the box was closed', async () => {
        let land: (answer: TerminalAnswer) => void = () => undefined;
        const held = new Promise<TerminalAnswer>((resolve) => (land = resolve));
        const slow = fakes({ answer: held });
        const guard = sendGuard();
        const first = sendOnce(guard, 'p', slow.deps);
        guard.cancel();
        const again = fakes();
        expect(await sendOnce(guard, 'p', again.deps)).toBeNull();
        expect(again.steered).toEqual([]);
        land({ ok: true, id: 'term-one', error: '' });
        await first;
        expect(await sendOnce(guard, 'p', again.deps)).toEqual({ kind: 'sent' });
    });

    it('lets a send that was superseded before it began run under the new box', async () => {
        const guard = sendGuard();
        guard.cancel();
        expect(await sendOnce(guard, 'p', fakes().deps)).toEqual({ kind: 'sent' });
    });
});

describe('one clipboard write at a time per box', () => {
    /** Deps with no terminal whose clipboard write lands when `land` is called. */
    function slowCopy() {
        let land: () => void = () => undefined;
        const written: string[] = [];
        const deps: SendDeps = {
            terminal: () => null,
            steer: () => Promise.reject(new Error('no terminal')),
            copy: (text) => {
                written.push(text);
                return new Promise<void>((resolve) => (land = resolve));
            }
        };
        return { deps, written, land: () => land() };
    }

    it('writes once while the first write is in flight', async () => {
        const slow = slowCopy();
        const guard = sendGuard();
        const first = sendOnce(guard, 'p', slow.deps);
        expect(await sendOnce(guard, 'p', slow.deps)).toBeNull();
        expect(slow.written).toEqual(['p']);
        slow.land();
        expect(await first).toEqual({ kind: 'copied' });
    });

    it('hands back nothing for a write that lands after the box was closed or moved', async () => {
        const slow = slowCopy();
        const guard = sendGuard();
        const first = sendOnce(guard, 'p', slow.deps);
        guard.cancel();
        slow.land();
        expect(await first).toBeNull();
    });
});

describe('what each outcome says', () => {
    it('closes the box and says where the comment went when it was sent or copied', () => {
        expect(commentOutcome({ kind: 'sent' }, 'The live one')).toEqual({
            done: true,
            line: 'Sent to The live one.'
        });
        expect(commentOutcome({ kind: 'copied' }, 'The live one')).toEqual({
            done: true,
            line: 'The live one has no oculus terminal now. The comment is on the clipboard.'
        });
    });

    it('keeps the box open and says the error, or that the terminal did not answer when it gave none', () => {
        expect(commentOutcome({ kind: 'failed', error: 'tmux: no server' }, 'x')).toEqual({
            done: false,
            line: 'tmux: no server'
        });
        expect(commentOutcome({ kind: 'failed', error: '' }, 'x')).toEqual({
            done: false,
            line: 'The terminal did not answer.'
        });
    });

    it('keeps the box open and says the clipboard refused the copy', () => {
        expect(commentOutcome({ kind: 'refused' }, 'x')).toEqual({
            done: false,
            line: 'The clipboard refused the copy.'
        });
    });

    it('calls a session by its title, and by its id when the title is empty', () => {
        expect(commentTitle({ id: 's-1', title: 'The live one' })).toBe('The live one');
        expect(commentTitle({ id: 's-1', title: '' })).toBe('s-1');
        expect(commentOutcome({ kind: 'sent' }, commentTitle({ id: 's-1', title: '' })).line).toBe(
            'Sent to s-1.'
        );
    });
});

describe('the bar the comment box is drawn in', () => {
    const hunk = { id: '0', after: 11 };

    it('is after the commented line of its side, ordered below a hunk bar after the same line', () => {
        expect(commentBars([hunk], { side: 'original', line: 7 })).toEqual([
            hunk,
            { id: COMMENT_BAR, after: 7, side: 'original', order: 1 }
        ]);
        expect(commentBars([hunk], { side: 'modified', line: 11 })[1]).toEqual({
            id: 'comment',
            after: 11,
            side: 'modified',
            order: 1
        });
    });

    it('is no bar while no box is open, and leaves the hunk bars as they were', () => {
        expect(commentBars([hunk], null)).toEqual([hunk]);
    });
});

describe('the keys of the comment box', () => {
    const press = (key: string, mods: { ctrlKey?: boolean; metaKey?: boolean } = {}) => ({
        key,
        ctrlKey: false,
        metaKey: false,
        ...mods
    });

    it('sends on Ctrl+Enter and on Cmd+Enter whatever the platform, and not on a plain Enter', () => {
        expect(commentKey(press('Enter', { ctrlKey: true }))).toBe('send');
        expect(commentKey(press('Enter', { metaKey: true }))).toBe('send');
        expect(commentKey(press('Enter'))).toBeNull();
    });

    it('closes on Escape and leaves every other key to the text', () => {
        expect(commentKey(press('Escape'))).toBe('close');
        expect(commentKey(press('a', { ctrlKey: true }))).toBeNull();
    });
});

describe('the clipboard a send copies to', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is absent where the browser has no clipboard, as outside a secure context', () => {
        vi.stubGlobal('navigator', {});
        expect(browserCopy()).toBeNull();
    });

    it('writes the text through the browser clipboard where there is one', async () => {
        const written: string[] = [];
        vi.stubGlobal('navigator', {
            clipboard: {
                writeText: (text: string) => {
                    written.push(text);
                    return Promise.resolve();
                }
            }
        });
        const copy = browserCopy();
        expect(copy).not.toBeNull();
        await copy?.('hello');
        expect(written).toEqual(['hello']);
    });
});
