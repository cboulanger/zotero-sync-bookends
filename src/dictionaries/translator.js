const bookendsDictionary = require('./bookends');
const zoteroDictionary = require('./zotero');

/**
 * The Translator class takes care of translating fields from one application to
 * the other, using dictionaries of "local dialects" and a global exchange
 * format, which is close to the Zotero schema, but has a flat structure
 */
class Translator
{

  /**
   * Translates a reference from the source to the target format
   * @param {object} item
   * @param {object} from Source dictionary object
   * @param {object} to Target dictionary object
   * @return {object}
   */
  static translate(item, from, to) {
    let intermediate = Translator._translate(from, item, true);
    return Translator._translate(to, intermediate, false);
  }


  /**
   * Translates a reference from or to the intermediate format
   * @param {Object} dictionary The translation dictionary
   * @param {Object} item The item to be translated
   * @param {Boolean} toGlobal
   *    If true (default), translate from a local dialect to the global exchange format.
   *    If false, translate from global to local.
   * @return {Object} The translated item
   */
  static _translate (dictionary, item, toGlobal=true){
    let translated_item = {};
    const toLocal = ! toGlobal;
    const map = toGlobal ? dictionary.fields.toGlobal : dictionary.fields.toLocal;
    // 'extra' field for untranslateable fields
    if (toGlobal) {
      if (typeof item.extra === "string") {
        // unpack if exists in string form
        translated_item.extra = this.unpack(item.extra);
      } else {
        translated_item.extra = {};
      }
    }
    Object.getOwnPropertyNames(item).forEach((field)=>{
      if (item[field]==="") return;
      let translated_name    = this.translateFieldName(map, field, item);
      let translated_content = this.translateFieldContent(map, field, item);
      if( translated_name === undefined) return;

      // set default value of field
      if (translated_item[translated_name] === undefined
        && map[field] && typeof map[field] == "object"
        && typeof map[field].default === "function") {
        translated_item[translated_name] = map[field].default();
      }

      // no direct equivalent of field name in target language,
      if (translated_name === false && translated_content && typeof translated_content == "object") {
        // field name depends on content, merge result into item
        Object.getOwnPropertyNames(translated_content).forEach(key => {
          if ((dictionary.fields.toGlobal[key] || dictionary.fields.toLocal[key]) !== undefined){
            // the field exists in target language
            this.append(translated_item,key,translated_content[key]);
          } else {
            // otherwise, put in 'extra' field
            this.append( translated_item.extra, key, translated_content[key]);
          }
        });
      }
      // we have an equivalent in the target language
      else if (typeof translated_name === "string"){
        if ( translated_name.startsWith("zotero") || translated_name.startsWith('bookends') || translated_name === "citationKey" ){
          // if we have a special field name, store content in 'extra' field
          this.append(translated_item.extra, translated_name, translated_content);
        } else {
          this.append(translated_item, translated_name, translated_content);
        }
      }
      // else ignore field
    });
    // pack 'extra' field
    if( toGlobal){
      let extra = translated_item.extra;
      if (typeof extra === "object" &&  Object.getOwnPropertyNames(extra).length > 0) {
        translated_item.extra = this.pack(translated_item.extra);
      }
    }
    return translated_item;
  }


  /**
   * Packs an object into a string using the HTTP header format for readability
   * @param {{}} map
   * @return {string}
   */
  static pack(map){
    return Object.getOwnPropertyNames(map)
      .map(key => `${key}:${map[key]}`)
      .join("\n");
  }

  /**
   * Unpacks a HTTP-header-like string into its key-value components. Returns an object
   * @param str
   * @return {{}}
   */
  static unpack(str) {
    if (typeof str != "string") throw new TypeError("Argument must be a string");
    let map = {};
    str.split(/\n/).forEach(item=>{
      let [key,value] = item.split(/:/);
      map[key]=value;
    });
    return map;
  }

  /**
   * If the field is not empty, append the content using an appropriate strategy that depends
   * on the type
   * @param {{}} item
   * @param {String} field
   * @param {*} content
   * @param {String} separator Separator for string type fields, defaults to "; "
   */
  static append(item, field, content, separator="; ") {
    // empty content will not be appended
    if( !content) return;
    // append to old content, if any
    let oldContent = item[field];
    if ( oldContent === undefined || oldContent === ""){
      item[field] = content;
      return;
    }
    if (Array.isArray(oldContent)) {
      if( Array.isArray(content)){
        // arrays will be concatenated
        item[field] = item[field].concat(content);
      } else {
        // other types will be appended
        item[field].push(content);
      }
    } else if (typeof oldContent === "string") {
      item[field] += separator + content;
    }
  }

  /**
   * Translates a reference from the local dialect to the global exchange format.
   * @param {Object} dictionary The translation dictionary
   * @param {Object} item The item to be translated
   * @return {Object} The translated item
   */
  static toGlobal (dictionary, item){
    return this.translate(dictionary, item, true);
  }

  /**
   * Translates a reference from the global exchange format to the local dialect.
   * @param {Object} dictionary The translation dictionary
   * @param {Object} item The item to be translated
   * @return {Object} The translated item
   */
  static toLocal (dictionary, item){
    return this.translate(dictionary, item, false);
  }

  /**
   * Translates the name of a field (== key)
   * @param {Object} map The translation dictionary
   * @param {String} field The field name
   * @param {Object} item The item to be translated
   * @return {String} The translated field name
   */
  static translateFieldName (map, field, item) {
    // the field name translation can be a  function
    if (typeof map[field] === "function") {
      return map[field](item);
    }
    // or a method of an object
    if (typeof map[field] === "object") {
      // translate name
      if (typeof map[field].translateName === "function") {
        return map[field].translateName(item);
      }
    }
    // or a simple string or boolean false
    if (typeof map[field] === "string" || map[field] === false) {
      return map[field];
    }

    // if not defined no translation
    if (map[field]===undefined) return undefined;

    throw new Error(`Invalid field definition for '${field}'`);
  }

  /**
   * Translates the name of a field (== key)
   * @param {Object} map The translation dictionary
   * @param {String} field The field name
   * @param {Object} item The item to be translated
   * @return {*} The translated field content
   */
  static translateFieldContent (map, field, item) {
    if (typeof map[field] === "object") {
      if (typeof map[field].translateContent === "function") {
        return map[field].translateContent(item);
      }
    }
    return item[field];
  }
}

module.exports = {
  Translator,
  zoteroDictionary,
  bookendsDictionary
};
