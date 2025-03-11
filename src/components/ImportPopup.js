import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-regular-svg-icons";

const ImportPopup = ({ closePopup, onImport, presetFile, settings }) => {
  const [importedFile, setImportedFile] = useState(null);
  const [fileValid, setFileValid] = useState(false);
  const [fileInvalid, setFileInvalid] = useState(false);
  const [versionNotSupported, setVersionNotSupported] = useState(false)
  const [version, setVersion] = useState("")
  const fileInputRef = React.useRef(null);
  const [fileName, setFileName] = useState(null);
  const [invalidSubnotes, setInvalidSubnotes] = useState(0);

  // Check if imported file was made in a supported version
  const versionCheck = async (noteVersion) => {
    if(noteVersion === "1.0.0" || noteVersion === "1.1.0") {
      return false
    } else {
      return true
    }
  }

  // Import validity checks
  const checkImportValid = async (json) => {
    setImportedFile(null);
    setFileValid(false);
    setFileInvalid(false);
    setVersionNotSupported(false);
    setVersion("");
    if(!settings.userSettings.disableImportChecks) {
      const authorRegex = /^[a-zA-Z0-9\-_ ]*$/;
      if(json.noteID) {
        if(!await versionCheck(json.sharpnoteVersion)) {
          setVersionNotSupported(true);
          setVersion(json.sharpnoteVersion);
          return {newJSON: json, valid: false};
        }
        // Checks for a .sharp
        if(json.hasOwnProperty('sharpnoteVersion') && 
           json.hasOwnProperty('noteTitle') && 
           json.hasOwnProperty('noteContent') && 
           json.hasOwnProperty('noteColor') && 
           json.hasOwnProperty('noteOriginalAuthor') && 
           (json.noteOriginalAuthor === null || json.noteOriginalAuthor === "" || json.noteOriginalAuthor?.length <= 32) &&
           (json.noteLastAuthor === null || json.noteLastAuthor === "" || json.noteLastAuthor?.length <= 32) &&
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
            }
            return {newJSON: newjson, valid: true}
        } else {
          return {newJSON: json, valid: false}
        }
      } else if(json.sharpbookID) {
        if(!await versionCheck(json.sharpnoteVersion)) {
          setVersionNotSupported(true);
          setVersion(json.sharpnoteVersion);
          return {newJSON: json, valid: false};
        }
        // Checks for a .sharpbook
        if(json.hasOwnProperty('notes') && 
           json.hasOwnProperty('sharpnoteVersion') && 
           json.notes.length > 0 &&
           json.hasOwnProperty('bookAuthor') &&
           (json.bookAuthor === null || json.bookAuthor === "" || json.bookAuthor?.length <= 32) &&
           authorRegex.test(json.bookAuthor)
        ) {
          const newjson = {...json, notes: [...json.notes]}; // Ensure deep copy
          if (json.bookAuthor === "" || json.bookAuthor === null) {
            newjson.bookAuthor = "";
          }

          let invalidSubnotesCount = 0;
          let invalidNotes = [];
          newjson.notes = json.notes.filter(async note => {
            const isValid = (
              note.hasOwnProperty('noteID') &&
              note.hasOwnProperty('sharpnoteVersion') &&
              note.hasOwnProperty('noteTitle') &&
              note.hasOwnProperty('noteContent') &&
              note.hasOwnProperty('noteColor') &&
              note.hasOwnProperty('noteOriginalAuthor') &&
              (note.noteOriginalAuthor === null || note.noteOriginalAuthor === "" || note.noteOriginalAuthor?.length <= 32) &&
              (note.noteLastAuthor === null || note.noteLastAuthor === "" || note.noteLastAuthor?.length <= 32) &&
              note.noteHistory.created &&
              authorRegex.test(note.noteOriginalAuthor) &&
              await versionCheck(note.sharpnoteVersion)
            );
          
            if (!isValid) {
              invalidNotes.push(note)
              invalidSubnotesCount++;
            }
          
            return isValid; // Keep only valid notes
          });

          setInvalidSubnotes(invalidSubnotesCount);

          return { newJSON: newjson, invalidNotes, valid: true };

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
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const validCheck = await checkImportValid(json);
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

  // If the user opened a .sharp or .sharpbook file
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

  // Open file selection window on button click
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Import the data on popup submission
  const doImport = () => {
    onImport(importedFile)
    closePopup();
  }

  // If preset file (user opened .sharp or .sharpbook file directly)
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
          {importedFile && fileValid && !versionNotSupported && (
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
          {versionNotSupported && (
            <div className="import-file-info">
              <span className="import-invalid-file-text"><FontAwesomeIcon icon={faCircleXmark} /> SharpNote version not supported</span><br></br>
              <span className="import-invalid-version-text">The selected file was created in SharpNote version {version}, which isn't supported by your installed version (1.2.0)</span>
            </div>
          )}
          {fileInvalid && !versionNotSupported && (
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
