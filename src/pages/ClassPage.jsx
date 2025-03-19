// src/pages/ClassPage.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout";
import ClassSection from "../sections/ClassSection/ClassSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import { useParams } from "react-router-dom";
import CreateModal from "../components/CreateModal/CreateModal";
import { useClasses } from "../hooks/useClasses";

const ClassPage = ({ currentUser, onLogout, token }) => {
  const { class_id } = useParams();
  const { fetchClass, loading, error } = useClasses(token);
  const [classData, setClassData] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const data = await fetchClass(class_id);
        setClassData(data);
      } catch (err) {
        // Error is already set by the hook
      }
    };
    loadClass();
  }, [class_id, fetchClass]);

  const handleCreateSuccess = () => {
    // Optionally refresh class data to get updated boards
    fetchClass(class_id).then((data) => setClassData(data));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ClassSection
        currentUser={currentUser}
        classData={classData}
        token={token}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="board"
        token={token}
        onSuccess={handleCreateSuccess}
      />
    </AppLayout>
  );
};

export default ClassPage;