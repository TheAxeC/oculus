// Layer 4, test helper. The two loads of oculus's configuration that every write target of the
// tests is made over: the engine's folder under no hub's settings, and under the demo hub's.
//
// Neither changes while a test file runs: no test writes the engine's config folder (a case that
// edits a config file edits a scratch copy of it) or the demo hub. A load parses every file of the
// folder, which is most of what a case over a write target costs, so each load is made once, when
// a test file first imports this module, and every caller is handed a copy of its own, which a case
// may change without reaching another case. The loads are deep-frozen, so a change that reached
// one would throw rather than leak into a later case. A load over another hub is handed the
// engine's parses, so it parses no file of the engine's folder again.

import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { DEMO_HUB } from './real-hub.ts';

/** A value with every map and list in it frozen, the value itself among them. */
function deepFreeze<T>(value: T): T {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const inner of Object.values(value)) deepFreeze(inner);
    }
    return value;
}

const ENGINE = deepFreeze(loadConfig(engineDir()));

const DEMO = deepFreeze(loadConfig(engineDir(), { hub: DEMO_HUB, parses: ENGINE.parses }));

/** A copy of the engine's configuration under no hub's settings, as `loadConfig` merges it. */
export function engineConfigCopy(): Record<string, unknown> {
    return structuredClone(ENGINE.config);
}

/** A copy of the engine's configuration under the demo hub's settings. */
export function demoConfigCopy(): Record<string, unknown> {
    return structuredClone(DEMO.config);
}

/** The parses of the engine's load, frozen, which a load over another hub is handed. */
export function engineParses(): ReturnType<typeof loadConfig>['parses'] {
    return ENGINE.parses;
}
