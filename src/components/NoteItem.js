import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStickyNote } from "@fortawesome/free-solid-svg-icons";

const NoteItem = ({
  note,
  settings,
  onDeleteNote,
  onSelectNote,
  selectedNoteId,
  onNoteContextMenu,
  deleteModeOn,
  isOpenedUnderFolder,
}) => {
  const handleNoteClick = () => {
    if (deleteModeOn) {
      onDeleteNote(note);
    } else {
      onSelectNote(note.noteID);
    }
  };

  // Get note item class based on item style in settings
  const getNoteItemStyle = () => {
    if (settings && settings?.userSettings) {
      if (settings?.userSettings.noteItemStyle === "normal") return "note-item";
      return "note-item-style-" + settings?.userSettings.noteItemStyle;
    } else {
      return "note-item";
    }
  };

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
    <div
      className={`${getNoteItemStyle()} ${
        note.noteID === selectedNoteId ? "note-item-active" : ""
      } ${deleteModeOn ? "note-item-deletemode" : ""} ${
        isOpenedUnderFolder ? "note-item-under-folder" : ""
      }`}
      onClick={() => handleNoteClick()}
      onContextMenu={(e) => {
        e.preventDefault();
        onNoteContextMenu(e, note);
      }}
    >
      <FontAwesomeIcon
        style={{ color: note.noteColor }}
        icon={faStickyNote}
        id={"notecolor-" + note.noteID}
      />
      <span
        className="hide-vertical-overflow-text"
        id={"notetitle-" + note.noteID}
      >
        {note.noteTitle}
      </span>
      {settings?.userSettings.noteItemStyle === "detailed" && (
        <div style={{ width: "287px" }}>
          <span className="hide-vertical-overflow-text note-item-detailed-contentpreview">
            {atob(note.noteContent)}
          </span>
          <span className="note-item-detailed-lastsaved">
            {formatDate(note.lastSaved)}
          </span>
        </div>
      )}
    </div>
  );
};

export default NoteItem;
