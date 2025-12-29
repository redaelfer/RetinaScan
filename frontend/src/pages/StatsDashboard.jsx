import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchStats();
  }, [navigate, token]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/scans/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error("Erreur stats", error);
    }
  };

  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);
    try {
      const res = await axios.get(`http://localhost:8080/api/scans/patient/${patient.id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientHistory(res.data);
    } catch (error) {
      console.error("Erreur historique", error);
    }
  };

  const getBadgeColor = (pred) => {
    if (!pred) return 'bg-secondary';
    if (pred.includes('Sain')) return 'bg-success';
    if (pred.includes('Légère')) return 'bg-info text-dark';
    if (pred.includes('Modérée')) return 'bg-warning text-dark';
    return 'bg-danger';
  };

  if (!stats) return <div className="text-center mt-5 text-white">Chargement des données...</div>;

  return (
    <div className="min-vh-100 bg-dark text-white p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
        <div>
            <h2 className="fw-bold text-white mb-0">📊 Pilotage Clinique</h2>
            <small className="text-info">Supervision & Statistiques IA</small>
        </div>
        <div>
            <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-outline-info me-2">🖥️ Workstation</button>
            <button onClick={() => {localStorage.clear(); navigate('/login')}} className="btn btn-outline-light">Déconnexion</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
            <div className="card bg-primary bg-gradient text-white border-0 shadow-sm h-100">
                <div className="card-body text-center">
                    <h1 className="display-4 fw-bold mb-0">{stats.totalScans}</h1>
                    <div className="small text-white-50 text-uppercase fw-bold">Total Scans</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-danger bg-gradient text-white border-0 shadow-sm h-100 animate__animated animate__pulse">
                <div className="card-body text-center">
                    <h1 className="display-4 fw-bold mb-0">{stats.urgentCases}</h1>
                    <div className="small text-white-50 text-uppercase fw-bold">⚠️ Cas Urgents</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-warning bg-gradient text-dark border-0 shadow-sm h-100">
                <div className="card-body text-center">
                    <h1 className="display-4 fw-bold mb-0">{stats.pendingCases}</h1>
                    <div className="small text-dark text-uppercase fw-bold">⏳ En Attente</div>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card bg-success bg-gradient text-white border-0 shadow-sm h-100">
                <div className="card-body text-center">
                    <h1 className="display-4 fw-bold mb-0">{(stats.avgConfidence * 100).toFixed(0)}%</h1>
                    <div className="small text-white-50 text-uppercase fw-bold">🎯 Fiabilité IA</div>
                </div>
            </div>
        </div>
      </div>

      <div className="row g-4">
        
        <div className="col-md-4">
          <div className="card bg-secondary bg-opacity-10 border border-secondary h-100 text-white"> 
            <div className="card-header bg-transparent border-0 fw-bold text-info">Répartition Pathologies</div>
            <div className="card-body">
              {Object.entries(stats.severityDistribution).map(([label, count]) => {
                const percent = Math.round((count / stats.totalScans) * 100);
                return (
                  <div key={label} className="mb-3">
                    <div className="d-flex justify-content-between small mb-1 text-white">
                      <span>{label}</span>
                      <span>{count} ({percent}%)</span>
                    </div>
                    <div className="progress" style={{height: '8px', backgroundColor: '#333'}}>
                      <div className={`progress-bar ${getBadgeColor(label)}`} style={{width: `${percent}%`}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-md-4">
            <div className="card bg-secondary bg-opacity-10 border border-secondary h-100 text-white">
                <div className="card-header bg-transparent border-0 fw-bold text-success">Activité (7 jours)</div>
                <div className="card-body d-flex align-items-end justify-content-around h-100 pb-3">
                    {stats.scansLast7Days && Object.entries(stats.scansLast7Days).map(([date, count]) => (
                        <div key={date} className="d-flex flex-column align-items-center" style={{height: '100%'}}>
                            <div className="flex-grow-1 d-flex align-items-end w-100">
                                <div 
                                    className="bg-info w-100 rounded-top" 
                                    style={{
                                        height: `${count > 0 ? (count / Math.max(...Object.values(stats.scansLast7Days)) * 80) : 2}%`, 
                                        minWidth: '20px',
                                        transition: 'height 0.5s'
                                    }}
                                    title={`${count} scans`}
                                ></div>
                            </div>
                            <small className="text-white-50 mt-2" style={{fontSize: '0.6rem'}}>{new Date(date).getDate()}/{new Date(date).getMonth()+1}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="col-md-4">
          <div className="card bg-secondary bg-opacity-10 border border-secondary h-100 text-white">
            <div className="card-header bg-transparent border-0 fw-bold text-warning">Top Symptômes</div>
            <div className="card-body">
                {Object.entries(stats.symptomsFrequency).map(([symp, count]) => (
                    <span key={symp} className="badge bg-dark border border-secondary me-2 mb-2 p-2 text-white">
                        {symp} <span className="text-warning fw-bold ms-2">{count}</span>
                    </span>
                ))}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card bg-secondary bg-opacity-10 border border-secondary h-100 text-white" style={{minHeight: '400px'}}>
            <div className="card-header bg-transparent border-bottom border-secondary fw-bold text-white">👥 Patients</div>
            <div className="list-group list-group-flush overflow-auto custom-scrollbar" style={{maxHeight: '500px'}}>
              {stats.patients.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => handlePatientClick(p)}
                  className={`list-group-item list-group-item-action bg-transparent text-white border-secondary ${selectedPatient?.id === p.id ? 'active border-start border-4 border-info' : ''}`}
                >
                  <div className="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 className="mb-0 text-white fw-bold">{p.firstname} {p.lastname}</h6>
                        <small className="text-white-50">{p.email}</small>
                    </div>
                    <span className="text-info">➔</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-8">
            <div className="card bg-black border border-secondary h-100 text-white">
                <div className="card-header bg-transparent border-bottom border-secondary d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-info">
                        📈 Dossier Patient : {selectedPatient ? `${selectedPatient.firstname} ${selectedPatient.lastname}` : "Sélectionner..."}
                    </span>
                    
                    <div className="d-flex gap-2">
                        {selectedPatient && (
                            <button 
                                onClick={() => navigate(`/doctor-dashboard?patientId=${selectedPatient.id}`)}
                                className="btn btn-sm btn-outline-primary"
                            >
                                🖥️ Ouvrir Workstation
                            </button>
                        )}
                        {selectedPatient && <span className="badge bg-secondary d-flex align-items-center">{patientHistory.length} Examens</span>}
                    </div>
                </div>
                <div className="card-body bg-dark overflow-auto" style={{maxHeight: '500px'}}>
                    {!selectedPatient ? (
                        <div className="text-center text-white-50 mt-5 pt-5">
                            <h4>👈 Sélectionnez un patient</h4>
                            <p>Visualisez l'historique complet et l'évolution de la maladie.</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {patientHistory.map((scan) => (
                                <div key={scan.id} className="col-md-6">
                                    <div className="card bg-black border border-secondary h-100 shadow-sm text-white">
                                        <div className="row g-0 h-100">
                                            <div className="col-4 d-flex align-items-center bg-dark justify-content-center overflow-hidden border-end border-secondary">
                                                <img 
                                                    src={`data:image/jpeg;base64,${scan.imageData}`} 
                                                    className="img-fluid" 
                                                    style={{height: '100%', objectFit: 'cover'}}
                                                    alt="Scan" 
                                                />
                                            </div>
                                            <div className="col-8">
                                                <div className="card-body p-2">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="badge bg-secondary text-white small">{new Date(scan.createdAt).toLocaleDateString()}</span>
                                                        {scan.status === 'VALIDATED' && <span className="badge bg-success small">Validé</span>}
                                                    </div>
                                                    <h6 className={`card-title fw-bold small mb-1 ${scan.aiPrediction.includes('Sain') ? 'text-success' : 'text-danger'}`}>
                                                        {scan.aiPrediction}
                                                    </h6>
                                                    <p className="card-text small text-white-50 mb-0 text-truncate">
                                                        Prob. Sévère: {scan.aiDetails ? Math.round(JSON.parse(scan.aiDetails).severe * 100) : 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StatsDashboard;