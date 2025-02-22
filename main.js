const { app, BrowserWindow, ipcMain } = require("electron");
const db = require("./database");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, './public/logo512.png'), // Set the app icon here
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Load the preload script
      contextIsolation: true, // Keep context isolation enabled (default)
      enableRemoteModule: false,
      nodeIntegration: false, // Prevent unsafe access
    },
  });

  mainWindow.removeMenu(); // Hides the default menu
  mainWindow.maximize(); // Start in maximized mode
  mainWindow.webContents.openDevTools(); // Open DevTools automatically
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.loadURL("http://localhost:3000"); // Change if using packaged app
});

// Fetch all notes
ipcMain.handle("get-notes", () => {
  const stmt = db.prepare("SELECT * FROM notes ORDER BY lastOpened DESC");
  return stmt.all();
});

// Add a new note
ipcMain.handle("add-note", (_, newNote) => {
  const stmt = db.prepare(`
    INSERT INTO notes (noteID, sharpnoteVersion, noteTitle, noteContent, noteColor, noteAttachments, noteSyntax, noteAuthor, created, lastSaved, lastOpened, exported, noteVersion, noteTags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    newNote.noteID,
    newNote.sharpnoteVersion,
    newNote.noteTitle,
    newNote.noteContent,
    newNote.noteColor,
    JSON.stringify(newNote.noteAttachments || []), // Store as JSON
    newNote.noteSyntax,
    newNote.noteAuthor,
    newNote.noteHistory.created,
    newNote.noteHistory.lastSaved,
    newNote.noteHistory.lastOpened,
    newNote.noteHistory.exported || "",
    newNote.noteHistory.noteVersion,
    JSON.stringify(newNote.noteTags || []) // Store as JSON
  );

  return newNote;
});

// Update a note
ipcMain.handle("update-note", (_, updatedNote) => {
  const stmt = db.prepare(`
    UPDATE notes
    SET noteTitle = ?, noteContent = ?, noteColor = ?, noteAttachments = ?, noteSyntax = ?, noteAuthor = ?, lastSaved = ?, lastOpened = ?, exported = ?, noteVersion = ?, noteTags = ?
    WHERE noteID = ?
  `);

  stmt.run(
    updatedNote.noteTitle,
    updatedNote.noteContent,
    updatedNote.noteColor,
    updatedNote.noteAttachments,
    updatedNote.noteSyntax,
    updatedNote.noteAuthor,
    updatedNote.lastSaved,
    updatedNote.lastOpened,
    updatedNote.exported || "",
    updatedNote.noteVersion,
    updatedNote.noteTags,
    updatedNote.noteID
  );
});

// Delete a note
ipcMain.handle("delete-note", (_, noteID) => {
  const stmt = db.prepare("DELETE FROM notes WHERE noteID = ?");
  stmt.run(noteID);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const fs = require("fs");

let configPath = "sharpnote-config.json";

// Read settings
ipcMain.handle("get-settings", async () => {
  try {
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading settings:", err);
    return null;
  }
});

// Save settings
ipcMain.handle("save-settings", async (event, settings) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf8");
    return { success: true };
  } catch (err) {
    console.error("Error saving settings:", err);
    return { success: false, error: err.message };
  }
});

// New handler to update only the lastOpened property
ipcMain.handle('update-note-last-opened', async (event, noteID) => {
  try {
    // Assuming you have a function that updates a single field for a note
    const updatedNote = await updateNoteLastOpened(noteID); // Implement this function

    return updatedNote; // Return the updated note (just lastOpened)
  } catch (error) {
    console.error("Error updating lastOpened:", error);
    throw error;  // Propagate the error to the renderer
  }
});

// Function that updates just the lastOpened field in the database (implement this)
async function updateNoteLastOpened(noteID) {
  const stmt = db.prepare(`
    UPDATE notes
    SET lastOpened = ?
    WHERE noteID = ?
  `);

  // Run the query with the current time as lastOpened
  stmt.run(new Date().toISOString(), noteID);

  // Fetch and return the updated note (optional, based on your app logic)
  const updatedNote = db.prepare('SELECT * FROM notes WHERE noteID = ?').get(noteID);
  return updatedNote;
}