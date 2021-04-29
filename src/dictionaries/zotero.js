/**
 * Creates a function that exports a flat creator field to the Zotero creator data model
 * @param {String} creatorType The creatorType
 * @param {String} field The name of the field in the source dialect, defaults to the creatorType + "s"
 * @return {function(*): *}
 */
const makeCreatorFunc = function(creatorType, field = creatorType+"s") {
  return function(data){
    let creators = [];
    if (data[field] === undefined) throw new Error(`Invalid creatorType '${creatorType}' or field '${field}'`);
    if (typeof data[field] !== "string") throw new Error(`Content in field '${field}' must be string`);
    data[field].split(/;/).map(elem => {
      if( elem.includes(",") && elem.length > 3 && ! elem.endsWith(',') ){
        part = elem.split(/,/);
        creators.push({
          creatorType,
          lastName: part[0].trim(),
          firstName: part[1].trim()
        });
      } else if(elem.trim()) {
        creators.push({
          creatorType,
          name: elem.trim()
        });
      }
    });
    return creators;
  }
};

/**
 * Map global to local types
 */
const types_toLocal =
{ abstract: false,
  audiovisual: false,
  audio: 'audioRecording',
  database: 'database',
  ancient: false,
  journalArticle: 'journalArticle',
  artwork: 'artwork',
  bill: 'bill',
  blogPost: 'blogPost',
  book: 'book',
  bookSection: 'bookSection',
  case: 'case',
  chart: false,
  classical: false,
  software: 'computerProgram',
  proceedings: 'book',
  paper: 'conferencePaper',
  catalog: 'book',
  data: false,
  webdb: false,
  dictionaryEntry: 'dictionaryEntry',
  dissertation: 'thesis',
  document: 'document',
  editorial: 'newspaperArticle',
  ebook: 'book',
  echapter: 'bookSection',
  collection: 'book',
  earticle: 'journalArticle',
  internet: 'webpage',
  encyclopediaArticle: 'encyclopediaArticle',
  email: 'email',
  equation: false,
  figure: false,
  generic: false,
  government: false,
  grant: false,
  hearing: 'hearing',
  interview: 'interview',
  inpress: 'manuscript',
  journal: 'book',
  legal: 'bill',
  letter: 'letter',
  note: 'note',
  manuscript: 'manuscript',
  map: 'map',
  magazineArticle: 'magazineArticle',
  movie: 'movie',
  multimedia: 'multimedia',
  music: false,
  newspaperArticle: 'newspaperArticle',
  podcast: 'podcast',
  pamphlet: 'document',
  patent: 'patent',
  personal: 'letter',
  radioBroadcast: 'radioBroadcast',
  presentation: 'presentation',
  report: 'report',
  review: 'journalArticle',
  serial: 'serial',
  slide: false,
  sound: 'sound',
  standard: 'standard',
  statute: 'statute',
  thesis: 'thesis',
  tvBroadcast: 'tvBroadcast',
  video: 'videoRecording',
  webpage: 'webpage'
};

/**
 * Map global to local fields
 */
