import React from "react";

const NoteEditor = ({ selectedNote, onUpdateNote }) => {
  if (!selectedNote) {
    return (
        <div className="editor editor-empty">
            <img className="editor-icon" src={process.env.PUBLIC_URL + "/logo-v1-light-graytransparant-sharp.png"} alt="Logo" />
            <p className="editor-empty-title">Welcome to SharpNote</p>
            <p className="editor-empty-text">Click on 'New Note' on the left panel to create a new note.</p>
        </div>
    );
  } 

  return (
    <div className="editor">
      <input
        type="text"
        value={selectedNote.title}
        onChange={(e) => onUpdateNote({ ...selectedNote, title: e.target.value })}
      />
      <textarea
        value={selectedNote.content}
        onChange={(e) => onUpdateNote({ ...selectedNote, content: e.target.value })}
      />
    </div>
  );
};

export default NoteEditor;
