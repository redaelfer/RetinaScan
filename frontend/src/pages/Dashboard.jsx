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
  const [activeTab, setActiveTab] = useState('new'); 
  
  const [showReportModal, setShowReportModal] = useState(null); 
  const [showEducationModal, setShowEducationModal] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const ADVICE_DB = {
    0: [ 
        "✅ Hygiène : Continuez à maintenir un équilibre glycémique stable.",
        "🥦 Alimentation : Privilégiez les légumes verts et les oméga-3.",
        "📅 Suivi : Prochain fond d'œil de contrôle recommandé dans 12 mois."
    ],
    1: [ 
        "⚠️ Tension : Contrôlez strictement votre tension artérielle.",
        "🩸 Diabète : Surveillez votre taux d'hémoglobine glyquée (HbA1c).",
        "📅 Suivi : Consultez votre ophtalmologue dans les 6 à 12 mois."
    ],
    2: [ 
        "🚨 Alerte : Une prise en charge médicale est nécessaire.",
        "💊 Traitement : Vérifiez votre traitement diabétique avec votre médecin traitant.",
        "📅 Suivi : Consultation ophtalmologique recommandée sous 3 mois."
    ],
    3: [ 
        "🚑 Urgence : Risque élevé pour la vision. Ne négligez pas vos symptômes.",
        "👁️ Intervention : Un traitement laser (panphotocoagulation) peut être discuté.",
        "📅 Suivi : Prenez rendez-vous sans tarder (sous 1 mois)."
    ],
    4: [ 
        "🆘 URGENCE ABSOLUE : Risque de cécité ou d'hémorragie.",
        "💉 Traitement : Des injections intravitréennes ou du laser sont requis immédiatement.",
        "🛑 Précautions : Évitez les efforts physiques violents et le port de charges lourdes."
    ]
  };

  const getSeverityLevel = (pred) => {
    if (!pred) return 0;
    if (pred.includes('Sain')) return 0;
    if (pred.includes('Légère')) return 1;
    if (pred.includes('Modérée')) return 2;
    if (pred.includes('Sévère')) return 3;
    if (pred.includes('Proliférante')) return 4;
    return 0;
  };

  const getRecommendation = (pred) => {
      const level = getSeverityLevel(pred);
      if (level === 0) return { text: "Prochain contrôle dans 12 mois.", color: "text-success" };
      if (level === 1) return { text: "Surveillance recommandée tous les 6 à 12 mois.", color: "text-info" };
      if (level === 2) return { text: "Consultez un ophtalmologue sous 3 mois.", color: "text-warning" };
      return { text: "Consultation ophtalmologique URGENTE requise.", color: "text-danger fw-bold" };
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
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
      alert("Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAppointment = () => {
    alert(`✅ Demande reçue ! Un médecin vous contactera sur ${userEmail} sous 24h.`);
  };

  const parseDetails = (jsonString) => {
    try {
        const d = JSON.parse(jsonString);
        return Object.entries(d).sort(([,a],[,b]) => b - a).slice(0, 3);
    } catch {
        return [];
    }
  };

  const printReport = () => {
      window.print();
  };

  const renderEvolutionChart = () => {
    if (history.length < 2) return <p className="text-muted text-center p-3">Pas assez de données pour afficher le graphique d'évolution.</p>;

    const sortedHistory = [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-10);
    
    const points = sortedHistory.map((scan, index) => {
        const x = (index / (sortedHistory.length - 1)) * 100;
        const level = getSeverityLevel(scan.aiPrediction);
        const y = 100 - (level * 25);
        return { x, y, level, date: new Date(scan.createdAt).toLocaleDateString(), scan };
    });

    const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},100 ${linePoints} ${points[points.length - 1].x},100`;

    return (
      <div className="card shadow-sm border-0 mb-4 d-print-none">
        <div className="card-header bg-white fw-bold text-primary">📈 Votre Évolution (10 derniers examens)</div>
        <div className="card-body position-relative" style={{ height: '300px', paddingLeft: '90px' }}>
            <div className="position-absolute top-0 start-0 h-100 d-flex flex-column justify-content-between text-muted small pe-none" 
                 style={{fontSize: '0.75rem', padding: '1rem 0 1rem 1rem', width: '80px', textAlign: 'left'}}>
                 <span className="text-danger fw-bold text-nowrap">Critique</span>
                 <span className="text-nowrap">Sévère</span>
                 <span className="text-nowrap">Modérée</span>
                 <span className="text-nowrap">Légère</span>
                 <span className="text-success fw-bold text-nowrap">Sain</span>
            </div>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{overflow: 'visible'}}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#0d6efd" stopOpacity="0.0"/>
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.15"/>
                    </filter>
                </defs>
                {[0, 1, 2, 3, 4].map(level => (
                    <line key={level} x1="0" y1={100 - (level * 25)} x2="100" y2={100 - (level * 25)} stroke="#f0f0f0" strokeWidth="0.5" strokeDasharray="2" />
                ))}
                <polygon points={areaPoints} fill="url(#chartGradient)" />
                <polyline fill="none" stroke="#0d6efd" strokeWidth="1.5" points={linePoints} filter="url(#shadow)" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, index) => {
                    let color = '#198754';
                    if (p.level === 1) color = '#0dcaf0';
                    if (p.level === 2) color = '#ffc107';
                    if (p.level >= 3) color = '#dc3545';
                    return (
                        <g key={index}>
                            <circle cx={p.x} cy={p.y} r="3" fill={color} opacity="0.2" />
                            <circle cx={p.x} cy={p.y} r="1.5" fill="white" stroke={color} strokeWidth="0.8" style={{cursor: 'pointer'}}>
                                <title>{p.date} : {p.scan.aiPrediction}</title>
                            </circle>
                        </g>
                    );
                })}
            </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 bg-light">
      
      {showReportModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: 9999, overflowY: 'auto' }}>
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-3 d-print-none">
                    <h4 className="fw-bold">Aperçu du Rapport</h4>
                    <div>
                        <button onClick={printReport} className="btn btn-primary me-2">🖨️ Imprimer / PDF</button>
                        <button onClick={() => setShowReportModal(null)} className="btn btn-outline-secondary">Fermer</button>
                    </div>
                </div>

                <div className="p-5 border shadow-sm bg-white" id="printable-report">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <div>
                            <h2 className="fw-bold text-primary mb-0">RetinaScan</h2>
                            <small className="text-muted">Centre d'Imagerie Médicale IA</small>
                        </div>
                        <div className="text-end">
                            <h5 className="fw-bold">RAPPORT D'ANALYSE</h5>
                            <p className="mb-0">Réf: #{showReportModal.id}</p>
                            <p className="mb-0">Date: {new Date(showReportModal.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="row mb-5">
                        <div className="col-6">
                            <h6 className="text-uppercase text-muted small fw-bold">Patient</h6>
                            <p className="fw-bold mb-0">{userEmail}</p>
                        </div>
                        <div className="col-6 text-end">
                            <h6 className="text-uppercase text-muted small fw-bold">Statut</h6>
                            {showReportModal.status === 'VALIDATED' ? 
                                <span className="badge bg-success fs-6">VALIDÉ PAR MÉDECIN</span> : 
                                <span className="badge bg-warning text-dark fs-6">ANALYSE IA (Non validée)</span>
                            }
                        </div>
                    </div>

                    <div className="row mb-5 align-items-center">
                        <div className="col-md-4">
                            <img src={`data:image/jpeg;base64,${showReportModal.imageData}`} className="img-fluid rounded border" alt="Fond d'oeil" />
                        </div>
                        <div className="col-md-8 ps-md-5">
                            <h4 className="fw-bold mb-3">Résultat de l'analyse</h4>
                            <div className="mb-3">
                                <span className="display-6 fw-bold">{showReportModal.aiPrediction}</span>
                            </div>
                            <div className="alert alert-light border">
                                <strong>Recommandation :</strong> {getRecommendation(showReportModal.aiPrediction).text}
                            </div>
                            
                            <div className="mt-3">
                                <h6 className="text-decoration-underline mb-2">Conseils :</h6>
                                <ul className="text-muted small">
                                    {ADVICE_DB[getSeverityLevel(showReportModal.aiPrediction)].map((adv, i) => (
                                        <li key={i}>{adv}</li>
                                    ))}
                                </ul>
                            </div>

                            {showReportModal.doctorNotes && (
                                <div className="mt-4">
                                    <h6 className="text-decoration-underline">Note du Médecin :</h6>
                                    <p className="fst-italic fs-5">"{showReportModal.doctorNotes}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 pt-5 border-top text-center text-muted small">
                        <p>Ce document est généré par RetinaScan AI. Il doit être interprété par un professionnel de santé qualifié.</p>
                        <p>RetinaScan Inc. - Rabat, Maroc</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showEducationModal && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center d-print-none" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="bg-white rounded shadow p-4" style={{ maxWidth: '600px', width: '90%' }}>
                  <h4 className="fw-bold mb-4 text-primary">ℹ️ Comprendre la Rétinopathie</h4>
                  <div className="mb-3">
                      <h6 className="fw-bold text-success">Stade 0 : Pas de Rétinopathie (Sain)</h6>
                      <p className="small text-muted">La rétine est saine. Aucun signe de maladie. Continuez la prévention.</p>
                  </div>
                  <div className="mb-3">
                      <h6 className="fw-bold text-info">Stade 1 : Légère</h6>
                      <p className="small text-muted">Présence de microanévrismes. Nécessite une surveillance.</p>
                  </div>
                  <div className="mb-3">
                      <h6 className="fw-bold text-warning">Stade 2 : Modérée</h6>
                      <p className="small text-muted">Les vaisseaux sanguins se bouchent. La nutrition de la rétine diminue.</p>
                  </div>
                  <div className="mb-3">
                      <h6 className="fw-bold text-danger">Stade 3 & 4 : Sévère / Proliférante</h6>
                      <p className="small text-muted">Création de nouveaux vaisseaux fragiles. Risque élevé. Traitement requis d'urgence.</p>
                  </div>
                  <div className="text-end mt-4">
                      <button onClick={() => setShowEducationModal(false)} className="btn btn-secondary">Compris</button>
                  </div>
              </div>
          </div>
      )}

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 shadow-sm d-print-none">
        <span className="navbar-brand fw-bold">👁️ RetinaScan <span className="fw-light">Patient</span></span>
        <div className="ms-auto d-flex align-items-center">
          <button onClick={() => setShowEducationModal(true)} className="btn btn-sm btn-info text-white me-3">ℹ️ Comprendre ma maladie</button>
          <span className="text-white me-3 d-none d-md-block">{userEmail}</span>
          <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Déconnexion</button>
        </div>
      </nav>

      <div className="container py-4 d-print-none">
        
        <ul className="nav nav-pills mb-4 justify-content-center">
            <li className="nav-item">
                <button 
                    className={`nav-link fw-bold px-4 ${activeTab === 'new' ? 'active' : 'bg-white text-secondary'}`}
                    onClick={() => setActiveTab('new')}
                >
                    🔍 Nouvel Examen
                </button>
            </li>
            <li className="nav-item ms-3">
                <button 
                    className={`nav-link fw-bold px-4 ${activeTab === 'stats' ? 'active' : 'bg-white text-secondary'}`}
                    onClick={() => setActiveTab('stats')}
                >
                    📊 Mon Suivi & Rapports
                </button>
            </li>
        </ul>

        <div className="row g-5">
          
          {activeTab === 'new' && (
              <>
                <div className="col-md-5">
                    <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-white fw-bold text-primary">Formulaire de Diagnostic</div>
                    <div className="card-body">
                        <form onSubmit={handleScan}>
                        <div className="mb-3">
                            <label className="form-label text-muted small">Symptômes actuels</label>
                            <textarea className="form-control" rows="2" placeholder="Ex: Vision floue..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required></textarea>
                        </div>
                        <div className="mb-3">
                            <label className="form-label text-muted small">Antécédents</label>
                            <textarea className="form-control" rows="2" placeholder="Ex: Diabète Type 2 depuis 10 ans..." value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} required></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="form-label text-muted small">Image du fond d'œil</label>
                            <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading || !file}>
                            {loading ? <span><span className="spinner-border spinner-border-sm me-2"></span>Analyse...</span> : 'Lancer le diagnostic'}
                        </button>
                        </form>

                        {result && (
                        <div className={`mt-4 alert text-center shadow-sm animate__animated animate__fadeIn ${result.aiPrediction && result.aiPrediction.includes('Sain') ? 'alert-success' : 'alert-warning'}`}>
                            <h5 className="alert-heading fw-bold mb-1">Résultat de l'IA</h5>
                            <hr />
                            <h4 className="fw-bold my-3">{result.aiPrediction}</h4>
                            <p className="mb-3">Confiance : <strong>{Math.round(result.aiConfidence * 100)}%</strong></p>
                            
                            <div className={`badge p-2 mb-3 text-wrap ${getRecommendation(result.aiPrediction).color.replace('text-', 'bg-')} bg-opacity-75`}>
                                📅 {getRecommendation(result.aiPrediction).text}
                            </div>

                            <div className="mt-3 text-start bg-white p-3 rounded border">
                                <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">📋 Recommandations Personnalisées :</h6>
                                <ul className="mb-0 ps-3 small text-muted">
                                    {ADVICE_DB[getSeverityLevel(result.aiPrediction)].map((advice, idx) => (
                                        <li key={idx} className="mb-1">{advice}</li>
                                    ))}
                                </ul>
                            </div>

                            {result.aiDetails && (
                                <div className="mt-3 text-start bg-white p-2 rounded">
                                    <small className="text-muted fw-bold">Détails IA :</small>
                                    {parseDetails(result.aiDetails).map(([key, val]) => (
                                        <div key={key} className="d-flex align-items-center mt-1">
                                            <span className="small text-uppercase me-2" style={{width: '80px', fontSize:'0.7rem'}}>{key}</span>
                                            <div className="progress flex-grow-1" style={{height: '6px'}}>
                                                <div className="progress-bar bg-info" style={{width: `${val*100}%`}}></div>
                                            </div>
                                            <span className="ms-2 small">{Math.round(val*100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result.aiPrediction && !result.aiPrediction.includes('Sain') && (
                            <div className="d-grid gap-2 mt-3 pt-3 border-top border-secondary">
                                <button onClick={handleAppointment} className="btn btn-danger fw-bold">📅 Prendre RDV Prioritaire</button>
                            </div>
                            )}
                        </div>
                        )}
                    </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className="card shadow-sm border-0 mb-4 bg-primary text-white">
                        <div className="card-body d-flex align-items-center">
                            <div className="display-4 me-3">💡</div>
                            <div>
                                <h5 className="fw-bold">Le Saviez-vous ?</h5>
                                <p className="mb-0 small">Un contrôle régulier de la glycémie réduit de 40% les risques de rétinopathie. Pensez à faire un scan tous les mois.</p>
                            </div>
                        </div>
                    </div>
                    
                    <h5 className="text-secondary fw-bold mb-3">Derniers Examens</h5>
                    <div className="list-group">
                        {history.slice(0, 3).map(scan => (
                            <div key={scan.id} className="list-group-item d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <img src={`data:image/jpeg;base64,${scan.imageData}`} className="rounded me-3" width="60" height="60" style={{objectFit:'cover'}} alt="Scan" />
                                    <div>
                                        <h6 className="mb-0 fw-bold">{scan.aiPrediction}</h6>
                                        <small className="text-muted">{new Date(scan.createdAt).toLocaleDateString()}</small>
                                    </div>
                                </div>
                                <button onClick={() => setShowReportModal(scan)} className="btn btn-sm btn-outline-secondary">Voir</button>
                            </div>
                        ))}
                    </div>
                </div>
              </>
          )}

          {activeTab === 'stats' && (
              <div className="col-12">
                  
                  {renderEvolutionChart()}

                  <h5 className="text-primary fw-bold mb-3 mt-5">Historique Médical & Rapports</h5>
                  <div className="row g-4">
                      {history.map((scan) => (
                          <div key={scan.id} className="col-md-6">
                              <div className="card border-0 shadow-sm h-100">
                                  <div className="card-body">
                                      <div className="d-flex">
                                          <div className="me-3">
                                              <img 
                                                src={`data:image/jpeg;base64,${scan.imageData}`} 
                                                className="rounded border" 
                                                width="100" height="100" 
                                                style={{objectFit:'cover', cursor: 'pointer'}} 
                                                onClick={() => setShowReportModal(scan)}
                                                alt="Rétine" 
                                              />
                                          </div>
                                          
                                          <div className="flex-grow-1">
                                              <div className="d-flex justify-content-between align-items-start">
                                                  <span className={`badge rounded-pill ${
                                                      scan.aiPrediction.includes('Sain') ? 'bg-success' : 
                                                      scan.aiPrediction.includes('Sévère') ? 'bg-danger' : 'bg-warning text-dark'
                                                  }`}>
                                                      {scan.aiPrediction}
                                                  </span>
                                                  <small className="text-muted">{new Date(scan.createdAt).toLocaleDateString()}</small>
                                              </div>

                                              <div className={`small mt-2 ${getRecommendation(scan.aiPrediction).color}`}>
                                                  👉 {getRecommendation(scan.aiPrediction).text}
                                              </div>

                                              {scan.status === 'VALIDATED' && (
                                                  <div className="alert alert-success p-2 mt-2 mb-2 small">
                                                      <div className="fw-bold">👨‍⚕️ Validé par le médecin</div>
                                                      <div className="fst-italic text-truncate">"{scan.doctorNotes || 'Aucune note'}"</div>
                                                  </div>
                                              )}

                                              <div className="mt-3 text-end">
                                                  <button onClick={() => setShowReportModal(scan)} className="btn btn-sm btn-primary">
                                                      📄 Voir le Rapport
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;