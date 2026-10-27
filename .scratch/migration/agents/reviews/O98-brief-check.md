# Brief check of O98

Brief check of O98 (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O98.md`), on main at 7a8c91138 (`git log --oneline -3`: head `7a8c91138 Rewrite open item 508 of O98 as two choices`, the brief's stated base). `git status`: the brief is untracked; `plan.md`, `orchestrator-state.md`, `queue.md`, `O92-report.md` and `docs/data-map.md` are modified and uncommitted. I read `plan.md` and the rulings from the working copy.

## Names

Command: `git grep -n "<name>" -- . ':!config/local.yml' ':!.scratch'` for each name, plus `git grep -n "slurm.resource" -- src config docs`, `git grep -n "hpc_host" -- ':!config/local.yml' ':!.scratch'`, `git grep -n "machine/hpc/" -- src tests` and `git grep -nE "SSH_PROGRAM|'ssh'|\bRunner\b" -- src`.

These hits fall outside "Paths this step writes" and the change makes them false or broken:

- `src/lib/state/forms/referrers.ts:20,62-66,122-129`. `RESOURCE_SETTINGS = [{ key: 'slurm', field: 'resource' }]`, and `settingOf` returns `''` unless the value is a string. With `slurm.resource: [utwente]` no resource is ever "referred to" by the setting, so a resource's Delete ask (`DeleteAsk.svelte`, `Entry.svelte`) stops naming it. Its test `tests/state/forms/referrers.test.ts` is also outside the list.
- `src/lib/server/root/watch/local.ts:111`. `FIELDS` lists `'hpcHost'`, which is how a `local.yml` change is noticed. It has to lose `hpcHost` and gain `clusters` so that a row change restarts watchers (item 6). The type check fails once `hpcHost` leaves `LocalConfig`.
- `src/lib/server/root/process/server-context.ts:25-27`. It holds the one `HpcWatcher`, which item 6 replaces with several watchers and an aggregator.
- `src/lib/state/shared/stores/shapes.ts:47,86`. `Payloads['hpc']` is `HpcPayload`, which is the old shape.
- `src/lib/data/model/model-entities.ts:704`. The comment "`host` is the ssh alias" becomes false under item 4.
- `src/lib/views/boards/focus/CommandCenter.svelte:20`. The comment "drawn only while the cluster answers" becomes false. The write list names only `CommandCenterView.svelte`.
- `config/text/views/system/workbench.yml:24`. `desc_local` says "the ssh alias of the cluster". The `config/text/` entry in the write list covers only new sentences, so this changed sentence is not in it.
- `docs/data-map.md` base line 16, "(port, cluster alias, programs, accounts)": false once `hpc_host` is gone.
- `docs/data-map.md` base line 79, "may set these 52 keys", and the YAML list at 81-131: four HUB_LIST keys are added (`sign_in`, `connections.failures`, `clusters.key_type`, `clusters.key_file`). The step may write only lines 62, 123, 207 and 217. I read the base with `git show HEAD:docs/data-map.md`.
- `tests/server/machine/runs/recover/runs.test.ts:534`, `(hub.latest('hpc')?.payload as HpcPayload).status`, and `tests/server/machine/runs/recover/harness.ts:24-28,234` (Runner, Copier, RecoverTarget). Both read the old shapes, and neither is a test of an entry item 20 names.
- `tests/server/root/context-fixture.ts:23` (the HPC wiring of the context). It is affected if the context shape changes.
- `src/lib/server/git/git-remote.ts:50`. `fetchAll` calls `fetchIn`; this is the reader's Fetch, which item 13 must cover.
- `src/lib/data/accounts/connect.ts`. `PROVIDERS = ['google', 'microsoft']` and `connectKey`. This is where a connect key is made a safe file name. The git host keys of item 17 meet it, and it is not in the list.
- `src/lib/data/model/accounts/model-connect.ts:15`, `ConnectProvider = 'google' | 'microsoft'`. It is covered by the `data/model/` entry, but the premise does not name it.

These hits stay true or are already covered:

- `RecoverTarget` has a second, unrelated type at `src/lib/server/machine/runs/recover/routes.ts:84`; it is in the list under `runs/recover/`. The client type is `src/lib/state/system/machine/recover.svelte.ts:28` (`'mac' | 'cluster'`), covered by the Recover state wildcard. The premise names only `Recover.svelte:59`.
- `Runner` in `pty/sessions.ts:166` and `usage/refresh.ts:11` is an unrelated tmux runner and stays true. `Runner` in `runs/recover/cluster.ts:26,58` is in the list.
- `SCOPE` in `connect/setup.ts:20,54` is in the list.
- `fetchIn` in `autofetch.ts` is in the list.
- `hpcSettingsOf` and `hpcRouteHost` callers in `context.ts`, `live-settings.ts` and both routes are in the list.
- `authorizeUrl`, `tokenUrl` and `ALIAS` occur in `oauth.ts` and `host.ts` only.
- `envArgs` occurs in `sessions.ts` only.
- `slurm.resource` in `hub-layer.ts:521`, `references.ts:107`, `normalise.ts:444`, `docs/templates.md:1142,1149` and `config/defaults/sources.yml:29` stays true.
- `docs/data-map.md:262/266` and Axel's "Twelve keys" line stay true unless the new keys become primary-only (see Implied inputs).
- `docs/templates.md:1145,1152` call the host "the ssh alias"; that file is in the list, and the brief does not name these lines.
- The hub `.oculus/config.yml:83` comment says "whose `host` is the ssh alias". The orchestrator's landing change (item 1) names only the value.

The new keys: `git grep -nE "sign_in|connections\.failures|key_type|key_file|\bconnections:"` gives no hits except an unrelated `palette_page.key_files`. `clusters` is already a word of the options sources (`src/lib/data/shapes/catalog-words.ts:62`, `references.ts:34`, `engine.ts:106`, `config-sources.ts:70`, `state/system/config/editors/sources.ts:190`). The `local.yml` key `clusters:` and the hub map `clusters.*` reuse that word. This does not break anything. Under `spec.md:72` the brief should still state that it checked the collision.

## The step line

There is no "Goal" heading in `plan.md`; `grep -n "^## "` shows Steps, Could run in parallel, Rulings, Agents and Blocked. The top paragraph names `DESIGN.md` and has no gate.

How each part of O98's line (plan.md:858) and of rulings 500, 501, 504, 505, 507 and 508 maps to "What to build":

| Part | Item |
|---|---|
| `slurm.resource` a list | 1 |
| Every cluster polled and shown under its name | 6, 7 |
| `host:` an address or an alias | 4 |
| User and key file per cluster | 3, 5 |
| `hpc_host` gone | 2 |
| Resolution shown (`ssh -G`) | 7, 16 |
| Failures told apart with their fix | 12 |
| Fetch failure on the repository and status bar, cleared at success | 13 |
| Token kept and handed to git | 17, 18 |
| Account setup cluster section | 16 |
| Account setup git section | 17 |
| Secret / no-secret split (505) | 3, 17 |
| Ruling 507 (1) | 3 |
| Ruling 507 (2) | 16 |
| Ruling 507 (3) | 17 |
| Ruling 507 (4) | 18 |
| Ruling 507 (5) | 17, Libraries |
| Ruling 508 1 (a) | 8 |
| Ruling 508 2 (a), `sign_in` | 14 |
| Ruling 508 2 (a), key settings | 15 |
| Ruling 508 2 (a), failure rows | 12 |
| 508 taken part: payload | 6 |
| 508 taken part: Submit | 9 |
| 508 taken part: Recover | 11 |
| 508 taken part: cancel and log | 10 |
| 508 taken part: Google and Microsoft addresses moved | 14 |
| 508 taken part: G135, G34, G43, G8, G13 | 20 |

Ruling 504 is scheduling and needs no item. Ruling 501's "token kept in `local.yml`" is superseded by 505, and the line follows 505.

Parts with no item:

- **Git section with no git host row.** Ruling 508's Step 0 (plan.md:866) says "With nothing configured, the git section and the key setup say what is missing and where it is set". Item 17 gives "one part per git host row of `sign_in`" and says nothing for zero rows.
- **"Edited in Settings" for `connections.failures`, `clusters.key_type` and `clusters.key_file`.** Ruling 508 2 (a) asks for it. Item 14 says it for `sign_in` only. No item names the options-catalog entries, or which shipped config file holds the four new keys. A HUB_LIST row needs a `file` (`hub-names.ts:702-744`).
- **The four failure kinds the step line names are not told apart on the real hub.** The line names "no ssh entry, key or credentials refused, host unknown, no route". Oculus ships `connections.failures: []`, as ruling 508 requires. The landing change to the hub (item 1) adds no rows, so on Axel's hub nothing is told apart after landing.

## Premises

Each reference was re-read with `sed -n` or `git grep` as cited.

- Line 11: holds. `behavior.yml:72-77` (`slurm:`, `resource: ''`), `options/behavior.yml:198-204`, `connectors.ts:18-30`, `hub-names.ts:744`. The grep also lists `options/behavior.yml:201`, whose help text names `hpc_host`.
- Line 12: holds. `host.ts:35`, `:42-61`, `:68-85`, `:112-125`; `hpc/+server.ts:20`; `recover/+server.ts:37`.
- Line 13: holds. `local.ts:167`, `:488`; `options/local.yml:18-20`; `machine-defaults.ts:39-45`; `server.yml:452`; `live-settings.ts:108-112`, `:267`; `HELP.md:337`, `:553`; `templates.md:410-411`; and all the test lines. The grep also lists `options/behavior.yml:201`, the comments at `host.ts:1,65,108` and `live-settings.ts:5`, and Axel's `data-map.md:275`, none of which the line names. The same key is also listed in `local.ts:488` `PROGRAM_KEYS` and in `watch/local.ts:111` (as `hpcHost`, outside the list).
- Line 14: holds. `ssh.ts:23-35`, `:64-102`; `transfer.ts:31-50`. `transfer.ts:7-8` adds a fact the brief leaves out: the options are "joined into the one word rsync's `-e` takes: rsync splits it on spaces".
- Line 15: holds. `poll.ts:271`, 639 lines (`wc -l`), the ten `hub.publish('hpc'` lines; `pollers.ts:81`; `model-sessions.ts:657-689`.
- Line 16: holds for what it lists. It leaves out `src/lib/state/shared/stores/shapes.ts:47,86` and `src/lib/state/workbench/navigation/status.ts:186` (`hpcWords`, which builds the bar's words) and `:444`.
- Line 17: holds. `submit.ts:96-97`, `:223-235`. Not stated: the cluster folder is one value per project (`clusterOf`, `submit.ts:122-135`, `paths.cluster`), so every cluster gets the same folder.
- Line 18: holds. `Recover.svelte:59`, `:117-118`; `recover/+server.ts:33-50`. The client type is in `recover.svelte.ts:28`.
- Line 19: holds (`manifest-schema.yml:83`).
- Line 20: holds. `oauth.ts:120-129`, `:132-136`, `:139-143`; `store.ts` 0600 in 0700; `AccountSetup.svelte` is 148 lines. Not stated: `tokenUrl` is also used by `accessToken` (`oauth.ts:331`, through `post` at `:274`), which is the refresh every mail and calendar poll runs.
- Line 21: holds. `run.ts:227`, `:262-268`; `git-write.ts:155-160`, `:714`; `clone-git.ts:47`; `deposit-git.ts:192`, `:276`; `sessions.ts:521-535`, `:563-599`. `git-message.ts`, which is in the write list, starts `claude` at `:132`, not git, and no item uses it.
- Line 22: wrong in one place. `classifyFailure` is `parse.ts:811-839`, and the file is 839 lines (`wc -l`), so "811-845" runs past its end. `fetchIn` at `git-write.ts:662` and the standard-error-only autofetch (`autofetch.ts:207`) hold. Not stated: `autofetch.ts:3` says "It owns no channel"; the `git` channel is published from `src/lib/server/root/watch/git.ts:376` (state built in `src/lib/server/core/git/state.ts`), and neither file is in the list.
- Line 24: holds. `git diff HEAD -- docs/data-map.md` shows hunks `@@ -29,6 +29,8`, `@@ -202,6 +204,8` and `@@ -264,6 +268,21`. Base lines 62, 123, 207 and 217 match.
- Line 25: holds (see ADRs).

Not stated in the premises, and each one changes the work:

- **Folder limit of ten items.** `git show HEAD:src/lib/server/machine/hpc/` lists ten files. The new `clusters.ts` and the aggregator make 11 or more, so the folder must be split, and the brief names no split. `src/lib/data/model/` already holds ten.
- **Size limit of 880 lines.** These files are close: `model-sessions.ts` 869 (it gains the cluster fields and `fetchFailure`), `sessions.ts` 856, `context.ts` 846, `parse.ts` 839, `git-write.ts` 835, `hub-names.ts` 831. Split targets are not named.
- **`release` and `build-app` are not scripts.** The package scripts are `app`, `app:package` and `app:release`. `build-app` is the adapter output folder (`build-folders.ts:15`). What ships folders is `SHIPPED_SOURCES` in `src/lib/data/places/shipped.ts:8-17` (it lists `src`, `config`, `docs`, `assets`), which is outside the list. `server/machine/lines.ts:269` reads it too, so adding `bin` changes the Status view's line counts. `bin/` does not exist (`ls bin`: no such directory).
- **Settings cannot write a `local.yml` row today.** The `local.yml` write exists only for `self`, in `src/lib/server/edit/writes/config/config-key.ts:240-338`, and G8 forbids any other. Settings' "This machine" section only lists keys (`tests/state/system/settings/machine-section.test.ts:1-5`, state in `src/lib/state/system/config/groups.ts`, `rows.ts`). Items 3 and 16 ("written by Settings", "Save writes the `clusters:` row through the Settings writer") need those files, the Settings view and the route, and none of them is in the list.
- **Which hubs' rows are read.** `local.yml` account rows are joined over every hub (`src/lib/data/sources/config/machine.ts:54-55`, `JOINED`), and `machine.ts` is not in the list. The brief does not say whether `clusters:` rows join across hubs or are read from the primary only.
- **The orchestrator's landing change to the hub covers only `slurm.resource`.** Moving the Google and Microsoft addresses out of code while shipping `sign_in: []` breaks Connect and every mail and calendar token refresh (`accessToken`) on Axel's hub at landing, unless the landing also writes `sign_in` rows for `google` and `microsoft` and the key settings into `research-hub/.oculus/config.yml`.

## Cases and checks

Read against `spec.md` and `guarded.md`.

Inconsistent with the rules:

- **G8.** Item 20 and items 3 and 16 make "the `clusters:` row write a row of G8's test". G8's text (`guarded.md:70`) says the Settings writers "never write a `local.yml` but the one key `self`". Ruling 508 approves extending G8, but the brief dictates no new G8 sentence, so the orchestrator has no text to write at landing and the test would sit under an entry that forbids it.
- **G1.** It is not mentioned anywhere. The new routes (device-flow Sign in and Sign out, Make key, Put the key, Save, `ssh -G`) run processes or write files. `spec.md:59` gives a unit under an entry its test, but no case covers a request without the token.
- **G7.** It covers the copy, and item 18's helper string goes against it (see Dictated text).
- **"Tests of `hpc_host` go" (line 48).** `tests/data/sources/config/local/local.test.ts:115-118` ('keeps the good keys when one is wrong'), `:232` ('words each problem against local.yml with no value of the file in it') and `tests/data/sources/config/local/machine.test.ts:37,58` ("are the primary hub's, with a problem naming the other hub that sets one") are G13 tests of other behaviour that use `hpc_host` only as a sample key. Read literally, the brief has them deleted. Only the row at `local.test.ts:66` is a test of `hpc_host`.
- **Verify item 4** uses `git grep`. `spec.md:33` limits a builder to `git status`, `git diff` and `git show`.
- **Verify item 3** gives the `LC_ALL=C grep -rn '[^ -~]'` form. `spec.md:102` replaces it with the perl gate.
- **Verify items 1-2** say `--base <base>` and "the base copy's list". The brief never names the worktree, the base copy folder or the base commit for that flag (`spec.md:32-33,88` require the brief to name them).
- **Verify item 6** reads text against "the standards pages' rules on list items and sentence length". `spec.md`, the one standards page, has no such rule (`grep -n "sentence length" spec.md` prints nothing).

Cases that check a place the step does not list:

- Case 13: `fetchFailure` on the `git` channel lives in `watch/git.ts` and `core/git/state.ts`, and the reader's Fetch in `git-remote.ts`.
- Cases 3 and 7: the Settings write needs `config-key.ts` and `state/system/config/`.
- Case 8: `watch/local.ts`.

Minor:

- Case 19 omits the `-C oculus-<resource>` that item 16 dictates.
- Cases 16 and 20 involve timers and a process. `spec.md:69` (fake clock) and `:59` (slow tag) govern them, and the brief does not repeat that.

## The question: could it pass without the goal being reached

The step line has no check of its own (see The step line). For "a new user never runs ssh or git by hand": yes. The first password login to an unknown host gets ssh's host-key prompt through `SSH_ASKPASS`, and no case covers it (Implied input 8).

| Item | Could pass without the goal? | Reason |
|---|---|---|
| 1 | Yes | The reader test passes while `referrers.ts` reads the list as no reference. |
| 2 | Yes | The grep is exact, but the literal "tests of `hpc_host` go" deletes G13 tests of other behaviour. |
| 3 | Yes | No listed file can write the row through Settings, and no case writes one. |
| 4 | Yes | The resolver passes while `user` and `key_file` reach rsync's `-e` string unchecked. |
| 5 | Yes | Case 3 checks only the poll's argument list; the copy's `-e` and the put-key ssh are not checked. |
| 6 | Yes | No case changes a `clusters:` row or `slurm.resource` live, and no case covers a stopped watcher's late result. |
| 7 | Yes at unit level | The look at landing is its proof. "Refreshed when the settings change" has no case. |
| 8 | Yes | Case 4 has one answering cluster, so "summed" is never exercised; the pill and the rail badge are in no case. |
| 9 | Partly | The pick and the refusal are covered; the copy on the picked cluster's connection is not. |
| 10 | Yes | Log on another cluster is in no case, and `LogPaths` is keyed by job id alone (`actions.ts:10`). |
| 11 | Partly | The Login node per cluster is in no case. |
| 12 | Yes | The poll side has a case and the fetch side's `kind`/`fix` has none. On the real hub there are no rows. |
| 13 | Yes | Autofetch alone can pass; the reader's Fetch through `git-remote.ts` is unlisted. |
| 14 | Yes | Connect is refused correctly while the poll refresh on Axel's hub fails after landing. |
| 15 | Mostly no | `{resource}` and `{type}` substitution has no validation case. |
| 16 | Yes | See the host-key prompt and BatchMode under Implied inputs. |
| 17 | Yes | GitHub's `slow_down` answer is in no case. |
| 18 | Yes | Case 18 passes while the `!` helper string is an unquoted shell line holding hub values. In the desktop app `process.execPath` is Electron, which runs a script as node only with `ELECTRON_RUN_AS_NODE=1` (`lsp/servers.ts:202-220`, `recover/unpack.ts:209-210`), so the helper would not answer. |
| 19 | Yes | `data-map.md` lines 16 and 79 to 131 are outside the write list. |
| 20 | Yes | G135 as dictated is false for existing tokens (see Dictated text). |

Per case:

- Case 1: Partly. It starts fresh, so a watcher left from an earlier config is not exercised.
- Case 2: No.
- Case 3: Yes, for the copy.
- Case 4: Yes, for summing and for the pill and badge.
- Case 5: No.
- Case 6: Mostly no. An IPv6 host with `:` through rsync's `host:path` is not covered.
- Case 7: No.
- Case 8: No.
- Case 9: No.
- Case 10: Yes, for log.
- Case 11: No.
- Case 12: Yes, for the fetch side.
- Case 13: Yes, for the reader's Fetch.
- Case 14: Yes, for the poll refresh.
- Case 15: No.
- Case 16: Yes, for `slow_down`.
- Case 17: No.
- Case 18: Yes, as item 18.
- Case 19: Yes. ssh-keygen checks only the private path, so a lone `<path>.pub` is overwritten.
- Case 20: Yes, for the host-key prompt.
- Case 21: No.

## Implied inputs

1. **`user` in a `clusters:` row holding a space or `-oProxyCommand=...`.** After `-l` as its own argument it is safe. Joined into rsync's `-e` word, which rsync splits on spaces (`transfer.ts:7-8,39`), it adds ssh options, and `ProxyCommand` runs a local command. Expected: `user` and `key_file` refused by pattern with a finding on the row, or quoted for rsync's `-e` parser.
2. **`key_file` relative, with a space, or naming the `.pub`.** Expected: either resolved under the hub folder as other `local.yml` path keys are (ruling Z255) or refused, the brief saying which; a space quoted for `-e`.
3. **`clusters.key_file` with `{resource}` where the resource key holds `/` or `..`, and `clusters.key_type` outside ssh-keygen's types.** Expected: the path refused unless it is a safe file name under the home folder; the type refused with a finding naming the key.
4. **The public key and its `oculus-<resource>` comment reaching the remote command.** The resource key comes from the hub. Expected: the key passed on standard input or shell-quoted, never spliced into the remote command.
5. **`sign_in.key` reaching a path and a shell.** It reaches `~/.oculus/connect/<key>.json` and git's `!` helper command. A key of `../x`, `a;b` or `google` with a `credential_address` (colliding with the Google client-half file) breaks it. Expected: the key matches `^[a-z0-9_-]+$`, a duplicate or colliding key is a finding, and `spec.md:72` requires the check.
6. **`credential_address` holding `=`, a space or a shell character in `-c credential.<address>.helper=...`.** `-c` splits at the first `=`, so an address like `https://x.helper=!cmd #` makes git run `cmd`. Expected: the address must be an https origin (scheme, host, optional port), else a finding and no helper; or the pairs passed only through `GIT_CONFIG_KEY_<n>` / `GIT_CONFIG_VALUE_<n>`.
7. **Token addresses read from a non-primary hub.** `sign_in`'s `device_code`, `token` and `user` addresses (the token is sent to `user`) could come from a second hub's `config.yml`. Expected: these keys read from the primary alone, like `slurm.resource` (`data-map.md:262`), and https only.
8. **First password login to a host not in `known_hosts`.** ssh asks "continue connecting (yes/no/[fingerprint])?" through `SSH_ASKPASS`, and the one-shot helper answers it with the password. A password of `yes` would accept any host key; any other answer leaves the password prompt unanswered. Expected: the helper answers only the password prompt, and the host-key question is handled by a stated rule (for example `StrictHostKeyChecking=accept-new` with the fingerprint shown, or refused with the "host unknown" words).
9. **The put-key ssh carrying `SSH_OPTIONS`.** Item 5 gives every ssh `SSH_OPTIONS`, which hold `BatchMode=yes` (`ssh.ts:27`). BatchMode disables password and askpass, so every cluster would be reported as offering no password. Expected: the put-key ssh named as the one ssh without `BatchMode=yes`.
10. **A second prompt (one-time code) under keyboard-interactive.** Expected: it gets no answer, ssh fails, and the section says so.
11. **The askpass helper program itself.** `SSH_ASKPASS` takes a program path with no arguments, so the helper needs a file with a shebang and the exec bit. Under Electron it also needs `ELECTRON_RUN_AS_NODE=1`. The write list names no such file.
12. **`slurm.resource: [a, a]`.** Expected: a finding, and the first kept (`spec.md:72`).
13. **A watcher stopped while its poll is in flight.** Expected: its late payload is dropped by the aggregator (`spec.md:72`).
14. **Job 123 on both `a` and `b`.** Expected: `LogPaths` keyed by resource and id, so a log reads only that job's log (G34).
15. **The device-flow answer's `verification_uri`.** The brief says "the row's verification page", but the row has no such field (item 14's field list, `O98.md:42,148`), so the address comes from the network answer. Expected: opened through `open_bin` only when it is an https URL, as one argument.
16. **The device-flow answer `slow_down`.** Expected: the interval grows by 5 s and polling goes on (RFC 8628).
17. **A Pull or Sync that succeeds after a failed fetch.** Expected: the brief says whether it clears `fetchFailure`.
18. **A terminal opened before Sign in, or a user shell that exports `GIT_CONFIG_COUNT`.** Expected: the brief says the first has no helper until reopened and that the second overrides oculus's pairs.
19. **The Microsoft `{tenant}` holding `/` or `?`.** Expected: encoded, as `oauth.ts:135,142` encodes it now.
20. **The password containing a newline.** Expected: refused, since askpass answers one line.

## ADRs

`ls docs/adr` prints "No such file or directory". There is no ADR folder.

## Dictated text

- **G135**, `grep -n "G135 (new" O98.md` gives line 48. **It breaks a rule.** "A sign-in token ... is kept only in its host's file ... and given only in git's credential answer" is false for the Google and Microsoft refresh tokens. They are sign-in tokens kept in per-account files and sent to the provider's token endpoint (`store.ts:1-3`, `oauth.ts:269-279,331`). It is also false for the git token, which item 17 sends to the `user` address to read the login. A guarded entry must be true (`spec.md:71`: a sentence the change makes false is a defect).
- **G34**, `grep -n 'G34 reads'` gives line 48. It holds for cancel. It leaves "log reads only that job's log" without "on that cluster", although item 10 moves log too.
- **G43**, same line 48. It is ambiguous. Read as the whole entry, it drops "equal to the plan the server computes at the press" and the `/local/$SLURM_JOB_ID` warning (`guarded.md:119`). It needs to say it replaces only the opening clause.
- **ssh shape**, `grep -n "ssh SSH_OPTIONS \[-l"` gives line 33. It holds for ssh's own argument list (G7). For the rsync transport it puts the row's values into a string rsync splits, which breaks G7 and `spec.md:72`. It also contradicts line 44, the password-login ssh, through `BatchMode=yes`.
- **ssh-keygen**, `grep -n "ssh-keygen -t <clusters.key_type>"` gives line 44. It holds as an argument list. `-N ''` must be passed as an empty argument, and the brief should say so. Hub values need the validation in Implied input 3.
- **Password login options**, `grep -n "PubkeyAuthentication=no"` gives line 44. It holds, but conflicts with item 5's `SSH_OPTIONS`.
- **`SSH_ASKPASS_REQUIRE=force`**, line 44. It holds; `ssh -V` here prints `OpenSSH_9.9p2`, a version that supports it.
- **Credential helper**, `grep -n 'helper=!<node>'` gives line 46. **It breaks a rule.** git runs a `!` helper through the shell, so the node path, the helper path and the hub's row key reach a shell string. That is against G7 and `spec.md:72` ("A value from the hub ... that reaches ... a shell is untrusted"). `credential_address` reaches a `-c` key that splits at `=`. In the desktop app, `<node>` (`process.execPath`, decision 6, line 153) is Electron, which needs `ELECTRON_RUN_AS_NODE=1`.
- **`GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_<n>` / `GIT_CONFIG_VALUE_<n>` through `fixedEnv`**, line 46. It holds: each pair is one `-e` argument to tmux (`sessions.ts:598-599`). The value is still the `!` shell line above.
- **`ssh -G` with the row's options**, `grep -n "ssh -G"` gives lines 35, 44 and 157. It holds.
- **`fetchFailure: { kind?, fix?, line, at }`**, line 41. It holds as a shape. `line` is git's standard error, which can hold a remote URL with embedded credentials if a remote is written that way. That is not a token oculus holds, so it holds.
- **`LC_ALL=C grep -rn '[^ -~]'`**, line 181. Replaced by the perl gate under `spec.md:102`.
- **`git grep -n "hpc_host" ...`**, line 182. The builder cannot run it under `spec.md:33`.
- **"`release` and `build-app`"**, line 46. These names are not on the tree (see Premises).

## Declined to judge

- Whether the UT cluster offers password or keyboard-interactive login. It is not verified, as ruling 507's Step 0 says (plan.md:859), and I opened no connection.
- Whether any app of a hub reads the `hpc` channel's old shape. `research-hub/.oculus/` has no `apps` folder, and other hubs were not read.
- Whether a resource rename in the references index follows a `clusters:` row's `resource`. `local.yml` was not read, and I did not trace the index code.
- One command outside the allowed git set was run: `git ls-files`, twice, read-only, for folder counts. The counts above come from `git show HEAD:<dir>/`.

Agent usage: a5d4f9a13f2831178, claude-opus-5-5, 236369 tokens, 81 tool uses, 13 min 47 s
