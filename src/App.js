import React, { useState, useEffect } from "react";
import MenuBar from "./components/MenuBar";
import BottomBar from "./components/BottomBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import EditPopup from "./components/EditPopup";
import WelcomePopup from "./components/WelcomePopup";
import './App.css';
import { faXmark, faCheck, faSave } from "@fortawesome/free-solid-svg-icons";

const App = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeEditorNoteContentDecoded, setactiveEditorNoteContentDecoded] = useState(null);
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
    setSettings(newSettings)
    newSettings.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1)
  };

  // Fetch notes from the local db
  const fetchNotes = async () => {
    if (!window.electron) return;
    try {
      const savedNotes = await window.electron.ipcRenderer.invoke("get-notes");
      setNotes(savedNotes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer.invoke("get-settings").then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
        loadedSettings.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1)
      }
    });
  }, []);

  // Call fetchNotes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Check if user has seen Welcome Popup on mount
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
      noteAuthor: "",
      noteHistory: {
        created: new Date().toISOString(),
        lastSaved: new Date().toISOString(),
        lastOpened: new Date().toISOString(),
        exported: "",
        noteVersion: 1,
      },
      noteTags: [],
    };

    try {
      await window.electron.ipcRenderer.invoke("add-note", newNote);
      setNotes((prevNotes) => [...prevNotes, newNote]);
      onRefresh();
    } catch (error) {
      console.error("Error adding note:", error);
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
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };
  
  // Handle note deletion
  const deleteNote = async (noteID) => {
    if (!window.electron) return;

    try {
      await window.electron.ipcRenderer.invoke("delete-note", noteID);
      setNotes((prevNotes) => prevNotes.filter((note) => note.noteID !== noteID));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Update the note in the local db
  const updateNote = async (updatedNote) => {
    updatedNote.lastSaved = new Date().toISOString();  // Update lastSaved directly
    updatedNote.noteVersion = updatedNote.noteVersion + 1;  // Increment the version
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
      return { success: false, error: error.message };
    }
  };  

  // Open the Edit Note popup
  const openEditPopup = (noteID) => {
    setIsEditPopupOpen(true);
    const editNote = notes.find((note) => note.noteID === noteID);
    setEditPopupNote(editNote)
  }

  // Handle tab switching in NoteList
  const switchNoteListTab = (tab) => {
    setActiveTab(tab);
  };

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

  const applyWelcomeData = async (welcomeData) => {
    const newConfig = {...settings}
    newConfig.welcomePopupSeen = true;
    newConfig.username = welcomeData.username ? welcomeData.username : null
    setSettings(newConfig);
    try {
      const response = await window.electron.ipcRenderer.invoke("save-settings", newConfig);
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setShowWelcomePopup(false)
  }

  return (
    <div className="App">
      <div className="App-main">
        <MenuBar onSettingsChange={handleonSettingsChange} />
        <div className="content">
          <NoteList
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onSelectNote={selectNote}
            onEditNote={openEditPopup}
            activeTab={activeTab}
            selectedNoteId={selectedNoteId}
            onTabSwitch={switchNoteListTab}
          />
          <NoteEditor selectedNote={selectedNote} onUpdateNote={updateNote} settings={settings} onAutoSaveStatusChange={handleAutoSaveStatusChange} onActiveEditorContentUpdate={setactiveEditorNoteContent} onActiveEditorContentUpdateRaw={setactiveEditorNoteContentDecoded} />
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
        </div>
        <BottomBar autosaveStatus={autosaveStatus} editorContent={activeEditorNoteContent} onRefresh={onRefresh} onManualSaveNote={handleManualNoteSave} noteOpened={isNoteOpened} manualSaveIcon={manualSaveIcon} manualSaveText={manualSaveText} />
      </div>
    </div>
  );
};

export default App;
