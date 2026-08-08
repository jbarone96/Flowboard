import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Workspace } from "../api";

export function Workspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    api
      .getWorkspaces()
      .then((res) => setWorkspaces(res.workspaces))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    load();
  }, [load, navigate]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.createWorkspace(newName.trim());
      navigate(`/board/${res.workspace.id}`);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <h1>Your workspaces</h1>
      {error && <p className="error">{error}</p>}

      <div className="card">
        <h3>Create a workspace</h3>
        <input
          placeholder="Workspace name (e.g. Acme Corp)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
          {creating ? "Creating..." : "Create workspace"}
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && workspaces.length === 0 && <p>You're not part of any workspaces yet.</p>}

      {workspaces.map((ws) => (
        <div key={ws.id} className="card workspace-card" onClick={() => navigate(`/board/${ws.id}`)}>
          <h3 style={{ textTransform: "none", letterSpacing: 0 }}>{ws.name}</h3>
          <p style={{ margin: 0 }}>Role: {ws.role}</p>
        </div>
      ))}
    </div>
  );
}