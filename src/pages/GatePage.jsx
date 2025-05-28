import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Add, Public, Lock, People, Forum, Star } from '@mui/icons-material';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import { useGates } from '../hooks/useGates';
import { useClasses } from '../hooks/useClasses';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import CardMain from '../components/Cards/CardMain';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_CLASS } from '../constants/default';
import { CLASS_FILTER_OPTIONS } from '../constants/filterOptions';
import { debounce } from 'lodash';

const GatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gate_id } = useParams();
  const { showNotification } = useNotification();
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
    classes: classesList,
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

  // Dialog states for classes
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberClassDialogOpen, setMemberClassDialogOpen] = useState(false);
  // Dialog states for gates
  const [editGateDialogOpen, setEditGateDialogOpen] = useState(false);
  const [deleteGateDialogOpen, setDeleteGateDialogOpen] = useState(false);
  const [memberGateDialogOpen, setMemberGateDialogOpen] = useState(false);
  // Entity states
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [editingGate, setEditingGate] = useState(null);
  const [popupClass, setPopupClass] = useState({ ...DEFAULT_CLASS, gate_id });
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    useMemo(
      () => [
        () => fetchGate(gate_id),
        () => fetchGateMembersList(gate_id),
        () => fetchClassesByGate(gate_id, {}),
        () => fetchGatesList({ visibility: 'public' }),
      ],
      [fetchGate, fetchGateMembersList, fetchClassesByGate, fetchGatesList, gate_id]
    ),
    token,
    handleLogout,
    navigate,
    'gate'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  // Handle errors
  useEffect(() => {
    if (gateError && gateError !== 'canceled') {
      showNotification(gateError, 'error');
    }
    if (classesError && classesError !== 'canceled') {
      showNotification(classesError, 'error');
    }
  }, [gateError, classesError, showNotification]);

  // Sync popupClass gate_id
  useEffect(() => {
    setPopupClass((prev) => ({ ...prev, gate_id }));
  }, [gate_id]);

  // Close edit dialogs if no editing entity
  useEffect(() => {
    if (!editingGate && editGateDialogOpen) {
      setEditGateDialogOpen(false);
    }
    if (!editingClass && editClassDialogOpen) {
      setEditClassDialogOpen(false);
    }
  }, [editingGate, editGateDialogOpen, editingClass, editClassDialogOpen]);

  // Filter classes with gate context
  const filteredClasses = useMemo(() => {
    const gateFilter = gateData ? [{ gate_id: gateData.gate_id || gate_id }] : [];
    return filterEntities(gateData?.classes || [], 'classes', quickFilter, searchQuery, gates || [], gateFilter);
  }, [classesList, gateData, gates, quickFilter, searchQuery, gate_id]);

  // Class handlers
  const handleOpenCreateClass = useCallback(() => setCreateClassDialogOpen(true), []);
  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({ ...DEFAULT_CLASS, gate_id: gate_id || '' });
  }, [gate_id]);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name?.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass({ ...popupClass, gate_id });
      setCreateClassDialogOpen(false);
      setPopupClass({ ...DEFAULT_CLASS, gate_id: gate_id || '' });
      showNotification('Class created successfully!', 'success');
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, createNewClass, gate_id, navigate, showNotification, setActionLoading]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name?.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditClassDialogOpen(false);
      setEditingClass(null);
      showNotification('Class updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification, setActionLoading]);

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
  }, [classToDelete, deleteExistingClass, showNotification, setActionLoading]);

  // Gate handlers
  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name?.trim()) {
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
  }, [editingGate, updateExistingGate, showNotification, setActionLoading]);

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
  }, [gate_id, deleteExistingGate, navigate, showNotification, setActionLoading]);

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
  }, [gate_id, gateData, toggleFavoriteGate, showNotification, setActionLoading]);

  // Member handlers (for both gate and class)
  const handleAddMember = useCallback(
    async (id, memberData, isClass = false) => {
      setActionLoading(true);
      try {
        const entity = isClass
          ? classesList.find((c) => c.class_id === id)
          : { members, settings: gateData?.settings };
        if (entity?.members?.length >= entity?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await (isClass ? addMemberToClass : addMemberToGate)(id, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToClass, addMemberToGate, classesList, members, gateData, showNotification, setActionLoading]
  );

  const handleRemoveMember = useCallback(
    async (id, username, isClass = false) => {
      setActionLoading(true);
      try {
        await (isClass ? removeMemberFromClass : removeMemberFromGate)(id, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromClass, removeMemberFromGate, showNotification, setActionLoading]
  );

  const handleUpdateMemberRole = useCallback(
    async (id, username, newRole, isClass = false) => {
      setActionLoading(true);
      try {
        await (isClass ? updateClassMemberRole : updateGateMemberRole)(id, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateClassMemberRole, updateGateMemberRole, showNotification, setActionLoading]
  );

  // Dialog togglers
  const handleOpenClassMemberDialog = useCallback((classId) => {
    setSelectedClassId(classId);
    setMemberClassDialogOpen(true);
  }, []);

  const handleOpenGateMemberDialog = useCallback(() => {
    setMemberGateDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(
    (isClass = false) => {
      if (isClass) {
        setMemberClassDialogOpen(false);
        setSelectedClassId(null);
      } else {
        setMemberGateDialogOpen(false);
      }
      showNotification('Members updated successfully!', 'success');
    },
    [showNotification]
  );

  const handleCancelClassMemberDialog = useCallback(() => {
    setMemberClassDialogOpen(false);
    setSelectedClassId(null);
  }, []);

  const handleCancelGateMemberDialog = useCallback(() => {
    setMemberGateDialogOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  // Permissions
  const userRole = useMemo(
    () => members?.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none',
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
          onClick: handleOpenGateMemberDialog,
          tooltip: 'Manage gate members',
          disabled: actionLoading || !canEdit,
          ariaLabel: 'Manage gate members',
          isMenuItem: true,
        },
        {
          label: 'Delete Gate',
          onClick: () => setDeleteGateDialogOpen(true),
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
      gatesLoading,
      classesLoading,
      handleOpenCreateClass,
      handleOpenGateMemberDialog,
      handleFavoriteToggle,
    ]
  );

  if (authLoading || isLoading || gatesLoading || classesLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location.pathname } });
    return null;
  }

  if (!gateData && gateError && gateError !== 'canceled') {
    showNotification('Gate not found or failed to load', 'error');
    navigate('/gates');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
      <EntityGrid
        type="classes"
        items={filteredClasses || []}
        cardComponent={CardMain}
        itemKey="class_id"
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={debouncedSetSearchQuery}
        filterOptions={CLASS_FILTER_OPTIONS}
        onResetFilters={handleResetFilters}
        handleFavorite={toggleFavoriteClass}
        setEditingItem={(classItem) => {
          setEditingClass(classItem);
          setEditClassDialogOpen(true);
        }}
        setItemToDelete={setClassToDelete}
        setDeleteDialogOpen={setDeleteClassDialogOpen}
        handleManageMembers={handleOpenClassMemberDialog}
        navigate={navigate}
        currentUser={authData}
        token={token}
        onCreateNew={handleOpenCreateClass}
        disabled={actionLoading || gatesLoading || classesLoading}
      />
      {/* Class Dialogs */}
      <EntityDialogs
        type="classes"
        createOpen={createClassDialogOpen}
        editOpen={editClassDialogOpen}
        deleteOpen={deleteClassDialogOpen}
        memberOpen={memberClassDialogOpen}
        item={popupClass}
        setItem={setPopupClass}
        editingItem={editingClass}
        setEditingItem={setEditingClass}
        itemToDelete={classToDelete}
        setItemToDelete={setClassToDelete}
        onSaveCreate={handleCreateClass}
        onSaveEdit={handleUpdateClass}
        onCancelCreate={handleCancelCreateClass}
        onCancelEdit={() => {
          setEditClassDialogOpen(false);
          setEditingClass(null);
        }}
        onConfirmDelete={handleDeleteClass}
        onCloseDelete={() => {
          setDeleteClassDialogOpen(false);
          setClassToDelete(null);
        }}
        selectedId={selectedClassId}
        members={classesList?.find((c) => c.class_id === selectedClassId)?.members || []}
        addMember={(id, memberData) => handleAddMember(id, memberData, true)}
        removeMember={(id, username) => handleRemoveMember(id, username, true)}
        updateMemberRole={(id, username, role) => handleUpdateMemberRole(id, username, role, true)}
        onSaveMembers={() => handleSaveMembers(true)}
        onCancelMembers={handleCancelClassMemberDialog}
        disabled={actionLoading || gatesLoading || classesLoading}
        loading={actionLoading}
        token={token}
        gates={gates}
        classes={classesList}
        currentGate={gateData}
        fixedgate_id={gate_id}
        initialgate_id={gate_id}
      />
      {/* Gate Dialogs */}
      <EntityDialogs
        type="gates"
        createOpen={false}
        editOpen={editGateDialogOpen}
        deleteOpen={deleteGateDialogOpen}
        memberOpen={memberGateDialogOpen}
        item={editingGate}
        setItem={setEditingGate}
        editingItem={editingGate}
        setEditingItem={setEditingGate}
        itemToDelete={gate_id}
        setItemToDelete={() => {}} // No-op for gate deletion
        onSaveCreate={() => {}} // No create for gates here
        onSaveEdit={handleUpdateGate}
        onCancelCreate={() => {}} // No create for gates
        onCancelEdit={() => {
          setEditGateDialogOpen(false);
          setEditingGate(null);
        }}
        onConfirmDelete={handleDeleteGate}
        onCloseDelete={() => setDeleteGateDialogOpen(false)}
        selectedId={gate_id}
        members={gateData.members || []}
        addMember={(id, memberData) => handleAddMember(id, memberData, false)}
        removeMember={(id, username) => handleRemoveMember(id, username, false)}
        updateMemberRole={(id, username, role) => handleUpdateMemberRole(id, username, role, false)}
        onSaveMembers={() => handleSaveMembers(false)}
        onCancelMembers={handleCancelGateMemberDialog}
        disabled={actionLoading || gatesLoading}
        loading={actionLoading}
        token={token}
        gates={gates}
        classes={classesList}
      />
    </AppLayout>
  );
};

GatePage.propTypes = {
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