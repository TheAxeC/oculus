// Layer 2, client state. How a composer comes to be shown in a Terminal tab, and what the tab holds
// for a hub task it is seeded with: `composeIn` and `composeInTab` (New), and `composeAt` (a start
// from a place or from a task). The record a tab keeps of its composer, with the reference of the
// task, is state/sessions/terminal/composer/composer.ts's and goes into the saved layout; the text
// the server answered for the task (its seed, folder and name) is held here, per tab, and never
// saved: a composer restored with a reference and no seed asks the server for it again.
//
// A task start asks the server for the seed before anything opens, so a task the hub does not hold
// opens nothing and is said as its sentence. A later `composeAt` that begins while an earlier one
// waits on its seed is the one that opens; the earlier one is answered with nothing to say.
//
// A tab reading a session is no place a start lands (`pageTarget`), with one exception here: New
// goes first to a tab of the page that holds a typed prompt (`draft`), reading a session or not,
// since a press took the composer off its screen and New brings that prompt back. A start from a
// place or a task never takes a reading tab and never ends a reading.

import type { AgentId, StartKind, TaskRef } from '../../../../data/model/index.ts';
import { addressOfId, splitHubId } from '../../../../data/helpers/hub-names.ts';
import { t } from '../../../shared/words/text.ts';
import { defaultAgent } from '../../../shared/words/appearance.ts';
import type { TerminalAnswer } from '../pty/pty-io.ts';
import {
    composingIn,
    emptyTab,
    liveTab,
    readTab,
    type TerminalTabState
} from '../terminal-tabs.ts';
import type { TerminalTab, TerminalTabs } from '../session/workbench-shape.ts';
import {
    composerOf,
    freshComposer,
    splitState,
    startedAt,
    withComposer,
    withDraft
} from './composer.ts';

/** The seed, folder and name the server answered for the task a tab's composer carries. */
export type HeldTask = { ref: TaskRef; seed: string; cwd: string; name: string };

/**
 * Where a start opens its composer: a folder, or a task. A task start that names no agent opens
 * with the `terminal.default_agent` option. A folder start with `documents` set, on a page with no
 * Terminal tab, opens the Terminal tab it needs in the page's documents pane. `asNew` says the
 * folder start is New pressed in a list limited to a folder, which takes the tab New takes.
 */
export type ComposeAt =
    | { cwd: string; agent: AgentId; documents?: boolean; asNew?: boolean }
    | { task: TaskRef; agent?: AgentId };

/** What the opening reads of the terminals store. */
export type OpeningHost = {
    workbench: TerminalTabs | undefined;
    terminalTabs: () => TerminalTab[];
    /** The Terminal tab a page keeps its terminals in, or null when it has none. */
    pageTab: (tabs: readonly TerminalTab[], page: string) => TerminalTab | null;
    /** The folder a tab's shown terminal (else its first) runs in, or null. */
    folderOf: (tab: TerminalTab) => string | null;
    /** The server's seed for a task, as an answer or its refusal. */
    seedTask: (ref: TaskRef) => Promise<TerminalAnswer>;
};

