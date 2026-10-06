Everything in the brief is done.

# O30b report: the app's own build folders

Both rulings of `briefs/O30b-cases.md` are built: Ruling A (A1) and Ruling B (B1). `npm run app` builds the server into `.svelte-kit-app/` and `build-app/` with `vite build --mode app`, and the app forks the server with `--handler <checkout>/build-app/handler.js`. Every command below ran from `tools/oculus` in the worktree. Scripts and logs are in the session scratchpad under `o30b/`.

## Open items of the state file, verbatim

- Z634 (2026-10-06), Q123, the words of a new guarded entry G52. Q123's brief check found that G51's words guard input reaching the program, while the alternate-screen test guards what the page shows (Z621): an editor drawn full screen after an attach, and the shell's text and cursor back when it exits. Guarded entries carry Axel's words, so the choice is his. (a) A new entry G52, recommended, proposed as: "G52. A page that attaches to a terminal pane whose program is in its alternate screen is given the shell's text in the grid's normal buffer and the program's screen in its alternate buffer, so the program draws full screen and leaving it shows the shell's text again with the cursor where the shell left it." Code: the pane's attach under `src/lib/server/machine/pty/`. Test: written by Q123. For: the behaviour Z621 asked for is guarded by a test whose failure costs a lost shell screen. Against: one more entry. (b) Widen G51's words to cover the alternate screen. For: one entry for the attach. Against: G51 then guards two different promises. (c) No guarded test; the behaviour is checked by a quoted run and the look only. Against: nothing stops a later change from dropping it; the lazy option. Q123 is built under (a); its landing waits for the ruling.

## Rulings acknowledged

- Ruling A (A1): `vite.config.ts` sets `process.env.MODE = mode` when the mode is `app`, with a comment naming `node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:42` and `src/core/config/index.js:192`. The command is `vite build --mode app` everywhere (`src/desktop/server/build.ts:22`, `tests/server/desktop/start.test.ts:61`). No code of oculus reads an environment variable for a folder name; the folder names come from the mode alone (`src/lib/server/root/process/build-folders.ts`, `vite.config.ts:19-20`). A2 and A3 are not built; A3 was the lazy option.
- Ruling B (B1): under the mode `app` the config sets Vite's `tsconfig` option to `.svelte-kit-app/tsconfig.json` (`vite.config.ts:32`); `tsconfig.json` is unchanged. Kit's extends notice is printed 3 times per app build (`grep -c "should extend the configuration" f1-build.log` prints 3, below). B2 and B3 are not built.
- The comparison of `build-app/handler.js` and the server chunks with `build/`'s, the health check on `build-app/` and the second run of case 9 are in "Ruling checks" below.

## DONE / NOT DONE

Nothing in the brief is NOT DONE. What the checks below do not cover: `npm run test:checks` as a whole, `npm run test:slow` and `npm run test:landing` (the brief forbids the last two and every start of Electron); the checks run are the ones named in each row.

| Item | State | Command that shows it |
|---|---|---|
| 1 Mode `app` and its folders | DONE | `vite build --mode app` exit 0 writes `.svelte-kit-app/` (786 files) and `build-app/` (1645 files); `vite build` exit 0 writes `.svelte-kit/` (1524) and `build/` (1645); both in "Final runs" |
| 2 App build reads nothing under `.svelte-kit/` | DONE | case 1 second run: `.svelte-kit/` moved away, exit 0, `ls -d .svelte-kit` fails afterwards |
| 3 `--handler` flag | DONE | cases 3, 4, 5, 10, 11, 12 in "Final runs" |
| 4 `parseAppArgs` refuses `--handler` | DONE | `node case13.mjs` in "Final runs" |
| 5 `app.ts` checks `build-app/handler.js`, `not_built` reworded | DONE | `grep -n "handler" src/desktop/app.ts` prints `:221` and `:298`; `config/text/desktop.yml:9` |
| 6 Ignore lists | DONE | the grep of item 4 of "Verify", all hits judged below; case 8 run |
| 7 Documents, comments, diagram reader | DONE | the files in the file table; `npm run diagrams` exit 0; `diff -rq` of `docs/diagrams` |
| 8 `start.test.ts` | DONE | diff below; case 14 |
| `npm run test:quick` | passes | quoted below |
| `sh utils/unused-exports.sh` | exit 0, same file as the base | `diff` below |
| ASCII gate and history-words grep | print nothing / judged | below |

## The cases' first run on the unchanged tree

Every command ran from `tools/oculus` in the worktree, which equals the base copy (`diff -rq` of `src tests utils docs config` and `diff -q` of `vite.config.ts tsconfig.json .gitignore .prettierignore eslint.config.js README.md HELP.md DESIGN.md` against the base copy print nothing). Scripts and logs are in the session scratchpad under `o30b/`. A server run (cases 3, 4, 5, 10, 11, 12) used a scratch world made as `start.test.ts`'s `scratch()` and `run()` make it (`world.sh`, `serve.sh`): the engine copied from `config/` without `local.yml`, a scratch `local.yml` naming a scratch `hub:` and a free `port:` (52690, 52721 and others, never 8787, 8790 or 8817), `HOME` and `TMUX_TMPDIR` under the scratchpad, started with `env -i`, stopped after the run. The lines of the scratch hub's missing folders (`watch: cannot watch`, `config: ... this document draws nothing`, `publish: unreachable|unconfigured`) are filtered from the quoted output and counted by the script.

