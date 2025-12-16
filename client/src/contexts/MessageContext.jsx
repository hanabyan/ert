import { createContext, useContext } from 'react';
import { App } from 'antd';

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
    const { message, notification, modal } = App.useApp();

    return (
        <MessageContext.Provider value={{ message, notification, modal }}>
            {children}
        </MessageContext.Provider>
    );
};

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within MessageProvider');
    }
    return context;
};
