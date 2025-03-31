import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, TextField, IconButton, Button } from "@mui/material";
import { Send, AttachFile, Mic } from "@mui/icons-material";

const INPUT_CONTAINER_STYLES = {
  p: 2,
  borderTop: "1px solid",
  borderColor: "grey.300",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const ChatInput = ({
  onSendMessage,
  recipient,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  defaultVideoShape,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  currentUserId,
  token,
  onRecordStart,
}) => {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim() && !pendingMediaList.length) return;
    const messageData = {
      content,
      media: pendingMediaList,
      replyTo: replyToMessage?.message_id,
      ...(isGroupChat
        ? { groupId: recipient.group_id }
        : { conversationId: recipient.conversation_id }),
    };
    onSendMessage(messageData);
    setContent("");
    clearPendingMedia();
    setReplyToMessage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingMediaFile({ file, type: file.type.split("/")[0] });
    }
  };

  return (
    <Box sx={INPUT_CONTAINER_STYLES}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
      />
      <input type="file" hidden id="file-upload" onChange={handleFileChange} />
      <IconButton component="label" htmlFor="file-upload">
        <AttachFile />
      </IconButton>
      <IconButton onClick={onRecordStart}>
        <Mic />
      </IconButton>
      <Button variant="contained" onClick={handleSend} startIcon={<Send />}>
        Send
      </Button>
    </Box>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  recipient: PropTypes.object,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  defaultVideoShape: PropTypes.string,
  replyToMessage: PropTypes.object,
  setReplyToMessage: PropTypes.func,
  isGroupChat: PropTypes.bool,
  currentUserId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  onRecordStart: PropTypes.func.isRequired,
};

ChatInput.defaultProps = {
  pendingMediaList: [],
  isGroupChat: false,
};

export default ChatInput;