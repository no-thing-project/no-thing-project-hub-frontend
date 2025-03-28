import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble";
import MediaPreview from "./MediaPreview";
import ChatInput from "./ChatInput";

const chatContainerStyles = {
  display: "flex",
  flexDirection: "column",
  height: { xs: "80vh", md: "70vh" },
  border: "1px solid",
  borderColor: "grey.300",
  borderRadius: 1,
  backgroundColor: "background.paper",
};

const headerStyles = {
  p: 2,
  borderBottom: "1px solid",
  borderColor: "grey.300",
  backgroundColor: "grey.50",
};

const messagesAreaStyles = {
  flex: 1,
  overflowY: "auto",
  p: { xs: 1, md: 2 },
  backgroundColor: "white",
};

const ChatView = ({
  messages,
  currentUserId,
  recipient,
  onSendMessage,
  onSendMediaMessage,
  onMarkRead,
  onDeleteMessage,
  token,
  fetchMessagesList,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
}) => {
  const messagesEndRef = useRef(null);
  const [sendingMessages, setSendingMessages] = useState(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const unreadMessages = messages.filter((m) => m.receiver_id === currentUserId && !m.is_read);
    unreadMessages.forEach((m) => onMarkRead(m.message_id));
  }, [messages, currentUserId, onMarkRead]);

  const handleSendMediaMessage = async (messageData) => {
    const tempId = `temp_${Date.now()}`;
    setSendingMessages((prev) => new Set(prev).add(tempId));

    try {
      await onSendMediaMessage(messageData);
    } finally {
      setSendingMessages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  };

  return (
    <Box sx={chatContainerStyles}>
      <Typography variant="h6" sx={headerStyles}>
        Chat with {recipient?.username || `User (${recipient?.anonymous_id})`}
      </Typography>
      <Box sx={messagesAreaStyles}>
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.message_id}
              message={msg}
              isSentByCurrentUser={msg.sender_id === currentUserId}
              onDelete={onDeleteMessage}
              isSending={sendingMessages.has(msg.message_id)}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            No messages yet. Start the conversation!
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </Box>
      {pendingMediaList && pendingMediaList.length > 0 && (
        <Box sx={{ p: 1 }}>
          {pendingMediaList.map((media, index) => (
            <MediaPreview key={index} pendingMedia={media} onClear={() => clearPendingMedia(index)} />
          ))}
        </Box>
      )}
      <ChatInput
        onSendMessage={onSendMessage}
        onSendMediaMessage={handleSendMediaMessage}
        recipient={recipient}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        fetchMessagesList={fetchMessagesList}
      />
    </Box>
  );
};

ChatView.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      sender_id: PropTypes.string.isRequired,
      receiver_id: PropTypes.string.isRequired,
      content: PropTypes.string,
      media: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          content: PropTypes.string.isRequired,
        })
      ),
      type: PropTypes.oneOf(["text", "file", "image", "voice", "video", "sticker", "mixed"]), // Додано "mixed"
      status: PropTypes.oneOf(["sent", "delivered", "read"]).isRequired,
      is_read: PropTypes.bool.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string.isRequired,
    username: PropTypes.string,
  }).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.arrayOf(
    PropTypes.shape({
      file: PropTypes.object.isRequired,
      type: PropTypes.string.isRequired,
      preview: PropTypes.string.isRequired,
    })
  ),
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
};

export default ChatView;