import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The catalog, the glyph names with their ASCII stand-ins, the words of every hub of the workspace
// (state/shared/words/tones.ts) and the appearance the server read are installed before the page
// renders, so a component can call t(), glyph(), toneOf() and themes() while it initialises. Every
// later change reaches the page as a push on the `config` channel instead.
//
// The collection keys are not installed anywhere: they are handed to the page, which registers one
// view per key in the registry of the client it builds; so are the `boards:` map the project board
// views are made from and the catalog their `label:` and `glyph:` words are checked against, which
// the page registers the board views from. The seed of the `config` channel is handed on the same
// way, since the channel belongs to that client's socket; so are the apps the server holds, which
// the page seeds its `apps` channel and registers the apps' views from, and so is the page state of
// this machine, which the page's client holds the arrangement and the view states in.
//
// The files of the app themes the `theme` and `app_theme` options name are handed on the same way:
// the page hands them to its workbench, whose first draw of such a theme is made from them, the
// theme the page's first HTML was sent with (hooks.server.ts).
//
// The write token is handed on rather than installed: it belongs to the client the page builds, and
// the page puts it in that client's write store. This load runs again on invalidateAll(), so the
// token a restarted server minted replaces the stale one without the page being reloaded by hand.
// That second run replaces the four catalogs as well, which is why it raises the configuration's
// generation at the end, after the last setter: a page already drawn then draws again with what
// this installed instead of holding what it loaded with.
export const load: PageLoad = ({ data }) => {
    installPageConfig(data);
    return {
        collections: data.collections,
        boards: data.boards,
        text: data.text,
        seed: data.seed,
        apps: data.apps,
        pageState: data.pageState,
        appThemes: data.appThemes,
        token: data.token
    };
};
