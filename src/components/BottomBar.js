import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faToggleOn,
  faCheck,
  faToggleOff,
  faQuestion,
  faStarOfLife,
} from "@fortawesome/free-solid-svg-icons";

const BottomBar = ({
  notes,
  autosaveStatus,
  editorContent,
  isEditorContentDecoded,
  onRefresh,
  onManualSaveNote,
  noteOpened,
  manualSaveIcon,
  manualSaveText,
  onShortcutAddNote,
  onShortcutCloseNote,
  settings,
}) => {
  const [rotating, setRotating] = useState(false);

  // Function to count words and lines
  const getWordAndLineCount = (text) => {
    if (text !== null && text !== "") {
      const lines = text.split(/\r\n|\r|\n/).length;
      const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
      return { words, lines };
    } else {
      return { words: null, lines: null };
    }
  };

  // Get word and line count from editor's content
  const { words, lines } = settings?.userSettings?.showTextStatistics
    ? getWordAndLineCount(
        isEditorContentDecoded ? editorContent : atob(editorContent)
      )
    : "";

  // Autosave status logic
  const getAutosaveStatus = () => {
    switch (autosaveStatus) {
      case 1:
        return {
          icon: faToggleOff,
          text: "Autosave Off",
          className: "status-off",
        };
      case 2:
        return { icon: faCheck, text: "Up to date", className: "status-saved" };
      case 3:
        return {
          icon: faStarOfLife,
          text: "Changed",
          className: "status-changed",
        };
      case 4:
        return {
          icon: faToggleOn,
          text: "Autosave On",
          className: "status-on",
        };
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
    onManualSaveNote();
  };

  // Bind keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        if (noteOpened) {
          event.preventDefault();
          doManualSave();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        handleRefresh();
      } else if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        event.preventDefault();
        onShortcutAddNote();
      } else if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        event.preventDefault();
        onShortcutCloseNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [noteOpened, editorContent]);

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        {/* Leftmost: Refresh Button */}
        <button
          className={`refresh-btn ${rotating ? "rotating" : ""}`}
          onClick={handleRefresh}
        >
          <FontAwesomeIcon icon={faRotate} />
        </button>
        {/* Left: Note Counter */}
        {settings?.userSettings?.showNoteCounter && (
          <div>
            <span className="note-counter">{notes.length} notes</span>
          </div>
        )}
      </div>

      <div className="bottom-bar-right">
        {/* Right: Word & Line Count */}
        {noteOpened && settings.userSettings.showTextStatistics && (
          <div className="word-line-count">
            {words !== null && lines !== null && (
              <div>
                <span>{words} words</span>, <span>{lines} lines</span>
              </div>
            )}
          </div>
        )}

        {/* Rightmost: Autosave Status */}
        <div className={`autosave-status ${className}`}>
          <FontAwesomeIcon icon={icon} /> <span>{text}</span>
        </div>

        {noteOpened && (
          <div className={`manualsave-btn`} onClick={doManualSave}>
            <FontAwesomeIcon icon={manualSaveIcon} />{" "}
            <span>{manualSaveText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomBar;
