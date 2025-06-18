import React, { useState } from 'react';

export default function Sidebar({
  works,
  currentWorkId,
  setCurrentWorkId,
  darkMode,
  addNewWork,
  deleteWork,
  setWorks
}) {
  const handleTitleChange = (id, newTitle) => {
    if (!newTitle.trim()) return;

    setWorks((prev) =>
      prev.map((work) => (work.id === id ? { ...work, title: newTitle } : work))
    );
  };

  return (
    <aside className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-md h-full`}>
      <h3 className="font-bold text-lg mb-4">Произведения</h3>
      <ul className="space-y-2">
        {works.map((work) => (
          <li key={work.id} className="flex items-center space-x-2 group">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTitleChange(work.id, e.currentTarget.textContent)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className={`flex-1 px-2 py-1 rounded truncate outline-none ${
                currentWorkId === work.id
                  ? 'bg-blue-100 font-semibold'
                  : 'hover:bg-gray-200'
              }`}
              style={{
                backgroundColor:
                  currentWorkId === work.id ? (darkMode ? '#3b82f620' : '#bfdbfe') : '',
                fontWeight: currentWorkId === work.id ? 600 : 400
              }}
              onClick={() => setCurrentWorkId(work.id)}
            >
              {work.title}
            </div>

            <button
              onClick={() => deleteWork(work.id)}
              className="opacity-0 group-hover:opacity-100 text-sm text-red-500 hover:text-red-700 transition-opacity"
              title="Удалить"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={addNewWork}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
      >
        + Новое произведение
      </button>
    </aside>
  );
}
