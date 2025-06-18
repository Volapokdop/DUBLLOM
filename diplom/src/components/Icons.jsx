// Icons.jsx

import React from 'react';

export function BoldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8 4H4v6.092C4 10.51 4.336 11 4.868 11H8V4z" />
      <path d="M14 4h-4v6.092c0 .478.336.808.868.808h3.132V4z" />
      <path d="M3 13a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" />
    </svg>
  );
}

export function ItalicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 011 1v5.11a3 3 0 01-.879 2.121L8.262 13H14a1 1 0 010 2H6a1 1 0 01-1-1v-1a1 1 0 011-1h5.379L8.136 8.11A1 1 0 007.257 7H4a1 1 0 010-2h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function UnderlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17 11a1 1 0 01-1 1H4a1 1 0 010-2h12a1 1 0 011 1zM7 16a3 3 0 116 0H7z" />
    </svg>
  );
}
