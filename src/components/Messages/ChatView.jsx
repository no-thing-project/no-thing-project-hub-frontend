import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Modal, Typography, Select, MenuItem, Button } from "@mui/material";
import { useChatSettings } from "../../context/ChatSettingsContext";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import ChatSettingsModal from "./ChatSettingsModal";
import createConversation from "../../hooks/useConversations";

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
}) => {
  const { settings } = useChatSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardMessage, setForwardMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const lastConversationId = useRef(null);
  const [conversationId, setConversationId] = useState(null);

  // Оновлюємо conversationId на основі recipient
  useEffect(() => {
    const newConversationId = isGroupChat ? recipient?.group_id : recipient?.conversation_id;
    setConversationId(newConversationId);
  }, [recipient, isGroupChat]);

  const filteredMessages = messages.filter((msg) =>
    isGroupChat ? msg.group_id === conversationId : msg.conversation_id === conversationId
  );

  // Перевірка та створення розмови, якщо її немає
  const ensureConversationExists = useCallback(async () => {
    if (isGroupChat || !recipient?.user2 || !token || !conversationId) return conversationId;

    try {
      const existingMessages = await fetchMessagesList({
        signal: new AbortController().signal,
        conversationId,
      });

      if (!existingMessages.length) {
        // Якщо повідомлень немає, створюємо нову розмову
        const newConversation = await createConversation({ recipientId: recipient.user2 }, token);
        if (newConversation?.conversation_id) {
          setConversationId(newConversation.conversation_id);
          return newConversation.conversation_id;
        }
      }
      return conversationId;
    } catch (err) {
      console.error("Error ensuring conversation exists:", err);
      if (err.status === 403) {
        console.warn("Conversation not found or access denied, creating new one...");
        const newConversation = await createConversation({ recipientId: recipient.user2 }, token);
        if (newConversation?.conversation_id) {
          setConversationId(newConversation.conversation_id);
          return newConversation.conversation_id;
        }
      }
      throw err; // Передаємо помилку далі, якщо створення не вдалося
    }
  }, [isGroupChat, recipient, token, conversationId, fetchMessagesList]);

  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || (isFetching && !reset)) return;
      setIsFetching(true);
      try {
        const params = {
          signal: new AbortController().signal,
          conversationId: isGroupChat ? null : conversationId,
          groupId: isGroupChat ? conversationId : null,
          page: targetPage,
          limit: FETCH_LIMIT,
        };
        const newMessages = await fetchMessagesList(params);
        setMessages((prev) => {
          const updatedMessages = reset ? newMessages : [...prev, ...newMessages];
          return updatedMessages.filter(
            (msg, index, self) => self.findIndex((m) => m.message_id === msg.message_id) === index
          );
        });
        setHasMore(newMessages.length === FETCH_LIMIT);
        if (reset || targetPage > page) setPage(targetPage);
      } catch (err) {
        console.error("Fetch messages error:", err);
      } finally {
        setIsFetching(false);
      }
    },
    [fetchMessagesList, isGroupChat, conversationId, page, setMessages]
  );

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isFetching) fetchMessagesForPage(page + 1);
  }, [fetchMessagesForPage, page, hasMore, isFetching]);

  // Ініціалізація чату при зміні conversationId
  useEffect(() => {
    if (!conversationId || conversationId === lastConversationId.current) return;

    const initializeChat = async () => {
      setPage(1);
      setHasMore(true);
      lastConversationId.current = conversationId;

      const validConversationId = await ensureConversationExists();
      if (validConversationId) {
        await fetchMessagesForPage(1, true);
      }
    };

    initializeChat().catch((err) => console.error("Failed to initialize chat:", err));
  }, [conversationId, ensureConversationExists, fetchMessagesForPage]);

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
      try {
        await onSendMessage(finalMessageData);
        setReplyToMessage(null);
        await fetchMessagesForPage(1, true);
      } catch (err) {
        console.error("Send message error:", err);
      }
    },
    [onSendMessage, settings.videoShape, fetchMessagesForPage, conversationId, isGroupChat]
  );

  const handleForwardMessage = useCallback((message) => {
    setForwardMessage(message);
    setForwardOpen(true);
  }, []);

  const confirmForward = useCallback(
    async () => {
      if (!forwardRecipient || !forwardMessage) return;
      try {
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
      } catch (err) {
        console.error("Forward error:", err);
      }
    },
    [forwardMessage, forwardRecipient, onSendMessage]
  );

  return (
    <Box sx={CHAT_CONTAINER_STYLES}>
      <ChatHeader recipient={recipient} isGroupChat={isGroupChat} onSettingsOpen={() => setSettingsOpen(true)} />
      <ChatMessages
        messages={filteredMessages}
        currentUserId={currentUserId}
        recipient={recipient}
        onDeleteMessage={onDeleteMessage}
        onSendMediaMessage={handleSendMessage}
        onMarkRead={onMarkRead}
        isFetching={isFetching}
        hasMore={hasMore}
        loadMoreMessages={loadMoreMessages}
        chatBackground={settings.chatBackground}
        setReplyToMessage={setReplyToMessage}
        onForwardMessage={handleForwardMessage}
      />
      <ChatFooter
        recipient={recipient}
        onSendMessage={handleSendMessage}
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
          <Typography variant="h6" gutterBottom>Select Recipient</Typography>
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
          <Button variant="contained" onClick={confirmForward} disabled={!forwardRecipient}>
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
};

ChatView.defaultProps = {
  pendingMediaList: [],
  isGroupChat: false,
  friends: [],
  messages: [],
};

export default ChatView;