# Changelog

All notable changes to this project will be documented in this file.

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
