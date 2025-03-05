import React, { useState } from "react";

const EditPopup = ({ closeEditPopup, noteToEdit, applyEdits, editPopupType }) => {
  const [editedNoteToSave, setEditedNoteToSave] = useState({...noteToEdit});
  const [editedNoteToDisplay, setEditedNoteToDisplay] = useState({...noteToEdit});

  // Save new note data
  const saveSettings = async () => {
    try {
      applyEdits(editedNoteToSave)
      if(editPopupType === "note") {
        if(editedNoteToSave.noteTitle.length <= 100) {
          closeEditPopup(); // Close the popup after saving
        }
      } else if(editPopupType === "folder") {
        if(editedNoteToSave.folderTitle.length <= 100) {
          closeEditPopup(); // Close the popup after saving
        }
      }
      
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Update stored edit version due to title change
  const handleTitleInputChange = (event) => {
    const newSetting = {...editedNoteToSave}
    if(editPopupType === "note") {
      newSetting.noteTitle = event.target.value
    } else if(editPopupType === "folder") {
      newSetting.folderTitle = event.target.value
    }
    setEditedNoteToSave(newSetting)
    setEditedNoteToDisplay(newSetting)
  }

  // Update stored edit version due to color change
  const handleColorInputChange = (event) => {
    const newSetting = {...editedNoteToSave}
    if(editPopupType === "note") {
      newSetting.noteColor = event.target.value
    } else if(editPopupType === "folder") {
      newSetting.folderColor = event.target.value
    }
    setEditedNoteToSave(newSetting)
    setEditedNoteToDisplay(newSetting)
  }

  return (
    <div className="settings-popup-overlay">
      <div className="editnote-popup">
      {editPopupType === "note" && (
        <div>
         <div>
             <h2>Edit Note</h2>
             {/* <span>Editing '{noteToEdit.noteTitle}'</span> */}
         </div>
         <div className="editnote-popup-content">
            <div className="editnote-popup-item">
                <span>Note Title</span>
                <input type="text" className="editnote-input editnote-titleinput" value={editedNoteToDisplay.noteTitle} maxLength={100} onChange={handleTitleInputChange}></input>
                <span className="welcome-popup-username-requirements">Up to 100 characters</span>
            </div>
            <div className="editnote-popup-item">
                <span>Note Color</span>
                <div className="noteColor-editcontainer">
                    <div style={{ backgroundColor: editedNoteToDisplay.noteColor, width: "30px", height: "30px", borderRadius: "4px", border: "1px solid #ccc" }}></div>
                    <input type="color" className="editnote-input" value={editedNoteToDisplay.noteColor} onInput={handleColorInputChange}></input>
                </div>
            </div>
        </div>
        </div>
      )}
      {editPopupType === "folder" && (
        <div>
        <div>
            <h2>Edit Folder</h2>
            {/* <span>Editing '{noteToEdit.noteTitle}'</span> */}
        </div>
        <div className="editnote-popup-content">
           <div className="editnote-popup-item">
               <span>Folder Title</span>
               <input type="text" className="editnote-input editnote-titleinput" value={editedNoteToDisplay.folderTitle} maxLength={100} onChange={handleTitleInputChange}></input>
               <span className="welcome-popup-username-requirements">Up to 100 characters</span>
           </div>
           <div className="editnote-popup-item">
               <span>Folder Color</span>
               <div className="noteColor-editcontainer">
                   <div style={{ backgroundColor: editedNoteToDisplay.folderColor, width: "30px", height: "30px", borderRadius: "4px", border: "1px solid #ccc" }}></div>
                   <input type="color" className="editnote-input" value={editedNoteToDisplay.folderColor} onInput={handleColorInputChange}></input>
               </div>
           </div>
       </div>
       </div>
      )}
      <div className="settings-bottom-bar">
        <button className="settings-close-btn" onClick={closeEditPopup}>
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

export default EditPopup;
