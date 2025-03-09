import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faCircleInfo, faDownload, faArrowRight, faFolderPlus, faRightToBracket, faFolder, faXmark } from '@fortawesome/free-solid-svg-icons';

const FolderSelector = ({folders, onMoveToSelected, onCloseCtx, forNote}) => {
  const menuRef = useRef(null);

  // Close alongside ctx if click outside
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
    <div className="folder-selector-container" ref={menuRef}>
      <div>
        {folders.map((folder) => (
          folder.folderID !== forNote.noteFolder ? (
            <div className="note-context-menu-item" key={`folderselector-` + folder.folderID} onClick={() => {onCloseCtx(); onMoveToSelected(forNote, folder)}} >
              <span><FontAwesomeIcon icon={faFolder} /> <span className="note-context-menu-text">{folder.folderTitle}</span></span>
            </div>
          ) : folder.folderID === forNote.noteFolder ? (
            <div className="note-context-menu-item" key={`folderselector-` + folder.folderID} onClick={() => {onCloseCtx(); onMoveToSelected(forNote, folder)}} >
              <span><FontAwesomeIcon icon={faXmark} /> <span className="note-context-menu-text">Remove from folder</span></span>
            </div>
          ) : null
        ))}
        </div>
    </div>
  );
};

export default FolderSelector;
