import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const DoctorDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId'); 
  
  const [history, setHistory] = useState([]);
  const [comparisonScan, setComparisonScan] = useState(null); 
  const [isComparing, setIsComparing] = useState(false); 

  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeFilter, setActiveFilter] = useState('none');
  
  const [annotationTool, setAnnotationTool] = useState('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [aiReport, setAiReport] = useState(null); 
  const [finalDiagnosis, setFinalDiagnosis] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchQueue();
  }, [navigate, token, patientIdFilter]); 

  const fetchQueue = async () => {
    try {
      let url = 'http://localhost:8080/api/scans/doctor-queue';
      if (patientIdFilter) {
          url = `http://localhost:8080/api/scans/patient/${patientIdFilter}/history`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueue(response.data);
      if (response.data.length > 0) handleSelect(response.data[0]);
      else setSelectedScan(null); 
    } catch (error) {
      console.error("Erreur chargement file active", error);
    }
  };

  const handleSelect = async (scan) => {
    setSelectedScan(scan);
    setZoom(1); setBrightness(100); setContrast(100); setPosition({ x: 0, y: 0 }); setActiveFilter('none');
    setIsComparing(false); 
    setAnnotationTool('none');
    setAiReport(null); 
    setDoctorNotes('');
    
    setFinalDiagnosis(scan.aiPrediction || 'Œil Sain (Niveau 0)');
    
    clearCanvas();

    if (scan.patient && scan.patient.id) {
        try {
            const res = await axios.get(`http://localhost:8080/api/scans/patient/${scan.patient.id}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const patientHistory = res.data;
            setHistory(patientHistory);
            
            const currentIndex = patientHistory.findIndex(s => s.id === scan.id);
            if (currentIndex !== -1 && currentIndex < patientHistory.length - 1) {
                setComparisonScan(patientHistory[currentIndex + 1]); 
            } else {
                setComparisonScan(null);
            }
        } catch (err) {
            console.error("Erreur historique patient", err);
        }
    }
  };

  const handleAskAI = async () => {
    if (!selectedScan) return;
    setAiReport("🔄 Analyse en cours par l'assistant IA...");
    setShowValidationModal(true); 
    try {
        const res = await axios.post(`http://localhost:8080/api/scans/${selectedScan.id}/generate-report`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAiReport(res.data);
    } catch (e) {
        setAiReport("Erreur lors de la génération du rapport IA.");
    }
  };

  const handleValidate = async () => {
    if (!selectedScan) return;
    setIsSubmitting(true);
    try {
        await axios.put(`http://localhost:8080/api/scans/${selectedScan.id}/validate`, 
            { 
                notes: doctorNotes,
                diagnosis: finalDiagnosis 
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        alert(`✅ Rapport validé !\nDiagnostic final : ${finalDiagnosis}`);
        
        setShowValidationModal(false);
        setDoctorNotes('');
        setAiReport(null);
        fetchQueue();
    } catch (error) {
        console.error("Erreur validation", error);
        alert("Erreur lors de la validation.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleMouseDown = (e) => {
    if (annotationTool !== 'none') startDrawing(e);
    else { setIsDragging(true); setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y }); }
  };
  const handleMouseMove = (e) => {
    if (annotationTool !== 'none') draw(e);
    else if (isDragging) setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };
  const handleMouseUp = () => { setIsDragging(false); if (isDrawing) stopDrawing(); };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };
  const handleImageLoad = () => {
    if (imgRef.current && canvasRef.current) {
        canvasRef.current.width = imgRef.current.naturalWidth;
        canvasRef.current.height = imgRef.current.naturalHeight;
    }
  };
  const getCursorPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
  const startDrawing = (e) => {
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCursorPos(e);
    ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (annotationTool === 'circle' || annotationTool === 'arrow') {
        setSnapshot(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)); setStartPos({ x, y });
    } else { ctx.beginPath(); ctx.moveTo(x, y); }
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCursorPos(e);
    if (annotationTool === 'pen') { ctx.lineTo(x, y); ctx.stroke(); }
    else if (annotationTool === 'circle') {
        ctx.putImageData(snapshot, 0, 0); ctx.beginPath();
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI); ctx.stroke();
    } else if (annotationTool === 'arrow') {
        ctx.putImageData(snapshot, 0, 0); drawArrow(ctx, startPos.x, startPos.y, x, y);
    }
  };
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 20; const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(toX, toY); ctx.fill();
  };
  const stopDrawing = () => { setIsDrawing(false); };

  const getFilterStyle = () => {
    let filters = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (activeFilter === 'negative') filters += ' invert(100%)';
    else if (activeFilter === 'red-free') filters += ' url(#red-free-filter)'; 
    return filters;
  };

  const getBadgeColor = (pred) => {
    if (!pred) return 'bg-secondary';
    if (pred.includes('Proliférante') || pred.includes('Sévère')) return 'bg-danger animate__animated animate__flash';
    if (pred.includes('Modérée')) return 'bg-warning text-dark';
    if (pred.includes('Légère')) return 'bg-info text-dark';
    return 'bg-success';
  };

  const renderProbabilities = () => {
    if (!selectedScan || !selectedScan.aiDetails) return null;
    let details = {};
    try { details = JSON.parse(selectedScan.aiDetails); } catch (e) { return <small className="text-white">Détails indisponibles</small>; }
    const classes = [
        { key: 'sain', label: 'Sain (0)', color: 'bg-success' },
        { key: 'leger', label: 'Légère (1)', color: 'bg-info' },
        { key: 'modere', label: 'Modérée (2)', color: 'bg-warning' },
        { key: 'severe', label: 'Sévère (3)', color: 'bg-danger' },
        { key: 'proliferant', label: 'Proliférante (4)', color: 'bg-danger bg-gradient' }
    ];
    return (
        <div className="bg-dark bg-opacity-75 p-3 rounded border border-secondary mt-3">
            <h6 className="text-light mb-3 border-bottom border-secondary pb-2">📊 Aide à la Décision IA</h6>
            {classes.map((cls) => {
                const probability = details[cls.key] || 0;
                const percent = Math.round(probability * 100);
                const isDominant = probability > 0.5;
                return (
                    <div key={cls.key} className="mb-2">
                        <div className="d-flex justify-content-between small mb-1">
                            <span className={isDominant ? "fw-bold text-white" : "text-white"}>{cls.label}</span>
                            <span className="text-white">{percent}%</span>
                        </div>
                        <div className="progress" style={{ height: '6px', backgroundColor: '#444' }}>
                            <div className={`progress-bar ${cls.color}`} role="progressbar" style={{ width: `${percent}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="vh-100 d-flex flex-column bg-dark text-white overflow-hidden">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="red-free-filter"><feColorMatrix type="matrix" values="0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0" /></filter>
        </defs>
      </svg>

      {showValidationModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}>
            <div className="bg-dark border border-secondary rounded shadow-lg p-4 text-white d-flex flex-column" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh' }}>
                <h4 className="fw-bold mb-3 border-bottom border-secondary pb-2">✅ Validation Officielle</h4>
                
                <div className="overflow-auto custom-scrollbar pe-2">
                    
                    <div className="mb-3">
                        <label className="form-label text-info small text-uppercase">Diagnostic Retenu (Modifiable)</label>
                        <select 
                            className="form-select bg-black text-white border-secondary fw-bold"
                            value={finalDiagnosis}
                            onChange={(e) => setFinalDiagnosis(e.target.value)}
                        >
                            <option value="Œil Sain (Niveau 0)">Œil Sain (Niveau 0)</option>
                            <option value="Rétinopathie Légère (Niveau 1)">Rétinopathie Légère (Niveau 1)</option>
                            <option value="Rétinopathie Modérée (Niveau 2)">Rétinopathie Modérée (Niveau 2)</option>
                            <option value="Rétinopathie Sévère (Niveau 3)">Rétinopathie Sévère (Niveau 3)</option>
                            <option value="Rétinopathie Proliférante (Niveau 4)">Rétinopathie Proliférante (Niveau 4)</option>
                        </select>
                        {selectedScan?.aiPrediction !== finalDiagnosis && (
                            <small className="text-warning d-block mt-1">⚠️ Vous modifiez le diagnostic initial de l'IA ({selectedScan?.aiPrediction})</small>
                        )}
                    </div>

                    {aiReport && (
                        <div className="mb-3 animate__animated animate__fadeIn">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label text-warning small text-uppercase mb-0">🤖 Analyse de l'Assistant IA</label>
                                <button 
                                    onClick={() => setDoctorNotes(prev => (prev ? prev + "\n\n" : "") + aiReport)}
                                    className="btn btn-sm btn-link text-white text-decoration-none p-0"
                                    title="Copier le texte ci-dessous dans la zone de conclusion"
                                >
                                    📋 Copier dans conclusion
                                </button>
                            </div>
                            <div className="p-3 rounded border border-warning bg-secondary bg-opacity-10" style={{ backgroundColor: '#1a1a1a', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                {aiReport}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label text-info small text-uppercase mb-0">✍️ Conclusion & Prescription du Médecin</label>
                            {!aiReport && (
                                <button onClick={handleAskAI} className="btn btn-sm btn-outline-warning text-white py-0" style={{fontSize: '0.7rem'}}>
                                    Demander l'avis IA
                                </button>
                            )}
                        </div>
                        <textarea 
                            className="form-control bg-black text-white border-secondary" 
                            rows="6" 
                            placeholder="Rédigez votre conclusion médicale ici..."
                            value={doctorNotes}
                            onChange={(e) => setDoctorNotes(e.target.value)}
                            style={{fontSize: '0.9rem'}}
                        ></textarea>
                    </div>

                    <div className="alert alert-warning small d-flex align-items-center">
                        <span className="me-2">⚠️</span>
                        Cette action générera un rapport PDF officiel et notifiera le patient.
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top border-secondary">
                    <button onClick={() => setShowValidationModal(false)} className="btn btn-outline-light">Annuler</button>
                    <button onClick={handleValidate} className="btn btn-success fw-bold px-4" disabled={isSubmitting}>
                        {isSubmitting ? 'Envoi...' : 'Signer & Envoyer 📩'}
                    </button>
                </div>
            </div>
        </div>
      )}

      <header className="navbar navbar-dark bg-secondary px-3 shadow-sm" style={{ height: '60px' }}>
        <span className="navbar-brand mb-0 h1">👨‍⚕️ RetinaScan <span className="text-info fw-bold">PRO</span></span>
        <div className="d-flex align-items-center">
            {patientIdFilter ? (
                <button onClick={() => navigate('/doctor-dashboard')} className="btn btn-sm btn-outline-warning me-3">⬅️ Retour File Active</button>
            ) : (
                <button onClick={() => navigate('/doctor-stats')} className="btn btn-sm btn-outline-info me-3">📊 Statistiques</button>
            )}
            
            <span className={`badge ${patientIdFilter ? 'bg-primary' : 'bg-danger'} me-3`}>
                {patientIdFilter ? `Mode Patient : ${queue.length} Dossiers` : `File Active : ${queue.length} Cas`}
            </span>
            <button onClick={() => {localStorage.clear(); navigate('/login')}} className="btn btn-sm btn-outline-light">Déconnexion</button>
        </div>
      </header>

      <div className="d-flex flex-grow-1 overflow-hidden">
        
        <div className="d-flex flex-column border-end border-secondary" style={{ width: '350px', minWidth: '350px', backgroundColor: '#2b2b2b' }}>
          <div className="p-2 border-bottom border-secondary bg-dark text-center fw-bold text-uppercase small text-white">
            {patientIdFilter ? "Historique Patient" : "Priorité Urgence"}
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
                  <span className={`badge rounded-pill ${getBadgeColor(scan.aiPrediction)}`}>{scan.aiPrediction}</span>
                  <small className="text-white">{scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : 'N/A'}</small>
                </div>
                <div className="fw-bold text-white mb-1">{scan.patient?.firstname} {scan.patient?.lastname}</div>
              </div>
            ))}
            {queue.length === 0 && <div className="text-center text-muted mt-5">Aucun dossier trouvé.</div>}
          </div>
          <div className="p-2 border-top border-secondary bg-black">{renderProbabilities()}</div>
        </div>

        <div className="flex-grow-1 d-flex flex-column bg-black position-relative">
          {selectedScan ? (
            <>
              <div className="position-absolute top-0 start-50 translate-middle-x mt-5 bg-dark bg-opacity-75 p-2 rounded shadow-lg d-flex align-items-center gap-3 z-3 border border-secondary" style={{ backdropFilter: 'blur(5px)', top: '20px' }}>
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
                  <button onClick={() => setActiveFilter('none')} className={`btn btn-sm ${activeFilter === 'none' ? 'btn-light' : 'btn-outline-secondary'}`}>RGB</button>
                  <button onClick={() => setActiveFilter('red-free')} className={`btn btn-sm ${activeFilter === 'red-free' ? 'btn-success' : 'btn-outline-success'}`}>Vert</button>
                  <button onClick={() => setActiveFilter('negative')} className={`btn btn-sm ${activeFilter === 'negative' ? 'btn-light' : 'btn-outline-light'}`}>Négatif</button>
                </div>
                <div className="border-start border-secondary h-100 mx-1"></div>
                <button onClick={() => setIsComparing(!isComparing)} className={`btn btn-sm fw-bold ${isComparing ? 'btn-primary' : 'btn-outline-primary'}`}>⚖️ Comparer</button>
                <button onClick={() => {setZoom(1); setBrightness(100); setContrast(100); setActiveFilter('none'); setPosition({x:0,y:0}); clearCanvas();}} className="btn btn-sm btn-link text-decoration-none text-white ms-2">↺</button>
              </div>

              {!isComparing && (
                  <div className="position-absolute start-0 top-50 translate-middle-y ms-3 d-flex flex-column gap-2 z-3 bg-dark bg-opacity-75 p-2 rounded border border-secondary">
                      <div className="text-center small text-white mb-1 border-bottom border-secondary">OUTILS</div>
                      <button onClick={() => setAnnotationTool(annotationTool === 'pen' ? 'none' : 'pen')} className={`btn btn-sm ${annotationTool === 'pen' ? 'btn-danger' : 'btn-outline-light'}`} title="Crayon">✏️</button>
                      <button onClick={() => setAnnotationTool(annotationTool === 'circle' ? 'none' : 'circle')} className={`btn btn-sm ${annotationTool === 'circle' ? 'btn-danger' : 'btn-outline-light'}`} title="Cercle">⭕</button>
                      <button onClick={() => setAnnotationTool(annotationTool === 'arrow' ? 'none' : 'arrow')} className={`btn btn-sm ${annotationTool === 'arrow' ? 'btn-danger' : 'btn-outline-light'}`} title="Flèche">↗️</button>
                      <div className="border-bottom border-secondary my-1"></div>
                      <button onClick={clearCanvas} className="btn btn-sm btn-outline-danger" title="Tout effacer">🗑️</button>
                  </div>
              )}

              <div 
                className="flex-grow-1 d-flex overflow-hidden"
                style={{ cursor: annotationTool !== 'none' ? 'crosshair' : (isDragging ? 'grabbing' : 'grab') }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {isComparing && (
                    <div className="w-50 border-end border-secondary position-relative d-flex justify-content-center align-items-center bg-dark">
                        <div className="position-absolute top-0 start-0 m-2 badge bg-secondary z-2">Archives</div>
                        <select 
                            className="position-absolute top-0 end-0 m-2 form-select form-select-sm w-auto z-2 bg-dark text-white border-secondary"
                            onChange={(e) => setComparisonScan(history.find(h => h.id === parseInt(e.target.value)))}
                            value={comparisonScan?.id || ''}
                        >
                            {history.filter(h => h.id !== selectedScan.id).map(h => (
                                <option key={h.id} value={h.id}>{new Date(h.createdAt).toLocaleDateString()} - {h.aiPrediction}</option>
                            ))}
                        </select>
                        {comparisonScan ? (
                            <img 
                                src={`data:image/jpeg;base64,${comparisonScan.imageData}`} alt="Ancien"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, 
                                    filter: getFilterStyle(), transition: isDragging ? 'none' : 'transform 0.1s, filter 0.2s',
                                    maxWidth: '90%', maxHeight: '90%'
                                }}
                                draggable={false}
                            />
                        ) : (<p className="text-white small">Aucun historique</p>)}
                    </div>
                )}
                <div className={`${isComparing ? 'w-50' : 'w-100'} d-flex justify-content-center align-items-center position-relative overflow-hidden`}>
                    <div className="position-absolute top-0 start-0 m-2 badge bg-primary z-2">Actuel ({new Date(selectedScan.createdAt).toLocaleDateString()})</div>
                    <div style={{ position: 'relative', transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, transition: isDragging || isDrawing ? 'none' : 'transform 0.1s', width: 'fit-content' }}>
                        <img 
                            ref={imgRef}
                            src={`data:image/jpeg;base64,${selectedScan.imageData}`} alt="Actuel"
                            onLoad={handleImageLoad}
                            style={{ filter: getFilterStyle(), transition: 'filter 0.2s', maxWidth: '80vw', display: 'block' }}
                            draggable={false}
                        />
                        <canvas ref={canvasRef} className="position-absolute top-0 start-0" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                    </div>
                </div>
              </div>

              <div className="p-3 bg-dark border-top border-secondary text-light">
                <div className="row">
                    <div className="col-md-4 border-end border-secondary">
                        <h6 className="text-info text-uppercase small">Anamnèse</h6>
                        <p className="small mb-0 text-white">{selectedScan.anamnesis || "Non renseigné"}</p>
                    </div>
                    <div className="col-md-4 border-end border-secondary">
                        <h6 className="text-info text-uppercase small">Symptômes</h6>
                        <p className="small mb-0 text-white">{selectedScan.symptoms || "Non renseigné"}</p>
                    </div>
                    <div className="col-md-4 text-end">
                        <button 
                            onClick={handleAskAI}
                            className="btn btn-outline-warning fw-bold px-3 me-2"
                        >
                            🤖 Avis IA
                        </button>
                        <button 
                            onClick={() => setShowValidationModal(true)} 
                            className="btn btn-success fw-bold px-4"
                        >
                            ✅ Valider le Rapport
                        </button>
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