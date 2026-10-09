// Layer 2, server. What the Markdown server needs of a root beyond its program: nothing to choose
// and nothing to approve. Its settings are fixed (settings.ts) and the files it reads come through
// the requests it makes of its client (requests.ts).

import { NO_APPROVAL, NO_CHOICE, prepareBare } from '../../choices.ts';
import type { Adapter } from '../../servers.ts';

export const markdownAdapter: Adapter = {
    prepare(entry, env) {
        return prepareBare(entry, env);
    },

    ...NO_CHOICE,
    ...NO_APPROVAL
};
