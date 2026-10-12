// The file browser's endpoint. A route module may export only its verbs, so everything it does
// lives in lib/server/files/fs.ts and this is the few lines that join them. The GET lists one
// directory, or the open workspace when it names no root, and is same-origin only; the POST saves
// or switches the workspace, writes the notes and carries the token ServerContext minted, as with
// /api/write, /api/git and /api/deposit.
//
// The workspace, the machine's values and the write chain come off the ServerContext, which holds
// the workspace and the values and reads them again only when a file of theirs changed, so a
// request reads no workspace file. The bookmarks and the notes are kept in the primary hub's
// `.oculus` folder unless its `local.yml` names another place, and a workspace with no primary has
// none.

import { textCatalog } from '$lib/data/sources/config';
import { handleFs, handleFsWrite, type FsTarget } from '$lib/server/files/fs';
import { machineDefaults } from '$lib/server/root/process/context/machine-defaults';
import { machineValues } from '$lib/server/root/process/context/machine-values';
import { perOculus } from '$lib/server/files/workspace/paths';
import type { RequestHandler } from './$types';

const target = (locals: App.Locals): FsTarget => {
    const server = locals.server;
    const open = server.workspace.open();
    const own = perOculus(open.primaryDir, server.machine());
    const set = server.machineSet();
    const lists = server.machineLists();
    const defaults = machineDefaults(textCatalog(locals.config().config));
    return {
        engine: server.engine,
        workspace: { open: () => open, stateFolder: open.stateFolder },
        machine: { set, defaults, ...machineValues(server.machine(), set, defaults, lists) },
        bookmarks: own.bookmarks,
        notes: own.notes,
        writes: server.fsWrites,
        ignored: server.ignoredCache
    };
};

export const GET: RequestHandler = ({ request, locals }) => handleFs(request, target(locals));

export const POST: RequestHandler = async ({ request, locals }) => {
    const answer = await handleFsWrite(request, locals.server.token, target(locals));
    // A switch or a save changed the workspace file or the state; the held workspace is read again.
    locals.server.workspace.changed();
    return answer;
};