const fields_toLocal = {
  itemType: {
    translateName : function(data) {
      return 'itemType';
    },
    translateContent : function(data)
    {
      let localType = types_toLocal[data.itemType];
      if( typeof localType === "function" ){
        localType = localType(data);
      }
      //console.log("Type:" + data.itemType + " -> " + localType);
      return localType || "journalArticle";
    }
  },
  accessDate: 'accessDate',
  abstractNote: 'abstractNote',
  attachments : "attachments",
  authors: {
    default: () => [],
    translateName: () => 'creators',
    translateContent: makeCreatorFunc("author")
  },
  authorTranslated: 'authorTranslated',
  applicationNumber: 'applicationNumber',
  blogTitle: 'blogTitle',
  bookTitle: 'bookTitle',
  collections: {
    default: () => [],
    translateName: () => 'collections',
    translateContent: data => data.split(",")
  },
  conferenceName: 'conferenceName',
  callNumber: 'callNumber',
  date: 'date',
  dateAdded: 'dateAdded',
  doi: 'DOI',
  edition: 'edition',
  editors: {
    default: () => [],
    translateName: () => 'creators',
    translateContent: makeCreatorFunc("editor")
  },
  issue: 'issue',
  isbn: 'ISBN',
  issn: 'ISSN',
  institution: 'institution',
  journal: 'publicationTitle',
  keywords: {
    translateName   : function(data) {
      return "tags";
    },
    translateContent : function(data){
      return data.keywords.split(/;/).filter(item => !!item.trim()).map(item => ({tag: item.trim().substr(0,100), type: 1}));
    }
  },
  language: 'language',
  place: 'place',
  notes: {
    translateName   : function(data) {
      return "notes";
    },
    translateContent : function(data){
      return data.notes.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }
  },
  numberOfVolumes: 'numberOfVolumes',
  numPages: 'numPages',
  originalPublication: 'originalPublication',
  pages: 'pages',
  publisher: 'publisher',
  pubmedId: 'pubmedId',
  reportNumber: 'reportNumber',
  reprintEdition: 'reprintEdition',
  startPage: 'firstPage',
  endPage: false,
  title: 'title',
  title2: false,
  titleTranslated: 'titleTranslated',
  translators: {
    default: () => [],
    translateName: () => 'creators',
    translateContent: makeCreatorFunc("translator")
  },
  url: 'url',
  university: 'university',
  websiteTitle: 'websiteTitle',
  volume: 'volume',
  archive: 'archive',
  artworkSize: 'artworkSize',
  assignee: 'assignee',
  billNumber: 'billNumber',
  caseName: 'caseName',
  code: 'code',
  codeNumber: 'codeNumber',
  codePages: 'codePages',
  codeVolume: 'codeVolume',
  committee: 'committee',
  company: 'company',
  country: 'country',
  court: 'court',
  dateDecided: 'dateDecided',
  dateEnacted: 'dateEnacted',
  dictionaryTitle: 'dictionaryTitle',
  distributor: 'distributor',
  docketNumber: 'docketNumber',
  documentNumber: 'documentNumber',
  encyclopediaTitle: 'encyclopediaTitle',
  episodeNumber: 'episodeNumber',
  extra: 'extra',
  audioFileType: 'audioFileType',
  filingDate: 'filingDate',
  firstPage: 'firstPage',
  audioRecordingFormat: 'audioRecordingFormat',
  videoRecordingFormat: 'videoRecordingFormat',
  forumTitle: 'forumTitle',
  genre: 'genre',
  history: 'history',
  issueDate: 'issueDate',
  issuingAuthority: 'issuingAuthority',
  journalAbbreviation: 'journalAbbreviation',
  label: 'label',
  programmingLanguage: 'programmingLanguage',
  legalStatus: 'legalStatus',
  legislativeBody: 'legislativeBody',
  libraryCatalog: 'libraryCatalog',
  archiveLocation: 'archiveLocation',
  interviewMedium: 'interviewMedium',
  artworkMedium: 'artworkMedium',
  meetingName: 'meetingName',
  nameOfAct: 'nameOfAct',
  network: 'network',
  patentNumber: 'patentNumber',
  postType: 'postType',
  priorityNumbers: 'priorityNumbers',
  proceedingsTitle: 'proceedingsTitle',
  programTitle: 'programTitle',
  publicLawNumber: 'publicLawNumber',
  publicationTitle: 'publicationTitle',
  references: 'references',
  reportType: 'reportType',
  reporter: 'reporter',
  reporterVolume: 'reporterVolume',
  rights: 'rights',
  runningTime: 'runningTime',
  scale: 'scale',
  section: 'section',
  series: 'series',
  seriesNumber: 'seriesNumber',
  seriesText: 'seriesText',
  seriesTitle: 'seriesTitle',
  session: 'session',
  shortTitle: 'shortTitle',
  studio: 'studio',
  subject: 'subject',
  system: 'system',
  thesisType: 'thesisType',
  mapType: 'mapType',
  manuscriptType: 'manuscriptType',
  letterType: 'letterType',
  presentationType: 'presentationType',
  versionNumber: 'versionNumber',
  websiteType: 'websiteType',
  custom1: false,
  custom2: false,
  custom3: false,
  custom4: false,
  custom5: false,
  custom6: false,
  custom7: false
};

/**
 * Map local to global types
 */
const types_toGlobal = {
  attachment : "attachment",
  audioRecording: 'audio',
  database: 'database',
  journalArticle: 'journalArticle',
  artwork: 'artwork',
  bill: 'legal',
  blogPost: 'blogPost',
  book: function(data){
    return ( data.creators && data.creators.some(function(item){
      return item.creatorType === "editor";
    }) ) ? "collection" : "book";
  },
  bookSection: 'bookSection',
  case: 'case',
  computerProgram: 'software',
  conferencePaper: 'paper',
  dictionaryEntry: 'dictionaryEntry',
  thesis: 'thesis',
  document: 'pamphlet',
  newspaperArticle: 'newspaperArticle',
  webpage: 'webpage',
  encyclopediaArticle: 'encyclopediaArticle',
  email: 'email',
  hearing: 'hearing',
  interview: 'interview',
  letter: 'personal',
  note: 'note',
  manuscript: 'manuscript',
  map: 'map',
  magazineArticle: 'magazineArticle',
  movie: 'movie',
  multimedia: 'multimedia',
  podcast: 'podcast',
  patent: 'patent',
  radioBroadcast: 'radioBroadcast',
  presentation: 'presentation',
  report: 'report',
  serial: 'serial',
  sound: 'sound',
  standard: 'standard',
  statute: 'statute',
  tvBroadcast: 'tvBroadcast',
  videoRecording: 'video'
};

/**
 * Map local to global fields
 */
