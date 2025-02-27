import React from "react";
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faStickyNote } from '@fortawesome/free-solid-svg-icons';

const NoteItem = ({ note, onDeleteNote, onSelectNote, selectedNoteId, onNoteContextMenu, deleteModeOn }) => {
  const handleNoteClick = () => {
    if(deleteModeOn) {
      onDeleteNote(note.noteID)
    } else {
      onSelectNote(note.noteID)
    }
  }

  return (
    <div className={`note-item ${note.noteID === selectedNoteId ? 'note-item-active' : ''} ${deleteModeOn ? 'note-item-deletemode' : ''}`} onClick={() => handleNoteClick()} 
    onContextMenu={(e) => {
      e.preventDefault();
      onNoteContextMenu(e, note.noteID);
    }}>
      <FontAwesomeIcon style={{ color: note.noteColor }} icon={faStickyNote} />
      <span className="hide-vertical-overflow-text">{note.noteTitle}</span>
    </div>
  );
};

export default NoteItem;
