// Layer 3, shell. A page's end of the desktop app's menu, called once from the workbench's script
// body: every window's page answers the commands the host sends it (window/menu-answer.ts), and
// the main window's page hands the host the recent workspaces of the open workspace for Open
// Recent whenever that list changes, each with its words and whether its file is gone, as
// `:workspace` lists them. Nothing is done in a browser, whose client holds no bridge.

import type { ClientState } from '$lib/state/client/context';
import { workspaceChoicesOf } from '$lib/state/workbench/palette';
import { answerMenu, menuPage, type MenuDeps } from './menu-answer';

export function useMenuCommands(client: ClientState, deps: MenuDeps): void {
    const { desktop } = client;
    if (desktop === undefined) return;
    const { bridge, float } = desktop;
    const page = menuPage(client, deps);

    $effect(() => bridge.on('command', (name, argument) => void answerMenu(page, name, argument)));
    if (float !== null) return;

    /** The list sent last, so a read of the workspaces that changes no entry sends nothing. */
    let sent = '';
    $effect(() => {
        const saved = client.fs.workspaces();
        const entries = workspaceChoicesOf('', { ...saved, available: [] }).map(
            ({ path, label, missing }) => ({ path, label, missing })
        );
        const text = JSON.stringify(entries);
        if (text === sent) return;
        sent = text;
        bridge.recentWorkspaces(entries);
    });
}
