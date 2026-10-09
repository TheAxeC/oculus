// Layer 2, client state. The answers of POST /api/lint, read through zod before the store holds
// them: a body that does not read is the linter having failed, never a throw.

import { z } from 'zod';
import type { LintAnswer, LintConfig, LintFolderAnswer } from '../../../../data/model/index.ts';

const edit = z.object({
    line: z.number().int(),
    column: z.number().int(),
    endLine: z.number().int(),
    endColumn: z.number().int(),
    text: z.string()
});

const fix = z.object({
    kind: z.enum(['fix', 'suggestion']),
    title: z.string(),
    edits: z.array(edit)
});

const row = z.object({
    line: z.number().int(),
    column: z.number().int(),
    endLine: z.number().int(),
    endColumn: z.number().int(),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    code: z.string().optional(),
    href: z.string().optional(),
    noqa: z.number().int().optional(),
    fixes: z.array(fix)
});

/** A run's answer: the file's rows with their hash, or the state the linter gave none in. */
export const lintAnswerShape = z.union([
    z.object({ ok: z.literal(true), rows: z.array(row), hash: z.string() }),
    z.object({
        ok: z.literal(false),
        state: z.enum(['not_found', 'failed', 'timeout', 'not_approved', 'no_config', 'off']),
        reason: z.string().optional()
    })
]) satisfies z.ZodType<LintAnswer>;

/**
 * The answer to `config`, `approve` and `revoke`: the ESLint configuration of the file, or none.
 */
export const lintConfigShape = z.object({
    ok: z.literal(true),
    config: z
        .object({ files: z.array(z.string()), approved: z.boolean(), key: z.string() })
        .nullable()
}) satisfies z.ZodType<{ ok: true; config: LintConfig | null }>;

const position = z.object({ line: z.number().int(), character: z.number().int() });

/** The answer to the action `folder`: the files the writing rules can fix, or why not. */
export const lintFolderShape = z.union([
    z.object({
        ok: z.literal(true),
        files: z.array(
            z.object({
                path: z.string(),
                hash: z.string(),
                count: z.number().int(),
                edits: z.array(
                    z.object({
                        range: z.object({ start: position, end: position }),
                        newText: z.string()
                    })
                ),
                reason: z.string().optional()
            })
        )
    }),
    z.object({ ok: z.literal(false), reason: z.string() })
]) satisfies z.ZodType<LintFolderAnswer>;
