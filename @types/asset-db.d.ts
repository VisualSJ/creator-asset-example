declare module '@editor/asset-db' {
    class Asset extends VirtualAsset {
        source: string;
        basename: string;
    }

    class VirtualAsset {
        extname: string;
        isDirectory(): Promise<boolean>;
        copyToLibrary(extname: string, file: string): Promise<void>;
        saveToLibrary(extname: string, content: string | Buffer): Promise<void>;
    }

    class Importer {}
}
