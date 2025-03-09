import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom'
import NoteItem from "./NoteItem"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderClosed, faFolderOpen } from '@fortawesome/free-solid-svg-icons';

const FolderItem = ({ notes, folder, settings, onDeleteFolder, onClickFolder, onFolderContextMenu, deleteModeOn, openedFolders,
  onDeleteNote, onSelectNote, onEditNote, onNoteContextMenu, selectedNoteId
 }) => {
  const [isFolderOpened, setIsFolderOpened] = useState(false);
  const [fullFolderNotes, setFullFolderNotes] = useState([]);

  const handleFolderClick = () => {
    if(deleteModeOn) {
      onDeleteFolder(folder)
    } else {
      onClickFolder(folder.folderID)
    }
  }

  // Toggle folder open state
  useEffect(() => {
    if(openedFolders.includes(folder.folderID)) {
      setIsFolderOpened(true);
    } else {
      setIsFolderOpened(false);
    }
  }, [openedFolders]);

  // Get the full notes from the noteIDs in folderNotes
  useEffect(() => {
    if (!folder || !notes) return;

    // Ensure folder.folderNotes is an array (parse if stored as a string)
    const folderNotesArray = Array.isArray(folder.folderNotes)
      ? folder.folderNotes
      : JSON.parse(folder.folderNotes || "[]");
  
    // Filter notes where noteID is in folder.folderNotes
    const filteredNotes = notes.filter((note) => folderNotesArray.includes(note.noteID));
  
    setFullFolderNotes(filteredNotes);
  }, [folder, notes]);

  // Get classname for folder item based on item style in settings
  const getNoteItemStyle = () => {
    if(settings && settings?.userSettings) {
      if(settings?.userSettings.noteItemStyle === "normal") return "note-item"
      return "note-item-style-" + settings?.userSettings.noteItemStyle
    } else {
      return "note-item"
    }
  }

  // Format the date to human-readable
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div>
    <div className={`${getNoteItemStyle()} ${folder.folderID === isFolderOpened ? 'note-item-active' : ''} ${deleteModeOn ? 'note-item-deletemode' : ''}`} onClick={() => handleFolderClick()} 
    onContextMenu={(e) => {
      e.preventDefault();
      onFolderContextMenu(e, folder);
    }}>
      <FontAwesomeIcon style={{ color: folder.folderColor }} icon={isFolderOpened ? faFolderOpen : faFolderClosed} />
      <span className="hide-vertical-overflow-text">{folder.folderTitle}</span>
      {settings?.userSettings.noteItemStyle === "detailed" && (
        <div style={{width: '287px'}}>
          <span className="hide-vertical-overflow-text note-item-detailed-contentpreview">{folder.folderNotes.length} notes</span>
          <span className="note-item-detailed-lastsaved">{formatDate(folder.created)}</span>
        </div>
      )}
    </div>
    <div className={"opened-folder-notes-container"} style={{display: isFolderOpened ? "block" : "none"}}>
    {fullFolderNotes.map((note) =>
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
          isOpenedUnderFolder={true}
        />
    )}
    </div>
    </div>
  );
};

export default FolderItem;
