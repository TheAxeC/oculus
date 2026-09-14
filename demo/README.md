# The demo hub

A synthetic research hub: ten projects over the five tiers, the five registries they point into, the eight collection files, the feeds and the career file. Nothing in it is real, so it is safe to serve, to write to and to copy as the starting point for a hub of your own. Point `hub:` in `tools/oculus/local.yml` at this folder, or set `OCULUS_LOCAL` at a config file that does, and oculus runs over it.

`tests/data/demo-hub.test.ts` builds the portfolio over this folder and asserts zero findings and the counts it holds, so a value that oculus's reader rejects is caught by `npm test`.

The browser specs (`npm run test:browser`) copy this folder to a temporary directory once per run and serve the copy, so the specs write, delete and reorder freely and nothing here is touched.

Two folders are fixtures for what a hub does not hold. `sessions/claude/projects/` is one Claude transcript in the store layout the session layer reads, copied into the run's own home directory so the page has a session to open; `hpc/` is one cluster's answer to the two commands the Live HPC poller runs, which the run's own `ssh` prints instead of opening a connection. Neither is read when oculus serves this folder as an ordinary hub.
