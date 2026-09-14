#!/bin/sh
# Exercise the landing helper in isolated repositories for clean and conflicting changes.

set -u

PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH
export PATH

fail() {
    printf 'FAIL: %s\n' "$1" >&2
    exit 1
}

assert_contains() {
    assert_value=$1
    assert_expected=$2
    assert_label=$3
    case "$assert_value" in
        *"$assert_expected"*)
            ;;
        *)
            fail "$assert_label: missing [$assert_expected]"
            ;;
    esac
}

test_root=$(mktemp -d "${TMPDIR:-/tmp}/oculus-land-test.XXXXXX") || fail "could not create scratch directory"
trap 'rm -rf "$test_root"' 0 1 2 3 15
script_dir=$(CDPATH= cd "$(dirname "$0")" && pwd -P)
land_script=$script_dir/land.sh

write_tool_stub() {
    stub_root=$1
    mkdir -p "$stub_root/tools/oculus/src" "$stub_root/tools/oculus/tests" "$stub_root/tools/oculus/bin" "$stub_root/tools/oculus/config"
    printf 'source\n' >"$stub_root/tools/oculus/src/source.txt"
    printf 'test\n' >"$stub_root/tools/oculus/tests/test.txt"
    printf 'bin\n' >"$stub_root/tools/oculus/bin/bin.txt"
    printf 'config\n' >"$stub_root/tools/oculus/config/config.txt"
    cat >"$stub_root/tools/oculus/package.json" <<'JSON'
{
    "name": "landing-test",
    "private": true,
    "scripts": {
        "test": "echo test-stub",
        "check": "echo check-stub",
        "build": "echo build-stub",
        "format:check": "echo format-stub",
        "lint": "echo lint-stub",
        "test:browser": "echo browser-stub"
    }
}
JSON
}

initialise_repo() {
    repo_root=$1
    mkdir -p "$repo_root"
    write_tool_stub "$repo_root"
    (
        cd "$repo_root" || exit 1
        git init -q -b main
        git config user.name "Landing Test"
        git config user.email "landing-test@example.invalid"
        git add tools/oculus
        git commit -q -m "Initial fixture"
        mkdir -p .agents/worktrees
    ) || fail "could not initialise scratch repository"
}

write_events() {
    runs_root=$1
    mkdir -p "$runs_root"
    cat >"$runs_root/events.jsonl" <<'JSONL'
{"type":"turn.completed","usage":{"input_tokens":100,"cached_input_tokens":50,"output_tokens":10,"reasoning_output_tokens":3}}
{"type":"item.completed","item":{"type":"command_execution"}}
{"type":"turn.completed","usage":{"input_tokens":200,"cached_input_tokens":100,"output_tokens":20,"reasoning_output_tokens":4}}
{"type":"item.completed","item":{"type":"command_execution"}}
JSONL
    cat >"$runs_root/repair-events.jsonl" <<'JSONL'
{"type":"turn.completed","usage":{"input_tokens":10,"cached_input_tokens":5,"output_tokens":1,"reasoning_output_tokens":1}}
{"type":"turn.completed","usage":{"input_tokens":20,"cached_input_tokens":10,"output_tokens":2,"reasoning_output_tokens":1}}
{"type":"item.completed","item":{"type":"command_execution"}}
JSONL
    cat >"$runs_root/review-events.jsonl" <<'JSONL'
{"type":"turn.completed","usage":{"input_tokens":5,"cached_input_tokens":2,"output_tokens":1,"reasoning_output_tokens":1}}
{"type":"turn.completed","usage":{"input_tokens":15,"cached_input_tokens":8,"output_tokens":1,"reasoning_output_tokens":1}}
{"type":"item.completed","item":{"type":"command_execution"}}
JSONL
    cat >"$runs_root/review-events-2.jsonl" <<'JSONL'
{"type":"turn.completed","usage":{"input_tokens":10,"cached_input_tokens":5,"output_tokens":1,"reasoning_output_tokens":1}}
{"type":"turn.completed","usage":{"input_tokens":20,"cached_input_tokens":10,"output_tokens":2,"reasoning_output_tokens":1}}
{"type":"item.completed","item":{"type":"command_execution"}}
JSONL
    : >"$runs_root/pid.txt"
    : >"$runs_root/exit.txt"
    : >"$runs_root/repair-pid.txt"
    : >"$runs_root/repair-exit.txt"
    : >"$runs_root/review-pid.txt"
    : >"$runs_root/review-exit.txt"
    : >"$runs_root/review-pid-2.txt"
    : >"$runs_root/review-exit-2.txt"
    touch -t 202609140100.00 "$runs_root/pid.txt"
    touch -t 202609140101.05 "$runs_root/exit.txt"
    touch -t 202609140200.00 "$runs_root/repair-pid.txt"
    touch -t 202609140200.10 "$runs_root/repair-exit.txt"
    touch -t 202609140300.00 "$runs_root/review-pid.txt"
    touch -t 202609140300.20 "$runs_root/review-exit.txt"
    touch -t 202609140400.00 "$runs_root/review-pid-2.txt"
    touch -t 202609140400.30 "$runs_root/review-exit-2.txt"
}

