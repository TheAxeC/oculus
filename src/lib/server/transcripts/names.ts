// Layer 2, server. The names oculus gives the agent sessions it starts. A tmux session of oculus
// carries `PREFIX`; the hidden session the usage refresher starts carries `USAGE_PREFIX`, and the
// transcript that session leaves names itself with the same prefix, so the transcript readers and
// the tmux readers know a usage run by one constant.

/** Every tmux session oculus owns carries this prefix and nothing else does. */
export const PREFIX = 'oculus-';

/** Hidden Claude usage sessions begin with this full tmux session-name prefix. */
export const USAGE_PREFIX = `${PREFIX}usage-`;
