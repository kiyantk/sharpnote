import React from "react";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const NoteItem = ({ note, onDeleteNote, onSelectNote }) => {
  return (
    <div className="note-item" onClick={() => onSelectNote(note.id)}>
      <span>{note.title}</span>
      <button onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}><FontAwesomeIcon icon={faTrash} /></button>
    </div>
  );
};

export default NoteItem;
