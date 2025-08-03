
import { Menu, UserCircle } from "lucide-react";

const Header = ({ toggleSidebar, dropdownOpen, setDropdownOpen }) => {
  return (
    <header className="bg-whit">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-base-200 cursor-pointer text-purple">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;