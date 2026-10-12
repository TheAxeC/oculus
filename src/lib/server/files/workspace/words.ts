// Layer 2, server. The words of the open workspace's findings: each finding the reader of the
// workspace file raised (`findings.workspace.*` of config/text/findings.yml) as the file, key and
// sentence every other config finding is shown in.

import { findingText, type TextCatalog } from '../../../data/helpers/finding-text.ts';
import type { Finding } from '../../../data/model/index.ts';
import type { OpenWorkspace } from './open.ts';

/** The findings of the open workspace, worded from the text catalog. */
export function workspaceFindings(open: OpenWorkspace, text: TextCatalog): Finding[] {
    return open.findings.map((one) => ({
        file: one.file,
        key: one.key,
        message: findingText(text, one.id, ...one.args)
    }));
}
