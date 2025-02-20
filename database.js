const Database = require("better-sqlite3");

// Open (or create) the database file
const db = new Database("notes.db");

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
    noteAuthor TEXT,
    created TEXT,
    lastSaved TEXT,
    lastOpened TEXT,
    exported TEXT,
    noteVersion INTEGER,
    noteTags TEXT
  )
`);

module.exports = db;
