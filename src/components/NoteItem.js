import React from "react";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faStickyNote } from '@fortawesome/free-solid-svg-icons';

const NoteItem = ({ note, onDeleteNote, onSelectNote, onEditNote, selectedNoteId, onNoteContextMenu }) => {
  return (
    <div className={`note-item ${note.noteID === selectedNoteId ? 'note-item-active' : ''}`} onClick={() => onSelectNote(note.noteID)} 
    onContextMenu={(e) => {
      e.preventDefault();
      onNoteContextMenu(e, note.noteID);
    }}>
      <FontAwesomeIcon style={{ color: note.noteColor }} icon={faStickyNote} />
      <span>{note.noteTitle}</span>
    </div>
  );
};

export default NoteItem;
