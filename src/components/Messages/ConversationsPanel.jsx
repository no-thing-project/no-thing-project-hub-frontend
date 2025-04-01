import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import ConversationsList from "./ConversationsList";

const CONVERSATIONS_BOX_STYLES = {
  flex: { xs: "1 1 100%", md: "1 1 30%" },
  maxWidth: { md: "400px" },
};

const ConversationsPanel = ({
  messages,
  groupChats,
  conversations,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  onDeleteGroupChat,
  onDeleteConversation,
  isLoading,
  createNewConversation,
}) => (
  <Box sx={CONVERSATIONS_BOX_STYLES}>
    <ConversationsList
      messages={messages}
      groupChats={groupChats}
      conversations={conversations}
      friends={friends}
      currentUserId={currentUserId}
      onSelectConversation={onSelectConversation}
      selectedConversationId={selectedConversationId}
      onDeleteGroupChat={onDeleteGroupChat}
      onDeleteConversation={onDeleteConversation}
      isLoading={isLoading}
      createNewConversation={createNewConversation}
    />
  </Box>
);

ConversationsPanel.propTypes = {
  messages: PropTypes.array,
  groupChats: PropTypes.array,
  conversations: PropTypes.array,
  friends: PropTypes.array,
  currentUserId: PropTypes.string.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversationId: PropTypes.string,
  onDeleteGroupChat: PropTypes.func.isRequired,
  onDeleteConversation: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  createNewConversation: PropTypes.func.isRequired,
};

ConversationsPanel.defaultProps = {
  messages: [],
  groupChats: [],
  conversations: [],
  friends: [],
  isLoading: false,
};

export default ConversationsPanel;
