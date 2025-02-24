import React, { useState } from "react";

const NoteInfo = ({ noteToShow, onNoteInfoPopupClose }) => {
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
    <div className="settings-popup-overlay">
      <div className="noteinfo-popup">
        <div>
            <h2>Note Info</h2>
        </div>
        <div className="noteinfo-popup-content">
          <div className="noteinfo-popup-content-container">
            <div className="noteinfo-popup-sidebyside">
              <div className="editnote-popup-item">
                  <span>Note Title</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.noteTitle}></input>
              </div>
              <div className="editnote-popup-item" style={{width: '182px'}}>
                  <span>Note Color</span>
                  <div style={{ backgroundColor: noteToShow.noteColor, width: "30px", height: "30px", marginTop: "4px", borderRadius: "4px", border: "1px solid #ccc" }}></div>
              </div>
            </div>
            <div className="noteinfo-popup-sidebyside">
              <div className="editnote-popup-item">
                  <span>Original Author</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.noteOriginalAuthor}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Latest Author</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.noteLastAuthor}></input>
              </div>
            </div>
            <div className="noteinfo-popup-sidebyside">
              <div className="editnote-popup-item">
                  <span>Created</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={formatDate(noteToShow.created)}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Last Saved</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={formatDate(noteToShow.lastSaved)}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Last Opened</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={formatDate(noteToShow.lastOpened)}></input>
              </div>
            </div>
            <div className="noteinfo-popup-sidebyside">
              <div className="editnote-popup-item">
                  <span>SharpNote Version</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.sharpnoteVersion}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Revision</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.noteVersion}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Note ID</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.noteID}></input>
              </div>
            </div>
            <div className="noteinfo-popup-sidebyside">
              <div className="editnote-popup-item">
                  <span>Attachments</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={JSON.parse(noteToShow.noteAttachments).length}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Tags</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={JSON.parse(noteToShow.noteTags).join(', ')}></input>
              </div>
              <div className="editnote-popup-item">
                  <span>Last Exported</span>
                  <input type="text" disabled className="noteinfo-input editnote-titleinput" value={noteToShow.lastExported}></input>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-bottom-bar">
          <button className="settings-close-btn" onClick={onNoteInfoPopupClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteInfo;
