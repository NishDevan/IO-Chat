"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://io-chat-ug06.onrender.com';

export default function IOChatApp() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  
  const [user, setUser] = useState(null);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState("");
  const [chats, setChats] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // New features state
  const [currentView, setCurrentView] = useState('chats'); // 'chats', 'groups', 'settings'
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatFilter, setChatFilter] = useState('time'); // 'time', 'unread', 'favorites'

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Theme States
  const [selectedAccent, setSelectedAccent] = useState('red');
  const [selectedWallpaper, setSelectedWallpaper] = useState('');

  // Auth Layout States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Profile Edit States
  const [editUsername, setEditUsername] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Group Create States
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatMembers, setChatMembers] = useState([]);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [viewingGroupProfile, setViewingGroupProfile] = useState(null);

  const accentPalettes = {
    red: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
    blue: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a' },
    green: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d' },
    yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12' },
    purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87' },
    pink: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' },
    indigo: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
    teal: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
    orange: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
    cyan: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
  };

  const activePalette = accentPalettes[selectedAccent] || accentPalettes.red;
  const themeVars = {
    '--app-accent-50': activePalette[50],
    '--app-accent-100': activePalette[100],
    '--app-accent-200': activePalette[200],
    '--app-accent-300': activePalette[300],
    '--app-accent-400': activePalette[400],
    '--app-accent-500': activePalette[500],
    '--app-accent-600': activePalette[600],
    '--app-accent-700': activePalette[700],
    '--app-accent-800': activePalette[800],
    '--app-accent-900': activePalette[900],
  };

  const wallpaperTemplates = [
    { id: 'default', url: '' },
    { id: 'w1', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop' },
    { id: 'w2', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop' },
    { id: 'w3', url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1920&auto=format&fit=crop' },
    { id: 'w4', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop' }
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    }

    // Load Dark Mode
    const savedDarkMode = localStorage.getItem('isDarkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }

    // Load Wallpaper
    const savedWallpaper = localStorage.getItem('selectedWallpaper');
    if (savedWallpaper) {
      setSelectedWallpaper(savedWallpaper);
    }

    // Load Accent Color
    const savedAccent = localStorage.getItem('selectedAccent');
    if (savedAccent) {
      setSelectedAccent(savedAccent);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditStatus(user.status || "");
    }
  }, [user]);

  const fetchMe = async (currentToken) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(res.data);
      setEditUsername(res.data.username);
      setEditStatus(res.data.status || "");
    } catch (err) {
      console.error("Auth failed", err);
      logout();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${BACKEND_URL}/api/auth/profile`, 
        { username: editUsername, status: editStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update profile");
    }
  };

  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) {
      alert("Please provide group name and select at least one member");
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/api/chats/group`, 
        { name: groupName, userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchChats();
      setActiveChatId(res.data.id);
      setShowNewChatModal(false);
      setIsCreatingGroup(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create group");
    }
  };

  const handleAddMembersToGroup = async () => {
    if (selectedUsers.length === 0 || !groupToEdit) return;
    try {
      await axios.post(`${BACKEND_URL}/api/chats/group/${groupToEdit.id}/members`, 
        { userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Members added successfully!");
      setShowAddMemberModal(false);
      setSelectedUsers([]);
      setGroupToEdit(null);
      fetchChatMembers(activeChatId);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add members");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleViewUserProfile = async (userId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewingUserProfile(res.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleToggleFavorite = async (targetUserId) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/favorites/toggle`, 
        { favoriteUserId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewingUserProfile(prev => prev && prev.id === targetUserId ? { ...prev, is_favorite: res.data.isFavorite } : prev);
      fetchChats();
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert(err.response?.data?.error || "Failed to toggle favorite");
    }
  };

  const handleToggleGroupFavorite = async (targetChatId) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/favorites/toggle`, 
        { favoriteChatId: targetChatId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewingGroupProfile(prev => prev && prev.id === targetChatId ? { ...prev, is_favorite: res.data.isFavorite } : prev);
      fetchChats();
    } catch (err) {
      console.error("Error toggling group favorite:", err);
      alert(err.response?.data?.error || "Failed to toggle favorite");
    }
  };

  const activeChatIdRef = useRef(null);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (user && token) {
      fetchChats();
      const newSocket = io(BACKEND_URL, {
        auth: { token }
      });
      setSocket(newSocket);

      newSocket.on('receive_message', (msg) => {
        if (msg.chat_id === activeChatIdRef.current) {
          setMessages(prev => [...prev, msg]);
          axios.post(`${BACKEND_URL}/api/chats/${activeChatIdRef.current}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(() => {
            fetchChats();
          }).catch(err => console.error(err));
        } else {
          fetchChats();
        }
      });

      newSocket.on('message_deleted', ({ chatId, messageId }) => {
        if (chatId === activeChatIdRef.current) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: 'message was deleted', message_type: 'deleted' } : m));
        }
        fetchChats();
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
      if(res.data.length > 0 && !activeChatId) {
        const firstUnarchived = res.data.find(c => !c.is_archived);
        if (firstUnarchived) {
          setActiveChatId(firstUnarchived.id);
        } else {
          setActiveChatId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (chatId, targetUserId, archive) => {
    try {
      const res = await axios.put(`${BACKEND_URL}/api/chats/archive`, {
        chatId,
        targetUserId,
        archive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        await fetchChats();
        if (archive && chatId === activeChatId) {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error("Error toggling archive status:", err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatMembers = async (chatId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chats/${chatId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    if (activeChatId && token) {
      fetchMessages(activeChatId);
      fetchChatMembers(activeChatId);
      if (socket) {
        socket.emit('join_room', activeChatId);
      }
    }
  }, [activeChatId, token]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('isDarkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('isDarkMode', 'false');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedWallpaper) {
      localStorage.setItem('selectedWallpaper', selectedWallpaper);
    } else {
      localStorage.removeItem('selectedWallpaper');
    }
  }, [selectedWallpaper]);

  useEffect(() => {
    if (selectedAccent) {
      localStorage.setItem('selectedAccent', selectedAccent);
    }
  }, [selectedAccent]);

  // Handle Dynamic Accent Color
  // Implementation removed per user request to fix initialization error

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, username, password };
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Auth Failed");
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if(socket) socket.disconnect();
  };

  const handleSendMessage = () => {
    if(!inputText.trim() || !activeChatId || !socket) return;
    socket.emit('send_message', { chatId: activeChatId, content: inputText });
    setInputText("");
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket || !activeChatId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      socket.emit('delete_message', { chatId: activeChatId, messageId });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !socket) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit!');
      e.target.value = '';
      return;
    }
    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('send_file', {
          chatId: activeChatId,
          fileData: reader.result,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        });
        setUploadingFile(false);
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingFile(false);
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/search?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startChat = async (targetUserId) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/chats/private`, { targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchChats();
      setActiveChatId(res.data.id);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error starting chat:", err);
      fetchChats();
    }
  };

  if (!user) {
    return (
      <div 
        className={`flex items-center justify-center h-screen bg-gray-100 transition-colors duration-300 ${isDarkMode ? 'dark:bg-[#121212]' : ''}`}
        style={themeVars}
      >
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-96 border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="h-32 bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center relative">
            <h2 className="text-3xl font-black tracking-tight drop-shadow-md">
              I/O Chat
            </h2>
            <p className="text-sm font-medium text-white/95 mt-1">
              {isLogin ? "Welcome back!" : "Create an account"}
            </p>
          </div>
          <div className="p-8">
            {errorMsg && <p className="mb-4 text-sm text-red-500 font-semibold">{errorMsg}</p>}
            <form onSubmit={handleAuth} className="space-y-4">
              <input 
                type="email" 
                placeholder="Email" 
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
                required 
              />
              {!isLogin && (
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
                  required 
                />
              )}
              <input 
                type="password" 
                placeholder="Password" 
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-black dark:bg-[#2a2a2a] dark:text-white focus:outline-none focus:border-red-500"
                required 
              />
              <button 
                type="submit" 
                className="w-full py-3.5 text-white bg-red-600 hover:bg-red-700 font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {isLogin ? "Login" : "Register"}
              </button>
            </form>
            <p 
              className="mt-6 text-sm text-center text-red-600 hover:text-red-700 font-bold cursor-pointer transition-all hover:underline" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeChatData = chats.find(chat => chat.id === activeChatId) || { name: "Select a chat" };

  // Right panel derived data
  const sharedMedia = messages.filter(m => m.message_type === 'file' && m.file_type?.startsWith('image/')).slice(-9).reverse();
  const sharedFiles = messages.filter(m => m.message_type === 'file' && !m.file_type?.startsWith('image/') && !m.file_type?.startsWith('video/')).map(m => ({
    name: m.file_url || 'file',
    ext: (m.file_url || '').split('.').pop(),
    size: m.file_size,
    url: m.content
  }));
  const sharedLinks = Array.from(new Set(messages.flatMap(m => {
    if (!m.content || m.message_type === 'file') return [];
    const re = /https?:\/\/[\w\-\.\/~#?&=:%+]+/g;
    return m.content.match(re) || [];
  })));

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div 
      className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
      style={themeVars}
    >
      
      {/* --- FAR LEFT SIDEBAR --- */}
      <div className="flex flex-col items-center py-6 w-20 bg-gray-50 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 transition-colors shrink-0">
        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {/* Web Logo */}
          <div className="flex items-center justify-center w-12 h-12 cursor-pointer transition relative mb-2">
            <Image 
              src="/I-O_Logo2.png" 
              alt="Logo" 
              fill
              className="object-contain"
            />
          </div>

          {/* Chat / Messages Nav Icon */}
          <button 
            onClick={() => setCurrentView('chats')}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition ${currentView === 'chats' ? 'text-accent-600 bg-accent-100 dark:bg-[#3d1c1c] dark:text-accent-400' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20h1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </button>
          
          {/* Group Chat Nav Icon */}
          <button 
            onClick={() => setCurrentView('groups')}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition ${currentView === 'groups' ? 'text-accent-600 bg-accent-100 dark:bg-[#3d1c1c] dark:text-accent-400' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </button>

          {/* Archive Chat Nav Icon */}
          <button 
            onClick={() => setCurrentView('archive')}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition ${currentView === 'archive' ? 'text-accent-600 bg-accent-100 dark:bg-[#3d1c1c] dark:text-accent-400' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Settings / Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-xl transition"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          {/* Settings Nav Icon (General) */}
          <button 
            onClick={() => setCurrentView('settings')}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition ${currentView === 'settings' ? 'text-accent-600 bg-accent-100 dark:bg-[#3d1c1c] dark:text-accent-400' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>

          {/* User Avatar */}
          <div 
            onClick={() => handleViewUserProfile(user.id)}
            className="flex items-center justify-center w-10 h-10 mt-2 text-sm font-bold text-white bg-accent-600 rounded-full shadow-md cursor-pointer hover:bg-accent-700 transition"
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* --- CONDITIONAL VIEW AREA (Middle & Right) --- */}
      {currentView === 'settings' ? (
        <div className="flex-1 flex flex-col bg-[#f0f0f0] dark:bg-[#121212] overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Settings</h2>
            
            {/* Profile Section */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Profile</h3>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center justify-center w-24 h-24 text-4xl font-bold text-white bg-accent-600 rounded-full shadow-md shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{user.username}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.email || 'No email provided'}</p>
                    <div className="px-3 py-1.5 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 italic">
                      "{user.status || "Hey there! I am using I/O Chat."}"
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
                    <input 
                      type="text" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                    <input 
                      type="text" 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:border-accent-500"
                      placeholder="Enter your status"
                    />
                  </div>
                  <button type="submit" className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition shadow-sm hover:shadow-md duration-200">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>

            {/* Chat Settings Section */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Chat Settings</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Chat Wallpaper</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wallpaperTemplates.map(wp => (
                      <div 
                        key={wp.id} 
                        onClick={() => setSelectedWallpaper(wp.url)}
                        className={`aspect-video rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${selectedWallpaper === wp.url ? 'border-accent-600 scale-105 shadow-md' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                      >
                        {wp.url ? (
                          <img src={wp.url} alt="wallpaper" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#e8e6e1] dark:bg-[#121212] flex items-center justify-center">
                            <span className="text-xs text-gray-500">Default</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            </div>

            {/* Help & Feedback */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Help & Feedback</h3>
              <div className="space-y-4">
                <button className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Contact Us</button>
                <button className="block w-full text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Send Feedback</button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
               <button 
                 onClick={logout} 
                 className="w-full py-3.5 bg-accent-600 hover:bg-accent-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.99] duration-200"
               >
                 Log Out
               </button>
            </div>
          </div>
        </div>
      ) : (
      <>
        {currentView === 'groups' ? (
          <div className="flex flex-col w-72 md:w-80 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Groups</h2>
              <button onClick={() => { setShowNewChatModal(true); handleSearchUsers(""); }} className="w-8 h-8 flex items-center justify-center bg-accent-50 text-accent-600 rounded-full hover:bg-accent-100 dark:bg-[#3d1c1c] dark:hover:bg-accent-900 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const groupChats = chats.filter(chat => chat.type === 'group' && !chat.is_archived);
                return groupChats.length > 0 ? (
                  groupChats.map(group => (
                    <div
                      key={group.id}
                      className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${activeChatId === group.id ? 'bg-accent-50 dark:bg-[#3d1c1c] border-accent-100 dark:border-accent-900' : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800'}`}
                      onClick={() => setActiveChatId(group.id)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full shrink-0 hover:bg-gray-500 transition">
                        {(group.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold truncate text-gray-800 dark:text-gray-200">{group.name || 'Group Chat'}</h3>
                          <button
                            className="text-xs px-2 py-1 bg-accent-100 text-accent-600 rounded hover:bg-accent-200 transition"
                            onClick={(e) => { e.stopPropagation(); setGroupToEdit(group); setShowAddMemberModal(true); }}
                          >Add Members</button>
                        </div>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">{group.last_message || 'No messages yet'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">No groups found.</div>
                );
              })()}
            </div>
          </div>
        ) : currentView === 'archive' ? (
          <div className="flex flex-col w-72 md:w-80 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Archived Chats</h2>
            </div>
            
            <div className="relative p-4 pb-2">
              <input 
                type="text" 
                placeholder="Search archived..." 
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full p-2 pl-8 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-lg dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-accent-500 dark:focus:border-accent-500 font-medium"
              />
              <svg className="w-4 h-4 absolute left-6.5 top-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <div className="flex-1 overflow-y-auto">
              {(() => {
                const archivedChats = chats.filter(chat => {
                  if (!chat.is_archived) return false;
                  if (!chatSearchQuery) return true;
                  const searchLower = chatSearchQuery.toLowerCase();
                  const nameLower = (chat.name || '').toLowerCase();
                  const msgLower = (chat.last_message || '').toLowerCase();
                  return nameLower.includes(searchLower) || msgLower.includes(searchLower);
                });
                
                return archivedChats.length > 0 ? (
                  archivedChats.map((chat) => (
                    <div 
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
                      }}
                      className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${
                        activeChatId === chat.id 
                          ? 'bg-accent-50 dark:bg-[#3d1c1c] border-accent-100 dark:border-accent-900' 
                          : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (chat.type === 'private' && chat.other_user_id) {
                            handleViewUserProfile(chat.other_user_id);
                          } else if (chat.type === 'group') {
                            setViewingGroupProfile(chat);
                            fetchChatMembers(chat.id);
                          }
                        }}
                        className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full shrink-0 hover:bg-gray-500 transition"
                      >
                        {(chat.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className={`${chat.type === 'group' ? 'font-bold' : 'font-semibold'} truncate flex items-center gap-1.5 ${activeChatId === chat.id ? 'text-accent-700 dark:text-accent-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            {chat.name || 'Private Chat'}
                          </h3>
                          {chat.last_message_time && (
                            <span className="text-xs text-gray-400">
                              {new Date(new Date(chat.last_message_time).getTime() - 5 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400 mt-0.5">
                          {chat.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">No archived chats.</div>
                );
              })()}
            </div>
          </div>
        ) : (
        <div className="flex flex-col w-72 md:w-80 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
          
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
              <button 
                onClick={() => { setShowNewChatModal(true); handleSearchUsers(""); }}
                className="w-8 h-8 flex items-center justify-center bg-accent-50 text-accent-600 rounded-full hover:bg-accent-100 dark:bg-[#3d1c1c] dark:hover:bg-accent-900 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full p-2 pl-8 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-lg dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-accent-500 dark:focus:border-accent-500 font-medium"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <div className="flex gap-2">
               <button onClick={() => setChatFilter('time')} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${chatFilter==='time' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Time</button>
               <button onClick={() => setChatFilter('unread')} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${chatFilter==='unread' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Unread</button>
               <button onClick={() => setChatFilter('favorites')} className={`text-xs px-3 py-1.5 rounded-full transition-colors ${chatFilter==='favorites' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Favorites</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* EXISTING CHATS */}
            {(() => {
              const filteredChats = chats.filter(chat => {
                if (chat.is_archived) return false;

                // First filter by tab selection
                if (chatFilter === 'unread' && !(chat.unread_count > 0)) {
                  return false;
                }
                if (chatFilter === 'favorites' && !chat.is_favorite) {
                  return false;
                }

                // Then filter by search query
                if (!chatSearchQuery) return true;
                const searchLower = chatSearchQuery.toLowerCase();
                const nameLower = (chat.name || '').toLowerCase();
                const msgLower = (chat.last_message || '').toLowerCase();
                return nameLower.includes(searchLower) || msgLower.includes(searchLower);
              });
              
              return filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <div 
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      // Clear unread count locally for instant UI responsiveness
                      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
                    }}
                    className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${
                      activeChatId === chat.id 
                        ? 'bg-accent-50 dark:bg-[#3d1c1c] border-accent-100 dark:border-accent-900' 
                        : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chat.type === 'private' && chat.other_user_id) {
                          handleViewUserProfile(chat.other_user_id);
                        } else if (chat.type === 'group') {
                          setViewingGroupProfile(chat);
                          fetchChatMembers(chat.id);
                        }
                      }}
                      className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full shrink-0 hover:bg-gray-500 transition"
                    >
                      {(chat.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`${chat.type === 'group' ? 'font-bold' : 'font-semibold'} truncate flex items-center gap-1.5 ${activeChatId === chat.id ? 'text-accent-700 dark:text-accent-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {chat.name || 'Private Chat'}
                          {chat.is_favorite && (
                            <svg className="w-3.5 h-3.5 text-yellow-500 fill-current shrink-0" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          )}
                        </h3>
                        {chat.last_message_time && (
                          <span className="text-xs text-gray-400">
                            {new Date(new Date(chat.last_message_time).getTime() - 5 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate dark:text-gray-400 flex items-center justify-between gap-2 mt-0.5">
                        <span className="truncate">{chat.last_message || 'No messages yet'}</span>
                        {chat.unread_count > 0 && (
                          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold text-white bg-red-600 rounded-full shrink-0 animate-pulse">
                            {chat.unread_count}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">{chatSearchQuery ? 'No matching chats found.' : 'No chats yet.'}</p>
                  {!chatSearchQuery && <p className="text-xs mt-1">Tap the + icon to start!</p>}
                </div>
              );
            })()}
          </div>
        </div>
        )}

      {/* --- AREA CHAT KANAN --- */}
      <div 
        className="flex flex-col flex-1 bg-[#e8e6e1] dark:bg-[#121212] transition-colors bg-cover bg-center"
        style={selectedWallpaper ? { backgroundImage: `url(${selectedWallpaper})` } : {}}
      >
        
        <div 
          className="flex items-center gap-3 p-4 shadow-sm bg-white/50 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 cursor-pointer" 
          onClick={() => {
            setShowInfoPanel(!showInfoPanel);
          }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              // If it's a private chat, we can find the other member's ID from the chatMembers state
              if (activeChatData.type === 'private' && chatMembers.length > 0) {
                const otherMember = chatMembers.find(m => m.id !== user.id);
                if (otherMember) handleViewUserProfile(otherMember.id);
              } else if (activeChatData.type === 'group') {
                setViewingGroupProfile(activeChatData);
                fetchChatMembers(activeChatData.id);
              }
            }}
            className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full hover:opacity-80 transition"
          >
            {(activeChatData.name || 'P').charAt(0).toUpperCase()}
          </div>
          {/* Render nama kontak dinamis */}
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{activeChatData.name || 'Private Chat'}</h2>
        </div>

        {/* --- 4. MAPPING ISI PESAN --- */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} group relative mb-2`}>
              {msg.sender_id === user.id && msg.message_type !== 'deleted' && (
                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 self-center mr-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                  title="Delete message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <div className="flex flex-col max-w-md">
                {activeChatData.type === 'group' && msg.sender_id !== user.id && (
                  <span className="text-xs font-semibold text-accent-600 dark:text-accent-400 mb-1 px-1">
                    {msg.sender_username || `User #${msg.sender_id}`}
                  </span>
                )}
                <div className={`p-3 shadow-sm rounded-xl ${
                  msg.sender_id === user.id 
                    ? 'bg-accent-100 text-gray-800 dark:bg-[#6b2727] dark:text-white rounded-tr-sm' 
                    : 'bg-white text-gray-700 dark:bg-[#2a2a2a] dark:text-gray-200 rounded-tl-sm'
                }`}>
                {msg.message_type === 'deleted' ? (
                  <p className="text-sm italic text-gray-400 dark:text-gray-500 flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    message was deleted
                  </p>
                ) : msg.message_type === 'file' ? (
                  msg.file_type?.startsWith('image/') ? (
                    <div>
                      <img src={msg.content} alt={msg.file_url || 'image'} className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => setLightboxImg(msg.content)} />
                      <p className="text-xs mt-1 opacity-70">{msg.file_url}</p>
                    </div>
                  ) : msg.file_type?.startsWith('video/') ? (
                    <div>
                      <video src={msg.content} controls className="max-w-xs rounded-lg" />
                      <p className="text-xs mt-1 opacity-70">{msg.file_url}</p>
                    </div>
                  ) : (
                    <a href={msg.content} download={msg.file_url || 'file'} className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer no-underline">
                      <div className="w-10 h-10 flex items-center justify-center bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 rounded-lg text-xs font-bold">
                        {(msg.file_url || 'FILE').split('.').pop().toUpperCase().slice(0,4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{msg.file_url || 'file'}</p>
                        <p className="text-xs opacity-60">{formatFileSize(msg.file_size)}</p>
                      </div>
                      <svg className="w-5 h-5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </a>
                  )
                ) : (
                  <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                )}
                <span className="block mt-1 text-xs text-right text-gray-400 dark:text-gray-400">
                  {new Date(new Date(msg.created_at).getTime() - 5 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
          <div ref={messagesEndRef} />
        </div>

        {activeChatId && (
        <div className="flex items-center gap-3 p-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-gray-800 transition-colors">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="*/*" />
          <div className="relative">
            {showAttachMenu && (
              <div className="absolute left-0 z-10 w-40 overflow-hidden bg-white border border-gray-200 shadow-lg bottom-14 dark:bg-[#2a2a2a] dark:border-gray-700 rounded-xl">
                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => { setShowAttachMenu(false); fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}
                >
                  <svg className="w-5 h-5 mr-3 text-accent-600 dark:text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Image
                </button>
                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition border-t border-gray-100 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700"
                  onClick={() => { setShowAttachMenu(false); fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }}
                >
                  <svg className="w-5 h-5 mr-3 text-accent-600 dark:text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Video
                </button>
                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition border-t border-gray-100 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700"
                  onClick={() => { setShowAttachMenu(false); fileInputRef.current.accept = '*/*'; fileInputRef.current.click(); }}
                >
                  <svg className="w-5 h-5 mr-3 text-accent-600 dark:text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Document
                </button>
              </div>
            )}
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 transition ${uploadingFile ? 'text-accent-500 animate-pulse' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} disabled={uploadingFile}>
              <svg className="w-6 h-6 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>
          </div>
          
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-3 text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white focus:outline-none focus:border-accent-600 dark:focus:border-accent-500" 
            placeholder="Type a message"
          />
          
          <button onClick={handleSendMessage} className="p-3 text-white transition bg-accent-600 rounded-full dark:bg-accent-700 hover:bg-accent-700 dark:hover:bg-accent-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
        )}
      </div>

      {/* --- RIGHT INFORMATION PANEL --- */}
      {showInfoPanel && (
      <div className="hidden lg:flex flex-col w-80 max-w-xs bg-white dark:bg-[#080808] border-l border-gray-200 dark:border-gray-800 transition-colors">
        {/* User info header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full shrink-0">
            {(activeChatData.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{activeChatData.name || 'Chat'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Media, files and links</p>
          </div>
          <button onClick={() => setShowInfoPanel(false)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 divide-y divide-gray-200 dark:divide-gray-800" style={{minHeight:0}}>
          {/* Group members - Only for group chats */}
          {activeChatData.type === 'group' && (
          <section className="">
            <button onClick={() => toggleSection('members')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Group members ({chatMembers.length})</h4>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.members ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {expandedSections.members && (
              <div className="px-4 pb-4 space-y-3">
                {chatMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div 
                      onClick={() => handleViewUserProfile(member.id)}
                      className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-gray-400 rounded-full shrink-0 cursor-pointer hover:bg-gray-500 transition"
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{member.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.status || "No status"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          )}

          {/* Shared media */}
          <section className="">
            <button onClick={() => toggleSection('media')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared media ({sharedMedia.length})</h4>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.media ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {expandedSections.media && (
              <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                {sharedMedia.length > 0 ? sharedMedia.map((m, i) => (
                  <div key={i} className="w-full h-20 bg-gray-100 dark:bg-[#121212] border border-transparent dark:border-gray-800 rounded-md overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition" onClick={() => setLightboxImg(m.content)}>
                    <img src={m.content} alt="shared" className="object-cover w-full h-full" />
                  </div>
                )) : (
                  <div className="col-span-3 text-xs text-gray-400 text-center py-2">No media shared</div>
                )}
              </div>
            )}
          </section>

          {/* Shared files */}
          <section className="">
            <button onClick={() => toggleSection('files')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared files ({sharedFiles.length})</h4>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.files ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {expandedSections.files && (
              <div className="px-4 pb-4 space-y-3">
                {sharedFiles.length > 0 ? sharedFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-md text-sm font-semibold">{(f.ext || 'F').slice(0,3).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</div>
                      <div className="text-xs text-gray-400">{formatFileSize(f.size)}</div>
                    </div>
                    <a href={f.url} download={f.name} className="text-xs text-accent-600 hover:underline">Download</a>
                  </div>
                )) : (
                  <div className="text-xs text-gray-400 text-center py-2">No files shared</div>
                )}
              </div>
            )}
          </section>

          {/* Shared links */}
          <section className="">
            <button onClick={() => toggleSection('links')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared links ({sharedLinks.length})</h4>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.links ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {expandedSections.links && (
              <div className="px-4 pb-4 space-y-3">
                {sharedLinks.length > 0 ? sharedLinks.map((l, idx) => (
                  <a key={idx} href={l} target="_blank" rel="noreferrer" className="block text-sm text-accent-600 hover:underline truncate">
                    {l}
                  </a>
                )) : (
                  <div className="text-xs text-gray-400 text-center py-2">No links shared</div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
      )}
      </>
      )}

      {/* --- NEW CHAT / CREATE GROUP MODAL --- */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 dark:white">New Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition font-medium ${isCreatingGroup ? 'bg-accent-600 text-white hover:bg-accent-700' : 'bg-accent-50 dark:bg-[#3d1c1c] text-accent-600 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/60'}`}
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  {isCreatingGroup ? "Cancel Group Creation" : "Create New Group"}
              </button>
            </div>

            {/* User Search for Private Chat or Adding to new Group */}

            {isCreatingGroup && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
                <input 
                  type="text" 
                  placeholder="Group Name" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-3 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-xl dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-accent-500 dark:focus:border-accent-500 font-medium"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase">{selectedUsers.length} Selected (Max 50)</span>
                  <button 
                    onClick={createGroup}
                    disabled={selectedUsers.length === 0 || !groupName}
                    className="px-4 py-1.5 bg-accent-600 text-white text-xs font-bold rounded-lg hover:bg-accent-700 disabled:opacity-50"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search username or email (@gmail, etc)..." 
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full p-3 pl-10 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-xl dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-accent-500 dark:focus:border-accent-500 font-medium"
                />
                <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 ? searchResults.map(sUser => (
                <div 
                  key={sUser.id} 
                  onClick={() => { 
                    if (isCreatingGroup) {
                      toggleUserSelection(sUser.id);
                    } else {
                      startChat(sUser.id); 
                      setShowNewChatModal(false); 
                    }
                  }} 
                  className={`flex items-center gap-3 p-3 transition-colors rounded-xl mb-1 cursor-pointer ${
                    isCreatingGroup && selectedUsers.includes(sUser.id)
                    ? 'bg-accent-50 dark:bg-[#3d1c1c] border border-accent-200 dark:border-accent-900'
                    : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewUserProfile(sUser.id);
                    }}
                    className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-accent-600 rounded-full shrink-0 hover:bg-accent-700 transition"
                  >
                    {sUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{sUser.username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sUser.email}</p>
                  </div>
                  {isCreatingGroup && (
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      selectedUsers.includes(sUser.id) ? 'bg-accent-600 border-accent-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedUsers.includes(sUser.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>}
                    </div>
                  )}
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? "No users found in database." : "Type a name or email to search"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- IMAGE LIGHTBOX MODAL --- */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightboxImg(null)}>
          <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/40 rounded-full transition z-10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <img src={lightboxImg} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* --- ADD MEMBER TO GROUP MODAL --- */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-accent-600 text-white">
              <div>
                <h3 className="text-lg font-bold">Add Members</h3>
                <p className="text-xs opacity-80">Adding to {groupToEdit?.name}</p>
              </div>
              <button onClick={() => { setShowAddMemberModal(false); setSelectedUsers([]); setGroupToEdit(null); }} className="p-1 hover:bg-white/20 rounded-full transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search user to add..." 
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full p-3 pl-10 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-xl dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-accent-500 dark:focus:border-accent-500 font-medium"
                />
                <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">{selectedUsers.length} Selected</span>
                <button 
                  onClick={handleAddMembersToGroup}
                  disabled={selectedUsers.length === 0}
                  className="px-6 py-2 bg-accent-600 text-white text-sm font-bold rounded-xl hover:bg-accent-700 disabled:opacity-50 shadow-md transition"
                >
                  Add to Group
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searchResults.length > 0 ? searchResults.map(sUser => (
                <div 
                  key={sUser.id} 
                  onClick={() => toggleUserSelection(sUser.id)} 
                  className={`flex items-center gap-3 p-3 transition-colors rounded-xl mb-1 cursor-pointer ${
                    selectedUsers.includes(sUser.id)
                    ? 'bg-accent-50 dark:bg-[#3d1c1c] border border-accent-200 dark:border-accent-900'
                    : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-accent-600 rounded-full shrink-0">
                    {sUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{sUser.username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sUser.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedUsers.includes(sUser.id) ? 'bg-accent-600 border-accent-600' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedUsers.includes(sUser.id) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? "No users found." : "Type a name to search"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- USER PROFILE MODAL --- */}
      {viewingUserProfile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setViewingUserProfile(null)}>
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-r from-accent-500 to-accent-700">
              <button onClick={() => setViewingUserProfile(null)} className="absolute top-4 right-4 p-1.5 text-white bg-black/20 hover:bg-black/40 rounded-full transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="relative px-6 pb-8 text-center -mt-16 z-10">
              <div className="inline-flex items-center justify-center w-32 h-32 text-5xl font-bold text-white bg-accent-600 border-4 border-white dark:border-[#1e1e1e] rounded-full shadow-lg mb-4 relative z-20">
                {viewingUserProfile.username.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{viewingUserProfile.username}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{viewingUserProfile.email}</p>
              
              <div className="text-left space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">About Status</label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {viewingUserProfile.status || "Hey there! I am using I/O Chat."}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      startChat(viewingUserProfile.id);
                      setViewingUserProfile(null);
                    }}
                    className="flex-1 py-3 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition text-sm shrink-0"
                  >
                    Send Message
                  </button>
                  {(() => {
                    const userChat = chats.find(c => c.type === 'private' && c.other_user_id === viewingUserProfile.id);
                    const isArchived = userChat ? userChat.is_archived : false;
                    return (
                      <button 
                        onClick={() => handleToggleArchive(userChat?.id, viewingUserProfile.id, !isArchived)}
                        className={`flex-1 py-3 font-bold rounded-xl border transition text-sm shrink-0 ${
                          isArchived 
                            ? 'bg-accent-50 border-accent-200 text-accent-600 dark:bg-[#3d1c1c]/20 dark:border-accent-900/50 dark:text-accent-400 hover:bg-accent-100'
                            : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343434]'
                        }`}
                      >
                        {isArchived ? "Unarchive" : "Archive"}
                      </button>
                    );
                  })()}
                  {/* Toggle Favorite Button */}
                  {viewingUserProfile.id !== user.id && (
                    <button 
                      onClick={() => handleToggleFavorite(viewingUserProfile.id)}
                      className={`px-4 py-3 font-bold rounded-xl border transition flex items-center justify-center shrink-0 ${
                        viewingUserProfile.is_favorite 
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343434]'
                      }`}
                      title={viewingUserProfile.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <svg className={`w-5 h-5 ${viewingUserProfile.is_favorite ? 'fill-current text-yellow-500' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- GROUP PROFILE MODAL --- */}
      {viewingGroupProfile && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setViewingGroupProfile(null)}>
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-32 bg-gradient-to-r from-accent-500 to-accent-700">
              <button onClick={() => setViewingGroupProfile(null)} className="absolute top-4 right-4 p-1.5 text-white bg-black/20 hover:bg-black/40 rounded-full transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="relative px-6 pb-8 text-center -mt-16 z-10">
              <div className="inline-flex items-center justify-center w-32 h-32 text-5xl font-bold text-white bg-accent-600 border-4 border-white dark:border-[#1e1e1e] rounded-full shadow-lg mb-4 relative z-20">
                {(viewingGroupProfile.name || 'G').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{viewingGroupProfile.name || 'Group Chat'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{chatMembers.length} Members</p>
              
              <div className="text-left space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Group Members</label>
                  <div className="space-y-2">
                    {chatMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">{member.username}</span>
                        <span className="text-xs text-gray-400">{member.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setActiveChatId(viewingGroupProfile.id);
                      setViewingGroupProfile(null);
                    }}
                    className="flex-1 py-3 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition text-sm shrink-0"
                  >
                    Open Chat
                  </button>
                  {(() => {
                    const groupChat = chats.find(c => c.id === viewingGroupProfile.id);
                    const isArchived = groupChat ? groupChat.is_archived : false;
                    return (
                      <button 
                        onClick={() => handleToggleArchive(viewingGroupProfile.id, null, !isArchived)}
                        className={`flex-1 py-3 font-bold rounded-xl border transition text-sm shrink-0 ${
                          isArchived 
                            ? 'bg-accent-50 border-accent-200 text-accent-600 dark:bg-[#3d1c1c]/20 dark:border-accent-900/50 dark:text-accent-400 hover:bg-accent-100'
                            : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343434]'
                        }`}
                      >
                        {isArchived ? "Unarchive" : "Archive"}
                      </button>
                    );
                  })()}
                  {/* Toggle Group Favorite Button */}
                  <button 
                    onClick={() => handleToggleGroupFavorite(viewingGroupProfile.id)}
                    className={`px-4 py-3 font-bold rounded-xl border transition flex items-center justify-center shrink-0 ${
                      viewingGroupProfile.is_favorite 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900/50 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#343434]'
                    }`}
                    title={viewingGroupProfile.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <svg className={`w-5 h-5 ${viewingGroupProfile.is_favorite ? 'fill-current text-yellow-500' : 'stroke-current fill-none'}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}