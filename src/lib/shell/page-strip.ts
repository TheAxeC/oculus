// Layer 3, shell. The page strip's contract: one named arrangement of config/layout.yml, its key,
// the words a page of it carries, and its tree.

/** One named arrangement of config/layout.yml: its key, the words a page of it carries, and its tree. */
export type Arrangement = { name: string; label: string; node: unknown };
