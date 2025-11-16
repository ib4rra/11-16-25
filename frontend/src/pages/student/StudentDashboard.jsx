import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MenuIcon from "@mui/icons-material/Menu";

function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  useEffect(() => {
    if (!menuOpenFor) return;
    const handleDocClick = (e) => {
      if (!e.target.closest('[data-menu-ignore]')) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [menuOpenFor]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchActiveClasses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/student/active-classes",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClasses(response.data?.activeClasses || []);
      } catch (err) {
        console.error("❌ Error fetching active classes:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(err.response?.data?.message || "Failed to load classes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveClasses();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a class code.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/student/join-class",
        { classCode: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subject = response.data?.subject;
      if (subject) {
        // Navigate to student subclass view with the subject data
        setShowJoinModal(false);
        setJoinCode("");
        navigate('/student/subclass', { state: { classData: subject } });
        return;
      }

      alert(response.data?.message || "Successfully joined the class!");
      setShowJoinModal(false);
      setJoinCode("");
    } catch (err) {
      console.error("❌ Error joining class:", err);
      alert(err.response?.data?.message || "Failed to join class.");
    }
  };

  const toggleMenu = (id) => {
    setMenuOpenFor((prev) => (prev === id ? null : id));
  };

  const handleUnenroll = async (cls) => {
    const id = cls.subject_id || cls.class_id || cls.id;
    const confirmLeave = window.confirm('Are you sure you want to unenroll from this class?');
    if (!confirmLeave) return;

    try {
      const token = localStorage.getItem('token');
      // Try to call backend leave endpoint (may not exist yet)
      await axios.post(
        'http://localhost:5000/student/leave-class',
        { subjectId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
      setMenuOpenFor(null);
      alert('You have been unenrolled from the class.');
    } catch (err) {
      console.error('❌ Error unenrolling from class:', err);
      // If backend doesn't exist or fails, still remove locally as fallback
      if (!err.response) {
        setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
        setMenuOpenFor(null);
        alert('Local unenroll applied (server call failed).');
      } else {
        alert(err.response?.data?.message || 'Failed to unenroll.');
      }
    }
  };

  useEffect(() => {
    if (showJoinModal && inputRef.current) {
      // small timeout to ensure modal is in DOM
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [showJoinModal]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] transition-all duration-500">
      {/* Sidebar */}
      {/* Inline Sidebar (moved from ./Sidebar) */}
      {/* Visible on md+ screens, toggled on small screens via `sidebarOpen` */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r-2 border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="text-center mt-20 mb-6">
          <h2 className="text-3xl font-bold text-blue-600 tracking-wide">Menu</h2>
          <p className="text-sm text-gray-500">Student</p>
        </div>

        <div className="flex flex-col p-4 space-y-3">
          <button
            onClick={() => navigate('/student/StudentDashboard')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <HomeIcon fontSize="large" />
            <span>Home</span>
          </button>

          <button
            onClick={() => navigate('/student/todo')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <AssignmentIcon fontSize="large" />
            <span>To Do</span>
          </button>

          <button
            onClick={() => navigate('/student/archived')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <ArchiveIcon fontSize="large" />
            <span>Archived</span>
          </button>

          <button
            onClick={() => navigate('/student/setting')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <SettingsIcon fontSize="large" />
            <span>Settings</span>
          </button>
        </div>

        <div className="absolute bottom-6 left-0 w-full text-center text-gray-400 text-sm">
          © 2025 VirtuLab
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-24 relative md:ml-72">
          {/* Join Class Button */}
          <div className="absolute top-28 right-10 z-50">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 border border-gray-400 text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition-all bg-white shadow-md"
            >
              <span className="text-lg">＋</span> Join Class
            </button>
          </div>


          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center drop-shadow-sm">
            Welcome, Student!
          </h1>

          {/* Games & Activities Section (new compact card layout) */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Explore</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => navigate('/student/dashboard')}
                className="rounded-xl p-4 flex items-center gap-4 shadow-md cursor-pointer"
                style={{
                  background: "linear-gradient(90deg,#E0EAFC 0%,#D9E9FB 50%,#CFDEF3 100%)",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(13,78,155,0.06)",
                }}
              >
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-white border border-white/60">
                  <span className="text-xl">🎮</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">Games</div>
                  <div className="text-xs mt-1 opacity-80">Play and learn with fun interactive games.</div>
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center gap-4 shadow-md cursor-pointer"
                style={{
                  background: "linear-gradient(90deg,#E0EAFC 0%,#D9E9FB 50%,#CFDEF3 100%)",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(13,78,155,0.06)",
                }}
              >
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-white border border-white/60">
                  <span className="text-xl">🧩</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">Activities</div>
                  <div className="text-xs mt-1 opacity-80">Explore activities and interactive lessons.</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Classes Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              My Classes
            </h2>

            {loading ? (
              <p className="text-center text-gray-600">Loading classes...</p>
            ) : classes.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm flex justify-center items-center">
                <p className="text-gray-600 text-lg font-medium">
                  No active classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {classes.map((cls) => (
                  <div
                    key={cls.subject_id || cls.class_id || cls.id}
                    onClick={() => navigate('/student/subclass', { state: { classData: cls } })}
                    className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cls.title || "Untitled Class"}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        Active
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {cls.description || "No description available."}
                    </p>

                    {cls.class_code && (
                      <p className="text-xs text-gray-500">
                        Code: <span className="font-medium">{cls.class_code}</span>
                      </p>
                    )}
                    {/* Burger menu (lower-right) */}
                    <button
                      data-menu-ignore
                      onClick={(e) => {
                        e.stopPropagation();
                        const id = cls.subject_id || cls.class_id || cls.id;
                        toggleMenu(id);
                      }}
                      className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow"
                      title="Options"
                    >
                      <MenuIcon fontSize="small" />
                    </button>

                    {menuOpenFor === (cls.subject_id || cls.class_id || cls.id) && (
                      <div
                        data-menu-ignore
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-14 right-4 bg-white border border-gray-200 rounded-md shadow-md z-50"
                      >
                        <button
                          onClick={() => handleUnenroll(cls)}
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          Unenroll
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
              Join a Class
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter class code"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              ref={inputRef}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
