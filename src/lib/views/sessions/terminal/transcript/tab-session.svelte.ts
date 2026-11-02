// Layer 3, view support. What one Terminal tab has to read: the session it holds in its own state,
// else the session of its shown terminal, and what the tab's switch and Lock tool do with that. A
// tab with no session to read draws no switch and its grids, whatever its `showing` says, so a
// terminal whose agent quit, or another row pressed, needs no write to the tab.
//
// It holds what the presses on the runs of the transcript chose (`choices`), since the transcript
// body goes with every switch to Live and a press outlives it. The choices are for one transcript:
// a target of another session or agent empties them, and a tab left with no target keeps them, so
// a tab that comes back to the same target finds them. They last as long as the tab's view is
// mounted and are never saved.

import { SvelteMap } from 'svelte/reactivity';
import type { TabTranscript, TerminalTabState } from '$lib/state/sessions/terminal/terminal-tabs';
import { useState } from '$lib/state/client/use';
import type { RunChoice } from './turn-rows';

/**
 * The session a tab reads and what its switch and its lock draw, over the tab's state and how to
 * replace it. Called while the view's component initialises, since it reads the client's stores.
 */
export function tabSession(
    state: () => TerminalTabState,
    restate: (next: TerminalTabState) => void
) {
    const {
        selectors: { sessionById },
        terminals: { sessionOfTerminal, showTerminal, terminalOfSession }
    } = useState();

    const tab = $derived(state());
    /** The session of the terminal the tab shows, or null. */
    const running = $derived(sessionOfTerminal(tab.shown));
    const target: TabTranscript | null = $derived(
        tab.transcript ?? (running === null ? null : { session: running.id, agent: '' })
    );
    /** The terminal of a session the tab reads with no terminal of its own, or null. */
    const elsewhere = $derived(
        tab.shown !== null || target === null
            ? null
            : terminalOfSession(sessionById(target.session))
    );

    /** What a press chose for each run of the transcript, by `runKey`. */
    const choices = new SvelteMap<string, RunChoice>();

    /**
     * The words of the target, or null for none. The target is a new object at each sessions
     * message; these change only when the session or the agent does.
     */
    const reads = $derived(target === null ? null : JSON.stringify([target.session, target.agent]));

    /** The last target the tab had, which the choices belong to. */
    let owner: string | null = null;

    // The choices go before the new target's turns are drawn, since a run's key means nothing in
    // another transcript.
    $effect.pre(() => {
        if (reads === null || reads === owner) return;
        owner = reads;
        choices.clear();
    });

    return {
        /** The session and the agent the tab reads, or null for none, which draws no switch. */
        get target() {
            return target;
        },
        choices,
        /** Whether the transcript body is drawn in place of the row of grids. */
        get reading() {
            return tab.showing === 'transcript' && target !== null;
        },
        /** Whether Live has a terminal to show. */
        get live() {
            return tab.shown !== null || elsewhere !== null;
        },
        /**
         * Whether the Lock tool is drawn: a terminal with a session shows, and while the tab is
         * locked at all, so a lock can be taken off after the agent quit.
         */
        get lockable() {
            return tab.shown !== null && (tab.locked || running !== null);
        },
        /** Whether the tab's boxes and grids are read-only; a lock binds a tab's own terminals. */
        get locked() {
            return tab.locked && tab.shown !== null;
        },
        /** Move the switch: a tab with no terminal of its own shows the session's elsewhere. */
        choose: (showing: TerminalTabState['showing']): void => {
            if (showing === 'live' && tab.shown === null) {
                if (elsewhere !== null) showTerminal(elsewhere.id);
                return;
            }
            restate({ ...tab, showing });
        },
        /** Turn the tab's lock over. */
        toggleLock: (): void => {
            restate({ ...tab, locked: !tab.locked });
        }
    };
}