1. `vite build --mode app`, listing with hashes of `.svelte-kit/` and `build/` before and after: exit 0 (1:23 minutes); `ls -d build-app .svelte-kit-app` prints `No such file or directory` for both; the before and after listings differ (61 lines before, 2431 after; the build rewrote `build/` and `.svelte-kit/`). Second run with `.svelte-kit/` moved to the scratchpad: exit 0, `grep -i tsconfig` over the output prints nothing, `ls -d .svelte-kit` prints `.svelte-kit` (the unchanged build writes it again); the folder was put back. Not met, as expected on the unchanged tree: the mode has no effect.
2. `vite build`, listing of `.svelte-kit-app/` and `build-app/` before and after: exit 0, both folders absent before and after, `diff` prints nothing, `build/handler.js` written (930 bytes). Met on the unchanged tree, since nothing writes those folders.
3. `node src/server.ts --engine <scratch engine> --handler <worktree>/build-app/handler.js`: prints `oculus: unknown argument: --handler`, exit status 1.
4. The four wrong forms, each in the scratch world: `--handler=` prints `oculus: unknown argument: --handler=`; `--handler=--foo` prints `oculus: unknown argument: --handler=--foo`; a path that does not exist prints `oculus: unknown argument: --handler=<that path>`; the directory `build/` prints `oculus: unknown argument: --handler=<that path>`; exit status 1 each. The flag is unknown, so none of them reaches the checks the brief asks for.
5. `node src/server.ts --engine <scratch engine>`: prints `oculus on http://127.0.0.1:52721 over hub <scratch hub>`, and `GET /api/health` answers `{"app":"oculus"}`; stopped afterwards. Met on the unchanged tree.
6. Reading `src/desktop/server/process.ts:76`: the argument list is `['--engine', options.engine, '--default-port', String(options.defaultPort)]`, no `--handler`; `src/desktop/app.ts:295`: `existsSync(join(checkout, 'build', 'handler.js'))`. Not met.
7. Not run on its own: case 9 shows it (below).
8. Reading: `.gitignore:2-3` `.svelte-kit/` and `build/`; `.prettierignore:2-3` the same; `eslint.config.js:25` `'.svelte-kit/**'`; `src/lib/server/root/watch/git.ts:80` `IGNORED = ['node_modules', '.svelte-kit', 'build', '__pycache__']`. The two new folders are in none of them. The prettier and eslint runs over the two folders are not run: the folders do not exist.
9. `case9.sh` (nine runs, second build 4, 12 and 16 s after the first build's first line, three runs each; its output is `case9-first.out` in the scratchpad; the script that replaces it is quoted under "Final runs"): `vite build --mode app` exit status per run: offset 4 s: 1, 1, 0; offset 12 s: 0, 1, 1; offset 16 s: 1, 1, 1. `vite build` exit status: 0 in all nine. The failing app builds print `ERR_MODULE_NOT_FOUND ... .svelte-kit/output/server/internal.js` (`case9-first/off4-run1.app.log`). Not met: seven of nine app builds fail on the unchanged tree. Both builds write `.svelte-kit/` and `build/` and nothing in `.svelte-kit-app/` or `build-app/` (0 listing lines differ in both).
10. `--handler build-app/handler.js` from the worktree: prints `oculus: unknown argument: --handler`, exit status 1.
11. `--handler <missing path> --handler build-app/handler.js`: prints `oculus: unknown argument: --handler`, exit status 1.
12. `--handler <scratch file that throws>`: prints `oculus: unknown argument: --handler`, exit status 1.
13. `node case13.mjs` (imports `src/desktop/decide/args.ts` under plain Node):
    - `["--handler","<package.json>"]` gives `{"error":"unknown argument: <package.json>"}` (the flag goes to Chromium, its value is read as a positional argument);
    - `["--handler=<package.json>"]` gives `{"engine":"<checkout>"}`, no refusal;
    - `["--handler"]` gives `{"engine":"<checkout>"}`;
    - `["--engine","<checkout>"]` gives `{"engine":"<checkout>"}`.
    Not met.
14. `npx vitest run tests/server/desktop/start.test.ts -t 'prints the port in use and exits 1 when the server cannot listen' --reporter=verbose`: the row's line, with the reporter's pass mark first: `|unit| tests/server/desktop/start.test.ts > the desktop app starting and stopping > prints the port in use and exits 1 when the server cannot listen 14143ms`, `Tests  1 passed | 4 skipped (5)`. It starts no Electron.
15. Reading `config/text/desktop.yml:9`: `not_built: The oculus server is not built. Run npm run build, then start the app again.` Seen at the look on landing, not run.
16. Reading `node_modules/@sveltejs/kit/src/exports/vite/index.js:340-344`: `watch: { ignored: [`${out_dir}/!(generated)`] }`, so the dev watcher ignores everything under `.svelte-kit` except `generated` and watches `build-app/` and `.svelte-kit-app/` as ordinary folders of the root. A host-visible fact; nothing is changed for it.
17. Reading `src/desktop/app.ts:59-64`: `app.setPath('userData', join(home, 'Library', 'Application Support', 'oculus'))` and `app.requestSingleInstanceLock()` follow HOME, so two starts under two HOMEs each take a lock of their own and, after the step, share `build-app/` and `.svelte-kit-app/`.
18. `npm run check`: exit 0, `COMPLETED 3036 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
19. `sh utils/unused-exports.sh`: exit 0, 381 lines, identical to `O30b-base/unused-exports.txt` (`diff` prints nothing). The Vitest run of the function-form config is the final run's.
20. No case, as the brief says.

## What the first run led to

The first run on the unchanged tree showed that `--mode app` alone does not build (finding 1 of the earlier hand-back, settled by Ruling A) and that the tsconfig notice cannot be silenced without breaking `npm run check` on a fresh tree (finding 2, settled by Ruling B). The mechanisms, from the installed kit 2.70.3 and Vite 8.3.0:

- `analyse.js:42` loads the config with no mode, `config/index.js:192` resolves `mode ?? process.env.MODE ?? 'production'`, and `utils/fork.js:38` starts the worker with a copy of `process.env`; so `process.env.MODE` set by the config reaches the worker.
- Vite's top-level `tsconfig` option (`node_modules/vite/dist/node/index.d.ts:3488`) makes the app's build read `.svelte-kit-app/tsconfig.json` and nothing under `.svelte-kit/`.
- Kit's `write_tsconfig.js:45` calls `validate_user_config`, whose notice text is at `:187`; it runs at each resolution of the config, which is 3 times per app build.

## Final runs after the change

Server cases ran in a scratch world as the start test makes one (`world.sh`, `serve.sh`): the engine copied from `config/` without `local.yml`, a scratch `local.yml` naming a scratch hub and a free port (never 8787, 8790 or 8817), `HOME` and `TMUX_TMPDIR` under the scratchpad, started with `env -i`, stopped after the run. The notices of the scratch hub's missing folders (`watch`, `config`, `publish`) are filtered from the quoted output and counted by `serve.sh`. Paths below are shortened to `<scratch>` and `<checkout>`.

### Case 1: `vite build --mode app`

- With `.svelte-kit/` and `build/` present: `$S/hashes.sh f1-before.txt .svelte-kit build; node node_modules/vite/bin/vite.js build --mode app` exit 0; `hashes.sh f1-after.txt .svelte-kit build`; `diff f1-before.txt f1-after.txt` exit 0 and prints nothing (3169 lines each). `ls -d build-app .svelte-kit-app` lists both.
- `grep -c "should extend the configuration" f1-build.log` prints 3: kit's extends notice, at lines 1, 11 and 535 of the output, each followed by the `{ "extends": "./.svelte-kit-app/tsconfig.json" }` block.
- With `.svelte-kit/` moved to the scratchpad and `build-app/`, `.svelte-kit-app/` removed: exit 0; `grep -i tsconfig f1b-build.log | grep -v "Your tsconfig.json should extend the configuration generated by SvelteKit:" | grep -v '"extends": "./.svelte-kit-app/tsconfig.json"' | wc -l` prints 0, so the only tsconfig lines are the notice (3 times); `grep -ic "not found\|ENOENT" f1b-build.log` prints 0; `ls -d .svelte-kit` prints `ls: .svelte-kit: No such file or directory`; `ls -d build-app .svelte-kit-app` lists both. `.svelte-kit/` was then moved back.

### Case 2: `vite build` leaves the app pair alone

`hashes.sh f2-before.txt .svelte-kit-app build-app`, `vite build` exit 0, `hashes.sh f2-after.txt .svelte-kit-app build-app`, `diff` exit 0, no output.

### Case 3: `--handler <checkout>/build-app/handler.js`

```
oculus on http://127.0.0.1:60616 over hub <scratch>/worlds/f3c/hub
--- GET /api/health on port 60616:
{"app":"oculus"}
```

The health check answers on the server loaded from `build-app/handler.js`, after the last case 9 run had rebuilt that folder.

### Case 4: the wrong forms, each in the scratch world, exit status 1

```
=== --handler=
oculus: --handler needs the file that holds the handler
=== --handler=--foo
oculus: --handler needs the file that holds the handler
=== --handler=<scratch>/nope.js
oculus: <scratch>/nope.js is no file, so there is no handler to load
=== --handler=<checkout>/build-app
oculus: <checkout>/build-app is no file, so there is no handler to load
```

`--handler ''` (a separate empty argument) and a `--handler` last on the line with no value print `oculus: --handler needs the file that holds the handler`, exit status 1 (`final-server-cases.log`). Each refusal comes before the build is loaded, so the server never reaches its listen.

### Case 5: no `--handler`

`serve.sh g5 --engine '{ENGINE}'` prints `oculus on http://127.0.0.1:60650 over hub <scratch>/worlds/g5/hub`; `GET /api/health` answers `{"app":"oculus"}`; the server loaded `build/handler.js`. With `build/` moved away, the same command prints `oculus: the server handler <checkout>/build/handler.js could not be loaded: Cannot find module '<checkout>/build/handler.js' imported from <checkout>/src/server.ts`, exit status 1; `build/` was put back.

### Cases 10, 11, 12

- Case 10, `--handler build-app/handler.js` from the checkout: `oculus on http://127.0.0.1:60656 ...`, health `{"app":"oculus"}`.
- Case 11, `--handler <scratch>/nope.js --handler build-app/handler.js`: `oculus on http://127.0.0.1:60665 ...`, health `{"app":"oculus"}` (the last value wins).
- Case 12, `--handler <scratch>/throws.js` (a file that throws `handler blew up`): `oculus: the server handler <scratch>/throws.js could not be loaded: handler blew up`, exit status 1.

### Case 13: `node case13.mjs` (imports `src/desktop/decide/args.ts` under plain Node with the app's reader)

```
["--handler","<checkout>/package.json"] => {"error":"unknown argument: --handler"}
["--handler=<checkout>/package.json"] => {"error":"unknown argument: --handler"}
["--handler"] => {"error":"--handler needs the file that holds the handler"}
["--engine","<checkout>"] => {"engine":"<checkout>"}
```

### Case 14: row 4 alone

`npx vitest run tests/server/desktop/start.test.ts -t 'prints the port in use and exits 1 when the server cannot listen' --reporter=verbose`: `PASS |unit| tests/server/desktop/start.test.ts > the desktop app starting and stopping > prints the port in use and exits 1 when the server cannot listen 1806ms`, `Tests  1 passed | 4 skipped (5)`. With `build-app/` moved away first, the same run builds it in `beforeAll` (`vite build --mode app`) and passes (`Tests  1 passed | 4 skipped (5)`, 85.9 s of tests); `ls -l build-app/handler.js` shows the 930-byte file afterwards. It starts no Electron.

### Case 8: ignore lists

- `npx prettier --check --ignore-path .prettierignore build-app .svelte-kit-app` prints `All matched files use Prettier code style!`, exit 0; `npx prettier --check --ignore-path /dev/null build-app/server/chunks/handler-BMrA2p94.js` prints `[warn]` for the file, so the exit 0 above comes from `.prettierignore`.
- `npx eslint build-app .svelte-kit-app` prints `You are linting "build-app", but all of the files matching the glob pattern "build-app" are ignored.`, exit 2: the lint ignores both folders.
- The other lists are in the grep below: `.gitignore:4-5`, `.prettierignore:4-5`, `eslint.config.js:27-28`, `src/lib/server/root/watch/git.ts:82-85`, `src/lib/data/helpers/search/query.ts:37`.

### Case 9: two builds at once, nine runs

The script, quoted whole (`case9.sh`; `$HERE` is the scratchpad folder holding `compare-builds.mjs`):

```bash
#!/bin/bash
# Case 9 of O30b: two builds at once.
# usage: case9.sh <checkout tools/oculus> <results dir> <ref dir> <runs per offset> <offset seconds>...
#   <ref dir> holds app/ (.svelte-kit-app/ and build-app/ as a lone `vite build --mode app` wrote them) and plain/
#   (.svelte-kit/ and build/ as a lone `vite build` wrote them).
# Each run: listing of the four folders; start `vite build --mode app`; when it has printed its first line wait the
# offset; start `vite build`; wait for both; print both exit statuses; listing again; compare each folder pair to its
# lone copy with compare-builds.mjs (same file names and same text once the folder names, the version stamp and the
# 8-character content hashes are replaced by fixed words); compare build-app/ with build/ the same way; print the modification times of the files of
# each folder against the start and end of the build that owns it.
CHECKOUT=$1; OUT=$2; REF=$3; RUNS=$4; shift 4
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT"
cd "$CHECKOUT" || exit 2
VITE=node_modules/vite/bin/vite.js
listing() { # <file> <dirs...>
    local f=$1; shift; : > "$f"
    for d in "$@"; do if [ -d "$d" ]; then find "$d" -type f -exec shasum {} + | sort -k2 >> "$f"; fi; done
}
compare() { # <lone folder> <folder of this run>
    echo "    $2 against the lone build's copy: $(node "$HERE/compare-builds.mjs" "$1" "$2" | head -3 | tr '\n' ' ')"
}
mtimes() { # <dir> <start> <end>  -> files with a modification time outside [start, end]
    local d=$1 s=$2 e=$3
    find "$d" -type f -exec stat -f '%m' {} + | sort -n | awk -v s="$s" -v e="$e" 'NR==1{lo=$1} {hi=$1} $1<s||$1>e{out++} END{printf "    %s: %d files, modified %d..%d (build %d..%d), outside its own build: %d\n", d, NR, lo, hi, s, e, out+0}' d="$d"
}
for offset in "$@"; do
  for n in $(seq 1 "$RUNS"); do
    tag="off${offset}-run${n}"
    echo "=== run $tag: second build $offset s after the first build's first line"
    listing "$OUT/$tag.before" .svelte-kit build .svelte-kit-app build-app
    ( date +%s > "$OUT/$tag.app.start"; node $VITE build --mode app > "$OUT/$tag.app.log" 2>&1; echo $? > "$OUT/$tag.app.exit"; date +%s > "$OUT/$tag.app.end" ) &
    A=$!
    for i in $(seq 1 600); do [ -s "$OUT/$tag.app.log" ] && break; sleep 0.1; done
    echo "    first build printed its first line: $(head -1 "$OUT/$tag.app.log")"
    sleep "$offset"
    ( date +%s > "$OUT/$tag.plain.start"; node $VITE build > "$OUT/$tag.plain.log" 2>&1; echo $? > "$OUT/$tag.plain.exit"; date +%s > "$OUT/$tag.plain.end" ) &
    B=$!
    wait $A; wait $B
    echo "    exit statuses: vite build --mode app = $(cat "$OUT/$tag.app.exit"), vite build = $(cat "$OUT/$tag.plain.exit")"
    listing "$OUT/$tag.after" .svelte-kit build .svelte-kit-app build-app
    echo "  folders of this run against the lone builds' copies (names, version stamp and content hashes normalized):"
    compare "$REF/app/build-app" build-app
    compare "$REF/app/.svelte-kit-app" .svelte-kit-app
    compare "$REF/plain/build" build
    compare "$REF/plain/.svelte-kit" .svelte-kit
    echo "  build-app/ against build/ of this run:"
    echo "    $(node "$HERE/compare-builds.mjs" build-app build | head -3 | tr '\n' ' ')"
    echo "  modification times against the build that owns the folder:"
    for d in build-app .svelte-kit-app; do mtimes $d "$(cat "$OUT/$tag.app.start")" "$(cat "$OUT/$tag.app.end")"; done
    for d in build .svelte-kit; do mtimes $d "$(cat "$OUT/$tag.plain.start")" "$(cat "$OUT/$tag.plain.end")"; done
  done
done
```

`compare-builds.mjs`, which the script calls:

```js
// Compares two build folders of one checkout, such as build/ and build-app/: every file of one has a partner in
// the other with the same name and the same text after the folder names (.svelte-kit-app for .svelte-kit,
// build-app for build), the version stamp and the 8-character content hashes of file names are replaced by fixed
// words. .gz and .br files are decompressed first. Prints the counts and each file with no partner.
// usage: node compare-builds.mjs <folder A> <folder B>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else out.push(p);
    }
    return out;
}
function tree(dir) {
    const files = walk(dir);
    const hashes = new Set();
    for (const f of files) {
        const base = f.split('/').pop();
        const m = base.match(/(?:^|[-.])([A-Za-z0-9_-]{8})\.(?:js|css)(?:\.map|\.br|\.gz)?$/);
        if (m) hashes.add(m[1]);
    }
    const pattern = new RegExp([...hashes].map((h) => h.replace(/[-_]/g, '\\$&')).join('|') || '$^', 'g');
    return { dir, files, hashes, pattern };
}
function normalized(t, file) {
    let buf = readFileSync(file);
    if (file.endsWith('.gz')) buf = gunzipSync(buf);
    if (file.endsWith('.br')) buf = brotliDecompressSync(buf);
    let text = buf.toString('latin1');
    let name = file.slice(t.dir.length);
    text = text.replace(t.pattern, 'HASH');
    name = name.replace(t.pattern, 'HASH');
    text = text
        .replace(/\.svelte-kit-app/g, '.svelte-kit')
        .replace(/build-app/g, 'build')
        .replace(/version_hash: (\\?")[a-z0-9]+\\?"/g, 'version_hash: $1VERSIONHASH$1')
        .replace(/\b179\d{10}\b/g, 'VERSION')
        .replace(/__sveltekit_[a-z0-9]+/g, '__sveltekit_VERSIONHASH');
    return `${name}\u0000${text}`;
}
const [A, B] = [tree(process.argv[2]), tree(process.argv[3])];
const keysA = A.files.map((f) => normalized(A, f));
const keysB = B.files.map((f) => normalized(B, f));
function unmatched(keys, files, others) {
    const left = new Map();
    for (const k of others) left.set(k, (left.get(k) ?? 0) + 1);
    return files.filter((_, i) => {
        const n = left.get(keys[i]) ?? 0;
        if (n > 0) left.set(keys[i], n - 1);
        return n === 0;
    });
}
const onlyA = unmatched(keysA, A.files, keysB);
const onlyB = unmatched(keysB, B.files, keysA);
console.log(`files: ${A.files.length} and ${B.files.length}; without a partner: ${onlyA.length} and ${onlyB.length}`);
for (const f of [...onlyA, ...onlyB].slice(0, 20)) console.log('  only', f);
```

Before the runs, a lone `vite build --mode app` and a lone `vite build` ran one after the other in the idle tree and their folders were copied to `ref/app/` and `ref/plain/`. The command `bash case9.sh <checkout> case9-final ref 3 4 12 16` printed, per run, the two exit statuses:

| Run | `vite build --mode app` | `vite build` |
|---|---|---|
| second build 4 s after the first, run 1, 2, 3 | 0, 0, 0 | 0, 0, 0 |
| 12 s, run 1, 2, 3 | 0, 0, 0 | 0, 0, 0 |
| 16 s, run 1, 2, 3 | 0, 0, 0 | 0, 0, 0 |

`grep -E "exit statuses" case9-final.out | sort | uniq -c` prints `9     exit statuses: vite build --mode app = 0, vite build = 0`. Each run's comparisons, over all nine runs (`grep` over `case9-final.out`):

- `build-app/` against the lone app build's copy: `files: 1645 and 1645; without a partner: 0 and 0` in 9 of 9. `build/` against the lone plain build's copy: the same line in 9 of 9.
- `.svelte-kit-app/` against its lone copy: `files: 786 and 786; without a partner: 2 and 2` in 9 of 9, and `.svelte-kit/` against its lone copy: `files: 1524 and 1524; without a partner: 2 and 2` in 9 of 9. The 2 files are in every run `ambient.d.ts` and `output/client/.vite/manifest.json` (`grep -o "only [^ ]*" case9-final.out` counts 9 for each of the four paths). `ambient.d.ts` lists the names of the environment variables of the process that built, and the case 9 shell's variables differ from the lone build's (`diff` of the two files shows `CLAUDE_EFFORT`, `CLAUDE_PID` in one and `COLORTERM`, `GIT_ASKPASS` in the other). `manifest.json` holds the same 491 entries in an order that follows the content hashes: after the hashes are replaced and the entries sorted, the two manifests are equal (a python comparison printed `491 491 True`).
- `build-app/` against `build/` of the same run: `files: 1645 and 1645; without a partner: 0 and 0` in 9 of 9.
- File modification times: `build-app: ... outside its own build: 0`, `.svelte-kit-app: ... outside its own build: 0`, `build: ... outside its own build: 0` in 9 of 9; `.svelte-kit: ... outside its own build: 738` in 9 of 9, and the lone plain build shows the same 738 (`find .svelte-kit -type f -exec stat -f '%m' {} +` against the build's start and end), files of `.svelte-kit/` that `svelte-kit sync` wrote and the build leaves alone.

So each of the two builds wrote only its own folders, with the files a lone build writes, and each exited 0 in all nine runs.

### Ruling checks

`build-app/handler.js` against `build/handler.js`, and the server chunks, after the change (`diff -rq build build-app`, `diff build/handler.js build-app/handler.js`, `node compare-builds.mjs build-app build`):

- `compare-builds.mjs build-app build` prints `files: 1645 and 1645; without a partner: 0 and 0`: the two folders hold the same 1645 files, and every file, `handler.js`, `index.js`, every server chunk and every client chunk included, has the same text as its partner once three things are replaced: the folder names, the version stamp, and the 8-character content hashes of the file names.
- The raw differences (`diff -rq build build-app` prints 201 lines: 129 `Files ... differ` and 72 `Only in`, the `Only in` lines being the same files under different hashed names), every one named with its cause. `diff build/handler.js build-app/handler.js` differs on lines 5-7 and 19 only, the four imported chunk names (`handler-...js`, `index.js-...js`, `manifest.js-...js`, `internal2.js-...js`); `index.js` the same on lines 4, 16, 18 and 24. Cause: the chunk names carry a content hash, and the content of `server/chunks/chunks/internal2.js` differs by `//#region .svelte-kit-app/generated/...` against `//#region .svelte-kit/generated/...` (four region comments, `diff` of the two chunks) and by `version_hash: "<six characters>"` (kit's per-build version hash), and the other chunk names follow from that one. `client/_app/version.json` differs by its timestamp (`{"version":"..."}`), and the client chunks `app.*.js`, `start.*.js` and `nodes/*.js` differ by the hashed chunk names they import and by the version stamp. The `.map` files differ by the same replaced strings, and the normalized comparison matches every one of them.
- The tsconfig the app's build reads (`.svelte-kit-app/tsconfig.json`, not the root `tsconfig.json`) leaves no difference: the root file's own options (`rewriteRelativeImportExtensions`, `esModuleInterop`, `strict` and the rest) do not change one byte of the built code. The comparison above is the evidence.
- Case 3's health check on `build-app/` is in "Case 3" above.

## Verify list

- `npm run diagrams` exit 0; `diff -rq <base>/docs/diagrams docs/diagrams` prints `Files BASE/docs/diagrams/layers.dot and docs/diagrams/layers.dot differ` and the same for `layers.svg`. The one changed line of `layers.dot` is line 20: `"desktop to server" [label="6", ...` becomes `label="8"`: `src/desktop/app.ts` and `src/desktop/server/build.ts` each import `build-folders.ts` from the server layer, two more runtime imports from the desktop layer to the server layer. `layers.svg` is drawn from it.
- `npm run test:quick` after the last source change (`quick3.log`): `ok prettier (0.7 s): All matched files use Prettier code style!`, `ok ASCII gate (0.7 s)`, `ok svelte-kit sync (1.8 s)`, `ok svelte-check (24.5 s): ... COMPLETED 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (36.1 s)`, `ok vitest (36.7 s): Duration 32.58s`, `test:quick: 37.5 s (limit 45.0 s); every command passed`. `npm run check` exit 0: `COMPLETED 3037 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npx vitest run tests/checks/diagrams tests/checks/source tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/imports tests/checks/tree/duplication.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files 11 passed (11)`, `Tests 146 passed (146)`; after the final edits of `DESIGN.md` and `vite.config.ts`, `tests/checks/source` and `tests/checks/diagrams` ran again: `Test Files 5 passed (5)`, `Tests 78 passed (78)`, and `tests/checks/source`: `Tests 32 passed (32)`. `sh utils/folder-check.sh` exit 0. What this does not cover: the other files of `tests/checks`, which the brief does not name.
- `sh utils/unused-exports.sh` exit 0, 381 lines; `diff <base>/unused-exports.txt unused-final.txt` exit 0, prints nothing: no line is added. `build-folders.ts` exports `APP_MODE` and `APP_FOLDERS`, both read by production code (`src/desktop/app.ts:20`, `src/desktop/server/build.ts:10`); the names of the shared folders are written once, in `vite.config.ts:20`.
- ASCII gate, run as `spec.md:97` writes it over `src tests config` (the `bin` folder named there does not exist in this tree, and `find` prints `bfs: error: bin: No such file or directory.`): the perl pipeline prints nothing, `wc -l` of its output is 0. `LC_ALL=C grep -n '[^ -~]' README.md HELP.md DESIGN.md` prints nothing; the same grep over this report prints nothing.
- The history-words grep of `spec.md:42` over the 303 added or changed lines (`diff` against the base, plus `build-folders.ts` whole), restricted to comment lines and test titles, for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package`, a package id, or a date: one hit, `src/server.ts:22` `// The command line before anything else, so a mistyped flag, ...`. The words are the base's own line (`grep -n "before anything" <base>/src/server.ts` prints `22:`), and `before` states the order of the steps in the file, not an earlier state. Kept.
- `wc -l` of each file written is in the file table; the largest is `tests/checks/diagrams/diagrams.test.ts` at 867, under 880.
- The grep of item 4 of "Verify", `grep -rn --exclude=local.yml -e "build/handler" -e "'build'" -e "\.svelte-kit" -e "build-app" -e "--handler" -e "default-port" src utils tests config vite.config.ts tsconfig.json eslint.config.js .gitignore .prettierignore README.md HELP.md DESIGN.md`, prints 93 hits (`grep4.txt`). Each is judged:
  - Covered by this step: `src/server.ts:26,53`; `src/desktop/decide/args.ts:5,14,37,38`; `src/desktop/server/process.ts:27,82,84`; `src/desktop/server/build.ts:22`; `src/lib/server/root/watch/git.ts:82-85`; `src/lib/server/root/process/args.ts:6,8,9,22,25,51-53,66`; `src/lib/server/root/process/build-folders.ts:2-4,12`; `src/lib/data/sources/config.ts:5,17`; `src/lib/data/helpers/search/query.ts:37`; `tests/checks/diagrams/diagrams.test.ts:173,177` (the two forms the reader reads); `tests/server/desktop/start.test.ts:61,316`; `tests/tiers/landing.mjs:4-6`; `vite.config.ts:6-9,20,31`; `.gitignore:2,4,5`; `.prettierignore:2,4,5`; `eslint.config.js:25,27,28`; `DESIGN.md:81,82,135,188,398,438`; `README.md:9,11`; `HELP.md:186,365,367`.
  - Covered by the ruling, unchanged: `tsconfig.json:2` (`"extends": "./.svelte-kit/tsconfig.json"`), which Ruling B keeps.
  - Unrelated: `src/lib/shell/keys/keys.ts:55,105,111`, `src/lib/shell/commands/CommandForm.svelte:66,131`, `src/lib/shell/keys/workbench-keys.svelte.ts:57`, `src/lib/server/machine/pty/routes.ts:90`, `src/lib/server/machine/commands/files.ts:36`, `src/lib/state/sessions/terminals.svelte.ts:111`, `src/lib/state/sessions/terminal/commands.svelte.ts:227,690`, `src/lib/state/sessions/latex.svelte.ts:672,685,735`, `src/lib/data/model/model-sessions.ts:813`, `src/lib/views/shared/latex/Main.svelte:118`, `tests/server/machine/schedules/run.test.ts:94`, `tests/server/machine/commands/run.test.ts:112,131,132`, `tests/state/workbench/navigation/pages.test.ts:31,46,47`, `tests/routes/sessions/terminal-actions.test.ts:131,137,169,172,176,251`: each names `'build'` as a command role, a LaTeX step or a user command, not a folder.
  - Unrelated: `src/lib/server/root/process/port.ts:3`, a comment on how the port default reaches the server; it names no folder and no handler.
  - No other skip list names `build` or `.svelte-kit` as a folder: the grep prints no hit in `utils/` and none in `config/`.
- `npm run diagrams` reads both forms: `tests/checks/diagrams/diagrams.test.ts` has one row per form the reader reads, quoted in the diff below.

## Changed test files against the base

`tests/server/desktop/start.test.ts` (`diff <base> <worktree>`), one row per changed line:

| Line | Base | Now |
|---|---|---|
| 21 | (none) | `import { APP_FOLDERS, APP_MODE } from '../../../src/lib/server/root/process/build-folders.ts';` |
| 30-31 | (none) | `/** The handler the app's own build writes, which the server rows load. */` and `const HANDLER = join(CHECKOUT, APP_FOLDERS.adapter, 'handler.js');` |
| 55 (now 58) | `if (existsSync(join(CHECKOUT, 'build', 'handler.js'))) return;` | `if (existsSync(HANDLER)) return;` |
| 58 (now 61) | `[join(CHECKOUT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],` | `[join(CHECKOUT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--mode', APP_MODE],` |
| 309 (now 312-318) | `[join(CHECKOUT, 'src', 'server.ts'), '--engine', world.engine],` | the same list over seven lines with `'--handler', HANDLER` after `world.engine` |

`tests/checks/diagrams/diagrams.test.ts` (170-184 become 170-195), one row per changed line:

| Base line | Base | Now |
|---|---|---|
| 170 | `it('draws the entry loading the built app as its arrow to the routes, with no lost box', () => {` | `it.each([` with two rows (below) and a title `'draws the entry loading the built app as its arrow to the routes, with no lost box, for $form'` taking `({ entry }) => {` |
| 174-175 | `...base,` and `'server.ts': "const built = new URL('../build/handler.js', import.meta.url).href;\nconst { handler } = await import(built);\n",` | row 1: `form: 'a name bound to the built file'` with that same source as `entry`; row 2: `form: 'a name bound to the built file or to the file the command line names'` with `entry` `"const built = new URL('../build/handler.js', import.meta.url).href;\nconst handlerUrl = parsed.handler === undefined ? built : pathToFileURL(parsed.handler).href;\nconst loaded = await import(handlerUrl);\n"`, and the body now reads `'server.ts': entry,` |
| 171-183 | the page source, `layersDot(...)`, `expect(dot).toContain(arrow('src', 'routes', '1'));`, the comment and `expect(dot).not.toContain('style=dashed');` | the same statements, indented one level more inside the `it.each` callback |

`utils/diagrams/imports.mjs` changes to match: `urlNames` reads an initializer through a helper `pathOf` that unwraps `.href`, accepts `new URL('<path>', import.meta.url)`, an identifier already bound to one, or a conditional expression whose first resolvable branch gives the path (`imports.mjs:113-139`); its doc comment says so. `graphs.mjs:89` `BUILT = '../build/'` is unchanged because the entry's default branch is still the `../build/handler.js` path and the reader names that path for `import(handlerUrl)`.

## Files, with line counts

`diff -rq <base copy> .` over the folders and files the base copy holds (`-x node_modules -x .svelte-kit -x .svelte-kit-app -x build -x build-app -x local.yml -x .scratch`) prints 26 differing or new files, each with `wc -l`:

| File | Lines | In the write list |
|---|---|---|
| `src/lib/server/root/process/build-folders.ts` (new) | 12 | in |
| `src/lib/server/root/process/args.ts` | 112 | in |
| `src/lib/server/root/vite-plugin.ts` | 88 | in |
| `src/lib/server/root/watch/git.ts` | 512 | in |
| `src/lib/data/helpers/search/query.ts` | 265 | in |
| `src/lib/data/sources/config.ts` | 96 | in |
| `src/server.ts` | 113 | in |
| `src/desktop/app.ts` | 326 | in |
| `src/desktop/decide/args.ts` | 40 | in |
| `src/desktop/server/build.ts` | 53 | in |
| `src/desktop/server/process.ts` | 152 | in |
| `config/text/server.yml` | 110 | in |
| `config/text/desktop.yml` | 60 | in |
| `vite.config.ts` | 97 | in |
| `.gitignore`, `.prettierignore`, `eslint.config.js` | 6, 27, 124 | in |
| `tests/server/desktop/start.test.ts` | 342 | in |
| `tests/checks/diagrams/diagrams.test.ts` | 867 | in |
| `tests/tiers/landing.mjs` (head comment only) | 54 | in |
| `utils/diagrams/imports.mjs` | 367 | in |
| `docs/diagrams/layers.dot`, `layers.svg` | 90, 493 | in (output of `npm run diagrams`) |
| `DESIGN.md`, `HELP.md`, `README.md` | 438, 375, 38 | in |

The base copy has no `package.json`, `.prettierrc`, `package-lock.json`, `assets/` or `demo/`, so `diff -rq` lists them as `Only in .`. `ls -ld` shows `package.json`, `.prettierrc`, `assets` and `demo` at 09:48 and `package-lock.json` at 09:50, the time the worktree was made and installed; the step edits none of them. The report file itself, `.scratch/migration/agents/reviews/O30b-report.md`, is outside the write list by design.

## Judgment calls

- The SvelteKit option `outDir`: `sveltekit({ outDir: folders.kit, ... })`, a `KitConfig` option (`node_modules/@sveltejs/kit/types/index.d.ts:599`: `outDir?: string;`).
- The tsconfig mechanism: Vite's `tsconfig?: string` (`node_modules/vite/dist/node/index.d.ts:3488`), set to `` `${folders.kit}/tsconfig.json` `` under the mode `app` only (`vite.config.ts:32`).
- The `test` block of `vite.config.ts` is not byte for byte the base's: it moves into a function body, so it is indented 4 spaces more and its comments are rewrapped at 100 columns, and prettier reflowed the `tags` entry onto three lines. After removing every whitespace and `//` the two blocks are equal up to the closing of the function (`python3` comparison: both texts end `],server:{deps:{inline:[/svelte/]}}}}]}` and differ only in the final `});` against `};});`).
- `--handler` refusals, literal sentences because the parse runs before the engine and its catalog are known: `--handler needs the file that holds the handler` (an empty value, a value starting with `--`, or no value); `<resolved path> is no file, so there is no handler to load` (a path that does not exist or a directory); `unknown argument: --handler` from `parseAppArgs`, the form of the `--default-port` refusal at `src/desktop/decide/args.ts:37`. The load failure is catalogued: `server.start.handler_failed` in `config/text/server.yml`: `oculus: the server handler {0} could not be loaded: {1}`.
- `build-folders.ts` lives in `src/lib/server/root/process/` because `src/lib/server/root` holds 10 items already (`sh utils/folder-check.sh` exit 0).
- `not_built` reads `The oculus server is not built. Run npm run app from the checkout once, then start the app again.`: the packaged app runs no build and reads the checkout's `build-app/`, which `npm run app` writes (`src/desktop/package.ts:1-6` says the bundle imports the checkout's code).
- `tests/tiers/landing.mjs`: only the head comment changes. The lane stays: the type check and the build write `.svelte-kit`, and the slow tests start the app, whose build now writes folders neither writes. The code of the lane is unchanged.
- `process.env.MODE` is written by the config only under the mode `app`, and the value is the mode name.

## Host-visible changes

| What | Before | After |
|---|---|---|
| Folders `npm run app` builds into | `.svelte-kit/` and `build/` | `.svelte-kit-app/` and `build-app/` |
| A `npm run build` in the same checkout while the app starts | can empty the folders the app's server loads | writes folders the app does not read |
| Output of an app build | no notice | kit's extends notice, 3 times per app build (`grep -c` above) |
| The server's start line | `--engine`, `--default-port` | also `--handler <file>`, refusals as above |
| A handler that fails to load | not verified on the base | `oculus: the server handler <path> could not be loaded: <reason>`, exit status 1 (cases 5 and 12) |
| Packaged app on a checkout with no build | `Run npm run build, then start the app again.` | `Run npm run app from the checkout once, then start the app again.` |
| Search skip list | `node_modules`, `.git`, `.svelte-kit` | also `.svelte-kit-app` (`query.ts:37`); `build-app` is not skipped, as `build` is not |
| Git watcher `IGNORED` | `node_modules`, `.svelte-kit`, `build`, `__pycache__` | also `.svelte-kit-app`, `build-app` |
| Environment of the build process | no `MODE` | `MODE=app` under `--mode app` |

Read from the source, not measured: the dev server's file watcher ignores `.svelte-kit/!(generated)` only (`node_modules/@sveltejs/kit/src/exports/vite/index.js:340-344`), so `build-app/` and `.svelte-kit-app/` are folders it watches like any other of the root; two starts of the app under two `HOME`s each take a lock of their own (`src/desktop/app.ts:62-65`, `userData` follows `HOME`) and share the two app folders.

## Anything wrong or impossible in the brief

- Item 1 and decision 2 said no environment variable is needed, and item 2 said the app build prints no tsconfig warning. The two rulings replace both sentences, as written under "Rulings acknowledged".
- `spec.md:97`'s gate names `bin` in its `find`, and this tree has no `bin`; `find` prints its error on stderr and the gate prints nothing, as it should.
- The brief's case 9 script is mine, and the comparison it prints against a lone build needed the folder names, the version stamp and the content hashes normalized, because two builds of the same tree never share content hashes. That normalization is in `compare-builds.mjs` above; `diff -rq build build-app` alone lists 201 lines for the same pair of builds.

## State of the tree

- The runs rewrote `build/`, `.svelte-kit/`, `build-app/` and `.svelte-kit-app/` in the worktree, all gitignored; the last write of each is the last case 9 run.
- Scratch worlds, ports, `HOME` and `TMUX_TMPDIR` are under the session scratchpad; each server run was stopped when its run ended, and the ports were free ports (60112, 60616, 60650, 60656, 60665 and others), never 8787, 8790 or 8817.
- No Electron was started, no `local.yml` was read, no git command was run, no dependency was added, and `tests/tiers/landing.mjs` was edited only in its head comment and never run.
