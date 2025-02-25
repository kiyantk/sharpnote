import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const NoteContextMenu = ({currentActiveCtx, currentMouseEvent, onCloseCtx, onDeleteNote, onEditNote, onViewNoteInfo}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onCloseCtx();  // Call the onClose function when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="note-context-menu" ref={menuRef} style={{left: currentMouseEvent?.clientX + 10, top: currentMouseEvent?.clientY}}>
      <div>
        <div className="note-context-menu-item" onClick={() => onViewNoteInfo(currentActiveCtx)} >
          <span><FontAwesomeIcon icon={faCircleInfo} /> Note Info</span>
        </div>
        <div className="note-context-menu-item" onClick={() => onEditNote(currentActiveCtx)}>
          <span><FontAwesomeIcon icon={faEdit} /> Edit Note</span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onDeleteNote(currentActiveCtx)}}>
          <span><FontAwesomeIcon icon={faTrash} /> Delete Note</span>
        </div>
      </div>
    </div>
  );
};

export default NoteContextMenu;
