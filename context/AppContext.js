// context/AppContext.js
import { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [history, setHistory] = useState([]);

    const addToHistory = (entry) => {
        setHistory(prev => [...prev, entry]);
    };

    return (
        <AppContext.Provider value={{ history, addToHistory }}>
            {children}
        </AppContext.Provider>
    );
};
