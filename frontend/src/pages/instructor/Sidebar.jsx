import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate, useLocation } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { name: "Home", 
      icon: <HomeIcon fontSize="large" />, 
      path: "/instructor/dashboard" },
    {
      name: "Content Management",
      icon: <AssignmentIcon fontSize="large" />,
      path: "/instructor/contentmanagement",
    },
    {
      name: "Archived",
      icon: <ArchiveIcon fontSize="large" />,
      path: "/instructor/archived",
    },
    {
      name: "Settings",
      icon: <SettingsIcon fontSize="large" />,
      path: "/setting",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 transition-opacity duration-300 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#F6F8FA] border-r shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="mt-16 flex flex-col p-4 space-y-4">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  onClose?.();
                }}
                className={`
                  flex items-center gap-4 p-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }
                `}
              >
                <div
                  className={isActive ? "text-blue-600" : "text-gray-700"}
                >
                  {link.icon}
                </div>
                <span className="text-lg font-medium">{link.name}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
