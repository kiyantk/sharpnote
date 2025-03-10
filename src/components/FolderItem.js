import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom'
import NoteItem from "./NoteItem"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderClosed, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { closestCenter, DndContext } from "@dnd-kit/core";
import SortableItem from "./SortableItem";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const FolderItem = ({ notes, folder, settings, onDeleteFolder, onClickFolder, onFolderContextMenu, deleteModeOn, openedFolders,
  onDeleteNote, onSelectNote, onEditNote, onNoteContextMenu, selectedNoteId, onDragEnd, sensors
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

  useEffect(() => {
    if (!folder || !notes || !settings) return;
  
    // Ensure settings.structure exists before trying to access folders
    const folderSettings = settings.structure?.folders?.find(f => f.folderID === folder.folderID);
  
    // If the folder exists in settings, use its folderOrder; otherwise, fallback to folder.folderNotes
    const folderNotesArray = folderSettings
      ? JSON.parse(folderSettings.folderOrder)
      : (Array.isArray(folder.folderNotes) ? folder.folderNotes : JSON.parse(folder.folderNotes || "[]"));
  
    // Map over folderNotesArray and order the notes based on the noteIDs
    const orderedNotes = folderNotesArray
      .map((noteID) => {
        return notes.find((note) => note.noteID === noteID);
      })
      .filter(note => note !== undefined); // Filter out undefined if any noteID doesn't match
  
    
    setFullFolderNotes(orderedNotes);
  }, [folder, notes, settings]); // Added settings as a dependency  

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

// Add a drag context for notes inside the folder
return (
  <div>
    <div
      className={`${getNoteItemStyle()} ${folder.folderID === isFolderOpened ? 'note-item-active' : ''} ${deleteModeOn ? 'note-item-deletemode' : ''}`}
      onClick={() => handleFolderClick()}
      onContextMenu={(e) => {
        e.preventDefault();
        onFolderContextMenu(e, folder);
      }}
    >
      <FontAwesomeIcon style={{ color: folder.folderColor }} icon={isFolderOpened ? faFolderOpen : faFolderClosed} />
      <span className="hide-vertical-overflow-text">{folder.folderTitle}</span>
    </div>

    <div className={"opened-folder-notes-container"} style={{ display: isFolderOpened ? "block" : "none" }}>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}> {/* Handle drag within the folder */}
        <SortableContext items={fullFolderNotes.map(note => note.noteID)} strategy={verticalListSortingStrategy}>
          {fullFolderNotes.map((note) => (
            <SortableItem
              key={note.noteID}
              id={note.noteID}
              onClick={() => onSelectNote(note.noteID)}
              settingsIsDNDDisabled={settings.userSettings.disableDnD}
            >
              <NoteItem
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
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  </div>
);
};

export default FolderItem;
