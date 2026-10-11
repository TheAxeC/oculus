// Layer 2, client state. The notifications: what was said to the reader, newest first, which of it
// the reader has not seen, and which of it is showing as a toast above the status bar's right end.
//
// Any module that holds the client posts one through `post`, one call with the words and, where
// there is something to do about it, the actions; the status bar's bell counts what is unread, its
// centre lists everything, and the toasts show what came since. Do Not Disturb is the ui store's,
// saved with the appearance: while it is on a post goes into the list and shows no toast.
//
// A notification may carry progress: a bar that fills as a task reports, with a Cancel while the
// task can be cancelled, and it is changed in place by `update` and taken out by `remove` when the
// task is done. A notification that was cleared by the reader, one at a time or all at once, tells
// whoever posted it, which is how an app's message resolves when its notification is dismissed.
//
// The list lives as long as the page does. An action is a function, which no storage keeps, and a
// notification is about something that happened while the page was open.

/** How a notification reads: said, warned of, or a failure. */
export type NoticeTone = 'info' | 'warning' | 'error';

/** One thing a notification offers to do about itself, a button in its toast and its entry. */
export type NoticeAction = { label: string; run: () => void };

/** The progress a notification carries: the share done, null while unknown, and Cancel. */
type NoticeProgress = { percent: number | null; cancel: (() => void) | null };

export type Notice = {
    id: number;
    message: string;
    tone: NoticeTone;
    /** When it was posted, in milliseconds since the epoch. */
    at: number;
    actions: NoticeAction[];
    /** Whether the reader has opened the centre since it was posted. */
    read: boolean;
    /** Whether it is showing as a toast. */
    toast: boolean;
    /** The progress a task reports through it, or null for a notification that is only said. */
    progress: NoticeProgress | null;
};

/** What a post may add to the words: the tone, the actions, progress and who hears a clear. */
type PostOptions = {
    tone?: NoticeTone;
    actions?: NoticeAction[];
    progress?: NoticeProgress;
    /** Called when the reader clears the notification, one at a time or all together. */
    cleared?: () => void;
};

export type NoticesStore = {
    /** Say something to the reader, answering the notification's id. */
    post: (message: string, options?: PostOptions) => number;
    /** Change the words and the progress of one notification in place. */
    update: (id: number, next: { message?: string; percent?: number | null }) => void;
    /** Take one notification out of the list without telling whoever posted it. */
    remove: (id: number) => void;
    /** Every notification, newest first. */
    list: () => Notice[];
    /** How many the reader has not seen. */
    unread: () => number;
    /** The ones showing as a toast, newest first. */
    toasts: () => Notice[];
    /** Put one toast away, its entry kept in the list. */
    settle: (id: number) => void;
    /** Put every toast away, which is what opening the centre does. */
    settleAll: () => void;
    /** Mark every notification seen. */
    markRead: () => void;
    /** Take one notification out of the list. */
    clear: (id: number) => void;
    /** Take every notification out of the list. */
    clearAll: () => void;
};

/** What the store reads of the ui store: whether Do Not Disturb is on. */
export type Quiet = { statusQuiet: () => boolean };

export function createNotices(ui: Quiet, now: () => number = Date.now): NoticesStore {
    const held: { notices: Notice[]; next: number } = $state({ notices: [], next: 1 });
    /** Who hears a clear, by notification; a function is no state a rune should hold. */
    const hearing = new Map<number, () => void>();

    function post(message: string, options: PostOptions = {}): number {
        const id = held.next;
        held.next += 1;
        const notice: Notice = {
            id,
            message,
            tone: options.tone ?? 'info',
            at: now(),
            actions: options.actions ?? [],
            read: false,
            toast: !ui.statusQuiet(),
            progress: options.progress ?? null
        };
        if (options.cleared !== undefined) hearing.set(id, options.cleared);
        held.notices = [notice, ...held.notices];
        return id;
    }

    /** Take notifications out of the list, telling the posters of those that asked to hear. */
    function drop(wanted: (notice: Notice) => boolean, tell: boolean): void {
        const gone = held.notices.filter(wanted);
        held.notices = held.notices.filter((notice) => !wanted(notice));
        for (const notice of gone) {
            const listener = hearing.get(notice.id);
            hearing.delete(notice.id);
            if (tell) listener?.();
        }
    }

    function change(edit: (notice: Notice) => Notice): void {
        held.notices = held.notices.map(edit);
    }

    return {
        post,
        list: () => held.notices,
        unread: () => held.notices.filter((notice) => !notice.read).length,
        toasts: () => held.notices.filter((notice) => notice.toast),
        settle: (id) =>
            change((notice) => (notice.id === id ? { ...notice, toast: false } : notice)),
        settleAll: () => change((notice) => ({ ...notice, toast: false })),
        markRead: () => change((notice) => ({ ...notice, read: true })),
        clear: (id) => drop((notice) => notice.id === id, true),
        clearAll: () => drop(() => true, true),
        remove: (id) => drop((notice) => notice.id === id, false),
        update: (id, next) =>
            change((notice) =>
                notice.id !== id
                    ? notice
                    : {
                          ...notice,
                          message: next.message ?? notice.message,
                          progress:
                              notice.progress === null || next.percent === undefined
                                  ? notice.progress
                                  : { ...notice.progress, percent: next.percent }
                      }
            )
    };
}
