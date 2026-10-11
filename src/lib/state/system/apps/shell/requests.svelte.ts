// Layer 2, client state. What the apps ask of the reader, and the work they ask a page to do. The
// requests come from two places: the open requests of the `app-shell` channel, which every page the
// server serves shows until the first answer settles one, and the requests of a frame, which are
// held on the frame's own page alone and answered without the server.
//
// A message becomes a notification with the items as its actions, or a confirm when it is modal;
// a progress becomes a notification with a bar, or an item of the status bar's left end; a quick
// pick and an input box are the one quick input over the page (this store holds the request,
// shell/commands/ draws it). Three kinds are taken by one page
// and not answered by all: a host's run of an `oculus.<name>` command, a host's run of a command
// only a frame registered, and a host's panel. The page that has the focus takes such a request,
// else the first page that gains the focus, and the request waits while no page does.
//
// A request that leaves the channel was settled on another page or withdrawn by its host, and the
// notification or confirm it made goes. The first answer settles a request: an answer after it
// is told `missing` and settles nothing.

import { untrack } from 'svelte';
import type {
    AppMessageRequest,
    AppPanelRequest,
    AppProgressRequest,
    AppRequest,
    AppRequestBody
} from '../../../../data/model/index.ts';
import type { NoticeSink, WritesStore } from '../../../shared/stores/shapes.ts';

/** What the work of a command the page was asked to run came to. */
export type CommandResult = { ok: true; value: unknown } | { ok: false; word: string };

/** What the requests need of the rest of the client. */
export type RequestsDeps = {
    requests: () => AppRequest[];
    post: WritesStore['postCommand'];
    notices: NoticeSink;
    pageId: string;
    /** Run one of oculus's own commands, `oculus.<name>`, on this page. */
    pageCommand: (id: string, args: unknown[]) => Promise<CommandResult>;
    /** Run a command only an open tab of the app registered; null when no tab held it. */
    runInTab: (app: string, command: string, args: unknown[]) => Promise<CommandResult | null>;
    /** Open the tab of a panel a host asked for. */
    openPanel: (request: AppPanelRequest & { app: string }) => void;
};

/** A request as the page holds it: where it came from decides how it is answered. */
export type HeldRequest = AppRequest & { local: boolean };

/** The quick input on screen: a quick pick or an input box. */
export type QuickInput = {
    request: HeldRequest & (AppRequestBody & { kind: 'quickPick' | 'inputBox' });
    /** Settle it with the choice or the text, or with undefined for a dismissal. */
    answer: (result: unknown) => void;
    /** The check of the host on a value of an input box, 150 ms after it changed. */
    validate: ((value: string) => Promise<string>) | null;
};

/** A modal message waiting for the reader. */
export type ModalMessage = {
    id: string;
    message: string;
    items: string[];
    answer: (item: string | undefined) => void;
};

/** What the page did for a request, to undo when the request goes. */
type Handled = { notice?: number; modal?: boolean; quick?: boolean };

const MISSING: CommandResult = { ok: false, word: 'missing' };

export type RequestsStore = ReturnType<typeof createRequests>;

