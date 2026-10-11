# D62 landing: apps, the host and the bridge

Position: the oculus migration plan; D62, apps: the host and the bridge, landed. In flight: D65 (one kind of project), its builder running. Next: D65's review, its one repair round and its landing; then the loop pauses at Axel's word until he says to go on (D63, D64, Q72 and O33 wait).

## Open items

None.

## The check before the landing

The runner's agent listing showed no agent of the step: the builder a26cf9f636282978b and the reviewers a7d94dafa7d50c3a1 and a0fa01e25cf725e2b had finished. D65's builder a0206ba4b2a7a65d7 is the one agent running.

## NOT DONE

Nothing in the brief or in repair round 1. Not looked at in the look: a call from the page into a frame (`onTheme`, `onChannel`, `onStore`, `onHost`), and the dark theme.

## What landed

An app may name a `host` file in `app.yml`. oculus runs it with the reader's rights as a Node process only while the app is approved, enabled and unchanged, and stops it when the app is disabled, revoked, changed or removed, on Stop, and when the server ends, a dev restart included. The page and the host talk through oculus (`oculus.host.request`, `sendToPage` on the `app-messages` channel); the host reaches the app's store, its secrets in the system keyring and the API of the apps it depends on. Without a host, a frame reads files in scope, runs its root's commands through the process approval, and compiles wasm; `open({ file })` opens a file as the Files view does. Apps are enabled and disabled machine-wide or per workspace, a machine app is removed to the Trash with its store and secrets, and Add app from folder and Add as App copy a folder in as an unapproved app. The Processes view lists each host with Stop, Restart and its output; a tab shows a host that ended, and a dependency no app provides as not installed.

## Found, and fixed at landing (9)

- A dev restart no longer runs two hosts of one app: the plugin's `closeServer` hook awaits the hosts of the context it served, which Vite awaits before it listens on the next server, and a context starts no host before its own server listens (`vite-plugin.ts`, `process/apps-hosts.ts`, `context.ts`, `host/manager.ts`); `HostsHandover` and `tests/server/root/apps-handover.test.ts` removed; `tests/server/root/vite-restart.test.ts` drives two real plugins in Vite's order and failed on D62's tree before the fix ("TypeError: next.ready(...).then is not a function") and passes on main; the round brief's premise that the handover object outlives a restart was false, since Vite loads the configuration and so makes a new plugin on each restart
- `oculus.js` hands an app only the nine app-facing names beside its four groups, the test asserting that list against `createMethods`
- `host-output.test.ts` and two rows on the output removed, which test a cost the rules file does not name
- The fixed sleeps of two new tests replaced by signals
- The file-scope `script` cache of `oculus-frame.test.ts` removed
- DESIGN.md's sentence on the restart and on when the output is read, and the `app-host` route's head comment, made true
- An unused import, and the plugin's type narrowed to its own synchronous hooks so svelte-check accepts the restart test
- The approval panel's dependency line reworded ("Start the programs of these apps first: {0}.") after the look showed "Need the apps ghost" for one app
- Add app from folder pressed while the folder panel is open says "The folder panel is already open." (`apps.add_panel_busy`) instead of "could not be used".

Each new test of the step is named under one entry of `agents/guarded.md`: G1, G2, G7, G9, G10 (gaining Remove and Add app), G13, G31 (gaining `~/.oculus/apps.json`), G49, and the new G75 and G76.

## Verification on main, from `tools/oculus`

```
test:landing: 6 commands, from /Users/axelfaes/workspace/research-hub/tools/oculus
ok      ASCII gate (1.1 s)
ok      npm run lint (16.5 s): > eslint . --cache --cache-location node_modules/.cache/eslint/
ok      npm run format:check (37.4 s): All matched files use Prettier code style!
ok      npm test (160.7 s): Duration  154.89s (transform 67.42s, setup 0ms, import 437.89s, tests 141.40s, environment 191ms)
ok      npm run check, then npm run build, then npm run test:slow (349.4 s): Duration  221.40s (transform 40.62s, setup 0ms, import 294.10s, tests 466.10s, environment 195ms)
ok      npm run test:checks (507.9 s): Duration  502.48s (transform 49.75s, setup 0ms, import 116.14s, tests 645.89s, environment 6ms)
test:landing: 507.9 s; every command passed
```

No A/B (no `bench:`).

## The look

The look ran on a scratch oculus from the gate (port 8796, the gate as the hub, main's staged diff applied, the browser's saved state for that origin cleared, three scratch machine apps in the gate's `.oculus/apps/`): the approval panel names the host file and the dependency; an approved frame connects in a real sandboxed iframe with the nine names and four groups, `getTheme` answers and a `host.request('ping', { n: 41 })` comes back `{"n":42}` through `/api/app-host`; a changed file asks for approval again; the catalogue's chip shows the lock, then the disabled mark after Disable, with Enable on its menu after; the App programs group shows Crasher "ended with exit code 3" with Restart, Needy "waiting for the app ghost, which is not installed", Pinger running with Stop; Restart ran Crasher again and its output kept both runs; Pinger's open output grew from tick 82 to tick 85 while open; the tab of Needy shows the not-installed line and Crasher's the ended line with Restart. The look's press on Add app from folder opened the macOS folder panel on the screen; it was closed by ending the scratch server's osascript within a minute, and a rule now keeps looks off folder-panel controls (`orchestrator-state.md`, "Looks and the machine"). Not looked at: a call from the page into a frame (`onTheme`, `onChannel`, `onStore`, `onHost`), the dark theme.

## Agents

Builder a26cf9f636282978b (claude-sonnet-5-5): 265,121 tokens, 47 tool uses, 5.5 min to the hand-back; 89,943 tokens, 706 tool uses, 174.8 min to the report; round 1: 278,415 tokens, 250 tool uses, 78.5 min. Brief check a852246ff3fc11d90 (claude-opus-5-5): 273,100 tokens, 100 tool uses, 15m 3s. Reviewer a7d94dafa7d50c3a1 (claude-opus-5-5): 114,844 tokens, 113 tool uses, 19m 54s. Reviewer over round 1 a0fa01e25cf725e2b (claude-opus-5-5): 272,184 tokens, 67 tool uses, 18m 0s. The first report did not pass its bar (one repair round); 9 fixes at landing. The builder ran nine git commands against the no-git rule, eight read-only and one `git mv` with no arguments, which changed nothing.
