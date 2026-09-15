#!/bin/sh
# Run a reviewed package through the plan-specific landing checks and print its booking data.

set -u

PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
export PATH

usage() {
    printf 'Usage: %s <pkg> <base> <runs dir> [--no-browser]\n' "$0" >&2
    exit 64
}

fail() {
    printf '%s\n' "$1" >&2
    exit "${2:-1}"
}

if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
    usage
fi

landing_pkg=$1
landing_base=$2
landing_runs=$3
landing_browser=1

case "$landing_pkg" in
    '' | *[!A-Za-z0-9._-]*)
        fail "arguments failed: invalid package name: $landing_pkg" 64
        ;;
esac

case "$landing_base" in
    '' | *[!A-Fa-f0-9]*)
        fail "arguments failed: base must be a hexadecimal commit id" 64
        ;;
esac

if [ "$#" -eq 4 ]; then
    if [ "$4" != "--no-browser" ]; then
        usage
    fi
    landing_browser=0
fi

landing_root=$(pwd -P)
landing_worktree=$landing_root/.agents/worktrees/$landing_pkg
landing_tool=$landing_root/tools/oculus

if [ ! -d "$landing_root/.git" ]; then
    fail "preflight failed: run this script from the repository root"
fi
if [ ! -d "$landing_worktree" ]; then
    fail "preflight failed: worktree not found: $landing_worktree"
fi
if [ ! -d "$landing_tool" ]; then
    fail "preflight failed: tool directory not found: $landing_tool"
fi
if [ ! -d "$landing_runs" ]; then
    fail "preflight failed: runs directory not found: $landing_runs"
fi

landing_tmp=$(mktemp -d "${TMPDIR:-/tmp}/oculus-land.XXXXXX") || fail "preflight failed: could not create a temporary directory"
trap 'rm -rf "$landing_tmp"' 0 1 2 3 15
landing_output=$landing_tmp/output.txt

