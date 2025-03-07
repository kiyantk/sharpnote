import React from "react";

const DeleteAllPopup = ({ deleteAllAnswer }) => {
  return (
    <div className="settings-popup-overlay">
      <div className="unsavedchanges-popup">
        <div>
            <h2>Delete everything</h2>
        </div>
        <div className="noteinfo-popup-content">
          <div className="noteinfo-popup-content-container">
            <span>Are you sure you want to delete all your notes and folders?</span><br></br><br></br>
            <span>This action cannot be undone.</span>
          </div>
        </div>
        <div className="settings-bottom-bar">
          <button className="settings-close-btn" onClick={() => deleteAllAnswer("no")}>
            No
          </button>
          <button className="settings-save-btn" onClick={() => deleteAllAnswer("yes")}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAllPopup;
