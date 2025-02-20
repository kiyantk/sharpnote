import React, { useState, useEffect } from "react";
import MenuBar from "./components/MenuBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import './App.css';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // ✅ UseEffect to fetch notes from the main process
  useEffect(() => {
    async function fetchNotes() {
      if (!window.electron) return; // Prevents errors if Electron isn't loaded
      try {
        const savedNotes = await window.electron.ipcRenderer.invoke("get-notes");
        setNotes(savedNotes || []);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    }
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
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const selectNote = async (noteID) => {
    const selectedNote = notes.find((note) => note.noteID === noteID);
  
    // Ensure note has the correct properties before proceeding
    const updatedNote = {
      ...selectedNote,
      lastOpened: new Date().toISOString(),  // Update lastOpened directly
      noteAttachments: selectedNote.noteAttachments || [],  // Ensure attachments are an array
      noteTags: selectedNote.noteTags || [],  // Ensure tags are an array
    };
  
    try {
      // Update the note in the database
      await window.electron.ipcRenderer.invoke("update-note", updatedNote);
  
      // Update state with the modified note
      setNotes(notes.map((note) => (note.noteID === updatedNote.noteID ? updatedNote : note)));
  
      // Set the selected note ID for displaying
      setSelectedNoteId(noteID);
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
    console.log(updatedNote)
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

  // ✅ Fix: Select note by `noteID` (not `id`)
  const selectedNote = notes.find((note) => note.noteID === selectedNoteId);

  return (
    <div className="App">
      <div className="App-main">
        <MenuBar />
        <div className="content">
          <NoteList
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onSelectNote={selectNote}
            activeTab={activeTab}
            onTabSwitch={switchNoteListTab}
          />
          <NoteEditor selectedNote={selectedNote} onUpdateNote={updateNote} />
        </div>
      </div>
    </div>
  );
};

export default App;
