// Layer 1, data. Drops the keys of an object whose value is undefined, so an object the snapshot
// builds survives a JSON round trip unchanged and a field that is absent stays absent.

/** Drop the keys whose value is undefined, so the object survives JSON round-tripping unchanged. */
export function compact<T extends object>(value: T): T {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
        if (record[key] === undefined) delete record[key];
    }
    return value;
}
