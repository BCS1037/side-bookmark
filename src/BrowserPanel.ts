/**
 * Side Bookmark - Browser Panel
 * Manages the webview element and navigation bar for web browsing.
 */

import { setIcon } from 'obsidian';

export class BrowserPanel {
	private containerEl: HTMLElement;
	private navBarEl: HTMLElement;
	private webviewContainer: HTMLElement;
	private webviewEl: HTMLElement | null = null;
	private urlInput: HTMLInputElement;
	private backBtn: HTMLElement;
	private forwardBtn: HTMLElement;
	private refreshBtn: HTMLElement;
	private bookmarkBtn: HTMLElement;

	private currentUrl = '';
	private currentTitle = '';

	/** Callback when user wants to add current page as bookmark */
	onAddBookmark: ((title: string, url: string) => void) | null = null;

	constructor(parentEl: HTMLElement) {
		this.containerEl = parentEl.createDiv({ cls: 'sb-browser-panel' });

		// Build the navigation bar
		this.navBarEl = this.containerEl.createDiv({ cls: 'sb-nav-bar' });

		// Navigation buttons
		const navBtns = this.navBarEl.createDiv({ cls: 'sb-nav-buttons' });

		this.backBtn = navBtns.createDiv({ cls: 'sb-nav-btn', attr: { 'aria-label': '后退' } });
		setIcon(this.backBtn, 'arrow-left');
		this.backBtn.addEventListener('click', () => this.goBack());

		this.forwardBtn = navBtns.createDiv({ cls: 'sb-nav-btn', attr: { 'aria-label': '前进' } });
		setIcon(this.forwardBtn, 'arrow-right');
		this.forwardBtn.addEventListener('click', () => this.goForward());

		this.refreshBtn = navBtns.createDiv({ cls: 'sb-nav-btn', attr: { 'aria-label': '刷新' } });
		setIcon(this.refreshBtn, 'refresh-cw');
		this.refreshBtn.addEventListener('click', () => this.reload());

		// URL input
		this.urlInput = this.navBarEl.createEl('input', {
			cls: 'sb-url-input',
			attr: {
				type: 'text',
				placeholder: '输入网址...',
				spellcheck: 'false',
			},
		});
		this.urlInput.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				this.navigateToInput();
			}
		});
		this.urlInput.addEventListener('focus', () => {
			this.urlInput.select();
		});

		// Bookmark (star) button
		this.bookmarkBtn = this.navBarEl.createDiv({ cls: 'sb-nav-btn sb-bookmark-btn', attr: { 'aria-label': '添加书签' } });
		setIcon(this.bookmarkBtn, 'star');
		this.bookmarkBtn.addEventListener('click', () => {
			if (this.onAddBookmark && this.currentUrl) {
				this.onAddBookmark(this.currentTitle || this.currentUrl, this.currentUrl);
			}
		});

		// Webview container
		this.webviewContainer = this.containerEl.createDiv({ cls: 'sb-webview-container' });
	}

	/** Navigate to a URL */
	navigate(url: string): void {
		let normalizedUrl = url.trim();
		if (!normalizedUrl) return;

		if (!/^https?:\/\//i.test(normalizedUrl)) {
			normalizedUrl = 'https://' + normalizedUrl;
		}

		this.currentUrl = normalizedUrl;
		this.urlInput.value = normalizedUrl;

		this.createOrUpdateWebview(normalizedUrl);
	}

	/** Go back in browser history */
	goBack(): void {
		if (this.webviewEl) {
			(this.webviewEl as any).goBack?.();
		}
	}

	/** Go forward in browser history */
	goForward(): void {
		if (this.webviewEl) {
			(this.webviewEl as any).goForward?.();
		}
	}

	/** Reload the current page */
	reload(): void {
		if (this.webviewEl) {
			(this.webviewEl as any).reload?.();
		}
	}

	/** Get current URL */
	getUrl(): string {
		return this.currentUrl;
	}

	/** Get current page title */
	getTitle(): string {
		return this.currentTitle;
	}

	/** Clean up */
	destroy(): void {
		if (this.webviewEl) {
			this.webviewEl.remove();
			this.webviewEl = null;
		}
		this.containerEl.remove();
	}

	/** Navigate to the URL in the input field */
	private navigateToInput(): void {
		const url = this.urlInput.value.trim();
		if (url) {
			this.navigate(url);
		}
	}

	/** Create or update the webview element */
	private createOrUpdateWebview(url: string): void {
		// Remove existing webview
		if (this.webviewEl) {
			this.webviewEl.remove();
		}

		// Create a new webview element (Electron's webview tag)
		const webview = document.createElement('webview') as HTMLElement;

		webview.setAttribute('src', url);
		webview.setAttribute('allowpopups', '');
		webview.addClass('sb-webview');

		// Listen for navigation events
		webview.addEventListener('did-navigate', ((e: CustomEvent) => {
			const detail = e as any;
			if (detail.url) {
				this.currentUrl = detail.url;
				this.urlInput.value = detail.url;
			}
		}) as EventListener);

		webview.addEventListener('did-navigate-in-page', ((e: CustomEvent) => {
			const detail = e as any;
			if (detail.url) {
				this.currentUrl = detail.url;
				this.urlInput.value = detail.url;
			}
		}) as EventListener);

		webview.addEventListener('page-title-updated', ((e: CustomEvent) => {
			const detail = e as any;
			if (detail.title) {
				this.currentTitle = detail.title;
			}
		}) as EventListener);

		// Use dom-ready to set up more event listeners via webview API
		webview.addEventListener('dom-ready', () => {
			// Update URL from webview's actual URL
			const wv = webview as any;
			if (wv.getURL) {
				this.currentUrl = wv.getURL();
				this.urlInput.value = this.currentUrl;
			}
			if (wv.getTitle) {
				this.currentTitle = wv.getTitle();
			}
		});

		// Handle new-window events (open links in same webview)
		webview.addEventListener('new-window', ((e: any) => {
			if (e.url) {
				this.navigate(e.url);
			}
		}) as EventListener);

		this.webviewContainer.empty();
		this.webviewContainer.appendChild(webview);
		this.webviewEl = webview;
	}
}
