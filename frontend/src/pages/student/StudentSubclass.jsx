import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import AnnouncementsList from "../instructor/components/AnnouncementsList";

function StudentSubclass() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjectData, setSubjectData] = useState(location.state?.classData || null);
  const [loading, setLoading] = useState(!location.state?.classData);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState(() => location.state?.initialTab || 'newsfeed');
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const API_BASE_URL = "http://localhost:5000";

  const getAttachmentIcon = (mimeType) => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.includes("pdf")) return "📄";
    if (
      mimeType.includes("word") ||
      mimeType.includes("presentation") ||
      mimeType.includes("excel")
    ) {
      return "📄";
    }
    return "📎";
  };

  const classInfo = useMemo(() => {
    const defaults = {
      id: Date.now(),
      className: location.state?.classData?.title || 'Untitled Class',
      section: location.state?.classData?.description || 'Section details',
      code: location.state?.classData?.class_code || (Math.random().toString(36).slice(2,8)).toUpperCase(),
    };

    if (subjectData) {
      return {
        ...defaults,
        subject_id: subjectData.subject_id,
        instructor_id: subjectData.instructor_id,
        title: subjectData.title || defaults.className,
        className: subjectData.title || defaults.className,
        description: subjectData.description || defaults.section,
        class_code: subjectData.class_code || defaults.code,
        code: subjectData.class_code || defaults.code,
        created_at: subjectData.created_at,
      };
    }

    return defaults;
  }, [location.state, subjectData]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSubject = async () => {
      // If we already have classData in location.state, don't fetch
      if (subjectData) return;

      try {
        setLoading(true);
        if (params.id) {
          const res = await axios.get(`http://localhost:5000/student/subjects/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSubjectData(res.data.subject);
        } else if (location.state?.classData?.class_code) {
          const res = await axios.get(
            `http://localhost:5000/student/subjects?class_code=${location.state.classData.class_code}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSubjectData(res.data.subject);
        }
      } catch (err) {
        console.error("Error fetching subject:", err);
        alert(err.response?.data?.message || "Failed to load class.");
        navigate('/student/StudentDashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [location.state, params.id, navigate, subjectData]);

  // fetch announcements for students when subjectData becomes available
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const subjectId = classInfo.subject_id || classInfo.id;
      if (!subjectId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/student/announcements?subject_id=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnnouncements(res.data?.announcements || []);
      } catch (err) {
        console.error('Error fetching student announcements:', err);
      }
    };

    fetchAnnouncements();
  }, [subjectData, classInfo.subject_id, classInfo.id]);

  // fetch activities for students when classwork tab selected
  useEffect(() => {
    const fetchActivities = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const subjectId = classInfo.subject_id || classInfo.id;
      if (!subjectId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/student/activities?subject_id=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setActivities(Array.isArray(res.data) ? res.data : res.data || []);
      } catch (err) {
        console.error('Error fetching student activities:', err);
      }
    };

    if (activeTab === 'classwork' && (subjectData || classInfo.subject_id || classInfo.id)) {
      fetchActivities();
    }
  }, [activeTab, subjectData, classInfo.subject_id, classInfo.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classInfo.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join?code=${classInfo.code}`;
    const inviteDetails = `Join ${classInfo.className}!\n\nClass Code: ${classInfo.code}\n\nJoin Link: ${inviteLink}`;
    try {
      await navigator.clipboard.writeText(inviteDetails);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Copy invite failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Loading...</div>
    );
  }

  if (!subjectData) {
    return (
      <div className="flex items-center justify-center min-h-screen">Class not found.</div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

        <main className="flex-1 px-6 sm:px-10 py-10 mt-12 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <button
                onClick={() => navigate('/student/StudentDashboard')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← Back to classes
              </button>
              <h1 className="mt-4 text-3xl font-semibold text-gray-800">{classInfo.className}</h1>
              <p className="text-gray-500">{classInfo.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyInviteLink}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                Share invite
              </button>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d7bf3] via-[#37b0ff] to-[#8adFFF] text-white shadow-xl">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute left-24 top-10 h-24 w-24 rounded-3xl border border-white/25 rotate-12" />
              <div className="absolute right-16 bottom-16 h-20 w-20 rounded-full bg-white/20" />
            </div>
            <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="uppercase tracking-[0.25em] text-white/80 text-xs">stream overview</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-snug">Start the conversation and keep your class aligned</h2>
                  <p className="mt-3 text-white/80 text-sm max-w-2xl">Announcements posted here appear for everyone instantly. Pin key updates, schedule reminders, or share quick resources to set the tone for your course.</p>
                </div>
                <div className="bg-white/15 rounded-3xl p-6 w-full sm:w-auto sm:min-w-[220px]">
                  <p className="text-white/70 uppercase tracking-wide text-xs">class code</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.35em]">{classInfo.code}</p>
                  <button
                    onClick={handleCopyCode}
                    className={`mt-6 w-full rounded-xl py-2 text-sm font-medium transition ${copiedCode ? 'bg-green-500/30 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                  >
                    {copiedCode ? 'Copied!' : 'Copy code'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 lg:mt-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('newsfeed')}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${activeTab === 'newsfeed' ? 'bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40' : 'bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5'}`}
              >
                Newsfeed
              </button>
              <button
                onClick={() => setActiveTab('classwork')}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${activeTab === 'classwork' ? 'bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40' : 'bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5'}`}
              >
                Classwork
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${activeTab === 'people' ? 'bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40' : 'bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5'}`}
              >
                Class People
              </button>
              {/* Grades tab removed for student view */}
            </div>
          </div>

          {activeTab === 'newsfeed' && (
            <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                  <div
                    onClick={() => {}}
                    className="flex flex-col bg-gray-50 border border-gray-200 rounded-full px-5 py-3 cursor-default"
                  >
                    <span className="text-xs text-gray-400 font-medium leading-none mb-1">Announcement</span>
                    <span className="text-gray-500 text-sm">What's on your mind</span>
                  </div>

                  <div className="mt-6">
                    <AnnouncementsList
                      announcements={announcements}
                      API_BASE_URL={API_BASE_URL}
                      getAttachmentIcon={getAttachmentIcon}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                  <h3 className="text-lg font-semibold text-gray-800">Upcoming</h3>
                  <p className="mt-3 text-sm text-gray-500">No scheduled tasks yet. Ask your instructor to post activities.</p>
                </div>
              </div>
            </section>
          )}
          {activeTab === 'classwork' && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Classwork</h3>
                  <p className="text-sm text-gray-500">View activities posted by your instructor.</p>
                </div>
              </div>

              {activities.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => {
                    let config = activity.config_json;
                    if (typeof config === 'string') {
                      try {
                        config = JSON.parse(config);
                      } catch (e) {
                        config = {};
                      }
                    }

                    return (
                      <div key={activity.activity_id} className="border-l-4 border-green-500 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              { ["CodeLab", "Sim Pc", "Quiz", "Experiment"].map((type) => (
                                <div
                                  key={type}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                    config.activity_name === type
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {type}
                                </div>
                              ))}
                            </div>

                            <div className="mt-2 flex gap-6 text-sm">
                              {config.open_date_time && (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600">📅</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Opens</p>
                                    <p className="text-gray-700">{new Date(config.open_date_time).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                              {config.due_date_time && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">📅</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Due</p>
                                    <p className="text-gray-700">{new Date(config.due_date_time).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {config.instructions && (
                              <p className="text-sm text-gray-600 mt-3">{config.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-gray-500">No activities yet. Ask your instructor to post activities.</p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default StudentSubclass;
