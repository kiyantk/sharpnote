import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faToggleOn, faCheck, faToggleOff, faQuestion, faStarOfLife } from "@fortawesome/free-solid-svg-icons";

const BottomBar = ({ autosaveStatus, editorContent, onRefresh, onManualSaveNote, noteOpened, manualSaveIcon, manualSaveText }) => {
  const [rotating, setRotating] = useState(false);

  // Function to count words and lines
  const getWordAndLineCount = (text) => {
    if(text !== null && text !== "") {
        const lines = text.split(/\r\n|\r|\n/).length;
        const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
        return { words, lines };
    } else {
        const lines = null;
        const words = null;
        return { words, lines };
    }
  };

  // Get word and line count from editor's content
  const { words, lines } = getWordAndLineCount(editorContent);

  // Autosave status logic
  const getAutosaveStatus = () => {
    switch (autosaveStatus) {
      case 1:
        return { icon: faToggleOff, text: "Autosave Off", className: "status-off" };
      case 2:
        return { icon: faCheck, text: "Up to date", className: "status-saved" };
      case 3:
        return { icon: faStarOfLife, text: "Changed", className: "status-changed" };
      case 4:
        return { icon: faToggleOn, text: "Autosave On", className: "status-on" };
      default:
        return { icon: faQuestion, text: "Unknown", className: "status-off" };
    }
  };

  const { icon, text, className } = getAutosaveStatus();

  // Refresh button click handler
  const handleRefresh = () => {
    setRotating(true);
    onRefresh(); // Call the refresh function passed from parent
    setTimeout(() => setRotating(false), 500); // Reset animation after 0.5s
  };

  // Manual save using Save button in bottom right corner
  const doManualSave = () => { 
    onManualSaveNote()
  }

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        {/* Left: Refresh Button */}
        <button className={`refresh-btn ${rotating ? "rotating" : ""}`} onClick={handleRefresh}>
          <FontAwesomeIcon icon={faRotate} />
        </button>
      </div>

      <div className="bottom-bar-right">
        {/* Right: Word & Line Count */}
        <div className="word-line-count">
            {words !== null && lines !== null && (
                <div>
                    <span>{words} words</span>, <span>{lines} lines</span>
                </div>
            )}
        </div>

        {/* Rightmost: Autosave Status */}
        <div className={`autosave-status ${className}`}>
          <FontAwesomeIcon icon={icon} /> <span>{text}</span>
        </div>

        {noteOpened && (
        <div className={`manualsave-btn`} onClick={doManualSave}>
            <FontAwesomeIcon icon={manualSaveIcon} /> <span>{manualSaveText}</span>
        </div>
        )}
      </div>
    </div>
  );
};

export default BottomBar;
