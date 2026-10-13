// Layer 2, server. The language servers the apps' hosts registered, handed to the language server
// relay. The relay is made before the hosts, and the hosts start after the server listens, so the
// feed is made first and attached to the tools of the hosts once they exist: until then it lists no
// server and no collection, and the listeners the relay added are kept for the tools. The tools
// also give the schema feed the JSON schemas of the acting apps, asked again whenever they change.

import type { AppServersFeed, CollectionHeard } from '../../../machine/lsp/relay/relay-apps.ts';
import type { AppTools } from '../../../machine/apps/tools/registry.ts';
import type { SchemaFeed } from '../../../machine/lsp/schema-feed.ts';

/** A feed for the relay, and the call that attaches the tools to it. */
export function appFeed(): {
    feed: AppServersFeed;
    attach: (tools: AppTools, schemas: SchemaFeed) => void;
} {
    let tools: AppTools | null = null;
    const changes = new Set<() => void>();
    const diagnostics = new Set<(heard: CollectionHeard) => void>();
    const feed: AppServersFeed = {
        servers: () => tools?.servers() ?? [],
        open: (server, root) => {
            if (tools === null) return Promise.reject(new Error('the hosts are not running'));
            return tools.open(server as ReturnType<AppTools['servers']>[number], root);
        },
        configuration: (app, section) => tools?.configuration(app, section) ?? null,
        languages: () => tools?.languages() ?? new Map(),
        onChange: (listener) => {
            changes.add(listener);
            return () => changes.delete(listener);
        },
        collections: () => tools?.collections() ?? [],
        onDiagnostics: (listener) => {
            diagnostics.add(listener);
            return () => diagnostics.delete(listener);
        }
    };
    return {
        feed,
        attach: (made, schemas) => {
            tools = made;
            schemas.attachApps(() => made.schemas());
            made.onChange(() => {
                schemas.refresh();
                for (const listener of [...changes]) listener();
            });
            made.onDiagnostics((heard) => {
                for (const listener of [...diagnostics]) listener(heard);
            });
        }
    };
}
