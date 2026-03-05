/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { 
  Search, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Lightbulb, 
  ArrowRight,
  Loader2,
  BookOpen,
  Menu,
  X,
  Mic,
  MicOff,
  Camera,
  Bookmark,
  BookmarkCheck,
  Sun,
  Moon,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Act as a Senior Full-Stack Developer and Technical Writer for "Easy Fix Encyclopedia".
Your goal is to create "no-nonsense," safety-first guides for technical, mechanical, administrative, and biological maintenance tasks.

Visual Identity: Professional Slate (#1a1c23), Safety Yellow (#ffc107), and Action Blue (#3b82f6).

Every guide MUST follow this exact hierarchy in Markdown:

# [Title of the Guide]

## ⚠️ Safety Warning
[High-visibility warning with critical precautions]

## 🛠️ Toolkit/Requirements
[Bulleted list of tools or links - Official sources only]

## 📝 Step-by-Step Execution
[Numbered list with bolded action verbs]

## ✅ Verification
[How to know the fix worked]

## 💡 Pro-Tip
[A "secret" or optimization for the user]

Special Knowledge Base (Biological Optimization):
- Breakfast is a scam: Explain the metabolic benefits of skipping it.
- The Three Whites: Sugar, Rice, and Salt must be avoided or strictly limited.
- Intermittent Fasting: Recommend 16:8 or 20:4 protocols for cellular repair.
- Junk Food: Avoid oiled fries, processed snacks, and refined oils.

Tone: Direct, encouraging, and authoritative. Avoid fluff. Focus on "How-to" rather than "Why."`;

export default function App() {
  const [query, setQuery] = useState('');
  const [guide, setGuide] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('efe_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
    
    const contrast = localStorage.getItem('efe_contrast');
    if (contrast === 'true') {
      setIsHighContrast(true);
      document.body.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newVal = !isHighContrast;
    setIsHighContrast(newVal);
    localStorage.setItem('efe_contrast', String(newVal));
    if (newVal) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const toggleBookmark = (title: string) => {
    const newBookmarks = bookmarks.includes(title)
      ? bookmarks.filter(b => b !== title)
      : [...bookmarks, title];
    setBookmarks(newBookmarks);
    localStorage.setItem('efe_bookmarks', JSON.stringify(newBookmarks));
  };

  const generateGuide = async (topic: string, imageBase64?: string) => {
    if (!topic.trim() && !imageBase64) return;
    setLoading(true);
    setError(null);
    setGuide(null);
    setCompletedSteps({});
    try {
      let contents: any;
      if (imageBase64) {
        contents = {
          parts: [
            { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } },
            { text: `Identify this item and provide an Easy Fix guide for it. If it's a specific model, be precise. Topic: ${topic || 'Unknown Item'}` }
          ]
        };
      } else {
        contents = {
          parts: [{ text: `Give me a guide for: ${topic}` }]
        };
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: SYSTEM_INSTRUCTION
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate guide.");
      }

      const data = await response.json();
      setGuide(data.text || "Failed to generate guide.");
      setTimeout(() => {
        document.getElementById('guide-content')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the knowledge base. Please try again.");
    } finally {
      setLoading(false);
      setImagePreview(null);
    }
  };

  // Voice Search
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      generateGuide(transcript);
    };
    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        generateGuide(query || "Identified Item", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleStep = (stepText: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepText]: !prev[stepText]
    }));
  };

  // Initial guide request
  useEffect(() => {
    generateGuide("How to apply for a fresh Indian Passport 2026");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    generateGuide(query);
  };

  const guideTitle = guide?.split('\n')[0].replace('# ', '') || '';

  return (
    <div className="min-h-screen flex flex-col technical-grid">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="bg-safety-yellow p-2 rounded-lg rotate-3 group-hover:rotate-0 transition-transform">
              <Wrench className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">
                EASY FIX <span className="text-safety-yellow">ENCYCLOPEDIA</span>
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mt-1">Technical Specialist Tool v3.0</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <button 
              onClick={toggleHighContrast}
              className={`p-2 rounded-lg transition-colors ${isHighContrast ? 'bg-safety-yellow text-slate-900' : 'bg-white/10 hover:bg-white/20'}`}
              title="Toggle Outdoor Mode"
            >
              {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button onClick={() => generateGuide("Windows 10 Bootable USB")} className="hover:text-safety-yellow transition-colors">OS Setup</button>
            <button onClick={() => generateGuide("Virus Removal")} className="hover:text-safety-yellow transition-colors">Security</button>
            <button onClick={() => generateGuide("Dual Boot")} className="hover:text-safety-yellow transition-colors">Advanced</button>
            <div className="w-px h-4 bg-white/20" />
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={toggleHighContrast}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isHighContrast ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-y-0 right-0 w-80 bg-slate-900 text-white z-[60] shadow-2xl p-8 border-l border-white/10 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <h3 className="font-mono text-xs tracking-widest text-white/40 uppercase">Directory</h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>
            
            {bookmarks.length > 0 && (
              <div className="mb-12">
                <h4 className="font-mono text-[10px] tracking-widest text-safety-yellow uppercase mb-4">My Workshop</h4>
                <div className="flex flex-col gap-3">
                  {bookmarks.map(b => (
                    <button 
                      key={b}
                      onClick={() => { generateGuide(b); setIsMenuOpen(false); }}
                      className="text-left text-sm font-bold hover:text-safety-yellow flex items-center justify-between group"
                    >
                      <span className="truncate">{b}</span>
                      <BookmarkCheck className="w-3 h-3 text-safety-yellow shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-6">
              {[
                "Installing Windows 10/11",
                "Fixing House Fuse & Electricals",
                "Two-Wheeler Battery Maintenance",
                "Car Battery Replacement",
                "Biological Optimization (Diet)",
                "Indian Passport 2026",
                "Virus Removal & System Cleanup"
              ].map((item) => (
                <button 
                  key={item}
                  onClick={() => { generateGuide(item); setIsMenuOpen(false); }} 
                  className="text-left text-lg font-bold hover:text-safety-yellow flex items-center justify-between group"
                >
                  {item}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </nav>
            
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-mono text-white/40 uppercase mb-2">Lead Architect</p>
                <p className="text-sm font-bold mb-1 text-safety-yellow">PikaBoo</p>
                <p className="text-xs text-white/60">63002418811</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Hero Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="inline-block px-3 py-1 bg-action-blue/10 text-action-blue text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
                  Workshop Directive v3.0
                </span>
                <h2 className="text-5xl sm:text-7xl font-black text-ink mb-8 tracking-tighter leading-[0.9]">
                  FIX IT <br />
                  <span className="text-action-blue">YOURSELF</span> <br />
                  FROM SCRATCH.
                </h2>
                
                <div className="relative max-w-2xl">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search or use voice..."
                      className="w-full h-20 pl-16 pr-48 rounded-3xl bg-white border-2 border-slate-200 focus:border-action-blue focus:ring-8 focus:ring-action-blue/5 transition-all text-xl outline-none shadow-xl"
                    />
                    <div className="absolute right-3 top-3 bottom-3 flex gap-2">
                      <button
                        type="button"
                        onClick={startListening}
                        className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        title="Voice Search"
                      >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-action-blue text-white px-8 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-action-blue/20"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute'}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-4 flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-action-blue transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm"
                    >
                      <Camera className="w-4 h-4" /> AI Photo Diagnosis
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-5 hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-48 bg-safety-yellow rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-safety-yellow/20">
                    <AlertTriangle className="w-8 h-8 text-slate-900" />
                    <p className="font-black text-slate-900 text-xl leading-tight">SAFETY <br /> FIRST.</p>
                  </div>
                  <div className="h-64 bg-slate-900 rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl shadow-slate-900/20">
                    <Wrench className="w-8 h-8 text-safety-yellow" />
                    <div>
                      <p className="font-mono text-[10px] text-white/40 uppercase mb-2">Toolkit</p>
                      <p className="font-bold text-lg">Official sources only.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="h-64 bg-action-blue rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl shadow-action-blue/20">
                    <CheckCircle2 className="w-8 h-8" />
                    <p className="font-black text-xl leading-tight">VERIFIED <br /> RESULTS.</p>
                  </div>
                  <div className="h-48 bg-white rounded-3xl p-6 border-2 border-slate-100 flex flex-col justify-between shadow-xl">
                    <Lightbulb className="w-8 h-8 text-action-blue" />
                    <p className="font-bold text-slate-900">PRO TIPS <br /> INCLUDED.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section id="guide-content" className="relative min-h-[400px] scroll-mt-24">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                {imagePreview && (
                  <div className="mb-8 relative">
                    <img src={imagePreview} className="w-48 h-48 object-cover rounded-3xl shadow-2xl border-4 border-white" alt="Diagnosis" />
                    <div className="absolute inset-0 bg-action-blue/20 animate-pulse rounded-3xl" />
                  </div>
                )}
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-slate-100 border-t-action-blue rounded-full animate-spin" />
                  <Wrench className="absolute inset-0 m-auto w-8 h-8 text-action-blue animate-pulse" />
                </div>
                <p className="mt-8 font-mono text-xs tracking-widest text-slate-400 uppercase">Analyzing Directive...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border-2 border-red-100 p-12 rounded-[40px] text-center"
              >
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-red-900 mb-4">SYSTEM ERROR</h3>
                <p className="text-red-700 mb-8 text-lg max-w-md mx-auto">{error}</p>
                <button 
                  onClick={() => generateGuide(query || "How to apply for a fresh Indian Passport 2026")}
                  className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-xl shadow-red-600/20"
                >
                  Retry Execution
                </button>
              </motion.div>
            ) : guide ? (
              <motion.article
                key="guide"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="p-8 sm:p-16 markdown-body">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex-1">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-slate-900 !mb-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => {
                            const text = String(children);
                            if (text.includes('Safety Warning')) {
                              return (
                                <div className="bg-safety-yellow p-8 rounded-3xl my-12 flex items-start gap-6 shadow-xl shadow-safety-yellow/20">
                                  <AlertTriangle className="w-10 h-10 text-slate-900 shrink-0 mt-1" />
                                  <div>
                                    <h2 className="text-slate-900 font-black uppercase tracking-tighter !mt-0 !mb-2 text-3xl">
                                      {children}
                                    </h2>
                                    <p className="text-slate-900/80 font-medium !mb-0">Critical precautions must be followed to avoid injury or damage.</p>
                                  </div>
                                </div>
                              );
                            }
                            if (text.includes('Toolkit')) {
                              return (
                                <h2 className="text-slate-900 !mt-16">
                                  <div className="w-10 h-10 bg-action-blue text-white rounded-xl flex items-center justify-center">
                                    <Wrench className="w-5 h-5" />
                                  </div>
                                  {children}
                                </h2>
                              );
                            }
                            if (text.includes('Step-by-Step')) {
                              return (
                                <h2 className="text-slate-900 !mt-16">
                                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                    <ArrowRight className="w-5 h-5" />
                                  </div>
                                  {children}
                                </h2>
                              );
                            }
                            if (text.includes('Verification')) {
                              return (
                                <h2 className="text-slate-900 !mt-16">
                                  <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                  {children}
                                </h2>
                              );
                            }
                            if (text.includes('Pro-Tip')) {
                              return (
                                <div className="bg-slate-900 p-8 rounded-3xl my-12 flex items-start gap-6 text-white shadow-2xl">
                                  <Lightbulb className="w-10 h-10 text-safety-yellow shrink-0 mt-1" />
                                  <div>
                                    <h2 className="text-white font-black uppercase tracking-tighter !mt-0 !mb-2 text-3xl">
                                      {children}
                                    </h2>
                                    <p className="text-white/60 font-medium !mb-0 italic">Advanced optimization for the professional user.</p>
                                  </div>
                                </div>
                              );
                            }
                            return <h2 className="text-slate-900">{children}</h2>;
                          },
                          li: ({ children, ...props }) => {
                            const isStep = guide?.includes('Step-by-Step Execution');
                            const text = React.Children.toArray(children).join('');
                            if (isStep && /^\d+\./.test(text)) {
                              return (
                                <li 
                                  className={`cursor-pointer group flex items-start gap-4 p-4 rounded-2xl transition-all ${completedSteps[text] ? 'bg-green-50 opacity-60' : 'hover:bg-slate-50'}`}
                                  onClick={() => toggleStep(text)}
                                >
                                  <div className={`mt-1 shrink-0 ${completedSteps[text] ? 'text-green-500' : 'text-slate-300 group-hover:text-action-blue'}`}>
                                    {completedSteps[text] ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                                  </div>
                                  <span className={completedSteps[text] ? 'line-through' : ''}>{children}</span>
                                </li>
                              );
                            }
                            return <li {...props}>{children}</li>;
                          }
                        }}
                      >
                        {guide}
                      </ReactMarkdown>
                    </div>
                    <button 
                      onClick={() => toggleBookmark(guideTitle)}
                      className={`p-4 rounded-2xl transition-all shadow-lg ${bookmarks.includes(guideTitle) ? 'bg-safety-yellow text-slate-900' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      title="Bookmark Directive"
                    >
                      {bookmarks.includes(guideTitle) ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                      <Wrench className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Directive Status</p>
                      <p className="text-slate-900 font-bold">Verified & Active</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.print()}
                      className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:border-slate-900 transition-all flex items-center gap-2"
                    >
                      Print Directive
                    </button>
                  </div>
                </div>
              </motion.article>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 text-slate-200"
              >
                <div className="w-32 h-32 border-4 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center mb-8">
                  <BookOpen className="w-12 h-12" />
                </div>
                <p className="text-2xl font-black tracking-tight text-slate-300">AWAITING DIRECTIVE</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-safety-yellow p-2 rounded-lg">
                  <Wrench className="w-6 h-6 text-slate-900" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter">EASY FIX <span className="text-safety-yellow">ENCYCLOPEDIA</span></h2>
              </div>
              <p className="text-white/40 text-lg leading-relaxed mb-12">
                The world's most authoritative repository of technical fixes. 
                Built for those who prefer to solve their own problems.
              </p>
              <div className="flex gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                <a href="#" className="hover:text-white transition-colors">Privacy Protocol</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">System Status</a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-action-blue/20 blur-3xl rounded-full" />
              <div className="relative bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl">
                <h4 className="text-safety-yellow text-xs font-mono uppercase tracking-[0.3em] mb-6">Expert Support</h4>
                <p className="text-2xl font-black mb-8 leading-tight">FAILED TO FIX? <br /> <span className="text-white/40 text-xl">PIKABOO WILL TEACH YOU.</span></p>
                <div className="space-y-4">
                  <a href="https://wa.me/63002418811" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-2xl hover:bg-green-500/20 transition-colors group">
                    <span className="text-green-400 font-mono text-sm">WhatsApp PikaBoo</span>
                    <span className="font-bold text-green-400">63002418811</span>
                  </a>
                  <a href="mailto:chaosrgb@myyahoo.com" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                    <span className="text-white/60 font-mono text-sm">Secure Email</span>
                    <span className="font-bold group-hover:text-safety-yellow transition-colors">chaosrgb@myyahoo.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-24 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <p>© 2026 EFE Technical Systems</p>
            <p>Authorized Access Only</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
