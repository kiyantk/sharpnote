import React from "react";
import NoteItem from "./NoteItem";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const NoteList = ({ notes, onAddNote, onDeleteNote, onSelectNote }) => {
  return (
    <div className="note-list">
      <button onClick={onAddNote}><FontAwesomeIcon icon={faPlus} /> Add Note</button>
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} onDeleteNote={onDeleteNote} onSelectNote={onSelectNote} />
      ))}
    </div>
  );
};

export default NoteList;
