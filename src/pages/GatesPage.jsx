import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Add } from '@mui/icons-material';
import { debounce } from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import { useGates } from '../hooks/useGates';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import CardMain from '../components/Cards/CardMain';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_GATE } from '../constants/default';
import { GATE_FILTER_OPTIONS } from '../constants/filterOptions';

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

const GatesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gates,
    pagination,
    fetchGatesList,
    createNewGate,
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    updateMemberRole,
    toggleFavoriteGate,
    loading: gatesLoading,
    error: gatesError,
  } = useGates(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState(null);
  const [editingGate, setEditingGate] = useState(null);
  const [gateToDelete, setGateToDelete] = useState(null);
  const [popupGate, setPopupGate] = useState(DEFAULT_GATE);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const observer = useRef();
  const lastGateElementRef = useCallback(
    (node) => {
      if (gatesLoading || !pagination.hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          const controller = new AbortController();
          fetchGatesList(
            { page: pagination.page + 1, limit: pagination.limit },
            controller.signal,
            true,
            (err) => {
              if (err && err.name !== 'AbortError') {
                showNotification(err.message || 'Failed to load more gates', 'error');
              }
            }
          );
          return () => controller.abort();
        }
      });
      if (node) observer.current.observe(node);
    },
    [gatesLoading, pagination.hasMore, pagination.page, pagination.limit, fetchGatesList, showNotification]
  );

  const stableFetchGatesList = useMemo(
    () => [
      () =>
        fetchGatesList({ page: 1, limit: pagination.limit }, null, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gates', 'error');
          }
        }),
    ],
    [fetchGatesList, pagination.limit, showNotification]
  );

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    stableFetchGatesList,
    token,
    handleLogout,
    navigate,
    'gates'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  useEffect(() => {
    if (gatesError) showNotification(gatesError, 'error');
  }, [gatesError, showNotification]);

  const filteredGates = useMemo(
    () => filterEntities(gates, 'gates', quickFilter, searchQuery),
    [gates, quickFilter, searchQuery]
  );

  const handleOpenCreate = useCallback(() => setCreateDialogOpen(true), []);
  const handleCancelCreate = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupGate(DEFAULT_GATE);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!popupGate.name.trim()) {
      showNotification('Gate name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdGate = await createNewGate(popupGate);
      setCreateDialogOpen(false);
      setPopupGate(DEFAULT_GATE);
      showNotification('Gate created successfully!', 'success');
      navigate(`/gate/${createdGate.gate_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupGate, createNewGate, navigate, showNotification, setActionLoading]);

  const handleUpdate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification('Gate name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditDialogOpen(false);
      setEditingGate(null);
      showNotification('Gate updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, showNotification, setActionLoading]);

  const handleDelete = useCallback(async () => {
    if (!gateToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingGate(gateToDelete);
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      showNotification('Gate deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete gate', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [gateToDelete, deleteExistingGate, showNotification, setActionLoading]);

  const handleAddMember = useCallback(
    async (gateId, memberData) => {
      setActionLoading(true);
      try {
        const gate = gates.find((g) => g.gate_id === gateId);
        if (gate?.members?.length >= gate?.settings?.max_members) {
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
    [addMemberToGate, showNotification, gates, setActionLoading]
  );

  const handleRemoveMember = useCallback(
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
    [removeMemberFromGate, showNotification, setActionLoading]
  );

  const handleUpdateMemberRole = useCallback(
    async (gateId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(gateId, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification, setActionLoading]
  );

  const handleOpenMemberDialog = useCallback((gateId) => {
    setSelectedGateId(gateId);
    setMemberDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null);
    showNotification('Members updated successfully!', 'success');
  }, [showNotification]);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
    fetchGatesList({ page: 1, reset: { visibility: true } }, null, false, (err) => {
      if (err && err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to reset filters', 'error');
      }
    });
  }, [debouncedSetSearchQuery, fetchGatesList, showNotification]);

  const headerData = useMemo(
    () => ({
      type: 'page',
      title: 'Gates',
      titleAriaLabel: 'Gates page',
      shortDescription: 'Your Space for Big Ideas',
      tooltipDescription:
        'Gates are like forum topics, starting points for broad discussions. Create a Gate to spark a conversation or join one to explore shared interests.',
      actions: [
        {
          label: 'Create Gate',
          icon: <Add />,
          onClick: handleOpenCreate,
          tooltip: 'Create a new gate',
          disabled: actionLoading || gatesLoading,
          ariaLabel: 'Create a new gate',
        },
      ],
    }),
    [handleOpenCreate, actionLoading, gatesLoading]
  );

  if (authLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: window.location.pathname } });
    return null;
  }

  return (
    <ErrorBoundary>
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} />
        <EntityGrid
          type="gates"
          items={filteredGates}
          cardComponent={CardMain}
          itemKey="gate_id"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={GATE_FILTER_OPTIONS}
          onResetFilters={handleResetFilters}
          handleFavorite={toggleFavoriteGate}
          setEditingItem={(gate) => {
            setEditingGate(gate);
            setEditDialogOpen(true);
          }}
          setItemToDelete={setGateToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleManageMembers={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreate}
          lastItemRef={lastGateElementRef}
          hasMore={pagination.hasMore}
          loading={gatesLoading}
          disabled={actionLoading || gatesLoading}
        />
        <EntityDialogs
          type="gates"
          createOpen={createDialogOpen}
          editOpen={editDialogOpen}
          deleteOpen={deleteDialogOpen}
          memberOpen={memberDialogOpen}
          item={popupGate}
          setItem={setPopupGate}
          editingItem={editingGate}
          setEditingItem={setEditingGate}
          itemToDelete={gateToDelete}
          setItemToDelete={setGateToDelete}
          onSaveCreate={handleCreate}
          onSaveEdit={handleUpdate}
          onCancelCreate={handleCancelCreate}
          onCancelEdit={() => {
            setEditDialogOpen(false);
            setEditingGate(null);
          }}
          onConfirmDelete={handleDelete}
          onCloseDelete={() => {
            setDeleteDialogOpen(false);
            setGateToDelete(null);
          }}
          selectedId={selectedGateId}
          members={gates.find((g) => g.gate_id === selectedGateId)?.members || []}
          addMember={handleAddMember}
          removeMember={handleRemoveMember}
          updateMemberRole={handleUpdateMemberRole}
          onSaveMembers={handleSaveMembers}
          onCancelMembers={handleCancelMemberDialog}
          disabled={actionLoading || gatesLoading}
          loading={actionLoading}
          token={token}
        />
      </AppLayout>
    </ErrorBoundary>
  );
};

GatesPage.propTypes = {
  token: PropTypes.string,
  authData: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    avatar: PropTypes.string,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(GatesPage);