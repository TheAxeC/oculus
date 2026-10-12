// Layer 1, data. One repository of the reader's GitHub account, as the server lists it with `gh`
// and the client offers it to clone: the fields the manifest's `repository:` block keeps.

/** One repository of the account, as the manifest's `repository:` block holds it. */
export type GithubRepo = {
    name: string;
    url: string;
    visibility: string;
    description: string;
    homepage: string;
    topics: string[];
    /** The creation date, `YYYY-MM-DD`. */
    date: string;
};

/** The account's repositories, or the sentence that says why they could not be listed. */
export type GithubListing = { ok: true; repos: GithubRepo[] } | { ok: false; error: string };
