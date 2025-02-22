import React from "react";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faStickyNote } from '@fortawesome/free-solid-svg-icons';

const NoteItem = ({ note, onDeleteNote, onSelectNote, onEditNote, selectedNoteId }) => {
  return (
    <div className={`note-item ${note.noteID === selectedNoteId ? 'note-item-active' : ''}`} onClick={() => onSelectNote(note.noteID)}>
      <FontAwesomeIcon style={{ color: note.noteColor }} icon={faStickyNote} />
      <span>{note.noteTitle}</span>
      <div className="note-item-buttons">
        <button className="note-item-button note-item-button-edit" onClick={(e) => { e.stopPropagation(); onEditNote(note.noteID); }}><FontAwesomeIcon icon={faEdit} /></button>
        <button className="note-item-button note-item-button-delete" onClick={(e) => { e.stopPropagation(); onDeleteNote(note.noteID); }}><FontAwesomeIcon icon={faTrash} /></button>
      </div>
    </div>
  );
};

export default NoteItem;
