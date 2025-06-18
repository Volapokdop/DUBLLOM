// Header.jsx
import React from 'react';

export default function Header({ activePage, setActivePage, darkMode, onLogout }) {
  return (
    <header className={`py-4 px-6 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">LitScript</h1>
        <nav className="flex space-x-4">
          <button
            onClick={() => setActivePage('editor')}
            className={activePage === 'editor'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-blue-500'
            }
          >
            Редактор
          </button>

          {/* 🔥 Новая кнопка: Сценарий */}
          <button
            onClick={() => setActivePage('script')}
            className={activePage === 'script'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-blue-500'
            }
          >
            Сценарий
          </button>

          <button
            onClick={() => setActivePage('cards')}
            className={activePage === 'cards'
              ? 'text-blue-500 font-semibold'
              : 'hover:text-blue-500'
            }
          >
            Карточки
          </button>
          <button
            onClick={onLogout}
            className="text-red-500 hover:text-red-700"
          >
            Выход
          </button>
        </nav>
      </div>
    </header>
  );
}
