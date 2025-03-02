import React, { useState, useEffect, useRef } from "react";
import SettingsPopup from "./SettingsPopup";
import ExportPopup from "./ExportPopup";
import ImportPopup from "./ImportPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowsLeftRightToLine, faBook, faClipboard, faCog, faCopy, faCut, faDownload, faFileImport, faRectangleXmark, faRedo, faTrash, faUndo } from "@fortawesome/free-solid-svg-icons";

const MenuBar = ({onSettingsChange, allNotes, onExport, onImport, noneSelectedError, toggleDeleteMode, toggleLeftPanel, exportNoteThruCtx, onPreSelectReceived, presetFile}) => {
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

  useEffect(() => {
    if(presetFile) setIsImportPopupOpen(true)
  }, [presetFile]);

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
        <div ref={menuRef} className={`dropdown-menu ${settings?.userSettings.showMenubarIcons ? "dropdown-menu-with-icons" : ""} `} style={{left: dropdownPosition}}>
          <button className="menubar-dropdown-divider" onClick={openSettingsPopup}><FontAwesomeIcon icon={faCog} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Settings</span></button>
          <button onClick={openExportPopup}><FontAwesomeIcon icon={faDownload} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Export</span></button>
          <button className="menubar-dropdown-divider" onClick={openImportPopup}><FontAwesomeIcon icon={faFileImport} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Import</span></button>
          <button onClick={closeSharpnote}><FontAwesomeIcon icon={faRectangleXmark} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Exit</span></button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "edit") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className={`dropdown-menu ${settings?.userSettings.showMenubarIcons ? "dropdown-menu-with-icons" : ""} `} style={{left: dropdownPosition}}>
          <button onClick={doUndo}><FontAwesomeIcon style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} icon={faUndo} /><span>Undo</span></button>
          <button className="menubar-dropdown-divider" onClick={doRedo}><FontAwesomeIcon style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} icon={faRedo} /><span>Redo</span></button>
          <button onClick={doCut}><FontAwesomeIcon icon={faCut} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} /><span>Cut</span></button>
          <button onClick={doCopy}><FontAwesomeIcon icon={faCopy} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} /><span>Copy</span></button>
          <button className="menubar-dropdown-divider" onClick={doPaste}><FontAwesomeIcon icon={faClipboard} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} /><span>Paste</span></button>
          <button onClick={toggleDelMode}><FontAwesomeIcon icon={faTrash} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}} /><span>Toggle Delete Mode</span></button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "view") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className={`dropdown-menu ${settings?.userSettings.showMenubarIcons ? "dropdown-menu-with-icons" : ""} `} style={{left: dropdownPosition}}>
          <button onClick={toggleLeftPanel}><FontAwesomeIcon icon={faArrowsLeftRightToLine} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Toggle Left Panel</span></button>
        </div>
        </div>
      )}
      {(isDropdownOpen && dropdownType === "help") && (
        <div className="menubar-dropdown-overlay">
        <div ref={menuRef} className={`dropdown-menu ${settings?.userSettings.showMenubarIcons ? "dropdown-menu-with-icons" : ""} `} style={{left: dropdownPosition}}>
          <button onClick={goToDocs}><FontAwesomeIcon icon={faBook} style={{display: settings?.userSettings.showMenubarIcons ? "initial" : "none"}}/><span>Documentation</span></button>
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
          presetFile={presetFile}
          settings={settings}
        />
      )}
    </div>
  );
};

export default MenuBar;
