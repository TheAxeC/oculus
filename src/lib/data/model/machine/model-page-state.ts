// Layer 1, data. The page state oculus keeps for this machine in its state folder (`~/.oculus`):
// each workspace's arrangement, the record of layout writes, each tab's view state and the
// debugger's breakpoints and watches, as the server reads and writes them, as GET and POST
// /api/state carry them and as the `state` channel tells another page of a save.
//
// The four files are `layouts.json`, `layout-writes.json`, `views.json` and `debug.json`. Oculus
// alone writes them; a file that is there and does not read is a finding, reads as holding nothing,
// and is never written over.

import type { Finding } from '../model-entities.ts';

/**
 * One write of the saved layout: `at` the time in milliseconds, `tab` the id of the page that wrote
 * it, `call` the name of the layout store operation that asked for it, `page` the id of the page on
 * screen, and `tabs` every tab then in the arrangement as `<tab id>:<view id>`, so a tab that
 * disappears between two entries, and the page that wrote the entry it disappeared in, can be read
 * off the list. A write equal to the newest entry in all but its time (a sash dragged, a scroll) is
 * counted on that entry: `n` the writes it stands for, `last` the time of the latest.
 */
export type LayoutWrite = {
    at: number;
    tab: string;
    call: string;
    page: string;
    tabs: string[];
    n?: number;
    last?: number;
};

/**
 * What `layouts.json` holds for one workspace: the arrangement envelope last admitted (absent
 * before the first save) and the copy of an envelope the page could not read (`unread`), which no
 * save writes over.
 */
export type HeldLayout = { envelope?: unknown; unread?: unknown };

/** The page state as the files hold it. */
export type PageState = {
    /** Each workspace's arrangement, by the real path of its file or `unsaved`. */
    layouts: Record<string, HeldLayout>;
    /** Each view instance's state, and the records a view keeps under a fixed id, by id. */
    views: Record<string, unknown>;
    /** The breakpoints, watches, chosen configurations and toolbar place; null when none. */
    debug: unknown;
};

/**
 * What GET /api/state answers and a page's load is handed: the page state, the version of the
 * `state` channel it is at least as new as, and the findings of the files that do not read.
 */
export type PageStateRead = PageState & { version: number; findings: Finding[] };

/** One write a page asks of the page state, as POST /api/state carries it. */
export type PageStateWrite =
    | {
          kind: 'layout';
          identity: string;
          /** The envelope to write, carrying its own `stamp` and the `from` it was made from. */
          envelope: unknown;
          /** The stamp of the envelope the save was made from, or null for none. */
          from: string | null;
          /** The entry the record of layout writes gains when the save is admitted. */
          write: LayoutWrite;
          /** The page that asks, which the `state` message names so it does not take its own. */
          by: string;
      }
    | { kind: 'unread'; identity: string; value: unknown; by: string }
    | { kind: 'views'; set: Record<string, unknown>; remove: string[]; by: string }
    | { kind: 'debug'; value: unknown; by: string };

/**
 * What a write answers: done, a layout save refused because the workspace holds another envelope
 * than the one the save was made from (`held`, which the page takes and runs its change again on),
 * or the sentence of why nothing was written.
 */
export type PageStateAnswer =
    { ok: true } | { ok: false; held: unknown } | { ok: false; error: string };

/** One batch of view state changes of one page, as the `state` channel carries it. */
type ViewsChange = { by: string; set: Record<string, unknown>; remove: string[] };

/**
 * The payload of the `state` channel: what saves landed since the last message. `layouts` the
 * envelope now held for each workspace that changed, with the page that saved it; `views` the
 * batches of view state changes in the order they landed; `debug` the debugger's record and its
 * page. A field a message does not carry did not change.
 */
export type StatePayload = {
    layouts?: Record<string, { envelope: unknown; by: string }>;
    views?: ViewsChange[];
    debug?: { value: unknown; by: string };
};
