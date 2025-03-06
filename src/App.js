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
import './App.css';
import { faXmark, faCheck, faSave } from "@fortawesome/free-solid-svg-icons";
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from 'notistack';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeEditorNoteContent, setactiveEditorNoteContent] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isNoteOpened, setIsNoteOpened] = useState(false);
  const [manualSaveIcon, setManualSaveIcon] = useState(faSave);
  const [manualSaveText, setManualSaveText] = useState('Save');
  const [settings, setSettings] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState(0); // Test value: 3 = "Changed"
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editPopupNote, setEditPopupNote] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [localUsername, setLocalUsername] = useState(null);
  const [activeNoteContextMenu, setActiveNoteContextMenu] = useState(null);
  const [activeNoteContextMenuFull, setActiveNoteContextMenuFull] = useState(null);
  const [activeNoteContextMenuEvent, setActiveNoteContextMenuEvent] = useState(null);
  const [noteInfoPopupNote, setNoteInfoPopupNote] = useState(null);
  const [noteInfoPopupType, setNoteInfoPopupType] = useState(null);
  const [isNoteInfoPopupOpen, setIsNoteInfoPopupOpen] = useState(null);
  const [deleteModeOn, setDeleteMode] = useState(false);
  const [deleteModeSnackKey, setDeleteModeSnackKey] = useState(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [notesToExportNoteThruCtx, setNotesToExportNoteThruCtx] = useState(null);
  const [haveToOpenNote, setHaveToOpenNote] = useState(null);
  const [usernameFixed, setUsernameFixed] = useState(false);
  const [isUnsavedChangesPopupOpen, setIsUnsavedChangesPopupOpen] = useState(false);
  const [unsavedChangesPopupNoteToSwitchTo, setUnsavedChangesPopupNoteToSwitchTo] = useState(null);
  const [userJustAnsweredYesToUnsavedChangesPopup, setUserJustAnsweredYesToUnsavedChangesPopup] = useState(false);
  const [unsavedChangesPopupType, setUnsavedChangesPopupType] = useState(null);
  const [noteContentChanged, setNoteContentChanged] = useState(false);
  const noteContentChangedRef = useRef(noteContentChanged);
  const notesRef = useRef(notes);
  const foldersRef = useRef(folders);
  const [fileToImport, setFileToImport] = useState(null);
  const [hasClickedAwayFromStartScreen, setHasClickedAwayFromStartScreen] = useState(false)
  const [openedFolders, setOpenedFolders] = useState([])
  const [isEditorContentDecoded, setIsEditorContentDecoded] = useState(false)
  const [activeFolderContextMenu, setActiveFolderContextMenu] = useState(null);
  const [activeFolderContextMenuFull, setActiveFolderContextMenuFull] = useState(null);
  const [activeFolderContextMenuEvent, setActiveFolderContextMenuEvent] = useState(null);
  const [editPopupType, setEditPopupType] = useState(null);

  const handleAutoSaveStatusChange = (status) => {
    setAutosaveStatus(status); // Update the status when it's passed from NoteEditor
  };

  // Define selected note
  let selectedNote = notes.find((note) => note.noteID === selectedNoteId);

  // Manual note saving logic
  const handleManualNoteSave = async () => {
    if(noteContentChanged) {
      const encodedCurrentContent = btoa(String.fromCharCode(...new TextEncoder().encode(activeEditorNoteContent)))
      const fullManualSaveNote = {
        ...selectedNote,
        noteContent: encodedCurrentContent
      }
      const result = await updateNote(fullManualSaveNote)
      if(result.success) {
        setAutosaveStatus(2)
        setManualSaveIcon(faCheck)
        setManualSaveText('Saved')
        // Revert back to faSave after 1 second
        setTimeout(() => {
          setManualSaveIcon(faSave);
          setManualSaveText('Save')
        }, 1000);
        setNoteContentChanged(false);
      } else {
        setManualSaveIcon(faXmark);
        setManualSaveText('Failed')
        // Revert back to faSave after 1 second
        setTimeout(() => {
          setManualSaveIcon(faSave);
          setManualSaveText('Save')
        }, 1000);
      }
    }
  }

  // Apply new settings
  const handleonSettingsChange = (newSettings) => {
    setSettings(newSettings);
    setLocalUsername(newSettings.username);
    if(!isNoteOpened) newSettings?.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1);
  };

  // Fetch notes from the local db
  const fetchNotes = async () => {
    if (!window.electron) return;
    try {
      const savedNotes = await window.electron.ipcRenderer.invoke("get-notes");
      setNotes(savedNotes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      enqueueSnackbar('An error occured while trying to load your notes', { className: 'notistack-custom-default' });
    }
  };

  // Fetch notes from the local db
  const fetchFolders = async () => {
    if (!window.electron) return;
    try {
      const savedFolders = await window.electron.ipcRenderer.invoke("get-folders");
      setFolders(savedFolders || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      enqueueSnackbar('An error occured while trying to load your folders', { className: 'notistack-custom-default' });
    }
  };

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer.invoke("get-settings").then(async (loadedSettings) => {
      if (loadedSettings) {
        if(loadedSettings.username) {
          // Remove any characters that are not a-z, A-Z, 0-9, -, _, or spaces
          let validUsername = loadedSettings.username.replace(/[^a-zA-Z0-9\-_ ]/g, '');
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
              const response = await window.electron.ipcRenderer.invoke("save-settings", loadedSettings);
              if (!response.success) {
                console.error("Failed to save settings:", response.error);
                enqueueSnackbar('An error occured while trying to save settings', { className: 'notistack-custom-default' });
              }
            } catch (error) {
              console.error("Error saving settings:", error);
              enqueueSnackbar('An error occured while trying to save settings', { className: 'notistack-custom-default' });
            }
          }
        }
        setSettings(loadedSettings);
        loadedSettings?.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1)
        setLocalUsername(loadedSettings.username)
      }
    });

    window.electron.ipcRenderer.invoke("get-opened-file").then(async (openedFilePath) => {
      setFileToImport(openedFilePath);
    });
  }, []);

  // Call fetchNotes on mount
  useEffect(() => {
    fetchNotes();
    fetchFolders();
  }, []);

  useEffect(() => {
    if(usernameFixed) enqueueSnackbar('Username was updated due to invalid characters or length', { className: 'notistack-custom-default' });
  }, [usernameFixed]);

  useEffect(() => {
    if(haveToOpenNote && haveToOpenNote !== null) selectNote(haveToOpenNote);
  }, [haveToOpenNote]);

  // Check if user has seen Welcome Popup on mount & check username
  useEffect(() => {
    if(settings && settings.welcomePopupSeen === false) {
      setShowWelcomePopup(true)
    }
  }, [settings]);

  // Random ID generator for noteID's
  const generateRandomID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
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
      noteSyntax: "",
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
    };

    try {
      await window.electron.ipcRenderer.invoke("add-note", newNote);
      setNotes((prevNotes) => [...prevNotes, newNote]);
      onRefresh();
      // Automatically select (open) note
      // handleManualNoteSave();
      setHaveToOpenNote(newNote.noteID)
    } catch (error) {
      console.error("Error adding note:", error);
      enqueueSnackbar('An error occured while trying to add a new note', { className: 'notistack-custom-default' });
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
      enqueueSnackbar('An error occured while trying to add a new folder', { className: 'notistack-custom-default' });
    }
  }

  useEffect(() => {
    if (window.electron) {
      window.electron.checkUnsavedChanges(() => {
        if(noteContentChangedRef.current) {
          setIsUnsavedChangesPopupOpen(true)
          setUnsavedChangesPopupType("exit")
        } else {
          handleConfirmQuit();
        }
      })
    }
  }, [])

  const importNote = async (newNote) => {
    if (!window.electron) return;
  
    try {
      // Ensure noteAttachments and noteTags are properly formatted as arrays
      if (typeof newNote.noteAttachments === "string") {
        try {
          newNote.noteAttachments = JSON.parse(newNote.noteAttachments);
        } catch (e) {
          console.warn("Invalid JSON in noteAttachments, resetting to empty array.");
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
      onRefresh();
    } catch (error) {
      console.error("Error importing note:", error);
      enqueueSnackbar('An error occured while trying to import a note', { className: 'notistack-custom-default' });
    }
  };  

  // Handle note opening
  const selectNote = async (noteID) => {
    if(selectedNote && noteContentChangedRef.current && !userJustAnsweredYesToUnsavedChangesPopup && settings?.userSettings.showUnsavedChangesWarning) {
      setIsUnsavedChangesPopupOpen(true)
      setUnsavedChangesPopupNoteToSwitchTo(noteID)
      setUnsavedChangesPopupType("switch")
      return
    }
    if(userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false)
    }

    if(!hasClickedAwayFromStartScreen) setHasClickedAwayFromStartScreen(true)
      
    selectedNote = notes.find((note) => note.noteID === noteID);
    setactiveEditorNoteContent(selectedNote.noteContent)
    setIsEditorContentDecoded(false)
  
    try {
      // Update the note in the database
      const updatedNote = await window.electron.ipcRenderer.invoke('update-note-last-opened', noteID);

      // Update state with the modified note
      setNotes(notes.map((note) => (note.noteID === updatedNote.noteID ? updatedNote : note)));
  
      // Set the selected note ID for displaying
      setSelectedNoteId(noteID);
      setAutosaveStatus(2)
      setIsNoteOpened(true)
      setHaveToOpenNote(null)
    } catch (error) {
      console.error("Error opening note:", error);
      enqueueSnackbar('An error occured while trying to open this note', { className: 'notistack-custom-default' });
    }
  };

  const openFolder = (folderID) => {
    if (openedFolders.includes(folderID)) {
      setOpenedFolders(openedFolders.filter(id => id !== folderID)); // Return a new array without the folderID
    } else {
      setOpenedFolders([...openedFolders, folderID]); // Create a new array with the added folderID
    }
  };  
  
  // Handle note deletion
  const deleteNote = async (note) => {
    if (!window.electron) return;
    if(note.noteID === selectedNoteId) {
      setAutosaveStatus(4)
      setIsNoteOpened(false)
    }
    try {
      // Find the folder the note was in
      const oldFolderID = note.noteFolder;
      let updatedFolders = folders.map((folder) => {
        if (folder.folderID === oldFolderID) {
          // Ensure folderNotes is an array
          let folderNotes = Array.isArray(folder.folderNotes)
            ? folder.folderNotes
            : JSON.parse(folder.folderNotes || "[]");

          // Remove the noteID from the folderNotes
          let updatedFolderNotes = folderNotes.filter((id) => id !== note.noteID);

          // Update folder in state
          return { ...folder, folderNotes: updatedFolderNotes };
        }
        return folder;
      });

      setFolders(updatedFolders);

      // Find the updated folder and update it in the database
      const updatedFolder = updatedFolders.find((f) => f.folderID === oldFolderID);
      if (updatedFolder) {
        await window.electron.ipcRenderer.invoke("set-foldernotes", updatedFolder);
      }

      await window.electron.ipcRenderer.invoke("delete-note", note.noteID);
      setNotes((prevNotes) => prevNotes.filter((prevnote) => prevnote.noteID !== note.noteID));
    } catch (error) {
      console.error("Error deleting note:", error);
      enqueueSnackbar('An error occured while trying to delete this note', { className: 'notistack-custom-default' });
    }
  };

    // Handle note deletion
    const deleteNoteUnderFolder = async (noteID) => {
      if (!window.electron) return;
      if(noteID === selectedNoteId) {
        setAutosaveStatus(4)
        setIsNoteOpened(false)
      }
      try {
        await window.electron.ipcRenderer.invoke("delete-note", noteID);
        setNotes((prevNotes) => prevNotes.filter((prevnote) => prevnote.noteID !== noteID));
      } catch (error) {
        console.error("Error deleting note in folder:", error);
        enqueueSnackbar('An error occured while trying to delete a note', { className: 'notistack-custom-default' });
      }
    };

    const deleteFolder = async (folder) => {
      if (!window.electron) return;
      
      try {
        if (settings.userSettings.folderDeleteBehaviour === "deletenotes") {
          // Delete each note in the folder first
          for (const noteID of folder.folderNotes) {
            await deleteNoteUnderFolder(noteID);
          }
    
          // Remove the folder itself
          await window.electron.ipcRenderer.invoke("delete-folder", folder.folderID);
    
          // Update state: Remove deleted notes and folder
          setNotes((prevNotes) => prevNotes.filter(note => !folder.folderNotes.includes(note.noteID)));
          setFolders((prevFolders) => prevFolders.filter(f => f.folderID !== folder.folderID));
    
        } else if (settings.userSettings.folderDeleteBehaviour === "keepnotes") {
          // Remove the folder but keep notes, setting their folder to null
          await window.electron.ipcRenderer.invoke("delete-folder", folder.folderID);
    
          // Update each note in the database
          for (const noteID of folder.folderNotes) {
            const updatedNote = { 
              ...notes.find(note => note.noteID === noteID), 
              noteFolder: null 
            };
            if (updatedNote) {
              await window.electron.ipcRenderer.invoke("set-notefolder", updatedNote);
            }
          }
    
          // Update state: Remove folder, update notes
          setFolders((prevFolders) => prevFolders.filter(f => f.folderID !== folder.folderID));
          setNotes((prevNotes) => 
            prevNotes.map(note => 
              folder.folderNotes.includes(note.noteID) ? { ...note, noteFolder: null } : note
            )
          );
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
        enqueueSnackbar('An error occurred while trying to delete this folder', { className: 'notistack-custom-default' });
      }
    };
    

  // Update the note in the local db
  const updateNote = async (updatedNote) => {
    if(updatedNote.noteTitle.length > 100) {
      enqueueSnackbar('Note Title cannot be longer than 100 characters', { className: 'notistack-custom-default' });
      return { success: false, error: "INVALID" }
    }
    updatedNote.lastSaved = new Date().toISOString();  // Update lastSaved directly
    updatedNote.noteVersion = updatedNote.noteVersion + 1;  // Increment the version
    updatedNote.noteLastAuthor = localUsername ? localUsername : null;
    try {
      const result = await window.electron.ipcRenderer.invoke("update-note", updatedNote); // Update the note in the database
      if (result.success) {
        setNotes(notesRef.current.map((note) => (note.noteID === updatedNote.noteID ? updatedNote : note))); // Update state
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error updating note:", error);
      enqueueSnackbar('An error occured while trying to update this note', { className: 'notistack-custom-default' });
      return { success: false, error: error.message };
    }
  };  

  // Update the folder in the local db
  const updateFolder = async (updatedFolder) => {
    if(updatedFolder.folderTitle.length > 100) {
      enqueueSnackbar('Folder Title cannot be longer than 100 characters', { className: 'notistack-custom-default' });
      return { success: false, error: "INVALID" }
    }
    try {
      const result = await window.electron.ipcRenderer.invoke("update-folder", updatedFolder); // Update the note in the database
      if (result.success) {
        setFolders(foldersRef.current.map((folder) => (folder.folderID === updatedFolder.folderID ? updatedFolder : folder))); // Update state
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error updating note:", error);
      enqueueSnackbar('An error occured while trying to update this folder', { className: 'notistack-custom-default' });
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
    if(selectedNote && noteContentChangedRef.current && !userJustAnsweredYesToUnsavedChangesPopup && settings?.userSettings.showUnsavedChangesWarning) {
      setIsUnsavedChangesPopupOpen(true)
      setUnsavedChangesPopupType("close")
      return
    }
    if(userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false)
    }
    setIsNoteOpened(false);
    setSelectedNoteId(null);
    setactiveEditorNoteContent(null);
    setAutosaveStatus(4)
  }

  // Open the Edit Note popup
  const openEditPopup = (noteID, type) => {
    setIsEditPopupOpen(true);
    let editNote = null;
    if(type === "note") {
      editNote = notes.find((note) => note.noteID === noteID);
    } else if(type === "folder") {
      editNote = folders.find((folder) => folder.folderID === noteID);
    }
    setEditPopupNote(editNote)
    setEditPopupType(type)
  }

  // Open the Edit Note popup
  const openNoteInfoPopup = (noteID, type) => {
    setIsNoteInfoPopupOpen(true);
    let editNote = null;
    if(type === "note") {
      editNote = notes.find((note) => note.noteID === noteID);
    } else if(type === "folder") {
      editNote = folders.find((folder) => folder.folderID === noteID);
    }
    
    setNoteInfoPopupNote(editNote)
    setNoteInfoPopupType(type)
    closeNoteCtx();
  }

  // Handle tab switching in NoteList
  const switchNoteListTab = (tab) => {
    setActiveTab(tab);
  };

  const openNoteContextMenu = (mouseEv ,ctxNote) => {
    setActiveNoteContextMenu(ctxNote.noteID)
    setActiveNoteContextMenuFull(ctxNote)
    setActiveNoteContextMenuEvent(mouseEv)
  }

  const openFolderContextMenu = (mouseEv ,ctxFolder) => {
    setActiveFolderContextMenu(ctxFolder.folderID)
    setActiveFolderContextMenuFull(ctxFolder)
    setActiveFolderContextMenuEvent(mouseEv)
  }

  const closeNoteCtx = () => {
    setActiveNoteContextMenu(null)
    setActiveNoteContextMenuFull(null)
    setActiveNoteContextMenuEvent(null)
  }

  const closeFolderCtx = () => {
    setActiveFolderContextMenu(null)
    setActiveFolderContextMenuFull(null)
    setActiveFolderContextMenuEvent(null)
  }

  const closeNoteInfoPopup = () => {
    setIsNoteInfoPopupOpen(null)
    setNoteInfoPopupNote(null)
  }

  // Refresh
  const onRefresh = () => {
    if(selectedNote && noteContentChangedRef.current && !userJustAnsweredYesToUnsavedChangesPopup && settings?.userSettings.showUnsavedChangesWarning) {
      setIsUnsavedChangesPopupOpen(true)
      setUnsavedChangesPopupType("refresh")
      return
    }
    if(userJustAnsweredYesToUnsavedChangesPopup === true) {
      setUserJustAnsweredYesToUnsavedChangesPopup(false)
    }
    closeNote();
    fetchNotes();
    fetchFolders();
  };

  // Closing the Edit Note popup
  const closeEditPopup = () => setIsEditPopupOpen(false);

  // Apply changes from Edit Note popup
  const applyNoteEdits = (editedNote) => {
    if(editPopupType === "note") {
      updateNote(editedNote)
    } else if(editPopupType === "folder") {
      updateFolder(editedNote)
    }    
  }

  const onExportDone = (numExported, isSharpbook, isDB) => {
    if(isSharpbook) {
      enqueueSnackbar(`Exported Sharpbook (${numExported} ${numExported > 1 ? 'notes' : 'note'})`, {className: 'notistack-custom-default', variant: 'success'})
    } else if(isDB) {
      enqueueSnackbar(`Exported Database`, {className: 'notistack-custom-default', variant: 'success'})
    } else {
      enqueueSnackbar(`Exported ${numExported} ${numExported > 1 ? 'notes' : 'note'}`, {className: 'notistack-custom-default', variant: 'success'})
    }
  }

  const showNoneSelectedError = () => {
    enqueueSnackbar("No notes were selected", {className: 'notistack-custom-default'})
  }

  const applyWelcomeData = async (welcomeData) => {
    if(welcomeData.username && welcomeData.username.length > 32) {
      enqueueSnackbar('Username may not be longer than 32 characters', {className: 'notistack-custom-default'})
    } else if(/^\s|\s$/.test(welcomeData.username)) {
      enqueueSnackbar('Username may not start or end with a space', { className: 'notistack-custom-default' });
    } else if(/\s{2,}/.test(welcomeData.username)) {
      enqueueSnackbar('Username may not contain double spaces', { className: 'notistack-custom-default' });
    } else if(!/^[a-zA-Z0-9 _-]+$/.test(welcomeData.username)) {
      enqueueSnackbar('Username may only contain letters, numbers, dashes, underscores, and spaces', { className: 'notistack-custom-default' });
    } else {
      const newConfig = {...settings}
      newConfig.welcomePopupSeen = true;
      newConfig.username = welcomeData.username ? welcomeData.username : null
      setSettings(newConfig);
      setLocalUsername(newConfig.username);
      try {
        const response = await window.electron.ipcRenderer.invoke("save-settings", newConfig);
        if (!response.success) {
          console.error("Failed to save settings:", response.error);
          enqueueSnackbar('An error occured while trying to save settings', { className: 'notistack-custom-default' });
        }
      } catch (error) {
        console.error("Error saving settings:", error);
        enqueueSnackbar('An error occured while trying to save settings', { className: 'notistack-custom-default' });
      }
      setShowWelcomePopup(false)
    }
  }

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteModeOn)
    if(!deleteModeOn) {
      const snackKey = enqueueSnackbar('Delete Mode on. Clicking on a note will delete it! Disable by pressing toggle button again.', { className: 'notistack-custom-danger', persist: true });
      setDeleteModeSnackKey(snackKey)
    } else {
      closeSnackbar(deleteModeSnackKey)
      setDeleteModeSnackKey(null)
    }
  }

  const onToggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible)
  }

  const importData = (toImport) => {
    if (toImport.noteID) {
      // Check if noteID is already in use
      if (notes.some(note => note.noteID === toImport.noteID)) {
        // Generate a new unique noteID
        toImport.noteID = generateRandomID();
        enqueueSnackbar("Note with imported note's noteID already exists. Generated new ID for imported note.", { className: 'notistack-custom-default' });
      }
  
      // Flatten noteHistory fields
      // if (toImport.noteHistory) {
      //   Object.assign(toImport, toImport.noteHistory);
      //   delete toImport.noteHistory;
      // }
  
      // Import the note
      importNote(toImport);
      enqueueSnackbar("Note import complete", { className: 'notistack-custom-default', variant: 'success' });
    } else if (toImport.sharpbookID) {
      // Import each note in sharpbook
      toImport.notes.forEach(note => {
        // Check if noteID is already in use
        if (notes.some(existingNote => existingNote.noteID === note.noteID)) {
          note.noteID = generateRandomID();
        }
  
        // Import the note
        importNote(note);
      });
      enqueueSnackbar("Notes import complete", { className: 'notistack-custom-default', variant: 'success' });
    }
  };

  const exportThruCtx = (note) => {
    setNotesToExportNoteThruCtx([note])
  }

  const exportFolderNotesThruCtx = (folder) => {
    setNotesToExportNoteThruCtx(notes.filter(note => folder.folderNotes.includes(note.noteID)));
  }

  const clearPreSelectThruCtx = () => {
    setNotesToExportNoteThruCtx(null)
  }

  const handleUnsavedChangesAnswer = async (answer) => {
    if(answer === "yes") {
      // If user answered yes, switch note anyway
      setUserJustAnsweredYesToUnsavedChangesPopup(true);
    }
    setIsUnsavedChangesPopupOpen(false)
  }

  const handleConfirmQuit = () => {
    window.electron.confirmQuit() // Tell main process to quit
  }

  const onMoveToSelected = async (note, folder) => {
    if (!window.electron) return;
    if(note.noteID === selectedNoteId) {
      setAutosaveStatus(4)
      setIsNoteOpened(false)
    }
    try {
    // Store the previous folder ID before changing
    // vv REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS vv
    const oldFolderID = note.noteFolder;
    // ^^ REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS ^^

    // Toggle noteFolder
    note.noteFolder = note.noteFolder === folder.folderID ? null : folder.folderID;

    // Ensure folderNotes is an array (if it's stored as a string, parse it)
    let folderNotes = Array.isArray(folder.folderNotes) 
      ? folder.folderNotes 
      : JSON.parse(folder.folderNotes || "[]"); // Default to empty array if invalid

    // Handle folderNotes (add/remove noteID)
    let updatedFolderNotes = folderNotes.includes(note.noteID)
      ? folderNotes.filter(id => id !== note.noteID) // Remove if present
      : [...folderNotes, note.noteID]; // Add if not present

    // Update folder's notes
    folder.folderNotes = updatedFolderNotes;

    // Find the old folder (if the note was previously in one)
    // vv REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS vv
    let updatedFolders = await window.electron.ipcRenderer.invoke("get-folders"); // Fetch latest folders
    let oldFolder = updatedFolders.find((f) => f.folderID === oldFolderID);

    if (oldFolder) {
      // Ensure oldFolder.folderNotes is an array
      let oldFolderNotes = Array.isArray(oldFolder.folderNotes)
        ? oldFolder.folderNotes
        : JSON.parse(oldFolder.folderNotes || "[]");

      // Remove noteID from the old folder
      oldFolder.folderNotes = oldFolderNotes.filter((id) => id !== note.noteID);

      // Save changes to old folder
      await window.electron.ipcRenderer.invoke("set-foldernotes", oldFolder);
    }
    // ^^ REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS ^^
      
      await window.electron.ipcRenderer.invoke("set-notefolder", note);
      await window.electron.ipcRenderer.invoke("set-foldernotes", folder);
      setNotes((prevNotes) =>
        prevNotes.map((prevNote) =>
          prevNote.noteID === note.noteID ? { ...prevNote, noteFolder: note.noteFolder } : prevNote
        )
      );
      setFolders((prevFolders) =>
        prevFolders.map((prevFolder) => {
          if (prevFolder.folderID === folder.folderID) {
            return { ...prevFolder, folderNotes: updatedFolderNotes }; // Update new folder
          }
          if (prevFolder.folderID === oldFolderID) {
            return { ...prevFolder, folderNotes: oldFolder?.folderNotes || [] }; // Update old folder - REMOVE THIS IF YOU WANT NOTES TO BE ABLE TO BE UNDER MULTIPLE FOLDERS
          }
          return prevFolder;
        })
      );
    } catch (error) {
      console.error("Error deleting note:", error);
      enqueueSnackbar('An error occured while trying to add this note to the folder', { className: 'notistack-custom-default' });
    }
  }

  useEffect(() => {
    if (userJustAnsweredYesToUnsavedChangesPopup) {
      switch(unsavedChangesPopupType) {
        case "switch":
          setHaveToOpenNote(unsavedChangesPopupNoteToSwitchTo);
          break
        case "close":
          closeNote();
          break
        case "refresh":
          onRefresh();
          break
        case "exit":
          handleConfirmQuit();
          break
      }
      setNoteContentChanged(false);
    }
  }, [userJustAnsweredYesToUnsavedChangesPopup, unsavedChangesPopupType, unsavedChangesPopupNoteToSwitchTo]);

  const setActiveEditorContentOnUpdate = (content) => {
    setactiveEditorNoteContent(content)
    setIsEditorContentDecoded(true)
  }

  return (
    <div className="App">
      <div className="App-main">
        <MenuBar 
          onSettingsChange={handleonSettingsChange} 
          allNotes={notes} onExport={onExportDone} 
          noneSelectedError={showNoneSelectedError} 
          toggleDeleteMode={toggleDeleteMode}
          toggleLeftPanel={onToggleLeftPanel}
          onImport={importData}
          exportNoteThruCtx={notesToExportNoteThruCtx}
          onPreSelectReceived={clearPreSelectThruCtx}
          presetFile={fileToImport}
        />
        <div className="content">
          <NoteList
            notes={notes}
            onAddNote={addNote}
            onSelectNote={selectNote}
            activeTab={activeTab}
            selectedNoteId={selectedNoteId}
            onTabSwitch={switchNoteListTab}
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
            noteToEdit={editPopupNote}  // Pass current settings
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
        <SnackbarProvider />
        </div>
        <BottomBar 
          notes={notes}
          autosaveStatus={autosaveStatus} 
          editorContent={activeEditorNoteContent} 
          isEditorContentDecoded={isEditorContentDecoded}
          onRefresh={onRefresh} 
          onManualSaveNote={handleManualNoteSave} 
          noteOpened={isNoteOpened} 
          manualSaveIcon={manualSaveIcon} 
          manualSaveText={manualSaveText}
          onShortcutAddNote={addNote}
          onShortcutCloseNote={closeNote}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default App;
