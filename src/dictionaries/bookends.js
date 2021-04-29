/**
 * Map global to local types
 */
const types_toLocal =
{
  abstract: false,
  audiovisual: 'Audiovisual material',
  audio: 'Audiovisual material',
  database: undefined,
  ancient: undefined,
  journalArticle: 'Journal article',
  artwork: 'Artwork',
  bill: undefined,
  blogPost: 'Internet',
  book: 'Book',
  bookSection: 'Book chapter',
  case: undefined,
  chart: undefined,
  classical: undefined,
  software: false,
  proceedings: 'Conference proceedings',
  paper: 'Conference proceedings',
  catalog: undefined,
  data: undefined,
  webdb: undefined,
  dictionaryEntry: 'Book chapter',
  dissertation: 'Dissertation',
  document: 'Book',
  editorial: 'Editorial',
  ebook: undefined,
  echapter: undefined,
  collection: 'Edited book',
  earticle: 'Journal Article',
  internet: 'Internet',
  encyclopediaArticle: 'Book chapter',
  email: 'Personal communication',
  equation: false,
  figure: false,
  generic: false,
  government: false,
  grant: false,
  hearing: false,
  interview: 'Journal article',
  inpress: 'In press',
  journal: 'book',
  legal: false,
  letter: 'Letter',
  note: 'Letter',
  manuscript: 'Book',
  map: 'Map',
  magazineArticle: 'Journal article',
  movie: 'Audiovisual material',
  multimedia: 'Internet',
  music: false,
  newspaperArticle: 'Newspaper article',
  podcast: 'Internet',
  pamphlet: 'Letter',
  patent: 'patent',
  personal: 'Personal communication',
  radioBroadcast: 'Audiovisual material',
  presentation: false,
  report: 'Journal article',
  review: 'Review',
  serial: undefined,
  slide: false,
  sound: undefined,
  standard: undefined,
  statute: false,
  thesis: 'Dissertation',
  tvBroadcast: 'Audiovisual material',
  video: 'Audiovisual material',
  webpage: 'Internet'
};

const bookendsTypes = [
  "Artwork",
  "Audiovisual material",
  "Book",
  "Book chapter",
  "Conference proceedings",
  "Dissertation",
  "Edited book",
  "Editorial",
  "In press",
  "Journal article",
  "Letter",
  "Map",
  "Newspaper article",
  "Patent",
  "Personal communication",
  "Review",
  "Internet"
];

/**
 * Map global to local fields
 */
const fields_toLocal =
{
  id: 'id',
  itemType: {
    translateName: function (data) {
      return 'type';
    },
    translateContent: function (data) {
      let localType = types_toLocal[data.itemType] || "Journal article";
      return bookendsTypes.indexOf(localType);
    }
  },
  accessDate: false,
  abstractNote: 'abstract',
  authors: {
    translateName: function (data) {
      return 'authors';
    },
    translateContent: function (data) {
      return data.authors.split(/;/).map(function (elem) {
        return elem.trim();
      }).join("\n");
    }
  },
  authorTranslated: 'user9',
  applicationNumber: false,
  attachments: 'attachments',
  blogTitle: 'journal',
  bookTitle: 'volume',
  collections: "user20",
  conferenceName: 'journal',
  callNumber: 'user5',
  date: 'publicationDateString',
  doi: 'user17',
  edition: 'user2',
  editors: {
    translateName: function (data) {
      return 'editors';
    },
    translateContent: function (data) {
      return data.editors.split(/;/).map(function (elem) {
        return elem.trim();
      }).join("\n");
    }
  },
  issue: {
    translateName: function (data) {
      return "volume";
    },
    translateContent: function (data) {
      // if volume is set, let the volume field take care of it (return null), otherwise set issue only
      return data['volume'] ? null : (data['issue'] ? `(${data['issue']})`:"")
    }
  },
  isbn: 'user6',
  issn: 'user6',
  institution: 'publisher',
  journal: 'journal',
  keywords: 'keywords',
  language: 'user7',
  place: 'location',
  notes: 'notes',
  numberOfVolumes: 'user13',
  numPages: 'user13',
  originalPublication: 'user11',
  pages: 'pages',
  publisher: 'publisher',
  pubmedId: 'user18',
  reportNumber: 'volume',
  reprintEdition: 'user12',
  startPage: false,
  endPage: false,
  title: 'title',
  title2: 'title2',
  titleTranslated: 'user10',
  translators: {
    translateName: function (data) {
      return 'user3';
    },
    translateContent: function (data) {
      return data.authors.split(/;/).map(function (elem) {
        return elem.trim();
      }).join("\n");
    }
  },
  url: 'url',
  university: 'publisher',
  websiteTitle: 'journal',
  volume: {
    translateName: function (data) {
      return "volume";
    },
    translateContent: function (data) {
      return  (data['volume']?`${data['volume']}`:"") + (data['issue']?`(${data['issue']})`:"")
    }
  },
  archive: false,
  artworkSize: false,
  assignee: false,
  billNumber: false,
  caseName: false,
  code: false,
  codeNumber: false,
  codePages: false,
  codeVolume: false,
  committee: false,
  company: false,
  country: false,
  court: false,
  DOI: false,
  dateDecided: false,
  dateEnacted: false,
  dictionaryTitle: false,
  distributor: false,
  docketNumber: false,
  documentNumber: false,
  encyclopediaTitle: false,
  episodeNumber: false,
  extra: false,
  audioFileType: false,
  filingDate: false,
  firstPage: false,
  audioRecordingFormat: false,
  videoRecordingFormat: false,
  forumTitle: false,
  genre: false,
  history: false,
  issueDate: false,
  issuingAuthority: false,
  journalAbbreviation: false,
  label: false,
  programmingLanguage: false,
  legalStatus: false,
  legislativeBody: false,
  libraryCatalog: false,
  archiveLocation: false,
  interviewMedium: false,
  artworkMedium: false,
  meetingName: false,
  nameOfAct: false,
  network: false,
  patentNumber: false,
  postType: false,
  priorityNumbers: false,
  proceedingsTitle: false,
  programTitle: false,
  publicLawNumber: false,
  publicationTitle: false,
  references: false,
  reportType: false,
  reporter: false,
  reporterVolume: false,
  rights: false,
  runningTime: false,
  scale: false,
  section: false,
  series: false,
  seriesNumber: false,
  seriesText: false,
  seriesTitle: false,
  session: false,
  shortTitle: false,
  studio: false,
  subject: false,
  system: false,
  thesisType: 'user2',
  mapType: false,
  manuscriptType: false,
  letterType: false,
  presentationType: false,
  versionNumber: false,
  websiteType: false,
  version: 'user20'
};

