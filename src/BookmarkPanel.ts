/**
 * Side Bookmark - Bookmark Panel
 * Renders the bookmark tree list with folders, drag-and-drop, and context menus.
 */

import { App, Menu, setIcon } from 'obsidian';
import type { BookmarkStore } from './BookmarkStore';
import type { BookmarkItem, BookmarkFolder, BookmarkTreeItem } from './types';
import {
	AddBookmarkModal,
	AddFolderModal,
	EditBookmarkModal,
	EditFolderModal,
	ConfirmDeleteModal,
} from './modals';

export class BookmarkPanel {
	private app: App;
	private containerEl: HTMLElement;
	private headerEl: HTMLElement;
	private listEl: HTMLElement;
	private store: BookmarkStore;
	private collapsed = false;
	private unsubscribe: (() => void) | null = null;

	/** Callback when a bookmark is clicked */
	onNavigate: ((url: string) => void) | null = null;

	constructor(app: App, parentEl: HTMLElement, store: BookmarkStore) {
		this.app = app;
		this.store = store;

		this.containerEl = parentEl.createDiv({ cls: 'sb-bookmark-panel' });

		// Header bar
		this.headerEl = this.containerEl.createDiv({ cls: 'sb-bookmark-header' });

		const headerLeft = this.headerEl.createDiv({ cls: 'sb-bookmark-header-left' });
		const collapseIcon = headerLeft.createDiv({ cls: 'sb-collapse-icon' });
		setIcon(collapseIcon, 'chevron-down');
		headerLeft.createSpan({ text: '书签', cls: 'sb-bookmark-title' });

		headerLeft.addEventListener('click', () => {
			this.toggleCollapse();
		});

		// Action buttons
		const headerRight = this.headerEl.createDiv({ cls: 'sb-bookmark-header-right' });

		const addBtnGroup = headerRight.createDiv({ cls: 'sb-add-btn-group' });

		const addBookmarkBtn = addBtnGroup.createDiv({
			cls: 'sb-header-btn',
			attr: { 'aria-label': '添加书签' },
		});
		setIcon(addBookmarkBtn, 'plus');
		addBookmarkBtn.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation();
			new AddBookmarkModal(this.app, this.store).open();
		});

		const addFolderBtn = addBtnGroup.createDiv({
			cls: 'sb-header-btn',
			attr: { 'aria-label': '新建文件夹' },
		});
		setIcon(addFolderBtn, 'folder-plus');
		addFolderBtn.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation();
			new AddFolderModal(this.app, this.store).open();
		});

		// Bookmark list container
		this.listEl = this.containerEl.createDiv({ cls: 'sb-bookmark-list' });

		// Subscribe to data changes
		this.unsubscribe = this.store.onChange(() => {
			this.renderList();
		});

		// Initial render
		this.renderList();
	}

	/** Toggle panel collapse/expand */
	toggleCollapse(): void {
		this.collapsed = !this.collapsed;
		this.containerEl.toggleClass('sb-collapsed', this.collapsed);

		const icon = this.headerEl.querySelector('.sb-collapse-icon');
		if (icon) {
			icon.empty();
			setIcon(icon as HTMLElement, this.collapsed ? 'chevron-right' : 'chevron-down');
		}
	}

	/** Clean up */
	destroy(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
		this.containerEl.remove();
	}

	/** Render the full bookmark tree */
	private renderList(): void {
		this.listEl.empty();

		const rootItems = this.store.getTreeItems(null);

		if (rootItems.length === 0) {
			const emptyState = this.listEl.createDiv({ cls: 'sb-empty-state' });
			const emptyIcon = emptyState.createDiv({ cls: 'sb-empty-icon' });
			setIcon(emptyIcon, 'bookmark');
			emptyState.createDiv({ text: '暂无书签', cls: 'sb-empty-text' });
			emptyState.createDiv({
				text: '点击 + 按钮或 ⭐ 按钮添加书签',
				cls: 'sb-empty-hint',
			});
			return;
		}

		this.renderTreeLevel(this.listEl, null, 0);
	}

	/** Recursively render a level of the bookmark tree */
	private renderTreeLevel(parentEl: HTMLElement, parentId: string | null, depth: number): void {
		const items = this.store.getTreeItems(parentId);

		for (const item of items) {
			if (item.type === 'folder') {
				this.renderFolder(parentEl, item as BookmarkFolder, depth);
			} else {
				this.renderBookmark(parentEl, item as BookmarkItem, depth);
			}
		}
	}

	/** Render a folder item */
	private renderFolder(parentEl: HTMLElement, folder: BookmarkFolder, depth: number): void {
		const folderEl = parentEl.createDiv({
			cls: 'sb-tree-item sb-folder-item',
			attr: { 'data-id': folder.id, 'data-type': 'folder', draggable: 'true' },
		});
		folderEl.style.paddingLeft = `${depth * 16 + 4}px`;

		const folderRow = folderEl.createDiv({ cls: 'sb-tree-item-row' });

		// Collapse icon
		const collapseIcon = folderRow.createDiv({ cls: 'sb-folder-collapse' });
		setIcon(collapseIcon, folder.collapsed ? 'chevron-right' : 'chevron-down');

		// Folder icon
		const folderIcon = folderRow.createDiv({ cls: 'sb-item-icon' });
		setIcon(folderIcon, folder.collapsed ? 'folder' : 'folder-open');

		// Folder name
		folderRow.createSpan({ text: folder.name, cls: 'sb-item-label' });

		// Count badge
		const childCount = this.store.getBookmarksByFolder(folder.id).length +
			this.store.getSubFolders(folder.id).length;
		if (childCount > 0) {
			folderRow.createSpan({ text: `${childCount}`, cls: 'sb-count-badge' });
		}

		// Click to toggle collapse
		folderRow.addEventListener('click', () => {
			this.store.toggleFolder(folder.id);
		});

		// Context menu
		folderRow.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.showFolderContextMenu(e, folder);
		});

		// Drag events
		this.setupDragEvents(folderEl, folder);

		// Render children if not collapsed
		if (!folder.collapsed) {
			const childrenEl = parentEl.createDiv({ cls: 'sb-folder-children' });
			this.renderTreeLevel(childrenEl, folder.id, depth + 1);
		}
	}

	/** Render a bookmark item */
	private renderBookmark(parentEl: HTMLElement, bookmark: BookmarkItem, depth: number): void {
		const bookmarkEl = parentEl.createDiv({
			cls: 'sb-tree-item sb-bookmark-item',
			attr: { 'data-id': bookmark.id, 'data-type': 'bookmark', draggable: 'true' },
		});
		bookmarkEl.style.paddingLeft = `${depth * 16 + 24}px`;

		const bookmarkRow = bookmarkEl.createDiv({ cls: 'sb-tree-item-row' });

		// Bookmark icon
		const icon = bookmarkRow.createDiv({ cls: 'sb-item-icon' });
		setIcon(icon, 'globe');

		// Bookmark title
		bookmarkRow.createSpan({ text: bookmark.title, cls: 'sb-item-label' });

		// Click to navigate
		bookmarkRow.addEventListener('click', () => {
			if (this.onNavigate) {
				this.onNavigate(bookmark.url);
			}
		});

		// Context menu
		bookmarkRow.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.showBookmarkContextMenu(e, bookmark);
		});

		// Drag events
		this.setupDragEvents(bookmarkEl, bookmark);
	}

	/** Show context menu for a bookmark */
	private showBookmarkContextMenu(event: MouseEvent, bookmark: BookmarkItem): void {
		const menu = new Menu();

		menu.addItem(item => {
			item.setTitle('打开');
			item.setIcon('external-link');
			item.onClick(() => {
				if (this.onNavigate) {
					this.onNavigate(bookmark.url);
				}
			});
		});

		menu.addSeparator();

		menu.addItem(item => {
			item.setTitle('编辑');
			item.setIcon('pencil');
			item.onClick(() => {
				new EditBookmarkModal(
					this.app,
					this.store,
					bookmark.id,
					bookmark.title,
					bookmark.url,
					bookmark.folderId
				).open();
			});
		});

		// Move to folder submenu
		menu.addItem(item => {
			item.setTitle('移动到...');
			item.setIcon('folder-input');
			item.onClick(() => {
				this.showMoveMenu(event, bookmark);
			});
		});

		menu.addSeparator();

		menu.addItem(item => {
			item.setTitle('删除');
			item.setIcon('trash-2');
			item.onClick(() => {
				new ConfirmDeleteModal(
					this.app,
					`确定要删除书签"${bookmark.title}"吗？`,
					async () => { await this.store.removeBookmark(bookmark.id); }
				).open();
			});
		});

		menu.showAtMouseEvent(event);
	}

	/** Show context menu for a folder */
	private showFolderContextMenu(event: MouseEvent, folder: BookmarkFolder): void {
		const menu = new Menu();

		menu.addItem(item => {
			item.setTitle('添加书签到此文件夹');
			item.setIcon('plus');
			item.onClick(() => {
				new AddBookmarkModal(this.app, this.store, '', '', folder.id).open();
			});
		});

		menu.addItem(item => {
			item.setTitle('添加子文件夹');
			item.setIcon('folder-plus');
			item.onClick(() => {
				new AddFolderModal(this.app, this.store, folder.id).open();
			});
		});

		menu.addSeparator();

		menu.addItem(item => {
			item.setTitle('重命名');
			item.setIcon('pencil');
			item.onClick(() => {
				new EditFolderModal(this.app, this.store, folder.id, folder.name).open();
			});
		});

		menu.addSeparator();

		menu.addItem(item => {
			item.setTitle('删除文件夹');
			item.setIcon('trash-2');
			item.onClick(() => {
				const bookmarkCount = this.store.getBookmarksByFolder(folder.id).length;
				const subFolderCount = this.store.getSubFolders(folder.id).length;
				let msg = `确定要删除文件夹"${folder.name}"吗？`;
				if (bookmarkCount > 0 || subFolderCount > 0) {
					msg += `\n其中包含 ${bookmarkCount} 个书签和 ${subFolderCount} 个子文件夹，将一并删除。`;
				}
				new ConfirmDeleteModal(
					this.app,
					msg,
					async () => { await this.store.removeFolder(folder.id); }
				).open();
			});
		});

		menu.showAtMouseEvent(event);
	}

	/** Show a submenu to move a bookmark to a folder */
	private showMoveMenu(event: MouseEvent, bookmark: BookmarkItem): void {
		const menu = new Menu();

		// Move to root
		if (bookmark.folderId !== null) {
			menu.addItem(item => {
				item.setTitle('（根级别）');
				item.setIcon('corner-left-up');
				item.onClick(async () => {
					await this.store.moveBookmark(bookmark.id, null);
				});
			});
			menu.addSeparator();
		}

		// Move to each folder
		for (const folder of this.store.folders) {
			if (folder.id !== bookmark.folderId) {
				menu.addItem(item => {
					item.setTitle(folder.name);
					item.setIcon('folder');
					item.onClick(async () => {
						await this.store.moveBookmark(bookmark.id, folder.id);
					});
				});
			}
		}

		menu.showAtMouseEvent(event);
	}

	/** Set up drag and drop on a tree item */
	private setupDragEvents(el: HTMLElement, item: BookmarkTreeItem): void {
		el.addEventListener('dragstart', (e: DragEvent) => {
			if (e.dataTransfer) {
				e.dataTransfer.setData('text/plain', JSON.stringify({
					id: item.id,
					type: item.type,
				}));
				e.dataTransfer.effectAllowed = 'move';
			}
			el.addClass('sb-dragging');
		});

		el.addEventListener('dragend', () => {
			el.removeClass('sb-dragging');
			// Remove all drop indicators
			this.listEl.querySelectorAll('.sb-drop-target').forEach(
				el => el.removeClass('sb-drop-target')
			);
		});

		el.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
			el.addClass('sb-drop-target');
		});

		el.addEventListener('dragleave', () => {
			el.removeClass('sb-drop-target');
		});

		el.addEventListener('drop', async (e: DragEvent) => {
			e.preventDefault();
			el.removeClass('sb-drop-target');

			if (!e.dataTransfer) return;

			try {
				const data = JSON.parse(e.dataTransfer.getData('text/plain'));
				if (!data.id || !data.type) return;

				// If dropping a bookmark onto a folder, move it
				if (data.type === 'bookmark' && item.type === 'folder') {
					await this.store.moveBookmark(data.id, item.id);
				}
			} catch {
				// Ignore invalid data
			}
		});
	}
}
