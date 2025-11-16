import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function DashboardPage() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Modal state & inputs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const getClassKey = (cls) =>
    cls?.subject_id ?? cls?.id ?? cls?.class_code ?? cls?.code ?? null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const fetchedSubjects = (res.data.classes || []).map((item) => ({
          ...item,
          subject: item.subject ?? item.description ?? "",
        }));

        setMessage(res.data.message || "Welcome back, Instructor!");
        setClasses(fetchedSubjects);
      })
      .catch((err) => {
        console.error("Error fetching dashboard:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert("Failed to load dashboard. Please try again.");
          setClasses([]);
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    if (location.state?.newClass) {
      // Clear the transient state and rely on server for truth
      navigate("/instructor/dashboard", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert("Class name is required.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const payload = {
      title: className.trim(),
      description: subject || null,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/instructor/classes", payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      // Find the newly created subject from the refreshed list
      const newSubject = res.data?.subject;
      if (newSubject) {
        const enrichedSubject = {
          ...newSubject,
          subject: subject || newSubject.subject || newSubject.description || "",
        };
        navigate("/instructor/subclass", { state: { classData: enrichedSubject, initialTab: "newsfeed" } });
      } else {
        // If subject not in response, use the last item from refreshed list
        const lastClass = refreshedClasses[refreshedClasses.length - 1];
        if (lastClass) {
          navigate("/instructor/subclass", { state: { classData: lastClass, initialTab: "newsfeed" } });
        }
      }
    } catch (err) {
      console.error("Error creating class:", err);
      alert(err.response?.data?.message || "Failed to create class. Please try again.");
    }

    setIsModalOpen(false);
    setClassName("");
    setSubject("");
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim()) {
      alert("Class name is required.");
      return;
    }

    if (!editingClass) {
      alert("No class selected for editing.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = editingClass.subject_id || editingClass.id;
    if (!subjectId) {
      alert("Cannot update: Subject ID not found.");
      return;
    }

    const payload = {
      title: editClassName.trim(),
      description: editSubject || null,
    };

    try {
      await axios.put(
        `http://localhost:5000/instructor/subject/${subjectId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      alert("Class updated successfully!");
      setIsEditModalOpen(false);
      setEditingClass(null);
      setEditClassName("");
      setEditSubject("");
    } catch (err) {
      console.error("Error updating class:", err);
      alert(err.response?.data?.message || "Failed to update class. Please try again.");
    }
  };

  const handleCopyInviteLink = async (cls) => {
    const inviteLink = `${window.location.origin}/join?code=${cls.class_code || cls.code}`;
    const inviteDetails = `Join ${cls.title || cls.className || "my class"}!\n\nClass Code: ${cls.class_code || cls.code}\n\nJoin Link: ${inviteLink}`;
    
    try {
      await navigator.clipboard.writeText(inviteDetails);
      alert("Invitation link copied to clipboard!");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to copy invite:", err);
      alert("Failed to copy invitation link.");
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.title || cls.className || "");
    setEditSubject(cls.description || cls.subject || "");
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCopy = async (cls) => {
    const classDetails = `Class: ${cls.title || cls.className}\nSubject: ${cls.subject || cls.description}\nCode: ${cls.class_code || cls.code}`;
    
    try {
      await navigator.clipboard.writeText(classDetails);
      alert("Class details copied to clipboard!");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy class details.");
    }
  };

  const handleArchive = async (cls) => {
    const name = cls.title || cls.className || "this class";
    if (!window.confirm(`Are you sure you want to archive "${name}"?`)) return;

    const subjectId = cls.subject_id || cls.id;
    if (!subjectId) {
      alert("Cannot archive: Subject ID not found.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/instructor/archive/${subjectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      // Close the menu and notify
      setOpenMenuId(null);
      alert("Class archived successfully.");
    } catch (err) {
      console.error("Error archiving class:", err);
      const msg = err.response?.data?.message || "Failed to archive class. Please try again.";
      alert(msg);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        {/* ✅ Main Content */}
        <main 
          className="flex-grow flex flex-col p-10"
          onClick={() => setOpenMenuId(null)}
        >
          {/* Greeting */}
          {message && (
            <p className="text-gray-700 text-lg mb-6 font-medium tracking-wide text-center">
              {message}
            </p>
          )}

          {/* Active Classes Section */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Active Classes
          </h2>

          {/* If no active classes */}
          {classes.length === 0 && (
            <div className="text-gray-500 text-center mb-8">
              <p className="text-base">
                You have no active classes yet.
              </p>
            </div>
          )}

          {/* ✅ Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center items-stretch auto-rows-fr w-full">
            {/* Create Class Card - First Position */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="group w-full max-w-xs sm:max-w-sm h-full min-h-[15rem] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-400 focus-within:bg-blue-50/40"
            >
              <span className="text-4xl mb-2 transition-transform group-hover:scale-110">
                +
              </span>
              <span className="text-lg font-semibold text-center">
                Create Class
              </span>
            </div>

            {/* Render Class Cards */}
            {classes.map((cls, index) => {
              const cardId = getClassKey(cls) || cls.title || `class-${index}`;
              const handleOpenClass = () =>
                navigate("/instructor/subclass", {
                  state: { classData: cls, initialTab: "newsfeed" },
                });

              return (
                <div
                  key={cardId}
                  className="relative w-full max-w-xs sm:max-w-sm"
                >
                  <div
                    onClick={() => {
                      setOpenMenuId(null);
                      handleOpenClass();
                    }}
                    style={{
                      background:
                        "linear-gradient(140deg, rgba(236, 246, 255, 0.95) 0%, rgba(210, 231, 255, 0.98) 55%, rgba(181, 213, 255, 1) 100%)",
                    }}
                    className="group h-full shadow-lg rounded-3xl border border-white/60 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-[0_25px_45px_-15px_rgba(60,120,200,0.35)] focus-within:-translate-y-1 focus-within:shadow-[0_25px_45px_-15px_rgba(60,120,200,0.35)]"
                  >
                    <div className="absolute -top-10 -right-6 w-32 h-32 bg-blue-200/60 rounded-full blur-3xl transition-transform duration-300 group-hover:scale-125" />
                    <div className="relative flex-1 flex flex-col justify-between p-6 text-slate-800">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-xs font-medium text-blue-700 shadow-sm">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                          Active Class
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900 tracking-wide break-words">
                            {cls.title || cls.className || "Untitled Class"}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed break-words">
                            {cls.description || cls.subject || "No description available"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        {(cls.subject || cls.description) && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/70 text-blue-700 font-medium shadow-sm">
                            {cls.subject || cls.description}
                          </span>
                        )}
                        {(cls.class_code || cls.code) && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/70 text-blue-700 font-medium shadow-sm">
                            Code {cls.class_code || cls.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleOpenClass();
                          }}
                          className="w-full rounded-xl bg-white text-blue-700 text-sm font-semibold py-2.5 shadow-sm transition-colors group-hover:bg-blue-700 group-hover:text-white"
                        >
                          Open Class
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Three-dot menu button positioned outside card */}
                  <div className="pointer-events-none absolute -bottom-3 -right-3 flex flex-col items-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === cardId ? null : cardId));
                      }}
                      className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-white/90 text-blue-700 shadow-md transition-colors hover:bg-white hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      aria-label="More actions"
                    >
                      <span className="flex flex-col gap-1 items-center">
                        <span className="block h-1 w-1 rounded-full bg-current" />
                        <span className="block h-1 w-1 rounded-full bg-current" />
                        <span className="block h-1 w-1 rounded-full bg-current" />
                      </span>
                    </button>
                    {openMenuId === cardId && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-auto absolute bottom-14 right-0 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-2 text-left z-20"
                      >
                        <ul className="flex flex-col text-sm text-gray-700">
                          <li>
                            <button
                              type="button"
                              onClick={() => handleCopyInviteLink(cls)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                            >
                              Copy invitation link
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleEdit(cls)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                            >
                              Edit
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleCopy(cls)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                            >
                              Copy
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleArchive(cls)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-red-600"
                            >
                              Archive
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Create Class
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateClass();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="class-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Class name*
                  </label>
                  <input
                    type="text"
                    id="class-name"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">*Required</p>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject / Description
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingClass(null);
            setEditClassName("");
            setEditSubject("");
          }}
        >
          <div
            className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Edit Class
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateClass();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-class-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Class name*
                  </label>
                  <input
                    type="text"
                    id="edit-class-name"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">*Required</p>
                </div>

                <div>
                  <label
                    htmlFor="edit-subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject / Description
                  </label>
                  <input
                    type="text"
                    id="edit-subject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingClass(null);
                    setEditClassName("");
                    setEditSubject("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
