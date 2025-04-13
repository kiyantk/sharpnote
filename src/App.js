import React, { useState, useEffect, useRef } from "react";
import MenuBar from "./components/MenuBar";
import BottomBar from "./components/BottomBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import EditPopup from "./components/EditPopup";
import WelcomePopup from "./components/WelcomePopup";
import NoteContextMenu from "./components/NoteContextMenu";
import NoteInfo from "./components/NoteInfo";
import UnsavedChanges from "./components/UnsavedChanges";
import FolderContextMenu from "./components/FolderContextMenu";
import DeleteAllPopup from "./components/DeleteAllPopup";
import "./App.css";
import { faXmark, faCheck, faSave } from "@fortawesome/free-solid-svg-icons";
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from "notistack";

const App = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeEditorNoteContent, setactiveEditorNoteContent] = useState(null);
  const [isNoteOpened, setIsNoteOpened] = useState(false);
  const [manualSaveIcon, setManualSaveIcon] = useState(faSave);
  const [manualSaveText, setManualSaveText] = useState("Save");
  const [settings, setSettings] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState(0); // Test value: 3 = "Changed"
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editPopupNote, setEditPopupNote] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [localUsername, setLocalUsername] = useState(null);
  const [activeNoteContextMenu, setActiveNoteContextMenu] = useState(null);
  const [activeNoteContextMenuFull, setActiveNoteContextMenuFull] =
    useState(null);
  const [activeNoteContextMenuEvent, setActiveNoteContextMenuEvent] =
    useState(null);
  const [noteInfoPopupNote, setNoteInfoPopupNote] = useState(null);
  const [noteInfoPopupType, setNoteInfoPopupType] = useState(null);
  const [isNoteInfoPopupOpen, setIsNoteInfoPopupOpen] = useState(null);
  const [deleteModeOn, setDeleteMode] = useState(false);
  const [deleteModeSnackKey, setDeleteModeSnackKey] = useState(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [notesToExportNoteThruCtx, setNotesToExportNoteThruCtx] =
    useState(null);
  const [haveToOpenNote, setHaveToOpenNote] = useState(null);
  const [usernameFixed, setUsernameFixed] = useState(false);
  const [isUnsavedChangesPopupOpen, setIsUnsavedChangesPopupOpen] =
    useState(false);
  const [
    unsavedChangesPopupNoteToSwitchTo,
    setUnsavedChangesPopupNoteToSwitchTo,
  ] = useState(null);
  const [
    userJustAnsweredYesToUnsavedChangesPopup,
    setUserJustAnsweredYesToUnsavedChangesPopup,
  ] = useState(false);
  const [unsavedChangesPopupType, setUnsavedChangesPopupType] = useState(null);
  const [noteContentChanged, setNoteContentChanged] = useState(false);
  const noteContentChangedRef = useRef(noteContentChanged);
  const notesRef = useRef(notes);
  const foldersRef = useRef(folders);
  const [fileToImport, setFileToImport] = useState(null);
  const [hasClickedAwayFromStartScreen, setHasClickedAwayFromStartScreen] =
    useState(false);
  const [openedFolders, setOpenedFolders] = useState([]);
  const [isEditorContentDecoded, setIsEditorContentDecoded] = useState(false);
  const [activeFolderContextMenu, setActiveFolderContextMenu] = useState(null);
  const [activeFolderContextMenuFull, setActiveFolderContextMenuFull] =
    useState(null);
  const [activeFolderContextMenuEvent, setActiveFolderContextMenuEvent] =
    useState(null);
  const [editPopupType, setEditPopupType] = useState(null);
  const [isDeleteAllPopupOpen, setIsDeleteAllPopupOpen] = useState(false);
  const [currentFsMode, setCurrentFsMode] = useState(false);
  const [refreshedTime, setRefreshedTime] = useState(null);
  const [everythingDeletedTime, setEverythingDeletedTime] = useState(null);
  const importCompletedRef = useRef(false);
  const [notesImportDone, setNotesImportDone] = useState(false);
  const [foldersImportDone, setFoldersImportDone] = useState(false);

  const handleAutoSaveStatusChange = (status) => {
    setAutosaveStatus(status); // Update the status when it's passed from NoteEditor
  };

  // Define selected note
  let selectedNote = notes.find((note) => note.noteID === selectedNoteId);

  // Manual note saving logic
  const handleManualNoteSave = async () => {
    if (noteContentChanged) {
      const encodedCurrentContent = btoa(
        String.fromCharCode(
          ...new TextEncoder().encode(activeEditorNoteContent)
        )
      );
      const fullManualSaveNote = {
        ...selectedNote,
        noteContent: encodedCurrentContent,
      };
      const result = await updateNote(fullManualSaveNote);
      if (result.success) {
        setAutosaveStatus(2);
        setManualSaveIcon(faCheck);
        setManualSaveText("Saved");
        // Revert back to faSave after 1 second
        setTimeout(() => {
          setManualSaveIcon(faSave);
          setManualSaveText("Save");
        }, 1000);
        setNoteContentChanged(false);
      } else {
        setManualSaveIcon(faXmark);
        setManualSaveText("Failed");
        // Revert back to faSave after 1 second
        setTimeout(() => {
          setManualSaveIcon(faSave);
          setManualSaveText("Save");
        }, 1000);
      }
    } else {
      setAutosaveStatus(2);
      setManualSaveIcon(faCheck);
      setManualSaveText("Saved");
      // Revert back to faSave after 1 second
      setTimeout(() => {
        setManualSaveIcon(faSave);
        setManualSaveText("Save");
      }, 1000);
      setNoteContentChanged(false);
    }
  };

  // Apply new settings
  const handleonSettingsChange = (newSettings) => {
    setSettings(newSettings);
    setLocalUsername(newSettings.username);
    if (!isNoteOpened)
      newSettings?.userSettings.autoSave
        ? setAutosaveStatus(4)
        : setAutosaveStatus(1);
  };

  // Fetch notes from the local db
  const fetchNotes = async () => {
    if (!window.electron) return;
    try {
      const savedNotes = await window.electron.ipcRenderer.invoke("get-notes");
      setNotes(savedNotes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      enqueueSnackbar("An error occured while trying to load your notes", {
        className: "notistack-custom-default",
      });
    }
  };

  // Fetch notes from the local db
  const fetchFolders = async () => {
    if (!window.electron) return;
    try {
      const savedFolders = await window.electron.ipcRenderer.invoke(
        "get-folders"
      );
      setFolders(savedFolders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      enqueueSnackbar("An error occured while trying to load your folders", {
        className: "notistack-custom-default",
      });
    }
  };

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer
      .invoke("get-settings")
      .then(async (loadedSettings) => {
        if (loadedSettings) {
          if (loadedSettings.username) {
            // Remove any characters that are not a-z, A-Z, 0-9, -, _, or spaces
            let validUsername = loadedSettings.username.replace(
              /[^a-zA-Z0-9\-_ ]/g,
              ""
            );
            // Trim to 32 characters if longer
            if (validUsername.length > 32) {
              validUsername = validUsername.substring(0, 32);
            }
            // Update settings.username if it was modified
            if (validUsername !== loadedSettings.username) {
              loadedSettings.username = validUsername;
              setUsernameFixed(true);
              setSettings(loadedSettings);
              setLocalUsername(loadedSettings.username);
              // Save fixed settings
              try {
                const response = await window.electron.ipcRenderer.invoke(
                  "save-settings",
                  loadedSettings
                );
                if (!response.success) {
                  console.error("Failed to save settings:", response.error);
                  enqueueSnackbar(
                    "An error occured while trying to save settings",
                    { className: "notistack-custom-default" }
                  );
                }
              } catch (error) {
                console.error("Error saving settings:", error);
                enqueueSnackbar(
                  "An error occured while trying to save settings",
                  { className: "notistack-custom-default" }
                );
              }
            }
          }
          setSettings(loadedSettings);
          loadedSettings?.userSettings.autoSave
            ? setAutosaveStatus(4)
            : setAutosaveStatus(1);
          setLocalUsername(loadedSettings.username);
        }
      });

    window.electron.ipcRenderer
      .invoke("get-opened-file")
      .then(async (openedFilePath) => {
        setFileToImport(openedFilePath);
      });
  }, []);

  // Call fetchNotes on mount
  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, []);

  useEffect(() => {
    if (usernameFixed)
      enqueueSnackbar(
        "Username was updated due to invalid characters or length",
        { className: "notistack-custom-default" }
      );
  }, [usernameFixed]);

  useEffect(() => {
    if (haveToOpenNote && haveToOpenNote !== null) selectNote(haveToOpenNote);
  }, [haveToOpenNote]);

  // Check if user has seen Welcome Popup on mount & check username
  useEffect(() => {
    if (settings && settings.welcomePopupSeen === false) {
      setShowWelcomePopup(true);
    }
  }, [settings]);

  // Random ID generator for noteID's
  const generateRandomID = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Handle new notes
  const addNote = async () => {
    if (!window.electron) return;

    const newNote = {
      noteID: generateRandomID(),
      sharpnoteVersion: "1.2.0",
      sharpnoteType: "note",
      noteTitle: "New Note",
      noteContent: "",
      noteColor: "#FFFFFF",
      noteAttachments: [],
      noteOriginalAuthor: localUsername ? localUsername : null,
      noteLastAuthor: localUsername ? localUsername : null,
      noteFolder: null,
      noteHistory: {
        created: new Date().toISOString(),
        lastSaved: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
        lastExported: "",
        noteVersion: 1,
      },
      noteTags: [],
      isReadonly: 0,
    };

    try {
      await window.electron.ipcRenderer.invoke("add-note", newNote);
      setNotes((prevNotes) => [...prevNotes, newNote]);
      onRefresh();
      // Automatically select (open) note
      // handleManualNoteSave();
      setHaveToOpenNote(newNote.noteID);
    } catch (error) {
      console.error("Error adding note:", error);
      enqueueSnackbar("An error occured while trying to add a new note", {
        className: "notistack-custom-default",
      });
    }
  };

  const addFolder = async () => {
    if (!window.electron) return;

    const newFolder = {
      folderID: generateRandomID(),
      sharpnoteType: "folder",
      folderTitle: "New Folder",
      folderNotes: [],
      folderColor: "#FFFFFF",
      folderOriginalAuthor: localUsername ? localUsername : null,
      created: new Date().toISOString(),
    };
    try {
      await window.electron.ipcRenderer.invoke("add-folder", newFolder);

      setFolders((prevFolders) => [...prevFolders, newFolder]);
      onRefresh();
    } catch (error) {
      console.error("Error adding folder:", error);
      enqueueSnackbar("An error occured while trying to add a new folder", {
        className: "notistack-custom-default",
      });
    }
  };

  useEffect(() => {
    if (window.electron) {
      window.electron.checkUnsavedChanges(() => {
        if (noteContentChangedRef.current) {
          setIsUnsavedChangesPopupOpen(true);
          setUnsavedChangesPopupType("exit");
        } else {
          handleConfirmQuit();
        }
      });
    }
  }, []);

  const importNote = async (newNote) => {
    if (!window.electron) return;

    try {
      // Ensure noteAttachments and noteTags are properly formatted as arrays
      if (typeof newNote.noteAttachments === "string") {
        try {
          newNote.noteAttachments = JSON.parse(newNote.noteAttachments);
        } catch (e) {
          console.warn(
            "Invalid JSON in noteAttachments, resetting to empty array."
          );
          newNote.noteAttachments = [];
        }
      }

      if (typeof newNote.noteTags === "string") {
        try {
          newNote.noteTags = JSON.parse(newNote.noteTags);
        } catch (e) {
          console.warn("Invalid JSON in noteTags, resetting to empty array.");
          newNote.noteTags = [];
        }
      }

      // Import the note
      await window.electron.ipcRenderer.invoke("add-note", newNote);
      setNotes((prevNotes) => [...prevNotes, newNote]);
      // onRefresh();
    } catch (error) {
      console.error("Error importing note:", error);
      enqueueSnackbar("An error occured while trying to import a note", {
        className: "notistack-custom-default",
      });
    }
  };

  const importFolder = async (newFolder) => {
    if (!window.electron) return;

    try {
      // Ensure noteAttachments and noteTags are properly formatted as arrays
      if (typeof newFolder.folderNotes === "string") {
        try {
          newFolder.folderNotes = JSON.parse(newFolder.folderNotes);
        } catch (e) {
          console.warn(
            "Invalid JSON in folderNotes, resetting to empty array."
          );
          newFolder.folderNotes = [];
        }
      }

      // Import the note
      await window.electron.ipcRenderer.invoke("add-folder", newFolder);
      setFolders((prevFolders) => [...prevFolders, newFolder]);
      // onRefresh();
    } catch (error) {
      console.error("Error importing folder:", error);
      enqueueSnackbar("An error occured while trying to import a folder", {
        className: "notistack-custom-default",
      });
    }
  };

  // Handle note opening
  const selectNote = async (noteID) => {
    if (
      selectedNote &&
      noteContentChangedRef.current &&
      !userJustAnsweredYesToUnsavedChangesPopup &&
      settings?.userSettings.showUnsavedChangesWarning
    ) {
      setIsUnsavedChangesPopupOpen(true);
      setUnsavedChangesPopupNoteToSwitchTo(noteID);
      setUnsavedChangesPopupType("switch");
      return;
    }
    if (userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false);
    }

    if (!hasClickedAwayFromStartScreen) setHasClickedAwayFromStartScreen(true);

    selectedNote = notes.find((note) => note.noteID === noteID);
    setactiveEditorNoteContent(selectedNote.noteContent);
    setIsEditorContentDecoded(false);

    try {
      // Update the note in the database
      const updatedNote = await window.electron.ipcRenderer.invoke(
        "update-note-last-opened",
        noteID
      );

      // Update state with the modified note
      setNotes(
        notes.map((note) =>
          note.noteID === updatedNote.noteID ? updatedNote : note
        )
      );

      // Set the selected note ID for displaying
      setSelectedNoteId(noteID);
      setAutosaveStatus(2);
      setIsNoteOpened(true);
      setHaveToOpenNote(null);
    } catch (error) {
      console.error("Error opening note:", error);
      enqueueSnackbar("An error occured while trying to open this note", {
        className: "notistack-custom-default",
      });
    }
  };

  const openFolder = (folderID) => {
    if (openedFolders.includes(folderID)) {
      setOpenedFolders(openedFolders.filter((id) => id !== folderID)); // Return a new array without the folderID
    } else {
      setOpenedFolders([...openedFolders, folderID]); // Create a new array with the added folderID
    }
  };

  // Handle note deletion
  const deleteNote = async (note, massDelete) => {
    if (!window.electron) return;

    if (note.noteID === selectedNoteId) {
      setAutosaveStatus(4);
      setIsNoteOpened(false);
    }

    try {
      // Remove noteID from all folders' folderOrder
      let updatedFolders = folders.map((folder) => {
        let folderNotes = Array.isArray(folder.folderNotes)
          ? [...folder.folderNotes] // Copy the array
          : JSON.parse(folder.folderNotes || "[]");

        // Filter out the noteID
        let updatedFolderNotes = folderNotes.filter((id) => id !== note.noteID);

        return { ...folder, folderNotes: updatedFolderNotes };
      });

      setFolders(updatedFolders);

      // Update the database for all modified folders
      for (const updatedFolder of updatedFolders) {
        await window.electron.ipcRenderer.invoke(
          "set-foldernotes",
          updatedFolder
        );
      }

      // Also remove the note from settings.structure.folders (folderOrder)
      let updatedSettings = { ...settings };

      if (updatedSettings.structure?.folders) {
        updatedSettings.structure.folders =
          updatedSettings.structure.folders.map((folder) => {
            let folderOrder = Array.isArray(folder.folderOrder)
              ? [...folder.folderOrder] // Copy the array to avoid mutations
              : JSON.parse(folder.folderOrder || "[]");

            let filteredFolderOrder = folderOrder.filter(
              (id) => id !== note.noteID
            );

            return {
              ...folder,
              folderOrder: filteredFolderOrder,
            };
          });
      }

      // Remove note from structure.rootOrder if it exists there
      if (updatedSettings.structure?.rootOrder) {
        let rootOrder = Array.isArray(updatedSettings.structure.rootOrder)
          ? [...updatedSettings.structure.rootOrder] // Copy the array
          : JSON.parse(updatedSettings.structure.rootOrder || "[]");

        updatedSettings.structure.rootOrder = rootOrder.filter(
          (id) => id !== note.noteID
        );
      }

      setSettings({ ...updatedSettings });

      try {
        const response = await window.electron.ipcRenderer.invoke(
          "save-settings",
          updatedSettings
        );
        if (!response.success) {
          console.error("Failed to save settings:", response.error);
          enqueueSnackbar("An error occurred while trying to save settings", {
            className: "notistack-custom-default",
          });
        }
      } catch (error) {
        console.error("Error saving settings:", error);
        enqueueSnackbar("An error occurred while trying to save settings", {
          className: "notistack-custom-default",
        });
      }

      // Remove the note from the notes list
      await window.electron.ipcRenderer.invoke("delete-note", note.noteID);
      setNotes((prevNotes) =>
        prevNotes.filter((prevnote) => prevnote.noteID !== note.noteID)
      );
      if (!massDelete) onRefreshFull();
    } catch (error) {
      console.error("Error deleting note:", error);
      enqueueSnackbar("An error occurred while trying to delete this note", {
        className: "notistack-custom-default",
      });
    }
  };

  // Handle note deletion
  const deleteNoteUnderFolder = async (noteID) => {
    if (!window.electron) return;
    if (noteID === selectedNoteId) {
      setAutosaveStatus(4);
      setIsNoteOpened(false);
    }
    try {
      await window.electron.ipcRenderer.invoke("delete-note", noteID);
      setNotes((prevNotes) =>
        prevNotes.filter((prevnote) => prevnote.noteID !== noteID)
      );
    } catch (error) {
      console.error("Error deleting note in folder:", error);
      enqueueSnackbar("An error occured while trying to delete a note", {
        className: "notistack-custom-default",
      });
    }
  };

  const deleteFolder = async (folder, massDelete) => {
    if (!window.electron) return;

    try {
      if (settings.userSettings.folderDeleteBehaviour === "deletenotes") {
        // Delete each note in the folder first
        for (const noteID of folder.folderNotes) {
          // Create an array of promises to delete all notes
          let folderNotes = Array.isArray(folder.folderNotes)
            ? [...folder.folderNotes] // Copy the array
            : JSON.parse(folder.folderNotes || "[]");
          const deletePromises = folderNotes.map((noteID) =>
            deleteNoteUnderFolder(noteID)
          );

          // Wait for all notes to be deleted before proceeding
          await Promise.all(deletePromises);
        }

        // Remove the folder itself
        await window.electron.ipcRenderer.invoke(
          "delete-folder",
          folder.folderID
        );

        // Update state: Remove deleted notes and folder
        setNotes((prevNotes) =>
          prevNotes.filter((note) => !folder.folderNotes.includes(note.noteID))
        );
        setFolders((prevFolders) =>
          prevFolders.filter((f) => f.folderID !== folder.folderID)
        );
      } else if (settings.userSettings.folderDeleteBehaviour === "keepnotes") {
        // Remove the folder but keep notes, setting their folder to null
        await window.electron.ipcRenderer.invoke(
          "delete-folder",
          folder.folderID
        );

        // Update each note in the database
        for (const noteID of folder.folderNotes) {
          const updatedNote = {
            ...notes.find((note) => note.noteID === noteID),
            noteFolder: null,
          };
          if (updatedNote) {
            await window.electron.ipcRenderer.invoke(
              "set-notefolder",
              updatedNote
            );
          }
        }

        // Update state: Remove folder, update notes
        setFolders((prevFolders) =>
          prevFolders.filter((f) => f.folderID !== folder.folderID)
        );
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            folder.folderNotes.includes(note.noteID)
              ? { ...note, noteFolder: null }
              : note
          )
        );
      }

      const newConfig = { ...settings };

      // Remove note from structure.rootOrder if it exists there
      if (newConfig.structure?.rootOrder) {
        let rootOrder = Array.isArray(newConfig.structure.rootOrder)
          ? [...newConfig.structure.rootOrder] // Copy the array
          : JSON.parse(newConfig.structure.rootOrder || "[]");

        newConfig.structure.rootOrder = rootOrder.filter(
          (id) => id !== folder.folderID
        );
      }

      if (newConfig.structure && newConfig.structure.folders) {
        const folderIndex = newConfig.structure.folders.findIndex(
          (f) => f.folderID === folder.folderID
        );
        if (folderIndex !== -1) {
          // Remove the folder at folderIndex
          newConfig.structure.folders.splice(folderIndex, 1);
        }
      }

      setSettings(newConfig);
      try {
        const response = await window.electron.ipcRenderer.invoke(
          "save-settings",
          newConfig
        );
        if (!response.success) {
          console.error("Failed to save settings:", response.error);
          enqueueSnackbar("An error occurred while trying to save settings", {
            className: "notistack-custom-default",
          });
        }
      } catch (error) {
        console.error("Error saving settings:", error);
        enqueueSnackbar("An error occurred while trying to save settings", {
          className: "notistack-custom-default",
        });
      }
      if (!massDelete) onRefreshFull();
    } catch (error) {
      console.error("Error deleting folder:", error);
      enqueueSnackbar("An error occurred while trying to delete this folder", {
        className: "notistack-custom-default",
      });
    }
  };

  // Update the note in the local db
  const updateNote = async (updatedNote, thruEditPopup) => {
    if (updatedNote.noteTitle.length > 100) {
      enqueueSnackbar("Note Title cannot be longer than 100 characters", {
        className: "notistack-custom-default",
      });
      return { success: false, error: "INVALID" };
    }
    updatedNote.lastSaved = new Date().toISOString(); // Update lastSaved directly
    updatedNote.noteVersion = updatedNote.noteVersion + 1; // Increment the version
    updatedNote.noteLastAuthor = localUsername ? localUsername : null;
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "update-note",
        updatedNote
      ); // Update the note in the database
      if (result.success) {
        setNotes(
          notesRef.current.map((note) =>
            note.noteID === updatedNote.noteID ? updatedNote : note
          )
        ); // Update state
        if (thruEditPopup) {
          const editedNoteTitle = document.getElementById(
            "notetitle-" + updatedNote.noteID
          );
          editedNoteTitle.innerText = updatedNote.noteTitle;
          const editedNoteColor = document.getElementById(
            "notecolor-" + updatedNote.noteID
          );
          editedNoteColor.style.color = updatedNote.noteColor;
        }
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error updating note:", error);
      enqueueSnackbar("An error occured while trying to update this note", {
        className: "notistack-custom-default",
      });
      return { success: false, error: error.message };
    }
  };

  // Update the folder in the local db
  const updateFolder = async (updatedFolder, thruEditPopup) => {
    if (updatedFolder.folderTitle.length > 100) {
      enqueueSnackbar("Folder Title cannot be longer than 100 characters", {
        className: "notistack-custom-default",
      });
      return { success: false, error: "INVALID" };
    }
    try {
      const result = await window.electron.ipcRenderer.invoke(
        "update-folder",
        updatedFolder
      ); // Update the note in the database
      if (result.success) {
        setFolders(
          foldersRef.current.map((folder) =>
            folder.folderID === updatedFolder.folderID ? updatedFolder : folder
          )
        ); // Update state
        if (thruEditPopup) {
          const editedFolderTitle = document.getElementById(
            "foldertitle-" + updatedFolder.folderID
          );
          editedFolderTitle.innerText = updatedFolder.folderTitle;
          const editedFolderColor = document.getElementById(
            "foldercolor-" + updatedFolder.folderID
          );
          editedFolderColor.style.color = updatedFolder.folderColor;
        }
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error updating note:", error);
      enqueueSnackbar("An error occured while trying to update this folder", {
        className: "notistack-custom-default",
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    noteContentChangedRef.current = noteContentChanged;
  }, [noteContentChanged]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  const closeNote = () => {
    if (
      selectedNote &&
      noteContentChangedRef.current &&
      !userJustAnsweredYesToUnsavedChangesPopup &&
      settings?.userSettings.showUnsavedChangesWarning
    ) {
      setIsUnsavedChangesPopupOpen(true);
      setUnsavedChangesPopupType("close");
      return;
    }
    if (userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false);
    }
    setIsNoteOpened(false);
    setSelectedNoteId(null);
    setactiveEditorNoteContent(null);
    setAutosaveStatus(4);
  };

  // Open the Edit Note popup
  const openEditPopup = (noteID, type) => {
    setIsEditPopupOpen(true);
    let editNote = null;
    if (type === "note") {
      editNote = notes.find((note) => note.noteID === noteID);
    } else if (type === "folder") {
      editNote = folders.find((folder) => folder.folderID === noteID);
    }
    setEditPopupNote(editNote);
    setEditPopupType(type);
  };

  // Open the Edit Note popup
  const openNoteInfoPopup = (noteID, type) => {
    setIsNoteInfoPopupOpen(true);
    let editNote = null;
    if (type === "note") {
      editNote = notes.find((note) => note.noteID === noteID);
    } else if (type === "folder") {
      editNote = folders.find((folder) => folder.folderID === noteID);
    }

    setNoteInfoPopupNote(editNote);
    setNoteInfoPopupType(type);
    closeNoteCtx();
  };

  const openNoteContextMenu = (mouseEv, ctxNote) => {
    setActiveNoteContextMenu(ctxNote.noteID);
    setActiveNoteContextMenuFull(ctxNote);
    setActiveNoteContextMenuEvent(mouseEv);
  };

  const openFolderContextMenu = (mouseEv, ctxFolder) => {
    setActiveFolderContextMenu(ctxFolder.folderID);
    setActiveFolderContextMenuFull(ctxFolder);
    setActiveFolderContextMenuEvent(mouseEv);
  };

  const closeNoteCtx = () => {
    setActiveNoteContextMenu(null);
    setActiveNoteContextMenuFull(null);
    setActiveNoteContextMenuEvent(null);
  };

  const closeFolderCtx = () => {
    setActiveFolderContextMenu(null);
    setActiveFolderContextMenuFull(null);
    setActiveFolderContextMenuEvent(null);
  };

  const closeNoteInfoPopup = () => {
    setIsNoteInfoPopupOpen(null);
    setNoteInfoPopupNote(null);
  };

  // Refresh
  const onRefresh = () => {
    if (
      selectedNote &&
      noteContentChangedRef.current &&
      !userJustAnsweredYesToUnsavedChangesPopup &&
      settings?.userSettings.showUnsavedChangesWarning
    ) {
      setIsUnsavedChangesPopupOpen(true);
      setUnsavedChangesPopupType("refresh");
      return;
    }
    if (userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false);
    }
    closeNote();
    fetchNotes();
    fetchFolders();
  };

  const onRefreshFull = () => {
    onRefresh();
    setRefreshedTime(new Date());
  };

  // Closing the Edit Note popup
  const closeEditPopup = () => setIsEditPopupOpen(false);

  // Apply changes from Edit Note popup
  const applyNoteEdits = (editedNote) => {
    if (editPopupType === "note") {
      updateNote(editedNote, true);
    } else if (editPopupType === "folder") {
      updateFolder(editedNote, true);
    }
  };

  // Show success message after export
  const onExportDone = (numExported, isSharpbook, isDB) => {
    if (isSharpbook) {
      enqueueSnackbar(
        `Exported Sharpbook (${numExported} ${
          numExported > 1 ? "notes" : "note"
        })`,
        { className: "notistack-custom-default", variant: "success" }
      );
    } else if (isDB) {
      enqueueSnackbar(`Exported Database`, {
        className: "notistack-custom-default",
        variant: "success",
      });
    } else {
      enqueueSnackbar(
        `Exported ${numExported} ${numExported > 1 ? "notes" : "note"}`,
        { className: "notistack-custom-default", variant: "success" }
      );
    }
  };

  // Show error if user attempts to export 0 notes
  const showNoneSelectedError = () => {
    enqueueSnackbar("No notes were selected", {
      className: "notistack-custom-default",
    });
  };

  const applyWelcomeData = async (welcomeData) => {
    if (welcomeData.username && welcomeData.username.length > 32) {
      enqueueSnackbar("Username may not be longer than 32 characters", {
        className: "notistack-custom-default",
      });
    } else if (/^\s|\s$/.test(welcomeData.username)) {
      enqueueSnackbar("Username may not start or end with a space", {
        className: "notistack-custom-default",
      });
    } else if (/\s{2,}/.test(welcomeData.username)) {
      enqueueSnackbar("Username may not contain double spaces", {
        className: "notistack-custom-default",
      });
    } else if (!/^[a-zA-Z0-9 _-]+$/.test(welcomeData.username)) {
      enqueueSnackbar(
        "Username may only contain letters, numbers, dashes, underscores, and spaces",
        { className: "notistack-custom-default" }
      );
    } else {
      const newConfig = { ...settings };
      newConfig.welcomePopupSeen = true;
      newConfig.username = welcomeData.username ? welcomeData.username : null;
      setSettings(newConfig);
      setLocalUsername(newConfig.username);
      try {
        const response = await window.electron.ipcRenderer.invoke(
          "save-settings",
          newConfig
        );
        if (!response.success) {
          console.error("Failed to save settings:", response.error);
          enqueueSnackbar("An error occured while trying to save settings", {
            className: "notistack-custom-default",
          });
        }
      } catch (error) {
        console.error("Error saving settings:", error);
        enqueueSnackbar("An error occured while trying to save settings", {
          className: "notistack-custom-default",
        });
      }
      setShowWelcomePopup(false);
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteModeOn);
    if (!deleteModeOn) {
      const snackKey = enqueueSnackbar(
        "Delete Mode on. Clicking on a note will delete it! Disable by pressing toggle button again.",
        { className: "notistack-custom-danger", persist: true }
      );
      setDeleteModeSnackKey(snackKey);
    } else {
      closeSnackbar(deleteModeSnackKey);
      setDeleteModeSnackKey(null);
    }
  };

  const onToggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };

  const importData = (toImport, useImportedStructure) => {
    if (toImport.noteID) {
      // Check if noteID is already in use
      if (notes.some((note) => note.noteID === toImport.noteID)) {
        // Generate a new unique noteID
        toImport.noteID = generateRandomID();
        enqueueSnackbar(
          "Note with imported note's noteID already exists. Generated new ID for imported note.",
          { className: "notistack-custom-default" }
        );
      }

      // Flatten noteHistory fields
      // if (toImport.noteHistory) {
      //   Object.assign(toImport, toImport.noteHistory);
      //   delete toImport.noteHistory;
      // }

      // Import the note
      importNote(toImport);
      setNotesImportDone(true);
      setFoldersImportDone(true);
    } else if (toImport.sharpbookID) {
      const idMap = new Map(); // Track ID changes

      // 🔹 Step 1: Collect all ID changes first (without modifying anything yet)
      toImport.notes.forEach((note) => {
        if (notes.some((existingNote) => existingNote.noteID === note.noteID)) {
          const newID = generateRandomID();
          idMap.set(note.noteID, newID);
        }
      });

      toImport.folders?.forEach((folder) => {
        if (
          folders.some(
            (existingFolder) => existingFolder.folderID === folder.folderID
          )
        ) {
          const newID = generateRandomID();
          idMap.set(folder.folderID, newID);
        }
      });

      // 🔹 Step 2: Apply ID changes to noteFolder & folderNotes references
      toImport.notes.forEach((note) => {
        if (idMap.has(note.noteID)) {
          note.noteID = idMap.get(note.noteID);
        }
        if (note.noteFolder && idMap.has(note.noteFolder)) {
          note.noteFolder = idMap.get(note.noteFolder);
        }
      });

      toImport.folders?.forEach((folder) => {
        if (idMap.has(folder.folderID)) {
          folder.folderID = idMap.get(folder.folderID);
        }
        folder.folderNotes = folder.folderNotes.map(
          (noteID) => idMap.get(noteID) || noteID
        );
      });

      if (!toImport.folders || toImport.folders.length === 0) {
        setFoldersImportDone(true);
      } else {
        Promise.all(toImport.folders.map(importFolder)).then(() => {
          setFoldersImportDone(true);
        });
      }

      // 🔹 Step 3: Import everything now that IDs are updated
      Promise.all(toImport.notes.map(importNote)).then(() => {
        setNotesImportDone(true);
      });

      // 🔹 Step 4: Update structure (same as before)
      if (useImportedStructure) {
        const newConfig = { ...settings };

        // Ensure rootOrder exists
        newConfig.structure.rootOrder = newConfig.structure.rootOrder || [];

        // Get new IDs that are not already in rootOrder
        const newIDs = (toImport.structure.rootOrder || []) // Handle case where toImport.structure.rootOrder is undefined
          .map((id) => idMap.get(id) || id)
          .filter((id) => !newConfig.structure.rootOrder.includes(id));

        // Add new IDs at the top, while keeping the rest untouched
        newConfig.structure.rootOrder = [
          ...newIDs,
          ...newConfig.structure.rootOrder,
        ];

        // Add new IDs at the top, while keeping the rest untouched
        newConfig.structure.rootOrder = [
          ...newIDs,
          ...newConfig.structure.rootOrder,
        ];

        const folderMap = new Map(
          newConfig.structure.folders?.map((f) => [f.folderID, f])
        );

        toImport.structure?.folders?.forEach((importedFolder) => {
          const updatedFolderID =
            idMap.get(importedFolder.folderID) || importedFolder.folderID;
          importedFolder.folderID = updatedFolderID;
          importedFolder.folderOrder = importedFolder.folderOrder.map(
            (id) => idMap.get(id) || id
          );

          if (folderMap.has(updatedFolderID)) {
            const existingFolder = folderMap.get(updatedFolderID);
            const existingOrderSet = new Set(existingFolder.folderOrder);
            importedFolder.folderOrder.forEach((id) =>
              existingOrderSet.add(id)
            );
            existingFolder.folderOrder = Array.from(existingOrderSet);
          } else {
            folderMap.set(updatedFolderID, importedFolder);
          }
        });

        newConfig.structure.folders = Array.from(folderMap.values());
        setSettings(newConfig);
      }
    }
  };

  useEffect(() => {
    if (
      !importCompletedRef.current &&
      notesImportDone === true &&
      foldersImportDone === true
    ) {
      enqueueSnackbar("Import complete", {
        className: "notistack-custom-default",
        variant: "success",
      });

      onRefreshFull();

      importCompletedRef.current = true;
      setNotesImportDone(false);
      setFoldersImportDone(false);
    }
  }, [notesImportDone, foldersImportDone]); // Runs every time importProgress updates

  const exportThruCtx = (note) => {
    setNotesToExportNoteThruCtx([note]);
  };

  const exportFolderNotesThruCtx = (folder) => {
    setNotesToExportNoteThruCtx(
      notes.filter((note) => folder.folderNotes.includes(note.noteID))
    );
  };

  const clearPreSelectThruCtx = () => {
    setNotesToExportNoteThruCtx(null);
  };

  // If user answered yes to unsaved changes popup, do the action
  const handleUnsavedChangesAnswer = async (answer) => {
    if (answer === "yes") {
      // If user answered yes, switch note anyway
      setUserJustAnsweredYesToUnsavedChangesPopup(true);
    }
    setIsUnsavedChangesPopupOpen(false);
  };

  const handleConfirmQuit = () => {
    window.electron.confirmQuit(); // Tell main process to quit
  };

  // Move note to folder selected in FolderSelector thru CTX
  const onMoveToSelected = async (note, folder) => {
    if (!window.electron) return;
    if (note.noteID === selectedNoteId) {
      setAutosaveStatus(4);
      setIsNoteOpened(false);
    }
    try {
      // Store the previous folder ID before changing
      // vv REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS (might require extra work) vv
      const oldFolderID = note.noteFolder;
      // ^^ REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS (might require extra work) ^^

      // Toggle noteFolder
      note.noteFolder =
        note.noteFolder === folder.folderID ? null : folder.folderID;

      // Ensure folderNotes is an array (if it's stored as a string, parse it)
      let folderNotes = Array.isArray(folder.folderNotes)
        ? folder.folderNotes
        : JSON.parse(folder.folderNotes || "[]"); // Default to empty array if invalid

      // Handle folderNotes (add/remove noteID)
      let updatedFolderNotes = folderNotes.includes(note.noteID)
        ? folderNotes.filter((id) => id !== note.noteID) // Remove if present
        : [...folderNotes, note.noteID]; // Add if not present

      // Update folder's notes
      folder.folderNotes = updatedFolderNotes;

      // Find the old folder (if the note was previously in one)
      // vv REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS (might require extra work) vv
      let updatedFolders = await window.electron.ipcRenderer.invoke(
        "get-folders"
      ); // Fetch latest folders
      let oldFolder = updatedFolders.find((f) => f.folderID === oldFolderID);

      if (oldFolder) {
        // Ensure oldFolder.folderNotes is an array
        let oldFolderNotes = Array.isArray(oldFolder.folderNotes)
          ? oldFolder.folderNotes
          : JSON.parse(oldFolder.folderNotes || "[]");

        // Remove noteID from the old folder
        oldFolder.folderNotes = oldFolderNotes.filter(
          (id) => id !== note.noteID
        );

        const newConfig = { ...settings };

        if (newConfig.structure && newConfig.structure.folders) {
          const folderIndex = newConfig.structure.folders.findIndex(
            (f) => f.folderID === oldFolder.folderID
          );

          if (folderIndex !== -1) {
            const folderSettings = newConfig.structure.folders[folderIndex];

            // Ensure folderOrder is an array
            let folderOrder = Array.isArray(folderSettings.folderOrder)
              ? folderSettings.folderOrder
              : JSON.parse(folderSettings.folderOrder || "[]");

            // Remove noteID from folderOrder
            folderOrder = folderOrder.filter((id) => id !== note.noteID);

            // Update settings
            newConfig.structure.folders[folderIndex] = {
              ...folderSettings,
              folderOrder,
            };

            setSettings(newConfig);
          }
        }

        // Save changes to old folder
        await window.electron.ipcRenderer.invoke("set-foldernotes", oldFolder);
      }
      // ^^ REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS (might require extra work) ^^

      await window.electron.ipcRenderer.invoke("set-notefolder", note);
      await window.electron.ipcRenderer.invoke("set-foldernotes", folder);
      setNotes((prevNotes) =>
        prevNotes.map((prevNote) =>
          prevNote.noteID === note.noteID
            ? { ...prevNote, noteFolder: note.noteFolder }
            : prevNote
        )
      );
      setFolders((prevFolders) =>
        prevFolders.map((prevFolder) => {
          if (prevFolder.folderID === folder.folderID) {
            return { ...prevFolder, folderNotes: updatedFolderNotes }; // Update new folder
          }
          if (prevFolder.folderID === oldFolderID) {
            return { ...prevFolder, folderNotes: oldFolder?.folderNotes || [] }; // Update old folder - REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS (might require extra work)
          }
          return prevFolder;
        })
      );

      onRefreshFull();
    } catch (error) {
      console.error("Error deleting note:", error);
      enqueueSnackbar(
        "An error occured while trying to add this note to the folder",
        { className: "notistack-custom-default" }
      );
    }
  };

  // If user answered yes to unsaved changes popup, do the action
  useEffect(() => {
    if (userJustAnsweredYesToUnsavedChangesPopup) {
      switch (unsavedChangesPopupType) {
        case "switch":
          setHaveToOpenNote(unsavedChangesPopupNoteToSwitchTo);
          break;
        case "close":
          closeNote();
          break;
        case "refresh":
          onRefresh();
          break;
        case "exit":
          handleConfirmQuit();
          break;
      }
      setNoteContentChanged(false);
    }
  }, [
    userJustAnsweredYesToUnsavedChangesPopup,
    unsavedChangesPopupType,
    unsavedChangesPopupNoteToSwitchTo,
  ]);

  const setActiveEditorContentOnUpdate = (content) => {
    setactiveEditorNoteContent(content);
    setIsEditorContentDecoded(true);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!window.electron) return;
    const newFsMode = !currentFsMode;
    window.electron.ipcRenderer.invoke("toggle-fullscreen", newFsMode);
    setCurrentFsMode(newFsMode);
  };

  // Ask user if they really want to delete all notes
  const deleteAllNotesCheck = () => {
    setIsDeleteAllPopupOpen(true);
  };

  // Delete all notes if user answered yes to confirmation
  const deleteAllNotes = async (answer) => {
    if (answer === "yes") {
      Promise.all([
        Promise.all(notes.map((note) => deleteNote(note, true))),
        Promise.all(folders.map((folder) => deleteFolder(folder, true))),
      ])
        .then(() => {
          enqueueSnackbar("All notes & folders were succesfully deleted!", {
            className: "notistack-custom-default",
            variant: "success",
          });
          setEverythingDeletedTime(new Date());
        })
        .catch((error) => {
          console.error(
            "Something went wrong while trying to delete all notes & folders",
            error
          );
          enqueueSnackbar(
            "Something went wrong while trying to delete all notes & folders",
            {
              className: "notistack-custom-default",
              variant: "error",
            }
          );
        });
    }
    const newConfig = { ...settings };
    newConfig.structure = {};
    setSettings(newConfig);
    try {
      const response = await window.electron.ipcRenderer.invoke(
        "save-settings",
        newConfig
      );
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
        enqueueSnackbar("An error occurred while trying to save settings", {
          className: "notistack-custom-default",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      enqueueSnackbar("An error occurred while trying to save settings", {
        className: "notistack-custom-default",
      });
    }

    setIsDeleteAllPopupOpen(false);
  };

  const onUpdateFullList = async (newArray) => {
    // Early return if settings are not available or the array is unchanged
    if (
      !settings ||
      JSON.stringify(settings.structure?.rootOrder) === JSON.stringify(newArray)
    )
      return;

    const newConfig = { ...settings };

    // Ensure settings.structure exists before accessing it
    if (!newConfig.structure) {
      newConfig.structure = {}; // Initialize structure if it doesn't exist
    }

    // Now it's safe to set rootOrder
    newConfig.structure.rootOrder = newArray;

    // Only setSettings if there's an actual change
    if (
      JSON.stringify(newConfig.structure.rootOrder) !==
      JSON.stringify(settings.structure?.rootOrder)
    ) {
      setSettings(newConfig); // Set the new settings
    }

    try {
      const response = await window.electron.ipcRenderer.invoke(
        "save-settings",
        newConfig
      );
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
        enqueueSnackbar("An error occurred while trying to save settings", {
          className: "notistack-custom-default",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      enqueueSnackbar("An error occurred while trying to save settings", {
        className: "notistack-custom-default",
      });
    }
  };

  const updateFolderOrder = async (newFolder) => {
    if (!settings) return;

    const newConfig = { ...settings };

    // Ensure that structure and structure.folders exist before accessing them
    if (!newConfig.structure) {
      newConfig.structure = {}; // Initialize structure if it doesn't exist
    }

    if (!newConfig.structure.folders) {
      newConfig.structure.folders = []; // Initialize folders if they don't exist
    }

    // Check if folder already exists in the structure
    const folderIndex = newConfig.structure.folders.findIndex(
      (folder) => folder.folderID === newFolder.folderID
    );

    if (folderIndex !== -1) {
      // Folder exists, update its folderOrder
      newConfig.structure.folders[folderIndex] = {
        folderID: newFolder.folderID,
        folderOrder: JSON.parse(newFolder.folderNotes),
      };
    } else {
      // Folder doesn't exist, add a new entry
      newConfig.structure.folders = [
        ...newConfig.structure.folders,
        {
          folderID: newFolder.folderID,
          folderOrder: JSON.parse(newFolder.folderNotes),
        },
      ];
    }

    setSettings(newConfig);

    let newFolderNotes = Array.isArray(newFolder.folderNotes)
      ? newFolder.folderNotes
      : JSON.parse(newFolder.folderNotes || "[]");

    const newFolderForSetFolderNotes = {
      ...newFolder,
      folderNotes: newFolderNotes,
    };
    await window.electron.ipcRenderer.invoke(
      "set-foldernotes",
      newFolderForSetFolderNotes
    );
    try {
      const response = await window.electron.ipcRenderer.invoke(
        "save-settings",
        newConfig
      );
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
        enqueueSnackbar("An error occurred while trying to save settings", {
          className: "notistack-custom-default",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      enqueueSnackbar("An error occurred while trying to save settings", {
        className: "notistack-custom-default",
      });
    }
  };

  const addNoteThruShortcut = () => {
    addNote();
    onRefreshFull();
  };

  return (
    <div className="App">
      <div className="App-main">
        <MenuBar
          onSettingsChange={handleonSettingsChange}
          allNotes={notes}
          onExport={onExportDone}
          allFolders={folders}
          noneSelectedError={showNoneSelectedError}
          toggleDeleteMode={toggleDeleteMode}
          toggleLeftPanel={onToggleLeftPanel}
          onImport={importData}
          exportNoteThruCtx={notesToExportNoteThruCtx}
          onPreSelectReceived={clearPreSelectThruCtx}
          presetFile={fileToImport}
          deleteAllNotes={deleteAllNotesCheck}
          toggleFullscreen={toggleFullscreen}
          currSet={settings}
        />
        <div className="content">
          <NoteList
            notes={notes}
            onAddNote={addNote}
            onSelectNote={selectNote}
            selectedNoteId={selectedNoteId}
            onNoteContextMenu={openNoteContextMenu}
            deleteModeOn={deleteModeOn}
            onDeleteNote={deleteNote}
            leftPanelVisible={leftPanelVisible}
            settings={settings}
            onAddFolder={addFolder}
            onClickFolder={openFolder}
            onDeleteFolder={deleteFolder}
            folders={folders}
            openedFolders={openedFolders}
            onFolderContextMenu={openFolderContextMenu}
            toggleLeftPanel={onToggleLeftPanel}
            onUpdateFullList={onUpdateFullList}
            onUpdateFolderOrder={updateFolderOrder}
            refreshedTime={refreshedTime}
            everythingDeletedTime={everythingDeletedTime}
          />
          <NoteEditor
            selectedNote={selectedNote}
            onUpdateNote={updateNote}
            settings={settings}
            onAutoSaveStatusChange={handleAutoSaveStatusChange}
            onActiveEditorContentUpdate={setActiveEditorContentOnUpdate}
            onNoteChanged={setNoteContentChanged}
            hasClickedAwayFromStartScreen={hasClickedAwayFromStartScreen}
          />
        </div>
        <div>
          {isEditPopupOpen && (
            <EditPopup
              closeEditPopup={closeEditPopup}
              noteToEdit={editPopupNote} // Pass current settings
              applyEdits={applyNoteEdits} // Pass function to apply new settings
              editPopupType={editPopupType}
            />
          )}
          {showWelcomePopup && (
            <WelcomePopup
              submitWelcomePopup={applyWelcomeData} // Pass function to apply new settings
            />
          )}
          {activeNoteContextMenu && (
            <NoteContextMenu
              currentMouseEvent={activeNoteContextMenuEvent}
              currentActiveCtx={activeNoteContextMenu}
              currentActiveCtxFull={activeNoteContextMenuFull}
              onCloseCtx={closeNoteCtx}
              onEditNote={openEditPopup}
              onViewNoteInfo={openNoteInfoPopup}
              onDeleteNote={deleteNote}
              onExportThruCtx={exportThruCtx}
              folders={folders}
              onMoveToSelected={onMoveToSelected}
            />
          )}
          {activeFolderContextMenu && (
            <FolderContextMenu
              currentMouseEvent={activeFolderContextMenuEvent}
              currentActiveCtx={activeFolderContextMenu}
              currentActiveCtxFull={activeFolderContextMenuFull}
              onCloseCtx={closeFolderCtx}
              onEditFolder={openEditPopup}
              onViewFolderInfo={openNoteInfoPopup}
              onDeleteFolder={deleteFolder}
              onExportThruCtx={exportFolderNotesThruCtx}
            />
          )}
          {isNoteInfoPopupOpen && (
            <NoteInfo
              noteToShow={noteInfoPopupNote}
              onNoteInfoPopupClose={closeNoteInfoPopup}
              noteInfoPopupType={noteInfoPopupType}
            />
          )}
          {isUnsavedChangesPopupOpen && (
            <UnsavedChanges
              onUnsavedChangesAnswer={handleUnsavedChangesAnswer}
              noteToSwitchTo={unsavedChangesPopupNoteToSwitchTo}
              unsavedChangesType={unsavedChangesPopupType}
            />
          )}
          {isDeleteAllPopupOpen && (
            <DeleteAllPopup deleteAllAnswer={deleteAllNotes} />
          )}
          <SnackbarProvider />
        </div>
        <BottomBar
          notes={notes}
          autosaveStatus={autosaveStatus}
          editorContent={activeEditorNoteContent}
          isEditorContentDecoded={isEditorContentDecoded}
          onRefresh={onRefreshFull}
          onManualSaveNote={handleManualNoteSave}
          noteOpened={isNoteOpened}
          manualSaveIcon={manualSaveIcon}
          manualSaveText={manualSaveText}
          onShortcutAddNote={addNoteThruShortcut}
          onShortcutCloseNote={closeNote}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default App;
