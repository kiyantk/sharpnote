import React, { useState } from "react";
import MenuBar from "./components/MenuBar";
import NoteList from "./components/NoteList";
import NoteEditor from "./components/NoteEditor";
import './App.css';

const App = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const addNote = () => {
    const newNote = { id: Date.now(), title: "New Note", content: "" };
    setNotes([...notes, newNote]);
    setSelectedNoteId(newNote.id);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const updateNote = (updatedNote) => {
    setNotes(notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
  };

  const selectedNote = notes.find((note) => note.id === selectedNoteId);

  return (
    <div className="App">
      <div className="App-main">
        <MenuBar />
        <div className="content">
          <NoteList notes={notes} onAddNote={addNote} onDeleteNote={deleteNote} onSelectNote={setSelectedNoteId} />
          <NoteEditor selectedNote={selectedNote} onUpdateNote={updateNote} />
        </div>
      </div>
    </div>
  );
};

export default App;
