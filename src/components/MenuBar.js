import React, { useState, useEffect, useRef } from "react";
import SettingsPopup from "./SettingsPopup";
import ExportPopup from "./ExportPopup";
import ImportPopup from "./ImportPopup";

const MenuBar = ({onSettingsChange, allNotes, onExport, onImport, noneSelectedError, toggleDeleteMode, toggleLeftPanel, exportNoteThruCtx, onPreSelectReceived}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(0);
  const [dropdownType, setDropdownType] = useState(null)
  const [settings, setSettings] = useState({
    userSettings: { autoSave: true }, // Default settings
  });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        toggleDropdown();  // Call the onClose function when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer.invoke("get-settings").then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    });
  }, []);

  useEffect(() => {
    if(exportNoteThruCtx) setIsExportPopupOpen(true)
  }, [exportNoteThruCtx]);

  // Apply new settings from Settings popup
  const applySettings = (newSettings) => {
    setSettings(newSettings); // Update state
    onSettingsChange(newSettings);
  };

  // Toggle dropdown
  const toggleDropdown = (event, type) => {
    setDropdownType(type)
    if(event !== undefined) { setDropdownPosition(event.target.offsetLeft) }
    
    setIsDropdownOpen((prev) => !prev);
  }

  // Open / Close Settings popup
  const openSettingsPopup = () => {
    setIsSettingsPopupOpen(true);
    toggleDropdown()
  }
  const closeSettingsPopup = () => setIsSettingsPopupOpen(false);

  // Open / Close Export popup
  const openExportPopup = () => {
    setIsExportPopupOpen(true);
    toggleDropdown()
  }
  const closeExportPopup = () => setIsExportPopupOpen(false);

  // Open / Close Import popup
  const openImportPopup = () => {
    setIsImportPopupOpen(true);
    toggleDropdown()
  }
  const closeImportPopup = () => setIsImportPopupOpen(false);

  const closeSharpnote = () => {
    window.close()
  }

  const goToDocs = () => {
    window.open("https://docs.kiy.li/sharpnote", "_blank")
  }

  const doUndo = () => {
    // 
  }

  const doRedo = () => {
    // 
  }

  const doCut = () => {
    // 
  }

  const doCopy = () => {
    // 
  }

  const doPaste = () => {
    // 
  }

  const toggleDelMode = () => {
    toggleDropdown();
    toggleDeleteMode();
  }

  return (
    <div className="menu-bar">
      <button onClick={(e) => toggleDropdown(e, "file")}>File</button>
      <button onClick={(e) => toggleDropdown(e, "edit")}>Edit</button>
      <button onClick={(e) => toggleDropdown(e, "view")}>View</button>
      <button onClick={(e) => toggleDropdown(e, "help")}>Help</button>
      {(isDropdownOpen && dropdownType === "file") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className="dropdown-menu" style={{left: dropdownPosition}}>
          <button className="menubar-dropdown-divider" onClick={openSettingsPopup}>Settings</button>
          <button onClick={openExportPopup}>Export</button>
          <button className="menubar-dropdown-divider" onClick={openImportPopup}>Import</button>
          <button onClick={closeSharpnote}>Exit</button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "edit") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className="dropdown-menu" style={{left: dropdownPosition}}>
          <button onClick={doUndo}>Undo</button>
          <button className="menubar-dropdown-divider" onClick={doRedo}>Redo</button>
          <button onClick={doCut}>Cut</button>
          <button onClick={doCopy}>Copy</button>
          <button className="menubar-dropdown-divider" onClick={doPaste}>Paste</button>
          <button onClick={toggleDelMode}>Toggle Delete Mode</button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "view") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className="dropdown-menu" style={{left: dropdownPosition}}>
          <button onClick={toggleLeftPanel}>Toggle Left Panel</button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "help") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className="dropdown-menu" style={{left: dropdownPosition}}>
          <button onClick={goToDocs}>Documentation</button>
        </div>
        </div>
      )}
      {isSettingsPopupOpen && (
        <SettingsPopup
          closePopup={closeSettingsPopup}
          currentSettings={settings}  // Pass current settings
          applySettings={applySettings} // Pass function to apply new settings
        />
      )}
      {isExportPopupOpen && (
        <ExportPopup
          closePopup={closeExportPopup}
          allNotes={allNotes}
          settings={settings}
          onExport={onExport}
          noneSelectedError={noneSelectedError}
          preSelectedSingle={exportNoteThruCtx}
          onPreSelectReceived={onPreSelectReceived}
        />
      )}
      {isImportPopupOpen && (
        <ImportPopup
          closePopup={closeImportPopup}
          onImport={onImport}
        />
      )}
    </div>
  );
};

export default MenuBar;
