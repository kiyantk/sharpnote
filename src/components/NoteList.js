import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import NoteItem from "./NoteItem";
import FolderItem from "./FolderItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBars, faClockRotateLeft, faFolderPlus, faAnglesLeft, faAnglesRight, faArrowDownWideShort } from '@fortawesome/free-solid-svg-icons';

const NoteList = ({ notes, settings, onAddNote, onDeleteNote, onSelectNote, activeTab, onTabSwitch, onEditNote, 
  selectedNoteId, onNoteContextMenu, deleteModeOn, leftPanelVisible, onAddFolder, folders,
  onDeleteFolder, onClickFolder, onFolderContextMenu, openedFolders, toggleLeftPanel, onUpdateFullList, onUpdateFolderOrder }) => {
  const [fullList, setFullList] = useState([]);

  useEffect(() => {
    // Ensure settings.structure and settings.structure.rootOrder exist
    if (!settings || !settings.structure) {
      // If settings.structure doesn't exist, sort by .created as a fallback
      const combinedList = [...folders, ...notes]; // Combine folders and notes first
  
      const sortedList = combinedList.sort((a, b) => {
        return new Date(a.created) - new Date(b.created); // Sort by .created date
      });
  
      setFullList(sortedList); // Update state with sorted list
      return; // Exit early if settings.structure doesn't exist
    }
  
    // Default to empty array if rootOrder doesn't exist
    const rootOrder = settings.structure.rootOrder || [];
  
    // Concatenate folders into notes first
    const combinedList = [...folders, ...notes];
  
    let sortedList;
  
    if (rootOrder.length > 0) {
      // Sort based on the IDs in rootOrder if rootOrder is not empty
      sortedList = combinedList.sort((a, b) => {
        const aId = a.noteID || a.folderID; // Get the ID for sorting
        const bId = b.noteID || b.folderID;
  
        // Find the index of these IDs in rootOrder
        const aIndex = rootOrder.indexOf(aId);
        const bIndex = rootOrder.indexOf(bId);
  
        // Return the result of comparing the indices (ascending order)
        return aIndex - bIndex;
      });
    } else {
      // If rootOrder is empty, fall back to sorting by .created
      sortedList = combinedList.sort((a, b) => {
        return new Date(a.created) - new Date(b.created); // Sort by .created date
      });
    }
  
    // Set the sorted list into the state
    setFullList(sortedList);
  }, [notes, folders, settings]);  // Ensure it updates when notes, folders, or settings change
  
  

// Second useEffect (sync with fullList)
useEffect(() => {
  if (fullList.length === 0) return;  // Ensure it doesn't run if fullList is empty
  
  const fullListStringIDs = fullList
    .filter(item => !item.noteFolder)  // Filter out items where noteFolder is filled
    .map(item => item.noteID || item.folderID);  // Map the remaining items to their noteID or folderID
  
  // Only update full list if it has changed (to prevent infinite loop)
  onUpdateFullList(fullListStringIDs);
}, [fullList]);  // Ensure it updates only when fullList changes
  

  // const sortedList = activeTab === "recent"
  //   ? fullList.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
  //   : fullList.sort((a, b) => new Date(b.created) - new Date(a.created));

  const getItemId = (item) => item.sharpnoteType === "note" ? item.noteID : item.folderID;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const oldIndex = fullList.findIndex(item => getItemId(item) === active.id);
    const newIndex = fullList.findIndex(item => getItemId(item) === over.id);
  
    if (oldIndex !== -1 && newIndex !== -1) {
      const newList = [...fullList];
      const [movedItem] = newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, movedItem);
  
      setFullList(newList); // update state
    }
  };

  const handleFolderDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    // Find the index of the item in fullList
    const oldIndex = fullList.findIndex(item => getItemId(item) === active.id);
    const newIndex = fullList.findIndex(item => getItemId(item) === over.id);
  
    if (oldIndex !== -1 && newIndex !== -1) {
      // Create a copy of fullList to avoid direct mutation
      const newList = [...fullList];
      const [movedItem] = newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, movedItem);
      
      // Assuming fullList contains folders, and each folder has a 'folderNotes' array
      // Find the folder that contains the moved item (active.id)
      const folderIndex = fullList.findIndex(item => item.folderNotes?.includes(active.id));
      if (folderIndex !== -1) {
        const folder = fullList[folderIndex];
        let oldFolderNotes = Array.isArray(folder.folderNotes)
        ? folder.folderNotes
        : JSON.parse(folder.folderNotes || "[]");
    
    // Check if settings.structure.folders exists and find the matching folderID
    let folderNotes;
    
    if (settings.structure && settings.structure.folders) {
        const matchingFolder = settings.structure.folders.find(f => f.folderID === folder.folderID);
        if (matchingFolder) {
            folderNotes = JSON.parse(matchingFolder.folderOrder);  // Use folderOrder if found
        }
    }
    
    if (!folderNotes) {
        // If no matching folder is found, or structure doesn't exist, fall back to folderNotes
        folderNotes = oldFolderNotes;
    }
  
    console.log(folderNotes)
  
        // Reorder the folderNotes array after moving the item
        const oldNoteIndex = folderNotes.indexOf(active.id);
        const newNoteIndex = folderNotes.indexOf(over.id);
  
        if (oldNoteIndex !== -1 && newNoteIndex !== -1) {
          // Remove the active note from its old position and insert it in the new position
          folderNotes.splice(oldNoteIndex, 1);
          folderNotes.splice(newNoteIndex, 0, active.id);
  
          // Update the folderNotes in fullList
          const updatedFolder = {
            ...folder,
            folderNotes: JSON.stringify(folderNotes)
          };
          newList[folderIndex] = updatedFolder; // Update folder in fullList
          onUpdateFolderOrder(updatedFolder)
        }
      }
  
      // Update state with the new list
      setFullList(newList);
    }
  };
  

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 40, // Ensures it only activates after the mouse moves a bit
    },
  }),
);

  return (
    <div className={`${leftPanelVisible ? 'note-list' : 'note-list-min'}`}>  
      <div className="note-list-topbar" style={{ display: leftPanelVisible ? 'grid' : 'none' }}>
        <button className="note-list-topbutton" onClick={onAddNote}><FontAwesomeIcon icon={faPlus} /> New Note</button>
        <button className="note-list-topbutton" onClick={onAddFolder}><FontAwesomeIcon icon={faFolderPlus} /> New Folder</button>
      </div>
      {/* <div className="note-list-tabs" style={{display: leftPanelVisible ? 'grid' : 'none'}}>
        <div 
          className={`note-list-tab ${activeTab === "all" ? 'note-list-tab-active' : ''}`} 
          id="note-list-tab-all" 
          onClick={() => onTabSwitch("all")} // Fix: Now correctly updates state on click
        >
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
      </div>
      <DndContext 
  collisionDetection={closestCenter} 
  onDragEnd={handleDragEnd}
  autoScroll={{ enabled: false }} 
  sensors={sensors}
>

        <SortableContext items={fullList.map(item => getItemId(item))} strategy={verticalListSortingStrategy}>
          <div className="note-list-notes" style={{ display: leftPanelVisible ? 'grid' : 'none' }}>
            <div className={`note-list-notes-${activeTab}`}> 
              {fullList.map((item) => (
                <SortableItem 
                key={item.sharpnoteType === "note" ? item.noteID : item.folderID} 
                id={item.sharpnoteType === "note" ? item.noteID : item.folderID} 
                settingsIsDNDDisabled={settings.userSettings.disableDnD}
              >              
                  {item.sharpnoteType === "note" && (item.noteFolder?.length < 1 || item.noteFolder === null) ? (
                    <NoteItem
                      note={item}
                      onDeleteNote={onDeleteNote}
                      selectedNoteId={selectedNoteId}
                      onSelectNote={() => { onSelectNote(item.noteID)}}
                      onEditNote={onEditNote}
                      onNoteContextMenu={onNoteContextMenu}
                      deleteModeOn={deleteModeOn}
                      settings={settings}
                      isOpenedUnderFolder={false}
                    />
                  ) : item.sharpnoteType === "folder" ? (
                    <FolderItem
                    notes={notes}
                    folder={item}
                    onDeleteFolder={onDeleteFolder}
                    onClickFolder={() => onClickFolder(item.folderID)}
                    onFolderContextMenu={onFolderContextMenu}
                    openedFolders={openedFolders}
                    settings={settings}
                    onDeleteNote={onDeleteNote}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={onSelectNote}
                    onEditNote={onEditNote}
                    onNoteContextMenu={onNoteContextMenu}
                    deleteModeOn={deleteModeOn}
                    onDragEnd={handleFolderDragEnd} // Make sure folder has its own drag handler
                    sensors={sensors}
                  />
                  ) : null}
                </SortableItem>
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>
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
