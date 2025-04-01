import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Modal, Typography, Select, MenuItem, Button, CircularProgress } from "@mui/material";
import { useChatSettings } from "../../context/ChatSettingsContext";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import ChatSettingsModal from "./ChatSettingsModal";

const CHAT_CONTAINER_STYLES = {
  display: "flex",
  flexDirection: "column",
  height: { xs: "80vh", md: "70vh" },
  border: "1px solid",
  borderColor: "grey.300",
  borderRadius: 1,
  backgroundColor: "background.paper",
};

const MODAL_STYLES = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
  width: { xs: "90%", md: "400px" },
};

const FETCH_LIMIT = 20;

const ChatView = ({
  currentUserId,
  recipient,
  onSendMessage,
  onMarkRead,
  onDeleteMessage,
  token,
  fetchMessagesList,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  isGroupChat,
  friends,
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
  const { settings } = useChatSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardMessage, setForwardMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const lastConversationId = useRef(null);
  const conversationId = isGroupChat ? recipient?.group_id : recipient?.conversation_id;

  // Фільтруємо повідомлення поточного чату
  const filteredMessages = messages.filter((msg) =>
    isGroupChat ? msg.group_id === conversationId : msg.conversation_id === conversationId
  );

  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId) return;
      setIsLoadingMessages(true);
      setError(null);
      const controller = new AbortController();
      try {
        const params = {
          signal: controller.signal,
          conversationId: isGroupChat ? null : conversationId,
          groupId: isGroupChat ? conversationId : null,
          page: targetPage,
          limit: FETCH_LIMIT,
        };
        const newMessages = await fetchMessagesList(params);
        setMessages((prev) => {
          const updated = reset ? newMessages : [...prev, ...newMessages];
          // Видаляємо дублікати
          return updated.filter(
            (m, idx, arr) => arr.findIndex((x) => x.message_id === m.message_id) === idx
          );
        });
        setHasMore(newMessages.length === FETCH_LIMIT);
        if (reset || targetPage > page) setPage(targetPage);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.response?.data?.message || "Failed to load messages");
        }
      } finally {
        setIsLoadingMessages(false);
      }
      return () => controller.abort();
    },
    [fetchMessagesList, isGroupChat, conversationId, page, setMessages]
  );

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoadingMessages) {
      fetchMessagesForPage(page + 1);
    }
  }, [fetchMessagesForPage, page, hasMore, isLoadingMessages]);

  useEffect(() => {
    if (!conversationId || conversationId === lastConversationId.current) return;
    setPage(1);
    setHasMore(true);
    lastConversationId.current = conversationId;
    fetchMessagesForPage(1, true);
  }, [conversationId, fetchMessagesForPage]);

  const handleSendMessage = useCallback(
    async (messageData) => {
      const finalMessageData = {
        conversationId: isGroupChat ? null : conversationId,
        groupId: isGroupChat ? conversationId : null,
        content: messageData.content || "Media message",
        media: (messageData.media || []).map((item) => ({
          ...item,
          shape: item.shape || settings.videoShape,
        })),
        ...(messageData.replyTo && { replyTo: messageData.replyTo }),
      };
      await onSendMessage(finalMessageData);
      setReplyToMessage(null);
      // Оновлюємо список після відправки
      fetchMessagesForPage(1, true);
    },
    [onSendMessage, settings.videoShape, fetchMessagesForPage, conversationId, isGroupChat]
  );

  const handleForwardMessage = useCallback((message) => {
    setForwardMessage(message);
    setForwardOpen(true);
  }, []);

  const confirmForward = useCallback(async () => {
    if (!forwardRecipient || !forwardMessage) return;
    await onSendMessage({
      conversationId: null,
      groupId: null,
      recipientId: forwardRecipient,
      content: `Forwarded: ${forwardMessage.content || "Media"}`,
      media: forwardMessage.media,
      replyTo: forwardMessage.replyTo,
    });
    setForwardOpen(false);
    setForwardRecipient("");
    setForwardMessage(null);
  }, [forwardMessage, forwardRecipient, onSendMessage]);

  return (
    <Box sx={CHAT_CONTAINER_STYLES}>
      <ChatHeader
        recipient={recipient}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {isLoadingMessages ? (
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <ChatMessages
          messages={filteredMessages}
          currentUserId={currentUserId}
          recipient={recipient}
          onDeleteMessage={onDeleteMessage}
          onSendMediaMessage={handleSendMessage}
          onMarkRead={onMarkRead}
          isFetching={isLoadingMessages}
          hasMore={hasMore}
          loadMoreMessages={loadMoreMessages}
          chatBackground={settings.chatBackground}
          setReplyToMessage={setReplyToMessage}
          onForwardMessage={handleForwardMessage}
        />
      )}

      <ChatFooter
        recipient={recipient}
        onSendMessage={handleSendMessage}
        onSendMediaMessage={handleSendMessage}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        defaultVideoShape={settings.videoShape}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        currentUserId={currentUserId}
        token={token}
      />

      <ChatSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <Modal open={forwardOpen} onClose={() => setForwardOpen(false)}>
        <Box sx={MODAL_STYLES}>
          <Typography variant="h6" gutterBottom>
            Select Recipient
          </Typography>
          <Select
            fullWidth
            value={forwardRecipient}
            onChange={(e) => setForwardRecipient(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>
              Select a friend
            </MenuItem>
            {friends.map((friend) => (
              <MenuItem key={friend.anonymous_id} value={friend.anonymous_id}>
                {friend.username || `User (${friend.anonymous_id})`}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={confirmForward}
            disabled={!forwardRecipient}
          >
            Forward
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

ChatView.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.object.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool,
  friends: PropTypes.array,
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

ChatView.defaultProps = {
  pendingMediaList: [],
  isGroupChat: false,
  friends: [],
  messages: [],
};

export default ChatView;