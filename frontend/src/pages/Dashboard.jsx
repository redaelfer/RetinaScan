import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HEALTH_TIPS = {
  sain: {
    title: "Tout va bien ! Préservez votre vue.",
    color: "success",
    icon: "✅",
    tips: [
      "Maintenez une alimentation riche en Oméga-3 (poissons gras, noix).",
      "Protégez vos yeux des UV avec des lunettes de soleil.",
      "Continuez votre dépistage annuel de routine."
    ]
  },
  leger: {
    title: "Vigilance : Stabilisez votre glycémie",
    color: "info",
    icon: "💧",
    tips: [
      "Objectif HbA1c (Hémoglobine glyquée) : Visez < 7%.",
      "Contrôlez votre tension artérielle régulièrement (< 140/90 mmHg).",
      "Pratiquez 30 min d'activité physique douce par jour."
    ]
  },
  modere: {
    title: "Attention : Suivi médical requis",
    color: "warning",
    icon: "⚠️",
    tips: [
      "Consultez votre diabétologue pour réajuster votre traitement.",
      "Le tabac accélère les lésions : essayez de réduire ou d'arrêter.",
      "Faites un fond d'œil de contrôle tous les 6 mois."
    ]
  },
  severe: {
    title: "Urgence : Action médicale nécessaire",
    color: "danger",
    icon: "🚨",
    tips: [
      "Un traitement (Laser ou Injections) peut être nécessaire.",
      "Ne manquez aucun rendez-vous ophtalmologique.",
      "Surveillez l'apparition de taches noires ou d'éclairs lumineux."
    ]
  },
  default: {
    title: "Conseils de Santé Généraux",
    color: "primary",
    icon: "🍎",
    tips: [
      "Adoptez une hygiène de vie saine.",
      "Consultez un médecin en cas de doute."
    ]
  }
};

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

  const getAdvice = (diagnosis) => {
    if (!diagnosis) return null;
    if (diagnosis.includes('Sain')) return HEALTH_TIPS.sain;
    if (diagnosis.includes('Légère')) return HEALTH_TIPS.leger;
    if (diagnosis.includes('Modérée')) return HEALTH_TIPS.modere;
    if (diagnosis.includes('Sévère') || diagnosis.includes('Proliférante')) return HEALTH_TIPS.severe;
    return HEALTH_TIPS.default;
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

  const currentAdvice = result ? getAdvice(result.aiPrediction) : null;

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
                  <div className="animate__animated animate__fadeIn">
                    {/* Bloc Principal Résultat */}
                    <div className={`mt-4 alert text-center shadow-sm ${
                      result.aiPrediction && result.aiPrediction.includes('Sain') ? 'alert-success' : 'alert-warning'
                    }`}>
                      <h5 className="alert-heading fw-bold mb-1">Résultat de l'IA</h5>
                      <hr />
                      <h4 className="fw-bold my-3">{result.aiPrediction}</h4>
                      <p className="mb-2">
                        Indice de confiance : <strong>{Math.round(result.aiConfidence * 100)}%</strong>
                      </p>

                      {result.aiPrediction && !result.aiPrediction.includes('Sain') && (
                        <div className="d-grid gap-2 mt-3">
                          <button onClick={handleAppointment} className="btn btn-danger fw-bold shadow-sm">
                            📅 Prendre RDV Prioritaire
                          </button>
                        </div>
                      )}
                    </div>

                    {currentAdvice && (
                      <div className={`card mt-3 border-${currentAdvice.color} shadow-sm`}>
                        <div className={`card-header bg-${currentAdvice.color} text-white fw-bold`}>
                          {currentAdvice.icon} Conseils Personnalisés
                        </div>
                        <div className="card-body bg-light">
                          <h6 className={`card-title fw-bold text-${currentAdvice.color}`}>
                            {currentAdvice.title}
                          </h6>
                          <ul className="mb-0 mt-2 small text-muted ps-3">
                            {currentAdvice.tips.map((tip, index) => (
                              <li key={index} className="mb-1">{tip}</li>
                            ))}
                          </ul>
                        </div>
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