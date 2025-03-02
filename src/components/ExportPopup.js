import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faBook, faDatabase, faStickyNote } from "@fortawesome/free-solid-svg-icons";

const ExportPopup = ({ closePopup, allNotes, settings, onExport, noneSelectedError, preSelectedSingle, onPreSelectReceived }) => {
  const [exportType, setExportType] = useState("single");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [filename, setFilename] = useState("");
  const [packIntoSingleFile, setPackIntoSingleFile] = useState("pack");
  const allNotesCopy = [...allNotes]

  // Random ID generator for noteID's
  const generateRandomID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  const handleExport = async () => {
    const currentTime = new Date().toISOString();
  
    const formatNoteForExport = (note) => ({
      ...note,
      noteHistory: {
        created: note.created,
        lastSaved: note.lastSaved,
        lastOpened: note.lastOpened,
        lastExported: currentTime,
        noteVersion: note.noteVersion,
      },
      created: undefined,
      lastSaved: undefined,
      lastOpened: undefined,
      lastExported: undefined,
      noteVersion: undefined,
    });

    let isSaving = true;
  
    const handleFocus = (isSharpbook) => {
      if (isSaving) {
        isSaving = false;
        onExport(selectedNotes.length, isSharpbook, false); // Trigger after focus comes back
        window.removeEventListener('focus', handleFocus);
      }
    };
  
    if (exportType === "single" && selectedNotes.length === 1) {
      const note = formatNoteForExport(selectedNotes[0]);
      const fileContent = JSON.stringify(note, null, 2);
      const blob = new Blob([fileContent], { type: "application/json" });
      saveAs(blob, `${filename || note.noteTitle}.sharp`);
      window.addEventListener('focus', handleFocus(false));
    } else if ((exportType === "all" || exportType === "selection") && selectedNotes.length > 0) {
      if (packIntoSingleFile === "pack") {
        // Export as a single .sharpbook file
        const bookContent = {
          sharpbookID: generateRandomID(),
          sharpnoteVersion: "1.0.0",
          bookExported: currentTime,
          bookAuthor: settings.username,
          bookType: exportType,
          notes: selectedNotes.map(formatNoteForExport),
        };
        const blob = new Blob([JSON.stringify(bookContent, null, 2)], { type: "application/json" });
        saveAs(blob, `${filename || "Sharpbook"}.sharpbook`);
        window.addEventListener('focus', handleFocus(true));
      } else {
        // Export as multiple .sharp files, selecting a folder
        try {
          const handle = await window.showDirectoryPicker(); // Request folder selection
          let exportNum = 1;
      
          for (const note of selectedNotes) {
            const formattedNote = formatNoteForExport(note);
            const fileName = `${formattedNote.noteTitle}_${exportNum}.sharp`;
            exportNum++;
      
            // Create a new file handle for each note
            const fileHandle = await handle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(formattedNote, null, 2));
            await writable.close();
            if(exportNum - 1 === selectedNotes.length) {
              isSaving = false;
              onExport(selectedNotes.length, false, false); // Trigger after focus comes back
            }
          }
        } catch (error) {
          console.error("Folder selection failed:", error);
        }
      }      
    } else if (exportType === "database") {
      try {
        const response = await window.electron.ipcRenderer.invoke("export-database", filename || "notes.db");
  
        if (response.success) {
          onExport(selectedNotes.length, false, true);
        } else {
          console.error(`Failed to export database: ${response.error}`);
        }
      } catch (error) {
        console.error("Export error:", error);
        console.error("An unexpected error occurred.");
      }
      return;
    } else if(selectedNotes.length === 0) {
      noneSelectedError();
    }
  };


  useEffect(() => {
    if(exportType === "single" && selectedNotes.length === 1) {
      setFilename(selectedNotes[0].noteTitle);
    }
  }, [selectedNotes]);

  useEffect(() => {
    if(preSelectedSingle) {
      setSelectedNotes([preSelectedSingle])
    }
    console.log(preSelectedSingle)
  }, [preSelectedSingle]);

  useEffect(() => {
    if(exportType === "all") {
      setFilename("Sharpbook");
      setSelectedNotes(allNotesCopy);
    } else if(exportType === "selection") {
      setFilename("Sharpbook");
      setSelectedNotes([]);
    } else if(exportType === "database") {
      setFilename("notes");
    } else {
      setFilename("");
      if(preSelectedSingle) {
        setSelectedNotes([preSelectedSingle])
        onPreSelectReceived()
      } else {
        setSelectedNotes([]);
      }

    }
  }, [exportType]);

  const getFileType = () => {
    if(exportType) {
      switch(exportType) {
        case "single":
          return ".sharp";
        case "all":
          return ".sharpbook";
        case "selection":
          return ".sharpbook";
        case "database":
          return ".db";     
      }
    }
  }

  const getExportTypeIcon = () => {
    if(exportType) {
      switch(exportType) {
        case "single":
          return faStickyNote;
        case "all":
          return faBook;
        case "selection":
          return faBook;
        case "database":
          return faDatabase;  
      }
    }
  }

  return (
    <div className="settings-popup-overlay">
      <div className="noteinfo-popup">
        <h2>Export</h2>
        <div className="note-export-popup-content">
        <div className="export-popup-item">
          <span>Export Type</span>
          <div className="export-popup-type-container">
            <FontAwesomeIcon icon={getExportTypeIcon()} />
            <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="note-export-typeselect"
              >
                <option value="single">Single Note</option>
                <option value="all">All Notes</option>
                <option value="selection">Selection of Notes</option>
                <option value="database">Notes Database</option>
            </select>
          </div>
        </div>
        <div className="note-browser-small" style={{ display: (exportType === 'single' || exportType === 'selection') ? 'block' : 'none' }}>
          {/* Note Browser (like VS Code file explorer) */}
          {allNotesCopy.map((note) => (
            <div
              key={note.noteID}
              className={`note-browser-item hide-vertical-overflow-text ${selectedNotes.includes(note) ? "note-browser-selected" : ""}`}
              onClick={() =>
                exportType === "single"
                  ? setSelectedNotes([note])
                  : setSelectedNotes((prev) =>
                      prev.includes(note)
                        ? prev.filter((n) => n !== note)
                        : [...prev, note]
                    )
              }
            >
              <FontAwesomeIcon style={{ marginRight: '15px' }} icon={selectedNotes.includes(note) ? faCircleCheck : faCircle} />
              <FontAwesomeIcon style={{ color: note.noteColor, marginRight: '5px' }} icon={faStickyNote} />
              {note.noteTitle}
            </div>
          ))}
        </div>
        {(exportType === 'all' || exportType === 'selection') && (
          <div className="export-popup-item">
              <span>Export Method</span>
              <select
                value={packIntoSingleFile}
                onChange={(e) => setPackIntoSingleFile(e.target.value)}
                className="note-export-methodselect"
              >
                  <option value="pack">Pack into a single file (.sharpbook)</option>
                  <option value="nopack">Seperate export (.sharp's)</option>
              </select>
          </div>
        )}
        {packIntoSingleFile === 'pack' && (
          <div className="export-popup-item">
            <span>Filename</span>
            <div>
              <input
                type="text"
                placeholder="Filename"
                className="exportnote-nameinput"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
              <span className="note-export-filetype">{getFileType()}</span>
            </div>
          </div>
        )}
        <div className="settings-bottom-bar">
          <button className="settings-close-btn" onClick={closePopup}>
            Close
          </button>
          <button className="settings-save-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ExportPopup;
