import React, { useState } from "react";
import SettingsPopup from "./SettingsPopup";  // We'll create this next

const MenuBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const openSettingsPopup = () => setIsSettingsPopupOpen(true);
  const closeSettingsPopup = () => setIsSettingsPopupOpen(false);

  return (
    <div className="menu-bar">
      <button onClick={toggleDropdown}>File</button>
      {isDropdownOpen && (
        <div className="dropdown-menu">
          <button onClick={openSettingsPopup}>Settings</button>
        </div>
      )}
      {isSettingsPopupOpen && (
        <SettingsPopup closePopup={closeSettingsPopup} />
      )}
    </div>
  );
};

export default MenuBar;
