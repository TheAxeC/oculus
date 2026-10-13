// Layer 2, server. The exception breakpoint filters of a session and what the reader switched on.
// An adapter declares its filters in its answer to `initialize` (a label, whether one is on by
// default, whether it takes a condition). The reader's choice is kept for the next session of the
// same debugger type, so a filter switched on stays on; before any choice the adapter's defaults
// stand.

import type { DebugCapabilities, DebugExceptionFilter } from '../../../../data/model/index.ts';

/** The filters of the current session and the choice per debugger type. */
export class Filters {
    #list: DebugExceptionFilter[] = [];
    readonly #chosen = new Map<string, Map<string, string>>();

    /** The filters as published. */
    list(): DebugExceptionFilter[] {
        return this.#list;
    }

    /** The session ended or a new one starts: no filters until an adapter declares some. */
    clear(): void {
        this.#list = [];
    }

    /**
     * An adapter of a type declared its filters: the reader's earlier choice, else the defaults.
     */
    declare(type: string, declared: DebugCapabilities): void {
        const chosen = this.#chosen.get(type);
        this.#list = declared.exceptionFilters.map((one) => ({
            ...one,
            condition: chosen?.get(one.filter) ?? '',
            enabled: chosen === undefined ? one.enabled : chosen.has(one.filter)
        }));
    }

    /** The reader switched the filters named on, each with its condition, and the rest off. */
    choose(type: string, on: { filter: string; condition?: string }[]): void {
        const chosen = new Map(on.map((one) => [one.filter, one.condition ?? '']));
        this.#chosen.set(type, chosen);
        this.#list = this.#list.map((one) => ({
            ...one,
            enabled: chosen.has(one.filter),
            condition: one.supportsCondition ? (chosen.get(one.filter) ?? '') : ''
        }));
    }

    /** The body of `setExceptionBreakpoints` for the filters that are on. */
    body(): { filters: string[]; filterOptions?: { filterId: string; condition: string }[] } {
        const on = this.#list.filter((one) => one.enabled);
        const options = on
            .filter((one) => one.supportsCondition && one.condition !== '')
            .map((one) => ({ filterId: one.filter, condition: one.condition }));
        return {
            filters: on.map((one) => one.filter),
            ...(options.length === 0 ? {} : { filterOptions: options })
        };
    }
}
