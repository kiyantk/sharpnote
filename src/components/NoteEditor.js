import React, { useEffect, useState } from "react";

const NoteEditor = ({ selectedNote, onUpdateNote, settings, onAutoSaveStatusChange, onActiveEditorContentUpdate }) => {
  const [content, setContent] = useState(selectedNote?.noteContent || "");
  const [lastSaved, setLastSaved] = useState(selectedNote?.lastSaved || "");

  let selectedNoteDeepCopy = { ...selectedNote }

  // Effect for auto-saving the note
  useEffect(() => {
    let autoSaveInterval;

    // Check if autoSave is enabled
    if (settings?.userSettings.autoSave) {
      // Start the auto-save timer (every minute)
      autoSaveInterval = setInterval(() => {
        if(selectedNote && (selectedNote.noteContent !== "" || content !== "")) {
          // If a note is open
          if (content !== new TextDecoder().decode(Uint8Array.from(atob(selectedNote.noteContent), c => c.charCodeAt(0)))) {
            // If the editor content is not the same as the latest stored noteContent, trigger update
            const encodedContent = btoa(String.fromCharCode(...new TextEncoder().encode(content)))
            const updatedNote = { ...selectedNote, noteContent: encodedContent, lastSaved: new Date().toISOString() };
            onUpdateNote(updatedNote); // Update note in DB and state
            setLastSaved(updatedNote.lastSaved); // Update the last saved time
            onAutoSaveStatusChange(2); // Set status to "Up to date"
          } else {
            // Nothing needs to happen if content is the same.
            onAutoSaveStatusChange(2); // Set status to "Up to date"
          }
        }
      }, 60000); // 60000 ms = 1 minute

      // Clean up the interval when the component unmounts
      return () => clearInterval(autoSaveInterval);
    }

    // Clean up if autoSave is turned off
    onAutoSaveStatusChange(1); // Set status to "auto-save off"

    return () => clearInterval(autoSaveInterval);
  }, [content, selectedNote]);

  // Update content state whenever selectedNote changes
  useEffect(() => {
    if(selectedNote) {
      setContent(selectedNote.noteContent ? new TextDecoder().decode(Uint8Array.from(atob(selectedNote.noteContent), c => c.charCodeAt(0))) : "");
    }
    // setContent(selectedNote?.noteContent || ""); // Update content whenever selectedNote changes
  }, [selectedNote]);

  // Handle manual content update
  const handleUpdate = (field, value) => {
    setContent(value); // Update content state
    selectedNoteDeepCopy.noteContent = value
    if(settings?.userSettings.autoSave) {
      onAutoSaveStatusChange(3); // Mark as "unsaved changes"
    }
    onActiveEditorContentUpdate(value)
  };
    
  // If no note is selected, show start screen
  if (!selectedNote) {
    return (
        <div className="editor editor-empty">
            <img className="editor-icon" src={process.env.PUBLIC_URL + "/logo-v1-light-darkgraytransparant-sharp.png"} alt="Logo" />
            <p className="editor-empty-title">Welcome to SharpNote</p>
            <p className="editor-empty-text">Click on 'New Note' on the left panel to create a new note.</p>
        </div>
    );
  } 

  return (
    <div className="editor">
      <textarea
        value={content}
        onInput={(e) => handleUpdate("noteContent", e.target.value)}
      />
    </div>
  );
};

export default NoteEditor;
