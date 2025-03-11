import React, { useState, useEffect } from "react";
import NoteItem from "./NoteItem";
import FolderItem from "./FolderItem";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faBars, faClockRotateLeft, faFolderPlus, faAnglesLeft, faAnglesRight, faArrowDownWideShort } from '@fortawesome/free-solid-svg-icons';

const NoteList = ({ notes, settings, onAddNote, onDeleteNote, onSelectNote, activeTab, onTabSwitch, onEditNote, 
  selectedNoteId, onNoteContextMenu, deleteModeOn, leftPanelVisible, onAddFolder, folders,
  onDeleteFolder, onClickFolder, onFolderContextMenu, openedFolders, toggleLeftPanel}) => {
  const [fullList, setFullList] = useState([]);
  // Sort notes based on tab selected (all tab = created, recent tab = lastOpened)
  const sortedList = activeTab === "recent"
  ? fullList.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
  : fullList.sort((a, b) => new Date(b.created) - new Date(a.created));

  useEffect(() => {
    setFullList(notes.concat(folders))
  }, [notes, folders]);

  return (
    <div className={`${leftPanelVisible ? 'note-list' : 'note-list-min'}`}>
      <div className="note-list-topbar" style={{display: leftPanelVisible ? 'grid' : 'none'}}>
        <button className="note-list-topbutton" onClick={onAddNote}><FontAwesomeIcon icon={faPlus} /> New Note</button>
        <button className="note-list-topbutton" onClick={onAddFolder}><FontAwesomeIcon icon={faFolderPlus} /> New Folder</button>
      </div>
      {/* <div className="note-list-tabs" style={{display: leftPanelVisible ? 'grid' : 'none'}}>
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
      </div> */}
      <div className="note-list-notes" style={{display: leftPanelVisible ? 'grid' : 'none'}}>
      <div className={`note-list-notes-${activeTab}`}>
        {sortedList.map((note) =>
          (note.sharpnoteType === "note" && (note.noteFolder?.length < 1 || note.noteFolder === null)) ? (
            <NoteItem
              key={`notelistnote-` + note.noteID}
              note={note}
              onDeleteNote={onDeleteNote}
              selectedNoteId={selectedNoteId}
              onSelectNote={() => onSelectNote(note.noteID)}
              onEditNote={onEditNote}
              onNoteContextMenu={onNoteContextMenu}
              deleteModeOn={deleteModeOn}
              settings={settings}
              isOpenedUnderFolder={false}
            />
          ) : note.sharpnoteType === "folder" ? (
            <FolderItem
              key={`notelistfolder-` + note.folderID}
              notes={notes}
              folder={note}
              onDeleteFolder={onDeleteFolder}
              onClickFolder={() => onClickFolder(note.folderID)}
              onFolderContextMenu={onFolderContextMenu}
              openedFolders={openedFolders}
              settings={settings}
              onDeleteNote={onDeleteNote}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onEditNote={onEditNote}
              onNoteContextMenu={onNoteContextMenu}
              deleteModeOn={deleteModeOn}
            />
          ) : null
        )}
      </div>
      </div>
      {leftPanelVisible && (
        <div className="note-list-bottombar">
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"><FontAwesomeIcon icon={faArrowDownWideShort} /></button>
          <button className="note-list-bottombutton" onClick={toggleLeftPanel}><FontAwesomeIcon icon={faAnglesLeft} /></button>
        </div>
      )}
      {!leftPanelVisible && (
        <div className="note-list-bottombar-min">
          <button className="note-list-bottombutton note-list-bottombutton-min" onClick={toggleLeftPanel}><FontAwesomeIcon icon={faAnglesRight} /></button>
        </div>
      )}
    </div>
  );
};

export default NoteList;
