import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Skeleton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, BarChart as BarChartIcon } from "@mui/icons-material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AppLayout from "../components/Layout/AppLayout";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import useBoards from "../hooks/useBoards";
import { useClasses } from "../hooks/useClasses";
import { useGates } from "../hooks/useGates";
import { useNotification } from "../context/NotificationContext";
import { actionButtonStyles, cancelButtonStyle } from "../styles/BaseStyles";
import BoardCard from "../components/Boards/BoardsCard";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardPage = memo(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { anonymous_id } = useParams();
  const { token, authData: currentUser, isAuthenticated, handleLogout, updateAuthData, loading: authLoading } =
    useAuth(navigate);
  const {
    profileData: fetchedProfileData,
    loading: profileLoading,
    error: profileError,
    fetchProfileData,
    clearProfileState,
  } = useProfile(token, currentUser, handleLogout, navigate, updateAuthData);
  const { boards, fetchBoardsList, loading: boardsLoading, error: boardsError, createNewBoard } =
    useBoards(token, handleLogout, navigate);
  const { classes, fetchClassesList, loading: classesLoading, error: classesError } =
    useClasses(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } =
    useGates(token, handleLogout, navigate);

  const initialAnonymousIdRef = useRef(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  // Filter owned and favorite boards, classes, and gates
  const ownedBoards = boards.filter((board) => board.owner_id === currentUser?.anonymous_id);
  const favoriteBoards = boards.filter((board) => board.is_favorited);
  const favoriteClasses = classes.filter((cls) => cls.is_favorited);
  const favoriteGates = gates.filter((gate) => gate.is_favorited);

  // Mock statistics data (replace with actual API call)
  const statsData = useMemo(
    () => ({
      boardsCreated: ownedBoards.length,
      postsMade: ownedBoards.reduce((sum, board) => sum + (board.posts?.length || 0), 0),
      activity: [
        { date: "2025-04-01", actions: 10 },
        { date: "2025-04-02", actions: 15 },
        { date: "2025-04-03", actions: 8 },
        { date: "2025-04-04", actions: 20 },
        { date: "2025-04-05", actions: 12 },
      ],
    }),
    [ownedBoards]
  );

  // Chart data and options
  const chartData = useMemo(
    () => ({
      labels: statsData.activity.map((item) => item.date),
      datasets: [
        {
          label: "User Activity",
          data: statsData.activity.map((item) => item.actions),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.4,
          fill: false,
        },
      ],
    }),
    [statsData, theme]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Activity Over Time" },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: { title: { display: true, text: "Actions" }, beginAtZero: true },
    },
  };

  // Set initial anonymous ID
  useEffect(() => {
    if (currentUser?.anonymous_id && !initialAnonymousIdRef.current) {
      initialAnonymousIdRef.current = currentUser.anonymous_id;
    }
  }, [currentUser]);

  // Fetch profile, boards, classes, and gates
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      clearProfileState();
      navigate("/login");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      if (!initialAnonymousIdRef.current) {
        handleLogout("User data is incomplete. Please log in again.");
        return;
      }

      const targetId = anonymous_id || initialAnonymousIdRef.current;

      // Fetch profile if viewing another user's profile
      if (anonymous_id && anonymous_id !== initialAnonymousIdRef.current) {
        try {
          const result = await fetchProfileData(targetId, signal);
          if (!result?.profileData) {
            navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            if (err.message === "Profile not found") {
              navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
            } else {
              showNotification(err.message || "Failed to load profile", "error");
            }
          }
        }
      }

      // Fetch boards, classes, and gates
      try {
        await Promise.all([
          fetchBoardsList({}, signal),
          fetchClassesList({}, signal),
          fetchGatesList({ visibility: "public" }, signal),
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load data", "error");
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [
    anonymous_id,
    currentUser,
    token,
    isAuthenticated,
    authLoading,
    navigate,
    fetchProfileData,
    handleLogout,
    clearProfileState,
    showNotification,
    fetchBoardsList,
    fetchClassesList,
    fetchGatesList,
  ]);

  // Handle errors
  useEffect(() => {
    if (profileError) showNotification(profileError, "error");
    if (boardsError) showNotification(boardsError, "error");
    if (classesError) showNotification(classesError, "error");
    if (gatesError) showNotification(gatesError, "error");
  }, [profileError, boardsError, classesError, gatesError, showNotification]);

  // Create new board
  const handleCreateBoard = useCallback(async () => {
    try {
      const newBoard = await createNewBoard({
        name: `Board of ${currentUser.username}`,
        visibility: "private",
      });
      if (newBoard) {
        showNotification("Board created successfully!", "success");
        navigate(`/board/${newBoard.board_id}`);
      }
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    }
  }, [createNewBoard, navigate, showNotification, currentUser]);

  // Open/close statistics dialog
  const handleOpenStatsDialog = useCallback(() => setStatsDialogOpen(true), []);
  const handleCloseStatsDialog = useCallback(() => setStatsDialogOpen(false), []);

  const isOwnProfile = !anonymous_id || anonymous_id === initialAnonymousIdRef.current;
  const profileData = isOwnProfile ? currentUser : fetchedProfileData;

  if (authLoading || (anonymous_id && anonymous_id !== initialAnonymousIdRef.current && profileLoading)) {
    return (
      <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
          <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!profileData) return null;

  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
        {/* Statistics Button */}
        {isOwnProfile && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={handleOpenStatsDialog}
              sx={{
                ...cancelButtonStyle,
                [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
              }}
              aria-label="View statistics"
            >
              Statistics
            </Button>
          </Box>
        )}
        {/* Owned Boards Section */}
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}>
          {isOwnProfile ? "Your Boards" : `${profileData.username}'s Boards`}
        </Typography>
        {boardsLoading ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} />
            ))}
          </Box>
        ) : ownedBoards.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4, backgroundColor: "background.paper", borderRadius: 2, boxShadow: "none" }}>
            <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.1rem" }}>
              {isOwnProfile ? "You haven't created any boards yet." : "No boards owned by this user."}
            </Typography>
            {isOwnProfile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateBoard}
                sx={{
                  ...actionButtonStyles,
                  [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                }}
                aria-label="Create my first board"
              >
                Create My First Board
              </Button>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
            }}
          >
            {ownedBoards.slice(0, 6).map((board) => (
              <BoardCard
                key={board.board_id}
                board={board}
                onClick={() => navigate(`/board/${board.board_id}`)}
                aria-label={`Board: ${board.name}`}
                sx={{
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                  },
                }}
              />
            ))}
          </Box>
        )}
        {/* Favorite Boards Section */}
        {isOwnProfile && (
          <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600, color: "text.primary" }}>
              Favorite Boards
            </Typography>
            {boardsLoading ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={200} />
                ))}
              </Box>
            ) : favoriteBoards.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, backgroundColor: "background.paper", borderRadius: 2, boxShadow: "none" }}>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.1rem" }}>
                  Boards are your personal spaces to organize posts, ideas, and collaborations. Favorite boards to keep them here!
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/boards")}
                  sx={{
                    ...cancelButtonStyle,
                    [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                  }}
                  aria-label="View boards"
                >
                  View Boards
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {favoriteBoards.slice(0, 6).map((board) => (
                  <BoardCard
                    key={board.board_id}
                    board={board}
                    onClick={() => navigate(`/board/${board.board_id}`)}
                    aria-label={`Board: ${board.name}`}
                    sx={{
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
        {/* Favorite Classes Section */}
        {isOwnProfile && (
          <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600, color: "text.primary" }}>
              Favorite Classes
            </Typography>
            {classesLoading ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={200} />
                ))}
              </Box>
            ) : favoriteClasses.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, backgroundColor: "background.paper", borderRadius: 2, boxShadow: "none" }}>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.1rem" }}>
                  Classes are learning hubs where you can join discussions, share knowledge, and grow. Favorite classes to access them quickly!
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/classes")}
                  sx={{
                    ...cancelButtonStyle,
                    [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                  }}
                  aria-label="View classes"
                >
                  View Classes
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {favoriteClasses.slice(0, 6).map((cls) => (
                  <BoardCard
                    key={cls.class_id}
                    board={{ ...cls, board_id: cls.class_id, name: cls.name, description: cls.description }}
                    onClick={() => navigate(`/class/${cls.class_id}`)}
                    aria-label={`Class: ${cls.name}`}
                    sx={{
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
        {/* Favorite Gates Section */}
        {isOwnProfile && (
          <>
            <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600, color: "text.primary" }}>
              Favorite Gates
            </Typography>
            {gatesLoading ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={200} />
                ))}
              </Box>
            ) : favoriteGates.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4, backgroundColor: "background.paper", borderRadius: 2, boxShadow: "none" }}>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.1rem" }}>
                  Gates are community portals for exclusive content and events. Favorite gates to stay connected!
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/gates")}
                  sx={{
                    ...cancelButtonStyle,
                    [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                  }}
                  aria-label="View gates"
                >
                  View Gates
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
                }}
              >
                {favoriteGates.slice(0, 6).map((gate) => (
                  <BoardCard
                    key={gate.gate_id}
                    board={{ ...gate, board_id: gate.gate_id, name: gate.name, description: gate.description }}
                    onClick={() => navigate(`/gate/${gate.gate_id}`)}
                    aria-label={`Gate: ${gate.name}`}
                    sx={{
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </>
        )}
        {/* Statistics Dialog */}
        <Dialog
          open={statsDialogOpen}
          onClose={handleCloseStatsDialog}
          maxWidth="md"
          fullWidth
          aria-labelledby="stats-dialog-title"
        >
          <DialogTitle id="stats-dialog-title">User Statistics</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Boards Created: {statsData.boardsCreated}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Posts Made: {statsData.postsMade}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ height: 250 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </Box>
    </AppLayout>
  );
});

export default DashboardPage;
