import React from "react";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-solid-svg-icons';

const NoteItem = ({ note, onDeleteNote, onSelectNote }) => {
  return (
    <div className="note-item" onClick={() => onSelectNote(note.noteID)}>
      <FontAwesomeIcon icon={faStickyNote} />
      <span>{note.noteTitle}</span>
      <button className="note-item-button" onClick={(e) => { e.stopPropagation(); onDeleteNote(note.noteID); }}><FontAwesomeIcon icon={faTrash} /></button>
    </div>
  );
};

export default NoteItem;
