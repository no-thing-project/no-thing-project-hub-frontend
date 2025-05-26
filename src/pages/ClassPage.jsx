import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Skeleton, useTheme, Typography } from '@mui/material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import BoardsFilters from '../components/Boards/BoardsFilters';
import BoardsGrid from '../components/Boards/BoardsGrid';
import ClassFormDialog from '../components/Dialogs/ClassFormDialog';
import BoardFormDialog from '../components/Dialogs/BoardFormDialog';
import MemberFormDialog from '../components/Dialogs/MemberFormDialog';
import DeleteConfirmationDialog from '../components/Dialogs/DeleteConfirmationDialog';
import { useClasses } from '../hooks/useClasses';
import { useBoards } from '../hooks/useBoards';
import { useGates } from '../hooks/useGates';
import useAuth from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import { Add, Edit, Delete, Public, Lock, People, Forum, Star, Home } from '@mui/icons-material';

const ClassPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { class_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classItem: classData,
    members,
    stats,
    fetchClass,
    classes,
    fetchClassesList,
    fetchClassMembersList,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    toggleFavoriteClass,
    loading: classesLoading,
    error: classError,
  } = useClasses(token, handleLogout, navigate);
  const {
    boards,
    fetchBoardsByClass,
    createNewBoardInClass,
    updateExistingBoard,
    deleteExistingBoard,
    toggleFavoriteBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    loading: boardsLoading,
    error: boardsError,
  } = useBoards(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [boardMemberDialogOpen, setBoardMemberDialogOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [popupBoard, setPopupBoard] = useState({
    name: '',
    description: '',
    is_public: true,
    visibility: 'public',
    class_id,
    type: 'group',
    gate_id: classData?.gate_id || null,
    settings: { max_tweets: 100, tweet_cost: 10, max_members: 50, ai_moderation_enabled: true },
    tags: [],
  });

  const loadData = useCallback(async (signal) => {
    if (!class_id || !token || !isAuthenticated) {
      showNotification('Class ID or authentication missing.', 'error');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await Promise.all([
        fetchClass(class_id, signal),
        fetchClassMembersList(class_id, signal),
        fetchBoardsByClass(class_id, {}, signal),
        fetchGatesList({ visibility: 'public' }, signal),
        fetchClassesList({}, signal),
      ]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to load class data.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [class_id, token, isAuthenticated, fetchClass, fetchClassMembersList, fetchBoardsByClass, fetchGatesList, fetchClassesList, showNotification]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (classError) showNotification(classError, 'error');
    if (boardsError) showNotification(boardsError, 'error');
    if (gatesError) showNotification(gatesError, 'error');
  }, [classError, boardsError, gatesError, showNotification]);

  useEffect(() => {
    setPopupBoard((prev) => ({ ...prev, class_id, gate_id: classData?.gate_id || null }));
  }, [class_id, classData]);

  const debouncedSetSearchQuery = useMemo(() => debounce((value) => setSearchQuery(value), 300), []);

  const filteredBoards = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return boards
      .map((board) => {
        const gate = gates.find((g) => g.gate_id === board.gate_id);
        const cls = classes.find((c) => c.class_id === board.class_id);
        return {
          ...board,
          gateName: gate ? gate.name : 'No Gate',
          className: cls ? cls.name : 'No Class',
        };
      })
      .filter((board) => {
        const matchesSearch =
          board.name?.toLowerCase().includes(lowerSearchQuery) ||
          board.description?.toLowerCase().includes(lowerSearchQuery) ||
          board.gateName.toLowerCase().includes(lowerSearchQuery) ||
          board.className.toLowerCase().includes(lowerSearchQuery) ||
          board.tags?.some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
        if (!matchesSearch) return false;
        if (quickFilter === 'all') return true;
        if (quickFilter === 'public') return board.visibility === 'public';
        if (quickFilter === 'private') return board.visibility === 'private';
        if (quickFilter === 'favorited') return board.is_favorited;
        if (quickFilter === 'personal') return board.type === 'personal';
        if (quickFilter === 'group') return board.type === 'group';
        return true;
      });
  }, [boards, gates, classes, quickFilter, searchQuery]);

  const handleOpenCreateBoard = useCallback(() => setCreateBoardDialogOpen(true), []);
  const handleCancelCreateBoard = useCallback(() => {
    setCreateBoardDialogOpen(false);
    setPopupBoard({
      name: '',
      description: '',
      is_public: true,
      visibility: 'public',
      class_id,
      type: 'group',
      gate_id: classData?.gate_id || null,
      settings: { max_tweets: 100, tweet_cost: 10, max_members: 50, ai_moderation_enabled: true },
      tags: [],
    });
  }, [class_id, classData]);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    if (popupBoard.class_id !== class_id) {
      showNotification('Class ID mismatch', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const newBoard = await createNewBoardInClass(class_id, popupBoard);
      showNotification('Board created successfully!', 'success');
      setCreateBoardDialogOpen(false);
      navigate(`/board/${newBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoardInClass, class_id, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditingBoard(null);
      showNotification('Board updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, updateExistingBoard, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification('Board deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification]);

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
    setActionLoading(true);
    try {
      await deleteExistingClass(class_id);
      showNotification('Class deleted successfully!', 'success');
      navigate('/classes');
    } catch (err) {
      showNotification(err.message || 'Failed to delete class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [class_id, deleteExistingClass, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    setActionLoading(true);
    try {
      await toggleFavoriteClass(class_id, classData?.is_favorited);
      showNotification(
        classData?.is_favorited ? 'Class removed from favorites!' : 'Class added to favorites!',
        'success'
      );
    } catch (err) {
      showNotification(err.message || 'Failed to toggle favorite', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [class_id, classData, toggleFavoriteClass, showNotification]);

  const handleAddClassMember = useCallback(async (classId, memberData) => {
    try {
      if (members.length >= classData?.settings?.max_members) {
        showNotification('Maximum member limit reached!', 'error');
        return;
      }
      await addMemberToClass(classId, memberData);
      showNotification('Member added successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add member', 'error');
    }
  }, [addMemberToClass, showNotification, members, classData]);

  const handleRemoveClassMember = useCallback(async (classId, username) => {
    try {
      await removeMemberFromClass(classId, username);
      showNotification('Member removed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to remove member', 'error');
    }
  }, [removeMemberFromClass, showNotification]);

  const handleUpdateClassMemberRole = useCallback(async (classId, username, newRole) => {
    try {
      await updateClassMemberRole(classId, username, newRole);
      showNotification('Member role updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update member role', 'error');
    }
  }, [updateClassMemberRole, showNotification]);

  const handleAddBoardMember = useCallback(async (boardId, memberData) => {
    try {
      const board = boards.find((b) => b.board_id === boardId);
      if (board?.members?.length >= board?.settings?.max_members) {
        showNotification('Maximum members limit reached!', 'error');
        return;
      }
      await addMemberToBoard(boardId, memberData);
      showNotification('Member added successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to add member', 'error');
    }
  }, [addMemberToBoard, showNotification, boards]);

  const handleRemoveBoardMember = useCallback(async (boardId, username) => {
    try {
      await removeMemberFromBoard(boardId, username);
      showNotification('Member removed successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to remove member', 'error');
    }
  }, [removeMemberFromBoard, showNotification]);

  const handleUpdateBoardMemberRole = useCallback(async (boardId, username, newRole) => {
    try {
      await updateMemberRole(boardId, username, newRole);
      showNotification('Member role updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update member role', 'error');
    }
  }, [updateMemberRole, showNotification]);

  const handleOpenMemberDialog = useCallback(() => setMemberDialogOpen(true), []);
  const handleCancelMemberDialog = useCallback(() => setMemberDialogOpen(false), []);
  const handleOpenBoardMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setBoardMemberDialogOpen(true);
  }, []);
  const handleCancelBoardMemberDialog = useCallback(() => {
    setBoardMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);
  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
  }, []);

  const userRole = members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none';
  const gate = gates.find((g) => g.gate_id === classData?.gate_id);

  const headerData = useMemo(() => ({
    type: 'class',
    title: classData?.name || 'Untitled Class',
    titleAriaLabel: `Class name: ${classData?.name || 'Untitled Class'}`,
    description: classData?.description,
    descriptionAriaLabel: classData?.description ? `Class description: ${classData.description}` : undefined,
    chips: [
      { label: `${gate?.name || 'No Gate'}`, icon: <Home />, color: 'secondary', ariaLabel: `${gate?.name || 'No Gate'}` },
      {
        label: classData?.access?.is_public ? 'Public' : 'Private',
        icon: classData?.access?.is_public ? <Public /> : <Lock />,
        color: classData?.access?.is_public ? 'success' : 'default',
        ariaLabel: classData?.access?.is_public ? 'Public class' : 'Private class',
      },
      { label: `Favorites: ${stats?.favorite_count || 0}`, icon: <Star />, color: 'warning', ariaLabel: `Favorites: ${stats?.favorite_count || 0}` },
      { label: `Members: ${stats?.member_count || members?.length || 0}`, icon: <People />, color: 'primary', ariaLabel: `Members: ${stats?.member_count || members?.length || 0}` },
      { label: `Boards: ${filteredBoards?.length || 0}`, icon: <Forum />, color: 'info', ariaLabel: `Boards: ${filteredBoards?.length || 0}` },
      { label: `Owner: ${classData?.creator?.username || 'Unknown'}`, ariaLabel: `Owner: ${classData?.creator?.username || 'Unknown'}` },
    ],
    actions: [
      { label: 'Create Board', icon: <Add />, onClick: handleOpenCreateBoard, tooltip: 'Create a new board within this class', disabled: actionLoading, ariaLabel: 'Create a new board', isMenuItem: false },
      {
        label: 'Edit Class',
        onClick: () => setEditingClass({ class_id: classData.class_id, name: classData.name, description: classData.description, is_public: classData.access?.is_public, visibility: classData.access?.is_public ? 'public' : 'private', settings: classData.settings, gate_id: classData.gate_id }),
        tooltip: 'Edit class details',
        disabled: actionLoading || !['owner', 'admin'].includes(userRole),
        ariaLabel: 'Edit class',
        isMenuItem: true,
      },
      { label: 'Manage Members', onClick: handleOpenMemberDialog, tooltip: 'Manage class members', disabled: actionLoading || !['owner', 'admin'].includes(userRole), ariaLabel: 'Manage members', isMenuItem: true },
      { label: 'Delete Class', onClick: handleDeleteClass, tooltip: 'Permanently delete this class', disabled: actionLoading || userRole !== 'owner', ariaLabel: 'Delete class', variant: 'delete', isMenuItem: true },
    ].filter((action) => action.label !== 'Create Board' || classData?.access?.is_public || userRole !== 'viewer'),
    isFavorited: classData?.is_favorited,
    onFavoriteToggle: handleFavoriteToggle,
    actionLoading,
  }), [classData, stats, members, filteredBoards, userRole, actionLoading, handleOpenCreateBoard, handleOpenMemberDialog, handleDeleteClass, handleFavoriteToggle, gate]);

  if (authLoading || classesLoading || boardsLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 2, md: 4 } }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 3, borderRadius: 2 }} />
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(300px, 1fr))' } }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
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

  if (!classData) {
    showNotification('Class not found', 'error');
    navigate('/classes');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
        <BoardsFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
          sx={{ mb: 3, bgcolor: theme.palette.background.paper, p: 2, borderRadius: 2 }}
        />
        {filteredBoards.length > 0 ? (
          <BoardsGrid
            filteredBoards={filteredBoards}
            handleFavorite={toggleFavoriteBoard}
            setEditingBoard={setEditingBoard}
            setBoardToDelete={setBoardToDelete}
            setDeleteDialogOpen={setDeleteDialogOpen}
            openMemberDialog={handleOpenBoardMemberDialog}
            navigate={navigate}
            currentUser={authData}
            token={token}
          />
        ) : (
          <Typography variant="body1" textAlign="center" sx={{ my: 4, color: 'text.secondary' }}>
            No boards found. Create a new board to get started!
          </Typography>
        )}
        <BoardFormDialog
          open={createBoardDialogOpen}
          title="Create New Board"
          board={popupBoard}
          setBoard={setPopupBoard}
          onSave={handleCreateBoard}
          onCancel={handleCancelCreateBoard}
          disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
          gates={gates}
          classes={classes}
          currentClass={classData}
          initialClassId={class_id}
          fixedClassId={class_id}
          fixedGateId={classData?.gate_id || null}
        />
        {editingBoard && (
          <BoardFormDialog
            open={true}
            title="Edit Board"
            board={editingBoard}
            setBoard={setEditingBoard}
            onSave={handleUpdateBoard}
            onCancel={() => setEditingBoard(null)}
            disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
            gates={gates}
            classes={classes}
            currentClass={classData}
            initialClassId={class_id}
            fixedClassId={class_id}
            fixedGateId={classData?.gate_id || null}
          />
        )}
        {editingClass && (
          <ClassFormDialog
            open={true}
            title="Edit Class"
            classItem={editingClass}
            setClass={setEditingClass}
            onSave={handleUpdateClass}
            onCancel={() => setEditingClass(null)}
            disabled={actionLoading || classesLoading}
            gates={gates}
          />
        )}
        <MemberFormDialog
          open={memberDialogOpen}
          title="Manage Class Members"
          classId={class_id}
          token={token}
          onSave={handleCancelMemberDialog}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading || classesLoading || boardsLoading}
          members={members}
          addMember={handleAddClassMember}
          removeMember={handleRemoveClassMember}
          updateMemberRole={handleUpdateClassMemberRole}
        />
        <MemberFormDialog
          open={boardMemberDialogOpen}
          title="Manage Board Members"
          boardId={selectedBoardId}
          token={token}
          onSave={handleCancelBoardMemberDialog}
          onCancel={handleCancelBoardMemberDialog}
          disabled={actionLoading || boardsLoading}
          members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
          addMember={handleAddBoardMember}
          removeMember={handleRemoveBoardMember}
          updateMemberRole={handleUpdateBoardMemberRole}
        />
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteBoard}
          message="Are you sure you want to delete this board? This action cannot be undone."
          disabled={actionLoading || boardsLoading}
        />
      </Box>
    </AppLayout>
  );
};

ClassPage.propTypes = {
  class_id: PropTypes.string,
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

export default React.memo(ClassPage);