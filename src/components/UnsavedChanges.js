import React from "react";

const UnsavedChanges = ({ onUnsavedChangesAnswer, unsavedChangesType }) => {
  const getUnsavedChangesText = () => {
    if (unsavedChangesType === "switch" || unsavedChangesType === "close") {
      return "close the current note?";
    } else if (unsavedChangesType === "refresh") {
      return "refresh?";
    } else if (unsavedChangesType === "exit") {
      return "exit SharpNote?";
    }
  };

  return (
    <div className="settings-popup-overlay">
      <div className="unsavedchanges-popup">
        <div>
          <h2>Unsaved Changes</h2>
        </div>
        <div className="noteinfo-popup-content">
          <div className="noteinfo-popup-content-container">
            <span>Are you sure you want to {getUnsavedChangesText()}</span>
            <br></br>
            <span>Unsaved changes will be lost.</span>
          </div>
        </div>
        <div className="settings-bottom-bar">
          <button
            className="settings-close-btn"
            onClick={() => onUnsavedChangesAnswer("no")}
          >
            No
          </button>
          <button
            className="settings-save-btn"
            onClick={() => onUnsavedChangesAnswer("yes")}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChanges;
