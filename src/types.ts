/**
 * Side Bookmark - Type Definitions
 */

/** A single bookmark entry */
export interface BookmarkItem {
	id: string;
	type: 'bookmark';
	title: string;
	url: string;
	/** null means root level (no folder) */
	folderId: string | null;
	order: number;
}

/** A bookmark folder that can contain bookmarks or sub-folders */
export interface BookmarkFolder {
	id: string;
	type: 'folder';
	name: string;
	/** null means root level */
	parentId: string | null;
	collapsed: boolean;
	order: number;
}

/** Union type for tree rendering */
export type BookmarkTreeItem = BookmarkItem | BookmarkFolder;

/** Plugin persistent data */
export interface SideBookmarkData {
	bookmarks: BookmarkItem[];
	folders: BookmarkFolder[];
	defaultUrl: string;
	showBookmarkPanel: boolean;
}

/** Default data for first-time plugin load */
export const DEFAULT_DATA: SideBookmarkData = {
	bookmarks: [],
	folders: [],
	defaultUrl: 'https://www.google.com',
	showBookmarkPanel: true,
};

/** View type constant */
export const VIEW_TYPE_SIDE_BOOKMARK = 'side-bookmark-view';

/** Generate a unique ID */
export function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
