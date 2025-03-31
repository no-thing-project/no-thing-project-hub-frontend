import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import ChatInput from "./ChatInput";
import MediaPreview from "./MediaPreview";
import RecorderModal from "./RecorderModal";

const PREVIEW_CONTAINER_STYLES = { p: 1 };

const ChatFooter = ({
  recipient,
  onSendMessage,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  defaultVideoShape,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  currentUserId,
  token,
}) => {
  const [recorderOpen, setRecorderOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleRecordStart = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setRecorderOpen(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const handleStopRecording = (shape) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setRecorderOpen(false);
      // Тут можна додати логіку збереження запису в pendingMediaList
    }
  };

  return (
    <>
      {pendingMediaList?.length > 0 && (
        <Box sx={PREVIEW_CONTAINER_STYLES}>
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
        onSendMessage={onSendMessage}
        recipient={recipient}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        defaultVideoShape={defaultVideoShape}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        currentUserId={currentUserId}
        token={token}
        onRecordStart={handleRecordStart}
      />
      <RecorderModal
        open={recorderOpen}
        onClose={() => setRecorderOpen(false)}
        stream={stream}
        recordingTime={recordingTime}
        onStop={handleStopRecording}
        initialShape={defaultVideoShape}
        setRecordingTime={setRecordingTime}
      />
    </>
  );
};

ChatFooter.propTypes = {
  recipient: PropTypes.object,
  onSendMessage: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  defaultVideoShape: PropTypes.string,
  replyToMessage: PropTypes.object,
  setReplyToMessage: PropTypes.func,
  isGroupChat: PropTypes.bool,
  currentUserId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
};

ChatFooter.defaultProps = {
  pendingMediaList: [],
  isGroupChat: false,
};

export default ChatFooter;