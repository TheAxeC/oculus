// Layer 2, client state. Which decks the Present view can open, the deck a pane shows, and the
// presentations a page holds.
//
// What is held here is where decks are: the portfolio deck (`portfolio_deck` of the merged config,
// a folder of the hub) and the deck of every project that has one (the snapshot's `project.deck`),
// both derived, so a deck added or a project given its first slide reaches the open deck menu on
// the next push. The deck itself is asked of api/deck the first time it is wanted and held in the
// client state's query client by its root and folder.
//
// The deck is read by the server from files and from the portfolio, so three things make a held
// answer stale: a slide file or `present.yml` written under a watched root (the `files` channel,
// for a message that names the folder of a deck file or names none), a manifest changed, which
// moves a chip or a name on a card (the `portfolio` channel), and a colour or tag tone changed in
// the configuration (the `config` channel, which carries `defaults`). Each new version marks every
// held deck, and the next read asks again from a tab that is shown while what is held keeps
// drawing, so a slide saved in an editor reaches the open pane at the next push. The request
// carries the page's token, as the search does.
//
// Where a reader is in the deck is not here. It belongs to the pane, in the instance state of
// state/workbench/ui.svelte.ts, so two Present panes hold two positions, a pane is on its slide
// when its page comes back, and the slide a project card opens the deck at is the same key.
//
// A presentation is what a pane holds while it shows the presenter screen: its audience window, the
// channel the two windows keep one slide over, the lock that tells the audience window the
// presenter screen is gone, and the timer. It belongs to the page and is keyed by the pane's
// instance id, so it outlives the pane's component: a tab switch, a page switch and any redraw of
// the panes leave it on, and it ends when the instance leaves the layout.

import { SvelteMap } from 'svelte/reactivity';
import { str } from '../../data/helpers/guards.ts';
import { joinPath } from '../../data/helpers/files/paths.ts';
import { placeOf } from '../../data/snapshot/place.ts';
import { readAs } from '../../data/shapes/shapes.ts';
import type { Deck, DeckFrame, DeckSlide, Finding } from '../../data/model/index.ts';
import { t } from '../shared/words/text.ts';
import { readAnswer } from '../sources/fs-transport.ts';
import type { FsRoot } from '../sources/fs.ts';
import { filesNamed, folderNamed } from '../shared/answers/files-named.ts';
import type { EntitiesStore, Queries } from '../shared/stores/shapes.ts';
import {
    audienceAddress,
    audienceFeatures,
    deckShape,
    parseMessage,
    pausedTimer,
    presentName,
    resetTimer,
    resumedTimer,
    startedTimer,
    type DeckDraft,
    type DeckRef,
    type Timer
} from './present.ts';

/** One deck as the pane reads it. */
type DeckAnswer = {
    deck: Deck | null;
    /** What the request failed with, or the empty string. */
    error: string;
    /** True while the first answer for the deck is yet to come. */
    loading: boolean;
};

/** One project's deck as the deck menu lists it. */
type ProjectDeck = { ref: DeckRef; id: string; title: string };

/**
 * A slide a Stage measured taller than its deck's frame: the deck by its root and folder, the
 * slide's key and the file and line it is written at, and the message its finding carries.
 */
type TooTall = {
    root: string;
    path: string;
    key: string;
    source: DeckSlide['source'];
    message: string;
};

/** How far a slide may run past its frame and count as fitting, so a layout rounding is none. */
const TOO_TALL_PX = 1;

/**
 * What a presentation reads of the pane that holds it. The pane's component may not be drawn (its
 * tab is behind another, its page is not shown), so each is a read of the page's stores.
 */
export type PresentLink = {
    /** The key of the slide the pane is on; empty for the deck's first. */
    current: () => string;
    /** Show the slide a key names in the pane. */
    show: (key: string) => void;
    /** Whether the pane's instance is still in the layout. */
    held: () => boolean;
};

