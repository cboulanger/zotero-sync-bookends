# Bookends Store for @retorquere/zotero-sync

This is a store implementation for https://github.com/retorquere/zotero-sync 
that enables exporting/backing up Zotero libraries into Bookends, a MacOS reference
manager from https://www.sonnysoftware.com. Using Bookend's scripting support via
JavaScript for Automation (JSX), Zotero data is added to, or updated in a Bookends library.

This implementation saves all Zotero libraries that are accessible to a given Zotero 
API key in a Bookends library, which must be opened during sync. All Zotero library items are
stored in a separate Bookends "group". Zotero collections, notes, and attachments are
not synchronized.

The library allows, among other things, to use Bookends super-fast search to do a 
cross-library lookup of reference items, which is not possible with Zotero currently.

## Issues
 - Access to Bookends via OSA/JXA is slow. The initial synchronization can take a couple of hours for large libraries.
   After that, especially if you do it often, syncing should go fast since only the data that has changed is 
   synchronized. 
 - The current implementation works well enough for my use case but of course isn't perfect. Please
   let me know if it works for you and open issues / pull requests if it doesn't.
 - Bookends crashes quite a bit - see below how to recover from the crash without having to restart the 
   synchronization from scratch. 
 - Make sure not to modify a library on zotero.org during the initial synchronization, since otherwise 
   synchronization will abort with a "last-modified-version changed ... retry later" error. 
 - The implementation stores sync metadata such as the Zotero library version in the Bookends 
   group names. This isn't a very robust solution but since there is no other place in Bookends 
   for this kind of data, the best one I could come up with. 
   
## Recovering from a Bookends crash

Unfortunately, especially when syncing large libraries, Bookends sometimes crashes and messes up all the groups. 
You can restore the state before the crash like so:

   1) Rebuild the library 
   2) If the groups have disappeared, execute "Flatten Groups List Hierarchy" from the menu in the bottom left corner of 
      the application window. Now the groups should re-appear.
   3) The group names (and the metadata stored in them) often need to be manually repaired. Double-click on them.
      For every library that had been fully synchronized before the crash, set the `lastIndex` value to 0 and the 
      `version` value to the value of `library.version` displayed at `https://api.zotero.org/<prefix>/items/top?key=<your key>` 
      (the `prefix` is also stored in the group name). You might also need to repair the group name, which is available
      from the same JSON data as `library.name`
      
Then you can restart the synchronization. It will skip and update the previously synchronized libraries. For the others,
it will "fast-forward" (sort of) to the not-yet-synchronized items if the "lastIndex" value has been preserved.

## Installation

To use the library in your projects, simply `npm install @cboulanger/zotero-sync-bookends`. See [the test script](test.ts) 
for an example on how to use the API.

## Testing

The test will actually work out-of-the-box to sync your data if you provide the needed environment variables.

```bash
git clone https://github.com/cboulanger/zotero-sync-bookends.git
cd zotero-sync-bookends
cp .env.dist ./.env
# edit .env and provide the values needed there
npm install
npm test
```

## Creating an executable / MacOS app

You can create a standalone executable file which can be run on the command line or packaged into 
an application by executing `npm run pkg`. The executable will be written to the `bin` directory.

> Please note that if you have set environment variables in a `.env` file, the package will include 
> include them and will be visible as plain text in the source! Please remove the file if you intend 
> to distribute the built executable. The values will be used as defaults, which is convenient for 
> personal use of the executable. 

The usage of the executable is

```bash
zotero-sync-bookends <Zotero API key> "Bookends library file name (not the path!)"
```


## Resources
- [JXA Release notes](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-10.html#//apple_ref/doc/uid/TP40014508-CH109-SW1)
- [JXA debugging](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-11.html#//apple_ref/doc/uid/TP40014508-CH110-SW1) 
- [AppleEvents Error Codes](https://developer.apple.com/library/archive/documentation/AppleScript/Conceptual/AppleScriptLangGuide/reference/ASLR_error_codes.html)
