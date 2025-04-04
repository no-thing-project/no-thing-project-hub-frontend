import React, { memo } from "react";
import PropTypes from "prop-types";
import { ListItem, ListItemText, Badge, IconButton } from "@mui/material";
import { Delete } from "@mui/icons-material";

const ConversationItem = ({
  id,
  name,
  isGroup,
  lastMessage,
  unreadCount,
  selected,
  onSelect,
  onDelete,
}) => (
  <ListItem
    onClick={() => onSelect(isGroup ? `group:${id}` : id)}
    sx={{
      py: 1,
      cursor: "pointer",
      backgroundColor: selected ? "grey.200" : "inherit",
      "&:hover": { backgroundColor: "grey.100" },
    }}
  >
    <ListItemText
      primary={name}
      secondary={
        lastMessage
          ? lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? "..." : "")
          : "No messages yet"
      }
      primaryTypographyProps={{ fontWeight: unreadCount > 0 ? 600 : 400 }}
      secondaryTypographyProps={{ color: unreadCount > 0 ? "text.primary" : "text.secondary" }}
    />
    {unreadCount > 0 && <Badge badgeContent={unreadCount} color="primary" sx={{ mr: isGroup ? 4 : 2 }} />}
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(id);
      }}
    >
      <Delete />
    </IconButton>
  </ListItem>
);

ConversationItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isGroup: PropTypes.bool,
  lastMessage: PropTypes.object,
  unreadCount: PropTypes.number,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default memo(ConversationItem);