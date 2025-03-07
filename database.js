const { app } = require("electron");
const Database = require("better-sqlite3");
const path = require("path");

let appPath = app.getAppPath();

// In production, go two levels up to reach the app root
if (app.isPackaged) {
  appPath = path.join(appPath, "..", "..");
}

let dbPath = appPath + "/sharpnote.db"

// Open (or create) the database file
const db = new Database(dbPath);

// Create a notes table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    noteID TEXT PRIMARY KEY,
    sharpnoteVersion TEXT,
    sharpnoteType TEXT,
    noteTitle TEXT,
    noteContent TEXT,
    noteColor TEXT,
    noteAttachments TEXT,
    noteOriginalAuthor TEXT,
    noteLastAuthor TEXT,
    noteFolder TEXT,
    created TEXT,
    lastSaved TEXT,
    lastOpened TEXT,
    lastExported TEXT,
    noteVersion INTEGER,
    noteTags TEXT,
    isReadonly BOOL
  )
`);

// Create a notes table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    folderID TEXT PRIMARY KEY,
    sharpnoteType TEXT,
    folderTitle TEXT,
    folderNotes TEXT,
    folderColor TEXT,
    folderOriginalAuthor TEXT,
    created TEXT
  )
`);

module.exports = db;
