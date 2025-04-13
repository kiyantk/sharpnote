import React, { useState, useEffect, useRef } from "react";
import SettingsPopup from "./SettingsPopup";
import ExportPopup from "./ExportPopup";
import ImportPopup from "./ImportPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsLeftRightToLine,
  faBook,
  faClipboard,
  faCog,
  faDownload,
  faFileImport,
  faListUl,
  faRectangleXmark,
  faRedo,
  faTrash,
  faUndo,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";

const MenuBar = ({
  onSettingsChange,
  allNotes,
  allFolders,
  onExport,
  onImport,
  noneSelectedError,
  toggleDeleteMode,
  toggleLeftPanel,
  exportNoteThruCtx,
  onPreSelectReceived,
  presetFile,
  deleteAllNotes,
  toggleFullscreen,
  currSet,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(0);
  const [dropdownType, setDropdownType] = useState(null);
  const [settings, setSettings] = useState({
    userSettings: { autoSave: true }, // Default settings
  });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        toggleDropdown(); // Call the onClose function when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer
      .invoke("get-settings")
      .then((loadedSettings) => {
        if (loadedSettings) {
          setSettings(loadedSettings);
        }
      });
  }, []);

  // Open export popup if user clicked export in CTX
  useEffect(() => {
    if (exportNoteThruCtx) setIsExportPopupOpen(true);
  }, [exportNoteThruCtx]);

  // Open export popup if user opened .sharp or .sharpbook file directly
  useEffect(() => {
    if (presetFile) setIsImportPopupOpen(true);
  }, [presetFile]);

  // Apply new settings from Settings popup
  const applySettings = (newSettings) => {
    setSettings(newSettings); // Update state
    onSettingsChange(newSettings);
  };

  // Toggle dropdown
  const toggleDropdown = (event, type) => {
    setDropdownType(type);
    if (event !== undefined) {
      setDropdownPosition(event.target.offsetLeft);
    }

    setIsDropdownOpen((prev) => !prev);
  };

  // Open / Close Settings popup
  const openSettingsPopup = () => {
    setIsSettingsPopupOpen(true);
    toggleDropdown();
  };
  const closeSettingsPopup = () => setIsSettingsPopupOpen(false);

  // Open / Close Export popup
  const openExportPopup = () => {
    setIsExportPopupOpen(true);
    toggleDropdown();
  };
  const closeExportPopup = () => setIsExportPopupOpen(false);

  // Open / Close Import popup
  const openImportPopup = () => {
    setIsImportPopupOpen(true);
    toggleDropdown();
  };
  const closeImportPopup = () => setIsImportPopupOpen(false);

  // Close the app
  const closeSharpnote = () => {
    window.close();
  };

  const goTo = (destination) => {
    switch (destination) {
      case "docs":
        window.open("https://docs.kiy.li/sharpnote", "_blank");
        break;
      case "changelog":
        window.open("https://kiyantk.nl/dev/sharpnote/changelog/", "_blank");
        break;
    }
  };

  const doUndo = () => {
    document.execCommand("undo");
  };

  const doRedo = () => {
    document.execCommand("redo");
  };

  const doPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const editor = document.getElementById("sharpnote-editor");

      if (
        editor instanceof HTMLInputElement ||
        editor instanceof HTMLTextAreaElement
      ) {
        const start = editor.selectionStart || 0;
        const end = editor.selectionEnd || 0;
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        editor.value = before + text + after;
        editor.selectionStart = editor.selectionEnd = start + text.length;

        // Dispatch input event to notify React
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        console.warn("Element is not a text input or textarea.");
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  // Toggle Delete Mode
  const toggleDelMode = () => {
    toggleDropdown();
    toggleDeleteMode();
  };

  return (
    <div className="menu-bar">
      <button onClick={(e) => toggleDropdown(e, "file")}>File</button>
      <button onClick={(e) => toggleDropdown(e, "edit")}>Edit</button>
      <button onClick={(e) => toggleDropdown(e, "view")}>View</button>
      <button onClick={(e) => toggleDropdown(e, "help")}>Help</button>
      {isDropdownOpen && dropdownType === "file" && (
        <div className="menubar-dropdown-overlay">
          <div
            ref={menuRef}
            className={`dropdown-menu ${
              settings?.userSettings.showMenubarIcons
                ? "dropdown-menu-with-icons"
                : ""
            } `}
            style={{ left: dropdownPosition }}
          >
            <button
              className="menubar-dropdown-divider"
              onClick={openSettingsPopup}
            >
              <FontAwesomeIcon
                icon={faCog}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Settings</span>
            </button>
            <button onClick={openExportPopup}>
              <FontAwesomeIcon
                icon={faDownload}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Export</span>
            </button>
            <button
              className="menubar-dropdown-divider"
              onClick={openImportPopup}
            >
              <FontAwesomeIcon
                icon={faFileImport}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Import</span>
            </button>
            <button onClick={closeSharpnote}>
              <FontAwesomeIcon
                icon={faRectangleXmark}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}
      {isDropdownOpen && dropdownType === "edit" && (
        <div className="menubar-dropdown-overlay">
          <div
            ref={menuRef}
            className={`dropdown-menu ${
              settings?.userSettings.showMenubarIcons
                ? "dropdown-menu-with-icons"
                : ""
            } `}
            style={{ left: dropdownPosition }}
          >
            <button onClick={doUndo}>
              <FontAwesomeIcon
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
                icon={faUndo}
              />
              <span>Undo</span>
            </button>
            <button className="menubar-dropdown-divider" onClick={doRedo}>
              <FontAwesomeIcon
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
                icon={faRedo}
              />
              <span>Redo</span>
            </button>
            <button className="menubar-dropdown-divider" onClick={doPaste}>
              <FontAwesomeIcon
                icon={faClipboard}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Paste</span>
            </button>
            <button onClick={toggleDelMode}>
              <FontAwesomeIcon
                icon={faTrash}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Toggle Delete Mode</span>
            </button>
          </div>
        </div>
      )}
      {isDropdownOpen && dropdownType === "view" && (
        <div className="menubar-dropdown-overlay">
          <div
            ref={menuRef}
            className={`dropdown-menu ${
              settings?.userSettings.showMenubarIcons
                ? "dropdown-menu-with-icons"
                : ""
            } `}
            style={{ left: dropdownPosition }}
          >
            <button onClick={toggleLeftPanel}>
              <FontAwesomeIcon
                icon={faArrowsLeftRightToLine}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Toggle Left Panel</span>
            </button>
            <button onClick={toggleFullscreen}>
              <FontAwesomeIcon
                icon={faUpRightAndDownLeftFromCenter}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Toggle Fullscreen</span>
            </button>
          </div>
        </div>
      )}
      {isDropdownOpen && dropdownType === "help" && (
        <div className="menubar-dropdown-overlay">
          <div
            ref={menuRef}
            className={`dropdown-menu ${
              settings?.userSettings.showMenubarIcons
                ? "dropdown-menu-with-icons"
                : ""
            } `}
            style={{ left: dropdownPosition }}
          >
            <button onClick={() => goTo("docs")}>
              <FontAwesomeIcon
                icon={faBook}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Documentation</span>
            </button>
            <button onClick={() => goTo("changelog")}>
              <FontAwesomeIcon
                icon={faListUl}
                style={{
                  display: settings?.userSettings.showMenubarIcons
                    ? "initial"
                    : "none",
                }}
              />
              <span>Changelog</span>
            </button>
          </div>
        </div>
      )}
      {isSettingsPopupOpen && (
        <SettingsPopup
          closePopup={closeSettingsPopup}
          currentSettings={settings} // Pass current settings
          applySettings={applySettings} // Pass function to apply new settings
          deleteAllNotes={deleteAllNotes}
        />
      )}
      {isExportPopupOpen && (
        <ExportPopup
          closePopup={closeExportPopup}
          allNotes={allNotes}
          allFolders={allFolders}
          onExport={onExport}
          noneSelectedError={noneSelectedError}
          preSelecteds={exportNoteThruCtx}
          onPreSelectReceived={onPreSelectReceived}
          currSet={currSet}
        />
      )}
      {isImportPopupOpen && (
        <ImportPopup
          closePopup={closeImportPopup}
          onImport={onImport}
          presetFile={presetFile}
          settings={settings}
        />
      )}
    </div>
  );
};

export default MenuBar;
