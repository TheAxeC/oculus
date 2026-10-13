// Layer 2, server. The breakpoints a debug session holds, as the adapter last answered them: for
// each file the lines asked for with whether the adapter verified each, and the function
// breakpoints the same way. The adapter answers a breakpoint with `verified: false` and a reason
// until the module holds it; its later `breakpoint` event, or a stop that names the breakpoint's id
// by `hitBreakpointIds`, verifies it.
// The ids are the adapter's and stay here; the published state carries lines, names and answers.

import type {
    DebugBreakpointSpec,
    DebugFileBreakpoints,
    DebugFunctionBreakpoint
} from '../../../data/model/index.ts';
import type { BreakpointAnswers } from './shapes.ts';

type Held = { id: number | null; verified: boolean; message: string };
type Extras = { condition: string; hitCondition: string };
type HeldLine = Held & Extras & { line: number; logMessage: string };
type HeldName = Held & Extras & { name: string };

/** A function breakpoint as the page holds it. */
type NameSpec = { name: string; condition?: string; hitCondition?: string };

export class Breakpoints {
    #files = new Map<string, HeldLine[]>();
    #functions: HeldName[] = [];

    /** Forget every breakpoint, as a new session and an ended one do. */
    clear(): void {
        this.#files = new Map();
        this.#functions = [];
    }

    /**
     * Hold the lines of one file with the adapter's answers; no lines hold nothing for it. A line
     * the adapter already verified, by an answer or by stopping at it, stays verified when the
     * file's lines are sent again, since the adapter answers a resent line as pending.
     */
    setFile(path: string, specs: DebugBreakpointSpec[], answers: BreakpointAnswers): void {
        if (specs.length === 0) {
            this.#files.delete(path);
            return;
        }
        const verified = new Set(
            (this.#files.get(path) ?? []).filter((one) => one.verified).map((one) => one.line)
        );
        this.#files.set(
            path,
            specs.map((spec, at) =>
                keeping(
                    {
                        line: spec.line,
                        condition: spec.condition ?? '',
                        hitCondition: spec.hitCondition ?? '',
                        logMessage: spec.logMessage ?? '',
                        ...answered(answers, at)
                    },
                    verified.has(spec.line)
                )
            )
        );
    }

    /** Hold the function breakpoints with the adapter's answers, keeping the ones verified. */
    setFunctions(specs: NameSpec[], answers: BreakpointAnswers): void {
        const verified = new Set(
            this.#functions.filter((one) => one.verified).map((one) => one.name)
        );
        this.#functions = specs.map((spec, at) =>
            keeping(
                {
                    name: spec.name,
                    condition: spec.condition ?? '',
                    hitCondition: spec.hitCondition ?? '',
                    ...answered(answers, at)
                },
                verified.has(spec.name)
            )
        );
    }

    /** A breakpoint the adapter stopped at is verified, whatever it said when it was set. */
    verifyHit(id: number): void {
        const held: Held[] = [...this.#files.values()].flat();
        for (const one of [...held, ...this.#functions]) {
            if (one.id === id) Object.assign(one, { verified: true, message: '' });
        }
    }

    /**
     * The adapter's later word on a breakpoint, as when a pending one binds once its module loads;
     * a breakpoint verified by a stop stays verified.
     */
    changed(id: number, verified: boolean, message: string): void {
        const held: Held[] = [...this.#files.values()].flat();
        for (const one of [...held, ...this.#functions]) {
            if (one.id !== id || one.verified) continue;
            Object.assign(one, { verified, message: verified ? '' : message });
        }
    }

    files(): DebugFileBreakpoints[] {
        return [...this.#files].map(([path, held]) => ({
            path,
            breakpoints: held.map((one) => ({
                line: one.line,
                verified: one.verified,
                message: one.message,
                condition: one.condition,
                hitCondition: one.hitCondition,
                logMessage: one.logMessage
            }))
        }));
    }

    functions(): DebugFunctionBreakpoint[] {
        return this.#functions.map((one) => ({
            name: one.name,
            verified: one.verified,
            message: one.message,
            condition: one.condition,
            hitCondition: one.hitCondition
        }));
    }
}

/** A held breakpoint, verified when it was before whatever the adapter answers now. */
function keeping<T extends Held>(one: T, wasVerified: boolean): T {
    return wasVerified ? { ...one, verified: true, message: '' } : one;
}

/** The adapter's answer for the breakpoint at an index; unverified when it gave none. */
function answered(answers: BreakpointAnswers, at: number): Held {
    const answer = answers.at(at);
    return {
        id: answer?.id ?? null,
        verified: answer?.verified ?? false,
        message: answer?.message ?? ''
    };
}
