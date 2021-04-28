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

## Issues

 - Make sure not to modify a library on zotero.org during the initial synchronization
   of large libraries, since otherwise synchronization will abort with a "last-modified-version changed 
   ... retry later" error. 
 - The implementation stores sync metadata such as the Zotero library version in the Bookends 
   group names. This isn't a very robust solution but since there is no other place in Bookends 
   for this kind of data, the best one I could come up with. 

## Testing

```bash
git clone https://github.com/cboulanger/zotero-sync-bookends.git
cd zotero-sync-bookends
cp .env.dist ./.env
# edit .env and provide the values needed there
npm test
```

See [the test script](test.ts) for an example on how to integrate the library in your project.

## Resources
- [JXA Release notes](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-10.html#//apple_ref/doc/uid/TP40014508-CH109-SW1)
- [JXA debugging](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html#//apple_ref/doc/uid/TP40014508-CH110-SW1) 
- [AppleEvents Error Codes](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/reference/ASLR_error_codes.html)
