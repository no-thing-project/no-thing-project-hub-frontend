import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Group as GroupIcon,
  Topic as TopicIcon,
  Forum as ForumIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material";
import AppLayout from "../components/Layout/AppLayout";
import useAuth from "../hooks/useAuth";
import useBoards from "../hooks/useBoards";
import { useNotification } from "../context/NotificationContext";
import { BASE_SHADOW, HOVER_SHADOW } from "../styles/BaseStyles"; // Assuming BaseStyles exports these

// Reusable style objects aligned with provided styles
const baseButtonStyles = {
  borderRadius: "24px",
  textTransform: "none",
  transition: "all 0.2s ease",
  "&:hover": { transform: "scale(1.02)", bgcolor: "primary.dark" },
  "&:active": { transform: "scale(0.98)" },
  "&:focus": {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
};

const baseHoverEffect = {
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: HOVER_SHADOW,
  },
  "&:focus": {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
};

const baseTypographyStyles = {
  color: "text.primary",
  fontWeight: 400,
  lineHeight: 1.6,
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { token, authData: currentUser, isAuthenticated, handleLogout, authLoading } =
    useAuth(navigate);
  const { createNewBoard, loading: boardsLoading } = useBoards(token, handleLogout, navigate);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, currentUser, token, navigate]);

  // Create new board
  const handleCreateBoard = useCallback(async () => {
    try {
      const newBoard = await createNewBoard({
        name: `Дошка ${currentUser.username}`,
        visibility: "private",
      });
      if (newBoard) {
        showNotification("Дошку створено успішно!", "success");
        navigate(`/board/${newBoard.board_id}`);
      }
    } catch (err) {
      showNotification(err.message || "Не вдалося створити дошку", "error");
    }
  }, [createNewBoard, navigate, showNotification, currentUser]);

  if (authLoading || boardsLoading) {
    return (
      <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
          <Typography sx={baseTypographyStyles}>Завантаження...</Typography>
        </Box>
      </AppLayout>
    );
  }

  if (!currentUser) return null;

  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
        {/* Welcome Section */}
        <Box sx={{ textAlign: "center", py: 4, mb: 4 }}>
          <Typography
            variant="h4"
            sx={{ ...baseTypographyStyles, fontWeight: 700, mb: 2 }}
          >
            Вітаємо, {currentUser.username}!
          </Typography>
          <Typography
            variant="h6"
            sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 3, maxWidth: 700, mx: "auto" }}
          >
            Приєднуйтесь до однодумців, діліться ідеями та обговорюйте деталі на дошках.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBoard}
              sx={{
                ...baseButtonStyles,
                px: 4,
                py: 1.2,
                fontSize: "1rem",
                fontWeight: 600,
                [theme.breakpoints.down("sm")]: { fontSize: "0.9rem", px: 3 },
              }}
              aria-label="Створити приватну дошку"
            >
              Створити приватну дошку
            </Button>
          </Box>
        </Box>

        {/* Platform Overview */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 3 }}
          >
            Досліджуйте платформу
          </Typography>
          <Grid container spacing={3}>
            {/* Gates Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  boxShadow: BASE_SHADOW,
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
                  transition: "all 0.3s ease",
                  ...baseHoverEffect,
                }}
              >
                <CardContent>
                  <GroupIcon
                    sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 1 }}
                  >
                    Gates — спільноти однодумців
                  </Typography>
                  <Typography sx={{ ...baseTypographyStyles, color: "text.secondary" }}>
                    Gates — це головні теми, де ви знаходите людей зі схожими інтересами. Приєднуйтесь, спілкуйтесь і створюйте події!
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", p: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/gates")}
                    sx={{
                      ...baseButtonStyles,
                      px: 3,
                      py: 0.8,
                      fontSize: "0.9rem",
                      borderColor: theme.palette.grey[300],
                    }}
                    aria-label="Переглянути Gates"
                  >
                    Переглянути Gates
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Classes Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  boxShadow: BASE_SHADOW,
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
                  transition: "all 0.3s ease",
                  ...baseHoverEffect,
                }}
              >
                <CardContent>
                  <TopicIcon
                    sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 1 }}
                  >
                    Classes — поглиблені дискусії
                  </Typography>
                  <Typography sx={{ ...baseTypographyStyles, color: "text.secondary" }}>
                    Classes — це підтеми в Gates для детального обговорення конкретних ідей чи питань із вашою спільнотою.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", p: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/classes")}
                    sx={{
                      ...baseButtonStyles,
                      px: 3,
                      py: 0.8,
                      fontSize: "0.9rem",
                      borderColor: theme.palette.grey[300],
                    }}
                    aria-label="Переглянути Classes"
                  >
                    Переглянути Classes
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Boards Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  boxShadow: BASE_SHADOW,
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
                  transition: "all 0.3s ease",
                  ...baseHoverEffect,
                }}
              >
                <CardContent>
                  <ForumIcon
                    sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 1 }}
                  >
                    Boards — місце для спілкування
                  </Typography>
                  <Typography sx={{ ...baseTypographyStyles, color: "text.secondary" }}>
                    Boards — це основні місця для дискусій. Пишіть твіти, коментуйте та ділітесь ідеями з іншими!
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", p: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/boards")}
                    sx={{
                      ...baseButtonStyles,
                      px: 3,
                      py: 0.8,
                      fontSize: "0.9rem",
                      borderColor: theme.palette.grey[300],
                    }}
                    aria-label="Переглянути Boards"
                  >
                    Переглянути Boards
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Points Explanation */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h5"
            sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 3 }}
          >
            Як працюють поінти?
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  borderRadius: 3,
                  boxShadow: BASE_SHADOW,
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
                  transition: "all 0.3s ease",
                  ...baseHoverEffect,
                }}
              >
                <CardContent>
                  <StarIcon
                    sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 2 }}
                  />
                  <Typography
                    sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 2, fontSize: "1.1rem" }}
                  >
                    Поінти — це валюта платформи, яка мотивує вас активно спілкуватися:
                  </Typography>
                  <Typography
                    component="ul"
                    sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 2, fontSize: "1.1rem", pl: 3 }}
                  >
                    <li>
                      <strong>Створюйте контент</strong>: Створення Gates, Classes, Boards чи твітів коштує поінти (наприклад, дошка — 100-150 поінтів, твіт — 10 поінтів).
                    </li>
                    <li>
                      <strong>Взаємодійте</strong>: Лайки чи додавання в обране також потребують поінти, які йдуть творцям контенту.
                    </li>
                    <li>
                      <strong>Заробляйте</strong>: Отримуйте поінти, коли інші взаємодіють із вашими дошками чи твітами (лайкають, коментують).
                    </li>
                    <li>
                      <strong>Будьте активними</strong>: Чим більше ви пишете, коментуєте чи запрошуєте друзів, тим більше поінтів заробляєте!
                    </li>
                  </Typography>
                  <Typography
                    sx={{ ...baseTypographyStyles, color: "text.secondary", fontSize: "1.1rem" }}
                  >
                    Поінти роблять спілкування цікавим і винагороджують вашу активність. Почніть із створення дошки чи твіту!
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", p: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/boards")}
                    sx={{
                      ...baseButtonStyles,
                      px: 3,
                      py: 0.8,
                      fontSize: "0.9rem",
                      borderColor: theme.palette.grey[300],
                    }}
                    aria-label="Створити твіт"
                  >
                    Створити твіт
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Gate Explanation */}
        <Box
          sx={{
            p: 4,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: BASE_SHADOW,
            border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
            transition: "all 0.3s ease",
            ...baseHoverEffect,
          }}
        >
          <Typography
            variant="h5"
            sx={{ ...baseTypographyStyles, fontWeight: 600, mb: 2 }}
          >
            Чому варто приєднатися до Gate?
          </Typography>
          <Typography
            variant="h6"
            sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 2, fontWeight: 500 }}
          >
            Це соціальна мережа для ідей і спілкування
          </Typography>
          <Typography
            sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 3, fontSize: "1.1rem" }}
          >
            Gate — це місце, де ви знаходите однодумців і разом створюєте щось унікальне. Поєднання Twitter, Reddit, Telegram та Instagram, Gate дозволяє вам спілкуватися, ділитися ідеями та будувати спільноти. У Gate ви можете:
          </Typography>
          <Typography
            component="ul"
            sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 3, fontSize: "1.1rem", pl: 3 }}
          >
            <li>Знаходити людей, які поділяють ваші інтереси.</li>
            <li>Створювати дошки для обговорень і ділитися думками.</li>
            <li>Обговорювати деталі в класах із вашою спільнотою.</li>
            <li>Писати твіти, коментувати та підтримувати інших.</li>
            <li>Організовувати події чи працювати над проєктами.</li>
          </Typography>
          <Typography
            sx={{ ...baseTypographyStyles, color: "text.secondary", mb: 3, fontSize: "1.1rem" }}
          >
            Gates бувають публічними чи приватними — ви вирішуєте, з ким ділитися. Почніть із дошки чи приєднання до Gate!
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/gates")}
              sx={{
                ...baseButtonStyles,
                px: 4,
                py: 1.2,
                fontSize: "1rem",
                fontWeight: 600,
                [theme.breakpoints.down("sm")]: { fontSize: "0.9rem" },
              }}
              aria-label="Знайти свою спільноту"
            >
              Знайти свою спільноту
            </Button>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
};

export default DashboardPage;