resolve_git_dir() {
    landing_resolve_root=$1
    if [ -d "$landing_resolve_root/.git" ]; then
        printf '%s\n' "$landing_resolve_root/.git"
        return 0
    fi
    if [ ! -f "$landing_resolve_root/.git" ]; then
        return 1
    fi
    landing_resolve_value=$(sed -n 's/^gitdir: //p' "$landing_resolve_root/.git")
    case "$landing_resolve_value" in
        /*)
            printf '%s\n' "$landing_resolve_value"
            ;;
        *)
            (CDPATH= cd "$landing_resolve_root" && CDPATH= cd "$landing_resolve_value" && pwd -P)
            ;;
    esac
}

git_process_alive() {
    if command -v pgrep >/dev/null 2>&1; then
        pgrep -x git >/dev/null 2>&1
        return $?
    fi
    ps -ax -o comm= 2>/dev/null | awk '
        {
            count = split($0, parts, "/")
            if (parts[count] == "git") {
                found = 1
            }
        }
        END { exit found ? 0 : 1 }
    '
}

wait_for_index() {
    landing_wait_root=$1
    landing_git_dir=$(resolve_git_dir "$landing_wait_root") || fail "index lock failed: cannot resolve .git for $landing_wait_root"
    landing_lock=$landing_git_dir/index.lock
    landing_announced=0
    while [ -e "$landing_lock" ]; do
        landing_age=$(node -e 'const fs = require("fs"); const age = Math.floor((Date.now() - fs.statSync(process.argv[1]).mtimeMs) / 1000); process.stdout.write(String(age));' "$landing_lock" 2>/dev/null || printf '0')
        if [ "$landing_age" -gt 60 ] && ! git_process_alive; then
            rm -f "$landing_lock" || fail "index lock failed: cannot remove stale lock: $landing_lock"
            continue
        fi
        if [ "$landing_announced" -eq 0 ]; then
            printf 'index lock: waiting for %s\n' "$landing_lock"
            landing_announced=1
        fi
        sleep 1
    done
}

run_step() {
    landing_step=$1
    shift
    "$@" >"$landing_output" 2>&1
    landing_status=$?
    if [ -s "$landing_output" ]; then
        cat "$landing_output"
    fi
    if [ "$landing_status" -ne 0 ]; then
        printf '%s failed\n' "$landing_step" >&2
        exit "$landing_status"
    fi
}

landing_main_branch=$(git branch --show-current 2>"$landing_output")
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "preflight failed: cannot read the main checkout branch"
fi
if [ "$landing_main_branch" != "main" ]; then
    fail "preflight failed: repository root is on $landing_main_branch, expected main"
fi

landing_worktree_branch=$(cd "$landing_worktree" && git branch --show-current 2>"$landing_output")
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "preflight failed: cannot read the package worktree branch"
fi
if [ "$landing_worktree_branch" != "$landing_pkg" ]; then
    fail "preflight failed: package worktree is on $landing_worktree_branch, expected $landing_pkg"
fi

wait_for_index "$landing_worktree"
run_step "worktree git add" sh -c 'cd "$1" && git add -A tools/oculus' land "$landing_worktree"

wait_for_index "$landing_worktree"
run_step "worktree git commit" sh -c 'cd "$1" && git commit -q -m wip' land "$landing_worktree"

wait_for_index "$landing_worktree"
run_step "worktree git checkout" sh -c 'cd "$1" && git checkout -b "$2-land" main' land "$landing_worktree" "$landing_pkg"

wait_for_index "$landing_worktree"
(cd "$landing_worktree" && git cherry-pick "$landing_base..$landing_pkg") >"$landing_output" 2>&1
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    if [ -s "$landing_output" ]; then
        cat "$landing_output" >&2
    fi
    printf 'worktree git cherry-pick failed\n' >&2
    landing_conflicts=$(cd "$landing_worktree" && git diff --name-only --diff-filter=U)
    if [ -z "$landing_conflicts" ]; then
        exit "$landing_status"
    fi
    printf 'Conflicting paths:\n' >&2
    printf '%s\n' "$landing_conflicts" >&2
    exit 2
fi
if [ -s "$landing_output" ]; then
    cat "$landing_output"
fi

wait_for_index "$landing_root"
run_step "main git cherry-pick" git cherry-pick -n "main..$landing_pkg-land"
# A package that changed the lockfile brings a dependency main does not hold yet, so the checks
# would fail on a missing package rather than on the package's own work.
if git diff --cached --name-only | grep -qx "tools/oculus/package-lock.json"; then
    run_step "main npm ci" sh -c 'cd "$1" && npm ci --silent' sh "$landing_tool"
fi

(cd "$landing_tool" && npm test -- --reporter=dot) >"$landing_output" 2>&1
landing_status=$?
if [ -s "$landing_output" ]; then
    cat "$landing_output"
fi
if [ "$landing_status" -ne 0 ]; then
    fail "npm test -- --reporter=dot failed" "$landing_status"
fi

run_step "npm run check" sh -c 'cd "$1" && npm run check' land "$landing_tool"
run_step "npm run build" sh -c 'cd "$1" && npm run build' land "$landing_tool"
run_step "npm run format:check" sh -c 'cd "$1" && npm run format:check' land "$landing_tool"
run_step "npm run lint" sh -c 'cd "$1" && npm run lint' land "$landing_tool"

# ASCII in every authored file; under config/ an accented Latin letter (UTF-8 C3 xx, a real name such
# as Linköping) is allowed, everywhere else nothing outside printable ASCII is.
(cd "$landing_tool" && LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)) >"$landing_output" 2>&1
landing_status=$?
if [ "$landing_status" -ne 0 ] || [ -s "$landing_output" ]; then
    cat "$landing_output" >&2
    fail "ASCII check failed" "$landing_status"
fi

run_step "source line counts" sh -c 'cd "$1" && find src tests config bin -type f | xargs wc -l | sort -rn | head -3' land "$landing_tool"

if [ "$landing_browser" -eq 1 ]; then
    node -e '
        const net = require("net");
        const server = net.createServer();
        server.once("error", (error) => {
            console.error(error.message);
            process.exit(1);
        });
        server.listen(8792, "127.0.0.1", () => server.close(() => process.exit(0)));
    ' >"$landing_output" 2>&1
    landing_status=$?
    if [ "$landing_status" -ne 0 ]; then
        printf 'port check failed: 8792 is not free\n' >&2
        if [ -s "$landing_output" ]; then
            cat "$landing_output" >&2
        fi
        exit 3
    fi
    run_step "npm run test:browser" sh -c 'cd "$1" && npm run test:browser' land "$landing_tool"
fi

landing_range=$landing_base..$landing_pkg
git diff --stat "$landing_range" >"$landing_tmp/diff-stat.txt" 2>"$landing_output"
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "booking diff stat failed" "$landing_status"
fi

git diff --numstat "$landing_range" >"$landing_tmp/diff-numstat.txt" 2>"$landing_output"
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "booking diff counts failed" "$landing_status"
fi
landing_counts=$(awk '{ additions += ($1 == "-" ? 0 : $1); deletions += ($2 == "-" ? 0 : $2); files += 1 } END { printf "%d|%d|%d", additions, deletions, files }' "$landing_tmp/diff-numstat.txt")
landing_additions=$(printf '%s' "$landing_counts" | cut -d '|' -f 1)
landing_deletions=$(printf '%s' "$landing_counts" | cut -d '|' -f 2)
landing_files=$(printf '%s' "$landing_counts" | cut -d '|' -f 3)

git diff --cached --name-only >"$landing_tmp/staged-paths.txt" 2>"$landing_output"
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "booking staged paths failed" "$landing_status"
fi

node - "$landing_pkg" "$landing_runs" "$landing_additions" "$landing_deletions" "$landing_files" >"$landing_tmp/usage.txt" 2>"$landing_output" <<'NODE'
const fs = require("fs");
const path = require("path");

const [pkg, runsDir, additions, deletions, files] = process.argv.slice(2);

function requiredFiles(prefix) {
    return {
        events: path.join(runsDir, `${prefix}events.jsonl`),
        pid: path.join(runsDir, `${prefix}pid.txt`),
        exit: path.join(runsDir, `${prefix}exit.txt`),
    };
}

function secondReviewFiles() {
    return {
        events: path.join(runsDir, "review-events-2.jsonl"),
        pid: path.join(runsDir, "review-pid-2.txt"),
        exit: path.join(runsDir, "review-exit-2.txt"),
    };
}

function existsAny(files) {
    return Object.values(files).some((file) => fs.existsSync(file));
}

function requireAll(files, label) {
    for (const file of Object.values(files)) {
        if (!fs.existsSync(file)) {
            throw new Error(`${label} is incomplete: missing ${file}`);
        }
    }
}

function readUsage(files, label) {
    requireAll(files, label);
    const totals = {
        input: 0,
        cached: 0,
        output: 0,
        reasoning: 0,
        items: 0,
    };
    const lines = fs.readFileSync(files.events, "utf8").split(/\r?\n/).filter(Boolean);
    for (const [index, line] of lines.entries()) {
        let event;
        try {
            event = JSON.parse(line);
        } catch (error) {
            throw new Error(`${label} has invalid JSON on line ${index + 1}: ${error.message}`);
        }
        if (event.type === "turn.completed") {
            const usage = event.usage || {};
            totals.input += Number(usage.input_tokens || 0);
            totals.cached += Number(usage.cached_input_tokens || 0);
            totals.output += Number(usage.output_tokens || 0);
            totals.reasoning += Number(usage.reasoning_output_tokens || 0);
        }
        if (event.type === "item.completed") {
            totals.items += 1;
        }
    }
    const startMs = fs.statSync(files.pid).mtimeMs;
    const endMs = fs.statSync(files.exit).mtimeMs;
    if (endMs < startMs) {
        throw new Error(`${label} exit time precedes its pid time`);
    }
    totals.seconds = Math.round((endMs - startMs) / 1000);
    totals.start = Math.round(startMs / 1000);
    totals.end = Math.round(endMs / 1000);
    return totals;
}

function integer(value) {
    return value.toLocaleString("en-US");
}

function clock(epoch) {
    const date = new Date(epoch * 1000);
    return [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function workerPart(label, usage, withClock) {
    const time = withClock ? ` (${clock(usage.start)} to ${clock(usage.end)})` : "";
    return `${label}: ${integer(usage.input)} in / ${integer(usage.cached)} cached / ${integer(usage.output)} out (${integer(usage.reasoning)} reasoning), ${integer(usage.items)} items, ${integer(usage.seconds)} s${time}`;
}

function reviewerPart(label, usage) {
    return `${label} ${integer(usage.input)} in / ${integer(usage.cached)} cached / ${integer(usage.output)} out, ${integer(usage.items)} items, ${integer(usage.seconds)} s`;
}

// A worker or reviewer launched through the runner's Agent tool leaves no event log: its tokens,
// tool uses and seconds come from the runner's result, and its row is written by hand from them.
const firstFiles = requiredFiles("");
const repairFiles = requiredFiles("repair-");
const reviewFiles = requiredFiles("review-");
const reviewTwoFiles = secondReviewFiles();
const tail = `; +${additions} -${deletions} over ${files} files; first report passed its bar: <yes or no>; <N> fixes at landing`;

let worker;
if (existsAny(firstFiles)) {
    worker = `${pkg}, worker codex:gpt-5.6-sol at high, ${workerPart("first run", readUsage(firstFiles, "first run"), true)}`;
    if (existsAny(repairFiles)) {
        worker += `; ${workerPart("repair round on the same thread", readUsage(repairFiles, "repair round"), false)}`;
    }
} else {
    worker = `${pkg}, worker <harness:model>, first run: <tokens>, <tool uses> tool uses, <seconds> s (from the runner's result; no event log)` +
        `; repair round: <the same, or none>`;
}
worker += tail;

let reviewer;
if (existsAny(reviewFiles)) {
    reviewer = `${pkg}, reviewer codex:gpt-5.6-sol at high, read-only: ${reviewerPart("first review", readUsage(reviewFiles, "first review"))}`;
    if (existsAny(reviewTwoFiles)) {
        reviewer += `; ${reviewerPart("second review", readUsage(reviewTwoFiles, "second review"))}`;
    }
} else {
    reviewer = `${pkg}, reviewer <harness:model>, read-only: first review <tokens> / <tool uses> / <seconds> s; second review <the same, or none> (from the runner's result; no event log)`;
}

console.log(worker);
console.log(reviewer);
NODE
landing_status=$?
if [ "$landing_status" -ne 0 ]; then
    cat "$landing_output" >&2
    fail "booking usage failed" "$landing_status"
fi

printf '%s\n' '=== booking ==='
printf 'Diff stat against %s:\n' "$landing_base"
cat "$landing_tmp/diff-stat.txt"
printf '%s\n' 'Usage rows:'
cat "$landing_tmp/usage.txt"
printf '%s\n' 'Staged paths:'
cat "$landing_tmp/staged-paths.txt"
printf '%s\n' '=== end booking ==='
