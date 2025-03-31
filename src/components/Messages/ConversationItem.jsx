import React, { useState } from "react";
import PropTypes from "prop-types";
import { ListItem, ListItemText, Badge, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import { Delete } from "@mui/icons-material";

const ConversationItem = ({ id, name, isGroup, lastMessage, unreadCount, selected, onSelect, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <ListItem
        onClick={() => onSelect(id)}
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
        <IconButton size="small" onClick={handleDeleteClick}>
          <Delete />
        </IconButton>
      </ListItem>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete {isGroup ? "this group chat" : "this conversation"}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

ConversationItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isGroup: PropTypes.bool.isRequired,
  lastMessage: PropTypes.object,
  unreadCount: PropTypes.number,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

ConversationItem.defaultProps = {
  lastMessage: null,
  unreadCount: 0,
  selected: false,
};

export default ConversationItem;