import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-regular-svg-icons";

const ImportPopup = ({ closePopup, onImport, presetFile, settings }) => {
  const [importedFile, setImportedFile] = useState(null);
  const [fileValid, setFileValid] = useState(false);
  const [fileInvalid, setFileInvalid] = useState(false);
  const fileInputRef = React.useRef(null);
  const [fileName, setFileName] = useState(null);
  const [invalidSubnotes, setInvalidSubnotes] = useState(0);

  const checkImportValid = (json) => {
    if(!settings.userSettings.disableImportChecks) {
      const authorRegex = /^[a-zA-Z0-9\-_ ]*$/;
      if(json.noteID) {
        // Checks for a .sharp
        if(json.hasOwnProperty('sharpnoteVersion') && 
           json.hasOwnProperty('noteTitle') && 
           json.hasOwnProperty('noteContent') && 
           json.hasOwnProperty('noteColor') && 
           json.hasOwnProperty('noteOriginalAuthor') && 
           json.noteOriginalAuthor.length <= 32 &&
           json.noteLastAuthor.length <= 32 &&
           json.noteHistory.created &&
           authorRegex.test(json.noteOriginalAuthor)
          ) {
            const newjson = {...json}
            if(json.noteOriginalAuthor === "" || json.noteOriginalAuthor === null) {
              newjson.noteOriginalAuthor = ""
            } else if(json.noteTitle === "" || json.noteTitle === null) {
              newjson.noteTitle = ""
            } else if(json.noteContent === "" || json.noteContent === null) {
              newjson.noteContent = ""
            } else if(json.noteColor === "" || json.noteColor === null) {
              newjson.noteColor = ""
            } else {
              return {newJSON: json, valid: false}
            }
            return {newJSON: newjson, valid: true}
        } else {
          return {newJSON: json, valid: false}
        }
      } else if(json.sharpbookID) {
        // Checks for a .sharpbook
        if(json.hasOwnProperty('notes') && 
           json.hasOwnProperty('sharpnoteVersion') && 
           json.notes.length > 0 &&
           json.hasOwnProperty('bookAuthor') &&
           json.bookAuthor.length <= 32 &&
           authorRegex.test(json.bookAuthor)
        ) {
          const newjson = {...json, notes: [...json.notes]}; // Ensure deep copy
          if (json.bookAuthor === "" || json.bookAuthor === null) {
            newjson.bookAuthor = "";
          }

          let invalidSubnotesCount = 0;
          newjson.notes = json.notes.filter(note => {
            const isValid = (
              note.hasOwnProperty('noteID') &&
              note.hasOwnProperty('sharpnoteVersion') &&
              note.hasOwnProperty('noteTitle') &&
              note.hasOwnProperty('noteContent') &&
              note.hasOwnProperty('noteColor') &&
              note.hasOwnProperty('noteOriginalAuthor') &&
              note.noteOriginalAuthor.length <= 32 &&
              note.noteLastAuthor.length <= 32 &&
              note.noteHistory.created &&
              authorRegex.test(note.noteOriginalAuthor)
            );
          
            if (!isValid) {
              invalidSubnotesCount++;
            }
          
            return isValid; // Keep only valid notes
          });

          setInvalidSubnotes(invalidSubnotesCount);

          return { newJSON: newjson, valid: true };

        } else {
          return {newJSON: json, valid: false}
        }
      } else {
        // If it is neither or doesnt atleast have those fields, invalid
        return {newJSON: json, valid: false}
      }
    } else {
      return { newJSON: json, valid: true };
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name)
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const validCheck = checkImportValid(json);
        if(validCheck.valid === true) {
          if(validCheck.newJSON !== json) {
            setImportedFile(validCheck.newJSON);
          } else {
            setImportedFile(json);
          }
          setFileValid(true);
          setFileInvalid(false);
        } else {
          setFileValid(false);
          setFileInvalid(true);
        }
      } catch {
        setImportedFile(null);
        setFileValid(false);
        setFileInvalid(true);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelectByOpenFile = (file) => {
    if (!file || !file.content) return;
  
    setFileName(file.name);
  
    try {
      const json = JSON.parse(file.content);
      const validCheck = checkImportValid(json);
      if (validCheck.valid === true) {
        setImportedFile(validCheck.newJSON || json);
        setFileValid(true);
        setFileInvalid(false);
      } else {
        setFileValid(false);
        setFileInvalid(true);
      }
    } catch {
      setImportedFile(null);
      setFileValid(false);
      setFileInvalid(true);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const doImport = () => {
    onImport(importedFile)
    closePopup();
  }

  useEffect(() => {
    if (presetFile) {
      handleFileSelectByOpenFile(presetFile)
    }
  }, [presetFile]);

  return (
    <div className="settings-popup-overlay">
      <div className="noteinfo-popup">
        <h2>Import</h2>
        <div className="note-import-popup-content">
          <div className="note-import-fileselector">
            <button className="file-select-btn" onClick={triggerFileSelect}>
              Select File
            </button>
            {importedFile && (
                <div className="note-import-selectedfilename">
                  {fileName}
                </div>
            )}

            <input
              type="file"
              accept=".sharp,.sharpbook"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>
          {importedFile && fileValid && (
            <div className="import-file-info">
              <span className="import-valid-file-text"><FontAwesomeIcon icon={faCircleCheck} /> Valid SharpNote File</span>
              {importedFile.notes && (
                <div className="import-popup-item">
                    <span>Valid Notes</span>
                    <input type="text" disabled className="noteinfo-input editnote-titleinput" value={importedFile.notes.length}></input>
                </div>
              )}
              {importedFile.notes && invalidSubnotes > 0 && (
                <div className="import-popup-item">
                    <span>Invalid Notes</span>
                    <input type="text" disabled className="noteinfo-input editnote-titleinput" value={invalidSubnotes}></input>
                </div>
              )}
              {!importedFile.notes && (
                <div className="import-popup-item">
                    <span>Note Title</span>
                    <input type="text" disabled className="noteinfo-input editnote-titleinput" value={importedFile.noteTitle}></input>
                </div>
              )}
            </div>
          )}
          {fileInvalid && (
            <div className="import-file-info">
              <span className="import-invalid-file-text"><FontAwesomeIcon icon={faCircleXmark} /> Invalid SharpNote File</span>
            </div>
          )}
          <div className="settings-bottom-bar">
            <button className="settings-close-btn" onClick={closePopup}>
              Close
            </button>
            <button
              className="settings-save-btn"
              onClick={() => fileValid && doImport()}
              disabled={!fileValid}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPopup;
