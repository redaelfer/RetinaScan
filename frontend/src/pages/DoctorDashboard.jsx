import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeFilter, setActiveFilter] = useState('none');
  
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchQueue();
  }, [navigate, token]);

  const fetchQueue = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/scans/doctor-queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueue(response.data);
      if (response.data.length > 0) handleSelect(response.data[0]);
    } catch (error) {
      console.error("Erreur chargement file active", error);
    }
  };

  const handleSelect = (scan) => {
    setSelectedScan(scan);
    setZoom(1); setBrightness(100); setContrast(100); setPosition({ x: 0, y: 0 });
    setActiveFilter('none');
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getFilterStyle = () => {
    let filters = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    if (activeFilter === 'negative') {
      filters += ' invert(100%)';
    } else if (activeFilter === 'red-free') {
      filters += ' url(#red-free-filter)'; 
    }
    return filters;
  };

  const getBadgeColor = (pred) => {
    if (!pred) return 'bg-secondary';
    if (pred.includes('Proliférante') || pred.includes('Sévère')) return 'bg-danger animate__animated animate__flash';
    if (pred.includes('Modérée')) return 'bg-warning text-dark';
    if (pred.includes('Légère')) return 'bg-info text-dark';
    return 'bg-success';
  };

  return (
    <div className="vh-100 d-flex flex-column bg-dark text-white overflow-hidden">
      
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="red-free-filter">
            <feColorMatrix 
              type="matrix" 
              values="0 1 0 0 0
                      0 1 0 0 0
                      0 1 0 0 0
                      0 0 0 1 0" 
            />
          </filter>
        </defs>
      </svg>

      <header className="navbar navbar-dark bg-secondary px-3 shadow-sm" style={{ height: '60px' }}>
        <span className="navbar-brand mb-0 h1">👨‍⚕️ RetinaScan <span className="text-info fw-bold">PRO</span></span>
        <div className="d-flex align-items-center">
            <span className="badge bg-danger me-3">File Active : {queue.length} Cas</span>
            <button onClick={() => {localStorage.clear(); navigate('/login')}} className="btn btn-sm btn-outline-light">Déconnexion</button>
        </div>
      </header>

      <div className="d-flex flex-grow-1 overflow-hidden">
        
        <div className="d-flex flex-column border-end border-secondary" style={{ width: '350px', minWidth: '350px', backgroundColor: '#2b2b2b' }}>
          <div className="p-2 border-bottom border-secondary bg-dark text-center fw-bold text-uppercase small text-white">
            Priorité Urgence
          </div>
          <div className="overflow-auto custom-scrollbar flex-grow-1">
            {queue.map(scan => (
              <div 
                key={scan.id} 
                onClick={() => handleSelect(scan)}
                className={`p-3 border-bottom border-secondary cursor-pointer ${selectedScan?.id === scan.id ? 'bg-primary bg-opacity-25 border-start border-4 border-info' : 'hover-bg-dark'}`}
                style={{ cursor: 'pointer', transition: '0.2s' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className={`badge rounded-pill ${getBadgeColor(scan.aiPrediction)}`}>
                    {scan.aiPrediction}
                  </span>
                  <small className="text-white">{scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : 'N/A'}</small>
                </div>
                <div className="fw-bold text-light mb-1">{scan.patient?.firstname} {scan.patient?.lastname}</div>
                <div className="small text-white text-truncate">" {scan.symptoms} "</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-grow-1 d-flex flex-column bg-black position-relative">
          
          {selectedScan ? (
            <>
              <div className="position-absolute top-0 start-50 translate-middle-x mt-3 bg-dark bg-opacity-75 p-2 rounded shadow-lg d-flex align-items-center gap-3 z-3 border border-secondary" style={{ backdropFilter: 'blur(5px)' }}>
                
                <div className="d-flex gap-3 px-2">
                  <div className="d-flex flex-column align-items-center">
                    <label className="text-white fw-bold sx-small" style={{fontSize: '0.7rem'}}>ZOOM</label>
                    <input type="range" min="1" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="form-range" style={{width: '60px'}} />
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <label className="text-warning fw-bold sx-small" style={{fontSize: '0.7rem'}}>LUM</label>
                    <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="form-range" style={{width: '60px'}} />
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <label className="text-info fw-bold sx-small" style={{fontSize: '0.7rem'}}>CONT</label>
                    <input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="form-range" style={{width: '60px'}} />
                  </div>
                </div>

                <div className="border-start border-secondary h-100 mx-1"></div>

                <div className="d-flex gap-2">
                  <button 
                    onClick={() => setActiveFilter('none')} 
                    className={`btn btn-sm ${activeFilter === 'none' ? 'btn-light' : 'btn-outline-secondary'}`}
                    title="Couleur Originale"
                  >
                    RGB
                  </button>
                  <button 
                    onClick={() => setActiveFilter('red-free')} 
                    className={`btn btn-sm ${activeFilter === 'red-free' ? 'btn-success' : 'btn-outline-success'}`}
                    title="Canal Vert (Vaisseaux & Hémorragies)"
                  >
                     Canal Vert
                  </button>
                  <button 
                    onClick={() => setActiveFilter('negative')} 
                    className={`btn btn-sm ${activeFilter === 'negative' ? 'btn-light' : 'btn-outline-light'}`}
                    title="Inverser les couleurs"
                  >
                     Négatif
                  </button>
                </div>

                <button onClick={() => {setZoom(1); setBrightness(100); setContrast(100); setActiveFilter('none'); setPosition({x:0,y:0})}} className="btn btn-sm btn-link text-decoration-none text-white ms-2">
                  ↺
                </button>
              </div>

              <div 
                className="flex-grow-1 d-flex justify-content-center align-items-center overflow-hidden"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={`data:image/jpeg;base64,${selectedScan.imageData}`} 
                  alt="Fond d'œil"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    filter: getFilterStyle(),
                    transition: isDragging ? 'none' : 'transform 0.1s, filter 0.2s',
                    maxWidth: '90%',
                    maxHeight: '90%',
                    boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                  }}
                  draggable={false}
                />
              </div>

              <div className="p-3 bg-dark border-top border-secondary text-light">
                <div className="row">
                    <div className="col-md-4 border-end border-secondary">
                        <h6 className="text-info text-uppercase small">Anamnèse</h6>
                        <p className="small mb-0 text-white-50">{selectedScan.anamnesis || "Non renseigné"}</p>
                    </div>
                    <div className="col-md-4 border-end border-secondary">
                        <h6 className="text-info text-uppercase small">Symptômes</h6>
                        <p className="small mb-0 text-white-50">{selectedScan.symptoms || "Non renseigné"}</p>
                    </div>
                    <div className="col-md-4 text-end">
                        <button className="btn btn-success fw-bold px-4">✅ Valider le Rapport</button>
                    </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-white">
                <h3>🖥️ Station de Travail Médecin</h3>
                <p>Sélectionnez un patient à gauche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;