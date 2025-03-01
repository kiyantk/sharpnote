import React, { useState, useEffect } from "react";
import MenuBar from "./components/MenuBar";
import BottomBar from "./components/BottomBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import EditPopup from "./components/EditPopup";
import WelcomePopup from "./components/WelcomePopup";
import NoteContextMenu from "./components/NoteContextMenu";
import NoteInfo from "./components/NoteInfo"
import './App.css';
import { faXmark, faCheck, faSave } from "@fortawesome/free-solid-svg-icons";
import { SnackbarProvider, closeSnackbar, enqueueSnackbar } from 'notistack'

const App = () => {
  const [notes, setNotes] = useState([]);
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
  const [isNoteInfoPopupOpen, setIsNoteInfoPopupOpen] = useState(null);
  const [deleteModeOn, setDeleteMode] = useState(false);
  const [deleteModeSnackKey, setDeleteModeSnackKey] = useState(null);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [noteToExportNoteThruCtx, setNoteToExportNoteThruCtx] = useState(null);
  const [haveToOpenNote, setHaveToOpenNote] = useState(null);
  const [usernameFixed, setUsernameFixed] = useState(false);

  const handleAutoSaveStatusChange = (status) => {
    setAutosaveStatus(status); // Update the status when it's passed from NoteEditor
  };

  // Define selected note
  let selectedNote = notes.find((note) => note.noteID === selectedNoteId);

  // Manual note saving logic
  const handleManualNoteSave = async () => {
    if(activeEditorNoteContent !== selectedNote.noteContent) {
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
    if(!isNoteOpened) newSettings.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1);
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

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer.invoke("get-settings").then(async (loadedSettings) => {
      if (loadedSettings) {
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
        setSettings(loadedSettings);
        loadedSettings.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1)
        setLocalUsername(loadedSettings.username)
      }
    });
  }, []);

  // Call fetchNotes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if(usernameFixed) enqueueSnackbar('Username was updated due to invalid characters or length', { className: 'notistack-custom-default' });
  }, [usernameFixed]);

  useEffect(() => {
    if(haveToOpenNote) selectNote(haveToOpenNote);
  }, [notes, haveToOpenNote]);

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
      sharpnoteVersion: "1.0.0",
      noteTitle: "New Note",
      noteContent: "",
      noteColor: "#FFFFFF",
      noteAttachments: [],
      noteSyntax: "",
      noteOriginalAuthor: localUsername ? localUsername : null,
      noteLastAuthor: localUsername ? localUsername : null,
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
      setHaveToOpenNote(newNote.noteID)
    } catch (error) {
      console.error("Error adding note:", error);
      enqueueSnackbar('An error occured while trying to add a new note', { className: 'notistack-custom-default' });
    }
  };

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
    selectedNote = notes.find((note) => note.noteID === noteID);
    setactiveEditorNoteContent(selectedNote.noteContent)
  
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
  
  // Handle note deletion
  const deleteNote = async (noteID) => {
    if (!window.electron) return;
    if(noteID === selectedNoteId) {
      setAutosaveStatus(4)
      setIsNoteOpened(false)
    }
    try {
      await window.electron.ipcRenderer.invoke("delete-note", noteID);
      setNotes((prevNotes) => prevNotes.filter((note) => note.noteID !== noteID));
    } catch (error) {
      console.error("Error deleting note:", error);
      enqueueSnackbar('An error occured while trying to delete this note', { className: 'notistack-custom-default' });
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
        setNotes(notes.map((note) => (note.noteID === updatedNote.noteID ? updatedNote : note))); // Update state
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

  const closeNote = () => {
    setIsNoteOpened(false);
    setSelectedNoteId(null);
    setactiveEditorNoteContent(null);
    setAutosaveStatus(4)
  }

  // Open the Edit Note popup
  const openEditPopup = (noteID) => {
    setIsEditPopupOpen(true);
    const editNote = notes.find((note) => note.noteID === noteID);
    setEditPopupNote(editNote)
  }

  // Open the Edit Note popup
  const openNoteInfoPopup = (noteID) => {
    setIsNoteInfoPopupOpen(true);
    const editNote = notes.find((note) => note.noteID === noteID);
    setNoteInfoPopupNote(editNote)
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

  const closeNoteCtx = () => {
    setActiveNoteContextMenu(null)
    setActiveNoteContextMenuEvent(null)
  }

  const closeNoteInfoPopup = () => {
    setIsNoteInfoPopupOpen(null)
    setNoteInfoPopupNote(null)
  }

  // Refresh
  const onRefresh = () => {
    fetchNotes();
  };

  // Closing the Edit Note popup
  const closeEditPopup = () => setIsEditPopupOpen(false);

  // Apply changes from Edit Note popup
  const applyNoteEdits = (editedNote) => {
    updateNote(editedNote)
  }

  const onExportDone = (numExported, isSharpbook) => {
    if(isSharpbook) {
      enqueueSnackbar(`Exported Sharpbook (${numExported} ${numExported > 1 ? 'notes' : 'note'})`, {className: 'notistack-custom-default', variant: 'success'})
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
    setNoteToExportNoteThruCtx(note)
  }

  const clearPreSelectThruCtx = () => {
    setNoteToExportNoteThruCtx(null)
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
          exportNoteThruCtx={noteToExportNoteThruCtx}
          onPreSelectReceived={clearPreSelectThruCtx}
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
          />
          <NoteEditor 
            selectedNote={selectedNote} 
            onUpdateNote={updateNote} 
            settings={settings} 
            onAutoSaveStatusChange={handleAutoSaveStatusChange} 
            onActiveEditorContentUpdate={setactiveEditorNoteContent} 
          />
        </div>
        <div>
        {isEditPopupOpen && (
          <EditPopup
            closeEditPopup={closeEditPopup}
            noteToEdit={editPopupNote}  // Pass current settings
            applyEdits={applyNoteEdits} // Pass function to apply new settings
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
          />
        )}
        {isNoteInfoPopupOpen && (
          <NoteInfo
            noteToShow={noteInfoPopupNote} // Pass function to apply new settings
            onNoteInfoPopupClose={closeNoteInfoPopup}
          />
        )}
        <SnackbarProvider />
        </div>
        <BottomBar 
          autosaveStatus={autosaveStatus} 
          editorContent={activeEditorNoteContent} 
          onRefresh={onRefresh} 
          onManualSaveNote={handleManualNoteSave} 
          noteOpened={isNoteOpened} 
          manualSaveIcon={manualSaveIcon} 
          manualSaveText={manualSaveText}
          onShortcutAddNote={addNote}
          onShortcutCloseNote={closeNote}
        />
      </div>
    </div>
  );
};

export default App;
