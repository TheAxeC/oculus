// What a synthetic portfolio holds for the two entities that are summaries of one file each rather
// than maps keyed by id. A fixture tree has none of the four generated feeds on it and no career
// file, so both are the empty answer; a test that is about them says so by overriding these.

import type { Career, Feeds } from '../src/lib/data/model.ts';

/** No feed file on this hub, which is not the same answer as a feed with nothing in it. */
export const NO_FEEDS: Feeds = {
    inbox: null,
    leads: null,
    radar: null,
    scout: null,
    linkedin: null
};

/** No career file on this hub. */
export const NO_CAREER: Career | null = null;
