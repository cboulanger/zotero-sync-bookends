import { Sync } from '@retorquere/zotero-sync/index'
import type { Zotero } from '@retorquere/zotero-sync/typings/zotero'
import { Store } from './src'
const process = require('process');
const dotenv = require('dotenv');
const Gauge = require('gauge');

(async () => {
    // config
    let zotero_api_key;
    let bookends_db_name;
    let argv = process.argv.slice(1);

    // if run from an executable created with `npm run pkg`
    if (process.pkg) {
        argv.shift();
    }

    const help = ["help", "-h", "--help"].includes(argv[0]);

    if (!help) {
        [zotero_api_key, bookends_db_name] = argv;
        if (!zotero_api_key || !bookends_db_name) {
            dotenv.config();
            const {
                ZOTERO_API_KEY,
                BOOKENDS_DB_NAME
            } = process.env as {[key : string]: string};
            zotero_api_key = ZOTERO_API_KEY;
            bookends_db_name = BOOKENDS_DB_NAME;
        }
    }

    if (help || !zotero_api_key || !bookends_db_name) {
        console.info(`Usage: zotero-sync-bookends <Zotero API key> "Bookends library file name"`);
        process.exit(help ? 0 : 1);
    }

    // initialize the sync engine
    const syncEngine = new Sync;
    await syncEngine.login(zotero_api_key);

    Store.verbose = true;

    // configure visual feedback
    const gauge = new Gauge;
    let libraryName:string="";
    syncEngine.on(Sync.event.library, (library, index: number, total: number) => {
        let name = library.type === "group" ? library.name : "User library";
        libraryName = name;
        gauge.show(`Saving library "${name}" (${index}/${total})`, index/total);
    });
    syncEngine.on(Sync.event.remove, (type: string, objects: string[]) => {
        gauge.show(`"${libraryName.slice(0,20)}": Removing ${objects.length} ${type}`);
    });
    syncEngine.on(Sync.event.collection, (collection: Zotero.Collection, index: number, total: number) => {
        gauge.show(`"${libraryName.slice(0,20)}": Saving collection ${index}/${total}`, index/total);
    });
    syncEngine.on(Sync.event.item, (item: Zotero.Item.Any, index: number, total: number) => {
        gauge.show(`"${libraryName.slice(0,20)}": Saving item ${index}/${total}`, index/total);
    });

    // error handling
    syncEngine.on(Sync.event.error, e => {
        gauge.hide();
        console.error(`Error during task "${gauge._status.section.replace(/"/g,"'")}": ${e.message}`);
        if (e.lastJxaCmd) {
            console.error(`Last JXA command was: ${e.lastJxaCmd}`);
        }
        process.exit(1);
    });

    // synchronize with the couchbase store
    const store = new Store(bookends_db_name);
    await syncEngine.sync(store);
})().catch(err => {
    console.log(err)
    process.exit(1)
})