/**
 * Map local to global types
 */
const types_toGlobal = {
  'Audiovisual material': 'video',
  'Journal article': 'journalArticle',
  Artwork: 'artwork',
  Internet: 'webpage',
  Book: 'book',
  'Book chapter': 'bookSection',
  'Conference proceedings': 'proceedings',
  Dissertation: 'thesis',
  Editorial: 'editorial',
  'Edited book': 'collection',
  'Journal Article': 'earticle',
  'Personal communication': 'personal',
  'In press': 'inpress',
  book: 'journal',
  Letter: 'pamphlet',
  Map: 'map',
  'Newspaper article': 'newspaperArticle',
  Patent: 'patent',
  Review: 'review'
};

/**
 * Map local to global fields
 */
const fields_toGlobal = {
  // store the bookends unique id in the "extra" field
  uniqueID: {
    translateName: function (data) {
      return false;
    },
    translateContent: function (data) {
      return {
        'bookends-uniqueId': data.uniqueID
      }
    }
  },
  type: {
    translateName: function (data) {
      return 'itemType';
    },
    translateContent: function (data) {
      let globalType = types_toGlobal[data.type];
      if (typeof globalType === "function") {
        globalType = globalType(data);
      }
      //console.log("Type:" + data.itemType + " -> " + localType);
      return globalType || "journalArticle";
    }
  },
  user1: {
    translateName: function (data) {
      return false;
    },
    translateContent: function (data) {
      return {
        'citationKey': data.user1
      }
    }
  },
  user20: 'version',
  abstract: 'abstractNote',
  authors: {
    translateName: function (data) {
      return 'authors';
    },
    translateContent: function (data) {
      return data.authors.split(/\n/).join("; ");
    }
  },
  user9: 'authorTranslated',
  editors: {
    translateName: function (data) {
      return 'editors';
    },
    translateContent: function (data) {
      return data.editors.split(/\n/).join("; ");
    }
  },
  attachments: 'attachments',
  journal: 'journal',
  user5: 'callNumber',
  thedate: 'date',
  user17: 'doi',
  user2: function (item) {
    switch (item.type) {
      case "Dissertation":
        return "thesisType";
      default:
        return "edition";
    }
  },
  user6: function (item) {
    switch (item.type) {
      case "journal":
      case "journalArticle":
        return "issn";
      default:
        return "isbn";
    }
  },
  publisher: 'publisher',
  keywords: {
    translateName: function (data) {
      return 'keywords';
    },
    translateContent: function (data) {
      return data.keywords.split(/\n/).join(";");
    }
  },
  user7: 'language',
  location: 'place',
  notes: 'notes',
  user13: 'numPages',
  user11: 'originalPublication',
  pages: 'pages',
  user18: 'pubmedId',
  user12: 'reprintEdition',
  title: 'title',
  title2: 'title2',
  user10: false,
  user3: 'translators',
  url: 'url',
  user4: false,
  user8: false,
  user14: false,
  user15: false, // used for last-sync-date
  user16: false,
  user19: "collections",
  volume: {
    translateName: function (data) {
      return false;
    },
    translateContent: function (data) {
      switch (data.type) {
        case "Book chapter":
          return {"bookTitle":data.volume};
        case "Journal article":
        case "Newspaper article":
          let match = (""+data.volume).match(/([^(]+)\(([^)]+)\)/);
          if( Array.isArray(match)) {
            let [skip, volume, issue] = match;
            return {volume, issue};
          }
          // fallthrough
        default:
          return {
            volume : data.volume
          };
      }
    }
  }
};

/**
 * Module definition
 */
module.exports = {
  types: {
    toLocal: types_toLocal,
    toGlobal: types_toGlobal
  },
  fields: {
    toLocal: fields_toLocal,
    toGlobal: fields_toGlobal
  }
};