export function createRequests(deps: RequestsDeps) {
    const held = $state<{
        local: HeldRequest[];
        focused: boolean;
        modals: ModalMessage[];
        next: number;
    }>({
        local: [],
        focused: typeof document !== 'undefined' && document.hasFocus(),
        modals: [],
        next: 0
    });
    /** The settle functions of the requests of this page's frames. */
    const localAnswers = new Map<string, (result: unknown) => void>();
    const handled = new Map<string, Handled>();
    const taken = new Set<string>();

    const everything = (): HeldRequest[] => [
        ...deps.requests().map((one) => ({ ...one, local: false })),
        ...held.local
    ];

    /** Send the answer of a request of the server, once; a later one is told `missing`. */
    async function answerServer(id: string, result: unknown): Promise<void> {
        await deps.post('/api/app-host', { action: 'answer', id, result, page: deps.pageId });
    }

    /** End a request of a frame: it leaves the page and its promise settles with `result`. */
    function finish(id: string, result: unknown): void {
        const settle = localAnswers.get(id);
        localAnswers.delete(id);
        held.local = held.local.filter((one) => one.id !== id);
        settle?.(result);
    }

    /**
     * Answer a request. A progress of a frame stays until its task ends and its promise settles,
     * which tells the task Cancel was pressed.
     */
    function answer(id: string, result: unknown): void {
        const local = held.local.find((one) => one.id === id);
        if (local === undefined) void answerServer(id, result);
        else if (local.kind === 'progress') localAnswers.get(id)?.(result);
        else finish(id, result);
    }

    /** The words a progress notification reads. */
    function progressWords(request: AppProgressRequest): string {
        if (request.message === '') return request.title;
        return request.title === '' ? request.message : `${request.title}: ${request.message}`;
    }

    function postMessage(request: HeldRequest & AppMessageRequest): number {
        return deps.notices.post(request.message, {
            tone: request.tone,
            actions: request.items.map((item) => ({
                label: item,
                run: () => answer(request.id, item)
            })),
            cleared: () => answer(request.id, undefined)
        });
    }

    async function takeCommand(request: HeldRequest & { kind: 'command' }): Promise<void> {
        const done =
            request.target === ''
                ? await deps.pageCommand(request.command, request.args)
                : ((await deps.runInTab(request.target, request.command, request.args)) ?? MISSING);
        answer(request.id, done);
    }

    /** Do what a new request asks of this page. */
    function intake(request: HeldRequest): Handled {
        if (request.kind === 'message') {
            if (!request.modal) return { notice: postMessage(request) };
            held.modals = [
                ...held.modals,
                {
                    id: request.id,
                    message: request.message,
                    items: request.items,
                    answer: (item) => {
                        held.modals = held.modals.filter((one) => one.id !== request.id);
                        answer(request.id, item);
                    }
                }
            ];
            return { modal: true };
        }
        if (request.kind === 'progress') {
            if (request.location === 'window') return {};
            return {
                notice: deps.notices.post(progressWords(request), {
                    progress: {
                        percent: request.percent,
                        cancel: request.cancellable ? () => answer(request.id, null) : null
                    }
                })
            };
        }
        if (request.kind === 'quickPick' || request.kind === 'inputBox') {
            if (!request.local) cancelLocalQuick();
            return { quick: true };
        }
        return {};
    }

    /** A new quick input of the server cancels the one a frame asked for. */
    function cancelLocalQuick(): void {
        for (const one of held.local) {
            if (one.kind === 'quickPick' || one.kind === 'inputBox') finish(one.id, undefined);
        }
    }

    /** Take the requests that need one page, when this page has the focus. */
    function take(request: HeldRequest, focused: boolean): void {
        if (request.local || taken.has(request.id) || !focused) return;
        if (request.kind === 'command') {
            taken.add(request.id);
            void takeCommand(request);
        } else if (request.kind === 'panel') {
            taken.add(request.id);
            deps.openPanel(request);
            answer(request.id, null);
        }
    }

    /** Bring the notifications and confirms in line with the requests now open. */
    function reconcile(focused: boolean): void {
        const open = everything();
        const ids = new Set(open.map((one) => one.id));
        for (const request of open) {
            const seen = handled.get(request.id);
            if (seen === undefined) handled.set(request.id, intake(request));
            else if (request.kind === 'progress' && seen.notice !== undefined) {
                deps.notices.update(seen.notice, {
                    message: progressWords(request),
                    percent: request.percent
                });
            }
            take(request, focused);
        }
        for (const [id, seen] of [...handled]) {
            if (ids.has(id)) continue;
            handled.delete(id);
            taken.delete(id);
            if (seen.notice !== undefined) deps.notices.remove(seen.notice);
            if (seen.modal === true) held.modals = held.modals.filter((one) => one.id !== id);
        }
    }

    if (typeof window !== 'undefined') {
        const focus = (): void => {
            held.focused = document.hasFocus();
        };
        window.addEventListener('focus', focus);
        window.addEventListener('blur', focus);
        // A page that goes away ends the panels it opened, as a keepalive post outlives it.
        window.addEventListener('pagehide', () => {
            void deps.post('/api/app-host', { action: 'release', page: deps.pageId }, {}, true);
        });
    }

    $effect.root(() => {
        $effect(() => {
            everything();
            const focused = held.focused;
            untrack(() => reconcile(focused));
        });
    });

    /**
     * Ask the reader on behalf of a frame of this page: the request shows here alone, and the
     * answer is the promise. A second quick pick or input box answers the first `undefined`.
     */
    function ask(app: string, body: AppRequestBody): { id: string; answer: Promise<unknown> } {
        held.next += 1;
        const id = `l${held.next}`;
        if (body.kind === 'quickPick' || body.kind === 'inputBox') cancelLocalQuick();
        const result = new Promise<unknown>((settle) => {
            localAnswers.set(id, settle);
        });
        held.local = [...held.local, { id, app, local: true, ...body }];
        return { id, answer: result };
    }

    /** End a request of a frame without an answer, as a progress is when its task ends. */
    function withdraw(id: string): void {
        finish(id, undefined);
    }

    /** Change the words and the share of a request of a frame that is a progress. */
    function progress(id: string, change: { message?: string; percent?: number | null }): void {
        held.local = held.local.map((one) =>
            one.id === id && one.kind === 'progress'
                ? {
                      ...one,
                      message: change.message ?? one.message,
                      percent: change.percent === undefined ? one.percent : change.percent
                  }
                : one
        );
    }

    /** The newest quick input, a frame's or a host's, whichever was asked last. */
    function quick(): QuickInput | null {
        const found = everything().findLast(
            (one) => one.kind === 'quickPick' || one.kind === 'inputBox'
        );
        if (found === undefined) return null;
        const request = found;
        const validate =
            request.kind === 'inputBox' && request.validate && !request.local
                ? (value: string) => validated(request.app, request.id, value)
                : null;
        return { request, answer: (result) => answer(request.id, result), validate };
    }

    /** Ask the host of an app to check the value of an input box; the message, empty for ok. */
    async function validated(app: string, id: string, value: string): Promise<string> {
        const posted = await deps.post('/api/app-host', {
            action: 'provide',
            app,
            kind: 'validateInput',
            view: id,
            value
        });
        const result = posted.body.value;
        return posted.ok && typeof result === 'string' ? result : '';
    }

    /** The progress in the status bar: the requests of location `window`. */
    function windowProgress(): (HeldRequest & AppProgressRequest)[] {
        return everything().filter(
            (one): one is HeldRequest & AppProgressRequest =>
                one.kind === 'progress' && one.location === 'window'
        );
    }

    return {
        ask,
        withdraw,
        progress,
        quick,
        windowProgress,
        modals: (): ModalMessage[] => held.modals,
        cancel: (id: string): void => answer(id, null)
    };
}
