import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCircleInfo, faDownload } from '@fortawesome/free-solid-svg-icons';

const FolderContextMenu = ({currentActiveCtx, currentActiveCtxFull, currentMouseEvent, onCloseCtx, onDeleteFolder, onEditFolder, onViewFolderInfo, onExportThruCtx}) => {
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

  // Get amount of notes in the folder
  const getFolderLength = () => {
    if(Array.isArray(currentActiveCtxFull.folderNotes)) {
      return currentActiveCtxFull.folderNotes.length
    } else if (currentActiveCtxFull.folderNotes === undefined || currentActiveCtxFull.folderNotes === null) {
      return []
    } else {
      return [currentActiveCtxFull.folderNotes].length
    }
  }

  return (
    <div className="note-context-menu" ref={menuRef} style={{left: currentMouseEvent?.clientX + 10, top: currentMouseEvent?.clientY}}>
      <div className="note-context-menu-container">
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onViewFolderInfo(currentActiveCtx, "folder")}} >
          <span><FontAwesomeIcon icon={faCircleInfo} /> <span className="note-context-menu-text">Folder Info</span></span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onEditFolder(currentActiveCtx, "folder")}}>
          <span><FontAwesomeIcon icon={faEdit} /> <span className="note-context-menu-text">Edit Folder</span></span>
        </div>
        <div className="note-context-menu-item" style={{display: getFolderLength() > 0 ? '' : 'none'}} onClick={() => {onCloseCtx(); onExportThruCtx(currentActiveCtxFull)}} >
          <span><FontAwesomeIcon icon={faDownload} /> <span className="note-context-menu-text">Export Folder Notes</span></span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onDeleteFolder(currentActiveCtxFull)}} >
          <span><FontAwesomeIcon icon={faTrash} /> <span className="note-context-menu-text">Delete Folder</span></span>
        </div>
      </div>
    </div>
  );
};

export default FolderContextMenu;
