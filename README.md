# Bookends Store for @retorquere/zotero-sync

This is a store implementation for https://github.com/retorquere/zotero-sync, 
which allows to export Zotero libraries into Bookends, a MacOS reference
manager from https://www.sonnysoftware.com. Using Bookend's scripting support via
JSX, Zotero data is added to, or updated in a Bookends library.

This implementation saves all Zotero libraries that are accessible to a given Zotero 
API key in a Bookends library, which must be opened during sync. All Zotero library items are
stored in a separate Bookends "group". Zotero collections, notes, and attachments are
not synchronized.

The library allows, among other things, to use Bookends super-fast search to do a 
cross-library lookup of reference items, which is not possible with Zotero currently.

> Note: This is currently a proof of concept not suitable for production use. Please
> let me know if it works for you and open issues / pull requests if it doesn't.

## Testing

```bash
git clone https://github.com/cboulanger/zotero-sync-bookends.git
cd zotero-sync-bookends
cp .env.dist ./.env
# edit .env and provide the values needed there
npm test
```

See [the test script](test.ts) for an example on how to integrate the library in your project.
