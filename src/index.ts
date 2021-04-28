import runJxa from 'run-jxa';
import type { Zotero } from "@retorquere/zotero-sync/typings/zotero"
const process = require('process');

const { Translator, zoteroDictionary, bookendsDictionary } = require('./dictionaries/translator');

export class Store implements Zotero.Store {

  // interface properties
  public libraries : string[];

  // public properties
  public fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
    this.libraries = [];
  }

  /**
   * Removes a library from the store
   * @implements Zotero.Store.remove
   * @param user_or_group_prefix
   */
  public async remove(user_or_group_prefix: string): Promise<void> {
    await (new Library(this, user_or_group_prefix)).delete();
    this.libraries = this.libraries.filter(prefix => prefix !== user_or_group_prefix);
  }

  /**
   * Gets a library, creating it if it doesn't exist.
   * @implements Zotero.Store.get
   * @param user_or_group_prefix
   * @return {Promise<Library>}
   */
  public async get(user_or_group_prefix:string): Promise<Library> {
    const library = new Library(this, user_or_group_prefix);
    if (!this.libraries.includes(user_or_group_prefix)) {
      this.libraries.push(user_or_group_prefix);
    }
    return await library.init();
  }
}

/**
 * Implementation of a Zotero library object
 */
export class Library implements Zotero.Library {

  // interface properties
  public name: string = "";
  public version: number = 0;

  // public properties
  public maxTries = 3; // how often to retry an OSA command if it times out

  // internal config
  private readonly prefix: string;
  private readonly store: Store;
  private groupName?: string;
  private fastForwardTo : number = 0;
  private lastIndex : number = 0;

  constructor(store: Store, user_or_group_prefix: string) {
    this.store = store;
    this.prefix = user_or_group_prefix;
  }

  /**
   * Runs a JXA script in the context of the current Bookends library. The following
   * constants are predefined when running the passed script fragement:
   * ```
   * args           - the arguments array passed in the second parameter
   * bookends       - the JXA Bookends Application instance
   * libraryWindow  - the JXA LibraryWindow instance of the library with the name that had
   *                  been passed to the constructor of the node Library class instance
   * ```
   * @param {string} cmd
   * @param {array} args
   * @protected
   */
  protected async run(cmd:string, args: any[] = []) : Promise<any> {
    cmd = `const bookends = Application("Bookends");
      const libraryWindow = bookends.libraryWindows.byName("${this.store.fileName}");
      ${cmd.trim()}`;
    try {
      return await runJxa(cmd, args);
    } catch (e) {
      e.lastJxaCmd = cmd;
      throw e;
    }
  }

  /**
   * Initialize the library instance. This creates a Bookends group for all library items if it
   * does not exist. The group name encodes library metadata in JSON format
   */
  public async init(): Promise<Library> {
    this.groupName = await this.findGroupNameByPrefix();
    this.lastIndex = 0;
    if (this.groupName) {
      const {name, data} = this.parseGroupName(this.groupName);
      this.name = name;
      this.version = data.version;
      this.fastForwardTo = data.lastIndex || 0;
    } else {
      this.groupName = this.generateGroupName("Synchronizing...");
      await this.run(`
        const groupItem=bookends.GroupItem({name:\`${this.groupName}\`});
        libraryWindow.groupItems.push(groupItem);`);
    }
    return this;
  }

  /**
   * Deletes the Bookends group containing the library items
   */
  public async delete() {
    try {
      await this.run(`bookends.delete(libraryWindows.groupItems.byName(\`${this.groupName}\`))`);
    } catch (e) {
      console.log(e.stderr);
    }
  }

  /**
   * Parse the metadata stored in a group name
   * @protected
   */
  protected parseGroupName(groupName: string): {name: string, data: {version:number, prefix:string, lastIndex:number }} {
    if (!groupName) {
      throw new Error("Missing group name");
    }
    const pos = groupName.indexOf("{");
    const name = pos > -1 ? groupName.slice(0,pos-1).trim() : groupName;
    const data  = pos > -1 ? JSON.parse(groupName.slice(pos)) : {};
    return {name , data};
  }

  /**
   * Store metadata in the group name
   * @param {string?} name
   * @protected
   */
  protected generateGroupName(name?: string): string {
    const data = {
      prefix: this.prefix,
      version: this.version,
      lastIndex: this.lastIndex
    };
    name = name || this.name;
    return `${name.padEnd(50, " ")} ${JSON.stringify(data)}`;
  }

  /**
   * Finds a group name by the Zotero library prefix in the contained metadata
   * If found, return the name of the group, otherwise return undefined
   * @param prefix
   * @protected
   */
  protected async findGroupNameByPrefix(prefix?:string) : Promise<string|undefined> {
    prefix = prefix || this.prefix;
    return await this.run(`
      const gi = libraryWindow.groupItems;
      for (let i=0; i < gi.length; i++) {
        const name = gi.at(i).name();
        if (name.includes("${prefix}")) {
          return name;
        }
      }
      return undefined;
    `);
  }

