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

  // Apply new settings from Settings popup
  const applySettings = (newSettings) => {
    setSettings(newSettings); // Update state
    onSettingsChange(newSettings);
  };

  // Toggle dropdown
  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // Open / Close settings popup
  const openSettingsPopup = () => {
    setIsSettingsPopupOpen(true);
    toggleDropdown()
  }
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
