# The demo hub

A synthetic research hub: eleven projects over the six tiers, the five registries they point into, the eight collection files, the feeds and the career file. Nothing in it is real, so it is safe to serve, to write to and to copy as the starting point for a hub of your own. Point `hub:` in `tools/oculus/config/local.yml` at this folder and oculus runs over it; a run that must leave the checkout's own configuration alone copies `config/` somewhere else, puts its `local.yml` in the copy, and starts the server with `--engine <that directory>`.

`tests/data/demo-hub.test.ts` builds the portfolio over this folder and asserts zero findings and the counts it holds, so a value that oculus's reader rejects is caught by `npm test`.