clean_repo=$test_root/clean
initialise_repo "$clean_repo"
clean_base=$(cd "$clean_repo" && git rev-parse HEAD) || fail "could not read clean base"
(
    cd "$clean_repo" || exit 1
    git worktree add -q -b clean .agents/worktrees/clean "$clean_base"
) || fail "could not create clean worktree"
printf 'committed\n' >"$clean_repo/.agents/worktrees/clean/tools/oculus/committed.txt"
(
    cd "$clean_repo/.agents/worktrees/clean" || exit 1
    git add tools/oculus/committed.txt
    git commit -q -m wip
) || fail "could not create clean package commit"
printf 'pending\n' >"$clean_repo/.agents/worktrees/clean/tools/oculus/pending.txt"
clean_runs=$test_root/clean-runs
write_events "$clean_runs"

(
    cd "$clean_repo" || exit 1
    sh "$land_script" clean "$clean_base" "$clean_runs" --no-browser
) >"$test_root/clean.out" 2>&1
clean_status=$?
clean_output=$(cat "$test_root/clean.out")
if [ "$clean_status" -ne 0 ]; then
    printf '%s\n' "$clean_output" >&2
    fail "clean landing exited $clean_status, expected 0"
fi

clean_staged=$(cd "$clean_repo" && git diff --cached --name-only) || fail "could not read clean staged paths"
clean_expected=$(printf '%s\n%s' 'tools/oculus/committed.txt' 'tools/oculus/pending.txt')
if [ "$clean_staged" != "$clean_expected" ]; then
    fail "clean staged paths differ: [$clean_staged]"
fi
assert_contains "$clean_output" "clean, worker codex:gpt-5.6-sol at high, first run: 300 in / 150 cached / 30 out (7 reasoning), 2 items, 65 s (01:00:00 to 01:01:05); repair round on the same thread: 30 in / 15 cached / 3 out (2 reasoning), 1 items, 10 s; +2 -0 over 2 files; first report passed its bar: <yes or no>; <N> fixes at landing" "worker row"
assert_contains "$clean_output" "clean, reviewer codex:gpt-5.6-sol at high, read-only: first review 20 in / 10 cached / 2 out, 1 items, 20 s; second review 30 in / 15 cached / 3 out, 1 items, 30 s" "reviewer row"
assert_contains "$clean_output" "tools/oculus/committed.txt" "booking paths"
assert_contains "$clean_output" "tools/oculus/pending.txt" "booking paths"
printf 'clean: exit 0, staged paths and usage rows verified\n'

conflict_repo=$test_root/conflict
initialise_repo "$conflict_repo"
printf 'base\n' >"$conflict_repo/tools/oculus/conflict.txt"
(
    cd "$conflict_repo" || exit 1
    git add tools/oculus/conflict.txt
    git commit -q -m "Add conflict fixture"
) || fail "could not add conflict fixture"
conflict_base=$(cd "$conflict_repo" && git rev-parse HEAD) || fail "could not read conflict base"
(
    cd "$conflict_repo" || exit 1
    git worktree add -q -b conflict .agents/worktrees/conflict "$conflict_base"
) || fail "could not create conflict worktree"
printf 'package\n' >"$conflict_repo/.agents/worktrees/conflict/tools/oculus/conflict.txt"
(
    cd "$conflict_repo/.agents/worktrees/conflict" || exit 1
    git add tools/oculus/conflict.txt
    git commit -q -m wip
) || fail "could not create conflicting package commit"
printf 'pending\n' >"$conflict_repo/.agents/worktrees/conflict/tools/oculus/pending.txt"
printf 'main\n' >"$conflict_repo/tools/oculus/conflict.txt"
(
    cd "$conflict_repo" || exit 1
    git add tools/oculus/conflict.txt
    git commit -q -m "Change main fixture"
) || fail "could not create conflicting main commit"
conflict_runs=$test_root/conflict-runs
mkdir -p "$conflict_runs"

(
    cd "$conflict_repo" || exit 1
    sh "$land_script" conflict "$conflict_base" "$conflict_runs" --no-browser
) >"$test_root/conflict.out" 2>&1
conflict_status=$?
conflict_output=$(cat "$test_root/conflict.out")
if [ "$conflict_status" -ne 2 ]; then
    printf '%s\n' "$conflict_output" >&2
    fail "conflict landing exited $conflict_status, expected 2"
fi
assert_contains "$conflict_output" "worktree git cherry-pick failed" "conflict step"
assert_contains "$conflict_output" "Conflicting paths:" "conflict heading"
assert_contains "$conflict_output" "tools/oculus/conflict.txt" "conflict path"
conflict_branch=$(cd "$conflict_repo/.agents/worktrees/conflict" && git branch --show-current) || fail "could not read conflict branch"
if [ "$conflict_branch" != "conflict-land" ]; then
    fail "conflict worktree is on $conflict_branch, expected conflict-land"
fi
printf 'conflict: exit 2, conflicting path and retained landing branch verified\n'
printf 'PASS: land.sh scratch repository tests\n'
