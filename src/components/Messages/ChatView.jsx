import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Modal, Typography, Select, MenuItem, Button } from "@mui/material";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import ChatSettingsModal from "./ChatSettingsModal";

const chatContainerStyles = {
  display: "flex",
  flexDirection: "column",
  height: { xs: "80vh", md: "70vh" },
  border: "1px solid",
  borderColor: "grey.300",
  borderRadius: 1,
  backgroundColor: "background.paper",
};

const modalStyles = {
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

const ChatView = ({
  currentUserId,
  recipient,
  onSendMessage,
  onSendMediaMessage,
  onMarkRead,
  onDeleteMessage,
  onEditMessage,
  token,
  fetchMessagesList,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  isGroupChat,
  friends,
  setMessages,
}) => {
  const [localMessages, setLocalMessages] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardMessage, setForwardMessage] = useState(null);
  const [chatSettings, setChatSettings] = useState({ videoShape: "square", chatBackground: "default" });
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const lastConversationId = useRef(null);

  const conversationId = isGroupChat ? recipient?.group_id : recipient?.anonymous_id;

  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || (isFetching && !reset)) return;
      setIsFetching(true);
      try {
        const params = {
          withUserId: isGroupChat ? null : conversationId,
          groupId: isGroupChat ? conversationId : null,
          page: targetPage,
        };
        const newMessages = await fetchMessagesList(params);
        setLocalMessages((prev) => {
          const uniqueNewMessages = newMessages.filter((m) => !prev.some((pm) => pm.message_id === m.message_id));
          const updatedMessages = reset
            ? uniqueNewMessages
            : [...uniqueNewMessages, ...prev].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages((globalMessages) => {
            const merged = [
              ...globalMessages.filter((m) => m.group_id !== conversationId && (isGroupChat || m.receiver_id !== conversationId)),
              ...updatedMessages,
            ];
            return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
          return updatedMessages;
        });
        setHasMore(newMessages.length === 20);
        if (reset || targetPage > page) setPage(targetPage);
      } catch (err) {
        setError("Failed to fetch messages");
        console.error(err);
      } finally {
        setIsFetching(false);
      }
    },
    [fetchMessagesList, isGroupChat, conversationId, page, setMessages]
  );

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isFetching) fetchMessagesForPage(page + 1);
  }, [fetchMessagesForPage, page, hasMore, isFetching]);

  useEffect(() => {
    if (!conversationId || conversationId === lastConversationId.current) return;
    setLocalMessages([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    lastConversationId.current = conversationId;
    fetchMessagesForPage(1, true);
  }, [conversationId, fetchMessagesForPage]);

  const handleSendMessage = useCallback(
    async (messageData) => {
      try {
        const finalMessageData = {
          ...messageData,
          media: (messageData.media || []).map((item) => ({ ...item, shape: item.shape || chatSettings.videoShape })),
        };
        await onSendMediaMessage(finalMessageData);
        fetchMessagesForPage(1, true);
      } catch (err) {
        setError("Failed to send message");
        console.error(err);
      }
    },
    [onSendMediaMessage, chatSettings.videoShape, fetchMessagesForPage]
  );

  const handleForwardMessage = useCallback((message) => {
    setForwardMessage(message);
    setForwardOpen(true);
  }, []);

  const confirmForward = useCallback(async () => {
    if (!forwardRecipient || !forwardMessage) return;
    try {
      await onSendMediaMessage({
        recipientId: forwardRecipient,
        content: `Forwarded: ${forwardMessage.content || "Media"}`,
        media: forwardMessage.media,
        replyTo: forwardMessage.replyTo,
      });
      setForwardOpen(false);
      setForwardRecipient("");
      setForwardMessage(null);
    } catch (err) {
      setError("Failed to forward message");
      console.error("Forward error:", err);
    }
  }, [forwardMessage, forwardRecipient, onSendMediaMessage]);

  return (
    <>
      <Box sx={chatContainerStyles}>
        <ChatHeader recipient={recipient} isGroupChat={isGroupChat} onSettingsOpen={() => setSettingsOpen(true)} />
        {error && <Typography color="error" sx={{ p: 2 }}>{error}</Typography>}
        <ChatMessages
          messages={localMessages}
          currentUserId={currentUserId}
          recipient={recipient}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
          onSendMediaMessage={handleSendMessage}
          onMarkRead={onMarkRead}
          isFetching={isFetching}
          hasMore={hasMore}
          loadMoreMessages={loadMoreMessages}
          chatBackground={chatSettings.chatBackground}
          setReplyToMessage={setReplyToMessage}
          onForwardMessage={handleForwardMessage}
        />
        <ChatFooter
          recipient={recipient}
          onSendMessage={onSendMessage}
          onSendMediaMessage={handleSendMessage}
          pendingMediaList={pendingMediaList}
          setPendingMediaFile={setPendingMediaFile}
          clearPendingMedia={clearPendingMedia}
          defaultVideoShape={chatSettings.videoShape}
          replyToMessage={replyToMessage}
          setReplyToMessage={setReplyToMessage}
          isGroupChat={isGroupChat}
          token={token}
          currentUserId={currentUserId}
        />
      </Box>
      <ChatSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onSave={setChatSettings} initialSettings={chatSettings} />
      <Modal open={forwardOpen} onClose={() => setForwardOpen(false)}>
        <Box sx={modalStyles}>
          <Typography variant="h6" gutterBottom>Select Recipient</Typography>
          <Select
            fullWidth
            value={forwardRecipient}
            onChange={(e) => setForwardRecipient(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select a friend</MenuItem>
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
    </>
  );
};

ChatView.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.object.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  friends: PropTypes.array.isRequired,
  setMessages: PropTypes.func.isRequired,
};

export default ChatView;