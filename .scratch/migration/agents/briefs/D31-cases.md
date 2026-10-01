# D31, round 0: rulings on the builder's first run

The builder stopped at its first run, before any change outside the tests, and handed back two points. The orchestrator rules on both inside the step's scope; the brief's paths widen by two files. Everything else of the brief stands, and the four test files the builder wrote are kept.

## 1. Case 18, the value "5" (ruled (a))

`writeConfigKey` refuses a value that is not a finite number for a `control: number` entry with `server.config_key.not_number` (`src/lib/server/edit/writes/config-key.ts:164-166`, run at :301-302) before the readers run (:322), as for every number option. Case 18 becomes: -1 and 1.5 are refused with the sentence of item 1; "5" is refused with `why('not_number')`; the file is not written in any of the three; 3 is written. A string that reaches the file by a hand edit is still refused by the reader, through case 7. Not chosen: (b) running the readers before `misfit`, which changes the writer of every option; (c) dropping "5", the lazy option.

## 2. Decision 9, the unattended environment (ruled: the configured ssh command keeps its place)

`GIT_SSH_COMMAND` overrides `core.sshCommand` (`man git-config`, `core.sshCommand`: "is overridden when the environment variable is set"), so setting it to `ssh -o BatchMode=yes` would make every repository that names its own ssh command (a key with `-i`, a jump host) fail on every period. Starting the child detached does not take the terminal away: the orchestrator's probe, a `git fetch` run from Node with `detached: true` and with `detached: false` under a pseudo-terminal (`script -q /dev/null node probe.mjs`), with `core.sshCommand` set to a script that opens `/dev/tty`, printed `tty GIT_TERMINAL_PROMPT=0` for both, so option (c) is falsified.

The ruling, which replaces decision 9 and the env part of item 3:

- The timer's fetch sets `GIT_TERMINAL_PROMPT=0`, which stops git asking for an HTTPS user or password.
- For ssh, it sets `GIT_SSH_COMMAND` to the ssh command git would have used, with ` -o BatchMode=yes` appended, so the repository's own command and options are kept and ssh asks for nothing. The command git would have used is, in git's own order: `GIT_SSH_COMMAND` of the server's environment when set; else the repository's `core.sshCommand` when set; else `ssh`. When `GIT_SSH` is set in the server's environment (the older variable, a program with no arguments), nothing is added for ssh, and the report says so.
- The repository's `core.sshCommand` is read through the read-only module `src/lib/server/core/git.ts`, as one new pinned vector `config --get core.sshCommand`, through its one call site and timeout, exported as `sshCommand(root): string` answering the value or the empty text (git exits 1 when the key is unset, which is the empty text, not a failure). It is pinned as `remote` is: the subcommand list, the vector map and the source text of `tests/server/core/git.test.ts` (around :65-130 and the gates at :858-890) gain it, and `DESIGN.md:128` counts fourteen subcommands and names the vector.
- `fetchIn(root, { unattended: true, sshCommand })` takes the resolved command from its caller, so `git-write.ts` runs no read; the pressed Fetch is unchanged.
- Case 14 becomes three runs of a real unattended fetch whose `core.sshCommand` is a script in the temporary folder that writes its own arguments and `$GIT_TERMINAL_PROMPT` to a file and exits 1, the remote an `ssh://` URL: with `core.sshCommand` set, the script runs and its arguments end with `-o BatchMode=yes`; with `GIT_SSH_COMMAND` set in the environment to that script, the same; with neither, `GIT_SSH_COMMAND` is `ssh -o BatchMode=yes` (read from the environment the uploadpack command sees, as the brief's case 14 does). In all three the file holds `GIT_TERMINAL_PROMPT=0`. A pressed Fetch on the same repository runs the script without the appended option.
- A new case for the read: `sshCommand` answers the value set with `git config core.sshCommand`, and the empty text when it is unset or the root is no repository.

Paths added: `tools/oculus/src/lib/server/core/git.ts` (the one new reader and its pinned vector) and `tools/oculus/tests/server/core/git.test.ts` (the pinned lists).

## 3. The choices the test files carry (accepted)

A missing `config` message is no round and no log line; a `config` payload or `config` value that is not a map is a wrong value and logged once; a malformed `git` state is skipped and the others fetched; a round over no repository does not use up the period; `refresh(root)` follows a fetch that answered, ok or not, and not one that rejected or anything after `close()`; a `refresh` that throws is logged as `autofetch: <root>: <reason>` and the round goes on; a key turned wrong mid-round ends the round and logs once. A look that fires early by a millisecond waits one more tick; that stands.

## The rest

The full verify list runs once after the last change (`agents/spec.md:25`); a failed command is rerun alone, then the full list once more; the report gives the number of full-list runs.
