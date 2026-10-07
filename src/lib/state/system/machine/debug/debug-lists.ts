// Layer 2, client state. The lists the reader keeps for the debugger: the breakpoints of each file,
// the function breakpoints and the watch expressions. Each list is read from the saved record the
// store holds and changed by writing a new record through `keep`; during a session each change is
// posted to the server too, so the adapter holds what the page shows.
//
// A breakpoint is drawn by what the adapter answered for it: held, not yet held, or turned off by
// the reader. With no session every enabled breakpoint is drawn held, since nothing has refused it.

import type { DebugPayload } from '../../../../data/model/index.ts';
import type { TokenSource } from '../../../shared/stores/token-post.ts';
import { postDebug, type DebugAnswer } from './debug-io.ts';
import {
    enabledLines,
    messageOf,
    movedTo,
    stateOf,
    toggled,
    type Marker,
    type MarkerState,
    type Point,
    type SavedDebug
} from './debug.ts';

/** What the lists read and write of the store. */
export type ListsDeps = {
    saved: () => SavedDebug;
    keep: (saved: SavedDebug) => void;
    active: () => boolean;
    paused: () => boolean;
    payload: () => DebugPayload;
    writes: TokenSource;
};

/** One breakpoint of the Breakpoints section. */
export type BreakpointRow = {
    path: string;
    line: number;
    enabled: boolean;
    state: MarkerState;
    message: string;
};

export function createLists(deps: ListsDeps) {
    const { keep, active, paused, payload, writes } = deps;
    const held = {
        get saved() {
            return deps.saved();
        }
    };

    const pointsOf = (path: string): Point[] => held.saved.breakpoints[path] ?? [];

    function postFile(path: string): Promise<DebugAnswer> {
        return postDebug(
            { action: 'breakpoints', path, lines: enabledLines(pointsOf(path)) },
            writes
        );
    }

    function setPoints(path: string, points: Point[]): void {
        const { [path]: _gone, ...rest } = held.saved.breakpoints;
        keep({
            ...held.saved,
            breakpoints: points.length === 0 ? rest : { ...rest, [path]: points }
        });
        if (active()) void postFile(path);
    }

    function answersOf(path: string): DebugPayload['breakpoints'][number]['breakpoints'] | null {
        if (!active()) return null;
        return payload().breakpoints.find((file) => file.path === path)?.breakpoints ?? [];
    }

    function markers(path: string): Marker[] {
        const answers = answersOf(path);
        return pointsOf(path).map((one) => ({ line: one.line, state: stateOf(one, answers) }));
    }

    function rows(): BreakpointRow[] {
        return Object.keys(held.saved.breakpoints)
            .sort()
            .flatMap((path) => {
                const answers = answersOf(path);
                return pointsOf(path).map((one) => ({
                    path,
                    line: one.line,
                    enabled: one.enabled,
                    state: stateOf(one, answers),
                    message: answers === null ? '' : messageOf(one, answers)
                }));
            });
    }

    const toggle = (path: string, line: number): void =>
        setPoints(path, toggled(pointsOf(path), line));
    const moved = (path: string, lines: number[]): void =>
        setPoints(path, movedTo(pointsOf(path), lines));
    const remove = (path: string, line: number): void =>
        setPoints(
            path,
            pointsOf(path).filter((one) => one.line !== line)
        );

    function enable(path: string, line: number, enabled: boolean): void {
        setPoints(
            path,
            pointsOf(path).map((one) => (one.line === line ? { ...one, enabled } : one))
        );
    }

    function setAll(enabled: boolean): void {
        const next: Record<string, Point[]> = {};
        for (const [path, points] of Object.entries(held.saved.breakpoints)) {
            next[path] = points.map((one) => ({ ...one, enabled }));
        }
        keep({ ...held.saved, breakpoints: next });
        if (active()) for (const path of Object.keys(next)) void postFile(path);
    }

    function removeAll(): void {
        const paths = Object.keys(held.saved.breakpoints);
        keep({ ...held.saved, breakpoints: {} });
        if (active()) for (const path of paths) void postFile(path);
    }

    function setFunctions(names: string[]): void {
        keep({ ...held.saved, functions: names });
        if (active()) void postDebug({ action: 'functions', names }, writes);
    }

    function addFunction(name: string): void {
        const wanted = name.trim();
        if (wanted === '' || held.saved.functions.includes(wanted)) return;
        setFunctions([...held.saved.functions, wanted]);
    }

    function functionRows(): { name: string; state: MarkerState; message: string }[] {
        const answers = payload().functions;
        return held.saved.functions.map((name) => {
            const found = answers.find((one) => one.name === name);
            const state = !active() || found?.verified === true ? 'verified' : 'unverified';
            return { name, state, message: found?.message ?? '' };
        });
    }

    function setWatch(expressions: string[]): void {
        keep({ ...held.saved, watch: expressions });
        if (active()) void postDebug({ action: 'watch', expressions }, writes);
    }

    const addWatch = (expression: string): void => {
        if (expression.trim() !== '') setWatch([...held.saved.watch, expression.trim()]);
    };
    const editWatch = (at: number, expression: string): void => {
        const wanted = expression.trim();
        if (wanted === '') setWatch(held.saved.watch.filter((_, index) => index !== at));
        else setWatch(held.saved.watch.map((one, index) => (index === at ? wanted : one)));
    };
    const removeWatch = (at: number): void =>
        setWatch(held.saved.watch.filter((_, index) => index !== at));

    /** The watch rows: each expression with its value at the last stop, absent while running. */
    function watchRows(): { expression: string; value?: string; error?: string }[] {
        const stopped = paused() ? payload().watch : [];
        return held.saved.watch.map((expression, at) => stopped.at(at) ?? { expression });
    }

    return {
        markers,
        rows,
        toggle,
        moved,
        remove,
        enable,
        setAll,
        removeAll,
        functionRows,
        addFunction,
        removeFunction: (name: string) =>
            setFunctions(held.saved.functions.filter((one) => one !== name)),
        watchRows,
        addWatch,
        editWatch,
        removeWatch,
        removeAllWatch: () => setWatch([])
    };
}
