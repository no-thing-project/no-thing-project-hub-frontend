// hooks/useWebSocket.js
import { useEffect, useRef } from "react";
import io from "socket.io-client";
import config from "../config";

export const useWebSocket = (token, board_id, currentUser, setTweets, onLogout, navigate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(`${config.REACT_APP_WS_URL}/boards`, {
      query: { token, board_id },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinBoard", board_id);
    });

    socket.on("tweetAdded", (newTweet) => {
      // Переконуємось, що є повна дата
      newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
      setTweets((prev) => {
        if (prev.some((t) => t.tweet_id === newTweet.tweet_id)) return prev;
        return [...prev, newTweet];
      });
    });

    socket.on("tweetUpdated", (updatedTweet) => {
      updatedTweet.timestamp = updatedTweet.timestamp || new Date().toISOString();
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === updatedTweet.tweet_id ? { ...tweet, ...updatedTweet } : tweet
        )
      );
    });

    socket.on("tweetDeleted", ({ tweet_id }) => {
      setTweets((prev) => prev.filter((tweet) => tweet.tweet_id !== tweet_id));
    });

    socket.on("connect_error", (err) => {
      if (err.message.includes("Authentication")) {
        onLogout();
        navigate("/login");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, board_id, currentUser, setTweets, onLogout, navigate]);

  return socketRef;
};
