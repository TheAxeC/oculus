// Layer 2, client state. What the page reads of the cluster setup endpoint's answers
// (POST /api/clusters): the clusters of `slurm.resource` with this machine's rows (`read`), and
// what one step answered: its sentence, whether it was a refusal, and the fields a step adds (the
// key file made and its public key, the host's fingerprints, the public key and the access text of
// a cluster that takes no password). An answer that did not arrive or is not one of these reads as
// a refusal with the sentence that the setup could not be reached.

import { z } from 'zod';
import type { ClusterSetup } from '../../../../data/model/index.ts';
import { readAs, unchanged } from '../../../../data/shapes/shapes.ts';
import { t } from '../../../shared/words/text.ts';
export type {
    ClusterRow,
    ClusterSetup,
    ClusterSetupCluster
} from '../../../../data/model/index.ts';

/** What `ssh -G` resolved a cluster's connection to, or the line it refused it with. */
export const resolutionShape = z.union([
    z.object({
        hostname: z.string(),
        user: z.string(),
        port: z.string(),
        identityfile: z.array(z.string())
    }),
    z.object({ error: z.string() })
]);

/** The `read` answer, the body itself when it is complete. */
const setupShape = unchanged(
    z.object({
        clusters: z.array(
            z.object({
                resource: z.string(),
                name: z.string(),
                missing: z.string(),
                host: z.string(),
                user: z.string(),
                keyFile: z.string(),
                suggested: z.string(),
                keyRefused: z.string(),
                publicKey: z.string(),
                access: z.string(),
                resolution: resolutionShape.nullable()
            })
        ),
        hint: z.string(),
        keyMissing: z.string(),
        rows: z.array(
            z.object({
                resource: z.string(),
                user: z.string(),
                keyFile: z.string(),
                hub: z.string()
            })
        )
    })
) satisfies z.ZodType<ClusterSetup>;

/** The setup as the server answered it, or null for an answer that is not one. */
export function setupOf(body: unknown): ClusterSetup | null {
    return readAs(setupShape, body);
}

/** What one step answered. */
export type StepAnswer = {
    /** The sentence the section shows, empty when the step has none. */
    said: string;
    refused: boolean;
    /** The key file Make key made or found, and the one line of the `.pub` beside it. */
    path?: string;
    publicKey?: string;
    /** Whether `known_hosts` holds the host. */
    known?: boolean;
    /** The host's SHA256 fingerprints to confirm. */
    fingerprints?: string[];
    /** A cluster that takes no password: the public key to copy and the cluster's access text. */
    noPassword?: { publicKey: string; access: string };
    /** Whether a row write changed the file. */
    saved?: boolean;
};

const stepShape = z.object({
    refused: z.string().optional(),
    said: z.string().optional(),
    path: z.string().optional(),
    known: z.boolean().optional(),
    fingerprints: z.array(z.string()).optional(),
    noPassword: z.literal(true).optional(),
    publicKey: z.string().optional(),
    access: z.string().optional(),
    saved: z.boolean().optional()
});

/** One step's answer as the page reads it. */
export function stepOf(body: unknown): StepAnswer {
    const read = readAs(stepShape, body);
    if (read === null) return { said: t('accounts.cluster_unreachable'), refused: true };
    if (read.refused !== undefined) return { said: read.refused, refused: true };
    if (
        read.path === undefined &&
        read.known === undefined &&
        read.said === undefined &&
        read.saved === undefined
    ) {
        return { said: t('accounts.cluster_unreachable'), refused: true };
    }
    return {
        said: read.said ?? '',
        refused: false,
        ...(read.path === undefined ? {} : { path: read.path }),
        ...(read.path === undefined || read.publicKey === undefined
            ? {}
            : { publicKey: read.publicKey }),
        ...(read.known === undefined ? {} : { known: read.known }),
        ...(read.fingerprints === undefined ? {} : { fingerprints: read.fingerprints }),
        ...(read.noPassword === true
            ? { noPassword: { publicKey: read.publicKey ?? '', access: read.access ?? '' } }
            : {}),
        ...(read.saved === undefined ? {} : { saved: read.saved })
    };
}
