// Layer 2, server. The configuration a page starts from, and which `config` push it may take after
// that. The page's HTML is built from a read of the files made for that request, and the hub holds
// the push the portfolio watcher made at its own last read. For the watcher's debounce after a
// config file changes, the hub's push is the older of the two, and the socket replays it to every
// page that subscribes; a page that installed it would run on the values from before the change
// until the next push. So the page is handed its own read and the newest hub version that read is
// at least as new as, and it takes only a push above that version.
//
// The order is the hub's: a push published before this read has a version at or below the one the
// hub holds now, and every push published after this read has a higher one. When the held push is
// the same configuration as this read, it is the one version below that bound, so the page takes
// it for the findings and the host that only the watcher's read carries. The read itself rides in
// the seed only when the held push is another configuration: in every other case the socket's
// replay brings the same values a moment later, and the page data stays the size it was.

import type { ConfigPayload, Finding, HostInfo } from '../../data/model.ts';
import type { Hub } from './channels.ts';

/**
 * The newest push version a page's read is at least as new as, and the read itself when the hub
 * holds an older configuration than it.
 */
export type ConfigSeed = { payload?: ConfigPayload; through: number };

/**
 * The seed for a page built from `read`. `through` is the hub's held `config` version when the held
 * push is another configuration, one below it when it is the same one, and 0 before any push.
 */
export function configSeed(
    hub: Hub,
    read: { config: Record<string, unknown>; findings: Finding[] },
    parts: { text: Record<string, string>; icons: Record<string, string>; host: HostInfo }
): ConfigSeed {
    const held = hub.latest('config');
    if (held === undefined) return { through: 0 };
    const same =
        JSON.stringify((held.payload as ConfigPayload).config) === JSON.stringify(read.config);
    if (same) return { through: held.version - 1 };
    const payload: ConfigPayload = { config: read.config, findings: read.findings, ...parts };
    return { payload, through: held.version };
}
