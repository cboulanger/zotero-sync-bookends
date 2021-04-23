# Bookends Store for @retorquere/zotero-sync

This is a store implementation for https://github.com/retorquere/zotero-sync, 
which allows to export Zotero libraries into Bookends, a MacOS reference
manager from https://www.sonnysoftware.com. Using Bookend's scripting support via
JSX, Zotero data is added to or efficiently updated in a Bookends library.

This implementation saves all accessible Zotero libraries in the specified
Bookends library, which must be opened during sync. All Zotero library items are
stored in a separate Bookends "group". Zotero collections, notes, and attachments are
not (yet) synchronized.

> Note: This is currently only a proof of concept, just a fragment of Zotero item data
(name, year, authors) is translated into its Bookends equivalents. Adds only,
does not update or delete items.


## Usage

```bash
npm install @cboulanger/zotero-sync-bookends
```

See [the test script](test.ts) for an example.
