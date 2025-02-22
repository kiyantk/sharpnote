import React, { useState, useEffect } from "react";
import MenuBar from "./components/MenuBar";
import BottomBar from "./components/BottomBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import './App.css';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeEditorNoteContentDecoded, setactiveEditorNoteContentDecoded] = useState(null);
  const [activeEditorNoteContent, setactiveEditorNoteContent] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isNoteOpened, setIsNoteOpened] = useState(false);
  const [settings, setSettings] = useState({
    userSettings: { autoSave: true }, // Default settings
  });
  const [autosaveStatus, setAutosaveStatus] = useState(0); // Test value: 3 = "Changed"

  const handleAutoSaveStatusChange = (status) => {
    setAutosaveStatus(status); // Update the status when it's passed from NoteEditor
  };

  // ✅ Fix: Select note by `noteID` (not `id`)
  let selectedNote = notes.find((note) => note.noteID === selectedNoteId);

  const handleManualNoteSave = () => {
    if(activeEditorNoteContent !== selectedNote.noteContent) {
      const encodedCurrentContent = btoa(String.fromCharCode(...new TextEncoder().encode(activeEditorNoteContent)))
      const fullManualSaveNote = {
        ...selectedNote,
        noteContent: encodedCurrentContent
      }
      updateNote(fullManualSaveNote)
      setAutosaveStatus(2)
    }
  }

  const handleonSettingsChange = (newSettings) => {
    setSettings(newSettings)
    newSettings.userSettings.autoSave ? setAutosaveStatus(4) : setAutosaveStatus(1)
  };

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

  // useEffect(() => {
  //   console.log(autosaveStatus);  // Log after state change
  // }, [autosaveStatus]);  // This effect runs when autosaveStatus changes
  
  // ✅ Call fetchNotes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const generateRandomID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // ✅ Handle new notes
  const addNote = async () => {
    if (!window.electron) return;

    const newNote = {
      noteID: generateRandomID(),
      sharpnoteVersion: "1.0",
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
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

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
  

  // ✅ Handle note deletion
  const deleteNote = async (noteID) => {
    if (!window.electron) return;

    try {
      await window.electron.ipcRenderer.invoke("delete-note", noteID);
      setNotes((prevNotes) => prevNotes.filter((note) => note.noteID !== noteID));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const updateNote = async (updatedNote) => {
    updatedNote.lastSaved = new Date().toISOString();  // Update lastSaved directly
    updatedNote.noteVersion++;  // Increment the version
  
    try {
      await window.electron.ipcRenderer.invoke("update-note", updatedNote); // Update the note in the database
      setNotes(notes.map((note) => (note.noteID === updatedNote.noteID ? updatedNote : note))); // Update state
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };  


  // ✅ Handle tab switching
  const switchNoteListTab = (tab) => {
    setActiveTab(tab);
  };

  const onRefresh = () => {
    fetchNotes();
  };


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
            activeTab={activeTab}
            onTabSwitch={switchNoteListTab}
          />
          <NoteEditor selectedNote={selectedNote} onUpdateNote={updateNote} settings={settings} onAutoSaveStatusChange={handleAutoSaveStatusChange} onActiveEditorContentUpdate={setactiveEditorNoteContent} onActiveEditorContentUpdateRaw={setactiveEditorNoteContentDecoded} />
        </div>
        <BottomBar autosaveStatus={autosaveStatus} editorContent={activeEditorNoteContent} onRefresh={onRefresh} onManualSaveNote={handleManualNoteSave} noteOpened={isNoteOpened} />
      </div>
    </div>
  );
};

export default App;
