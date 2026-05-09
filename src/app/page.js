"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

{/* Data Dummy */}
const DUMMY_CHATS = [
  {
    id: 1,
    name: "Aridho",
    lastMessage: "Nice",
    messages: [
      { id: 101, text: "Infomas", sender: "them", time: "10:00" },
      { id: 102, text: "Amans", sender: "me", time: "10:05" },
      { id: 103, text: "Nice", sender: "them", time: "10:06" }
    ]
  },
  {
    id: 2,
    name: "Aidan",
    lastMessage: "Mantap ye",
    messages: [
      { id: 201, text: "Mikum, udh aman ye", sender: "me", time: "09:00" },
      { id: 202, text: "Yoi", sender: "them", time: "09:15" },
      { id: 203, text: "Mantap ye", sender: "me", time: "09:15" }
    ]
  },
];

export default function IOChatApp() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeChatId, setActiveChatId] = useState(DUMMY_CHATS[0].id);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activeChatData = DUMMY_CHATS.find(chat => chat.id === activeChatId);

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
          {DUMMY_CHATS.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              // Beri warna latar belakang berbeda jika chat ini sedang aktif
              className={`p-4 border-b cursor-pointer transition-colors ${
                activeChatId === chat.id 
                  ? 'bg-red-50 dark:bg-[#3d1c1c] border-red-100 dark:border-red-900' // Styling saat aktif
                  : 'bg-white dark:bg-[#1e1e1e] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-100 dark:border-gray-800' // Styling biasa
              }`}
            >
              <h3 className={`font-semibold ${activeChatId === chat.id ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {chat.name}
              </h3>
              <p className="text-sm text-gray-500 truncate dark:text-gray-400">{chat.lastMessage}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
           <div className="flex items-center justify-center w-10 h-10 font-bold text-white bg-gray-800 rounded-full dark:bg-gray-600">
              N
           </div>
        </div>
      </div>

      {/* --- AREA CHAT KANAN --- */}
      <div className="flex flex-col flex-1 bg-[#e8e6e1] dark:bg-[#121212] transition-colors">
        
        <div className="flex items-center p-4 shadow-sm bg-white/50 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          {/* Render nama kontak dinamis */}
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{activeChatData.name}</h2>
        </div>

        {/* --- 4. MAPPING ISI PESAN --- */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {activeChatData.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 shadow-sm rounded-xl ${
                msg.sender === 'me' 
                  ? 'bg-red-100 text-gray-800 dark:bg-[#6b2727] dark:text-white rounded-tr-sm' 
                  : 'bg-white text-gray-700 dark:bg-[#2a2a2a] dark:text-gray-200 rounded-tl-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="block mt-1 text-xs text-right text-gray-400 dark:text-gray-400">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Area Input Pesan (Tetap sama seperti sebelumnya) */}
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
          
          <input type="text" className="flex-1 p-3 text-gray-800 transition-colors bg-white border border-gray-300 rounded-lg dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white focus:outline-none focus:border-red-600 dark:focus:border-red-500" placeholder="Type a message"/>
          
          <button className="p-3 text-white transition bg-red-600 rounded-full dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>

    </div>
  );
}