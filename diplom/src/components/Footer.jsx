//Footer.jsx

import React from 'react';

export default function Footer({ darkMode }) {
  return (
    <footer className={`py-6 mt-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
      <div className="container mx-auto px-4 text-center text-gray-500">
        <p>© 2025 LitScript — Помощь в написании литературных текстов и сценариев</p>
      </div>
    </footer>
  );
}
