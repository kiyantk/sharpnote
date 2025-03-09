import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faBook, faDatabase, faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { jsPDF } from "jspdf"; // Only if using modules
import { Document, Packer, Paragraph, TextRun } from "docx";

const ExportPopup = ({ closePopup, allNotes, settings, onExport, noneSelectedError, preSelecteds, onPreSelectReceived }) => {
  const [exportType, setExportType] = useState("single");
  const [selectedNotes, setSelectedNotes] = useState(null);
  const [filename, setFilename] = useState("");
  const [exportFormat, setExportFormat] = useState("");
  const allNotesCopy = [...allNotes]
  const [preSelectedsIsMultiple, setPreSelectedsIsMultiple] = useState(false);

  // Random ID generator for noteID's
  const generateRandomID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  // Do the exporting
  const handleExport = async () => {
    const currentTime = new Date().toISOString();
  
    const formatNoteForExport = (note) => ({
      ...note,
      noteFolder: null,
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
        onExport(selectedNotes?.length, isSharpbook, false); // Trigger after focus comes back
        window.removeEventListener('focus', handleFocus);
      }
    };
  
    if (exportType === "single" && selectedNotes?.length === 1) {
      // If user is exporting a single note
      const note = formatNoteForExport(selectedNotes[0]);
      if(exportFormat === "single-sharp") {
        // Export as .sharp
        const fileContent = JSON.stringify(note, null, 2);
        const blob = new Blob([fileContent], { type: "application/json" });
        saveAs(blob, `${filename || note.noteTitle}.sharp`);
      } else if(exportFormat === "single-txt") {
        // Export as Plaintext
        const decodedContent = atob(note.noteContent); // Decode base64 content
        const blob = new Blob([decodedContent], { type: "text/plain" });
        saveAs(blob, `${filename || note.noteTitle}.txt`);
      } else if(exportFormat === "single-pdf") {
        // Export as PDF
        const decodedContent = atob(note.noteContent);

        const doc = new jsPDF();
        doc.setFont("helvetica", "normal");
        doc.text(decodedContent, 10, 10, { maxWidth: 180 }); // Wrap text
      
        doc.save(`${filename || note.noteTitle}.pdf`);
      } else if(exportFormat === "single-html") {
        // Export as HTML
        const decodedContent = atob(note.noteContent);

        const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>${note.noteTitle}</title>
      </head>
      <body>
          <pre>${decodedContent}</pre>
      </body>
      </html>`;
      
        const blob = new Blob([htmlContent], { type: "text/html" });
        saveAs(blob, `${filename || note.noteTitle}.html`);
      } else if(exportFormat === "single-docx") {
        // Export as Word Document
        const decodedContent = atob(note.noteContent);
        const lines = decodedContent.split('\n'); // Split by newline to separate into lines
        
        // Create a document with multiple paragraphs (one per line)
        const doc = new Document({
          sections: [
            {
              children: lines.map(line => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line,
                      font: 'Aptos',  // Set font to Aptos (Body)
                      size: 24,       // Optional: Adjust font size if necessary
                    })
                  ]
                })
              ),
            },
          ],
          title: note.noteTitle || "Untitled",  // Optional: Set title
          subject: "SharpNote Export",
          creator: note.noteOriginalAuthor,     // Set original author
          lastModifiedBy: note.noteLastAuthor,  // Set last modified by
        });
        
        Packer.toBlob(doc).then((blob) => {
          saveAs(blob, `${filename || note.noteTitle}.docx`);
        });        
      }
      // implement exporting various formats here

      window.addEventListener('focus', handleFocus(false));
    } else if ((exportType === "all" || exportType === "selection") && selectedNotes?.length > 0) {
      // If the user is exporting multiple notes
      if (exportFormat === "pack") {
        // Export as a single .sharpbook file
        const bookContent = {
          sharpbookID: generateRandomID(),
          sharpnoteVersion: "1.2.0",
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
            if(exportNum - 1 === selectedNotes?.length) {
              isSaving = false;
              onExport(selectedNotes?.length, false, false); // Trigger after focus comes back
            }
          }
        } catch (error) {
          console.error("Folder selection failed:", error);
        }
      }      
    } else if (exportType === "database") {
      // If user is exporting the database
      try {
        const response = await window.electron.ipcRenderer.invoke("export-database", filename || "sharpnote.db");
  
        if (response.success) {
          onExport(selectedNotes?.length, false, true);
        } else {
          console.error(`Failed to export database: ${response.error}`);
        }
      } catch (error) {
        console.error("Export error:", error);
        console.error("An unexpected error occurred.");
      }
      return;
    } else if(selectedNotes?.length === 0) {
      noneSelectedError();
    }
  };

  // Update the filename and export format if user chooses new single note
  useEffect(() => {
    if(exportType === "single" && selectedNotes && selectedNotes.length === 1) {
      setFilename(selectedNotes[0].noteTitle);
      setExportFormat("single-sharp");
    }
  }, [selectedNotes]);

  // Set notes to be selected from pre-selected
  useEffect(() => {
    if(preSelecteds) {
      if(preSelecteds.length > 1) {
        setExportType("selection")
        setPreSelectedsIsMultiple(true)
      }
      setSelectedNotes(preSelecteds)
    }
  }, [preSelecteds]);

  // Update filename and format on exportType change
  useEffect(() => {
    if(exportType === "all") {
      setFilename("Sharpbook");
      setSelectedNotes(allNotesCopy);
      setExportFormat("pack");
    } else if(exportType === "selection") {
      setFilename("Sharpbook");
      if(!preSelectedsIsMultiple) {
        setSelectedNotes([]);
      } 
      setExportFormat("pack");
    } else if(exportType === "database") {
      setFilename("sharpnote");
    } else {
      setFilename("");
      if(preSelecteds) {
        setSelectedNotes(preSelecteds)
        onPreSelectReceived()
      } else {
        setSelectedNotes([]);
      }
      setExportFormat("single-sharp");
    }
  }, [exportType]);

  // Get filetype based on exportType and exportFormat
  const getFileType = () => {
    if(exportType) {
      switch(exportType) {
        case "single":
          switch(exportFormat) {
            case "single-sharp":
              return ".sharp";
            case "single-txt":
              return ".txt";
            case "single-pdf":
              return ".pdf";
            case "single-docx":
              return ".docx"; 
            case "single-html":
              return ".html";            
          }
          return
        case "all":
          return ".sharpbook";
        case "selection":
          return ".sharpbook";
        case "database":
          return ".db";     
      }
    }
  }

  // Icon to use next to exportType selection field
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
              className={`note-browser-item hide-vertical-overflow-text ${selectedNotes?.includes(note) ? "note-browser-selected" : ""}`}
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
              <FontAwesomeIcon style={{ marginRight: '15px' }} icon={selectedNotes?.includes(note) ? faCircleCheck : faCircle} />
              <FontAwesomeIcon style={{ color: note.noteColor, marginRight: '5px' }} icon={faStickyNote} />
              {note.noteTitle}
            </div>
          ))}
        </div>
        {(exportType === 'all' || exportType === 'selection' || exportType === 'single') && (
          <div className="export-popup-item">
              <span>Export Format</span>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="note-export-methodselect"
              >
                  {(exportType === 'single') && (<option value="single-sharp">SharpNote Note File (*.sharp)</option>)}
                  {(exportType === 'single') && (<option value="single-txt">TXT (*.txt)</option>)}
                  {(exportType === 'single') && (<option value="single-pdf">PDF (*.pdf)</option>)}
                  {(exportType === 'single') && (<option value="single-docx">Word Document (*.docx)</option>)}
                  {(exportType === 'single') && (<option value="single-html">Single File Web Page (*.html)</option>)}
                  {(exportType === 'all' || exportType === 'selection') && (<option value="pack">Pack into a single file (*.sharpbook)</option>)}
                  {(exportType === 'all' || exportType === 'selection') && (<option value="nopack">Seperate export (*.sharp's)</option>)}
              </select>
          </div>
        )}
        {exportFormat !== 'nopack' && (
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
