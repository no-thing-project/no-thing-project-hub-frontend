import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  Popover,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
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
import { BOARD_SIZE, useBoardInteraction } from "../../../hooks/useBoard";
import usePoints from "../../../hooks/usePoints";
import { useTweets } from "../../../hooks/useTweets";
import { ProfileAvatar } from "../../../utils/avatarUtils";
import LoadingSpinner from "../../Layout/LoadingSpinner";
import DraggableTweet from "../Tweet/Tweet";
import TweetContent from "../Tweet/TweetContent";
import TweetPopup from "../Tweet/TweetPopup";
import AnimatedPoints from "../../AnimatedPoints/AnimatedPoints";
import PointsDeductionAnimation from "../../PointsDeductionAnimation/PointsDeductionAnimation";

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
}) => {
  const navigate = useNavigate();
  const boardMainRef = useRef(null);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);
  const [membersAnchorEl, setMembersAnchorEl] = useState(null);
  const [editTweetModal, setEditTweetModal] = useState(null);
  const [availableBoards, setAvailableBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [boardLoading, setBoardLoading] = useState(true);

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

  const {
    tweets,
    setTweets,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    updateTweetStatus,
    boardInfo,
    error: tweetsError,
    loading: tweetsLoading,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const { pointsData, getPoints } = usePoints(token, onLogout, navigate);
  const [prevPoints, setPrevPoints] = useState(pointsData?.total_points);
  const [isPointsSpent, setIsPointsSpent] = useState(false);
  const timerRef = useRef(null);

  // Determine user role
  const userRole = boardData?.creator_id === currentUser?.anonymous_id
    ? "owner"
    : boardData?.members?.find((m) => m.anonymous_id === currentUser?.anonymous_id)?.role || "viewer";
  const canEdit = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    if (pointsData?.total_points < prevPoints) {
      setIsPointsSpent(true);
      timerRef.current = setTimeout(() => setIsPointsSpent(false), 700);
    }
    setPrevPoints(pointsData?.total_points);
    return () => clearTimeout(timerRef.current);
  }, [pointsData?.total_points, prevPoints]);

  useEffect(() => {
    if (!boardId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setBoardLoading(true);
        await Promise.all([
          getPoints(controller.signal),
          fetchTweets({ signal: controller.signal }),
        ]);
      } catch (err) {
        console.error("Error loading board data:", err);
      } finally {
        setBoardLoading(false);
      }
    })();
    return () => controller.abort();
  }, [boardId, fetchTweets, getPoints]);

  const loadAvailableBoards = useCallback(async () => {
    try {
      const res = await fetch("/api/boards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAvailableBoards(data?.content || []);
    } catch (err) {
      console.error("Failed to load boards", err);
    }
  }, [token]);

  const handleCreateTweet = useCallback(
    async (text, x, y) => {
      try {
        await createNewTweet(text, x, y, replyTweet?.tweet_id);
        setReplyTweet(null);
        await getPoints();
      } catch (err) {
        console.error("Error creating tweet:", err);
      }
    },
    [createNewTweet, replyTweet, getPoints]
  );

  const handleUpdateTweet = useCallback(
    async (id, updates) => {
      try {
        await updateExistingTweet(id, updates);
        await getPoints();
      } catch (err) {
        console.error("Error updating tweet:", err);
      }
    },
    [updateExistingTweet, getPoints]
  );

  const handleToggleLikeTweet = useCallback(
    async (id, isLiked) => {
      try {
        await toggleLikeTweet(id, isLiked);
        await getPoints();
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    },
    [toggleLikeTweet, getPoints]
  );

  const handleDeleteTweet = useCallback(
    async (id) => {
      try {
        await deleteExistingTweet(id);
        await getPoints();
      } catch (err) {
        console.error("Error deleting tweet:", err);
      }
    },
    [deleteExistingTweet, getPoints]
  );

  const handleEditTweet = useCallback(
    async (tweet) => {
      await loadAvailableBoards();
      setSelectedBoardId(tweet.board_id || boardId);
      setNewStatus(tweet.status || "approved");
      setEditTweetModal({ ...tweet });
    },
    [loadAvailableBoards, boardId]
  );

  const handleSaveEditedTweet = useCallback(async () => {
    if (!editTweetModal) return;
    try {
      await updateExistingTweet(editTweetModal.tweet_id, {
        content: editTweetModal.content,
        status: newStatus,
        position: editTweetModal.position,
      });
      if (editTweetModal.board_id !== selectedBoardId) {
        await moveTweet(editTweetModal.tweet_id, selectedBoardId);
      }
      setEditTweetModal(null);
      fetchTweets();
    } catch (err) {
      console.error("Error saving edited tweet:", err);
    }
  }, [
    editTweetModal,
    updateExistingTweet,
    moveTweet,
    fetchTweets,
    newStatus,
    selectedBoardId,
  ]);

  const handleMoveTweet = useCallback(
    async (tweet) => {
      await loadAvailableBoards();
      setSelectedBoardId(tweet.board_id || boardId);
      setEditTweetModal({ ...tweet });
    },
    [loadAvailableBoards, boardId]
  );

  const handleChangeTweetType = useCallback((tweet) => {
    setNewStatus(tweet.status || "approved");
    setEditTweetModal({ ...tweet });
  }, []);

  const handleReplyHover = useCallback((parentTweetId) => {
    setHighlightedParentId(parentTweetId);
  }, []);

  const handleReply = useCallback(
    (tweet) => {
      const tweetElement = document.getElementById(`tweet-${tweet.tweet_id}`);
      const parentTweetHeight = tweetElement
        ? tweetElement.getBoundingClientRect().height
        : 150;
      setReplyTweet(tweet);
      setTweetPopup({
        visible: true,
        x: tweet.position.x,
        y: tweet.position.y + (parentTweetHeight + 10) / scale,
      });
    },
    [scale]
  );

  const handleEditBoard = useCallback(async () => {
    const latestBoard = await boardData();
    if (latestBoard) {
      setEditingBoard({ ...latestBoard });
    }
  }, [boardData, setEditingBoard]);

  const renderedTweets = useMemo(() => {
    return tweets.map((tweet) => {
      const replyCount = tweets.filter(
        (t) => t.parent_tweet_id === tweet.tweet_id
      ).length;
      let parentTweetText = null;
      if (tweet.parent_tweet_id) {
        const parentTweet = tweets.find(
          (t) => t.tweet_id === tweet.parent_tweet_id
        );
        parentTweetText = parentTweet?.content?.value || null;
      }
      return (
        <DraggableTweet
          key={tweet.tweet_id}
          tweet={tweet}
          onStop={(e, data) =>
            handleUpdateTweet(tweet.tweet_id, {
              position: { x: data.x, y: data.y },
            })
          }
          currentUser={currentUser}
        >
          <TweetContent
            tweet={tweet}
            currentUser={currentUser}
            onLike={handleToggleLikeTweet}
            onDelete={handleDeleteTweet}
            onReply={handleReply}
            onReplyHover={handleReplyHover}
            onEdit={handleEditTweet}
            onMove={handleMoveTweet}
            onChangeType={handleChangeTweetType}
            isParentHighlighted={
              tweet.tweet_id === highlightedParentId ||
              tweet.parent_tweet_id === highlightedParentId
            }
            replyCount={replyCount}
            parentTweetText={parentTweetText}
          />
        </DraggableTweet>
      );
    });
  }, [
    tweets,
    currentUser,
    handleUpdateTweet,
    handleToggleLikeTweet,
    handleDeleteTweet,
    handleReply,
    handleReplyHover,
    handleEditTweet,
    handleMoveTweet,
    handleChangeTweetType,
    highlightedParentId,
  ]);

  useEffect(() => {
    if (!boardLoading && boardMainRef.current) {
      console.log("Centering board after data load...");
      centerBoard();
    }
  }, [boardLoading, centerBoard]);

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

  if (tweetsError) return <Typography color="error">{tweetsError}</Typography>;
  if (boardLoading || tweetsLoading) return <LoadingSpinner />;

  return (
    <AnimatePresence>
      <motion.div
        key="board-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1100 }}>
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
                backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
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
                    onClose={() => setTweetPopup((prev) => ({ ...prev, visible: false }))}
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
                <IconButton size="small" aria-label="Available points">
                  <Toll sx={{ color: "text.primary" }} />
                </IconButton>
              </Tooltip>
              <AnimatedPoints points={pointsData?.total_points} />
              {isPointsSpent && <PointsDeductionAnimation />}
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
                  <Badge badgeContent={members.length} color="default">
                    <PeopleIcon sx={{ color: "text.primary" }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title={boardData?.is_liked ? "Unlike Board" : "Like Board"}>
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
              {canEdit && (
                <Tooltip title="Edit Board">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBoard();
                    }}
                    sx={{ p: 1, color: "text.primary" }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {boardInfo?.child_board_ids?.length > 0 && (
                <Tooltip title="Child Boards">
                  <IconButton
                    onClick={() => navigate(`/board/${boardInfo.child_board_ids[0]}`)}
                  >
                    <Typography variant="caption">
                      Child Boards ({boardInfo.child_board_ids.length})
                    </Typography>
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Popover
              open={Boolean(membersAnchorEl)}
              anchorEl={membersAnchorEl}
              onClose={() => setMembersAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ p: 2, maxHeight: 300, overflowY: "auto" }}>
                <Typography variant="h6" gutterBottom>
                  Members
                </Typography>
                {members.length > 0 ? (
                  <List dense>
                    {members.map((member) => (
                      <ListItem key={member.anonymous_id}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
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

          {editTweetModal && (
            <Dialog
              open
              onClose={() => setEditTweetModal(null)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Edit Tweet</DialogTitle>
              <DialogContent>
                <TextField
                  multiline
                  fullWidth
                  label="Tweet Content"
                  value={editTweetModal.content?.value || ""}
                  onChange={(e) =>
                    setEditTweetModal((prev) => ({
                      ...prev,
                      content: { ...prev.content, value: e.target.value },
                    }))
                  }
                  sx={{ mt: 2 }}
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Tweet Type</InputLabel>
                  <Select
                    value={newStatus}
                    label="Tweet Type"
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="pinned">Pinned</MenuItem>
                    <MenuItem value="reminder">Reminder</MenuItem>
                    <MenuItem value="announcement">Announcement</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Move to Board</InputLabel>
                  <Select
                    value={selectedBoardId}
                    label="Move to Board"
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                  >
                    {availableBoards.map((b) => (
                      <MenuItem key={b.board_id} value={b.board_id}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditTweetModal(null)}>Cancel</Button>
                <Button onClick={handleSaveEditedTweet} variant="contained">
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
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
  setEditingBoard: PropTypes.func.isRequired,
};

export default Board;