import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Snackbar, Typography, Button, TextField } from "@mui/material";
import { GroupAdd, Search } from "@mui/icons-material";
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
    conversations,
    groupChats,
    messages,
    loading: messagesLoading,
    error: messagesError,
    pendingMedia,
    sendNewMessage,
    sendMediaMessage,
    addPendingMedia,
    clearPendingMedia,
    fetchConversationMessages,
    markRead,
    deleteMsg,
    editMsg,
    searchMsgs,
    createNewConversation,
    createNewGroupChat,
    deleteGroup,
    deleteConv,
    refresh,
  } = useMessages(token, authData?.anonymous_id, handleLogout, navigate);
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [success, setSuccess] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [friendsFetched, setFriendsFetched] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token || socialLoading || friendsFetched || friends.length > 0) return;
    const fetchFriends = async () => {
      try {
        await getFriends();
        setFriendsFetched(true);
      } catch (err) {
        showNotification("Failed to load friends list", "error");
      }
    };
    fetchFriends();
  }, [isAuthenticated, token, socialLoading, friends, friendsFetched, getFriends, showNotification]);

  const handleMarkRead = useCallback(
    async (messageId) => {
      try {
        await markRead(messageId);
        setSuccess("Message marked as read!");
      } catch (err) {
        showNotification(err.message || "Failed to mark as read", "error");
      }
    },
    [markRead, showNotification]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        await deleteMsg(messageId);
        setSuccess("Message deleted!");
      } catch (err) {
        showNotification(err.message || "Failed to delete message", "error");
      }
    },
    [deleteMsg, showNotification]
  );

  const handleEditMessage = useCallback(
    async (messageId, newContent) => {
      try {
        await editMsg(messageId, newContent);
        setSuccess("Message edited!");
      } catch (err) {
        showNotification(err.message || "Failed to edit message", "error");
      }
    },
    [editMsg, showNotification]
  );

  const handleCreateGroup = useCallback(
    async (name, members) => {
      try {
        const group = await createNewGroupChat(name, members);
        setSuccess(`Group ${group.name} created!`);
        setGroupModalOpen(false);
      } catch (err) {
        showNotification(err.message || "Failed to create group", "error");
      }
    },
    [createNewGroupChat, showNotification]
  );

  const handleSendMessage = useCallback(
    async ({ conversationId, content, mediaFiles = [], replyTo }) => {
      try {
        await sendMediaMessage(conversationId, content, mediaFiles, replyTo);
        setSuccess("Message sent!");
      } catch (err) {
        showNotification(err.message || "Failed to send message", "error");
      }
    },
    [sendMediaMessage, showNotification]
  );

  const handleSearch = useCallback(
    async (conversationId) => {
      if (!searchQuery || !conversationId) {
        refresh();
        return;
      }
      try {
        const results = await searchMsgs(conversationId, searchQuery);
        return results; // Використовуйте результати пошуку у компоненті ChatView
      } catch (err) {
        showNotification(err.message || "Failed to search messages", "error");
      }
    },
    [searchQuery, searchMsgs, refresh, showNotification]
  );

  const recipient = useMemo(() => {
    if (!selectedConversationId) return null;
    const isGroup = selectedConversationId.startsWith("group:");
    const id = isGroup ? selectedConversationId.slice(6) : selectedConversationId;
    return isGroup
      ? groupChats.find((g) => g.group_id === id)
      : friends.find((f) => f.anonymous_id === id) || null;
  }, [selectedConversationId, groupChats, friends]);

  if (authLoading || messagesLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: { xs: "100%", md: 1500 }, margin: "0 auto", p: { xs: 1, md: 2 } }}>
        <ProfileHeader user={authData} isOwnProfile />
        {messagesError && <Alert severity="error" sx={{ mt: 2 }}>{messagesError}</Alert>}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch(selectedConversationId)}
            sx={{ flexGrow: 1 }}
            InputProps={{ endAdornment: <Search /> }}
          />
          <Button variant="contained" startIcon={<GroupAdd />} onClick={() => setGroupModalOpen(true)}>
            Create Group Chat
          </Button>
        </Box>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, maxWidth: { md: "400px" } }}>
            <ConversationsList
              conversations={conversations}
              groupChats={groupChats}
              friends={friends}
              currentUserId={authData.anonymous_id}
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
              onDeleteGroupChat={deleteGroup}
              onDeleteConversation={deleteConv}
              messages={messages}
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
                onEditMessage={handleEditMessage}
                token={token}
                fetchMessagesList={fetchConversationMessages}
                pendingMediaList={pendingMedia}
                setPendingMediaFile={addPendingMedia}
                clearPendingMedia={clearPendingMedia}
                isGroupChat={selectedConversationId.startsWith("group:")}
                friends={friends}
                messages={messages.filter((m) =>
                  selectedConversationId.startsWith("group:")
                    ? m.group_id === selectedConversationId.slice(6)
                    : m.conversation_id === selectedConversationId
                )}
                searchMessages={handleSearch}
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