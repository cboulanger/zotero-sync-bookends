# Bookends Store for @retorquere/zotero-sync

see https://github.com/retorquere/zotero-sync

This is a proof of concept, only a fragment of Zotero item data (title, year,
authors) is translated into its Bookends equivalents. Adds only, does not update
or delete items.

This implementation saves all accessible Zotero libraries in the specified
Bookends library, which must be opened during sync. All Zotero library items are
stored in a Bookends "group". Zotero collections, notes, and attachments are
ignored for the moment.

## Usage

```bash
npm install @cboulanger/zotero-sync-bookends
```

See [the test script](test.ts) for an example.
