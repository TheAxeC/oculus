// Layer 2, server. The types of write-file-atomic 8, which ships none of its own: the default
// export and its `sync`, the one call json.ts makes, with the data a string or any typed array.
// @types/write-file-atomic declares the data as a string or a Buffer, which the Uint8Array of an
// uploaded picture is not, so this declares the package as its version 8 reads its arguments.

declare module 'write-file-atomic' {
    /** The options of one write; each has the default named beside it when it is left out. */
    type Options = {
        /** The owner of the written file: the existing file's owner. */
        chown?: { uid: number; gid: number };
        /** The encoding of string data: utf8. It is not read for a typed array. */
        encoding?: BufferEncoding | null;
        /** Whether the temporary file is flushed to disk before the rename: true. */
        fsync?: boolean;
        /** The permission bits: the existing file's; a mode passed here replaces them. */
        mode?: number;
        /** Called with the temporary file's name once it is made. */
        tmpfileCreated?: (name: string) => void;
    };

    /** Write a file whole, by a temporary file beside it and a rename, settled once renamed. */
    function writeFileAtomic(
        filename: string,
        data: string | NodeJS.ArrayBufferView,
        options?: Options | BufferEncoding
    ): Promise<void>;

    namespace writeFileAtomic {
        /** The same write, synchronously; it throws what the write threw. */
        function sync(
            filename: string,
            data: string | NodeJS.ArrayBufferView,
            options?: Options | BufferEncoding
        ): void;
    }

    export = writeFileAtomic;
}
