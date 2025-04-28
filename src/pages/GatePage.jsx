import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Skeleton, Typography } from "@mui/material";
import { Add, Edit, Delete, Public, Lock, People, Forum, Star } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, deleteButtonStyle } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { debounce } from "lodash";

const GatePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { gate_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gate: gateData,
    members,
    stats,
    fetchGate,
    fetchGateMembersList,
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    toggleFavoriteGate,
    setGate,
    loading: gatesLoading,
    error,
    updateMemberRole,
  } = useGates(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingGate, setEditingGate] = useState(null);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    is_public: true,
    gate_id,
    type: "group",
  });
  const [editingClass, setEditingClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadGateData = useCallback(async () => {
    if (!gate_id || !token) {
      showNotification("Gate ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    try {
      await Promise.all([
        fetchGate(gate_id, controller.signal),
        fetchGateMembersList(gate_id, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load gate data.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [gate_id, token, fetchGate, fetchGateMembersList, showNotification]);

  useEffect(() => {
    if (isAuthenticated) loadGateData();
  }, [loadGateData, isAuthenticated]);

  useEffect(() => {
    if (error) {
      showNotification(error, "error");
    }
  }, [error, showNotification]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filteredClasses = useMemo(() => {
    const classes = gateData?.classes || [];
    return classes.filter((classItem) => {
      const matchesSearch = classItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return classItem.is_public;
      if (quickFilter === "private") return !classItem.is_public;
      if (quickFilter === "favorited") return classItem.is_favorited;
      return true;
    });
  }, [gateData, quickFilter, searchQuery]);

  const handleOpenCreateClass = () => setCreateClassDialogOpen(true);
  const handleCancelCreateClass = () => {
    setCreateClassDialogOpen(false);
    setPopupClass({ name: "", description: "", is_public: true, gate_id, type: "group" });
  };

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/gates/${gate_id}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(popupClass),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0] || "Failed to create class");
      }
      const newClass = await response.json();
      setGate((prev) => ({
        ...prev,
        classes: [...(prev.classes || []), newClass],
      }));
      setCreateClassDialogOpen(false);
      setPopupClass({ name: "", description: "", is_public: true, gate_id, type: "group" });
      showNotification("Class created successfully!", "success");
      navigate(`/class/${newClass.class_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, popupClass, token, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/classes/${editingClass.class_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingClass),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0] || "Failed to update class");
      }
      const updatedClass = await response.json();
      setGate((prev) => ({
        ...prev,
        classes: prev.classes.map((c) =>
          c.class_id === updatedClass.class_id ? updatedClass : c
        ),
      }));
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, token, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    setActionLoading(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/classes/${classToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGate((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.class_id !== classToDelete),
      }));
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification("Class deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    } finally {
      setActionLoading(false);
    }
  }, [classToDelete, token, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, loadGateData, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingGate(gate_id);
      showNotification("Gate deleted successfully!", "success");
      navigate("/gates");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, deleteExistingGate, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    try {
      await toggleFavoriteGate(gate_id, gateData.is_favorited);
      showNotification(
        gateData.is_favorited ? "Gate removed from favorites!" : "Gate added to favorites!",
        "success"
      );
    } catch (err) {
      showNotification(
        gateData.is_favorited
          ? "Failed to remove gate from favorites"
          : "Failed to add gate to favorites",
        "error"
      );
    }
  }, [gate_id, gateData, toggleFavoriteGate, showNotification]);

  const handleAddMember = useCallback(
    async (gateId, memberData) => {
      if (members.length >= gateData.settings?.max_members) {
        showNotification("Maximum member limit reached!", "error");
        return;
      }
      setActionLoading(true);
      try {
        await addMemberToGate(gateId, memberData);
        showNotification("Member added successfully!", "success");
        await loadGateData();
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [gate_id, members, gateData, addMemberToGate, showNotification, loadGateData]
  );

  const handleRemoveMember = useCallback(
    async (gateId, memberId) => {
      setActionLoading(true);
      try {
        await removeMemberFromGate(gateId, memberId);
        showNotification("Member removed successfully!", "success");
        await loadGateData();
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [gate_id, removeMemberFromGate, showNotification, loadGateData]
  );

  const handleUpdateMemberRole = useCallback(
    async (gateId, memberId, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(gateId, memberId, newRole);
        showNotification("Member role updated successfully!", "success");
        await loadGateData();
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [gate_id, updateMemberRole, showNotification, loadGateData]
  );

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSearchQuery("");
  };

  const userRole = members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "none";
  const canManage = ["owner", "admin"].includes(userRole);

  if (authLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
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

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (!gateData) {
    showNotification("Gate not found", "error");
    navigate("/gates");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              onClick={handleOpenCreateClass}
              startIcon={<Add />}
              sx={actionButtonStyles}
              disabled={actionLoading}
              aria-label="Create a new class"
            >
              Create Class
            </Button>
            {canManage && (
              <>
                <Button
                  onClick={() =>
                    setEditingGate({
                      gate_id: gateData.gate_id,
                      name: gateData.name,
                      description: gateData.description,
                      is_public: gateData.is_public,
                      visibility: gateData.is_public ? "public" : "private",
                      settings: gateData.settings,
                    })
                  }
                  startIcon={<Edit />}
                  sx={actionButtonStyles}
                  disabled={actionLoading}
                  aria-label="Edit gate"
                >
                  Edit Gate
                </Button>
                <Button
                  onClick={() => setMemberDialogOpen(true)}
                  startIcon={<Add />}
                  sx={actionButtonStyles}
                  disabled={actionLoading}
                  aria-label="Manage members"
                >
                  Manage Members
                </Button>
                {userRole === "owner" && (
                  <Button
                    onClick={handleDeleteGate}
                    startIcon={<Delete />}
                    sx={deleteButtonStyle}
                    disabled={actionLoading}
                    aria-label="Delete gate"
                  >
                    Delete Gate
                  </Button>
                )}
              </>
            )}
          </Box>
        </ProfileHeader>
        <Box sx={{ my: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {gateData.name || "Untitled Gate"}
          </Typography>
          {gateData.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {gateData.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
            <Chip
              label={gateData.is_public ? "Public" : "Private"}
              icon={gateData.is_public ? <Public /> : <Lock />}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Members: ${stats?.member_count || members.length}`}
              icon={<People />}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Classes: ${gateData.classes?.length || 0}`}
              icon={<Forum />}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Favorites: ${stats?.favorite_count || 0}`}
              icon={<Star />}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Owner: ${gateData.creator?.username || 'Unknown'}`}
              size="small"
              variant="outlined"
            />
          </Box>
          <Button
            onClick={handleFavoriteToggle}
            startIcon={gateData.is_favorited ? <Star color="warning" /> : <Star />}
            sx={{ mt: 2 }}
            aria-label={gateData.is_favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {gateData.is_favorited ? "Remove from Favorites" : "Add to Favorites"}
          </Button>
        </Box>
        <ClassesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
        />
        <ClassesGrid
          filteredClasses={filteredClasses}
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleRemoveMember={handleRemoveMember}
          members={members}
          navigate={navigate}
          currentUser={authData}
        />
      </Box>
      <ClassFormDialog
        open={createClassDialogOpen}
        title="Create New Class"
        classData={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
        token={token}
        gates={[{ gate_id, name: gateData.name }]}
        disabled={actionLoading}
      />
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
          token={token}
          gates={[{ gate_id, name: gateData.name }]}
          disabled={actionLoading}
        />
      )}
      {editingGate && (
        <GateFormDialog
          open={true}
          title="Edit Gate"
          gate={editingGate}
          setGate={setEditingGate}
          onSave={handleUpdateGate}
          onCancel={() => setEditingGate(null)}
          disabled={actionLoading}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Members"
        gateId={gate_id}
        token={token}
        onSave={() => {}}
        onCancel={() => setMemberDialogOpen(false)}
        disabled={actionLoading}
        members={members}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class? This action cannot be undone."
        disabled={actionLoading}
      />
    </AppLayout>
  );
};

export default React.memo(GatePage);