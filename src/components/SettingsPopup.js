import React, { useState, useEffect } from "react";

const SettingsPopup = ({ closePopup, currentSettings, applySettings }) => {
  const [selectedTab, setSelectedTab] = useState("Editor");
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
              {["Editor", "App"].map((tab) => (
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
            {selectedTab === "Editor" && (
              <div className="settings-content-item">
                  <input
                    type="checkbox"
                    checked={settings.userSettings.autoSave}
                    onChange={handleCheckboxChange}
                  />
                  <span>Autosave (every minute)</span>
              </div>
            )}
            {selectedTab === "App" && (
              <div className="settings-content-item">
                  <span>SharpNote Version: 1.0</span>
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
