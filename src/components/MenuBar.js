import React, { useState, useEffect } from "react";
import SettingsPopup from "./SettingsPopup";

const MenuBar = ({onSettingsChange}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [settings, setSettings] = useState({
    userSettings: { autoSave: true }, // Default settings
  });

  useEffect(() => {
    // Load settings from Electron (preload.js)
    window.electron.ipcRenderer.invoke("get-settings").then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    });
  }, []);

  const applySettings = (newSettings) => {
    setSettings(newSettings); // Update state
    onSettingsChange(newSettings); // Mark as "unsaved changes"
  };

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const openSettingsPopup = () => setIsSettingsPopupOpen(true);
  const closeSettingsPopup = () => setIsSettingsPopupOpen(false);

  return (
    <div className="menu-bar">
      <button onClick={toggleDropdown}>File</button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button onClick={openSettingsPopup}>Settings</button>
        </div>
      )}
      {isSettingsPopupOpen && (
        <SettingsPopup
          closePopup={closeSettingsPopup}
          currentSettings={settings}  // Pass current settings
          applySettings={applySettings} // Pass function to apply new settings
        />
      )}
    </div>
  );
};

export default MenuBar;
