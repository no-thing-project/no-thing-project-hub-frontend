import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Skeleton } from '@mui/material';
import { debounce } from 'lodash';
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
import { Home } from '@mui/icons-material';

const ClassPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { class_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classItem: classData,
    members,
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
          gateName: gate ? gate.name : 'N/A',
          className: cls ? cls.name : 'N/A',
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
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditingBoard(null);
      showNotification('Board updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update board', 'error');
    }
  }, [editingBoard, updateExistingBoard, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification('Board deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete board', 'error');
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
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
    try {
      await deleteExistingClass(class_id);
      showNotification('Class deleted successfully!', 'success');
      navigate('/classes');
    } catch (err) {
      showNotification(err.message || 'Failed to delete class', 'error');
    }
  }, [class_id, deleteExistingClass, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    try {
      await toggleFavoriteClass(class_id, classData?.is_favorited);
      showNotification(
        classData?.is_favorited ? 'Class removed from favorites!' : 'Class added to favorites!',
        'success'
      );
    } catch (err) {
      showNotification(err.message || 'Failed to toggle favorite', 'error');
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
      showNotification('Board member role updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update board member role', 'error');
    }
    // No setActionLoading here, handled by dialog if needed
  }, [updateMemberRole, showNotification]);

  // const handleOpenMemberDialog = useCallback(() => setMemberDialogOpen(true), []); // Removed unused function
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

  const headerData = {
    type: "class",
    title: classData?.name || "Class Details",
    titleAriaLabel: `Class page for ${classData?.name || "the class"}`,
    shortDescription: classData?.description || "Manage this class and its boards.",
    tooltipDescription:
      classData?.description || "Detailed information and settings for this class. You can manage members, boards, and class settings here.",
    isFavorited: classData?.is_favorited,
    onFavoriteToggle: handleFavoriteToggle,
    onEdit: () => setEditingClass(classData),
    onDelete: () => setDeleteDialogOpen(true),
    showActions: userRole === 'admin' || userRole === 'owner',
    breadcrumbs: [
      { label: "Home", onClick: () => navigate("/"), icon: <Home /> },
      { label: "Gates", onClick: () => navigate("/gates") },
      gate ? { label: gate.name, onClick: () => navigate(`/gate/${gate.gate_id}`) } : null,
      { label: classData?.name || "Class", isCurrent: true },
    ].filter(Boolean),
  };

  if (authLoading || classesLoading || boardsLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 2, md: 4 } }}>
          <Skeleton variant="rectangular" sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" sx={{ mb: 3, borderRadius: 2 }} />
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(300px, 1fr))' } }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ borderRadius: 2 }} />
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
  
  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <ProfileHeader 
          user={authData} 
          isOwnProfile={true}
          headerData={headerData}
          showActions={headerData.showActions}
          onEdit={headerData.onEdit}
          onDelete={headerData.onDelete}
          onFavoriteToggle={headerData.onFavoriteToggle}
          isFavorited={headerData.isFavorited}
        >
          <button
            onClick={handleOpenCreateBoard}
            aria-label="Create a new board in this class"
          >
            Create Board
          </button>
        </ProfileHeader>
        <BoardsFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
        />
        <BoardsGrid
          filteredBoards={filteredBoards}
          handleFavorite={toggleFavoriteBoard}
          setEditingBoard={setEditingBoard}
          setBoardToDelete={setBoardToDelete}
          setDeleteDialogOpen={(open, boardId) => {
            setBoardToDelete(boardId);
            setDeleteDialogOpen(open);
          }}
          openMemberDialog={handleOpenBoardMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
        />
      </Box>

      <BoardFormDialog
        open={createBoardDialogOpen}
        title="Create New Board in Class"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        disabled={boardsLoading || actionLoading}
        gates={gates}
      />
      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          disabled={boardsLoading || actionLoading}
          gates={gates}
        />
      )}
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classItem={editingClass}
          setClassItem={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
          disabled={classesLoading || actionLoading}
          gates={gates}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title={`Manage Members for ${classData?.name}`}
        classId={class_id}
        token={token}
        onSave={() => handleCancelMemberDialog()}
        onCancel={handleCancelMemberDialog}
        disabled={classesLoading || actionLoading}
        members={members}
        addMember={handleAddClassMember}
        removeMember={handleRemoveClassMember}
        updateMemberRole={handleUpdateClassMemberRole}
      />
      {selectedBoardId && (
        <MemberFormDialog
          open={boardMemberDialogOpen}
          title={`Manage Members for Board`}
          boardId={selectedBoardId}
          token={token}
          onSave={() => handleCancelBoardMemberDialog()}
          onCancel={handleCancelBoardMemberDialog}
          disabled={boardsLoading || actionLoading}
          members={boards.find(b => b.board_id === selectedBoardId)?.members || []}
          addMember={handleAddBoardMember}
          removeMember={handleRemoveBoardMember}
          updateMemberRole={handleUpdateBoardMemberRole}
        />
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setBoardToDelete(null);
        }}
        onConfirm={() => {
          if (boardToDelete) {
            handleDeleteBoard();
          } else {
            handleDeleteClass();
          }
        }}
        message={`Are you sure you want to delete ${boardToDelete ? 'this board' : 'this class'}? This action cannot be undone.`}
        disabled={classesLoading || boardsLoading || actionLoading}
      />
    </AppLayout>
  );
};

ClassPage.propTypes = {
  // class_id is from useParams, not a prop
  // navigate: PropTypes.func, // from useNavigate, not a prop
  // token: PropTypes.string, // from useAuth, not a prop
  // authData: PropTypes.shape({ // from useAuth, not a prop
  //   anonymous_id: PropTypes.string,
  //   username: PropTypes.string,
  //   avatar: PropTypes.string,
  //   total_points: PropTypes.number,
  // }),
  // handleLogout: PropTypes.func, // from useAuth, not a prop
  // isAuthenticated: PropTypes.bool, // from useAuth, not a prop
  // authLoading: PropTypes.bool, // from useAuth, not a prop
};

export default React.memo(ClassPage);