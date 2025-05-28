import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import { useClasses } from '../hooks/useClasses';
import { useGates } from '../hooks/useGates';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import CardMain from '../components/Cards/CardMain';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_CLASS } from '../constants/default';
import { CLASS_FILTER_OPTIONS } from '../constants/filterOptions';
import { actionButtonStyles } from '../styles/BaseStyles';
import { Button } from '@mui/material';

const ClassesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classes,
    fetchClassesList,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole,
    toggleFavoriteClass,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [popupClass, setPopupClass] = useState(DEFAULT_CLASS);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stableFetchClassesList = useMemo(() => [fetchClassesList], [fetchClassesList]);

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    stableFetchClassesList,
    token,
    handleLogout,
    navigate,
    'classes'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  useEffect(() => {
    if (classesError && classesError !== 'canceled') {
      showNotification(classesError, 'error');
    }
    if (gatesError && gatesError !== 'canceled') {
      showNotification(gatesError, 'error');
    }
  }, [classesError, gatesError, showNotification]);

  const filteredClasses = useMemo(
    () => filterEntities(classes || [], 'classes', quickFilter, searchQuery, gates || []),
    [classes, gates, quickFilter, searchQuery]
  );

  useEffect(() => {
    if (searchQuery || quickFilter !== 'all') {
      const controller = new AbortController();
      fetchGatesList({ visibility: 'public' }, controller.signal).catch((err) => {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error('Gates fetch error:', err);
        }
      });
      return () => controller.abort();
    }
  }, [searchQuery, quickFilter, fetchGatesList]);

  const handleOpenCreate = useCallback(() => setCreateDialogOpen(true), []);
  const handleCancelCreate = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupClass(DEFAULT_CLASS);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!popupClass.name?.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass(popupClass);
      setCreateDialogOpen(false);
      setPopupClass(DEFAULT_CLASS);
      showNotification('Class created successfully!', 'success');
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, createNewClass, showNotification, navigate, setActionLoading]);

  const handleUpdate = useCallback(async () => {
    if (!editingClass?.name?.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditDialogOpen(false);
      setEditingClass(null);
      showNotification('Class updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification, setActionLoading]);

  const handleDelete = useCallback(async () => {
    if (!classToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification('Class deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [classToDelete, deleteExistingClass, showNotification, setActionLoading]);

  const handleAddMember = useCallback(
    async (classId, memberData) => {
      setActionLoading(true);
      try {
        const classItem = classes?.find((c) => c.class_id === classId);
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
    [addMemberToClass, classes, showNotification, setActionLoading]
  );

  const handleRemoveMember = useCallback(
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
    [removeMemberFromClass, showNotification, setActionLoading]
  );

  const handleUpdateMemberRole = useCallback(
    async (classId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(classId, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification, setActionLoading]
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

  const handleCancelMember = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  const headerData = useMemo(
    () => ({
      type: 'page',
      title: 'Classes',
      titleAriaLabel: 'Classes page',
      shortDescription: 'Your Space for Focused Learning',
      tooltipDescription:
        'Classes are dedicated spaces within gates for learning and collaboration. Create a class to share knowledge, work on projects, or dive into specific topics with your community.',
      actions: [
        {
          label: 'Create Class',
          icon: <Add />,
          onClick: handleOpenCreate,
          tooltip: 'Create a new class',
          disabled: actionLoading || classesLoading || gatesLoading,
          ariaLabel: 'Create a new class',
        },
      ],
    }),
    [handleOpenCreate, actionLoading, classesLoading, gatesLoading]
  );

  if (authLoading || isLoading || classesLoading || gatesLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/classes' } });
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} />
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
          setEditDialogOpen(true);
        }}
        setItemToDelete={setClassToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleManageMembers={handleOpenMemberDialog}
        navigate={navigate}
        currentUser={authData}
        token={token}
        onCreateNew={handleOpenCreate}
        disabled={actionLoading || classesLoading || gatesLoading}
      />
      <EntityDialogs
        type="classes"
        createOpen={createDialogOpen}
        editOpen={editDialogOpen}
        deleteOpen={deleteDialogOpen}
        memberOpen={memberDialogOpen}
        item={popupClass}
        setItem={setPopupClass}
        editingItem={editingClass}
        setEditingItem={setEditingClass}
        itemToDelete={classToDelete}
        setItemToDelete={setClassToDelete}
        onSaveCreate={handleCreate}
        onSaveEdit={handleUpdate}
        onCancelCreate={handleCancelCreate}
        onCancelEdit={() => {
          setEditDialogOpen(false);
          setEditingClass(null);
        }}
        onConfirmDelete={handleDelete}
        onCloseDelete={() => {
          setDeleteDialogOpen(false);
          setClassToDelete(null);
        }}
        selectedId={selectedClassId}
        members={classes?.find((c) => c.class_id === selectedClassId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
        onSaveMembers={handleSaveMembers}
        onCancelMembers={handleCancelMember}
        disabled={actionLoading || classesLoading || gatesLoading}
        loading={actionLoading}
        token={token}
        gates={gates}
        classes={classes}
      />
    </AppLayout>
  );
};

ClassesPage.propTypes = {
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

export default React.memo(ClassesPage);