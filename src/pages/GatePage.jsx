import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Add, Public, Lock, People, Forum, Star } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import CardMain from '../components/Cards/CardMain';
import useAuth from '../hooks/useAuth';
import { useGates } from '../hooks/useGates';
import { useClasses } from '../hooks/useClasses';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_CLASS } from '../constants/default';
import { CLASS_FILTER_OPTIONS } from '../constants/filterOptions';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((error, errorInfo) => {
    console.error('ErrorBoundary caught:', error, errorInfo);
    setHasError(true);
  }, []);

  if (hasError) {
    return <div>Something went wrong. Please try again later.</div>;
  }

  return children;
};

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
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    updateMemberRole: updateGateMemberRole,
    toggleFavoriteGate,
    loading: gatesLoading,
    error: gateError,
  } = useGates(token, handleLogout, navigate, true);
  const {
    classes: classesList,
    pagination,
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
  } = useClasses(token, handleLogout, navigate, true);

  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberClassDialogOpen, setMemberClassDialogOpen] = useState(false);
  const [editGateDialogOpen, setEditGateDialogOpen] = useState(false);
  const [deleteGateDialogOpen, setDeleteGateDialogOpen] = useState(false);
  const [memberGateDialogOpen, setMemberGateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [editingGate, setEditingGate] = useState(null);
  const [popupClass, setPopupClass] = useState({ ...DEFAULT_CLASS, gate_id });
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const observer = useRef();
  const lastClassElementRef = useCallback(
    (node) => {
      if (classesLoading || !pagination.hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          const controller = new AbortController();
          fetchClassesByGate(
            gate_id,
            { visibility: quickFilter === 'all' ? undefined : quickFilter, page: pagination.page + 1 },
            controller.signal,
            true,
            (err) => {
              if (err && err.name !== 'AbortError') {
                showNotification(err.message || 'Failed to load more classes', 'error');
              }
            }
          );
          return () => controller.abort();
        }
      });
      if (node) observer.current.observe(node);
    },
    [classesLoading, pagination.hasMore, pagination.page, quickFilter, gate_id, fetchClassesByGate, showNotification]
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const fetchFunctions = useMemo(
    () => [
      (signal) =>
        fetchGate(gate_id, signal, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gate', 'error');
          }
        }),
      (signal) =>
        fetchGateMembersList(gate_id, signal, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gate members', 'error');
          }
        }),
      (signal) =>
        fetchClassesByGate(
          gate_id,
          { page: 1, limit: pagination.limit },
          signal,
          false,
          (err) => {
            if (err && err.name !== 'AbortError') {
              showNotification(err.message || 'Failed to fetch classes', 'error');
            }
          }
        ),
    ],
    [fetchGate, fetchGateMembersList, fetchClassesByGate, gate_id, pagination.limit, showNotification]
  );

  const { isLoading, actionLoading, setActionLoading } = useEntity(fetchFunctions, token, handleLogout, navigate, 'gate');

  useEffect(() => {
    if (!gate_id?.trim()) {
      showNotification('Invalid gate ID', 'error');
      navigate('/gates');
    }
  }, [gate_id, navigate, showNotification]);

  useEffect(() => {
    const errors = [gateError, classesError].filter(Boolean);
    errors.forEach((error) => {
      if (error && error !== 'canceled') {
        showNotification(error, 'error');
      }
    });
  }, [gateError, classesError, showNotification]);

  useEffect(() => {
    if (!editingGate && editGateDialogOpen) {
      setEditGateDialogOpen(false);
    }
    if (!editingClass && editClassDialogOpen) {
      setEditClassDialogOpen(false);
    }
  }, [editingGate, editGateDialogOpen, editingClass, editClassDialogOpen]);

  const filteredClasses = useMemo(
    () => filterEntities(classesList || [], 'classes', quickFilter, searchQuery, gates || [], [{ gate_id }]),
    [classesList, gates, quickFilter, searchQuery, gate_id]
  );

  const userRole = useMemo(
    () => members?.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none',
    [members, authData]
  );
  const isOwner = gateData?.creator_id === authData?.anonymous_id;
  const canEdit = isOwner || userRole === 'admin';
  const canDelete = isOwner;
  const canCreateClass = gateData?.access?.is_public || userRole !== 'viewer';

  const handleOpenCreateClass = useCallback(() => setCreateClassDialogOpen(true), []);
  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({ ...DEFAULT_CLASS, gate_id });
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
      setPopupClass({ ...DEFAULT_CLASS, gate_id });
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
    const controller = new AbortController();
    fetchClassesByGate(gate_id, { page: 1, reset: { visibility: true } }, controller.signal, false, (err) => {
      if (err && err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to reset filters', 'error');
      }
    });
    return () => controller.abort();
  }, [debouncedSetSearchQuery, fetchClassesByGate, gate_id, showNotification]);

  const headerData = useMemo(
    () => ({
      type: 'gate',
      title: gateData?.name || 'Untitled Gate',
      titleAriaLabel: `Gate name: ${gateData?.name || 'Untitled Gate'}`,
      description: gateData?.description || 'No description provided',
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
          disabled: actionLoading || gatesLoading || classesLoading || !canCreateClass,
          ariaLabel: 'Create a new class',
        },
        {
          label: 'Edit Gate',
          onClick: () => {
            setEditingGate({
              gate_id: gateData?.gate_id,
              name: gateData?.name || '',
              description: gateData?.description || '',
              is_public: gateData?.access?.is_public || false,
              visibility: gateData?.access?.is_public ? 'public' : 'private',
              settings: gateData?.settings || {
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
      ].filter((action) => action.label !== 'Create Class' || canCreateClass),
      isFavorited: gateData?.is_favorited || false,
      onFavoriteToggle: handleFavoriteToggle,
      actionLoading,
    }),
    [
      gateData,
      stats,
      members,
      filteredClasses,
      canEdit,
      canDelete,
      canCreateClass,
      actionLoading,
      gatesLoading,
      classesLoading,
      handleOpenCreateClass,
      handleOpenGateMemberDialog,
      handleFavoriteToggle,
    ]
  );

  if (authLoading || isLoading) {
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
    <ErrorBoundary>
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
        <EntityGrid
          type="classes"
          items={filteredClasses}
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
          onCreateNew={canCreateClass ? handleOpenCreateClass : null}
          lastItemRef={lastClassElementRef}
          hasMore={pagination.hasMore}
          loading={classesLoading}
          disabled={actionLoading || gatesLoading || classesLoading}
        />
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
          members={classesList.find((c) => c.class_id === selectedClassId)?.members || []}
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
          fixedGateId={gate_id}
          initialGateId={gate_id}
        />
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
          setItemToDelete={() => {}}
          onSaveCreate={() => {}}
          onSaveEdit={handleUpdateGate}
          onCancelCreate={() => {}}
          onCancelEdit={() => {
            setEditGateDialogOpen(false);
            setEditingGate(null);
          }}
          onConfirmDelete={handleDeleteGate}
          onCloseDelete={() => setDeleteGateDialogOpen(false)}
          selectedId={gate_id}
          members={members || []}
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
    </ErrorBoundary>
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