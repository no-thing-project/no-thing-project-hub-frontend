import { styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import { Avatar } from "@mui/material";

export const getInitials = (name) => {
  if (!name) return "";
  const names = name.split(" ");
  return names.length === 1
    ? name.charAt(0).toUpperCase()
    : (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
};

export function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: getInitials(name),
  };
}

// Кастомізований бейдж із підтримкою різних статусів та розміру
export const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== "badgeSize" && prop !== "status",
})(({ theme, badgeSize = 24, status = "online" }) => {
  const statusColors = {
    online: "#44b700",   // зелений – онлайн
    offline: "#d32f2f",  // червоний – офлайн
    private: "#808080",  // сірий – приватний
  };

  const color = statusColors[status] || statusColors.online;

  return {
    "& .MuiBadge-badge": {
      width: badgeSize,
      height: badgeSize,
      backgroundColor: color,
      color: color,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      fontSize: badgeSize / 2,
      "&::after": {
        position: "absolute",
        top: -1,
        left: -1,
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        animation: status === "online" ? "ripple 1.2s infinite ease-in-out" : "none",
        border: "1px solid currentColor",
        content: '""',
      },
    },
    "@keyframes ripple": {
      "0%": {
        transform: "scale(.8)",
        opacity: 1,
      },
      "100%": {
        transform: "scale(2.4)",
        opacity: 0,
      },
    },
  };
});

// Об'єднаний компонент аватара з бейджем
export const ProfileAvatar = ({ user, badgeSize = 10, status = "online", onClicEvent }) => {
  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      variant="dot"
      badgeSize={badgeSize}
      status={status}
    >
      <Avatar
        src={user.profile_picture || undefined}
        alt={user.username}
        className="user-avatar"
        onClick={onClicEvent}
        sx={{
          backgroundColor: user.profile_picture ? "transparent" : "text.primary",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          lineHeight: 1,
          cursor: "pointer"
        }}
        aria-label={`Profile of ${user.username}`}
        {...stringAvatar(user.username)}
      />
    </StyledBadge>
  );
};
