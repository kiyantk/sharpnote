import React from "react";
import NoteItem from "./NoteItem";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';

const NoteList = ({ notes, onAddNote, onDeleteNote, onSelectNote, activeTab, onTabSwitch }) => {
  const sortedNotes = activeTab === "recent"
  ? notes.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
  : notes.sort((a, b) => new Date(b.created) - new Date(a.created));

  return (
    <div className="note-list">
      <div className="note-list-topbar">
        <button className="note-list-topbutton" onClick={onAddNote}><FontAwesomeIcon icon={faPlus} /> New Note</button>
      </div>
      <div className="note-list-tabs">
        <div 
          className={`note-list-tab ${activeTab === "all" ? 'note-list-tab-active' : ''}`} 
          id="note-list-tab-all" 
          onClick={() => onTabSwitch("all")} // Fix: Now correctly updates state on click
        >
          <FontAwesomeIcon icon={faBars} /> All Notes
        </div>
        <div 
          className={`note-list-tab ${activeTab === "recent" ? 'note-list-tab-active' : ''}`} 
          id="note-list-tab-recent" 
          onClick={() => onTabSwitch("recent")} // Fix: Same as above
        >
          <FontAwesomeIcon icon={faClockRotateLeft} /> Recent Notes
        </div>
      </div>
      <div className="note-list-notes">
      <div className={`note-list-notes-${activeTab}`}>
        {sortedNotes.map((note) => (
          <NoteItem
            key={note.noteID}
            note={note}
            onDeleteNote={onDeleteNote}
            onSelectNote={() => onSelectNote(note.noteID)}
          />
        ))}
      </div>
      </div>
    </div>
  );
};

export default NoteList;
