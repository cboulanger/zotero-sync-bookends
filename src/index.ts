import runJxa from 'run-jxa';
import type { Zotero } from "@retorquere/zotero-sync/typings/zotero"

export class Store implements Zotero.Store {

  public libraries : string[];
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

  // internal config
  private readonly user_or_group_prefix: string;
  private readonly store: Store;

  constructor(store: Store, user_or_group_prefix: string) {
    this.store = store;
    this.name = this.user_or_group_prefix = user_or_group_prefix;
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
    return await runJxa(`
      const bookends = Application("Bookends");
      const libraryWindow = bookends.libraryWindows.byName("${this.store.fileName}");
      ${cmd}
    `, args);
  }

  /**
   * Initialize the library instance. This creates a Bookends group for all
   * references.
   */
  public async init(): Promise<Library> {
    try {
      await this.run(`libraryWindow.groupItems.push(bookends.GroupItem({name:"${this.name}"}));`);
    } catch (e) {
      if (!e.stderr.includes("already exists")) {
        throw e;
      }
    }
    return this;
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
   * Takes a Zotero `creators` field and translates it to a Bookends `authors` field
   * @param creators
   * @protected
   */
  protected translateCreatorsToAuthors(creators:any[] ) {
    return creators.map( creator => creator.name || `${creator.lastName}, ${creator.firstName}` ).join("\n");
  }

  /**
   * Given item data, generate a unique value for the `citekey` field that can deterministically
   * identify the item within the Bookends library. If Zotero had a globally unique id, this would
   * be the ideal candidate, but for now we take an URL'ish approach to generating this id.
   * @param item
   * @protected
   */
  protected generateCitekey(item: Zotero.Item.Any) : string {
    return `zotero:${this.user_or_group_prefix}/items/${item.key}`;
  }


  /**
   * Returns true if an item has already been added (as identified by its citekey), false if not
   * @param citekey
   * @protected
   */
  protected async itemExists(citekey: string) : Promise<boolean> {
    return await this.run(`
      return bookends.sqlSearch("user1 REGEX '${citekey}'", {in: libraryWindow}).length > 0;
    `);
  }

  /**
   * Adds a Zotero item object
   * @param {Zotero.Item.Any} item
   */
  public async add(item: Zotero.Item.Any | any): Promise<void> {
    const citekey = this.generateCitekey(item);
    switch (item.itemType) {
      case "attachment":
      case "note":
        break;
      default:
        if (await this.itemExists(citekey)) {
          return;
        }
        try {
          const data = {
            title: item.title,
            publicationDateString: item.date,
            authors: Array.isArray(item.creators) ? this.translateCreatorsToAuthors(item.creators) : "",
            citekey
          };
          await this.run(`
            const item = bookends.PublicationItem(${JSON.stringify(data)});
            const group = libraryWindow.groupItems.byName("${this.name}");
            libraryWindow.publicationItems.push(item);
            bookends.add(item, {to:group});
          `);
        } catch (e) {
          //if (!e.stderr.includes("already exists")) {
          throw e;
          //}
        }
    }
  }

  /**
   * Removes an Zotero item object
   * @param {string[]} keys
   */
  public async remove(keys: string[]): Promise<void> {


  }

  /**
   * Saves the Library
   * @param {String?} name Descriptive Name of the library
   * @param {Number} version
   */
  public async save(name: string, version: number): Promise<void> {

  }
}
