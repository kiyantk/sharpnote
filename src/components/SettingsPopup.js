import React, { useState, useEffect } from "react";

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
  

  return (
    <div className="settings-popup-overlay">
      <div className="settings-popup">
        <div className="settings-main">
          <div className="settings-list">
            <h2>Settings</h2>
            <ul>
              {["User", "Editor", "Shortcuts", "App"].map((tab) => (
                <li
                  key={tab}
                  className={selectedTab === tab ? "settings-list-active" : ""}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab}
                </li>
              ))}
            </ul>
          </div>

          <div className="settings-content">
            {selectedTab === "User" && (
              <div>
                <div className="settings-content-item">
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
                      checked={settings.userSettings.autoSave}
                      onChange={handleCheckboxChange}
                    />
                    <span>Autosave (every minute)</span>
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
              </div>
            )}
            {selectedTab === "App" && (
              <div>
                <div className="settings-content-item">
                    <span>SharpNote Version: 1.0.0 "Azure"</span>
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
