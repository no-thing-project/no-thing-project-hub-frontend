// src/hooks/useWebSocket.js
import { useEffect, useRef } from "react";
import io from "socket.io-client";
import config from "../config";

export const useWebSocket = ({
  token,
  boardId,
  currentUser,
  setTweets,
  setOnlineUsers,
  setProfileData,
  setPointsData,
  setFriends,
  setPendingRequests,
  setMessages,
  setGates,
  setClasses,
  setBoards,
  onLogout,
  navigate,
}) => {
  const socketRef = useRef({});

  useEffect(() => {
    if (!token || !currentUser?.anonymous_id) return;

    // Ініціалізація просторів імен
    const namespaces = {
      boards: io(`${config.REACT_APP_WS_URL}/boards`, { auth: { token: `Bearer ${token}` } }),
      messages: io(`${config.REACT_APP_WS_URL}/messages`, { auth: { token: `Bearer ${token}` } }),
      social: io(`${config.REACT_APP_WS_URL}/social`, { auth: { token: `Bearer ${token}` } }),
      points: io(`${config.REACT_APP_WS_URL}/points`, { auth: { token: `Bearer ${token}` } }),
      profile: io(`${config.REACT_APP_WS_URL}/profile`, { auth: { token: `Bearer ${token}` } }),
    };

    socketRef.current = namespaces;

    // Обробка підключення для кожного простору імен
    Object.entries(namespaces).forEach(([namespace, socket]) => {
      socket.on("connect", () => {
        console.log(`Connected to ${namespace} namespace`);
        if (namespace === "boards" && boardId) {
          socket.emit("joinBoard", { board_id: boardId, anonymous_id: currentUser.anonymous_id });
        }
        if (namespace === "messages" || namespace === "social" || namespace === "points" || namespace === "profile") {
          socket.emit("join", currentUser.anonymous_id);
        }
      });

      socket.on("connect_error", (err) => {
        console.error(`Socket ${namespace} connection error:`, err.message);
        if (err.message.includes("Authentication")) {
          onLogout("WebSocket authentication failed. Please log in again.");
          navigate("/login");
        }
      });
    });

    // Події для /boards
    const boardsSocket = namespaces.boards;
    if (boardId) {
      boardsSocket.on("onlineUsersUpdate", (count) => {
        if (setOnlineUsers) setOnlineUsers(count);
      });

      boardsSocket.on("tweetAdded", (newTweet) => {
        newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
        setTweets?.((prev) => {
          if (prev.some((t) => t.tweet_id === newTweet.tweet_id)) return prev;
          return [...prev, newTweet];
        });
      });

      boardsSocket.on("tweetUpdated", (updatedTweet) => {
        updatedTweet.timestamp = updatedTweet.timestamp || new Date().toISOString();
        setTweets?.((prev) =>
          prev.map((tweet) =>
            tweet.tweet_id === updatedTweet.tweet_id ? { ...tweet, ...updatedTweet } : tweet
          )
        );
      });

      boardsSocket.on("tweetDeleted", ({ tweet_id }) => {
        setTweets?.((prev) => prev.filter((tweet) => tweet.tweet_id !== tweet_id));
      });

      boardsSocket.on("boardUpdated", (updatedBoard) => {
        setBoards?.((prev) =>
          prev.map((board) => (board.board_id === updatedBoard.board_id ? updatedBoard : board))
        );
      });

      boardsSocket.on("boardDeleted", ({ board_id }) => {
        setBoards?.((prev) => prev.filter((board) => board.board_id !== board_id));
      });

      boardsSocket.on("boardLiked", (updatedBoard) => {
        setBoards?.((prev) =>
          prev.map((board) => (board.board_id === updatedBoard.board_id ? updatedBoard : board))
        );
      });

      boardsSocket.on("boardUnliked", (updatedBoard) => {
        setBoards?.((prev) =>
          prev.map((board) => (board.board_id === updatedBoard.board_id ? updatedBoard : board))
        );
      });
    }

    // Події для /messages
    const messagesSocket = namespaces.messages;
    messagesSocket.on("newMessage", (message) => {
      setMessages?.((prev) => {
        if (prev.some((m) => m.message_id === message.message_id)) return prev;
        return [...prev, message];
      });
    });

    messagesSocket.on("messageDeleted", (messageId) => {
      setMessages?.((prev) => prev.filter((m) => m.message_id !== messageId));
    });

    messagesSocket.on("messageRead", (messageId) => {
      setMessages?.((prev) =>
        prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true } : m))
      );
    });

    // Події для /social
    const socialSocket = namespaces.social;
    socialSocket.on("friendRequestSent", (request) => {
      setPendingRequests?.((prev) => [...prev, request]);
    });

    socialSocket.on("friendRequestAccepted", ({ friend_id }) => {
      setPendingRequests?.((prev) => prev.filter((req) => req.anonymous_id !== friend_id));
      setFriends?.((prev) => [...prev, { anonymous_id: friend_id, status: "accepted" }]);
    });

    socialSocket.on("friendRequestRejected", ({ friend_id }) => {
      setPendingRequests?.((prev) => prev.filter((req) => req.anonymous_id !== friend_id));
    });

    socialSocket.on("friendRemoved", ({ friend_id }) => {
      setFriends?.((prev) => prev.filter((f) => f.anonymous_id !== friend_id));
    });

    // Події для /points
    const pointsSocket = namespaces.points;
    pointsSocket.on("pointsUpdated", (pointsData) => {
      setPointsData?.((prev) => ({ ...prev, ...pointsData }));
      setProfileData?.((prev) => ({ ...prev, total_points: pointsData.total_points }));
    });

    pointsSocket.on("pointsTransferred", ({ sender_points, donated_points }) => {
      setPointsData?.((prev) => ({
        ...prev,
        total_points: sender_points,
        donated_points: prev.donated_points + donated_points,
      }));
    });

    // Події для /profile
    const profileSocket = namespaces.profile;
    profileSocket.on("profileUpdated", (updatedProfile) => {
      setProfileData?.((prev) => ({ ...prev, ...updatedProfile }));
    });

    profileSocket.on("sessionExpired", () => {
      onLogout("Session expired by server.");
      navigate("/login");
    });

    // Події для gates та classes (можуть бути в /boards або окремому просторі)
    boardsSocket.on("gateAdded", (newGate) => {
      setGates?.((prev) => [...prev, newGate]);
    });

    boardsSocket.on("gateUpdated", (updatedGate) => {
      setGates?.((prev) =>
        prev.map((gate) => (gate.gate_id === updatedGate.gate_id ? updatedGate : gate))
      );
    });

    boardsSocket.on("gateDeleted", ({ gate_id }) => {
      setGates?.((prev) => prev.filter((gate) => gate.gate_id !== gate_id));
    });

    boardsSocket.on("classAdded", (newClass) => {
      setClasses?.((prev) => [...prev, newClass]);
    });

    boardsSocket.on("classUpdated", (updatedClass) => {
      setClasses?.((prev) =>
        prev.map((cls) => (cls.class_id === updatedClass.class_id ? updatedClass : cls))
      );
    });

    boardsSocket.on("classDeleted", ({ class_id }) => {
      setClasses?.((prev) => prev.filter((cls) => cls.class_id !== class_id));
    });

    return () => {
      Object.values(namespaces).forEach((socket) => socket.disconnect());
    };
  }, [
    token,
    boardId,
    currentUser,
    setTweets,
    setOnlineUsers,
    setProfileData,
    setPointsData,
    setFriends,
    setPendingRequests,
    setMessages,
    setGates,
    setClasses,
    setBoards,
    onLogout,
    navigate,
  ]);

  return socketRef;
};

export default useWebSocket;