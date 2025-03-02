const { app } = require("electron");
const Database = require("better-sqlite3");
const path = require("path");

let appPath = app.getAppPath();

// In production, go two levels up to reach the app root
if (app.isPackaged) {
  appPath = path.join(appPath, "..", "..");
}

let dbPath = appPath + "/notes.db"

// Open (or create) the database file
const db = new Database(dbPath);

// Create a notes table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    noteID TEXT PRIMARY KEY,
    sharpnoteVersion TEXT,
    noteTitle TEXT,
    noteContent TEXT,
    noteColor TEXT,
    noteAttachments TEXT,
    noteSyntax TEXT,
    noteOriginalAuthor TEXT,
    noteLastAuthor TEXT,
    created TEXT,
    lastSaved TEXT,
    lastOpened TEXT,
    lastExported TEXT,
    noteVersion INTEGER,
    noteTags TEXT
  )
`);

module.exports = db;
