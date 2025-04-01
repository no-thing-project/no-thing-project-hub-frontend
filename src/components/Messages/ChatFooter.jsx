import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import ChatInput from "./ChatInput";
import MediaPreview from "./MediaPreview";

const ChatFooter = ({
  recipient,
  onSendMessage,
  onSendMediaMessage,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  defaultVideoShape,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
}) => (
  <>
    {pendingMediaList?.length > 0 && (
      <Box sx={{ p: 1 }}>
        {pendingMediaList.map((media, index) => (
          <MediaPreview
            key={index}
            pendingMedia={media}
            onClear={() => clearPendingMedia(index)}
            index={index}
          />
        ))}
      </Box>
    )}

    <ChatInput
      onSendMediaMessage={onSendMediaMessage}
      recipient={recipient}
      pendingMediaList={pendingMediaList}
      setPendingMediaFile={setPendingMediaFile}
      clearPendingMedia={clearPendingMedia}
      defaultVideoShape={defaultVideoShape}
      replyToMessage={replyToMessage}
      setReplyToMessage={setReplyToMessage}
      isGroupChat={isGroupChat}
    />
  </>
);

ChatFooter.propTypes = {
  recipient: PropTypes.object,
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  defaultVideoShape: PropTypes.string,
  replyToMessage: PropTypes.object,
  setReplyToMessage: PropTypes.func,
  isGroupChat: PropTypes.bool,
};

export default ChatFooter;
