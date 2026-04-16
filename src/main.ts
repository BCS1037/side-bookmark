/**
 * Side Bookmark - Main Plugin Entry
 * Registers the view, ribbon icon, and commands.
 */

import { Plugin, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_SIDE_BOOKMARK } from './types';
import { BookmarkStore } from './BookmarkStore';
import { BookmarkView } from './BookmarkView';
import { SideBookmarkSettingTab } from './settings';

export default class SideBookmarkPlugin extends Plugin {
	store: BookmarkStore;

	private originalWindowOpen: typeof window.open;
	private modifierKeyPressed = false;

	async onload(): Promise<void> {
		// Initialize data store
		this.store = new BookmarkStore(this);
		await this.store.load();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_SIDE_BOOKMARK,
			(leaf) => new BookmarkView(leaf, this)
		);

		this.addRibbonIcon('bookmark', 'Side bookmark', () => {
			void this.activateView();
		});

		this.addCommand({
			id: 'open',
			name: '打开侧边栏书签',
			callback: () => {
				void this.activateView();
			},
		});

		// Add settings tab
		this.addSettingTab(new SideBookmarkSettingTab(this.app, this));

		// Register global link interception (capture phase, runs before Obsidian's handlers)
		this.registerDomEvent(document, 'click', this.handleLinkClick.bind(this), true);

		// Track modifier keys for window.open interception bypass
		this.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
			if (e.key === 'Meta' || e.key === 'Control' || e.metaKey || e.ctrlKey) {
				this.modifierKeyPressed = true;
			}
		});
		this.registerDomEvent(document, 'keyup', (e: KeyboardEvent) => {
			if (e.key === 'Meta' || e.key === 'Control' || (!e.metaKey && !e.ctrlKey)) {
				this.modifierKeyPressed = false;
			}
		});
		this.registerDomEvent(window, 'blur', () => {
			this.modifierKeyPressed = false;
		});

		// Intercept window.open (used by Obsidian for links in Live Preview and other places)
		this.originalWindowOpen = window.open;
		window.open = (url?: string | URL, target?: string, features?: string) => {
			if (this.store.interceptLinks && url && !this.modifierKeyPressed) {
				const urlStr = url.toString();
				if (/^https?:\/\//i.test(urlStr)) {
					// We must open it asynchronously or directly? Directly is fine.
					void this.openUrlInSideBookmark(urlStr);
					return null;
				}
			}
			return this.originalWindowOpen.call(window, url, target, features);
		};
	}

	onunload(): void {
		// Restore window.open
		if (this.originalWindowOpen) {
			window.open = this.originalWindowOpen;
		}
	}

	/**
	 * Global click handler (capture phase) to intercept external link clicks in Obsidian notes.
	 * Redirects http/https links to the Side Bookmark built-in browser.
	 */
	private handleLinkClick(evt: MouseEvent): void {
		// Only intercept when the feature is enabled
		if (!this.store.interceptLinks) return;

		// Find the closest anchor element from the click target
		const target = evt.target as HTMLElement;
		const anchor = target.closest('a') as HTMLAnchorElement | null;
		if (!anchor) return;

		// Only handle external http/https links (skip internal Obsidian links)
		const href = anchor.getAttribute('href') || anchor.href;
		if (!href || !/^https?:\/\//i.test(href)) return;

		// Skip if Cmd/Ctrl is held (let the user open with system browser if desired)
		if (evt.metaKey || evt.ctrlKey) return;

		// Links inside the Side Bookmark webview itself should not be intercepted
		if (anchor.closest('.sb-browser-panel') || anchor.closest('webview')) return;

		// Intercept: prevent default and stop propagation
		evt.preventDefault();
		evt.stopPropagation();

		// Open the URL in Side Bookmark
		void this.openUrlInSideBookmark(href);
	}

	/** Open a URL in the Side Bookmark browser panel, activating the view if needed */
	private async openUrlInSideBookmark(url: string): Promise<void> {
		const { workspace } = this.app;

		// Get existing leaves or create one
		let leaves = workspace.getLeavesOfType(VIEW_TYPE_SIDE_BOOKMARK);

		if (leaves.length === 0) {
			// Activate the view first
			await this.activateView();
			leaves = workspace.getLeavesOfType(VIEW_TYPE_SIDE_BOOKMARK);
		} else {
			const firstLeaf = leaves[0];
			if (firstLeaf) void workspace.revealLeaf(firstLeaf);
		}

		const firstLeaf = leaves[0];
		if (firstLeaf) {
			// Access the BookmarkView and navigate to the URL
			const view = firstLeaf.view as any;
			if (typeof view.navigateTo === 'function') {
				view.navigateTo(url);
			}
		}
	}


	/** Open or reveal the Side Bookmark panel in the right sidebar */
	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if a leaf with our view already exists
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_SIDE_BOOKMARK);

		if (leaves.length > 0) {
			// View already exists, reveal it
			void workspace.revealLeaf(leaves[0] as WorkspaceLeaf);
		} else {
			// Create a new leaf in the right sidebar
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_SIDE_BOOKMARK,
					active: true,
				});
				void workspace.revealLeaf(leaf);
			}
		}
	}
}
