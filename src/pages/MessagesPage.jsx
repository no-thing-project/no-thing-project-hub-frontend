import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Snackbar, Typography, Button } from "@mui/material";
import { GroupAdd } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useMessages from "../hooks/useMessages";
import useSocial from "../hooks/useSocial";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import ConversationsList from "../components/Messages/ConversationsList";
import ChatView from "../components/Messages/ChatView";
import GroupChatModal from "../components/Messages/GroupChatModal";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    messages,
    setMessages,
    groupChats,
    loading: messagesLoading,
    error: messagesError,
    pendingMediaList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    deleteExistingMessage,
    createNewGroupChat,
    deleteExistingGroupChat,
    deleteExistingConversation,
    fetchMessagesList,
    refreshMessages,
  } = useMessages(token, authData?.anonymous_id, handleLogout, navigate);
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [success, setSuccess] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token && !socialLoading && friends.length === 0) {
      getFriends();
    }
  }, [isAuthenticated, token, socialLoading, friends, getFriends]);

  const handleMarkRead = useCallback(
    async (messageId) => {
      try {
        await markMessageRead(messageId);
        setSuccess("Message marked as read!");
      } catch (err) {
        showNotification(err.message || "Failed to mark as read", "error");
      }
    },
    [markMessageRead, showNotification]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        await deleteExistingMessage(messageId);
        setSuccess("Message deleted!");
        refreshMessages();
      } catch (err) {
        showNotification(err.message || "Failed to delete message", "error");
      }
    },
    [deleteExistingMessage, showNotification, refreshMessages]
  );

  const handleCreateGroup = useCallback(
    async (name, members) => {
      try {
        const group = await createNewGroupChat(name, members);
        setSuccess(`Group ${group.name} created!`);
        setGroupModalOpen(false);
        refreshMessages();
      } catch (err) {
        showNotification(err.message || "Failed to create group", "error");
      }
    },
    [createNewGroupChat, showNotification, refreshMessages]
  );

  const handleSendMessage = useCallback(
    async (messageData) => {
      try {
        await sendMediaMessage(messageData);
        refreshMessages();
      } catch (err) {
        showNotification(err.message || "Failed to send message", "error");
      }
    },
    [sendMediaMessage, showNotification, refreshMessages]
  );

  const recipient = React.useMemo(() => {
    if (!selectedConversationId) return null;
    const id = selectedConversationId.startsWith("group:") ? selectedConversationId.slice(6) : selectedConversationId;
    return selectedConversationId.startsWith("group:")
      ? groupChats.find((g) => g.group_id === id)
      : friends.find((f) => f.anonymous_id === id) || null;
  }, [selectedConversationId, groupChats, friends]);

  if (authLoading || messagesLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle="Messages">
      <Box sx={{ maxWidth: { xs: "100%", md: 1500 }, margin: "0 auto", p: { xs: 1, md: 2 } }}>
        <ProfileHeader user={authData} isOwnProfile />
        {messagesError && <Alert severity="error" sx={{ mt: 2 }}>{messagesError}</Alert>}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" startIcon={<GroupAdd />} onClick={() => setGroupModalOpen(true)}>
            Create Group Chat
          </Button>
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, maxWidth: { md: "400px" } }}>
            <ConversationsList
              messages={messages}
              groupChats={groupChats}
              friends={friends}
              currentUserId={authData.anonymous_id}
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
              onDeleteGroupChat={deleteExistingGroupChat}
              onDeleteConversation={deleteExistingConversation}
            />
          </Box>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 70%" } }}>
            {selectedConversationId ? (
              <ChatView
                currentUserId={authData.anonymous_id}
                recipient={recipient}
                onSendMessage={sendNewMessage}
                onSendMediaMessage={handleSendMessage}
                onMarkRead={handleMarkRead}
                onDeleteMessage={handleDeleteMessage}
                token={token}
                fetchMessagesList={fetchMessagesList}
                pendingMediaList={pendingMediaList}
                setPendingMediaFile={setPendingMediaFile}
                clearPendingMedia={clearPendingMedia}
                isGroupChat={selectedConversationId.startsWith("group:")}
                friends={friends}
                setMessages={setMessages} // Додаємо для синхронізації
              />
            ) : (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
                Select a conversation to start chatting
              </Typography>
            )}
          </Box>
        </Box>
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setSuccess("")}>{success}</Alert>
        </Snackbar>
        <GroupChatModal
          open={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          friends={friends}
          currentUserId={authData.anonymous_id}
          onCreate={handleCreateGroup}
        />
      </Box>
    </AppLayout>
  );
};

export default MessagesPage;