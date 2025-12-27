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
      alert("Erreur lors de l'analyse. Vérifiez que le Backend et l'IA tournent.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleAppointment = () => {
    alert(`✅ Demande reçue ! \n\nUn médecin partenaire a été notifié de votre résultat positif (${result.aiPrediction}). \nIl vous contactera sur ${userEmail} sous 24h.`);
  };

  const getSeverityBadge = (diagnosis) => {
    if (!diagnosis) return 'bg-secondary';
    if (diagnosis.includes('Sain')) return 'bg-success'; 
    if (diagnosis.includes('Légère')) return 'bg-info text-dark'; 
    if (diagnosis.includes('Modérée')) return 'bg-warning text-dark'; 
    if (diagnosis.includes('Sévère')) return 'bg-danger'; 
    if (diagnosis.includes('Proliférante')) return 'bg-danger border border-dark'; 
    return 'bg-primary';
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 shadow-sm">
        <span className="navbar-brand fw-bold">👁️ RetinaScan Pro</span>
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
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Analyse IA en cours...</span>
                    ) : 'Lancer le diagnostic'}
                  </button>
                </form>

                {result && (
                  <div className={`mt-4 alert text-center shadow-sm ${
                    result.aiPrediction && result.aiPrediction.includes('Sain') ? 'alert-success' : 'alert-warning'
                  }`}>
                    <h5 className="alert-heading fw-bold mb-1">Résultat</h5>
                    <hr />
                    <h4 className="fw-bold my-3">{result.aiPrediction}</h4>
                    <p className="mb-3">
                      Indice de confiance : <strong>{Math.round(result.aiConfidence * 100)}%</strong>
                    </p>

                    {result.aiPrediction && !result.aiPrediction.includes('Sain') && (
                      <div className="d-grid gap-2 mt-3 pt-3 border-top border-secondary">
                        <button onClick={handleAppointment} className="btn btn-danger fw-bold animate__animated animate__pulse animate__infinite">
                          📅 Prendre RDV Prioritaire
                        </button>
                        <small className="text-danger fst-italic">
                          ⚠️ Une pathologie a été détectée. Une consultation rapide est recommandée.
                        </small>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold text-secondary">
                📂 Historique des Patients
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-secondary">
                      <tr>
                        <th className="ps-4">Date</th>
                        <th>Diagnostic IA</th>
                        <th>Confiance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-4">Aucun scan enregistré.</td></tr>
                      ) : (
                        history.map((scan) => (
                          <tr key={scan.id}>
                            <td className="ps-4 text-muted small">
                              {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() + ' ' + new Date(scan.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                            </td>
                            <td>
                              <span className={`badge rounded-pill ${getSeverityBadge(scan.aiPrediction)}`}>
                                {scan.aiPrediction || 'En attente'}
                              </span>
                            </td>
                            <td className="fw-bold text-secondary">
                              {scan.aiConfidence ? Math.round(scan.aiConfidence * 100) : 0}%
                            </td>
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