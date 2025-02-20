import React from "react";

const SettingsPopup = ({ closePopup }) => {
  return (
    <div className="settings-popup-overlay">
      <div className="settings-popup">

        <div className="settings-main">
            <div className="settings-list">
                <h2>Settings</h2>
            </div>
            <div className="settings-content">

            </div>
        </div>
        <div className="settings-bottom-bar">
            <button className="settings-close-btn" onClick={closePopup}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
