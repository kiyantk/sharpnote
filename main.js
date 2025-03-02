const { app, BrowserWindow, ipcMain, globalShortcut, shell, dialog } = require("electron");
const db = require("./database");
const path = require("path");

let mainWindow;

// On startup:
app.whenReady().then(() => {
  // Set up desktop app window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, './public/logo512.png'), // Set the app icon
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Load the preload script
      contextIsolation: true, // Keep context isolation enabled (default)
      enableRemoteModule: false,
      nodeIntegration: false, // Prevent unsafe access
    },
  });

  app.on('browser-window-focus', () => {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (mainWindow) {
        mainWindow.webContents.toggleDevTools();
      }
    })
  })
  
  app.on('browser-window-blur', () => {
    globalShortcut.unregisterAll()
  })

  mainWindow.removeMenu(); // Hides the default top menu
  mainWindow.maximize(); // Start in maximized mode
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: "deny" }; // Prevent the app from opening the URL.
  })

  mainWindow.on('close', (event) => {
    event.preventDefault() // Prevent default quit behavior
    mainWindow.webContents.send('check-unsaved-changes') // Notify React app
  })

  app.on('ready', () => {
    process.chdir(path.dirname(app.getPath('exe'))); // Ensures correct working directory
  });

  // Use in Dev
  mainWindow.loadURL("http://localhost:3000"); // Change if using packaged app

  // Steps to build (on Windows)
  // Ensure package.json contains "homepage": ".",
  // Run 'npm run build'
  // Copy main.js to the build folder
  // Rename main.js in the build folder to electron.js
  // In the new electron.js, change 'const db = require("./database");' to 'const db = require("../database");'
  // 'sharpnote-v1-installfinished.bmp' should already be in build folder. If not, put it there from public folder
  // Copy preload.js to build folder
  // Open Powershell as Administrator
  // cd to this repo
  // WINDOWS: npx electron-builder build --win
  // LINUX: npx electron-builder build --linux --x64
  // MACOS: npx @electron/packager <full path to local repo> SharpNote --platform=darwin --arch=x64
  // Output should be in the 'dist' folder


  // USE THIS WHEN BUILDING
  // mainWindow.loadFile(path.join(__dirname, 'index.html'));
});

ipcMain.handle("export-database", async (event, defaultFilename) => {
  const mainWindow = BrowserWindow.getFocusedWindow();

  // Show save dialog
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Save Notes Database",
    defaultPath: defaultFilename,
    filters: [{ name: "Database Files", extensions: ["db"] }],
  });

  if (!filePath) {
    return { success: false, error: "User canceled the save dialog." };
  }

  const dbPath = path.join(app.getAppPath(), "notes.db"); // Path to notes.db in app root

  try {
    await fs.promises.copyFile(dbPath, filePath);
    return { success: true, path: filePath };
  } catch (err) {
    console.error("Error exporting database:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.on('confirm-quit', () => {
  app.exit() // Quit when confirmed
})

// Fetch all notes
ipcMain.handle("get-notes", () => {
  const stmt = db.prepare("SELECT * FROM notes ORDER BY lastOpened DESC");
  return stmt.all();
});

// Add a new note
ipcMain.handle("add-note", (_, newNote) => {
  const stmt = db.prepare(`
    INSERT INTO notes (noteID, sharpnoteVersion, noteTitle, noteContent, noteColor, noteAttachments, noteSyntax, noteOriginalAuthor, noteLastAuthor, created, lastSaved, lastOpened, lastExported, noteVersion, noteTags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    newNote.noteID,
    newNote.sharpnoteVersion,
    newNote.noteTitle,
    newNote.noteContent,
    newNote.noteColor,
    JSON.stringify(newNote.noteAttachments || []), // Store as JSON
    newNote.noteSyntax,
    newNote.noteOriginalAuthor,
    newNote.noteLastAuthor,
    newNote.noteHistory.created,
    newNote.noteHistory.lastSaved,
    newNote.noteHistory.lastOpened,
    newNote.noteHistory.lastExported || "",
    newNote.noteHistory.noteVersion,
    JSON.stringify(newNote.noteTags || []) // Store as JSON
  );

  return newNote;
});

// Update a note
ipcMain.handle("update-note", (_, updatedNote) => {
  try {
    const stmt = db.prepare(`
      UPDATE notes
      SET noteTitle = ?, noteContent = ?, noteColor = ?, noteAttachments = ?, noteSyntax = ?, noteOriginalAuthor = ?, noteLastAuthor = ?, lastSaved = ?, lastOpened = ?, lastExported = ?, noteVersion = ?, noteTags = ?
      WHERE noteID = ?
    `);

    const result = stmt.run(
      updatedNote.noteTitle,
      updatedNote.noteContent,
      updatedNote.noteColor,
      updatedNote.noteAttachments,
      updatedNote.noteSyntax,
      updatedNote.noteOriginalAuthor,
      updatedNote.noteLastAuthor,
      updatedNote.lastSaved,
      updatedNote.lastOpened,
      updatedNote.lastExported || "",
      updatedNote.noteVersion,
      updatedNote.noteTags,
      updatedNote.noteID
    );

    // Check if any rows were updated
    if (result.changes > 0) {
      return { success: true };
    } else {
      return { success: false, message: "No rows were updated. The noteID might be incorrect." };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
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

let appPath = app.getAppPath();

// In production, go two levels up to reach the app root
if (app.isPackaged) {
  appPath = path.join(appPath, "..", "..");
}

let configPath = appPath + "/sharpnote-config.json";

// Default configuration
const defaultConfig = {
  "username": null,
  "welcomePopupSeen": false,
  "userSettings": {
    "autoSave": true,
    "showMenubarIcons": true,
    "noteItemStyle": "normal",
    "showUnsavedChangesWarning": true,
    "disableImportChecks": false
  },
  "structure": {
    "folders": [],
    "rootOrder": []
  }
};

// Read settings
ipcMain.handle("get-settings", async () => {
  try {
    // Check if the config file exists
    if (!fs.existsSync(configPath)) {
      // If not, write the default config to the file
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
      console.log("Config file created with default settings.");
    }
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

ipcMain.handle("open-sharpnote-location", () => {
  let appPath = app.getAppPath();

  // In production, go two levels up to reach the app root
  if (app.isPackaged) {
    appPath = path.join(appPath, "..", "..");
  }

  shell.openPath(appPath);
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