  /**
   * Adds a Zotero collection object
   * @param {Zotero.Collection} collection
   */
  public async add_collection(collection: Zotero.Collection): Promise<void> {
    // do nothing
  }

  /**
   * Removes a Zotero collection object
   * @param {string[]} keys
   */
  public async remove_collections(keys: string[]): Promise<void> {
    // do nothing
  }

  /**
   * Given item data, generate a unique value for the `citekey` field that can deterministically
   * identify the item within the Bookends library. If Zotero had a globally unique id, this would
   * be the ideal candidate, but for now we take an URL'ish approach to generating this id.
   * @param item
   * @protected
   */
  protected generateCitekey(item: Zotero.Item.Any) : string {
    return `https://api.zotero.org${this.prefix}/items/${item.key}`;
  }

  /**
   * Translates a zotero item to data that can be imported into bookends
   * @param item
   * @param citekey
   * @protected
   */
  protected zoteroToBookends(item: Zotero.Item.Any | any, citekey: string): { [key: string] : string}  {
    const data = Translator.translate(item, zoteroDictionary, bookendsDictionary);
    data.citekey = citekey;
    return data;
  }

  /**
   * Returns the data of the item with the given citeky, or undefined if none such item exists
   * @param citekey
   * @protected
   */
  public async getByCitekey(citekey: string) : Promise<any> {
    return await this.run(`
      const items = bookends.sqlSearch("user1 REGEX '${citekey}'", {in: libraryWindow});
      if (items.length) {
        return items[0];
      }
      return undefined;`);
  }

  /**
   * Adds or updates a Zotero item object
   * @param {Zotero.Item.Any} item
   */
  public async add(item: Zotero.Item.Any | any): Promise<void> {
    // fast-forward in the case of a previous aborted sync
    if (this.fastForwardTo > 0 && this.lastIndex < this.fastForwardTo) {
      this.lastIndex++;
      return;
    }
    const citekey = this.generateCitekey(item);
    switch (item.itemType) {
      case "attachment":
      case "note":
        break;
      default: {
        let tries = 0;
        let error: null | string = null;
        while(tries++ < this.maxTries) {
          try {
            const storedData = await this.getByCitekey(citekey);
            const data = this.zoteroToBookends(item, citekey);
            if (storedData) {
              const changedProperties = Object.keys(storedData).filter( key => storedData[key] !== data[key]);
              const changedData: {[key: string]: string} = {};
              changedProperties.forEach(key => changedData[key] = data[key]);
              if (changedProperties.length) {
                console.log(changedData);
                // update if item has changed
                await this.run(`
                  const item = libraryWindow.publicationItems.byId("${storedData.id}");
                  for (let [key, value] of Object.entries(args[0])) {
                    item.setProperty(key, value);
                  }
                `, [changedData]);
              } else {
                console.log("no change");
              }
            } else {
              console.log("new");
              await this.run(`
                const item = bookends.PublicationItem(${JSON.stringify(data)});
                libraryWindow.publicationItems.push(item);
                const group = libraryWindow.groupItems.byName(\`${this.groupName}\`);
                bookends.add(item, {to:group});
              `);
            }
            // success!
            error = null;
            break; // break do-loop
          } catch (e) {
            if (e.message.includes("-1712")) {
              // timeout, try again
              error = e;
              continue;
            }
            // try to save metadata, including last index, ignoring any errors
            try {
              await this.saveMetadata();
            } catch (e) {}
            throw e;
          }
        }
        if (error) {
          throw error;
        }
        this.lastIndex++;
        // save metadata every 50 items so that this doesn't slow things down too much
        if (this.lastIndex % 50 === 0) {
          await this.saveMetadata();
        }
      }
    }
  }

  /**
   * Removes an Zotero item object
   * @param {string[]} keys
   */
  public async remove(keys: string[]): Promise<void> {
    // to do
  }

  /**
   * Saves the library metadata in the group name
   * @protected
   */
  protected async saveMetadata() {
    const oldGroupName = await this.findGroupNameByPrefix();
    this.groupName = this.generateGroupName(this.name);
    await this.run(`libraryWindow.groupItems.byName(\`${oldGroupName}\`).setProperty("name",\`${this.groupName}\`);`);
  }

  /**
   * Saves the Library metadata at the end of the sync process
   * @param {String} name Descriptive Name of the library
   * @param {Number} version
   */
  public async save(name: string, version: number): Promise<void> {
    if (name) {
      this.name = name;
    }
    this.version = version;
    this.lastIndex = 0;
    await this.saveMetadata();
  }
}
