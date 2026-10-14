// Layer 2, client state. What the explorer store asks of the notes before it posts a rename, a drag
// or a Cut and Paste (explorer/ops.svelte.ts's `noteMoving`): the answer is a refusal or the edit
// to make once the move has landed. The page's link plan that answers it is
// state/system/machine/refactor/note-link-plan.ts, given to the store by state/life/note-hooks.ts.

import type { Move } from '../follow.ts';
import type { ExplorerNotes } from '../ops.svelte.ts';

/** What a move of notes comes to before it is posted: refused, or the edit to make after it. */
export type NoteMoving =
    | { refused: string }
    | {
          /**
           * Make the planned edit over the moves that landed; what it said, '' when it was made.
           */
          landed: (moves: Move[]) => Promise<string>;
      };

/** The answer before a move: refuse it, or make the edit once it lands. */
export type NotesMoving = (moves: Move[]) => Promise<NoteMoving>;

/** A move that touches no note: nothing to plan and nothing to make. */
export const NOTHING_MOVES: NoteMoving = { landed: () => Promise.resolve('') };

/** The explorer's asks while no page has given the notes yet: nothing to plan, tell or close. */
export const NO_NOTES_HOOKS: ExplorerNotes = {
    moving: () => Promise.resolve(NOTHING_MOVES),
    said: () => undefined,
    removed: () => undefined
};
