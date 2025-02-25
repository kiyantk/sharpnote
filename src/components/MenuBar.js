import React, { useState, useEffect, useRef } from "react";
import SettingsPopup from "./SettingsPopup";
import ExportPopup from "./ExportPopup";
import ImportPopup from "./ImportPopup";

const MenuBar = ({onSettingsChange, allNotes, onExport, noneSelectedError}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);
  const [isImportPopupOpen, setIsImportPopupOpen] = useState(false);
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

  // Apply new settings from Settings popup
  const applySettings = (newSettings) => {
    setSettings(newSettings); // Update state
    onSettingsChange(newSettings);
  };

  // Toggle dropdown
  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

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

  return (
    <div className="menu-bar">
      <button onClick={toggleDropdown}>File</button>
      {isDropdownOpen && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className="dropdown-menu">
          <button onClick={openExportPopup}>Export</button>
          <button onClick={openImportPopup}>Import</button>
          <button onClick={openSettingsPopup}>Settings</button>
          <button onClick={closeSharpnote}>Exit</button>
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
        />
      )}
      {isImportPopupOpen && (
        <ImportPopup
          closePopup={closeImportPopup}
        />
      )}
    </div>
  );
};

export default MenuBar;
