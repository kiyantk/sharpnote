import React, { useState, useEffect } from "react";
import NoteItem from "./NoteItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderClosed,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { closestCenter, DndContext } from "@dnd-kit/core";
import SortableItem from "./SortableItem";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const FolderItem = ({
  notes,
  folder,
  settings,
  onDeleteFolder,
  onClickFolder,
  onFolderContextMenu,
  deleteModeOn,
  openedFolders,
  onDeleteNote,
  onSelectNote,
  onEditNote,
  onNoteContextMenu,
  selectedNoteId,
  onDragEnd,
  sensors,
}) => {
  const [isFolderOpened, setIsFolderOpened] = useState(false);
  const [fullFolderNotes, setFullFolderNotes] = useState([]);

  const handleFolderClick = () => {
    if (deleteModeOn) {
      onDeleteFolder(folder);
    } else {
      onClickFolder(folder.folderID);
    }
  };

  // Toggle folder open state
  useEffect(() => {
    if (openedFolders.includes(folder.folderID)) {
      setIsFolderOpened(true);
    } else {
      setIsFolderOpened(false);
    }
  }, [openedFolders]);

  useEffect(() => {
    if (!folder || !notes || !settings) return;

    // Retrieve the folder settings if available
    const folderSettings = settings.structure?.folders?.find(
      (f) => f.folderID === folder.folderID
    );

    // Get folder order from settings if available, otherwise, default to an empty array
    const folderOrder = folderSettings
      ? Array.isArray(folderSettings.folderOrder)
        ? folderSettings.folderOrder
        : JSON.parse(folderSettings.folderOrder || "[]")
      : [];

    // Get folderNotes and ensure it's an array
    const folderNotes = Array.isArray(folder.folderNotes)
      ? folder.folderNotes
      : JSON.parse(folder.folderNotes || "[]");

    // Combine both lists, ensuring all notes are included
    const combinedNoteIDs = [...new Set([...folderOrder, ...folderNotes])]; // Ensure uniqueness

    // Map over combinedNoteIDs to retrieve the actual note objects
    const orderedNotes = combinedNoteIDs
      .map((noteID) => notes.find((note) => note.noteID === noteID))
      .filter((note) => note !== undefined); // Filter out undefined if any noteID doesn't match

    setFullFolderNotes(orderedNotes);
  }, [folder, notes]);

  // Get classname for folder item based on item style in settings
  const getNoteItemStyle = () => {
    if (settings && settings?.userSettings) {
      if (settings?.userSettings.noteItemStyle === "normal") return "note-item";
      return "note-item-style-" + settings?.userSettings.noteItemStyle;
    } else {
      return "note-item";
    }
  };

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
        className={`${getNoteItemStyle()} ${
          folder.folderID === isFolderOpened ? "note-item-active" : ""
        } ${deleteModeOn ? "note-item-deletemode" : ""}`}
        onClick={() => handleFolderClick()}
        onContextMenu={(e) => {
          e.preventDefault();
          onFolderContextMenu(e, folder);
        }}
      >
        <FontAwesomeIcon
          style={{ color: folder.folderColor }}
          icon={isFolderOpened ? faFolderOpen : faFolderClosed}
          id={"foldercolor-" + folder.folderID}
        />
        <span
          className="hide-vertical-overflow-text"
          id={"foldertitle-" + folder.folderID}
        >
          {folder.folderTitle}
        </span>
      </div>
      <div
        className={"opened-folder-notes-container"}
        style={{ display: isFolderOpened ? "block" : "none" }}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          sensors={sensors}
          autoScroll={{ enabled: false }}
          modifiers={[restrictToVerticalAxis]}
        >
          {" "}
          {/* Handle drag within the folder */}
          <SortableContext
            items={fullFolderNotes.map((note) => note.noteID)}
            strategy={verticalListSortingStrategy}
          >
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