/** The presentations of a page. */
type Presenting = {
    /** Whether the pane `instance` presents. */
    on: (instance: string) => boolean;
    /** The pane's timer, null while it does not present. */
    timer: (instance: string) => Timer | null;
    /**
     * Start the pane's presentation of the deck `ref` and open the audience window, which a second
     * press brings back. A pane already presenting the same deck hands its window over and ends.
     * It opens a window, so it is called from a press.
     */
    start: (instance: string, ref: DeckRef, link: PresentLink) => void;
    /** End the pane's presentation: the audience window is told and closes itself. */
    end: (instance: string) => void;
    /** Tell the audience window which slide is on. */
    send: (instance: string, key: string) => void;
    /** Tell the audience window the deck was read again. */
    changed: (instance: string) => void;
    pause: (instance: string) => void;
    resume: (instance: string) => void;
    reset: (instance: string) => void;
};

/**
 * How long the presenter screen waits, after the audience page says it closed, for a page of the
 * same window to say it opened. A reload of the audience window closes and opens it, and the
 * presentation goes on; a window that is closed stays closed, and the presentation ends.
 */
const RETURN_WAIT_MS = 3000;

/** One presentation's parts that are not drawn: its windows, its channel and its lock. */
type Held = {
    ref: DeckRef;
    link: PresentLink;
    channel: BroadcastChannel;
    /** The audience window a browser gave back; the desktop host gives none. */
    audience: Window | null;
    /** Whether an audience page has said it opened, so a page closing is the audience going. */
    heard: boolean;
    /** The wait for the audience page to open again after it closed; null when none runs. */
    returning: ReturnType<typeof setTimeout> | null;
    /** Lets go of the lock; null until the lock is granted. */
    unlock: (() => void) | null;
    /** Stops the watch over the pane's instance. */
    stop: () => void;
    ended: boolean;
};

export type PresentStore = {
    /**
     * Take what a Stage measured of a slide of a deck: how many px it runs past the deck's frame,
     * 0 when it fits. A slide more than 1 px past it is too tall until a measure finds it fitting,
     * or until neither the saved deck nor a deck a pane draws holds it.
     */
    measured: (deck: Deck, row: DeckSlide, over: number) => void;
    /**
     * The deck a pane draws, by the pane's instance id, the saved one or the one read over the
     * drafts; null once the pane draws none. A measure whose slide neither the saved deck nor any
     * pane's deck holds then leaves, so a slide one pane still draws keeps its measure while
     * another pane draws a version of the deck without it.
     */
    drawing: (pane: string, deck: Deck | null) => void;
    /** The message of a slide too tall in a deck, or the empty string for one that fits. */
    tooTall: (deck: Deck, key: string) => string;
    /** One finding for each slide too tall in a deck, at the slide's file and line. */
    findings: () => Finding[];
    /** The portfolio deck, null when the configuration names none. */
    portfolio: () => DeckRef | null;
    /** The decks of the projects that have one, by title. */
    projectDecks: () => ProjectDeck[];
    /** The deck a reference names, the portfolio deck for the empty one; null when none is set. */
    shown: (ref: DeckRef) => DeckRef | null;
    /** The answer for one deck. */
    deck: (ref: DeckRef) => DeckAnswer;
    /**
     * The deck read over the text editors hold unsaved: the same answer, from the files as the
     * drafts have them. Asked on the page's own account and held nowhere, so only the pane that
     * draws from the drafts holds it, and that pane hands the deck it draws to `drawing`.
     */
    drawn: (ref: DeckRef, drafts: DeckDraft[]) => Promise<DeckAnswer>;
    presenting: Presenting;
};

/** What every deck's query key opens with. */
const KIND = 'deck';

/** What a deck reads as until its answer arrives. */
const PENDING: DeckAnswer = { deck: null, error: '', loading: true };

/** What no deck at all reads as: no reference asks nothing and waits for nothing. */
const NOTHING: DeckAnswer = { deck: null, error: '', loading: false };

