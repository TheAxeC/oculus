// The editor's paint call: a paint that fails (a code theme whose file did not load) is told to the
// editor and never escapes as a rejection.
// What this does NOT cover: the editors calling it on mount and on a look change, which the look at
// the landing shows.

import { describe, expect, it } from 'vitest';
import { paintCode } from '../../../../../src/lib/ui/controls/editor/kit/look.ts';
import type { EditorKit } from '../../../../../src/lib/ui/controls/editor/kit/load.ts';

/** A kit whose paint answers as given; nothing else of the kit is used. */
function kitPainting(paint: EditorKit['paint']): EditorKit {
    return { monaco: {} as never, mac: false, paint };
}

describe('paintCode', () => {
    // Revert: drop the try/catch in paintCode; the rejection escapes and `failed` is not called.
    it('resolves when the paint rejects, and tells the editor to forget what it painted', async () => {
        let painted: string | null = 'look';
        const kit = kitPainting(() => Promise.reject(new Error('import failed')));
        await expect(paintCode(kit, 'nord', () => (painted = null))).resolves.toBeUndefined();
        expect(painted).toBeNull();
    });

    // Revert: call `failed` after a paint that succeeded; the editor would forget a good paint.
    it('leaves the painted key alone when the paint succeeds, and passes the code theme on', async () => {
        let painted: string | null = 'look';
        const asked: (string | undefined)[] = [];
        const kit = kitPainting((_read, code) => {
            asked.push(code);
            return Promise.resolve('oculus');
        });
        await paintCode(kit, 'nord', () => (painted = null));
        expect(painted).toBe('look');
        expect(asked).toEqual(['nord']);
    });
});
