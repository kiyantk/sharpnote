import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDisplay, faHardDrive, faKeyboard, faPencil, faToolbox, faUser } from '@fortawesome/free-solid-svg-icons';

const SettingsPopup = ({ closePopup, currentSettings, applySettings }) => {
  const [selectedTab, setSelectedTab] = useState("User");
  const [settings, setSettings] = useState(currentSettings);

  useEffect(() => {
    // Load settings when component mounts
    window.electron.ipcRenderer.invoke("get-settings").then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    });
  }, []);

  // Set local settings
  const handleCheckboxChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        autoSave: event.target.checked,
      },
    }));
  };

  // Set local settings
  const handleCheckboxChangeShowMenubarIcons = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showMenubarIcons: event.target.checked,
      },
    }));
  };

  const handleNoteItemStyleChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        noteItemStyle: event.target.value,
      },
    }));
  }

  const handleFolderDeleteBehaviourChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        folderDeleteBehaviour: event.target.value,
      },
    }));
  }

  const handleCheckboxChangeUnsavedChangesWarning = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showUnsavedChangesWarning: event.target.checked,
      },
    }));
  }

  const handleCheckboxChangeDisableImportChecks = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        disableImportChecks: event.target.checked,
      },
    }));
  }

  const handleCheckboxChangeShowTextStatistics = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showTextStatistics: event.target.checked,
      },
    }));
  }

  const handleUsernameChange = (event) => {
    const newValue = event.target.value;
  
    // Allow empty input (so the user can delete everything)
    if (newValue === "") {
      setSettings((prev) => ({
        ...prev,
        username: ""
      }));
      return;
    }
  
    // Validation checks
    if (newValue.length > 32 || /\s{2,}/.test(newValue) || !/^[a-zA-Z0-9 _-]+$/.test(newValue) || /^\s|\s$/.test(newValue)) {
      return;
    }
  
    // Update state if the input is valid
    setSettings((prev) => ({
      ...prev,
      username: newValue
    }));
  };  

  // Save settings
  const saveSettings = async () => {
    applySettings(settings); // Apply local changes
    try {
      const response = await window.electron.ipcRenderer.invoke("save-settings", settings);
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
      }
      closePopup(); // Close the popup after saving
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const tabIcons = {
    "User": faUser,
    "Display": faDisplay,
    "Editor": faPencil,
    "Storage": faHardDrive,
    "Shortcuts": faKeyboard,
    "App": faToolbox
  };
  
  const openAppLocation = () => {
    window.electron.ipcRenderer.invoke('open-sharpnote-location');
  }

  return (
    <div className="settings-popup-overlay">
      <div className="settings-popup">
        <div className="settings-main">
          <div className="settings-list">
            <h2>Settings</h2>
            <ul>
              {["User", "Display", "Editor", "Storage", "Shortcuts", "App"].map((tab) => (
                <li
                  key={tab}
                  className={`settings-list-item ${selectedTab === tab ? "settings-list-active" : ""}`}
                  onClick={() => setSelectedTab(tab)}
                >
                  <FontAwesomeIcon icon={tabIcons[tab]} />
                  <span>{tab}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="settings-content">
            {selectedTab === "User" && (
              <div>
                <div className="settings-content-item settings-content-item-noalign">
                    <span>Username:</span>
                    <input
                      className="settings-content-input"
                      type="text"
                      value={settings.username}
                      onChange={handleUsernameChange}
                    />
                </div>
              </div>
            )}
            {selectedTab === "Editor" && (
              <div>
                <div className="settings-content-item">
                    <input
                      type="checkbox"
                      checked={settings?.userSettings.autoSave}
                      onChange={handleCheckboxChange}
                    />
                    <span>Autosave (every minute)</span>
                </div>
                <div className="settings-content-item">
                    <input
                      type="checkbox"
                      checked={settings?.userSettings.showUnsavedChangesWarning}
                      onChange={handleCheckboxChangeUnsavedChangesWarning}
                    />
                    <span>Show unsaved changes warning</span>
                </div>
                <div className="settings-content-item">
                    <input
                      type="checkbox"
                      checked={settings?.userSettings.showTextStatistics}
                      onChange={handleCheckboxChangeShowTextStatistics}
                    />
                    <span>Show text statistics</span>
                </div>
              </div>
            )}
            {selectedTab === "Display" && (
              <div>
                <div className="settings-content-item">
                    <span>Note List item style:</span>
                    <select
                        value={settings?.userSettings.noteItemStyle}
                        onChange={(e) => handleNoteItemStyleChange(e)}
                        className="settings-itemstyle-select"
                      >
                        <option value="normal">Normal</option>
                        <option value="slim">Slim</option>
                        <option value="big">Big</option>
                        <option value="detailed">Detailed</option>
                    </select>
                </div>
                <div className="settings-content-item">
                    <input
                      type="checkbox"
                      checked={settings?.userSettings.showMenubarIcons}
                      onChange={handleCheckboxChangeShowMenubarIcons}
                    />
                    <span>Show icons in menubar</span>
                </div>
              </div>
            )}
            {selectedTab === "Storage" && (
              <div>
                <div className="settings-content-item">
                    <input
                      type="checkbox"
                      checked={settings?.userSettings.disableImportChecks}
                      onChange={handleCheckboxChangeDisableImportChecks}
                    />
                    <span>Disable Import Checks</span>
                    <span className="settings-popup-warning-text">You should only enable this if validity checks fail on imports that should work.
                      <br></br>The checks are executed to ensure the integrity of your imports. Enable at your own risk.
                    </span>
                </div>
                <div className="settings-content-item">
                    <span>Folder delete behaviour:</span>
                    <select
                        value={settings?.userSettings.folderDeleteBehaviour}
                        onChange={(e) => handleFolderDeleteBehaviourChange(e)}
                        className="settings-itemstyle-select"
                      >
                        <option value="deletenotes">Delete notes</option>
                        <option value="keepnotes">Keep notes</option>
                    </select>
                </div>
              </div>
            )}
            {selectedTab === "Shortcuts" && (
              <div>
                <div className="settings-content-item">
                    <span>Save opened note: <span className="settings-shortcut-key">CTRL</span> + <span className="settings-shortcut-key">S</span></span>
                </div>
                <div className="settings-content-item">
                  <span>Refresh: <span className="settings-shortcut-key">CTRL</span> + <span className="settings-shortcut-key">R</span></span>
                </div>
                <div className="settings-content-item">
                  <span>New Note: <span className="settings-shortcut-key">CTRL</span> + <span className="settings-shortcut-key">T</span></span>
                </div>
                <div className="settings-content-item">
                  <span>Close Note: <span className="settings-shortcut-key">CTRL</span> + <span className="settings-shortcut-key">W</span></span>
                </div>
              </div>
            )}
            {selectedTab === "App" && (
              <div>
                <div className="settings-content-item">
                    <span>SharpNote Version: 1.2.0 "Crimson"</span>
                </div>
                <div className="settings-content-item">
                    <span>App Location:</span>
                    <button className="settings-normal-button" onClick={openAppLocation}>Open in File Explorer</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-bottom-bar">
          <button className="settings-close-btn" onClick={closePopup}>
            Close
          </button>
          <button className="settings-save-btn" onClick={saveSettings}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
