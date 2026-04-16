/**
 * Side Bookmark - Main View
 * The ItemView subclass registered as the right sidebar panel.
 */

import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_SIDE_BOOKMARK } from './types';
import { BrowserPanel } from './BrowserPanel';
import { BookmarkPanel } from './BookmarkPanel';
import { AddBookmarkModal } from './modals';
import type SideBookmarkPlugin from './main';

export class BookmarkView extends ItemView {
	private plugin: SideBookmarkPlugin;
	private browserPanel: BrowserPanel | null = null;
	private bookmarkPanel: BookmarkPanel | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: SideBookmarkPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_SIDE_BOOKMARK;
	}

	getDisplayText(): string {
		return 'Side bookmark';
	}

	getIcon(): string {
		return 'bookmark';
	}

	onOpen(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('sb-container');

		// Create browser panel (navigation bar + webview)
		this.browserPanel = new BrowserPanel(container);

		// Set up the "add bookmark" callback from browser panel
		this.browserPanel.onAddBookmark = (title: string, url: string) => {
			new AddBookmarkModal(
				this.app,
				this.plugin.store,
				title,
				url,
				null,
				(savedTitle: string, savedUrl: string, folderId: string | null) => {
					void this.plugin.store.addBookmark(savedTitle, savedUrl, folderId);
				}
			).open();
		};

		// Navigate to default URL
		const defaultUrl = this.plugin.store.defaultUrl;
		if (defaultUrl) {
			this.browserPanel.navigate(defaultUrl);
		}

		// Create bookmark panel
		this.bookmarkPanel = new BookmarkPanel(this.app, container, this.plugin.store);

		// Set up navigation callback from bookmark panel
		this.bookmarkPanel.onNavigate = (url: string) => {
			if (this.browserPanel) {
				this.browserPanel.navigate(url);
			}
		};

		// If bookmark panel should be collapsed by default
		if (!this.plugin.store.showBookmarkPanel) {
			this.bookmarkPanel.toggleCollapse();
		}
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		if (this.browserPanel) {
			this.browserPanel.destroy();
			this.browserPanel = null;
		}
		if (this.bookmarkPanel) {
			this.bookmarkPanel.destroy();
			this.bookmarkPanel = null;
		}
		return Promise.resolve();
	}

	/** Navigate the browser panel to a URL (used by external callers) */
	navigateTo(url: string): void {
		if (this.browserPanel) {
			this.browserPanel.navigate(url);
		}
	}
}
