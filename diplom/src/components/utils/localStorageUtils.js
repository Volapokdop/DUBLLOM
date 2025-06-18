//localStorageUtils.js

import { localStorageKeys } from '../constants';

const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Ошибка сохранения в localStorage под ключом ${key}:`, error);
  }
};

const loadFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Ошибка чтения из localStorage под ключом ${key}:`, error);
    return null;
  }
};

const clearLocalStorage = () => {
  localStorage.clear();
};

export { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage };
