import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDisplay,
  faHardDrive,
  faKeyboard,
  faPencil,
  faToolbox,
  faTriangleExclamation,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

const SettingsPopup = ({
  closePopup,
  currentSettings,
  applySettings,
  deleteAllNotes,
}) => {
  const [selectedTab, setSelectedTab] = useState("User");
  const [settings, setSettings] = useState(currentSettings);

  const [storageUsage, setStorageUsage] = useState({
    app: 0,
    notes: 0,
    total: 1,
  });

  // Get storage used in bytes
  const getUsageData = async () => {
    await window.electron.ipcRenderer
      .invoke("get-storage-usage")
      .then((data) => {
        if (data) {
          setStorageUsage({
            app: data.appStorageUsed,
            notes: data.dbSize,
          });
        }
      });
  };

  useEffect(() => {
    // Load settings when component mounts
    window.electron.ipcRenderer
      .invoke("get-settings")
      .then((loadedSettings) => {
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

  // Set local settings (menu bar icons updated)
  const handleCheckboxChangeShowMenubarIcons = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showMenubarIcons: event.target.checked,
      },
    }));
  };

  // Set local settings (note item style updated)
  const handleNoteItemStyleChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        noteItemStyle: event.target.value,
      },
    }));
  };

  // Set local settings (folder delete behaviour updated)
  const handleFolderDeleteBehaviourChange = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        folderDeleteBehaviour: event.target.value,
      },
    }));
  };

  // Set local settings (unsaved changes warning updated)
  const handleCheckboxChangeUnsavedChangesWarning = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showUnsavedChangesWarning: event.target.checked,
      },
    }));
  };

  // Set local settings (disable import checks updated)
  const handleCheckboxChangeDisableImportChecks = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        disableImportChecks: event.target.checked,
      },
    }));
  };

  // Set local settings (show text stats updated)
  const handleCheckboxChangeShowTextStatistics = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showTextStatistics: event.target.checked,
      },
    }));
  };

  // Set local settings (show note counter updated)
  const handleCheckboxChangeShowNoteCounter = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        showNoteCounter: event.target.checked,
      },
    }));
  };

  // Set local settings (dnd disabled updated)
  const handleCheckboxChangeDnD = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        disableDnD: event.target.checked,
      },
    }));
  };

  // Set local settings (dnd disabled updated)
  const handleCheckboxChangeSpellCheck = (event) => {
    setSettings((prev) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        spellCheck: event.target.checked,
      },
    }));
  };

  const handleUsernameChange = (event) => {
    const newValue = event.target.value;

    // Allow empty input (so the user can delete everything)
    if (newValue === "") {
      setSettings((prev) => ({
        ...prev,
        username: "",
      }));
      return;
    }

    // Validation checks
    if (
      newValue.length > 32 ||
      /\s{2,}/.test(newValue) ||
      !/^[a-zA-Z0-9 _-]+$/.test(newValue) ||
      /^\s|\s$/.test(newValue)
    ) {
      return;
    }

    // Update state if the input is valid
    setSettings((prev) => ({
      ...prev,
      username: newValue,
    }));
  };

  // Save settings
  const saveSettings = async () => {
    applySettings(settings); // Apply local changes
    try {
      const response = await window.electron.ipcRenderer.invoke(
        "save-settings",
        settings
      );
      if (!response.success) {
        console.error("Failed to save settings:", response.error);
      }
      closePopup(); // Close the popup after saving
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Define tab icons
  const tabIcons = {
    User: faUser,
    Display: faDisplay,
    Editor: faPencil,
    Storage: faHardDrive,
    Shortcuts: faKeyboard,
    App: faToolbox,
  };

  // Open app location in File Explorer
  const openAppLocation = () => {
    window.electron.ipcRenderer.invoke("open-sharpnote-location");
  };

  // Convert bytes to human-readable
  function formatBytes(a, b = 2) {
    if (!+a) return "0 Bytes";
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${
      ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"][d]
    }`;
  }

  return (
    <div className="settings-popup-overlay">
      <div className="settings-popup">
        <div className="settings-main">
          <div className="settings-list">
            <h2>Settings</h2>
            <ul>
              {["User", "Display", "Editor", "Storage", "Shortcuts", "App"].map(
                (tab) => (
                  <li
                    key={tab}
                    className={`settings-list-item ${
                      selectedTab === tab ? "settings-list-active" : ""
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    <FontAwesomeIcon icon={tabIcons[tab]} />
                    <span>{tab}</span>
                  </li>
                )
              )}
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
                <div className="settings-content-item">
                  <input
                    type="checkbox"
                    checked={settings?.userSettings.spellCheck}
                    onChange={handleCheckboxChangeSpellCheck}
                  />
                  <span>Spell Check</span>
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
                <div className="settings-content-item">
                  <input
                    type="checkbox"
                    checked={settings?.userSettings.showNoteCounter}
                    onChange={handleCheckboxChangeShowNoteCounter}
                  />
                  <span>Show note counter</span>
                </div>
                <div className="settings-content-item">
                  <input
                    type="checkbox"
                    checked={settings?.userSettings.disableDnD}
                    onChange={handleCheckboxChangeDnD}
                  />
                  <span>Disable Drag-and-drop ordering</span>
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
                  <span className="settings-popup-warning-text">
                    You should only enable this if validity checks fail on
                    imports that should work.
                    <br></br>The checks are executed to ensure the integrity of
                    your imports. Enable at your own risk.
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
                <div className="settings-content-item">
                  <span>Storage Usage:</span>
                  <button
                    className="settings-normal-button"
                    onClick={() => getUsageData()}
                  >
                    Fetch Usage
                  </button>
                  <div className="storage-bar-container">
                    <div className="storage-legend">
                      <span className="storage-legend-text">
                        <div className="storage-legend-app"></div>App Storage:{" "}
                        {storageUsage.app > 0
                          ? formatBytes(storageUsage.app)
                          : "?"}
                      </span>
                      <span className="storage-legend-text">
                        <div className="storage-legend-notes"></div>Notes
                        Storage{" "}
                        {storageUsage.notes > 0
                          ? formatBytes(storageUsage.notes)
                          : "?"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="settings-content-item">
                  <span>Storage Actions:</span>
                  <button
                    className="settings-normal-button"
                    onClick={deleteAllNotes}
                  >
                    <FontAwesomeIcon icon={faTriangleExclamation} /> Delete
                    Everything
                  </button>
                </div>
              </div>
            )}
            {selectedTab === "Shortcuts" && (
              <div>
                <div className="settings-content-item">
                  <span>
                    Save opened note:{" "}
                    <span className="settings-shortcut-key">CTRL</span> +{" "}
                    <span className="settings-shortcut-key">S</span>
                  </span>
                </div>
                <div className="settings-content-item">
                  <span>
                    Refresh: <span className="settings-shortcut-key">CTRL</span>{" "}
                    + <span className="settings-shortcut-key">R</span>
                  </span>
                </div>
                <div className="settings-content-item">
                  <span>
                    New Note:{" "}
                    <span className="settings-shortcut-key">CTRL</span> +{" "}
                    <span className="settings-shortcut-key">T</span>
                  </span>
                </div>
                <div className="settings-content-item">
                  <span>
                    Close Note:{" "}
                    <span className="settings-shortcut-key">CTRL</span> +{" "}
                    <span className="settings-shortcut-key">W</span>
                  </span>
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
                  <button
                    className="settings-normal-button"
                    onClick={openAppLocation}
                  >
                    Open in File Explorer
                  </button>
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
