import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCircleInfo, faDownload, faArrowRight, faFolderPlus, faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import FolderSelector from "./FolderSelector";

const NoteContextMenu = ({folders, currentActiveCtx, currentActiveCtxFull, currentMouseEvent, onCloseCtx, onDeleteNote, onEditNote, onViewNoteInfo, onExportThruCtx, onMoveToSelected}) => {
  const menuRef = useRef(null);
  const [needToSelectFolder, setNeedToSelectFolder] = useState(false);
  const [folderSelectorPosition, setFolderSelectorPosition] = useState({ x: 0, y: 0 });

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
      <div className="note-context-menu-container">
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onViewNoteInfo(currentActiveCtx)}} >
          <span><FontAwesomeIcon icon={faCircleInfo} /> <span className="note-context-menu-text">Note Info</span></span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onEditNote(currentActiveCtx)}}>
          <span><FontAwesomeIcon icon={faEdit} /> <span className="note-context-menu-text">Edit Note</span></span>
        </div>
        <div 
          className="note-context-menu-item"
          style={{backgroundColor: needToSelectFolder ? "#131313" : ""}}
          onClick={() => {setNeedToSelectFolder(true)}}
        >
          <span><FontAwesomeIcon icon={faRightToBracket} /> <span className="note-context-menu-text">Move to Folder</span></span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onExportThruCtx(currentActiveCtxFull)}} >
          <span><FontAwesomeIcon icon={faDownload} /> <span className="note-context-menu-text">Export Note</span></span>
        </div>
        <div className="note-context-menu-item" onClick={() => {onCloseCtx(); onDeleteNote(currentActiveCtxFull)}} >
          <span><FontAwesomeIcon icon={faTrash} /> <span className="note-context-menu-text">Delete Note</span></span>
        </div>
      </div>

      {needToSelectFolder && (
        <FolderSelector
          folders={folders} // Pass function to apply new settings
          onCloseCtx={onCloseCtx}
          forNote={currentActiveCtxFull}
          onMoveToSelected={onMoveToSelected}
        />
      )}
    </div>
  );
};

export default NoteContextMenu;
