import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import ChatView from "./ChatView";

const CHAT_BOX_STYLES = {
  flex: { xs: "1 1 100%", md: "1 1 70%" },
};

const NO_CHAT_MESSAGE_STYLES = {
  variant: "h6",
  color: "text.secondary",
  sx: { mt: 4, textAlign: "center" },
};

const ChatPanel = ({
  currentUserId,
  selectedConversationId,
  groupChats,
  conversations,
  friends,
  authData,
  onSendMessage,
  onMarkRead,
  onDeleteMessage,
  token,
  fetchMessagesList,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  messages,
  setMessages,
  sendNewMessage,
  sendMediaMessage,
  markMessageRead,
  updateExistingMessage,
  deleteExistingMessage,
  createNewConversation,
  updateExistingConversation,
  deleteExistingConversation,
  createNewGroupChat,
  updateExistingGroupChat,
  deleteExistingGroupChat,
  loadConversations,
  loadGroupChats,
  loadInitialData,
}) => {
  const getRecipient = useCallback(() => {
    if (!selectedConversationId) return null;
    const id = selectedConversationId.startsWith("group:")
      ? selectedConversationId.slice(6)
      : selectedConversationId;

    if (selectedConversationId.startsWith("group:")) {
      return groupChats.find((g) => g.group_id === id) || null;
    }
    const conversation = conversations.find((c) => c.conversation_id === id);
    if (conversation) return conversation;

    const friend = friends.find((f) => f.anonymous_id === id);
    return friend
      ? {
          conversation_id: `${authData.anonymous_id}-${friend.anonymous_id}`,
          user1: authData.anonymous_id,
          user2: friend.anonymous_id,
          username: friend.username,
        }
      : null;
  }, [selectedConversationId,  groupChats, conversations, friends, authData]);

  const recipient = getRecipient();
console.log('SelectedConversationId:', selectedConversationId);
console.log('Recipient:', recipient);

  return (
    <Box sx={CHAT_BOX_STYLES}>
      {selectedConversationId && recipient ? (
        <ChatView
          currentUserId={currentUserId}
          recipient={recipient}
          onSendMessage={onSendMessage}
          onMarkRead={onMarkRead}
          onDeleteMessage={onDeleteMessage}
          token={token}
          fetchMessagesList={fetchMessagesList}
          pendingMediaList={pendingMediaList}
          setPendingMediaFile={setPendingMediaFile}
          clearPendingMedia={clearPendingMedia}
          isGroupChat={selectedConversationId.startsWith("group:")}
          friends={friends}
          messages={messages}
          setMessages={setMessages}
          sendNewMessage={sendNewMessage}
          sendMediaMessage={sendMediaMessage}
          markMessageRead={markMessageRead}
          updateExistingMessage={updateExistingMessage}
          deleteExistingMessage={deleteExistingMessage}
          createNewConversation={createNewConversation}
          updateExistingConversation={updateExistingConversation}
          deleteExistingConversation={deleteExistingConversation}
          createNewGroupChat={createNewGroupChat}
          updateExistingGroupChat={updateExistingGroupChat}
          deleteExistingGroupChat={deleteExistingGroupChat}
          loadConversations={loadConversations}
          loadGroupChats={loadGroupChats}
          loadInitialData={loadInitialData}
        />
      ) : (
        <Typography {...NO_CHAT_MESSAGE_STYLES}>
          Select a conversation to start chatting
        </Typography>
      )}
    </Box>
  );
};

ChatPanel.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  selectedConversationId: PropTypes.string,
  groupChats: PropTypes.array,
  conversations: PropTypes.array,
  friends: PropTypes.array,
  authData: PropTypes.object.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  messages: PropTypes.array,
  setMessages: PropTypes.func.isRequired,
  sendNewMessage: PropTypes.func.isRequired,
  sendMediaMessage: PropTypes.func.isRequired,
  markMessageRead: PropTypes.func.isRequired,
  updateExistingMessage: PropTypes.func.isRequired,
  deleteExistingMessage: PropTypes.func.isRequired,
  createNewConversation: PropTypes.func.isRequired,
  updateExistingConversation: PropTypes.func.isRequired,
  deleteExistingConversation: PropTypes.func.isRequired,
  createNewGroupChat: PropTypes.func.isRequired,
  updateExistingGroupChat: PropTypes.func.isRequired,
  deleteExistingGroupChat: PropTypes.func.isRequired,
  loadConversations: PropTypes.func.isRequired,
  loadGroupChats: PropTypes.func.isRequired,
  loadInitialData: PropTypes.func.isRequired,
};

ChatPanel.defaultProps = {
  groupChats: [],
  conversations: [],
  friends: [],
  messages: [],
  pendingMediaList: [],
};

export default ChatPanel;
