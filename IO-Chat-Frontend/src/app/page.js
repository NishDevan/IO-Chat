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

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- SIDEBAR KIRI --- */}
      <div className="flex flex-col w-1/3 max-w-sm bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800">
          <Image 
            src="/I-O_Logo.png" 
            alt="Logo I/O Chat" 
            width={175}
            height={32}
            className="object-contain w-auto h-8"
          />
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-gray-600 transition bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* --- 3. MAPPING DAFTAR KONTAK --- */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`p-4 border-b cursor-pointer transition-colors ${
                activeChatId === chat.id 
                  ? 'bg-red-50 dark:bg-[#3d1c1c] border-red-100 dark:border-red-900' 
                  : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800'
              }`}
            >
              <h3 className={`font-semibold ${activeChatId === chat.id ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {chat.name || 'Private Chat'}
              </h3>
              <p className="text-sm text-gray-500 truncate dark:text-gray-400">{chat.last_message || 'No messages yet'}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
           <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-gray-800 rounded-full dark:bg-gray-600">
              {user.username.charAt(0).toUpperCase()}
           </div>
           <button onClick={logout} className="text-sm text-red-500 cursor-pointer">Logout</button>
        </div>
      </div>

      {/* --- AREA CHAT KANAN --- */}
      <div className="flex flex-col flex-1 bg-[#e8e6e1] dark:bg-[#121212] transition-colors">
        
        <div className="flex items-center p-4 shadow-sm bg-white/50 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
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
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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

    </div>
  );
}