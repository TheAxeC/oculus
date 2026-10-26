// Layer 2, server. The settings of one hub of the open workspace as the Settings view reads them
// for a row with a hub other than the primary chosen: the slice of that hub's merged settings the
// rows of the keys each hub's own file is read for draw (data/sources/config/settings/hub-slice.ts
// `hubSlice`: their values and their options entries, the defaults as that hub's merge left them).
// The merge is the engine's options under the hub's own `.oculus/config.yml`, the parse the server
// keeps per hub (`HubSettings`, server/root/process/config-cache.ts), so a read costs no parse
// while the files are as they were.
//
// A name no hub of the open workspace has, and a hub whose settings file is gone, which is no hub
// any more, are refused with the sentence that the workspace has no hub of that name. The Settings
// view alone reads this: no channel carries it, and an app's frame cannot reach the /api routes.

import type { HubSettings } from '../../../data/index.ts';
import { hubSlice } from '../../../data/sources/config/settings/hub-slice.ts';
import { isHubFolder } from '../../../data/sources/manifests.ts';
import { words } from '../../core/words.ts';

/** The answer of a read: its status and the body the route sends as JSON. */
export type HubSettingsAnswer = { status: number; body: unknown };

/**
 * The slice of the settings of the hub named `name` among the open workspace's hubs, or the refusal
 * (404) of a name no hub of it has. `text` is the catalog the refusal is worded from.
 */
export function hubSettingsAnswer(
    name: string | null,
    open: { hubs: readonly { name: string; dir: string }[] },
    settings: HubSettings,
    text: Record<string, string>
): HubSettingsAnswer {
    const hub = open.hubs.find((one) => one.name === name);
    if (name === null || hub === undefined || !isHubFolder(hub.dir)) {
        const error = words(text, 'server.workspace.no_hub_named', name ?? '');
        return { status: 404, body: { error } };
    }
    return { status: 200, body: { hub: hub.name, config: hubSlice(settings(hub.dir).config) } };
}
