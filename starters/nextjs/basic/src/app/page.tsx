import React, { useState, useEffect } from 'react';
import { 
  PenTool, Users, Briefcase, Network, 
  MessageSquareWarning, Layers, Megaphone, HeartHandshake,
  Crosshair, Lightbulb, Mic, Puzzle,
  Wrench, BookOpen, Crown, Map,
  Cpu, Library, Building, Tent,
  ChevronRight, RefreshCcw, CheckCircle2, Play, Lock, Loader2, Send, ShieldCheck,
  Settings, Download, X, Database, ArrowLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDatabase, ref as rtdbRef, push } from 'firebase/database';

const QUIZ_DATA = [
  {
    id: 1,
    title: "Who is the primary group in need of growth right now?",
    subtitle: "Select an Avatar to place in the center of your HQ.",
    type: "avatar",
    options: [
      { id: 'A', text: "Our growing operational, digital, or creative staff who execute daily campaigns.", icon: PenTool, color: "bg-blue-100 text-blue-600 border-blue-300", label: "The Creators" },
      { id: 'B', text: "Our general employees and internal teams who need a refresh on industry trends.", icon: Users, color: "bg-green-100 text-green-600 border-green-300", label: "The Core Team" },
      { id: 'C', text: "Our C-suite executives, senior leaders, or designated brand spokespersons.", icon: Briefcase, color: "bg-purple-100 text-purple-600 border-purple-300", label: "The Executives" },
      { id: 'D', text: "A specific department, cross-functional group, or the whole company.", icon: Network, color: "bg-orange-100 text-orange-600 border-orange-300", label: "The Collective" },
    ]
  },
  {
    id: 2,
    title: "What is the main challenge or friction point?",
    subtitle: "Pin a sticky note on the HQ whiteboard.",
    type: "sticky",
    options: [
      { id: 'A', text: "Inconsistent execution, communication bottlenecks, or quality gaps in daily work.", icon: MessageSquareWarning, color: "bg-yellow-200 text-yellow-800 border-yellow-400", label: "Execution Gaps" },
      { id: 'B', text: "Teams operating in silos with outdated knowledge about market trends or PR.", icon: Layers, color: "bg-pink-200 text-pink-800 border-pink-400", label: "Knowledge Silos" },
      { id: 'C', text: "High-stakes public scrutiny, upcoming media appearances, or lack of unified vision.", icon: Megaphone, color: "bg-cyan-200 text-cyan-800 border-cyan-400", label: "Strategic Pressure" },
      { id: 'D', text: "Low team morale, misalignment with culture, or unique operational objectives.", icon: HeartHandshake, color: "bg-lime-200 text-lime-800 border-lime-400", label: "Cultural Misalignment" },
    ]
  },
  {
    id: 3,
    title: "What is the primary business outcome you want to achieve?",
    subtitle: "Choose a power-up item for your HQ desk.",
    type: "item",
    options: [
      { id: 'A', text: "Sharper day-to-day execution, better business writing, and smoother conflict resolution.", icon: Crosshair, color: "bg-slate-100 text-blue-600 border-slate-300", label: "Precision Scope" },
      { id: 'B', text: "A shared strategic vocabulary, refreshed creative energy, and brand alignment.", icon: Lightbulb, color: "bg-slate-100 text-amber-500 border-slate-300", label: "Idea Bulb" },
      { id: 'C', text: "Confident executive presence, media readiness, and a clear corporate roadmap.", icon: Mic, color: "bg-slate-100 text-purple-600 border-slate-300", label: "Studio Mic" },
      { id: 'D', text: "Built-from-scratch solutions, team synergy, and purpose-driven collaboration.", icon: Puzzle, color: "bg-slate-100 text-rose-500 border-slate-300", label: "Master Puzzle" },
    ]
  },
  {
    id: 4,
    title: "What style of engagement fits your timeline and approach?",
    subtitle: "Set the calendar and schedule on the wall.",
    type: "calendar",
    options: [
      { id: 'A', text: "Practical skill-building workshops on core capabilities like writing or design.", icon: Wrench, color: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Skill Workshops" },
      { id: 'B', text: "Foundational or landscape trend sessions to get everyone up to speed quickly.", icon: BookOpen, color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Trend Sessions" },
      { id: 'C', text: "High-touch, specialized executive coaching or strategic facilitation retreats.", icon: Crown, color: "bg-violet-50 text-violet-700 border-violet-200", label: "Executive Coaching" },
      { id: 'D', text: "A fully customized, multi-step process involving discovery and tailored frameworks.", icon: Map, color: "bg-orange-50 text-orange-700 border-orange-200", label: "Custom Journey" },
    ]
  }
];

const RESULTS = {
  'A': {
    track: "Capability Building",
    focus: "Operational upskilling, business writing, design, and team communication.",
    description: "Your team needs practical tools to execute flawlessly. It's time to sharpen the saw.",
    icon: Cpu,
    theme: "from-blue-900 to-indigo-900",
    hqName: "The Operations Command Center",
    hqDesc: "A high-tech, streamlined workspace optimized for flawless execution and tactical brilliance."
  },
  'B': {
    track: "Knowledge Sessions",
    focus: "Industry trends, storytelling, PR basics, and customer service.",
    description: "Your team needs a shared vocabulary and fresh perspectives to break down silos.",
    icon: Library,
    theme: "from-emerald-900 to-teal-900",
    hqName: "The Innovation Library",
    hqDesc: "A vibrant, collaborative think-tank filled with resources, buzzing with new ideas."
  },
  'C': {
    track: "Executive Training",
    focus: "Media coaching, executive presence, and strategic planning.",
    description: "Your leadership needs confident presence and a unified strategic vision to steer the ship.",
    icon: Building,
    theme: "from-purple-900 to-fuchsia-900",
    hqName: "The Executive Boardroom",
    hqDesc: "A sleek, top-floor suite with a skyline view, designed for high-stakes decision making."
  },
  'D': {
    track: "Custom Workshops & Team Building",
    focus: "Tailored activities, goal alignment, and purpose-led team bonding.",
    description: "Standard modules won't cut it. You need a bespoke experience to unify and ignite your unique culture.",
    icon: Tent,
    theme: "from-orange-900 to-red-900",
    hqName: "The Strategic Retreat",
    hqDesc: "A custom-built, inspiring offsite environment designed to foster deep synergy and purpose."
  }
};

// Initialize Firebase using environment variables provided by the platform
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hq-diagnostic-app';

export default function App() {
  const [step, setStep] = useState(-1); // -1 is Intro, 0 is Form, 1-4 are questions, 5 is Result
  const [answers, setAnswers] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  
  // Firebase Auth State
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', company: '', consentGiven: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  const [apiEndpoint, setApiEndpoint] = useState('');
  const [dbHost, setDbHost] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  
  // Custom Firebase State
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbDbType, setFbDbType] = useState('firestore');
  const [fbDatabaseUrl, setFbDatabaseUrl] = useState('');

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveMessage, setConfigSaveMessage] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Dashboard State
  const [showDashboard, setShowDashboard] = useState(false);
  const [leadsData, setLeadsData] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setAuthInitialized(true);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Global Configuration on Load
  useEffect(() => {
    const fetchConfig = async () => {
      if (!db || !user) return;
      try {
        const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setApiEndpoint(data.apiEndpoint || '');
          setDbHost(data.dbHost || '');
          setDbName(data.dbName || '');
          setDbUser(data.dbUser || '');
          setDbPassword(data.dbPassword || '');
          setFbApiKey(data.fbApiKey || '');
          setFbAuthDomain(data.fbAuthDomain || '');
          setFbProjectId(data.fbProjectId || '');
          setFbAppId(data.fbAppId || '');
          setFbDbType(data.fbDbType || 'firestore');
          setFbDatabaseUrl(data.fbDatabaseUrl || '');
        }
      } catch (error) {
        console.error("Failed to load config", error);
      }
    };
    if (authInitialized) {
      fetchConfig();
    }
  }, [db, user, authInitialized]);

  const handleStart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(0); // Go to form first
      setIsAnimating(false);
    }, 400);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company || !formData.consentGiven) {
      setFormError("Please fill in all fields and accept the Terms of Agreement.");
      return;
    }
    
    setFormError('');
    setIsAnimating(true);
    
    setTimeout(() => {
      setStep(1); // Proceed to first question
      setIsAnimating(false);
    }, 500);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const calculateResult = (finalAnswers) => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    finalAnswers.forEach(ans => counts[ans]++);
    
    let maxCount = 0;
    let resultLetter = 'A'; 
    
    for (const [letter, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        resultLetter = letter;
      }
    }
    
    setFinalResult(RESULTS[resultLetter]);
    return resultLetter;
  };

  const handleAnswer = async (optionId) => {
    if (isAnimating || isSubmitting) return;
    
    const newAnswers = [...answers, optionId];
    setAnswers(newAnswers);
    setIsAnimating(true);

    if (step < 4) {
      // Proceed to next question
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 600);
    } else {
      // Final question answered: Calculate, Save, and Show Results
      setIsSubmitting(true);
      const resultLetter = calculateResult(newAnswers);
      
      const payload = {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        consentGiven: formData.consentGiven,
        resultTrack: RESULTS[resultLetter].track,
        resultLetter: resultLetter,
        rawAnswers: newAnswers,
        submittedAt: new Date().toISOString(),
        userId: user ? user.uid : 'anonymous'
      };

      try {
        // Send to Firebase (default platform database)
        if (db && user && formData.consentGiven) {
          const leadsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'leads');
          await addDoc(leadsCollection, {
             ...payload,
             submittedAt: serverTimestamp() // Override with server time for firebase
          });
        }

        // Send to Custom Endpoint if configured
        if (apiEndpoint) {
          // Include db credentials in payload if user provided them
          const externalPayload = {
            ...payload,
            dbConfig: {
              host: dbHost,
              database: dbName,
              user: dbUser,
              password: dbPassword
            }
          };
          
          await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(externalPayload)
          });
        }

        // Send to Custom Firebase if configured
        if (fbApiKey && fbProjectId) {
          try {
            const customConfig = {
              apiKey: fbApiKey,
              authDomain: fbAuthDomain,
              projectId: fbProjectId,
              appId: fbAppId,
              ...(fbDatabaseUrl && { databaseURL: fbDatabaseUrl })
            };
            const customAppName = "CustomApp_" + Date.now();
            const customAppObj = initializeApp(customConfig, customAppName);
            const customAuth = getAuth(customAppObj);
            
            try {
              // Try to authenticate anonymously to the custom DB if rules require it
              await signInAnonymously(customAuth);
            } catch (authErr) {
              console.log("Custom DB Auth Note:", authErr);
            }

            // 5-second timeout to prevent infinite loading if DB rules fail or connection drops
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Custom Database timeout")), 5000));
            
            let customDbTask;
            if (fbDbType === 'rtdb') {
              const customRtdbObj = getDatabase(customAppObj);
              const customLeadsRef = rtdbRef(customRtdbObj, 'leads');
              customDbTask = push(customLeadsRef, {
                 ...payload,
                 submittedAt: new Date().toISOString()
              });
            } else {
              const customDbObj = getFirestore(customAppObj);
              const customLeadsRef = collection(customDbObj, 'leads');
              customDbTask = addDoc(customLeadsRef, {
                 ...payload,
                 submittedAt: serverTimestamp()
              });
            }
            
            // Race the database save against the timeout
            await Promise.race([customDbTask, timeoutPromise]);
            
          } catch (fbErr) {
            console.error("Error saving to custom Firebase (Ignored to prevent UI freeze):", fbErr);
          }
        }

      } catch (error) {
        console.error("Error saving lead:", error);
      } finally {
        setTimeout(() => {
          setStep(5);
          setIsAnimating(false);
          setIsSubmitting(false);
        }, 800);
      }
    }
  };

  const handleRestart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setAnswers([]);
      setFinalResult(null);
      setStep(-1);
      setFormData({ name: '', email: '', company: '', consentGiven: false });
      setIsAnimating(false);
    }, 500);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage('');
    try {
      if (!db) throw new Error("Database not initialized");
      const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'leads');
      const snapshot = await getDocs(leadsRef);
      
      if (snapshot.empty) {
        setExportMessage("No data available to export.");
        setIsExporting(false);
        return;
      }

      const rows = [
        ["Name", "Email", "Company", "Result Track", "Result Letter", "Date Submitted"]
      ];

      snapshot.forEach((doc) => {
        const data = doc.data();
        let dateStr = "";
        if (data.submittedAt && data.submittedAt.toDate) {
            dateStr = data.submittedAt.toDate().toLocaleString();
        } else if (data.submittedAt) {
            dateStr = new Date(data.submittedAt).toLocaleString();
        }

        rows.push([
          `"${data.name || ''}"`, 
          `"${data.email || ''}"`, 
          `"${data.company || ''}"`, 
          `"${data.resultTrack || ''}"`,
          `"${data.resultLetter || ''}"`,
          `"${dateStr}"`
        ]);
      });

      const csvContent = rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "hq_leads_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportMessage("Export successful!");
    } catch (error) {
      console.error("Export failed:", error);
      setExportMessage("Export failed. Check connection.");
    }
    setIsExporting(false);
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigSaveMessage('');
    try {
      if (!db || !user) throw new Error("Database or user not initialized");
      const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
      await setDoc(configRef, {
        apiEndpoint, dbHost, dbName, dbUser, dbPassword,
        fbApiKey, fbAuthDomain, fbProjectId, fbAppId, fbDbType, fbDatabaseUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      setConfigSaveMessage('Configuration saved globally!');
    } catch (error) {
      console.error("Error saving config", error);
      setConfigSaveMessage('Failed to save configuration.');
    }
    setIsSavingConfig(false);
    setTimeout(() => setConfigSaveMessage(''), 4000);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser === 'TATQ-Admin' && adminPass === 'Tr4!n!ngQu!z2026') {
      setShowAdminAuth(false);
      setShowSettings(true);
      setAdminUser('');
      setAdminPass('');
      setAdminAuthError('');
    } else {
      setAdminAuthError('Invalid username or password.');
    }
  };

  const openDashboard = async () => {
    setShowSettings(false);
    setShowDashboard(true);
    setIsLoadingLeads(true);
    try {
      if (!db) throw new Error("Database not initialized");
      const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'leads');
      const snapshot = await getDocs(leadsRef);
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      
      // Sort by newest first
      data.sort((a, b) => {
        const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (new Date(a.submittedAt || 0).getTime());
        const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (new Date(b.submittedAt || 0).getTime());
        return timeB - timeA;
      });
      
      setLeadsData(data);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans flex justify-center">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowDashboard(false)}
                className="p-3 bg-white text-slate-500 hover:text-indigo-600 rounded-full shadow-sm border border-slate-200 transition-all hover:scale-105"
                title="Back to App"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Database className="text-indigo-600" size={28} /> Users Data Dashboard
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Internal review of completed diagnostics.</p>
              </div>
            </div>
            <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
              <span className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Total Users</span>
              <span className="text-2xl font-black">{leadsData.length}</span>
            </div>
          </div>
          
          {/* Table Area */}
          <div className="p-0 overflow-auto flex-grow relative bg-white">
            {isLoadingLeads ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 backdrop-blur-sm">
                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-600 font-bold text-lg">Fetching database records...</p>
              </div>
            ) : leadsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Database size={64} className="mb-4 text-slate-200" />
                <p className="text-xl font-bold text-slate-400">No records found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-5 font-extrabold text-slate-600 uppercase text-xs tracking-wider">Full Name</th>
                    <th className="p-5 font-extrabold text-slate-600 uppercase text-xs tracking-wider">Email Address</th>
                    <th className="p-5 font-extrabold text-slate-600 uppercase text-xs tracking-wider">Company</th>
                    <th className="p-5 font-extrabold text-slate-600 uppercase text-xs tracking-wider">Result Track</th>
                    <th className="p-5 font-extrabold text-slate-600 uppercase text-xs tracking-wider">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leadsData.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-5 font-bold text-slate-800">{lead.name || '-'}</td>
                      <td className="p-5 text-slate-600 font-medium">{lead.email || '-'}</td>
                      <td className="p-5 text-slate-600">{lead.company || '-'}</td>
                      <td className="p-5">
                        <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black tracking-wide border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {lead.resultTrack || lead.resultLetter || '-'}
                        </span>
                      </td>
                      <td className="p-5 text-slate-500 text-sm font-medium">
                        {lead.submittedAt && lead.submittedAt.toDate 
                          ? new Date(lead.submittedAt.toDate()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) 
                          : (typeof lead.submittedAt === 'string' ? new Date(lead.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-6 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'} relative`}>
        
        {/* Settings Button */}
        <button 
          onClick={() => setShowAdminAuth(true)}
          className="absolute top-6 right-6 p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-full shadow-sm border border-slate-200 transition-colors hover:scale-105 z-10"
          title="App Settings"
        >
          <Settings size={24} />
        </button>

        {/* Admin Login Modal */}
        {showAdminAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600"/> Admin Access
                </h3>
                <button 
                  onClick={() => { setShowAdminAuth(false); setAdminAuthError(''); setAdminUser(''); setAdminPass(''); }} 
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input 
                      type="password" 
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  {adminAuthError && (
                    <p className="text-xs text-red-600 font-bold">{adminAuthError}</p>
                  )}
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors">
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-indigo-600"/> Administrator Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Custom Database Routing</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  To save submissions directly to a self-hosted MariaDB/MySQL instance, enter the connection details and the URL of your backend script that processes the request.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Backend API Endpoint URL</label>
                    <input 
                      type="url" 
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://yourserver.com/api/save_lead.php"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Host</label>
                    <input 
                      type="text" 
                      value={dbHost}
                      onChange={(e) => setDbHost(e.target.value)}
                      placeholder="localhost or 192.168.1.50"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Name</label>
                    <input 
                      type="text" 
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="e.g. hq_diagnostic_db"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">DB Username</label>
                      <input 
                        type="text" 
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="root"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">DB Password</label>
                      <input 
                        type="password" 
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200 my-6" />

                <h3 className="text-lg font-bold text-slate-800 mb-2">Custom Google Firebase Setup</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Alternatively, save directly to your own Firebase project. Enter your configuration below. (Ensure your Firestore rules allow writes to a 'leads' collection).
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">API Key</label>
                    <input 
                      type="text" 
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      placeholder="AIzaSyB..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project ID</label>
                    <input 
                      type="text" 
                      value={fbProjectId}
                      onChange={(e) => setFbProjectId(e.target.value)}
                      placeholder="my-cool-project-id"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Auth Domain</label>
                      <input 
                        type="text" 
                        value={fbAuthDomain}
                        onChange={(e) => setFbAuthDomain(e.target.value)}
                        placeholder="app.firebaseapp.com"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">App ID</label>
                      <input 
                        type="text" 
                        value={fbAppId}
                        onChange={(e) => setFbAppId(e.target.value)}
                        placeholder="1:123456:web:abc"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Database Type</label>
                      <select 
                        value={fbDbType}
                        onChange={(e) => setFbDbType(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                      >
                        <option value="firestore">Firestore</option>
                        <option value="rtdb">Realtime Database</option>
                      </select>
                    </div>
                    {fbDbType === 'rtdb' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Database URL (Required for RTDB)</label>
                        <input 
                          type="url" 
                          value={fbDatabaseUrl}
                          onChange={(e) => setFbDatabaseUrl(e.target.value)}
                          placeholder="https://my-app.firebaseio.com"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 mb-2">
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                  >
                    {isSavingConfig ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {isSavingConfig ? 'Saving...' : 'Save Configuration Globally'}
                  </button>
                  {configSaveMessage && (
                    <p className={`mt-2 text-center text-sm font-bold ${configSaveMessage.includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                      {configSaveMessage}
                    </p>
                  )}
                </div>

                <hr className="border-slate-200 my-6" />

                <h3 className="text-lg font-bold text-slate-800 mb-2">Manage Data</h3>
                <p className="text-sm text-slate-600 mb-4">View collected leads or download them as a CSV file.</p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={openDashboard}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors"
                  >
                    <Database size={18} /> View Data Dashboard
                  </button>
                  
                  <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors disabled:bg-emerald-400"
                  >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isExporting ? 'Exporting...' : 'Export to Excel (CSV)'}
                  </button>
                </div>
                
                {exportMessage && (
                  <p className={`mt-3 text-center text-sm font-bold ${exportMessage.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                    {exportMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }}></div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white z-10 text-center px-4 drop-shadow-md">
              What's Your Team's <br/><span className="text-yellow-300">Next Power Move?</span>
            </h1>
          </div>
          <div className="p-8 md:p-12 text-center">
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Welcome to the ultimate team diagnostic. Don't just answer a quiz—<strong>Build Your HQ</strong>! 
              <br/><br/>
              Select the elements that best represent your organization's current challenges and goals. We'll analyze your choices and construct the perfect training environment for your team.
            </p>
            <button 
              onClick={handleStart}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg"
            >
              Start Building My HQ <Play size={20} className="fill-current" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className={`min-h-screen bg-slate-100 flex items-center justify-center p-6 transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-indigo-600 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.1 }}></div>
            <div className="relative z-10 flex justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <ShieldCheck size={48} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold relative z-10 mb-2">HQ Security Clearance</h2>
            <p className="text-indigo-100 relative z-10">Please register to begin your diagnostic and build your workspace.</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">Work Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="jane@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  id="company" 
                  name="company" 
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-slate-50 focus:bg-white"
                  placeholder="Acme Corp"
                  required
                />
              </div>

              {/* Consent Tick Box */}
              <div className="flex items-start gap-3 mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input 
                  type="checkbox" 
                  id="consentGiven" 
                  name="consentGiven" 
                  checked={formData.consentGiven}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
                  required
                />
                <label htmlFor="consentGiven" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                  <strong>Consent:</strong> By ticking the checkbox, you agree with the processing of your personal information. To know more about TeamAsia's Privacy Policy and Notice please click this <a href="https://www.teamasia.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors">link</a>.
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 font-medium">
                  {formError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={!authInitialized}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-colors text-lg"
              >
                Enter HQ Builder <ChevronRight size={20} />
              </button>
              
              <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                <Lock size={12} /> Your information is securely stored.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5 && finalResult) {
    const ResultIcon = finalResult.icon;
    return (
      <div className={`min-h-screen bg-gradient-to-br ${finalResult.theme} flex items-center justify-center p-4 md:p-8 transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
          
          <div className={`md:w-2/5 p-12 flex flex-col items-center justify-center text-center bg-gradient-to-b ${finalResult.theme} text-white relative`}>
            <div className="absolute inset-0 bg-black/10" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)', backgroundSize: '40px 40px' }}></div>
            <div className="relative z-10 w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm shadow-inner border border-white/30">
              <ResultIcon size={64} className="text-white drop-shadow-lg" />
            </div>
            <h2 className="relative z-10 text-3xl font-black mb-2 leading-tight">Welcome to<br/>{finalResult.hqName}</h2>
            <p className="relative z-10 text-white/80 mt-4 leading-relaxed font-medium">
              {finalResult.hqDesc}
            </p>
          </div>

          <div className="md:w-3/5 p-8 md:p-12 bg-slate-50 flex flex-col justify-center relative">
            <div className="absolute top-6 right-8 text-sm font-medium text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
              Prepared for {formData.company}
            </div>
            
            <div className="uppercase tracking-widest text-sm font-bold text-slate-400 mb-2 mt-4 md:mt-0">Recommended Learning Track</div>
            <h3 className="text-4xl font-extrabold text-slate-800 mb-6">{finalResult.track}</h3>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-lg">
                <Crosshair className="text-indigo-500" size={24}/> Core Focus
              </h4>
              <p className="text-slate-600 text-lg">{finalResult.focus}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 relative overflow-hidden group hover:shadow-md transition-shadow">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
              <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-lg">
                <Lightbulb className="text-amber-500" size={24}/> Why this works for you
              </h4>
              <p className="text-slate-600 text-lg">{finalResult.description}</p>
            </div>

            <button 
              onClick={handleRestart}
              className="mt-auto self-start flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
            >
              <RefreshCcw size={18} /> Restart Diagnostic
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionIndex = step - 1;
  const currentQuestion = QUIZ_DATA[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 font-sans relative">
      
      {/* Processing State Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm">
           <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
           <h3 className="text-xl font-bold text-slate-800">Generating Your HQ...</h3>
        </div>
      )}

      {/* Header & Progress */}
      <div className="w-full max-w-4xl mb-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="font-bold text-slate-800 text-lg">HQ Builder</h2>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Phase {step} of 4</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx} 
              className={`h-3 rounded-full transition-all duration-500 ${idx < currentQuestionIndex ? 'bg-indigo-600 w-8' : idx === currentQuestionIndex ? 'bg-indigo-400 w-8 animate-pulse' : 'bg-slate-200 w-3'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`w-full max-w-4xl flex-grow flex flex-col transition-opacity duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        
        {/* Question Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3 leading-tight">{currentQuestion?.title}</h1>
          <p className="text-lg text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
            <Wrench size={20} className="text-indigo-400"/> {currentQuestion?.subtitle}
          </p>
        </div>

        {/* Options Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12`}>
          {currentQuestion?.options.map((option) => {
            const Icon = option.icon;
            let cardClass = "relative overflow-hidden cursor-pointer bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6 flex flex-col h-full group text-left w-full";
            
            if (currentQuestion.type === 'sticky') {
              cardClass = `relative overflow-hidden cursor-pointer ${option.color} rounded-sm shadow-md border-b-4 border-r-4 border-black/10 hover:shadow-xl hover:-translate-y-2 hover:-rotate-2 transition-all duration-300 p-6 flex flex-col h-full transform rotate-1 text-left w-full`;
            }

            return (
              <button 
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={isSubmitting}
                className={cardClass}
              >
                <div className={`absolute top-4 right-4 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full 
                  ${currentQuestion.type === 'sticky' ? 'bg-black/10 text-black/70' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors'}`}>
                  {option.label}
                </div>

                <div className="flex items-start gap-4 mt-6">
                  <div className={`p-4 rounded-xl flex-shrink-0 ${currentQuestion.type === 'sticky' ? 'bg-black/10' : option.color} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon size={32} className={currentQuestion.type === 'sticky' ? 'text-black/70' : ''} />
                  </div>
                  <div>
                    <div className={`font-bold mb-2 text-xl ${currentQuestion.type === 'sticky' ? 'text-black/80 font-serif' : 'text-slate-800'}`}>
                      Option {option.id}
                    </div>
                    <p className={`${currentQuestion.type === 'sticky' ? 'text-black/70 font-medium' : 'text-slate-600'} leading-relaxed`}>
                      {option.text}
                    </p>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity w-full">
                  <span className={`inline-flex items-center gap-1 font-bold ${currentQuestion.type === 'sticky' ? 'text-black/60' : 'text-indigo-600'}`}>
                    Select <ChevronRight size={16}/>
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Persistent HQ Blueprint Footer */}
      <div className="w-full max-w-4xl mt-auto bg-white p-6 rounded-2xl shadow-inner border-2 border-dashed border-slate-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-blue-50/50 opacity-50 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative z-10">
          <h4 className="text-center font-bold text-slate-400 uppercase tracking-widest text-sm mb-4">Your HQ Blueprint</h4>
          <div className="flex justify-between items-center gap-2 md:gap-8 px-4 md:px-12">
            {[0, 1, 2, 3].map((slotIdx) => {
              const hasAnswered = slotIdx < currentQuestionIndex;
              const answeredId = hasAnswered ? answers[slotIdx] : null;
              
              let SlotIcon = null;
              let slotColor = "bg-slate-100 text-slate-300 border-slate-200";
              
              if (hasAnswered) {
                const questionData = QUIZ_DATA[slotIdx];
                const selectedOption = questionData.options.find(o => o.id === answeredId);
                if (selectedOption) {
                  SlotIcon = selectedOption.icon;
                  slotColor = "bg-indigo-100 text-indigo-600 border-indigo-300 ring-4 ring-indigo-50";
                }
              }

              return (
                <div key={slotIdx} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${slotColor} ${slotIdx === currentQuestionIndex && !isAnimating ? 'animate-bounce border-indigo-400 text-indigo-300 border-dashed' : ''}`}>
                    {hasAnswered && SlotIcon ? <SlotIcon size={24} /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase">
                    {slotIdx === 0 ? 'Avatar' : slotIdx === 1 ? 'Issue' : slotIdx === 2 ? 'Item' : 'Pace'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
