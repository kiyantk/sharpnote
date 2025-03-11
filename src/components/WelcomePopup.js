import React, { useState } from "react";

const WelcomePopup = ({ submitWelcomePopup }) => {
  const [welcomePopupContent, setWelcomePopupContent] = useState({username: null});

  // Submit welcome form
  const saveSettings = async () => {
    try {
      submitWelcomePopup(welcomePopupContent)
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Update stored edit version due to username change
  const handleUsernameInputChange = (event) => {
    const newSetting = {...welcomePopupContent}
    newSetting.username = event.target.value
    setWelcomePopupContent(newSetting)
  }

  return (
    <div className="settings-popup-overlay">
      <div className="editnote-popup">
        <div className="welcome-popup-top">
            <h2>Welcome to SharpNote</h2>
            <span>A better way to take notes</span>
        </div>
        <div className="welcome-popup-content">
            <div className="editnote-popup-item">
                <span>Username</span>
                <div className="welcome-popup-username-container">
                  <input type="text" className="editnote-input editnote-titleinput" maxLength={32} onChange={handleUsernameInputChange}></input>
                  <span className="welcome-popup-username-requirements">Optional<br></br>a-Z, 0-9, -, _ and spaces. Up to 32 characters</span>
                </div>
                <span className="welcome-popup-username-explaining">This information is optional and will only be stored on your device.<br></br>It will be used as the note Author in your notes to log the creator.</span>
            </div>
        </div>
        <div className="settings-bottom-bar">
          <button className="settings-save-btn" onClick={saveSettings}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
