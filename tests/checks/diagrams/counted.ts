// Layer 4, test helper. A module's exports with one of its functions wrapped in vi.fn() around the
// real one, for a vi.mock() factory: the wrapped function answers as before and records its calls,
// so a case sees which files a parser was handed. It imports nothing of the modules it wraps, since
// a factory loads it while the module it mocks is still being made.

import { vi } from 'vitest';

/** The exports of `real` with `name` replaced by a recording wrapper of the same function. */
export function counted(real: Record<string, unknown>, name: string): Record<string, unknown> {
    return { ...real, [name]: vi.fn(real[name] as (...args: unknown[]) => unknown) };
}
