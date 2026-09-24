// Layer 2, client state. The notifications: what was said to the reader, newest first, which of it
// the reader has not seen, and which of it is showing as a toast above the status bar's right end.
//
// Any module that holds the client posts one through `post`, one call with the words and, where
// there is something to do about it, the actions; the status bar's bell counts what is unread, its
// centre lists everything, and the toasts show what came since. Do Not Disturb is the ui store's,
// saved with the appearance: while it is on a post goes into the list and shows no toast.
//
// The list lives as long as the page does. An action is a function, which no storage keeps, and a
// notification is about something that happened while the page was open.

/** How a notification reads: said, warned of, or a failure. */
export type NoticeTone = 'info' | 'warning' | 'error';

/** One thing a notification offers to do about itself, a button in its toast and its entry. */
export type NoticeAction = { label: string; run: () => void };

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
};

export type NoticesStore = {
    /** Say something to the reader, answering the notification's id. */
    post: (message: string, options?: { tone?: NoticeTone; actions?: NoticeAction[] }) => number;
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

    function post(
        message: string,
        options: { tone?: NoticeTone; actions?: NoticeAction[] } = {}
    ): number {
        const id = held.next;
        held.next += 1;
        const notice: Notice = {
            id,
            message,
            tone: options.tone ?? 'info',
            at: now(),
            actions: options.actions ?? [],
            read: false,
            toast: !ui.statusQuiet()
        };
        held.notices = [notice, ...held.notices];
        return id;
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
        clear: (id) => {
            held.notices = held.notices.filter((notice) => notice.id !== id);
        },
        clearAll: () => {
            held.notices = [];
        }
    };
}
