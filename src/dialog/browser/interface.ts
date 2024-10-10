/*

Dialog interfaces for the browser
=================================

Copyright (c) 2024 Dannii Willis
MIT licenced
https://github.com/curiousdannii/asyncglk

*/

import type {AsyncDialog} from '../common/interface.js'

export type ProgressCallback = (bytes: number) => void

export interface BrowserDialog extends AsyncDialog {
    download(url: string, progress_callback?: ProgressCallback): Promise<string>
    upload(file: File): Promise<string>
}

export interface DownloadOptions {
    /** Domains to access directly: should always have both Access-Control-Allow-Origin and compression headers */
    direct_domains: string[],
    /** URL of Proxy */
    proxy_url: string,
    /** Disable the file proxy, which may mean that some files can't be loaded */
    use_proxy?: boolean | number,
}

/** A provider handles part of the filesystem, and can cascade down to another provider for files it doesn't handle */
export interface Provider {
    /** Whether we can browse this provider */
    browseable: boolean
    /** A link to the next provider */
    next: Provider
    /** Delete a file */
    delete(path: string): Promise<void | null>
    /** Check if a file exists */
    exists(path: string): Promise<boolean | null>
    /** Read a file */
    read(path: string): Promise<Uint8Array | null>
    /** Write a file */
    write(path: string, data: Uint8Array): Promise<void | null>
}

/** A Provider with a few extra functions for browsing */
export interface BrowseableProvider extends Provider {
    /** Get all file metadata */
    metadata(): Promise<FilesMetadata>
    /** Rename a file or folder */
    rename(dir: boolean, path: string, new_name: string): Promise<void>
}

export interface DirEntry {
    dir: boolean
    full_path: string
    meta?: FileData
    name: string
}

export type FilesMetadata = Record<string, FileData>

export interface FileData {
    atime: number
    etag?: string
    'last-modified'?: string
    mtime: number
    path_prefix?: string
    story_id?: string
}