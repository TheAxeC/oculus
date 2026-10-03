// Layer 4, test helper. The private tmux server of `tmux-server.ts`, and the one constant that
// probes tmux when this module loads.
//
// `tests/state/sessions/terminal/commands-pane.test.ts` imports from here. A file under
// tests/server imports `tmux-server.ts` instead, so that loading it starts no process.

import { programRuns } from './tmux-server.ts';

export { privateTmux, watchEnds, type PrivateTmux } from './tmux-server.ts';

/** Whether tmux answers at all; without it the suite skips its cases and says why. */
export const TMUX = programRuns('tmux', ['-V']);
