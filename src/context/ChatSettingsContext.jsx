import React, { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

const ChatSettingsContext = createContext();

export const useChatSettings = () => {
  const context = useContext(ChatSettingsContext);
  if (!context) {
    throw new Error("useChatSettings must be used within a ChatSettingsProvider");
  }
  return context;
};

export const ChatSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    videoShape: "square",
    chatBackground: "default",
  });

  return (
    <ChatSettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </ChatSettingsContext.Provider>
  );
};

ChatSettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};