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

	async onload(): Promise<void> {
		// Initialize data store
		this.store = new BookmarkStore(this);
		await this.store.load();

		// Register the custom view
		this.registerView(
			VIEW_TYPE_SIDE_BOOKMARK,
			(leaf) => new BookmarkView(leaf, this)
		);

		// Add ribbon icon (left sidebar)
		this.addRibbonIcon('bookmark', 'Side Bookmark', () => {
			this.activateView();
		});

		// Add command to open the view
		this.addCommand({
			id: 'open-side-bookmark',
			name: '打开侧边栏书签',
			callback: () => {
				this.activateView();
			},
		});

		// Add settings tab
		this.addSettingTab(new SideBookmarkSettingTab(this.app, this));
	}

	onunload(): void {
		// Detach all leaves of our view type
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_SIDE_BOOKMARK);
	}

	/** Open or reveal the Side Bookmark panel in the right sidebar */
	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if a leaf with our view already exists
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_SIDE_BOOKMARK);

		if (leaves.length > 0) {
			// View already exists, reveal it
			workspace.revealLeaf(leaves[0] as WorkspaceLeaf);
		} else {
			// Create a new leaf in the right sidebar
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_SIDE_BOOKMARK,
					active: true,
				});
				workspace.revealLeaf(leaf);
			}
		}
	}
}
