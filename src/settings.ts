/**
 * Side Bookmark - Settings Tab
 * Plugin settings page in Obsidian's settings panel.
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type SideBookmarkPlugin from './main';

export class SideBookmarkSettingTab extends PluginSettingTab {
	plugin: SideBookmarkPlugin;

	constructor(app: App, plugin: SideBookmarkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('General').setHeading();

		new Setting(containerEl)
			.setName('Default homepage')
			.setDesc('The URL to load when the plugin opens.')
			.addText(text => text
				.setPlaceholder('https://www.google.com')
				.setValue(this.plugin.store.defaultUrl)
				.onChange(async (value) => {
					this.plugin.store.defaultUrl = value;
					await this.plugin.store.save();
				})
			);

		new Setting(containerEl)
			.setName('Show bookmark panel by default')
			.setDesc('Expand the bookmark list panel automatically when the plugin opens.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.store.showBookmarkPanel)
				.onChange(async (value) => {
					this.plugin.store.showBookmarkPanel = value;
					await this.plugin.store.save();
				})
			);

		new Setting(containerEl)
			.setName('Intercept note links')
			.setDesc('When enabled, clicking external links (http/https) in notes opens them in the built-in browser instead of the system browser. Hold Cmd/Ctrl while clicking to bypass and use the system browser.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.store.interceptLinks)
				.onChange(async (value) => {
					this.plugin.store.interceptLinks = value;
					await this.plugin.store.save();
				})
			);

		// Statistics section
		new Setting(containerEl).setName('Statistics').setHeading();

		const stats = containerEl.createDiv({ cls: 'sb-settings-stats' });
		stats.createEl('p', {
			text: `Bookmarks: ${this.plugin.store.bookmarks.length}`,
		});
		stats.createEl('p', {
			text: `Folders: ${this.plugin.store.folders.length}`,
		});
	}
}
