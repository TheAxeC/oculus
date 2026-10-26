import {
    glyphCatalog,
    textCatalog,
    unplacedGroup,
    vocabCatalog,
    workspaceCollectionViews
} from '$lib/data/sources/config';
import { vscodeRuleIds } from '$lib/data/places/code-rules';
import { platformText } from '$lib/data/places/platform';
import { pageStateRead } from '$lib/server/files/workspace/page-state/routes';
import { payloadOf } from '$lib/server/machine/apps/read/held';
import { firstAppThemes } from '$lib/server/machine/apps/routes/theme';
import { configSeed } from '$lib/server/root/config-seed';
import type { PageServerLoad } from './$types';

// The catalog, the glyph vocabulary of names and ASCII stand-ins, and the tone vocabulary are read
// per request and shipped as page data, which is what the first frame draws from; every later
// change reaches the page on the `config` channel server/root/watch/portfolio/portfolio.ts
// publishes. The read is the request's one read, which hooks.server.ts holds on `locals.config` for
// whatever in the request asks, and which says its findings once. The page's HTML, its title and
// the theme it starts on, comes from a request of its own, which reads the config the same way.
//
// The icon drawings are the exception: they are files rather than config keys, so the server reads
// them once when its context is built and again on every config push, and this hands the page what
// is held rather than reading a hundred files per request. The host the status bar names is held
// the same way: the server context builds it once, and this reads it off `locals.server`.
//
// The whole configuration of the same read rides with them as the seed of the page's `config`
// channel, with the newest push version the read is at least as new as (server/root/config-seed.ts
// says why), so the push the hub replays from before a config change does not replace it.
//
// The vocabulary of every hub of the workspace rides with them, so the first frame draws a record
// of any hub in its own hub's words.
//
// The classes a VS Code code theme may name ride with them and in the seed, the keys of the
// TextMate rules this checkout ships (data/places/code-rules.ts), which the page cannot read; so do
// the files of the colour themes of apps the `theme` and `app_theme` options name, read as GET
// /api/app-theme reads them (server/machine/apps/routes/theme.ts, `firstAppThemes`), which the page
// hands its workbench, so a page whose theme is an app's makes its first draw from the file instead
// of waiting for that route. The page's first HTML is sent with the same theme already drawn
// (hooks.server.ts), and that first draw keeps it.
//
// The collection views ride with them for the same reason, each with the place, label and glyph
// its entry gives: the page registers the collection view once per key before it renders, and the
// registry is filled in the page's script body rather than from a fetch, so the view catalogue and
// the pane tabs draw every collection on the first frame.
//
// The apps ride with them too, the held rows and findings and the apps folders, with the version of
// the `apps` channel they are at least as new as, so the registry holds the apps' views before the
// first frame and the socket's replay is taken only above that version.
//
// The page state of this machine rides with them too, each workspace's arrangement, the view states
// and the debugger's record from the state folder, with the version of the `state` channel the read
// is at least as new as, so the arrangement is drawn from it on the first frame and the socket's
// replay is taken only above that version.
//
// The write token rides with them, which is how the auth rule delivers it to the page: it is
// minted by ServerContext, put on the event by hooks.server.ts, and reaches the browser here and
// nowhere else. invalidateAll() runs this load again, which is how a page that met a 403 gets the
// token a restarted server minted.
export const load: PageServerLoad = ({ locals }) => {
    const read = locals.config();
    const { config } = read;
    const text = platformText(textCatalog(config));
    const icons = locals.server.icons.set;
    const hubs = locals.server.configCache.vocab();
    const codeThemeClasses = vscodeRuleIds();
    return {
        text,
        glyphs: glyphCatalog(config),
        icons,
        vocab: vocabCatalog(config),
        hubs,
        codeThemeClasses,
        appThemes: firstAppThemes(locals.server.apps.held(), config),
        collections: workspaceCollectionViews(config, hubs, unplacedGroup(config)),
        seed: configSeed(locals.server.hub, read, {
            hubs,
            text,
            icons,
            codeThemeClasses,
            host: locals.server.host
        }),
        apps: {
            ...payloadOf(locals.server.apps.held()),
            version: locals.server.hub.version('apps')
        },
        pageState: pageStateRead(
            locals.server.workspace.stateFolder,
            textCatalog(config),
            locals.server.hub
        ),
        token: locals.token
    };
};
