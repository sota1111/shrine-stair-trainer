import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/record');
    } else {
      setError(true);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>🔐 ログイン</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>
          {error && (
            <div className="danger-box">
              パスワードが正しくありません
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
