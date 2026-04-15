/**
 * Side Bookmark - Data Management Layer
 * Handles CRUD operations and persistence for bookmarks and folders.
 */

import type SideBookmarkPlugin from './main';
import {
	type BookmarkItem,
	type BookmarkFolder,
	type BookmarkTreeItem,
	type SideBookmarkData,
	DEFAULT_DATA,
	generateId,
} from './types';

export class BookmarkStore {
	private plugin: SideBookmarkPlugin;
	private data: SideBookmarkData;
	private listeners: Array<() => void> = [];

	constructor(plugin: SideBookmarkPlugin) {
		this.plugin = plugin;
		this.data = { ...DEFAULT_DATA };
	}

	/** Load data from Obsidian's persistent storage */
	async load(): Promise<void> {
		const saved = await this.plugin.loadData() as Partial<SideBookmarkData> | null;
		if (saved) {
			this.data = {
				...DEFAULT_DATA,
				...saved,
			};
		}
	}

	/** Save data to Obsidian's persistent storage */
	async save(): Promise<void> {
		await this.plugin.saveData(this.data);
	}

	/** Subscribe to data changes */
	onChange(listener: () => void): () => void {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	/** Notify all listeners of data changes */
	private notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	// ── Getters ──────────────────────────────────────────────

	get defaultUrl(): string {
		return this.data.defaultUrl;
	}

	set defaultUrl(url: string) {
		this.data.defaultUrl = url;
	}

	get showBookmarkPanel(): boolean {
		return this.data.showBookmarkPanel;
	}

	set showBookmarkPanel(show: boolean) {
		this.data.showBookmarkPanel = show;
	}

	get interceptLinks(): boolean {
		return this.data.interceptLinks;
	}

	set interceptLinks(value: boolean) {
		this.data.interceptLinks = value;
	}

	get bookmarks(): BookmarkItem[] {
		return this.data.bookmarks;
	}

	get folders(): BookmarkFolder[] {
		return this.data.folders;
	}

	// ── Bookmark CRUD ────────────────────────────────────────

	/** Add a new bookmark */
	async addBookmark(title: string, url: string, folderId: string | null = null): Promise<BookmarkItem> {
		const siblings = this.data.bookmarks.filter(b => b.folderId === folderId);
		const maxOrder = siblings.length > 0
			? Math.max(...siblings.map(b => b.order))
			: -1;

		const bookmark: BookmarkItem = {
			id: generateId(),
			type: 'bookmark',
			title,
			url,
			folderId,
			order: maxOrder + 1,
		};
		this.data.bookmarks.push(bookmark);
		await this.save();
		this.notify();
		return bookmark;
	}

	/** Remove a bookmark by ID */
	async removeBookmark(id: string): Promise<void> {
		this.data.bookmarks = this.data.bookmarks.filter(b => b.id !== id);
		await this.save();
		this.notify();
	}

	/** Update a bookmark's properties */
	async updateBookmark(id: string, updates: Partial<Omit<BookmarkItem, 'id' | 'type'>>): Promise<void> {
		const bookmark = this.data.bookmarks.find(b => b.id === id);
		if (bookmark) {
			Object.assign(bookmark, updates);
			await this.save();
			this.notify();
		}
	}

	/** Move a bookmark to a different folder */
	async moveBookmark(id: string, targetFolderId: string | null): Promise<void> {
		await this.updateBookmark(id, { folderId: targetFolderId });
	}

	// ── Folder CRUD ──────────────────────────────────────────

	/** Add a new folder */
	async addFolder(name: string, parentId: string | null = null): Promise<BookmarkFolder> {
		const siblings = this.data.folders.filter(f => f.parentId === parentId);
		const maxOrder = siblings.length > 0
			? Math.max(...siblings.map(f => f.order))
			: -1;

		const folder: BookmarkFolder = {
			id: generateId(),
			type: 'folder',
			name,
			parentId,
			collapsed: false,
			order: maxOrder + 1,
		};
		this.data.folders.push(folder);
		await this.save();
		this.notify();
		return folder;
	}

	/** Remove a folder and all its contents (bookmarks + sub-folders) recursively */
	async removeFolder(id: string): Promise<void> {
		// Collect all descendant folder IDs
		const descendantIds = this.getDescendantFolderIds(id);
		const allFolderIds = [id, ...descendantIds];

		// Remove all bookmarks in these folders
		this.data.bookmarks = this.data.bookmarks.filter(
			b => !allFolderIds.includes(b.folderId ?? '')
		);

		// Remove all folders
		this.data.folders = this.data.folders.filter(
			f => !allFolderIds.includes(f.id)
		);

		await this.save();
		this.notify();
	}

	/** Update a folder's properties */
	async updateFolder(id: string, updates: Partial<Omit<BookmarkFolder, 'id' | 'type'>>): Promise<void> {
		const folder = this.data.folders.find(f => f.id === id);
		if (folder) {
			Object.assign(folder, updates);
			await this.save();
			this.notify();
		}
	}

	/** Toggle a folder's collapsed state */
	async toggleFolder(id: string): Promise<void> {
		const folder = this.data.folders.find(f => f.id === id);
		if (folder) {
			folder.collapsed = !folder.collapsed;
			await this.save();
			this.notify();
		}
	}

	// ── Query Methods ────────────────────────────────────────

	/** Get all bookmarks in a specific folder */
	getBookmarksByFolder(folderId: string | null): BookmarkItem[] {
		return this.data.bookmarks
			.filter(b => b.folderId === folderId)
			.sort((a, b) => a.order - b.order);
	}

	/** Get all sub-folders of a specific parent folder */
	getSubFolders(parentId: string | null): BookmarkFolder[] {
		return this.data.folders
			.filter(f => f.parentId === parentId)
			.sort((a, b) => a.order - b.order);
	}

	/** Get a folder by ID */
	getFolder(id: string): BookmarkFolder | undefined {
		return this.data.folders.find(f => f.id === id);
	}

	/** Get a bookmark by ID */
	getBookmark(id: string): BookmarkItem | undefined {
		return this.data.bookmarks.find(b => b.id === id);
	}

	/** Get tree structure items for a given parent */
	getTreeItems(parentId: string | null): BookmarkTreeItem[] {
		const folders = this.getSubFolders(parentId);
		const bookmarks = this.getBookmarksByFolder(parentId);
		const items: BookmarkTreeItem[] = [...folders, ...bookmarks];
		return items.sort((a, b) => a.order - b.order);
	}

	/** Check if a bookmark with the same URL already exists */
	hasBookmarkWithUrl(url: string): boolean {
		return this.data.bookmarks.some(b => b.url === url);
	}

	// ── Private Helpers ──────────────────────────────────────

	/** Recursively get all descendant folder IDs */
	private getDescendantFolderIds(folderId: string): string[] {
		const children = this.data.folders.filter(f => f.parentId === folderId);
		const ids: string[] = [];
		for (const child of children) {
			ids.push(child.id);
			ids.push(...this.getDescendantFolderIds(child.id));
		}
		return ids;
	}
}
