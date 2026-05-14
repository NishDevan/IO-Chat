"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';

export default function IOChatApp() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [socket, setSocket] = useState(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Auth Layout States
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken);
    }
  }, []);

  const fetchMe = async (currentToken) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Auth failed", err);
      logout();
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchChats();
      const newSocket = io(BACKEND_URL, {
        auth: { token }
      });
      setSocket(newSocket);

      newSocket.on('receive_message', (msg) => {
        setMessages(prev => {
          // If we received a message for the currently active chat
          // wait, chat id matches? We need activeChatId inside the effect or use an updater pattern.
          return [...prev, msg];
        });
        fetchChats(); // Refresh chat list order/last msg
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
        setActiveChatId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeChatId && token) {
      fetchMessages(activeChatId);
      if (socket) {
        socket.emit('join_room', activeChatId);
      }
    }
  }, [activeChatId, token]);

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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      <div className={`flex items-center justify-center h-screen bg-gray-100 ${isDarkMode ? 'dark:bg-[#121212]' : ''}`}>
        <div className="p-8 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-lg w-96">
          <h2 className="mb-4 text-2xl font-bold dark:text-white text-center">
            I/O Chat Login
          </h2>
          {errorMsg && <p className="mb-4 text-sm text-red-500">{errorMsg}</p>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded text-black dark:bg-[#2a2a2a] dark:text-white dark:border-gray-700"
              required 
            />
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Username" 
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full p-2 border rounded text-black dark:bg-[#2a2a2a] dark:text-white dark:border-gray-700"
                required 
              />
            )}
            <input 
              type="password" 
              placeholder="Password" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded text-black dark:bg-[#2a2a2a] dark:text-white dark:border-gray-700"
              required 
            />
            <button type="submit" className="w-full p-2 text-white bg-red-600 rounded hover:bg-red-700">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  const activeChatData = chats.find(chat => chat.id === activeChatId) || { name: "Select a chat" };

  // Right panel derived data
  const sharedMedia = messages.filter(m => m.type === 'image' && (m.url || m.content)).slice(-9).reverse();
  const sharedFiles = messages.filter(m => m.file).map(m => ({
    name: m.file?.name || m.fileName || 'file',
    ext: (m.file?.name || m.fileName || '').split('.').pop(),
    size: m.file?.size,
    url: m.file?.url || '#'
  }));
  const sharedLinks = Array.from(new Set(messages.flatMap(m => {
    if (!m.content) return [];
    const re = /https?:\/\/[\w\-\.\/~#?&=:%+]+/g;
    return m.content.match(re) || [];
  })));

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- FAR LEFT SIDEBAR --- */}
      <div className="flex flex-col items-center py-6 w-20 bg-gray-50 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 transition-colors shrink-0">
        <div className="flex-1 flex flex-col items-center gap-6 w-full">
          {/* Web Logo */}
          <div className="flex items-center justify-center w-12 h-12 cursor-pointer transition relative mb-2">
            <Image 
              src="/I-O_Logo3.png" 
              alt="Logo" 
              fill
              className="object-contain"
            />
          </div>

          {/* Chat / Messages Nav Icon (Active) */}
          <button className="flex items-center justify-center w-12 h-12 text-red-600 bg-red-100 dark:bg-[#3d1c1c] dark:text-red-400 rounded-xl transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20h1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </button>
          
          {/* Group Chat Nav Icon */}
          <button className="flex items-center justify-center w-12 h-12 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-xl transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </button>

          {/* Archive Chat Nav Icon */}
          <button className="flex items-center justify-center w-12 h-12 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-xl transition">
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
          <button className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-xl transition">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>

          {/* User Avatar */}
          <div className="flex items-center justify-center w-10 h-10 mt-2 text-sm font-bold text-white bg-red-600 rounded-full shadow-md cursor-pointer hover:bg-red-700 transition">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* --- SIDEBAR KIRI (Chat List) --- */}
      <div className="flex flex-col w-72 md:w-80 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
        
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              className="w-full p-2 pl-9 text-sm text-gray-800 transition-colors bg-gray-100 border border-transparent rounded-lg dark:bg-[#2a2a2a] dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-red-500 dark:focus:border-red-500"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* SEARCH RESULTS */}
          {searchResults.length > 0 && (
            <div className="mb-2">
              <h4 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a]">Search Results</h4>
              {searchResults.map(sUser => (
                <div 
                  key={`search-${sUser.id}`}
                  onClick={() => startChat(sUser.id)}
                  className="flex items-center gap-3 p-3 transition-colors bg-white border-b cursor-pointer dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-red-600 rounded-full">
                    {sUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{sUser.username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click to chat</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EXISTING CHATS */}
          {chats.length > 0 && (
            <h4 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a]">Recent Chats</h4>
          )}
          {chats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex items-center gap-3 p-4 border-b cursor-pointer transition-colors ${
                activeChatId === chat.id 
                  ? 'bg-red-50 dark:bg-[#3d1c1c] border-red-100 dark:border-red-900' 
                  : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full shrink-0">
                {(chat.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${activeChatId === chat.id ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {chat.name || 'Private Chat'}
                </h3>
                <p className="text-sm text-gray-500 truncate dark:text-gray-400">{chat.last_message || 'No messages yet'}</p>
              </div>
            </div>
          ))}
          {chats.length === 0 && searchResults.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No chats yet.</p>
              <p className="text-xs mt-1">Search for a username above to start!</p>
            </div>
          )}
        </div>
      </div>

      {/* --- AREA CHAT KANAN --- */}
      <div className="flex flex-col flex-1 bg-[#e8e6e1] dark:bg-[#121212] transition-colors">
        
        <div className="flex items-center gap-3 p-4 shadow-sm bg-white/50 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-gray-400 rounded-full">
            {(activeChatData.name || 'P').charAt(0).toUpperCase()}
          </div>
          {/* Render nama kontak dinamis */}
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{activeChatData.name || 'Private Chat'}</h2>
        </div>

        {/* --- 4. MAPPING ISI PESAN --- */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 shadow-sm rounded-xl ${
                msg.sender_id === user.id 
                  ? 'bg-red-100 text-gray-800 dark:bg-[#6b2727] dark:text-white rounded-tr-sm' 
                  : 'bg-white text-gray-700 dark:bg-[#2a2a2a] dark:text-gray-200 rounded-tl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <span className="block mt-1 text-xs text-right text-gray-400 dark:text-gray-400">
                  {new Date(new Date(msg.created_at).getTime() - 5 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
        </div>

        {activeChatId && (
        <div className="flex items-center gap-3 p-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-gray-800 transition-colors">
          <div className="relative">
            {showAttachMenu && (
              <div className="absolute left-0 z-10 w-40 overflow-hidden bg-white border border-gray-200 shadow-lg bottom-14 dark:bg-[#2a2a2a] dark:border-gray-700 rounded-xl">
                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowAttachMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Image
                </button>
                <button 
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition border-t border-gray-100 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-700"
                  onClick={() => setShowAttachMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Video
                </button>
              </div>
            )}
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <svg className="w-6 h-6 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>
          </div>
          
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-3 text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white focus:outline-none focus:border-red-600 dark:focus:border-red-500" 
            placeholder="Type a message"
          />
          
          <button onClick={handleSendMessage} className="p-3 text-white transition bg-red-600 rounded-full dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
        )}
      </div>

      {/* --- RIGHT INFORMATION PANEL --- */}
      <div className="hidden lg:flex flex-col w-80 max-w-xs bg-white dark:bg-[#080808] border-l border-gray-200 dark:border-gray-800 transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Shared Info</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Media, files and links</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 divide-y divide-gray-200 dark:divide-gray-800" style={{minHeight:0}}>
          {/* Shared media */}
          <section className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared media</h4>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(sharedMedia.length > 0 ? sharedMedia : Array.from({length:6})).map((m, i) => (
                <div key={i} className="w-full h-20 bg-gray-100 dark:bg-[#121212] border border-transparent dark:border-gray-800 rounded-md overflow-hidden flex items-center justify-center">
                  {m?.url || m?.content ? (
                    // show image if available
                    <img src={m.url || m.content} alt="shared" className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-xs text-gray-400">No media</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Shared files */}
          <section className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared files</h4>
            <div className="mt-3 space-y-3">
              {sharedFiles.length > 0 ? sharedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-md text-sm font-semibold">{(f.ext || 'F').slice(0,3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.size ? `${f.size} bytes` : ''}</div>
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-xs text-red-600 hover:underline">Open</a>
                </div>
              )) : (
                <div className="text-xs text-gray-400">No files shared</div>
              )}
            </div>
          </section>

          {/* Shared links */}
          <section className="p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Shared links</h4>
            <div className="mt-3 space-y-3">
              {sharedLinks.length > 0 ? sharedLinks.map((l, idx) => (
                <a key={idx} href={l} target="_blank" rel="noreferrer" className="block text-sm text-red-600 hover:underline truncate">
                  {l}
                </a>
              )) : (
                <div className="text-xs text-gray-400">No links shared</div>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}