/** The deck a request answers, or what it failed with. */
async function deckOf(ask: () => Promise<Response>): Promise<Deck | string> {
    try {
        const answer = await readAnswer(await ask());
        if (!answer.ok) return answer.error;
        return readAs(deckShape, answer.body) ?? 'deck';
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}

/**
 * The deck a reference names as the deck route answers it for a page with no store (the print and
 * audience routes): the deck, or what the request failed with.
 */
export function readDeck(ref: DeckRef, token: string): Promise<Deck | string> {
    const query = new URLSearchParams({ root: ref.root, path: ref.path });
    return deckOf(() =>
        fetch(`/api/deck?${query.toString()}`, { headers: { 'x-oculus-token': token } })
    );
}

export function createPresent(
    entities: EntitiesStore,
    queries: Queries,
    token: () => string,
    roots: () => FsRoot[],
    primary: () => string | null
): PresentStore {
    const heard: Record<string, number | undefined> = {};

    /**
     * Whether a `files` message concerns one held deck: it names the deck's folder, or the folder
     * of a file a slide is read from. A deck whose root the page has no directory for cannot be
     * placed, so it is concerned.
     */
    function deckConcerned(
        held: { ref: DeckRef; data: DeckAnswer | undefined },
        root: string,
        folders: string[] | undefined
    ): boolean {
        const dirOf = (key: string): string | undefined =>
            roots().find((one) => one.key === key)?.dir;
        const base = dirOf(held.ref.root);
        if (base === undefined) return true;
        if (folderNamed(root, folders, joinPath(base, held.ref.path))) return true;
        for (const slide of held.data?.deck?.slides ?? []) {
            const from = slide.source;
            const dir = from === undefined ? undefined : dirOf(from.root);
            if (from !== undefined && dir !== undefined) {
                if (filesNamed(root, folders, joinPath(dir, from.path))) return true;
            }
        }
        return false;
    }

    entities.afterReceive((message) => {
        if (!['files', 'portfolio', 'config'].includes(message.channel)) return;
        const before = heard[message.channel];
        if (message.version === before) return;
        const gap = before === undefined || message.version !== before + 1;
        heard[message.channel] = message.version;
        if (message.channel !== 'files' || gap) {
            queries.mark([KIND], 'wait');
            return;
        }
        const payload = entities.payloadOf(message, 'files');
        if (payload === null) {
            queries.mark([KIND], 'wait');
            return;
        }
        if (payload.root === '') return;
        for (const one of queries.entries<DeckAnswer>([KIND])) {
            const [, root, path] = one.key;
            const ref = { root: String(root), path: String(path) };
            if (deckConcerned({ ref, data: one.data }, payload.root, payload.folders)) {
                queries.mark(one.key, 'wait');
            }
        }
    });

    /** The deck a reference names. The first call asks the server; what is held keeps showing. */
    function deck(ref: DeckRef): DeckAnswer {
        if (ref.root === '') return NOTHING;
        // There is no fetch while the page is rendered on the server, and nothing to show there
        // either: the deck stays pending and the browser asks for it on the first client render.
        const { data } = queries.read([KIND, ref.root, ref.path], () => load(ref), {
            enabled: typeof fetch === 'function'
        });
        return data ?? PENDING;
    }

    /** The saved deck's answer, which the query holds; the measures follow it as it arrives. */
    async function load(ref: DeckRef): Promise<DeckAnswer> {
        const query = new URLSearchParams({ root: ref.root, path: ref.path });
        const answer = await answered(() =>
            fetch(`/api/deck?${query.toString()}`, { headers: { 'x-oculus-token': token() } })
        );
        if (answer.deck !== null) prune(answer.deck);
        return answer;
    }

    function drawn(ref: DeckRef, drafts: DeckDraft[]): Promise<DeckAnswer> {
        return answered(() =>
            fetch('/api/deck', {
                method: 'POST',
                headers: { 'x-oculus-token': token(), 'content-type': 'application/json' },
                body: JSON.stringify({ root: ref.root, path: ref.path, drafts })
            })
        );
    }

    /** The deck a request answers, or what it failed with. */
    async function answered(ask: () => Promise<Response>): Promise<DeckAnswer> {
        const held = await deckOf(ask);
        if (typeof held === 'string') return { deck: null, error: held, loading: false };
        return { deck: held, error: '', loading: false };
    }

    /**
     * The slides measured too tall, one per deck and slide, keyed by the deck's root, its folder
     * and the slide's key: two Stages drawing one slide of one deck share an entry, and one slide
     * drawn in two decks has one in each.
     */
    const tall = new SvelteMap<string, TooTall>();

    /** The key of a slide of a deck in `tall`. */
    function tallKey(deck: Deck, key: string): string {
        return JSON.stringify([deck.root, deck.path, key]);
    }

    /** The deck each pane draws, by the pane's instance id. */
    const drawnBy = new Map<string, Deck>();

    /** Whether a deck is the one a measure was taken in and holds its slide. */
    function holds(deck: Deck | null | undefined, one: TooTall): boolean {
        return (
            deck?.root === one.root &&
            deck.path === one.path &&
            deck.slides.some((row) => row.key === one.key)
        );
    }

    /**
     * Drop the measures of the slides that neither the saved deck nor any pane's deck holds.
     * `saved` is a saved deck's answer that is arriving, which the query does not hold yet.
     */
    function prune(saved: Deck | null): void {
        for (const [key, one] of tall) {
            const savedDeck =
                saved?.root === one.root && saved.path === one.path
                    ? saved
                    : queries.peek<DeckAnswer>([KIND, one.root, one.path]).data?.deck;
            if (holds(savedDeck, one)) continue;
            if ([...drawnBy.values()].some((deck) => holds(deck, one))) continue;
            tall.delete(key);
        }
    }

    function drawing(pane: string, deck: Deck | null): void {
        if (deck === null) drawnBy.delete(pane);
        else drawnBy.set(pane, deck);
        prune(null);
    }

    function measured(deck: Deck, row: DeckSlide, over: number): void {
        const key = tallKey(deck, row.key);
        if (over <= TOO_TALL_PX) {
            tall.delete(key);
            return;
        }
        const message = t(
            'findings.deck.too_tall',
            row.title,
            String(over),
            String(deck.frame.width),
            String(deck.frame.height)
        );
        const next = {
            root: deck.root,
            path: deck.path,
            key: row.key,
            source: row.source,
            message
        };
        if (JSON.stringify(tall.get(key)) !== JSON.stringify(next)) tall.set(key, next);
    }

    /** The findings of the slides too tall whose source file's root the page knows. */
    const tallFindings = $derived(
        [...tall.values()].flatMap((one): Finding[] => {
            const dir = one.source === undefined ? undefined : rootDir(one.source.root);
            if (one.source === undefined || dir === undefined) return [];
            const file = joinPath(dir, one.source.path);
            return [{ file, key: one.key, line: one.source.line, message: one.message }];
        })
    );

    function rootDir(key: string): string | undefined {
        return roots().find((one) => one.key === key)?.dir;
    }

    const path = $derived(str(entities.config()?.config.portfolio_deck) ?? '');
    const portfolio = $derived.by<DeckRef | null>(() => {
        const root = primary();
        return path === '' || root === null ? null : { root, path };
    });
    const projectDecks = $derived(
        Object.values(entities.portfolio()?.entities.projects ?? {})
            .flatMap((project) =>
                project.deck === undefined
                    ? []
                    : [
                          {
                              ref: { root: placeOf(project).root, path: project.deck },
                              id: project.id,
                              title:
                                  (project.short ?? '') === ''
                                      ? project.title
                                      : (project.short ?? '')
                          }
                      ]
            )
            .sort((left, right) => left.title.localeCompare(right.title))
    );

    function shown(ref: DeckRef): DeckRef | null {
        return ref.root === '' ? portfolio : ref;
    }

    /** The frame of the deck as saved, the answer `deck` holds, or null while none is held. */
    function savedFrame(ref: DeckRef): DeckFrame | null {
        return queries.peek<DeckAnswer>([KIND, ref.root, ref.path]).data?.deck?.frame ?? null;
    }

    return {
        measured,
        drawing,
        tooTall: (deck, key) => tall.get(tallKey(deck, key))?.message ?? '',
        findings: () => tallFindings,
        portfolio: () => portfolio,
        projectDecks: () => projectDecks,
        shown,
        deck,
        drawn,
        presenting: createPresenting(savedFrame)
    };
}

/**
 * The page's presentations, one per pane that presents. `frameOf` is the frame of a deck as saved,
 * which the audience window draws and so opens at.
 */
function createPresenting(frameOf: (ref: DeckRef) => DeckFrame | null): Presenting {
    const lives = new Map<string, Held>();
    const timers = new SvelteMap<string, Timer>();
    let listening = false;

    /**
     * Let go of a presentation. It tells the audience window what `announce` names, and frees the
     * lock.
     */
    function finish(
        instance: string,
        held: Held,
        announce: 'end' | 'left' | null,
        unlock: boolean
    ): void {
        if (lives.get(instance) !== held) return;
        lives.delete(instance);
        timers.delete(instance);
        held.ended = true;
        if (held.returning !== null) clearTimeout(held.returning);
        if (announce !== null) held.channel.postMessage({ kind: announce });
        held.channel.close();
        held.stop();
        if (unlock) held.unlock?.();
    }

    function end(instance: string): void {
        const held = lives.get(instance);
        if (held !== undefined) finish(instance, held, 'end', true);
    }

    /** The page is going away: the audience window is told, and left open to say so. */
    function leave(instance: string): void {
        const held = lives.get(instance);
        if (held !== undefined) finish(instance, held, 'left', true);
    }

    /** What the audience window says: it opened, its reader moved, it closed. */
    function hear(instance: string, held: Held, data: unknown): void {
        const message = parseMessage(data);
        if (message === null || held.ended) return;
        if (message.kind === 'opened') {
            held.heard = true;
            if (held.returning !== null) clearTimeout(held.returning);
            held.returning = null;
            held.channel.postMessage({ kind: 'slide', key: held.link.current() });
        } else if (message.kind === 'move') held.link.show(message.key);
        else if (message.kind === 'closed' && held.heard && held.returning === null) {
            held.returning = setTimeout(() => end(instance), RETURN_WAIT_MS);
        }
    }

    /** The audience window of a presentation, brought back or opened again. */
    function raise(held: Held): void {
        if (held.audience !== null && !held.audience.closed) held.audience.focus();
        else {
            held.audience = window.open(
                audienceAddress(held.ref),
                presentName(held.ref),
                audienceFeatures(frameOf(held.ref))
            );
        }
    }

    /**
     * Take the lock of the deck's presentation from whoever holds it, and keep it until the
     * presentation ends. The audience window asks for the same lock and is granted it only when it
     * is free, so it learns the presenter screen is gone from a reload or a crash too.
     */
    function hold(instance: string, held: Held): void {
        const name = presentName(held.ref);
        const keep = (): Promise<void> =>
            new Promise((release) => {
                if (held.ended) release();
                else held.unlock = release;
            });
        // A lock taken from this one by another presenter screen leaves the audience window with
        // that screen, so this presentation ends without telling it.
        navigator.locks
            .request(name, { steal: true }, keep)
            .catch(() => finish(instance, held, null, false));
    }

    function start(instance: string, ref: DeckRef, link: PresentLink): void {
        const open = lives.get(instance);
        if (open !== undefined) {
            raise(open);
            return;
        }
        const name = presentName(ref);
        const held: Held = {
            ref,
            link,
            channel: new BroadcastChannel(name),
            audience: null,
            heard: false,
            returning: null,
            unlock: null,
            stop: () => undefined,
            ended: false
        };
        // The lock is taken before any other holder lets go, since the audience window's request is
        // queued ahead of this one and would be granted the lock a release left free.
        hold(instance, held);
        for (const [other, previous] of lives) {
            if (presentName(previous.ref) !== name) continue;
            held.audience = previous.audience;
            held.heard = previous.heard;
            finish(other, previous, null, false);
        }
        held.channel.onmessage = (event: MessageEvent<unknown>) => hear(instance, held, event.data);
        lives.set(instance, held);
        timers.set(instance, startedTimer(Date.now()));
        held.stop = $effect.root(() => {
            $effect(() => {
                if (!link.held()) end(instance);
            });
        });
        if (!listening) {
            listening = true;
            window.addEventListener('pagehide', () => [...lives.keys()].forEach(leave));
        }
        raise(held);
    }

    /** Change the pane's timer by `change`, when the pane presents. */
    function retime(instance: string, change: (timer: Timer, now: number) => Timer): void {
        const timer = timers.get(instance);
        if (timer !== undefined) timers.set(instance, change(timer, Date.now()));
    }

    return {
        on: (instance) => timers.has(instance),
        timer: (instance) => timers.get(instance) ?? null,
        start,
        end,
        send: (instance, key) => lives.get(instance)?.channel.postMessage({ kind: 'slide', key }),
        changed: (instance) => lives.get(instance)?.channel.postMessage({ kind: 'changed' }),
        pause: (instance) => retime(instance, pausedTimer),
        resume: (instance) => retime(instance, resumedTimer),
        reset: (instance) => retime(instance, resetTimer)
    };
}
