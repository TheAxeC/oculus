// Layer 2, client state. The linters' shared vocabulary as the layers above state read it: the ids,
// the states, the rows, the fixes and the configuration the lint route answers, which are declared
// in data/model and re-exported here because views and the shell may import state modules but not
// data/model. `webAddress` is the check a documentation address passes before the page opens it.

export { webAddress } from '../../../../data/hub-address.ts';
export { LINT_IDS } from '../../../../data/model/index.ts';
export type { LintConfig, LintEdit, LintFix, LintId } from '../../../../data/model/index.ts';
