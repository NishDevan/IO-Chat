"use client";

import React, { useState, useEffect } from 'react';

export default function IOChatApp() {
  // State untuk mengatur tema (default: light)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Effect untuk menerapkan class 'dark' ke elemen <html> saat state berubah
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    // Wrapper utama: merespon class 'dark'
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* --- SIDEBAR KIRI --- */}
      <div className="flex flex-col w-1/3 max-w-sm bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 transition-colors">
        {/* Header Sidebar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-bold text-xl text-blue-600 dark:text-blue-500">I/O Chat</h1>
          
          {/* Tombol Toggle Tema */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {/* Daftar Chat */}
        <div className="flex-1 overflow-y-auto">
          {/* Kontak 1 */}
          <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-100 dark:border-gray-800 cursor-pointer">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Aridho</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Lorem ipsum dolor sit amet.</p>
          </div>
          {/* Kontak 2 */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer">
            <h3 className="font-semibold text-gray-400 dark:text-gray-500">Aidan</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 truncate">Lorem ipsum dolor sit amet.</p>
          </div>
        </div>

        {/* Profil Kamu di bawah Sidebar */}
        <div className="p-4 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800">
           <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
              N
           </div>
        </div>
      </div>

      {/* --- AREA CHAT KANAN --- */}
      {/* Background utama area chat disesuaikan dengan gambar referensi */}
      <div className="flex flex-col flex-1 bg-[#e8e6e1] dark:bg-[#121212] transition-colors">
        
        {/* Header Chat */}
        <div className="flex items-center p-4 bg-white/50 dark:bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">Aridho</h2>
        </div>

        {/* Area Bubble Chat */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* Bubble Kiri (Lawan Bicara) */}
          <div className="flex justify-start">
            <div className="max-w-md p-3 bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-200 rounded-xl rounded-tl-sm shadow-sm">
              <p className="text-sm">Lorem ipsum dolor sit amet.</p>
              <span className="block mt-1 text-xs text-right text-gray-400 dark:text-gray-500">16:00</span>
            </div>
          </div>

          {/* Bubble Kanan (Kamu) */}
          <div className="flex justify-end">
            <div className="max-w-md p-3 bg-[#d9e6fc] dark:bg-[#2b5278] text-gray-800 dark:text-white rounded-xl rounded-tr-sm shadow-sm">
              <p className="text-sm">Lorem ipsum dolor sit amet.</p>
              <span className="block mt-1 text-xs text-right text-gray-500 dark:text-gray-300">16:05</span>
            </div>
          </div>
        </div>

        {/* Area Input Pesan */}
        <div className="flex items-center gap-3 p-4 bg-[#f0f0f0] dark:bg-[#1e1e1e] border-t border-gray-300 dark:border-gray-800 transition-colors">
          {/* Ikon Attachment */}
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
            <svg className="w-6 h-6 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          
          {/* Input Teks */}
          <input 
            type="text"
            className="flex-1 p-3 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            placeholder="Type a message"
          />
          
          {/* Tombol Kirim */}
          <button className="p-3 text-white bg-blue-600 dark:bg-blue-500 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}