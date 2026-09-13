// The Node entry. Run it with `node src/server.ts` after `npm run build`; Node 23 strips the
// types itself. The http server, the WebSocket on it, and the watcher that feeds the WebSocket
// are the whole process; vite.config.ts stands up the same three in development.

import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { engineDir, loadConfig, loadLocal } from './lib/data/sources/config.ts';
import type { Snapshot } from './lib/data/model.ts';
import { Hub } from './lib/server/channels.ts';
import { projectFolders } from './lib/server/sessions/index.ts';
import type { ProjectFolder } from './lib/server/sessions/group.ts';
import { bindHookHub } from './lib/server/sessions/hooks.ts';
import { Terminals, bindTerminals } from './lib/server/pty/channel.ts';
import { attachSocket } from './lib/server/socket.ts';
import { bindGitWatcher, watchGit } from './lib/server/watch/git.ts';
import { watchPortfolio } from './lib/server/watch/portfolio.ts';
import { watchSessions } from './lib/server/watch/sessions.ts';
import { bindHpcWatcher, watchHpc } from './lib/server/hpc/poll.ts';
import { watchUsage } from './lib/server/usage/watch.ts';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

const engine = engineDir();
const local = loadLocal(engine);
const slurm = (loadConfig(engine).config.slurm ?? {}) as {
    host: string;
    days: number;
    poll_min: number;
    quota_min: number;
    prewarm: boolean;
};
const usageTiers = (loadConfig(engine).config.usage_tiers ?? {}) as Record<string, string>;

// The specifier is built at run time because build/handler.js exists only after `npm run build`.
const built = new URL('../build/handler.js', import.meta.url).href;
const { handler } = (await import(built)) as { handler: Handler };

const server = createServer(handler);
const hub = new Hub();
// The terminals of O17. Nothing runs until a page attaches to one: the control client is opened at
// the first attach, and until then the only tmux call is the list poll that feeds the sessions
// payload. The bridge is what lets the terminal endpoint, which is in the built app's module graph,
// nudge this list the moment it starts or stops one.
const terminals = new Terminals(hub);
bindTerminals(terminals);
attachSocket(server, hub, { path: '/ws', terminals });
// The built app's routes (routes/api/hook) are a separate module graph from this plain import, so
// binding the real Hub onto the process-wide bridge is what lets a hook republish immediately
// instead of waiting for the sessions watcher's next rescan; see sessions/hooks.ts's own comment.
bindHookHub(hub);
// The first build and the first scan happen here, before the port is open, so the first page to
// connect is answered from memory rather than waiting for a read of the hub or of the transcripts.
const portfolio = watchPortfolio(hub, { hub: local.hub, engine });

/** The project folders of the newest snapshot the portfolio watcher published. */
function folders(): ProjectFolder[] {
    const message = hub.latest('portfolio');
    return message === undefined ? [] : projectFolders(local.hub, message.payload as Snapshot);
}

const sessions = watchSessions(hub, {
    cache: local.sessionsCache,
    overrides: local.sessionsOverrides,
    projectFolders: folders,
    terminals
});
const usage = watchUsage(hub, { accounts: local.accounts, tiers: usageTiers });
// Started after the sessions watcher, so its subscription is answered with the first scan at once.
const git = watchGit(hub);
// The git endpoint is in the built app's module graph, so the bridge is what lets a write re-read
// its own root at once instead of waiting for the watcher's next event.
bindGitWatcher(git);
const hpc = watchHpc(hub, {
    host: local.hpcHost ?? slurm.host,
    days: slurm.days,
    pollMin: slurm.poll_min,
    quotaMin: slurm.quota_min,
    prewarm: slurm.prewarm
});
bindHpcWatcher(hpc);

server.on('close', () => {
    bindHpcWatcher(null);
    hpc.close();
    bindGitWatcher(null);
    git.close();
    usage.close();
    sessions.close();
    portfolio.close();
    bindTerminals(null);
    terminals.close();
});

server.listen(local.port, '127.0.0.1', () => {
    console.log(`oculus on http://127.0.0.1:${local.port} over hub ${local.hub}`);
});
