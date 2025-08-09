import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { OwlGuide } from '@/components/OwlGuide';

interface OwlMessage {
  id: string;
  message: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoClose?: boolean;
  delay?: number;
}

interface OwlContextType {
  showOwlMessage: (message: Omit<OwlMessage, 'id'>) => void;
  hideOwlMessage: (id: string) => void;
  hideAllMessages: () => void;
}

const OwlContext = createContext<OwlContextType | undefined>(undefined);

export const useOwlGuide = () => {
  const context = useContext(OwlContext);
  if (!context) {
    throw new Error('useOwlGuide must be used within an OwlGuideProvider');
  }
  return context;
};

interface OwlGuideProviderProps {
  children: ReactNode;
}

export const OwlGuideProvider: React.FC<OwlGuideProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<OwlMessage[]>([]);

  const showOwlMessage = useCallback((messageData: Omit<OwlMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: OwlMessage = {
      id,
      ...messageData,
      autoClose: messageData.autoClose ?? true,
      delay: messageData.delay ?? 8000,
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto-remove if autoClose is enabled
    if (newMessage.autoClose) {
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
      }, newMessage.delay);
    }
  }, []);

  const hideOwlMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const hideAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const contextValue = useMemo(() => ({
    showOwlMessage,
    hideOwlMessage,
    hideAllMessages
  }), [showOwlMessage, hideOwlMessage, hideAllMessages]);

  return (
    <OwlContext.Provider value={contextValue}>
      {children}
      {messages.map(message => (
        <OwlGuide
          key={message.id}
          message={message.message}
          position={message.position}
          visible={true}
          onClose={() => hideOwlMessage(message.id)}
          autoClose={false} // Handled by provider
        />
      ))}
    </OwlContext.Provider>
  );
};