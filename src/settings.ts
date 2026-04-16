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

		new Setting(containerEl).setName('设置').setHeading();

		new Setting(containerEl)
			.setName('默认首页')
			.setDesc('打开插件时默认加载的网址')
			.addText(text => text
				.setPlaceholder('https://www.google.com')
				.setValue(this.plugin.store.defaultUrl)
				.onChange(async (value) => {
					this.plugin.store.defaultUrl = value;
					await this.plugin.store.save();
				})
			);

		new Setting(containerEl)
			.setName('默认显示书签面板')
			.setDesc('打开插件时是否默认展开书签列表面板')
			.addToggle(toggle => toggle
				.setValue(this.plugin.store.showBookmarkPanel)
				.onChange(async (value) => {
					this.plugin.store.showBookmarkPanel = value;
					await this.plugin.store.save();
				})
			);

		new Setting(containerEl)
			.setName('拦截笔记链接')
			.setDesc('开启后，单击笔记中的外部链接（http/https）将自动在内置浏览器中打开，而非使用系统浏览器。按住 Cmd/Ctrl 单击可临时绕过，仍使用系统浏览器打开。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.store.interceptLinks)
				.onChange(async (value) => {
					this.plugin.store.interceptLinks = value;
					await this.plugin.store.save();
				})
			);

		// Statistics section
		new Setting(containerEl).setName('统计').setHeading();

		const stats = containerEl.createDiv({ cls: 'sb-settings-stats' });
		stats.createEl('p', {
			text: `书签数量: ${this.plugin.store.bookmarks.length}`,
		});
		stats.createEl('p', {
			text: `文件夹数量: ${this.plugin.store.folders.length}`,
		});
	}
}
