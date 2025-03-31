import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Button, Typography } from "@mui/material";
import { GroupAdd } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useMessages from "../hooks/useMessages";
import useConversations from "../hooks/useConversations";
import useGroupChats from "../hooks/useGroupChats";
import useSocial from "../hooks/useSocial";
import useChatData from "../hooks/useChatData"; // Додаємо useChatData
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import ConversationsList from "../components/Messages/ConversationsList";
import ChatView from "../components/Messages/ChatView";
import GroupChatModal from "../components/Messages/GroupChatModal";
import { ChatSettingsProvider } from "../context/ChatSettingsContext";

const LAYOUT_STYLES = {
  maxWidth: { xs: "100%", md: 1500 },
  margin: "0 auto",
  p: { xs: 1, md: 2 },
};

const FLEX_CONTAINER_STYLES = {
  display: "flex",
  flexDirection: { xs: "column", md: "row" },
  gap: 2,
};

const CONVERSATIONS_BOX_STYLES = {
  flex: { xs: "1 1 100%", md: "1 1 30%" },
  maxWidth: { md: "400px" },
};

const CHAT_BOX_STYLES = {
  flex: { xs: "1 1 100%", md: "1 1 70%" },
};

const GROUP_BUTTON_STYLES = {
  display: "flex",
  justifyContent: "flex-end",
  mb: 2,
};

const NO_CHAT_MESSAGE_STYLES = {
  variant: "h6",
  color: "text.secondary",
  sx: { mt: 4, textAlign: "center" },
};

const MessagesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);

  // Використовуємо всі хуки
  const {
    messages,
    setMessages,
    loading: messagesLoading,
    error: messagesError,
    pendingMediaList,
    fetchMessagesList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    updateExistingMessage,
    deleteExistingMessage,
  } = useMessages(token, handleLogout, navigate);

  const {
    conversations,
    setConversations,
    loading: convLoading,
    error: convError,
    loadConversations,
    createNewConversation,
    updateExistingConversation,
    deleteExistingConversation,
  } = useConversations(token, handleLogout, navigate);

  const {
    groupChats,
    setGroupChats,
    loading: groupLoading,
    error: groupError,
    loadGroupChats,
    createNewGroupChat,
    updateExistingGroupChat,
    deleteExistingGroupChat,
  } = useGroupChats(token, handleLogout, navigate);

  const { friends, getFriends, loading: socialLoading, error: socialError } = useSocial(
    token,
    handleLogout,
    navigate
  );

  const {
    loadInitialData, // Додаємо loadInitialData з useChatData для глобального завантаження
  } = useChatData(token, handleLogout, navigate);

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [success, setSuccess] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  // Завантажуємо друзів, якщо їх немає
  useEffect(() => {
    if (isAuthenticated && token && !socialLoading && friends.length === 0) {
      getFriends();
    }
  }, [isAuthenticated, token, socialLoading, friends.length, getFriends]);

  // Дебагінг стану завантаження
  useEffect(() => {
    console.log({
      authLoading,
      messagesLoading,
      convLoading,
      groupLoading,
      socialLoading,
    });
  }, [authLoading, messagesLoading, convLoading, groupLoading, socialLoading]);

  // Завантажуємо початкові дані через useChatData
  useEffect(() => {
    if (isAuthenticated && token) {
      loadInitialData(); // Завантажуємо всі дані (повідомлення, розмови, групи)
    }
  }, [isAuthenticated, token, loadInitialData]);

  const handleCreateGroup = useCallback(
    async (name, members) => {
      try {
        const group = await createNewGroupChat(name, [...members, authData.anonymous_id]);
        if (group) {
          setSuccess(`Group ${group.name} created!`);
          setGroupModalOpen(false);
          showNotification(`Group ${group.name} created!`, "success");
        }
      } catch (err) {
        showNotification(err?.message || "Failed to create group", "error");
      }
    },
    [createNewGroupChat, authData?.anonymous_id, showNotification]
  );

  const handleSendMessage = useCallback(
    async (messageData) => {
      try {
        const result = await sendMediaMessage(messageData);
        if (result) {
          setSuccess("Message sent!");
          showNotification("Message sent!", "success");
        }
      } catch (err) {
        showNotification(err?.message || "Failed to send message", "error");
      }
    },
    [sendMediaMessage, showNotification]
  );

  const handleMarkRead = useCallback(
    async (messageId) => {
      try {
        await markMessageRead(messageId);
        setSuccess("Message marked as read!");
        showNotification("Message marked as read!", "success");
      } catch (err) {
        showNotification(err?.message || "Failed to mark as read", "error");
      }
    },
    [markMessageRead, showNotification]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        await deleteExistingMessage(messageId);
        setSuccess("Message deleted!");
        showNotification("Message deleted!", "success");
      } catch (err) {
        showNotification(err?.message || "Failed to delete message", "error");
      }
    },
    [deleteExistingMessage, showNotification]
  );

  const getRecipient = useCallback(() => {
    if (!selectedConversationId) return null;
    const id = selectedConversationId.startsWith("group:") ? selectedConversationId.slice(6) : selectedConversationId;
    if (selectedConversationId.startsWith("group:")) return groupChats.find((g) => g.group_id === id) || null;
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
  }, [selectedConversationId, groupChats, conversations, friends, authData]);

  const recipient = getRecipient();

  // Умова для лоадера
  if (authLoading || messagesLoading.initial || convLoading.initial || groupLoading.initial) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ChatSettingsProvider>
        <Box sx={LAYOUT_STYLES}>
          <ProfileHeader user={authData} isOwnProfile />
          {(messagesError || convError || groupError || socialError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {messagesError || convError || groupError || socialError}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          <Box sx={GROUP_BUTTON_STYLES}>
            <Button
              variant="contained"
              startIcon={<GroupAdd />}
              onClick={() => setGroupModalOpen(true)}
              disabled={friends.length === 0 || messagesLoading.action}
            >
              Create Group Chat
            </Button>
          </Box>
          <Box sx={FLEX_CONTAINER_STYLES}>
            <Box sx={CONVERSATIONS_BOX_STYLES}>
              <ConversationsList
                messages={messages}
                groupChats={groupChats}
                conversations={conversations}
                friends={friends}
                currentUserId={authData.anonymous_id}
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId}
                onDeleteGroupChat={deleteExistingGroupChat}
                onDeleteConversation={deleteExistingConversation}
                isLoading={socialLoading}
              />
            </Box>
            <Box sx={CHAT_BOX_STYLES}>
              {selectedConversationId && recipient ? (
                <ChatView
                  currentUserId={authData.anonymous_id}
                  recipient={recipient}
                  onSendMessage={handleSendMessage}
                  onMarkRead={handleMarkRead}
                  onDeleteMessage={handleDeleteMessage}
                  token={token}
                  fetchMessagesList={fetchMessagesList}
                  pendingMediaList={pendingMediaList}
                  setPendingMediaFile={setPendingMediaFile}
                  clearPendingMedia={clearPendingMedia}
                  isGroupChat={selectedConversationId.startsWith("group:")}
                  friends={friends}
                  messages={messages}
                  setMessages={setMessages}
                  // Передаємо методи з хуків для повного контролю
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
                  loadInitialData={loadInitialData} // Додаємо для глобального оновлення
                />
              ) : (
                <Typography {...NO_CHAT_MESSAGE_STYLES}>Select a conversation to start chatting</Typography>
              )}
            </Box>
          </Box>
          <GroupChatModal
            open={groupModalOpen}
            onClose={() => setGroupModalOpen(false)}
            friends={friends}
            currentUserId={authData.anonymous_id}
            onCreate={handleCreateGroup}
          />
        </Box>
      </ChatSettingsProvider>
    </AppLayout>
  );
};

export default MessagesPage;