import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email: email,
        password: password
      });

      const token = response.data.token;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', email);

      console.log("Connexion réussie !");
      navigate('/dashboard');

    } catch (err) {
      console.error("Erreur détaillée :", err);

      if (!err.response) {
        setError("Impossible de contacter le serveur. Vérifiez qu'il est lancé ou problème CORS.");
      } else if (err.response.status === 403 || err.response.status === 401) {
        setError("Email ou mot de passe incorrect.");
      } else {
        setError(`Erreur serveur : ${err.response.status}`);
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ width: '400px' }}>
        <div className="card-body">
          <h2 className="text-center text-primary mb-4">RetinaScan 👁️</h2>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Ex: reda@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2">
              Se connecter
            </button>
          </form>

          <div className="text-center mt-3">
            <small className="text-muted">
              Pas de compte ? <a href="#" className="text-decoration-none">S'inscrire</a>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;