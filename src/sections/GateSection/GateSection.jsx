// src/sections/GateSection/GateSection.jsx
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { Add, Edit, Delete, Favorite, FavoriteBorder } from "@mui/icons-material";
import UserHeader from "../../components/Headers/UserHeader";

const containerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  p: 3,
  bgcolor: "background.paper",
  minHeight: "calc(100vh - 64px)",
};

const buttonStyles = {
  textTransform: "none",
  borderRadius: 2,
  px: 3,
  py: 1,
  fontSize: "1rem",
};

const cardGridStyles = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(250px, 1fr))" },
  gap: 2,
};

const cardStyles = {
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": { transform: "scale(1.02)", boxShadow: 3 },
};

const GateSection = React.memo(
  ({ currentUser, gateData, classes, members, onCreate, onUpdate, onDelete, onLike, onStatusUpdate, onAddMember, onRemoveMember }) => {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [memberDialogOpen, setMemberDialogOpen] = useState(false);
    const [newMemberId, setNewMemberId] = useState("");
    const [membersAnchorEl, setMembersAnchorEl] = useState(null);

    const isOwner = currentUser?.anonymous_id === gateData?.creator_id;
    const isLiked = gateData?.liked_by?.includes(currentUser?.anonymous_id);

    const handleClassClick = useCallback(
      (class_id) => {
        if (class_id) {
          navigate(`/class/${class_id}`);
        } else {
          console.error("Invalid class ID for navigation");
        }
      },
      [navigate]
    );

    const handleStatusSubmit = () => {
      onStatusUpdate({ isActive: !gateData.isActive });
      setStatusDialogOpen(false);
    };

    const handleAddMemberSubmit = () => {
      if (newMemberId.trim()) {
        onAddMember({ user_id: newMemberId });
        setMemberDialogOpen(false);
        setNewMemberId("");
      }
    };

    if (!currentUser || !gateData) {
      return (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography variant="h6" color="error">
            Error: User or gate data is missing. Please try again.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={containerStyles}>
        <UserHeader
          username={currentUser.username}
          accessLevel={currentUser.access_level}
          actionButton={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" startIcon={<Add />} onClick={onCreate} sx={buttonStyles}>
                Create Class
              </Button>
              {isOwner && (
                <>
                  <Button variant="outlined" startIcon={<Edit />} onClick={onUpdate} sx={buttonStyles}>
                    Update Gate
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={buttonStyles}
                    color="error"
                  >
                    Delete Gate
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setStatusDialogOpen(true)}
                    sx={buttonStyles}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setMemberDialogOpen(true)}
                    sx={buttonStyles}
                  >
                    Add Member
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                onClick={(e) => setMembersAnchorEl(e.currentTarget)}
                sx={buttonStyles}
              >
                View Members
              </Button>
              <IconButton onClick={() => onLike(isLiked)}>
                {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
            </Box>
          }
        />
        <Typography variant="h5" sx={{ mb: 2 }}>
          {gateData.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {gateData.description || "No description provided."}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Status: {gateData.isActive ? "Active" : "Inactive"}
        </Typography>

        {classes.length > 0 ? (
          <Box sx={cardGridStyles}>
            {classes.map((classItem) => (
              <Card
                key={classItem.class_id}
                sx={cardStyles}
                onClick={() => handleClassClick(classItem.class_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClassClick(classItem.class_id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open class ${classItem.name}`}
              >
                <CardContent>
                  <Typography variant="h6">{classItem.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {classItem.description || "No description"}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
            <Typography variant="h5" sx={{ color: "text.secondary" }}>
              No classes found in this gate
            </Typography>
          </Box>
        )}

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this gate? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={onDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Update Gate Status</DialogTitle>
          <DialogContent>
            <Typography>
              Current Status: {gateData.isActive ? "Active" : "Inactive"}<br />
              New Status: {gateData.isActive ? "Inactive" : "Active"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleStatusSubmit} color="primary" autoFocus>
              Update
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)}>
          <DialogTitle>Add Member to Gate</DialogTitle>
          <DialogContent>
            <TextField
              label="User ID"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMemberDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleAddMemberSubmit} color="primary" autoFocus>
              Add
            </Button>
          </DialogActions>
        </Dialog>

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
            {members?.length > 0 ? (
              <List dense>
                {members.map((member) => (
                  <ListItem key={member.user_id}>
                    <ListItemText
                      primary={member.username || "Anonymous"}
                      secondary={member.role || "Member"}
                    />
                    {isOwner && (
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => onRemoveMember(member.user_id)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No members found.</Typography>
            )}
          </Box>
        </Popover>
      </Box>
    );
  }
);

GateSection.displayName = "GateSection";

export default GateSection;