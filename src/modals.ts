/**
 * Side Bookmark - Modal Dialogs
 * Provides dialogs for adding/editing bookmarks and folders.
 */

import { App, Modal, Setting } from 'obsidian';
import type { BookmarkFolder } from './types';
import type { BookmarkStore } from './BookmarkStore';

// ── Add Bookmark Modal ──────────────────────────────────────

export class AddBookmarkModal extends Modal {
	private title: string;
	private url: string;
	private folderId: string | null;
	private store: BookmarkStore;
	private onSave: ((title: string, url: string, folderId: string | null) => void) | null;

	constructor(
		app: App,
		store: BookmarkStore,
		defaultTitle = '',
		defaultUrl = '',
		defaultFolderId: string | null = null,
		onSave?: (title: string, url: string, folderId: string | null) => void
	) {
		super(app);
		this.store = store;
		this.title = defaultTitle;
		this.url = defaultUrl;
		this.folderId = defaultFolderId;
		this.onSave = onSave ?? null;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('side-bookmark-modal');

		contentEl.createEl('h3', { text: 'Add bookmark' });

		new Setting(contentEl)
			.setName('Title')
			.addText(text => text
				.setPlaceholder('Enter bookmark title')
				.setValue(this.title)
				.onChange(value => { this.title = value; })
			);

		new Setting(contentEl)
			.setName('URL')
			.addText(text => text
				.setPlaceholder('https://example.com')
				.setValue(this.url)
				.onChange(value => { this.url = value; })
			);

		new Setting(contentEl)
			.setName('Folder')
			.addDropdown(dropdown => {
				dropdown.addOption('__root__', '(No folder)');
				for (const folder of this.store.folders) {
					dropdown.addOption(folder.id, this.getFolderPath(folder));
				}
				dropdown.setValue(this.folderId ?? '__root__');
				dropdown.onChange(value => {
					this.folderId = value === '__root__' ? null : value;
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.url.trim()) {
						return;
					}
					if (!this.title.trim()) {
						this.title = this.url;
					}
					// Ensure URL has protocol
					let url = this.url.trim();
					if (!/^https?:\/\//i.test(url)) {
						url = 'https://' + url;
					}
					if (this.onSave) {
						this.onSave(this.title.trim(), url, this.folderId);
					} else {
						await this.store.addBookmark(this.title.trim(), url, this.folderId);
					}
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	/** Build a display path for a folder (e.g., "Parent / Child") */
	private getFolderPath(folder: BookmarkFolder): string {
		const parts: string[] = [folder.name];
		let current: BookmarkFolder | undefined = folder;
		while (current?.parentId) {
			current = this.store.getFolder(current.parentId);
			if (current) {
				parts.unshift(current.name);
			}
		}
		return parts.join(' / ');
	}
}

// ── Edit Bookmark Modal ─────────────────────────────────────

export class EditBookmarkModal extends Modal {
	private title: string;
	private url: string;
	private folderId: string | null;
	private bookmarkId: string;
	private store: BookmarkStore;

	constructor(
		app: App,
		store: BookmarkStore,
		bookmarkId: string,
		currentTitle: string,
		currentUrl: string,
		currentFolderId: string | null
	) {
		super(app);
		this.store = store;
		this.bookmarkId = bookmarkId;
		this.title = currentTitle;
		this.url = currentUrl;
		this.folderId = currentFolderId;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('side-bookmark-modal');

		contentEl.createEl('h3', { text: 'Edit bookmark' });

		new Setting(contentEl)
			.setName('Title')
			.addText(text => text
				.setPlaceholder('Enter bookmark title')
				.setValue(this.title)
				.onChange(value => { this.title = value; })
			);

		new Setting(contentEl)
			.setName('URL')
			.addText(text => text
				.setPlaceholder('https://example.com')
				.setValue(this.url)
				.onChange(value => { this.url = value; })
			);

		new Setting(contentEl)
			.setName('Folder')
			.addDropdown(dropdown => {
				dropdown.addOption('__root__', '(No folder)');
				for (const folder of this.store.folders) {
					dropdown.addOption(folder.id, this.getFolderPath(folder));
				}
				dropdown.setValue(this.folderId ?? '__root__');
				dropdown.onChange(value => {
					this.folderId = value === '__root__' ? null : value;
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.url.trim()) return;
					if (!this.title.trim()) this.title = this.url;

					let url = this.url.trim();
					if (!/^https?:\/\//i.test(url)) {
						url = 'https://' + url;
					}

					await this.store.updateBookmark(this.bookmarkId, {
						title: this.title.trim(),
						url,
						folderId: this.folderId,
					});
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	private getFolderPath(folder: BookmarkFolder): string {
		const parts: string[] = [folder.name];
		let current: BookmarkFolder | undefined = folder;
		while (current?.parentId) {
			current = this.store.getFolder(current.parentId);
			if (current) {
				parts.unshift(current.name);
			}
		}
		return parts.join(' / ');
	}
}

// ── Add Folder Modal ────────────────────────────────────────

export class AddFolderModal extends Modal {
	private folderName: string;
	private parentId: string | null;
	private store: BookmarkStore;

	constructor(app: App, store: BookmarkStore, defaultParentId: string | null = null) {
		super(app);
		this.store = store;
		this.folderName = '';
		this.parentId = defaultParentId;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('side-bookmark-modal');

		contentEl.createEl('h3', { text: 'New folder' });

		new Setting(contentEl)
			.setName('Folder name')
			.addText(text => text
				.setPlaceholder('Enter folder name')
				.setValue(this.folderName)
				.onChange(value => { this.folderName = value; })
			);

		new Setting(contentEl)
			.setName('Parent folder')
			.addDropdown(dropdown => {
				dropdown.addOption('__root__', '(Root level)');
				for (const folder of this.store.folders) {
					dropdown.addOption(folder.id, this.getFolderPath(folder));
				}
				dropdown.setValue(this.parentId ?? '__root__');
				dropdown.onChange(value => {
					this.parentId = value === '__root__' ? null : value;
				});
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Create')
				.setCta()
				.onClick(async () => {
					if (!this.folderName.trim()) return;
					await this.store.addFolder(this.folderName.trim(), this.parentId);
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	private getFolderPath(folder: BookmarkFolder): string {
		const parts: string[] = [folder.name];
		let current: BookmarkFolder | undefined = folder;
		while (current?.parentId) {
			current = this.store.getFolder(current.parentId);
			if (current) {
				parts.unshift(current.name);
			}
		}
		return parts.join(' / ');
	}
}

// ── Edit Folder Modal ───────────────────────────────────────

export class EditFolderModal extends Modal {
	private folderName: string;
	private folderId: string;
	private store: BookmarkStore;

	constructor(app: App, store: BookmarkStore, folderId: string, currentName: string) {
		super(app);
		this.store = store;
		this.folderId = folderId;
		this.folderName = currentName;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('side-bookmark-modal');

		contentEl.createEl('h3', { text: 'Edit folder' });

		new Setting(contentEl)
			.setName('Folder name')
			.addText(text => text
				.setPlaceholder('Enter folder name')
				.setValue(this.folderName)
				.onChange(value => { this.folderName = value; })
			);

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.folderName.trim()) return;
					await this.store.updateFolder(this.folderId, {
						name: this.folderName.trim(),
					});
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// ── Confirm Delete Modal ────────────────────────────────────

export class ConfirmDeleteModal extends Modal {
	private message: string;
	private onConfirm: () => Promise<void>;

	constructor(app: App, message: string, onConfirm: () => Promise<void>) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('side-bookmark-modal');

		contentEl.createEl('h3', { text: 'Confirm delete' });
		contentEl.createEl('p', { text: this.message });

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Delete')
				.setWarning()
				.onClick(async () => {
					await this.onConfirm();
					this.close();
				})
			)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close())
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
