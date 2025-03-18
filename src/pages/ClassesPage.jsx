import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { fetchClasses } from "../utils/apiPages";

const ClassesPage = ({ currentUser, onLogout, token }) => {
  const navigate = useNavigate();
  const { gateId } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await fetchClasses(gateId, token);
        setClasses(data);
      } catch (error) {
        if (error.response?.status === 401) {
          onLogout();
        } else if (error.response?.status === 403) {
          navigate("/home");
        }
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [gateId, token, onLogout, navigate]);

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ClassesSection currentUser={currentUser} token={token} gateId={gateId} classes={classes} />
    </AppLayout>
  );
};

export default ClassesPage;