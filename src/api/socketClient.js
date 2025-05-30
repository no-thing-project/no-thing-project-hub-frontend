import { io } from 'socket.io-client';

let socket;

export const connectSocket = (token) => {
  if (!token) return;

  socket = io(`${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/messages`, {
    autoConnect: true,
    query: { token }, // 👈 САМЕ ТАК передається токен на сервер
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to /messages');
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET] Connection error:', err.message);
  });

  socket.on('disconnect', () => {
    console.warn('[SOCKET] Disconnected from /messages');
  });
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket.disconnect();
};

export const onNewMessage = (callback) => {
  socket.on('newMessage', callback);
};

export const onMessageDeleted = (callback) => {
  socket.on('messageDeleted', callback);
};

export const onMessageEdited = (callback) => {
  socket.on('messageEdited', callback);
};

export const onMessageRead = (callback) => {
  socket.on('messageRead', callback);
};

export const onTyping = (callback) => {
  socket.on('typing', callback);
};

export const onConversationCreated = (callback) => {
  socket.on('conversationCreated', callback);
};

export const onConversationUpdated = (callback) => {
  socket.on('conversationUpdated', callback);
};

export const onConversationDeleted = (callback) => {
  socket.on('conversationDeleted', callback);
};

export const onAddedToConversation = (callback) => {
  socket.on('addedToConversation', callback);
};

export const onRemovedFromConversation = (callback) => {
  socket.on('removedFromConversation', callback);
};

export const onUserJoined = (callback) => {
  socket.on('userJoined', callback);
};

export const onUserLeft = (callback) => {
  socket.on('userLeft', callback);
};

export const onKeysRotated = (callback) => {
  socket.on('keysRotated', callback);
};

export const onMessagePinned = (callback) => {
  socket.on('messagePinned', callback);
};

export const onMessageUnpinned = (callback) => {
  socket.on('messageUnpinned', callback);
};

export const onPollVoted = (callback) => {
  socket.on('pollVoted', callback);
};

export const onReactionAdded = (callback) => {
  socket.on('reactionAdded', callback);
};