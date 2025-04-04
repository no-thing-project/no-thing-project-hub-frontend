import React, { useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble";

const getBackgroundStyle = (chatBackground) => ({
  lightGray: { backgroundColor: "#f5f5f5" },
  dark: { backgroundColor: "#333", color: "white" },
  nature: { backgroundImage: "url('/nature-bg.jpg')" },
  default: { backgroundColor: "white" },
}[chatBackground] || { backgroundColor: "white" });

const ChatMessages = ({
  messages,
  currentUserId,
  recipient,
  onDeleteMessage,
  onEditMessage,
  onSendMediaMessage,
  onMarkRead,
  isFetching,
  hasMore,
  loadMoreMessages,
  chatBackground,
  setReplyToMessage,
  onForwardMessage,
}) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleIntersection = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) loadMoreMessages();
    },
    [hasMore, isFetching, loadMoreMessages]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, { root: chatContainerRef.current, threshold: 0.1 });
    const topElement = chatContainerRef.current?.children[0];
    if (topElement) observer.observe(topElement);
    return () => observer.disconnect();
  }, [handleIntersection, messages]);

  useEffect(() => {
    if (messages.length && !isFetching) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      messages.filter((m) => m.receiver_id === currentUserId && !m.is_read).forEach((m) => onMarkRead(m.message_id));
    }
  }, [messages, currentUserId, onMarkRead, isFetching]);

  return (
    <Box ref={chatContainerRef} sx={{ flex: 1, overflowY: "auto", p: { xs: 1, md: 2 }, ...getBackgroundStyle(chatBackground) }}>
      <div style={{ height: "1px" }} />
      {messages.length ? (
        messages.map((msg) => (
          <MessageBubble
            key={msg.message_id}
            message={msg}
            isSentByCurrentUser={msg.sender_id === currentUserId}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
            currentUserId={currentUserId}
            recipient={recipient}
            onSendMediaMessage={onSendMediaMessage}
            messages={messages}
            setReplyToMessage={setReplyToMessage}
            onForward={onForwardMessage}
          />
        ))
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          {isFetching ? "Loading..." : "No messages yet. Start chatting!"}
        </Typography>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.array.isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.object.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loadMoreMessages: PropTypes.func.isRequired,
  chatBackground: PropTypes.string.isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  onForwardMessage: PropTypes.func.isRequired,
};

export default React.memo(ChatMessages);