const fields_toGlobal ={
  key: {
    translateName : function(data) {
      return false;
    },
    translateContent : function(data)
    {
      return { 'zotero-key' : data.key};
    }
  },
  itemType: {
    translateName : function(data) {
      return 'itemType';
    },
    translateContent : function(data)
    {
      let globalType = types_toGlobal[data.itemType];
      if( typeof globalType === "function" ){
        globalType = globalType(data);
      }
      //console.log("Type:" + data.itemType + " -> " + globalType);
      return globalType || "journalArticle";
    }
  },
  accessDate: 'accessDate',
  abstractNote: 'abstractNote',
  collections: {
    translateName: () => 'collections',
    translateContent: data => data.collections.join(",")
  },
  creators: {
    translateName: function() {return false;}, // field name depends on content
    translateContent: function(data){
      let field,name, content={};
      data.creators.map(function(elem) {
        // @todo make this more sophisticated
        name = elem.name || elem.lastName + ", " + elem.firstName;
        field = elem.creatorType+"s";
        content[field] = (content[field] ? content[field]+"; ":"")+ name;
      });
      return content;
    }
  },
  tags: {
    translateName: function(data) {
      return "keywords";
    },
    translateContent: function(data){
      return data.tags.reduce((result, elem) => (result ? result + "; " :"") + elem.tag, "");
    }
  },
  applicationNumber: 'applicationNumber',
  blogTitle: 'blogTitle',
  bookTitle: 'bookTitle',
  conferenceName: 'conferenceName',
  callNumber: 'callNumber',
  date: 'date',
  dateAdded: 'dateAdded',
  DOI: 'doi',
  edition: 'edition',
  editors: 'editors',
  issue: 'issue',
  ISBN: 'isbn',
  ISSN: 'issn',
  institution: 'institution',
  publicationTitle: 'journal',
  language: 'language',
  place: 'place',
  notes: {
    translateName   : function(data) {
      return "notes";
    },
    translateContent : function(data){
      return data.notes.replace(/<br \/>/g, '\n');
    }
  },
  numberOfVolumes: 'numberOfVolumes',
  numPages: 'numPages',
  originalPublication: 'originalPublication',
  pages: 'pages',
  publisher: 'publisher',
  pubmedId: 'pubmedId',
  reportNumber: 'reportNumber',
  reprintEdition: 'reprintEdition',
  firstPage: 'firstPage',
  title: 'title',
  titleTranslated: 'titleTranslated',
  url: 'url',
  university: 'university',
  websiteTitle: 'websiteTitle',
  volume: 'volume',
  archive: 'archive',
  artworkSize: 'artworkSize',
  assignee: 'assignee',
  billNumber: 'billNumber',
  caseName: 'caseName',
  code: 'code',
  codeNumber: 'codeNumber',
  codePages: 'codePages',
  codeVolume: 'codeVolume',
  committee: 'committee',
  company: 'company',
  country: 'country',
  court: 'court',
  dateDecided: 'dateDecided',
  dateEnacted: 'dateEnacted',
  dictionaryTitle: 'dictionaryTitle',
  distributor: 'distributor',
  docketNumber: 'docketNumber',
  documentNumber: 'documentNumber',
  encyclopediaTitle: 'encyclopediaTitle',
  episodeNumber: 'episodeNumber',
  extra: "extra",
  audioFileType: 'audioFileType',
  filingDate: 'filingDate',
  audioRecordingFormat: 'audioRecordingFormat',
  videoRecordingFormat: 'videoRecordingFormat',
  forumTitle: 'forumTitle',
  genre: 'genre',
  history: 'history',
  issueDate: 'issueDate',
  issuingAuthority: 'issuingAuthority',
  journalAbbreviation: 'journalAbbreviation',
  label: 'label',
  programmingLanguage: 'programmingLanguage',
  legalStatus: 'legalStatus',
  legislativeBody: 'legislativeBody',
  libraryCatalog: 'libraryCatalog',
  archiveLocation: 'archiveLocation',
  interviewMedium: 'interviewMedium',
  artworkMedium: 'artworkMedium',
  meetingName: 'meetingName',
  nameOfAct: 'nameOfAct',
  network: 'network',
  patentNumber: 'patentNumber',
  postType: 'postType',
  priorityNumbers: 'priorityNumbers',
  proceedingsTitle: 'proceedingsTitle',
  programTitle: 'programTitle',
  publicLawNumber: 'publicLawNumber',
  references: 'references',
  reportType: 'reportType',
  reporter: 'reporter',
  reporterVolume: 'reporterVolume',
  rights: 'rights',
  runningTime: 'runningTime',
  scale: 'scale',
  section: 'section',
  series: 'series',
  seriesNumber: 'seriesNumber',
  seriesText: 'seriesText',
  seriesTitle: 'seriesTitle',
  session: 'session',
  shortTitle: 'shortTitle',
  studio: 'studio',
  subject: 'subject',
  system: 'system',
  thesisType: 'thesisType',
  mapType: 'mapType',
  manuscriptType: 'manuscriptType',
  letterType: 'letterType',
  presentationType: 'presentationType',
  versionNumber: 'versionNumber',
  websiteType: 'websiteType'
};

/**
 * Module definition
 */
module.exports = {
  types : {
    toLocal : types_toLocal,
    toGlobal  : types_toGlobal
  },
  fields : {
    toLocal : fields_toLocal,
    toGlobal  : fields_toGlobal
  }
};
