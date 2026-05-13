# Changelog

All notable changes to this project will be documented in this file.

## [0.0.5] - 2026-05-13

### Fixed
- **Submission Compliance**: Addressed multiple warnings and errors flagged by the Obsidian community review process.
- Updated `minAppVersion` to `1.7.2` to support `Workspace.revealLeaf`.
- Fixed popout window compatibility by migrating `document` to `activeDocument` and `window` to `activeWindow`.
- Improved type safety across files by removing `any` usage in `src/BookmarkPanel.ts` and `src/BrowserPanel.ts`.
- Removed "General" heading from the settings tab.
- Replaced `document.createElement('webview')` with `createEl('webview')` for proper initialization.
- Re-named the command palette entry to "Open" to prevent redundant prefixing.
- Added a GitHub Actions workflow to generate artifact attestations for `main.js` and `styles.css`.

## [0.0.4] - 2026-04-21

### Fixed
- **UI Text Standardization**: Converted all remaining Chinese UI text to English sentence case to comply with Obsidian community plugin standards.
- Updated command names, setting labels/descriptions, modal text, and context menu items.
- Fixed `aria-label` casing and language issues.

## [0.0.3] - 2026-04-16

### Fixed
- **Plugin Submission Fixes**: Addressed 10 critical code quality and guideline validation issues reported by the `ObsidianReviewBot`.
  - Removed unnecessary type assertions to comply with strict TypeScript guidelines.
  - Resolved "Floating Promise" warnings using the `void` operator.
  - Aligned UI naming conventions to Obsidian defaults ("Side bookmark").
  - Stripped plugin ID prefix from command IDs.
  - Standardized heading layouts in settings.


## [0.0.1] - 2026-04-01

### Added
- Initial release of the **Side Bookmark** plugin.
- In-app sidebar web browser functionality.
- Bookmark saving and nested folder organization.
- Interactive drag-and-drop feature to rearrange bookmarks and folders.
- Complete data persistence in the Obsidian vault settings.
