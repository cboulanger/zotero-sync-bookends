# Bookends Store for @retorquere/zotero-sync

This is a store implementation for https://github.com/retorquere/zotero-sync
which can do a one-way sync from Zotero to any backend that has an API.

This implementation allows to backup Zotero libraries in Bookends, the MacOS
reference manager from https://www.sonnysoftware.com/, using its  
scripting support via JSX.   

This implementation saves all accessible Zotero libraries in the specified
Bookends library, which must be opened during sync. All Zotero library items are
stored in a Bookends "group". Zotero collections, notes, and attachments are
ignored for the moment.

> Note: This is currently only a proof of concept, just a fragment of Zotero item data
(title, year, authors) is translated into its Bookends equivalents. Adds only,
does not update or delete items.


## Usage

```bash
npm install @cboulanger/zotero-sync-bookends
```

See [the test script](test.ts) for an example.
