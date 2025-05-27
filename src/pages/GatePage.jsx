import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Skeleton, useTheme, Typography } from '@mui/material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import ClassesGrid from '../components/Classes/ClassesGrid';
import GateFormDialog from '../components/Dialogs/GateFormDialog';
import ClassFormDialog from '../components/Dialogs/ClassFormDialog';
import MemberFormDialog from '../components/Dialogs/MemberFormDialog';
import DeleteConfirmationDialog from '../components/Dialogs/DeleteConfirmationDialog';
import { useGates } from '../hooks/useGates';
import { useClasses } from '../hooks/useClasses';
import useAuth from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { Add, Public, Lock, People, Forum, Star } from '@mui/icons-material';
import { containerStyles, skeletonStyles, gridStyles } from '../styles/BaseStyles';
import Filters from '../components/Filters/Filters';

/**
 * GatePage component for displaying and managing a gate and its associated classes
 * @returns {JSX.Element} The rendered GatePage component
 */
const GatePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { gate_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gate: gateData,
    members,
    stats,
    gates,
    fetchGate,
    fetchGateMembersList,
    fetchGatesList,
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    updateMemberRole: updateGateMemberRole,
    toggleFavoriteGate,
    loading: gatesLoading,
    error: gateError,
  } = useGates(token, handleLogout, navigate);
  const {
    classes,
    fetchClassesByGate,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
    toggleFavoriteClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [editingGate, setEditingGate] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [popupClass, setPopupClass] = useState({
    name: '',
    description: '',
    is_public: false,
    visibility: 'private',
    gate_id: gate_id || '',
    type: 'group',
    settings: {
      max_boards: 100,
      max_members: 50,
      board_creation_cost: 50,
      tweet_cost: 1,
      allow_invites: true,
      require_approval: false,
      ai_moderation_enabled: true,
      auto_archive_after: 30,
    },
    tags: [],
  });

  const loadData = useCallback(
    async (signal) => {
      if (!gate_id || !token || !isAuthenticated) {
        showNotification('Gate ID or authentication missing.', 'error');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchGate(gate_id, signal),
          fetchGateMembersList(gate_id, signal),
          fetchClassesByGate(gate_id, {}, signal),
          fetchGatesList({ visibility: 'public' }, signal),
        ]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification(err.message || 'Failed to load gate or class data.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [gate_id, token, isAuthenticated, fetchGate, fetchGateMembersList, fetchClassesByGate, fetchGatesList, showNotification]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (gateError) showNotification(gateError, 'error');
    if (classesError) showNotification(classesError, 'error');
  }, [gateError, classesError, showNotification]);

  useEffect(() => {
    setPopupClass((prev) => ({ ...prev, gate_id }));
  }, [gate_id]);

  const debouncedSetSearchQuery = useMemo(() => debounce((value) => setSearchQuery(value), 300), []);

  const filteredClasses = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return (gateData?.classes || [])
      .map((classItem) => ({
        ...classItem,
        gateName: gateData?.name || 'Unknown Gate',
      }))
      .filter((classItem) => {
        const matchesSearch =
          classItem.name?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.description?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.gateName.toLowerCase().includes(lowerSearchQuery) ||
          classItem.tags?.some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
        if (!matchesSearch) return false;
        if (quickFilter === 'all') return true;
        if (quickFilter === 'public') return classItem.access?.is_public;
        if (quickFilter === 'private') return !classItem.access?.is_public;
        if (quickFilter === 'favorited') return classItem.is_favorited;
        if (quickFilter === 'group') return classItem.type === 'group';
        if (quickFilter === 'personal') return classItem.type === 'personal';
        return true;
      });
  }, [classes, gateData, quickFilter, searchQuery, gate_id]);

  const handleOpenCreateClass = useCallback(() => setCreateClassDialogOpen(true), []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({
      name: '',
      description: '',
      is_public: false,
      visibility: 'private',
      gate_id: gate_id || '',
      type: 'group',
      settings: {
        max_boards: 100,
        max_members: 50,
        board_creation_cost: 50,
        tweet_cost: 1,
        allow_invites: true,
        require_approval: false,
        ai_moderation_enabled: true,
        auto_archive_after: 30,
      },
      tags: [],
    });
  }, [gate_id]);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass({ ...popupClass, gate_id });
      setCreateClassDialogOpen(false);
      setPopupClass({
        name: '',
        description: '',
        is_public: false,
        visibility: 'private',
        gate_id: gate_id || '',
        type: 'group',
        settings: {
          max_boards: 100,
          max_members: 50,
          board_creation_cost: 50,
          tweet_cost: 1,
          allow_invites: true,
          require_approval: false,
          ai_moderation_enabled: true,
          auto_archive_after: 30,
        },
        tags: [],
      });
      showNotification('Class created successfully!', 'success');
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, gate_id, createNewClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditingClass(null);
      showNotification('Class updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingClass(classToDelete.class_id);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification('Class deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [classToDelete, deleteExistingClass, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification('Gate name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditingGate(null);
      showNotification('Gate updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingGate(gate_id);
      showNotification('Gate deleted successfully!', 'success');
      navigate('/gates');
    } catch (err) {
      showNotification(err.message || 'Failed to delete gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, deleteExistingGate, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    setActionLoading(true);
    try {
      await toggleFavoriteGate(gate_id, gateData?.is_favorited);
      showNotification(
        gateData?.is_favorited ? 'Gate removed from favorites!' : 'Gate added to favorites!',
        'success'
      );
    } catch (err) {
      showNotification(err.message || 'Failed to toggle favorite', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, gateData, toggleFavoriteGate, showNotification]);

  const handleAddGateMember = useCallback(
    async (gateId, memberData) => {
      setActionLoading(true);
      try {
        if (members.length >= gateData?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await addMemberToGate(gateId, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToGate, showNotification, members, gateData]
  );

  const handleRemoveGateMember = useCallback(
    async (gateId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromGate(gateId, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromGate, showNotification]
  );

  const handleUpdateGateMemberRole = useCallback(
    async (gateId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateGateMemberRole(gateId, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateGateMemberRole, showNotification]
  );

  const handleAddClassMember = useCallback(
    async (classId, memberData) => {
      setActionLoading(true);
      try {
        const classItem = classes.find((c) => c.class_id === classId);
        if (classItem?.members?.length >= classItem?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await addMemberToClass(classId, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToClass, showNotification, classes]
  );

  const handleRemoveClassMember = useCallback(
    async (classId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromClass(classId, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromClass, showNotification]
  );

  const handleUpdateClassMemberRole = useCallback(
    async (classId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateClassMemberRole(classId, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateClassMemberRole, showNotification]
  );

  const handleOpenMemberDialog = useCallback((classId) => {
    setSelectedClassId(classId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
  }, []);


  const userRole = useMemo(
    () => members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none',
    [members, authData]
  );
  const isOwner = gateData?.creator_id === authData?.anonymous_id;
  const canEdit = isOwner || userRole === 'admin';
  const canDelete = isOwner;

  const headerData = useMemo(
    () => ({
      type: 'gate',
      title: gateData?.name || 'Untitled Gate',
      titleAriaLabel: `Gate name: ${gateData?.name || 'Untitled Gate'}`,
      description: gateData?.description,
      descriptionAriaLabel: gateData?.description ? `Gate description: ${gateData.description}` : undefined,
      chips: [
        {
          label: gateData?.access?.is_public ? 'Public' : 'Private',
          icon: gateData?.access?.is_public ? <Public /> : <Lock />,
          color: gateData?.access?.is_public ? 'success' : 'default',
          ariaLabel: gateData?.access?.is_public ? 'Public gate' : 'Private gate',
        },
        {
          label: `Members: ${stats?.member_count || members?.length || 0}`,
          icon: <People />,
          color: 'primary',
          ariaLabel: `Members: ${stats?.member_count || members?.length || 0}`,
        },
        {
          label: `Classes: ${filteredClasses?.length || 0}`,
          icon: <Forum />,
          color: 'info',
          ariaLabel: `Classes: ${filteredClasses?.length || 0}`,
        },
        {
          label: `Favorites: ${stats?.favorite_count || 0}`,
          icon: <Star />,
          color: 'warning',
          ariaLabel: `Favorites: ${stats?.favorite_count || 0}`,
        },
        {
          label: `Owner: ${gateData?.creator?.username || 'Unknown'}`,
          ariaLabel: `Owner: ${gateData?.creator?.username || 'Unknown'}`,
        },
      ],
      actions: [
        {
          label: 'Create Class',
          icon: <Add />,
          onClick: handleOpenCreateClass,
          tooltip: 'Create a new class within this gate',
          disabled: actionLoading,
          ariaLabel: 'Create a new class',
          isMenuItem: false,
        },
        {
          label: 'Edit Gate',
          onClick: () =>
            setEditingGate({
              gate_id: gateData.gate_id,
              name: gateData.name || '',
              description: gateData.description || '',
              is_public: gateData.access?.is_public || false,
              visibility: gateData.access?.is_public ? 'public' : 'private',
              settings: gateData.settings || {
                class_creation_cost: 100,
                board_creation_cost: 50,
                max_members: 1000,
                ai_moderation_enabled: true,
              },
            }),
          tooltip: 'Edit gate details and settings',
          disabled: actionLoading || !canEdit,
          ariaLabel: 'Edit gate',
          isMenuItem: true,
        },
        {
          label: 'Manage Members',
          onClick: () => handleOpenMemberDialog(null),
          tooltip: 'Manage gate members',
          disabled: actionLoading || !canEdit,
          ariaLabel: 'Manage members',
          isMenuItem: true,
        },
        {
          label: 'Delete Gate',
          onClick: () => setDeleteDialogOpen(true),
          tooltip: 'Permanently delete this gate',
          disabled: actionLoading || !canDelete,
          ariaLabel: 'Delete gate',
          variant: 'delete',
          isMenuItem: true,
        },
      ].filter((action) => action.label !== 'Create Class' || gateData?.access?.is_public || userRole !== 'viewer'),
      isFavorited: gateData?.is_favorited,
      onFavoriteToggle: handleFavoriteToggle,
      actionLoading,
    }),
    [
      gateData,
      stats,
      members,
      filteredClasses,
      userRole,
      canEdit,
      canDelete,
      actionLoading,
      handleOpenCreateClass,
      handleOpenMemberDialog,
      handleFavoriteToggle,
    ]
  );

  if (isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles }}>
          <Skeleton variant='rectangular' sx={{ ...skeletonStyles.header }} />
          <Skeleton variant='rectangular' sx={{ ...skeletonStyles.filter }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant='rectangular' sx={{ ...skeletonStyles.card }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!gateData) {
    showNotification('Gate not found', 'error');
    navigate('/gates');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
        <Filters
          type="classes"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {filteredClasses.length > 0 ? (
          <ClassesGrid
            filteredClasses={filteredClasses}
            handleFavorite={async (classId) => {
              setActionLoading(true);
              try {
                const currentClass = filteredClasses.find((c) => c.class_id === classId);
                await toggleFavoriteClass(classId, currentClass?.is_favorited);
                showNotification('Favorite toggled successfully!', 'success');
              } catch (err) {
                showNotification(err.message || 'Failed to toggle favorite', 'error');
              } finally {
                setActionLoading(false);
              }
            }}
            setEditingClass={(classItem) =>
              setEditingClass({
                class_id: classItem.class_id,
                name: classItem.name || '',
                description: classItem.description || '',
                is_public: classItem.access?.is_public || false,
                visibility: classItem.access?.is_public ? 'public' : 'private',
                settings: classItem.settings || {
                  max_boards: 100,
                  max_members: 50,
                  board_creation_cost: 50,
                  tweet_cost: 1,
                  allow_invites: true,
                  require_approval: false,
                  ai_moderation_enabled: true,
                  auto_archive_after: 30,
                },
                gate_id: classItem.gate_id,
                tags: classItem.tags || [],
              })
            }
            setClassToDelete={setClassToDelete}
            setDeleteDialogOpen={setDeleteDialogOpen}
            handleAddMember={handleOpenMemberDialog}
            handleRemoveMember={handleRemoveClassMember}
            navigate={navigate}
            currentUser={authData}
            token={token}
          />
        ) : (
          <Typography variant='body1' textAlign='center' sx={{ my: 4, color: 'text.secondary' }}>
            No classes found for this gate. Create a new class to get started!
          </Typography>
        )}
        <ClassFormDialog
          open={createClassDialogOpen}
          title='Create New Class'
          classItem={popupClass}
          setClass={setPopupClass}
          onSave={handleCreateClass}
          onCancel={handleCancelCreateClass}
          disabled={actionLoading}
          gates={gates}
          fixedGateId={gate_id}
          initialGateId={gate_id}
          currentGate={gateData}
        />
        {editingClass && (
          <ClassFormDialog
            open={true}
            title='Edit Class'
            classItem={editingClass}
            setClass={setEditingClass}
            onSave={handleUpdateClass}
            onCancel={() => setEditingClass(null)}
            disabled={actionLoading}
            gates={gates}
            fixedGateId={gate_id}
            initialGateId={gate_id}
            currentGate={gateData}
          />
        )}
        {editingGate && (
          <GateFormDialog
            open={true}
            title='Edit Gate'
            gate={editingGate}
            setGate={setEditingGate}
            onSave={handleUpdateGate}
            onCancel={() => setEditingGate(null)}
            disabled={actionLoading}
          />
        )}
        <MemberFormDialog
          open={memberDialogOpen}
          title={selectedClassId ? 'Manage Class Members' : 'Manage Gate Members'}
          gateId={selectedClassId ? null : gate_id}
          classId={selectedClassId}
          token={token}
          onSave={handleCancelMemberDialog}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading}
          members={
            selectedClassId ? classes.find((c) => c.class_id === selectedClassId)?.members || [] : members
          }
          addMember={selectedClassId ? handleAddClassMember : handleAddGateMember}
          removeMember={selectedClassId ? handleRemoveClassMember : handleRemoveGateMember}
          updateMemberRole={selectedClassId ? handleUpdateClassMemberRole : handleUpdateGateMemberRole}
        />
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={classToDelete ? handleDeleteClass : handleDeleteGate}
          message={
            classToDelete
              ? 'Are you sure you want to delete this class? This action cannot be undone.'
              : 'Are you sure you want to delete this gate? This action cannot be undone.'
          }
          disabled={actionLoading}
        />
      </Box>
    </AppLayout>
  );
};

GatePage.propTypes = {
  navigate: PropTypes.func,
  location: PropTypes.object,
  gate_id: PropTypes.string,
  token: PropTypes.string,
  authData: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
    avatar: PropTypes.string,
    total_points: PropTypes.number,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(GatePage);