import React from "react";

const NoteEditor = ({ selectedNote, onUpdateNote }) => {
  if (!selectedNote) {
    return (
        <div className="editor editor-empty">
            <img className="editor-icon" src={process.env.PUBLIC_URL + "/logo-v1-light-darkgraytransparant-sharp.png"} alt="Logo" />
            <p className="editor-empty-title">Welcome to SharpNote</p>
            <p className="editor-empty-text">Click on 'New Note' on the left panel to create a new note.</p>
        </div>
    );
  } 

  const handleUpdate = (field, value) => {
    const updatedNote = { ...selectedNote, [field]: value, lastSaved: new Date().toISOString() };
    onUpdateNote(updatedNote); // Passing the updated note with the lastSaved field
  };

  return (
    <div className="editor">
      <input
        type="text"
        value={selectedNote.noteTitle}
        onChange={(e) => handleUpdate("noteTitle", e.target.value)} // Ensuring title is passed properly
      />
      <textarea
        value={selectedNote.noteContent}
        onChange={(e) => handleUpdate("noteContent", e.target.value)} // Ensuring content is passed properly
      />
    </div>
  );
};

export default NoteEditor;
