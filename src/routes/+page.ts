import { installPageConfig } from '$lib/state/shared/page/install';
import type { PageLoad } from './$types';

// The catalog, the glyph names with their ASCII stand-ins, the tone vocabulary and the appearance
// the server read are installed before the page renders, so a component can call t(), glyph(),
// toneOf() and themes() while it initialises. Every later change reaches the page as a push on the
// `config` channel instead.
//
// The collection keys are not installed anywhere: they are handed to the page, which registers one
// view per key in the registry of the client it builds. The seed of the `config` channel is handed
// on the same way, since the channel belongs to that client's socket; so are the apps the server
// holds, which the page seeds its `apps` channel and registers the apps' views from, and so is the
// page state of this machine, which the page's client holds the arrangement and the view states in.
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
        seed: data.seed,
        apps: data.apps,
        pageState: data.pageState,
        token: data.token
    };
};
