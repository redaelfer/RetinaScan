import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [file, setFile] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [anamnesis, setAnamnesis] = useState(''); 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');

  const authConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login'); 
      return;
    }
    fetchHistory();
  }, [navigate, token]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/scans/history', authConfig);
      setHistory(response.data);
    } catch (error) {
      console.error("Erreur chargement historique", error);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) return alert("Veuillez choisir une image !");
    
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('symptoms', symptoms);
    formData.append('anamnesis', anamnesis);
    formData.append('consent', 'true');     

    try {
      const response = await axios.post('http://localhost:8080/api/scans/upload', formData, authConfig);
      setResult(response.data); 
      fetchHistory(); 
      setSymptoms('');
      setAnamnesis('');
      setFile(null);
    } catch (error) {
      console.error("Erreur analyse", error);
      alert("Erreur lors de l'analyse. Vérifiez les logs Backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 shadow-sm">
        <span className="navbar-brand fw-bold">👁️ RetinaScan</span>
        <div className="ms-auto d-flex align-items-center">
          <span className="text-white me-3 d-none d-md-block">{userEmail}</span>
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row g-5">
          
          <div className="col-md-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold text-primary">
                🔍 Nouveau Diagnostic
              </div>
              <div className="card-body">
                <form onSubmit={handleScan}>
                  
                  <div className="mb-3">
                    <label className="form-label text-muted small">Symptômes actuels</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Vision floue, taches..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small">Antécédents (Diabète, etc.)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="Type de diabète, durée..."
                      value={anamnesis}
                      onChange={(e) => setAnamnesis(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small">Image du fond d'œil</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      onChange={(e) => setFile(e.target.files[0])}
                      accept="image/*"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-bold" 
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Analyse...</span>
                    ) : 'Lancer l\'analyse IA'}
                  </button>
                </form>

                {result && (
                  <div className={`mt-4 alert ${result.aiPrediction === 'Œil Sain' ? 'alert-success' : 'alert-danger'} text-center`}>
                    <h4 className="alert-heading fw-bold">{result.aiPrediction}</h4>
                    <p className="mb-0">Confiance IA : <strong>{Math.round(result.aiConfidence * 100)}%</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold text-secondary">
                📂 Historique
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-secondary">
                      <tr>
                        <th className="ps-4">Date</th>
                        <th>Résultat IA</th>
                        <th>Confiance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-4">Aucun scan.</td></tr>
                      ) : (
                        history.map((scan) => (
                          <tr key={scan.id}>
                            <td className="ps-4 text-muted small">
                              {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <span className={`badge ${scan.aiPrediction?.includes('Sain') ? 'bg-success' : 'bg-danger'}`}>
                                {scan.aiPrediction || 'En attente'}
                              </span>
                            </td>
                            <td className="fw-bold">{scan.aiConfidence ? Math.round(scan.aiConfidence * 100) : 0}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;