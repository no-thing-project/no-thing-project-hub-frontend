import { Edit, RestartAlt, Toll } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LockIcon from "@mui/icons-material/Lock";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";
import RemoveIcon from "@mui/icons-material/Remove";
import ShareIcon from "@mui/icons-material/Share";
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  Popover,
  Tooltip,
  Typography
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { BOARD_SIZE, useBoardInteraction } from "../../../hooks/useBoard";
import usePoints from "../../../hooks/usePoints";
import { useTweets } from "../../../hooks/useTweets";
import { useWebSocket } from "../../../hooks/useWebSocket";
import {
  ProfileAvatar
} from "../../../utils/avatarUtils";
import { formatPoints } from "../../../utils/formatPoints";
import ErrorMessage from "../../Layout/ErrorMessage";
import LoadingSpinner from "../../Layout/LoadingSpinner";
import DraggableTweet from "../Tweet/Tweet";
import TweetContent from "../Tweet/TweetContent";
import TweetPopup from "../Tweet/TweetPopup";

const Board = ({
  token,
  currentUser,
  onLogout,
  boardId,
  boardData,
  members,
  boardTitle,
  onLike,
  setEditingBoard,
  errorMessage
}) => {
  const navigate = useNavigate();

  const boardMainRef = useRef(null);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [membersAnchorEl, setMembersAnchorEl] = useState(null);

  const {
    tweets,
    setTweets,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    loading: tweetsLoading,
    error: tweetsError,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const { pointsData, getPoints } = usePoints(token, onLogout, navigate);

  const socketRef = useWebSocket(
    token,
    boardId,
    currentUser,
    setTweets,
    onLogout,
    navigate,
    setOnlineUsers
  );

  useEffect(() => {
    if (boardId) {
      const controller = new AbortController();
      const signal = controller.signal;
      const loadTweets = async () => {
        try {
          await getPoints(signal);
          await fetchTweets({ signal });
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error loading tweets:", err);
          }
        }
      };
      loadTweets();
      return () => controller.abort();
    }
  }, [boardId, fetchTweets]);

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      if (socket?.boards) {
        socket.boards.disconnect();
      }
    };
  }, [socketRef]);

  const handleCreateTweet = useCallback(
    async (text, x, y) => {
      try {
        const newTweet = await createNewTweet(
          text,
          x,
          y,
          replyTweet ? replyTweet.tweet_id : null
        );
        if (newTweet && socketRef.current?.boards) {
          newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
          socketRef.current.boards.emit("newTweet", { boardId, ...newTweet });
        }
        setReplyTweet(null);
        await getPoints();
      } catch (err) {
        console.error("Error creating tweet:", err);
      }
    },
    [createNewTweet, socketRef, boardId, replyTweet]
  );

  const handleUpdateTweet = useCallback(
    async (id, updates) => {
      try {
        await updateExistingTweet(id, updates);
        if (socketRef.current?.boards) {
          socketRef.current.boards.emit("tweetUpdated", {
            boardId,
            tweet_id: id,
            ...updates,
            timestamp: new Date().toISOString(),
          });
        }
        await getPoints();
      } catch (err) {
        console.error("Error updating tweet:", err);
      }
    },
    [updateExistingTweet, socketRef, boardId]
  );

  const handleToggleLikeTweet = useCallback(
    async (id, isLiked) => {
      try {
        const updatedTweet = await toggleLikeTweet(id, isLiked);
        if (updatedTweet && socketRef.current?.boards) {
          socketRef.current.boards.emit("tweetUpdated", {
            boardId,
            ...updatedTweet,
          });
        }
        await getPoints();
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    },
    [toggleLikeTweet, socketRef, boardId]
  );

  const handleDeleteTweet = useCallback(
    async (id) => {
      try {
        await deleteExistingTweet(id);
        if (socketRef.current?.boards) {
          socketRef.current.boards.emit("tweetDeleted", {
            boardId,
            tweet_id: id,
          });
        }
        await getPoints();
      } catch (err) {
        console.error("Error deleting tweet:", err);
      }
    },
    [deleteExistingTweet, socketRef, boardId]
  );

  const handleReply = useCallback((tweet) => {
    setReplyTweet(tweet);
    setTweetPopup({ visible: true, x: tweet.x, y: tweet.y });
  }, []);

  const handleReplyHover = useCallback((parentTweetId) => {
    setHighlightedParentId(parentTweetId);
  }, []);

  const {
    scale,
    offset,
    dragging,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useBoardInteraction(boardMainRef);

  const renderedTweets = useMemo(() => {
    return tweets.map((tweet) => (
      <DraggableTweet
        key={tweet.tweet_id}
        tweet={tweet}
        currentUser={currentUser}
        onStop={(e, data) =>
          handleUpdateTweet(tweet.tweet_id, {
            position: { x: data.x, y: data.y },
          })
        }
      >
        <TweetContent
          tweet={tweet}
          currentUser={currentUser}
          onLike={handleToggleLikeTweet}
          onDelete={handleDeleteTweet}
          onReply={handleReply}
          onReplyHover={handleReplyHover}
          isParentHighlighted={tweet.tweet_id === highlightedParentId}
        />
      </DraggableTweet>
    ));
  }, [
    tweets,
    currentUser,
    handleUpdateTweet,
    handleToggleLikeTweet,
    handleDeleteTweet,
    handleReply,
    handleReplyHover,
    highlightedParentId,
  ]);

  useEffect(() => {
    if (boardMainRef.current) {
      centerBoard();
    }
  }, []);

  const handlePopupSubmit = useCallback(
    (text, x, y) => {
      handleCreateTweet(text, x, y);
      setTweetDraft("");
      setTweetPopup((prev) => ({ ...prev, visible: false }));
    },
    [handleCreateTweet]
  );

  const handleMouseUpWithPopup = useCallback(
    (e) =>
      handleMouseUp(e, (x, y) => {
        setTweetPopup({ visible: true, x, y });
      }),
    [handleMouseUp]
  );

  if (tweetsLoading) {
    return <LoadingSpinner />;
  }

  if (tweetsError) {
    errorMessage=tweetsError;
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1100,
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            className="return-button"
            aria-label="Go back"
          >
            <ArrowBackIcon sx={{ color: "text.primary" }} />
          </IconButton>
        </Box>

        <Box
          ref={boardMainRef}
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            cursor: dragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpWithPopup}
          onTouchStart={(e) => {
            if (e.touches?.length === 1) {
              handleMouseDown({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                target: e.target,
              });
            }
          }}
          onTouchMove={(e) => {
            if (e.touches?.length === 1) {
              handleMouseMove({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                target: e.target,
              });
              e.preventDefault();
            }
          }}
          onTouchEnd={(e) => {
            if (e.changedTouches?.length === 1) {
              handleMouseUpWithPopup({
                clientX: e.changedTouches[0].clientX,
                clientY: e.changedTouches[0].clientY,
                target: e.target,
              });
            }
          }}
          onWheel={handleWheel}
          role="region"
          aria-label="Interactive board canvas"
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              backgroundColor: "background.paper",
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#eee",
                  fontSize: "clamp(2rem, 8vw, 15rem)",
                  fontWeight: 700,
                }}
              >
                {boardTitle}
              </Typography>
            </Box>

            {renderedTweets}

            {tweetPopup.visible && (
              <Box onClick={(e) => e.stopPropagation()}>
                <TweetPopup
                  x={tweetPopup.x}
                  y={tweetPopup.y}
                  draft={tweetDraft}
                  onDraftChange={setTweetDraft}
                  onSubmit={handlePopupSubmit}
                  onClose={() =>
                    setTweetPopup((prev) => ({ ...prev, visible: false }))
                  }
                />
              </Box>
            )}
          </Box>

          <Box
            className="user_points"
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: 1,
              padding: "4px",
              backgroundColor: "rgba(255, 255, 255, 0)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Tooltip title="Available points">
              <IconButton size="small" aria-label="Zoom out">
                <Toll sx={{ color: "text.primary" }} />
              </IconButton>
            </Tooltip>
            <Typography variant="body2">
              {formatPoints(pointsData?.total_points)}
            </Typography>
          </Box>

          <Box
            className="zoom-controls"
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: 1,
              padding: "4px",
              backgroundColor: "rgba(255, 255, 255, 0)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <AnimatePresence>
              {scale < 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomButton("reset");
                    }}
                    size="small"
                    aria-label="Reset zoom"
                  >
                    <RestartAlt sx={{ color: "text.primary" }} />
                  </IconButton>
                </motion.div>
              )}
            </AnimatePresence>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomButton("out");
              }}
              size="small"
              aria-label="Zoom out"
            >
              <RemoveIcon sx={{ color: "text.primary" }} />
            </IconButton>
            <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomButton("in");
              }}
              size="small"
              aria-label="Zoom in"
            >
              <AddIcon sx={{ color: "text.primary" }} />
            </IconButton>
          </Box>

          <Box
            className="board-top-controls"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: 1,
              padding: "4px",
              backgroundColor: "rgba(255, 255, 255, 0)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Tooltip title="Board Visibility">
              <IconButton aria-label="Board visibility">
                {boardData?.is_public ? (
                  <PublicIcon sx={{ color: "#3E435D" }} />
                ) : (
                  <LockIcon sx={{ color: "#990000" }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Members">
              <IconButton
                onClick={(e) => setMembersAnchorEl(e.currentTarget)}
                aria-label="View members"
              >
                <Badge badgeContent={onlineUsers} color="primary">
                  <PeopleIcon sx={{ color: "text.primary" }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip
              title={boardData?.is_liked ? "Unlike Board" : "Like Board"}
            >
              <IconButton onClick={onLike} aria-label="Like or unlike board">
                {boardData?.is_liked ? (
                  <FavoriteIcon sx={{ color: "red" }} />
                ) : (
                  <FavoriteBorderIcon sx={{ color: "text.primary" }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Board">
              <IconButton aria-label="Share board">
                <ShareIcon sx={{ color: "text.primary" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Board">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBoard({
                    board_id: boardData.board_id,
                    name: boardData.name,
                    description: boardData.description || "",
                    visibility: boardData.is_public ? "Public" : "Private",
                  });
                }}
                sx={{ p: 1, color: "text.primary" }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          </Box>

          <Popover
            open={Boolean(membersAnchorEl)}
            anchorEl={membersAnchorEl}
            onClose={() => setMembersAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Box sx={{ p: 2, maxHeight: 300, overflowY: "auto" }}>
              <Typography variant="h6" gutterBottom>
                Members
              </Typography>
              {members.length > 0 ? (
                <List dense>
                  {members.map((member) => (
                    <ListItem key={member.anonymous_id}>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}
                      >
                        <ProfileAvatar
                          user={member}
                          badgeSize={10}
                          status={member.status}
                        />
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2">
                            {member.username || "Anonymous"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {member.role || "Member"}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No members found.</Typography>
              )}
            </Box>
          </Popover>
        </Box>
      </Box>
    </Box>
  );
};

Board.propTypes = {
  token: PropTypes.string.isRequired,
  currentUser: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  boardId: PropTypes.string.isRequired,
  boardData: PropTypes.object.isRequired,
  members: PropTypes.array.isRequired,
  boardTitle: PropTypes.string.isRequired,
  onLike: PropTypes.func.isRequired,
};

export default Board;
