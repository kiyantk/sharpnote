import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import NoteItem from "./NoteItem";
import FolderItem from "./FolderItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolderPlus,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

const NoteList = ({
  notes,
  settings,
  onAddNote,
  onDeleteNote,
  onSelectNote,
  onEditNote,
  selectedNoteId,
  onNoteContextMenu,
  deleteModeOn,
  leftPanelVisible,
  onAddFolder,
  folders,
  onDeleteFolder,
  onClickFolder,
  onFolderContextMenu,
  openedFolders,
  toggleLeftPanel,
  onUpdateFullList,
  onUpdateFolderOrder,
  refreshedTime,
  everythingDeletedTime,
}) => {
  const [fullList, setFullList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [visibleList, setVisibleList] = useState(filteredList.slice(0, 200));
  const [visibleListStartIndex, setVisibleListStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemJustAdded, setNewItemJustAdded] = useState(false);
  const scrollContainerRef = useRef(null);

  // Update the visible list when fullList changes
  useEffect(() => {
    if (visibleList.length === 0 || newItemJustAdded)
      resetVisibleList(fullList);
    if (fullList.length === 0) return; // Ensure it doesn't run if fullList is empty

    const fullListStringIDs = fullList
      .filter((item) => !item.noteFolder) // Filter out items where noteFolder is filled
      .map((item) => item.noteID || item.folderID); // Map the remaining items to their noteID or folderID

    // Only update full list if it has changed (to prevent infinite loop)
    onUpdateFullList(fullListStringIDs);
    const full = fullList.filter(
      (item) =>
        item.sharpnoteType === "folder" ||
        !item.noteFolder ||
        item.noteFolder.length < 1
    );

    setFilteredList(full);
    // if (filteredList.length > 0 && visibleList.length <= 100) {
    //   setVisibleList(filteredList.slice(0, 100)); // Show first 100 items initially
    // } else if(visibleList.length > 100) {
    //   setVisibleList(full.slice(0, visibleList.length)); // Show first 100 items initially
    // }
  }, [fullList]);

  const onAddedNote = () => {
    onAddNote();
    setNewItemJustAdded(true);
  };

  const onAddedFolder = () => {
    onAddFolder();
    setNewItemJustAdded(true);
  };

  const resetVisibleList = (full) => {
    setVisibleList(full.slice(0, 200));
    setVisibleListStartIndex(0);
    scrollContainerRef.current.scrollTo(0, 0);
    setNewItemJustAdded(false);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || newItemJustAdded) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const containerHeight = container.clientHeight;

    const total = filteredList.length;
    const startIndex = visibleListStartIndex; // You'll need to track this in state
    const endIndex = startIndex + visibleList.length;

    const atTop = scrollTop < 50;
    const nearBottom = scrollTop + containerHeight + 50 >= scrollHeight;

    // Scroll up – load earlier items
    if (atTop && startIndex > 0) {
      setIsLoading(true);
      setTimeout(() => {
        const newStart = Math.max(startIndex - 100, 0);
        setVisibleList(filteredList.slice(newStart, newStart + 200));
        setVisibleListStartIndex(newStart);
        setIsLoading(false);
      }, 300);
      return;
    }

    // Scroll down – load later items
    if (nearBottom && endIndex < total) {
      setIsLoading(true);
      setTimeout(() => {
        const newStart = startIndex + 100;
        setVisibleList(filteredList.slice(newStart, newStart + 200));
        setVisibleListStartIndex(newStart);
        setIsLoading(false);
      }, 300);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isLoading, filteredList]);

  useEffect(() => {
    setNewItemJustAdded(true);
  }, [refreshedTime]);

  useEffect(() => {
    setFullList([]);
    setFilteredList([]);
    setVisibleList([]);
  }, [everythingDeletedTime]);

  useEffect(() => {
    // Ensure settings.structure and settings.structure.rootOrder exist
    if (!settings || !settings.structure) {
      // If settings.structure doesn't exist, sort by .created as a fallback
      const combinedList = [...folders, ...notes]; // Combine folders and notes first

      const sortedList = combinedList.sort((a, b) => {
        return new Date(a.created) - new Date(b.created); // Sort by .created date
      });

      setFullList(sortedList); // Update state with sorted list
      setFilteredList(
        sortedList.filter(
          (item) =>
            item.sharpnoteType === "folder" ||
            !item.noteFolder ||
            item.noteFolder.length < 1
        )
      );
      return; // Exit early if settings.structure doesn't exist
    }

    // Default to empty array if rootOrder doesn't exist
    const rootOrder = settings.structure.rootOrder || [];

    // Concatenate folders into notes first
    const combinedList = [...folders, ...notes];

    let sortedList;

    if (rootOrder.length > 0) {
      // Sort based on the IDs in rootOrder if rootOrder is not empty
      sortedList = combinedList.sort((a, b) => {
        const aId = a.noteID || a.folderID; // Get the ID for sorting
        const bId = b.noteID || b.folderID;

        // Find the index of these IDs in rootOrder
        const aIndex = rootOrder.indexOf(aId);
        const bIndex = rootOrder.indexOf(bId);

        // Return the result of comparing the indices (ascending order)
        return aIndex - bIndex;
      });
    } else {
      // If rootOrder is empty, fall back to sorting by .created
      sortedList = combinedList.sort((a, b) => {
        return new Date(a.created) - new Date(b.created); // Sort by .created date
      });
    }

    // Set the sorted list into the state
    setFullList(sortedList);
    setFilteredList(
      sortedList.filter(
        (item) =>
          item.sharpnoteType === "folder" ||
          !item.noteFolder ||
          item.noteFolder.length < 1
      )
    );
  }, [notes, folders, settings]); // Ensure it updates when notes, folders, or settings change

  // const sortedList = activeTab === "recent"
  //   ? fullList.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened))
  //   : fullList.sort((a, b) => new Date(b.created) - new Date(a.created));

  const getItemId = (item) =>
    item.sharpnoteType === "note" ? item.noteID : item.folderID;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleList.findIndex(
      (item) => getItemId(item) === active.id
    );
    const newIndex = visibleList.findIndex(
      (item) => getItemId(item) === over.id
    );
    if (oldIndex !== -1 && newIndex !== -1) {
      const newList = [...visibleList];
      const [movedItem] = newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, movedItem);

      setVisibleList(newList); // update visibleList state

      const newListFull = [...fullList];
      const [movedItemFull] = newListFull.splice(oldIndex, 1);
      newListFull.splice(newIndex, 0, movedItemFull);
      setFullList(newListFull);
    }
  };

  const handleFolderDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find the index of active and over in visibleList
    const oldIndex = visibleList.findIndex(
      (item) => getItemId(item) === active.id
    );
    const newIndex = visibleList.findIndex(
      (item) => getItemId(item) === over.id
    );
    if (oldIndex !== -1 && newIndex !== -1) {
      // Create a copy of fullList to avoid direct mutation
      const newList = [...visibleList];
      const [movedItem] = newList.splice(oldIndex, 1);
      newList.splice(newIndex, 0, movedItem);

      // Find the folder that contains active.id
      const folderIndex = visibleList.findIndex((item) =>
        item.folderNotes?.includes(active.id)
      );

      if (folderIndex !== -1) {
        const folder = visibleList[folderIndex];

        // Ensure folderNotes is an array
        let folderNotes = Array.isArray(folder.folderNotes)
          ? folder.folderNotes
          : JSON.parse(folder.folderNotes || "[]");

        // Get folder settings if available
        let settingsFolderNotes;
        if (settings.structure?.folders) {
          const matchingFolder = settings.structure.folders.find(
            (f) => f.folderID === folder.folderID
          );
          if (matchingFolder) {
            settingsFolderNotes = Array.isArray(matchingFolder.folderOrder)
              ? matchingFolder.folderOrder
              : JSON.parse(matchingFolder.folderOrder || "[]");
          }
        }

        // Use folder settings if available, otherwise fallback to folderNotes
        folderNotes = settingsFolderNotes || folderNotes;

        // Ensure active.id and over.id exist in folderNotes
        if (!folderNotes.includes(active.id)) {
          folderNotes.push(active.id);
        }
        if (!folderNotes.includes(over.id)) {
          folderNotes.push(over.id);
        }

        // Reorder the folderNotes array
        const oldNoteIndex = folderNotes.indexOf(active.id);
        const newNoteIndex = folderNotes.indexOf(over.id);

        if (oldNoteIndex !== -1 && newNoteIndex !== -1) {
          // Remove the active note from its old position and insert it at the new position
          folderNotes.splice(oldNoteIndex, 1);
          folderNotes.splice(newNoteIndex, 0, active.id);

          // Update the folderNotes in fullList
          const updatedFolder = {
            ...folder,
            folderNotes: JSON.stringify(folderNotes),
          };
          newList[folderIndex] = updatedFolder;

          // Update the folder order in settings
          if (settings.structure?.folders) {
            const settingsIndex = settings.structure.folders.findIndex(
              (f) => f.folderID === folder.folderID
            );
            if (settingsIndex !== -1) {
              settings.structure.folders[settingsIndex].folderOrder =
                folderNotes;
            }
          }
          onUpdateFolderOrder(updatedFolder);
        }
      }

      // Update state with the new list
      setVisibleList(newList);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 40, // Ensures drag only activates after the mouse moves a bit
      },
    })
  );

  const handleFolderDrag = (ev) => {
    const folderID = ev.active.id; // The ID of the dragged folder

    // Check if the folder ID is in openedFolders
    if (openedFolders.includes(folderID)) {
      // Close the folder by triggering the onClickFolder function
      onClickFolder(folderID);
    }
  };

  // const heightPerNoteItem = () => {
  //   switch(settings?.userSettings.noteItemStyle) {
  //     case "normal":
  //       return 36.8
  //     case "slim":
  //       return 26.8
  //     case "big":
  //       return 49.8
  //     case "detailed":
  //       return 89.8
  //     default:
  //       return 36.8
  //   }
  // }

  return (
    <div className={`${leftPanelVisible ? "note-list" : "note-list-min"}`}>
      <div
        className="note-list-topbar"
        style={{ display: leftPanelVisible ? "grid" : "none" }}
      >
        <button className="note-list-topbutton" onClick={onAddedNote}>
          <FontAwesomeIcon icon={faPlus} /> <span>New Note</span>
        </button>
        <button
          className="note-list-topbutton"
          onClick={onAddedFolder}
          style={{ borderLeft: "2px solid #4e4e4e" }}
        >
          <FontAwesomeIcon icon={faFolderPlus} /> <span>New Folder</span>
        </button>
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={(ev) => handleFolderDrag(ev)}
        onDragEnd={handleDragEnd}
        autoScroll={{ enabled: true }}
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
      >
        <div
          className="note-list-notes"
          style={{ display: leftPanelVisible ? "grid" : "none" }}
          ref={scrollContainerRef}
        >
          <div
            className={`note-list-notes-all`}
            style={{ height: "fit-content" }}
          >
            <SortableContext
              items={fullList.map((item) => getItemId(item))}
              strategy={verticalListSortingStrategy}
            >
              {visibleList.map((item) => (
                <SortableItem
                  key={
                    item.sharpnoteType === "note" || !item.sharpnoteType
                      ? item.noteID
                      : item.folderID
                  }
                  id={
                    item.sharpnoteType === "note" || !item.sharpnoteType
                      ? item.noteID
                      : item.folderID
                  }
                  settingsIsDNDDisabled={settings.userSettings.disableDnD}
                >
                  {item.sharpnoteType === "note" &&
                  (item.noteFolder?.length < 1 || item.noteFolder === null) ? (
                    <NoteItem
                      note={item}
                      onDeleteNote={onDeleteNote}
                      selectedNoteId={selectedNoteId}
                      onSelectNote={() => onSelectNote(item.noteID)}
                      onEditNote={onEditNote}
                      onNoteContextMenu={onNoteContextMenu}
                      deleteModeOn={deleteModeOn}
                      settings={settings}
                      isOpenedUnderFolder={false}
                    />
                  ) : item.sharpnoteType === "folder" ? (
                    <FolderItem
                      notes={notes}
                      folder={item}
                      onDeleteFolder={onDeleteFolder}
                      onClickFolder={() => onClickFolder(item.folderID)}
                      onFolderContextMenu={onFolderContextMenu}
                      openedFolders={openedFolders}
                      settings={settings}
                      onDeleteNote={onDeleteNote}
                      selectedNoteId={selectedNoteId}
                      onSelectNote={onSelectNote}
                      onEditNote={onEditNote}
                      onNoteContextMenu={onNoteContextMenu}
                      deleteModeOn={deleteModeOn}
                      onDragEnd={handleFolderDragEnd}
                      sensors={sensors}
                    />
                  ) : null}
                </SortableItem>
              ))}
            </SortableContext>
          </div>
        </div>
      </DndContext>
      {leftPanelVisible && (
        <div className="note-list-bottombar">
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button className="note-list-bottombutton"></button>
          <button
            className="note-list-bottombutton note-list-bottombutton-filled"
            onClick={toggleLeftPanel}
          >
            <FontAwesomeIcon icon={faAnglesLeft} />
          </button>
        </div>
      )}
      {!leftPanelVisible && (
        <div className="note-list-bottombar-min">
          <button
            className="note-list-bottombutton note-list-bottombutton-min note-list-bottombutton-filled"
            onClick={toggleLeftPanel}
          >
            <FontAwesomeIcon icon={faAnglesRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteList;
