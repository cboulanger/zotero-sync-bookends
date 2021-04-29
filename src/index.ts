import runJxa from 'run-jxa';
import type { Zotero } from "@retorquere/zotero-sync/typings/zotero"

const { Translator, zoteroDictionary, bookendsDictionary } = require('./dictionaries/translator');
const process = require('process');

export class Store implements Zotero.Store {

    // interface properties
  public libraries : string[];

  // public properties
  public fileName: string;
  public static verbose: boolean = false; // set this to true if you want to have verbose output

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
  private isNew: boolean = false;
  private synchronizingMessage = "Synchronizing...";

  constructor(store: Store, user_or_group_prefix: string) {
    this.store = store;
    this.prefix = user_or_group_prefix;
  }

  /**
   * Output additional information on the console if the environment variable
   * ZOTERO_SYNC_DEBUG is set
   * @param {string} msg
   * @private
   */
  private debug(msg:string) {
    if (Store.verbose) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      console.log(msg);
    }
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
      if (this.version === 0) {
        // a case of an aborted initial sync
        this.isNew = true;
      }
      this.fastForwardTo = data.lastIndex || 0;
    } else {
      this.isNew = true;
      this.name = this.synchronizingMessage;
      this.groupName = this.generateGroupName();
      await this.addGroup(this.groupName);
    }
    return this;
  }

  /**
   * Adds a Bookends group
   * @param groupName
   */
  protected async addGroup(groupName:string) {
    await this.run(`libraryWindow.groupItems.push(bookends.GroupItem({name:\`${groupName}\`}));`);
  }

  /**
   * Renames a Bookends group
   * @param oldGroupName
   * @param newGroupName
   * @protected
   */
  protected async renameGroup(oldGroupName: string, newGroupName: string) {
    await this.run(`libraryWindow.groupItems.byName(\`${oldGroupName}\`).setProperty("name",\`${newGroupName}\`);`);
  }

  /**
   * Deletes a Bookends group
   * @param groupName
   * @protected
   */
  protected async removeGroup(groupName:string) {
    try {
      await this.run(`bookends.delete(libraryWindow.groupItems.byName(\`${groupName}\`))`);
    } catch(e) {
      if (e.message.includes("-1728")) {
        throw new Error(`Cannot delete non-existing group item with name ${groupName}`);
      }
      throw e;
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
   * Removes the Bookends group containing the library items
   */
  public async delete() {
    if (this.groupName) {
      await this.removeGroup(this.groupName);
    } else {
      throw new Error("Cannot delete Library - bookends group name has not been determined yet.");
    }
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
  protected generateCitekey(item: Zotero.Item.Any|{key:string}) : string {
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
   * Returns the data of the publication item with the given citeky, or undefined if none such item exists
   * @param citekey
   * @protected
   */
  protected async getPublicationByCitekey(citekey: string) : Promise<{[key:string]:string}|undefined> {
    return await this.run(`
      const items = bookends.sqlSearch("user1 REGEX '${citekey}'", {in: libraryWindow});
      if (items.length) {
        return items[0].properties();
      }
      return undefined;`);
  }

  /**
   * Adds a publication item and links it to the current group
   * @param {object} data
   * @param {string?} groupName Optional name of the group, by default the group that contains the library items
   * @protected
   */
  protected async addPublication(data: {[key:string]:string}, groupName?:string) : Promise<void> {
    groupName = groupName || this.groupName;
    await this.run(`
      const item = bookends.PublicationItem(${JSON.stringify(data)});
      libraryWindow.publicationItems.push(item);
      const group = libraryWindow.groupItems.byName(\`${groupName}\`);
      bookends.add(item, {to:group});
    `);
  }

  /**
   * Updates a publication item
   * @param {number} id
   * @param {object} data
   * @protected
   */
  protected async updatePublication(id: number, data: {[key:string]:string}) : Promise<void> {
    try {
      await this.run(`
        const item = libraryWindow.publicationItems.byId("${id}");
        for (let [key, value] of Object.entries(args[0])) {
          item.setProperty(key, value);
        }
      `, [data]);
    } catch(e) {
      if (e.message.includes("-1728")) {
        throw new Error(`Cannot update non-existing publication item with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Deletes a publication item
   * @param id
   * @protected
   */
  protected async removePublication(id: number) : Promise<void> {
    try {
      await this.run(`bookends.delete(libraryWindow.publicationItems.byId(${id})`);
    } catch(e) {
      if (e.message.includes("-1728")) {
        throw new Error(`Cannot delete non-existing publication item with id ${id}`);
      }
      throw e;
    }
  }

  /**
   * Adds or updates a Zotero item object
   * @param {Zotero.Item.Any} item
   */
  public async add(item: Zotero.Item.Any | any): Promise<void> {
    // fast-forward in the case of a previous aborted sync
    if (this.fastForwardTo > 0 && this.lastIndex < this.fastForwardTo) {
      if (this.lastIndex === 0) {
        this.debug(`Fast-forwarding, skipping previously synchronized items...`);
      }
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
            const storedData = await this.getPublicationByCitekey(citekey)
            const data = this.zoteroToBookends(item, citekey);
            if (storedData) {
              const changedProperties = Object.keys(data).filter( key => data[key] !== storedData[key]);
              if (changedProperties.length) {
                // update if item has changed
                const changedData: {[key: string]: string} = {};
                changedProperties.forEach(key => changedData[key] = data[key]);
                this.debug(`Updating item '${data.title}', properties ${Object.keys(changedData).join(",")}`);
                await this.updatePublication(Number(storedData.id), changedData);
              }
            } else {
              this.debug(`Adding item '${data.title}' ...`);
              await this.addPublication(data);
            }
            // success!
            error = null;
            break; // break while-loop
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
        // save metadata every 10 items so that this doesn't slow things down too much
        if (this.lastIndex % 10 === 0) {
          await this.saveMetadata();
        }
      }
    }
  }

  /**
   * Removes Zotero item objects
   * @param {string[]} keys
   */
  public async remove(keys: string[]): Promise<void> {
    if (this.isNew) {
      // nothing to delete
      return;
    }
    for (let key of keys) {
      const item = await this.getPublicationByCitekey(this.generateCitekey({key}));
      if (item) {
        this.debug(`Deleting '${item.title}' ...`);
        await this.removePublication(Number(item.id));
      }
    }
  }

  /**
   * Saves the library metadata in the group name
   * @protected
   */
  protected async saveMetadata() {
    const oldGroupName = await this.findGroupNameByPrefix();
    if (!oldGroupName) {
      throw new Error("Cannot find group for prefix " + this.prefix);
    }
    this.groupName = this.generateGroupName();
    await this.renameGroup(oldGroupName, this.groupName);
  }

  /**
   * Saves the Library metadata at the end of the sync process
   * @param {String} name Descriptive Name of the library
   * @param {Number} version
   */
  public async save(name: string, version: number): Promise<void> {
    this.name = name || "User Library";
    this.version = version;
    this.lastIndex = 0;
    await this.saveMetadata();
  }
}
