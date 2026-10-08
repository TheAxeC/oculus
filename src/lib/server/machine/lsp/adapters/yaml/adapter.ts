// Layer 2, server. What the YAML server needs of a root beyond its program: nothing to choose and
// nothing to approve. The schemas it checks by are not a setting of the root; they come from the
// latest snapshot build and reach it through the requests it makes of its client (requests.ts).

import { NO_APPROVAL, NO_CHOICE, prepareBare } from '../../choices.ts';
import type { Adapter } from '../../servers.ts';

export const yamlAdapter: Adapter = {
    prepare(entry, env) {
        return prepareBare(entry, env);
    },

    ...NO_CHOICE,
    ...NO_APPROVAL
};
