import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout";
import GatesSection from "../sections/GatesSection/GatesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { fetchGates } from "../utils/apiPages";

const GatesPage = ({ currentUser, onLogout, token }) => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGates = async () => {
      const data = await fetchGates(token);
      setGates(data);
      setLoading(false);
    };
    loadGates();
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <GatesSection currentUser={currentUser} token={token} gates={gates} />
    </AppLayout>
  );
};

export default GatesPage;