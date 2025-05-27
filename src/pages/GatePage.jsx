import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Skeleton, Button } from '@mui/material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import GateFormDialog from '../components/Dialogs/GateFormDialog';
import ClassFormDialog from '../components/Dialogs/ClassFormDialog';
import MemberFormDialog from '../components/Dialogs/MemberFormDialog';
import DeleteConfirmationDialog from '../components/Dialogs/DeleteConfirmationDialog';
import { useGates } from '../hooks/useGates';
import { useClasses } from '../hooks/useClasses';
import useAuth from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { Add, Public, Lock, People, Forum, Star } from '@mui/icons-material';
import { containerStyles, gridStyles, skeletonStyles, actionButtonStyles } from '../styles/BaseStyles';
import Filters from '../components/Filters/Filters';
import Grids from '../components/Grids/Grids';
import CardMain from '../components/Cards/CardMain';

const DEFAULT_CLASS = {
  name: '',
  description: '',
  is_public: false,
  visibility: 'private',
  gate_id: '',
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
};

const GatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [editGateDialogOpen, setEditGateDialogOpen] = useState(false);
  const [deleteGateDialogOpen, setDeleteGateDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingGate, setEditingGate] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [popupClass, setPopupClass] = useState({
    ...DEFAULT_CLASS,
    gate_id: gate_id || '',
  });

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Classes' },
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
      { value: 'favorited', label: 'Favorited' },
    ],
    []
  );

  const loadData = useCallback(
    async (signal) => {
      if (!gate_id || !token || !isAuthenticated) {
        showNotification('Gate ID or authentication missing.', 'error');
        setIsLoading(false);
        navigate('/login', { state: { from: location.pathname } });
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
        setRetryCount(0);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Load data error:', err);
          const errorMessage = err.message.includes('network')
            ? 'Network error. Please check your connection.'
            : err.message || 'Failed to load gate or class data.';
          showNotification(errorMessage, 'error');
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => setRetryCount((prev) => prev + 1), delay);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      gate_id,
      token,
      isAuthenticated,
      fetchGate,
      fetchGateMembersList,
      fetchClassesByGate,
      fetchGatesList,
      showNotification,
      retryCount,
      navigate,
      location.pathname,
    ]
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

  const filteredClasses = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return classes
      .map((classItem) => ({
        ...classItem,
        gateName: gateData?.name || 'Unknown Gate',
      }))
      .filter((classItem) => {
        const matchesSearch =
          (classItem?.name || '').toLowerCase().includes(lowerSearchQuery) ||
          (classItem?.description || '').toLowerCase().includes(lowerSearchQuery) ||
          (classItem?.gateName || '').toLowerCase().includes(lowerSearchQuery) ||
          (classItem?.tags || []).some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
        if (!matchesSearch) return false;
        switch (quickFilter) {
          case 'public':
            return classItem.access?.is_public;
          case 'private':
            return !classItem.access?.is_public;
          case 'favorited':
            return classItem.is_favorited;
          case 'group':
            return classItem.type === 'group';
          case 'personal':
            return classItem.type === 'personal';
          default:
            return true;
        }
      });
  }, [classes, gateData, quickFilter, searchQuery]);

  const handleOpenCreateClass = useCallback(() => setCreateClassDialogOpen(true), []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({
      ...DEFAULT_CLASS,
      gate_id: gate_id || '',
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
        ...DEFAULT_CLASS,
        gate_id: gate_id || '',
      });
      showNotification('Class created successfully!', 'success');
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, createNewClass, gate_id, navigate, showNotification]);

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
      await deleteExistingClass(classToDelete);
      setDeleteClassDialogOpen(false);
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
      setEditGateDialogOpen(false);
      setEditingGate(null);
      showNotification('Gate updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, showNotification]);

  const handleOpenDeleteGateDialog = useCallback(() => setDeleteGateDialogOpen(true), []);

  const handleDeleteGate = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingGate(gate_id);
      setDeleteGateDialogOpen(false);
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

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
    showNotification('Members updated successfully!', 'success');
  }, [showNotification]);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

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
          disabled: actionLoading || gatesLoading || classesLoading,
          ariaLabel: 'Create a new class',
          isMenuItem: false,
        },
        {
          label: 'Edit Gate',
          onClick: () => {
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
            });
            setEditGateDialogOpen(true);
          },
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
          onClick: handleOpenDeleteGateDialog,
          tooltip: 'Permanently delete this gate',
          disabled: actionLoading || !canDelete,
          ariaLabel: 'Delete gate',
          variant: 'delete',
          isMenuItem: true,
        },
      ].filter(
        (action) => action.label !== 'Create Class' || gateData?.access?.is_public || userRole !== 'viewer'
      ),
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
      handleOpenDeleteGateDialog,
      handleFavoriteToggle,
    ]
  );

  if (authLoading || gatesLoading || classesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles, maxWidth: '1500px', mx: 'auto' }}>
          <Skeleton variant='rectangular' sx={{ ...skeletonStyles.header, height: '150px' }} />
          <Skeleton variant='rectangular' sx={{ ...skeletonStyles.filter, height: '60px' }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant='rectangular' sx={{ ...skeletonStyles.card, height: '210px' }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location.pathname } });
    return null;
  }

  if (!gateData) {
    showNotification('Gate not found', 'error');
    navigate('/gates');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles, maxWidth: '1500px', mx: 'auto' }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole}>
          <Button
            onClick={handleOpenCreateClass}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles }}
            aria-label="Create a new class"
            disabled={actionLoading || gatesLoading || classesLoading}
          >
            Create Class
          </Button>
        </ProfileHeader>
        <Filters
          type="classes"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />
        <Grids
          items={filteredClasses}
          cardComponent={CardMain}
          itemKey="class_id"
          gridType="classes"
          handleFavorite={toggleFavoriteClass}
          setEditingItem={setEditingClass}
          setItemToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteClassDialogOpen}
          handleManageMembers={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreateClass}
        />
        <ClassFormDialog
          open={createClassDialogOpen}
          title="Create New Class"
          classItem={popupClass}
          setClass={setPopupClass}
          onSave={handleCreateClass}
          onCancel={handleCancelCreateClass}
          disabled={actionLoading || gatesLoading || classesLoading}
          gates={gates}
          fixedGateId={gate_id}
          initialGateId={gate_id}
          currentGate={gateData}
          loading={actionLoading}
          aria-labelledby="create-class-dialog"
        />
        {editingClass && (
          <ClassFormDialog
            open={!!editingClass}
            title="Edit Class"
            classItem={editingClass}
            setClass={setEditingClass}
            onSave={handleUpdateClass}
            onCancel={() => setEditingClass(null)}
            disabled={actionLoading || gatesLoading || classesLoading}
            gates={gates}
            fixedGateId={gate_id}
            initialGateId={gate_id}
            currentGate={gateData}
            loading={actionLoading}
            aria-labelledby="edit-class-dialog"
          />
        )}
        {editingGate && (
          <GateFormDialog
            open={editGateDialogOpen}
            title="Edit Gate"
            gate={editingGate}
            setGate={setEditingGate}
            onSave={handleUpdateGate}
            onCancel={() => {
              setEditGateDialogOpen(false);
              setEditingGate(null);
            }}
            disabled={actionLoading || gatesLoading || classesLoading}
            loading={actionLoading}
            aria-labelledby="edit-gate-dialog"
          />
        )}
        <MemberFormDialog
          open={memberDialogOpen}
          title={selectedClassId ? 'Manage Class Members' : 'Manage Gate Members'}
          gateId={selectedClassId ? null : gate_id}
          classId={selectedClassId}
          token={token}
          onSave={handleSaveMembers}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading || gatesLoading || classesLoading}
          members={
            selectedClassId ? classes.find((c) => c.class_id === selectedClassId)?.members || [] : members
          }
          addMember={selectedClassId ? handleAddClassMember : handleAddGateMember}
          removeMember={selectedClassId ? handleRemoveClassMember : handleRemoveGateMember}
          updateMemberRole={selectedClassId ? handleUpdateClassMemberRole : handleUpdateGateMemberRole}
          loading={actionLoading}
          aria-labelledby="manage-members-dialog"
        />
        <DeleteConfirmationDialog
          open={deleteClassDialogOpen}
          onClose={() => {
            setDeleteClassDialogOpen(false);
            setClassToDelete(null);
          }}
          onConfirm={handleDeleteClass}
          message="Are you sure you want to delete this class? This action cannot be undone."
          disabled={actionLoading || gatesLoading || classesLoading}
          loading={actionLoading}
          aria-labelledby="delete-class-dialog"
        />
        <DeleteConfirmationDialog
          open={deleteGateDialogOpen}
          onClose={() => setDeleteGateDialogOpen(false)}
          onConfirm={handleDeleteGate}
          message="Are you sure you want to delete this gate? This action cannot be undone."
          disabled={actionLoading || gatesLoading || classesLoading}
          loading={actionLoading}
          aria-labelledby="delete-gate-dialog"
        />
      </Box>
    </AppLayout>
  );
};

GatePage.propTypes = {
  navigate: PropTypes.func,
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