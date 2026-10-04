# Diagnosis: Format Document's edit is not undone by Cmd+Z

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says.

## Symptom

"Cmd+Z after Format Document on a .tex file in the oculus source editor does not undo the format (D14's look, latex.formatter: tex-fmt), though typing is undone." Open item Z427, closed in automode (a): diagnosed on TEST (localhost:8790, tab 812137347) while D37 builds.

## Where the probes run

The symptom needs the running page, so the red command runs on TEST (localhost:8790, tab 812137347), served from the main checkout at 3e3574ef9. `latex.formatter` is set to `tex-fmt` in `tools/oculus/config/behavior.yml` for the run and put back (hash before: e3bb8249). The scratch file is `zz-look-d37/probe.tex` at the hub root, removed at the cleanup. Probes change nothing on disk: each is a change made in the page's own JavaScript at run time and gone at a reload. The step's worktree is not touched. Paths redirected: none. Snapshots before: `~/.oculus/changes.jsonl` 00b23e5d (39 lines), `~/.oculus/workspaces.json` 1bf5d57a.