/** Open composers, and hold the seeds of the tabs seeded with a task. */
export function createComposerOpening(host: OpeningHost) {
    const { workbench } = host;
    /** The seed each tab's composer shows, by tab id. */
    const held: { tasks: Record<string, HeldTask | undefined> } = $state({ tasks: {} });
    /** The `composeAt` that began last, so an earlier one that waits on its seed gives way. */
    let latest = 0;

    /** The tab of a page holding a typed prompt: of several, `pageTab`'s pick, else the first. */
    function typedTab(tabs: readonly TerminalTab[], on: string): TerminalTab | null {
        if (workbench === undefined) return null;
        const typed = tabs.filter(
            (tab) =>
                tab.page === on && composerOf(workbench.instanceState(tab.id)).draft !== undefined
        );
        return host.pageTab(typed, on) ?? typed.at(0) ?? null;
    }

    /**
     * The Terminal tab of a page a composer shows in: for New (`asNew`) the tab that holds a typed
     * prompt, so the prompt is never left hidden; then the page's Terminal tab; then a new one
     * there, in the documents pane of a page with no Terminal tab when `documents` is set.
     */
    function targetTab(on: string, documents: boolean, asNew: boolean): TerminalTab | null {
        if (workbench === undefined) return null;
        const tabs = host.terminalTabs();
        const existing = (asNew ? typedTab(tabs, on) : null) ?? host.pageTab(tabs, on);
        if (existing !== null) return existing;
        const id = workbench.open(on, emptyTab(crypto.randomUUID()), documents);
        return host.terminalTabs().find((tab) => tab.id === id) ?? null;
    }

    /**
     * New with a prompt (the `n` key, the Sessions tab's New): the composer in the Terminal tab of
     * a page, which keeps the terminals it owns, or in a new Terminal tab there; the tab is
     * activated. The page is the one on screen unless named. The composer starts in the tab's
     * folder, and `targetTab` says which tab it is.
     */
    function composeIn(page?: string, documents = false): void {
        if (workbench === undefined) return;
        const on = page ?? workbench.currentPage();
        const target = targetTab(on, documents, true);
        if (target === null) return;
        showComposer(target);
        workbench.activate(target.id, on);
    }

    /**
     * The composer in the Terminal tab of this id, of the given kind (the shown terminal's for the
     * dropdown's With a Prompt); an id no page holds shows nothing.
     */
    function composeInTab(id: string, agent?: StartKind): void {
        const target = host.terminalTabs().find((tab) => tab.id === id);
        if (target !== undefined) showComposer(target, agent);
    }

    /**
     * The composer shown in a tab, which keeps the terminals it owns. It starts in the tab's folder
     * and in the kind given, the `terminal.default_agent` option when none is, with the accounts
     * and picks the tab held. Before the page has its settings no composer is shown.
     */
    function showComposer(target: TerminalTab, given?: StartKind): void {
        const agent = given ?? defaultAgent();
        if (workbench === undefined || agent === null) return;
        const tabState = readTab(target.state);
        const folder = host.folderOf(target);
        const now = workbench.instanceState(target.id);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the record is keyed by tab id, and a Map would not be reactive through $state
        delete held.tasks[target.id];
        workbench.setInstanceState(
            target.id,
            folder === null ? freshComposerOf(now, agent) : splitState(folder, agent, now)
        );
        workbench.restate(target.id, target.page, liveTab(composingIn(tabState)));
    }

    /** A new composer's state in the kind given, with the accounts and picks the tab held. */
    function freshComposerOf(state: unknown, agent: StartKind): Record<string, unknown> {
        const fresh = freshComposer(state);
        const record = fresh.composer as Record<string, unknown>;
        return { ...fresh, composer: { ...record, agent } };
    }

    /** Show the composer of a tab in the state `startedAt` makes of a start. */
    function showAt(
        target: TerminalTab,
        at: { cwd: string; agent: AgentId; task?: TaskRef },
        tabState: TerminalTabState
    ): void {
        if (workbench === undefined) return;
        // A composer off the tab's screen brings no typed prompt into a start: the prompt waits for
        // New, and only a composer on screen keeps its words under a seed.
        const held = workbench.instanceState(target.id);
        const kept = tabState.composing ? held : withDraft(held, '', []);
        workbench.setInstanceState(target.id, startedAt(kept, at));
        workbench.restate(target.id, target.page, liveTab(composingIn(tabState)));
        workbench.activate(target.id, target.page);
    }

    /**
     * Open the composer at a place or on a task. A refusal of the task's seed is answered as its
     * sentence and opens nothing; the empty string is a composer opened, or an earlier start that
     * a later one replaced.
     */
    async function composeAt(at: ComposeAt): Promise<string> {
        if (workbench === undefined) return '';
        const mine = ++latest;
        if (!('task' in at)) {
            const target = targetTab(
                workbench.currentPage(),
                at.documents === true,
                at.asNew === true
            );
            if (target !== null) showAt(target, at, readTab(target.state));
            return '';
        }
        const answer = await host.seedTask(at.task);
        if (mine !== latest) return '';
        if (!answer.ok || answer.seeded === undefined) {
            return answer.error === '' ? t('sessions.terminal_start_failed') : answer.error;
        }
        const target = targetTab(workbench.currentPage(), false, false);
        const agent = at.agent ?? defaultAgent();
        if (target === null || agent === null) return '';
        held.tasks[target.id] = { ref: at.task, ...answer.seeded };
        showAt(target, { cwd: answer.seeded.cwd, agent, task: at.task }, readTab(target.state));
        return '';
    }

    /** The seed a tab's composer shows, or null when it carries no task or has none yet. */
    function taskOf(tab: string): HeldTask | null {
        const ref = composerOf(workbench?.instanceState(tab)).task;
        const one = held.tasks[tab];
        return ref !== undefined && one !== undefined && sameTask(one.ref, ref) ? one : null;
    }

    /**
     * Ask the server for the seed of the task a tab's composer carries, when it holds none (a
     * composer restored from the saved layout) or `fresh` asks for the current one (after
     * `task-changed`). A refusal drops the task from the tab's record and is answered as its
     * sentence; the empty string is a seed held.
     */
    async function loadTask(tab: string, fresh = false): Promise<string> {
        const state = workbench?.instanceState(tab);
        const ref = composerOf(state).task;
        if (workbench === undefined || ref === undefined) return '';
        if (!fresh && taskOf(tab) !== null) return '';
        const answer = await host.seedTask(ref);
        const now = composerOf(workbench.instanceState(tab)).task;
        if (now === undefined || !sameTask(now, ref)) return '';
        if (!answer.ok || answer.seeded === undefined) {
            dropTask(tab);
            return answer.error === '' ? t('sessions.terminal_start_failed') : answer.error;
        }
        held.tasks[tab] = { ref, ...answer.seeded };
        return '';
    }

    /** Take the task off a tab's composer: its record and its held seed. */
    function dropTask(tab: string): void {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the record is keyed by tab id, and a Map would not be reactive through $state
        delete held.tasks[tab];
        if (workbench === undefined) return;
        const state = workbench.instanceState(tab);
        const { task: _dropped, ...rest } = composerOf(state);
        workbench.setInstanceState(tab, withComposer(state, rest));
    }

    return { composeIn, composeInTab, composeAt, taskOf, loadTask, dropTask };
}

/**
 * The key of the collection a reference names, in the hub its id names: a card names the collection
 * by its id in the snapshot, `<hub>:tasks`, and the focus ticker by the bare key `tasks`, and the
 * two name one collection.
 */
function collectionKey(ref: TaskRef): string | undefined {
    if (ref.collection === undefined) return undefined;
    return splitHubId(ref.collection, [addressOfId(ref.id).hub]).id;
}

/** Whether two references name the same task line. */
function sameTask(a: TaskRef, b: TaskRef): boolean {
    return (
        a.id === b.id &&
        collectionKey(a) === collectionKey(b) &&
        a.subtask?.key === b.subtask?.key &&
        a.subtask?.do === b.subtask?.do
    );
}
