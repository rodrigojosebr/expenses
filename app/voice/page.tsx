"use client";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

import { useState, useRef, useEffect } from 'react';

// --- Helper Components ---

const MicIcon = ({ recording }: { recording: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: recording ? '#ff5252' : '#fff' }}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const funnySuccessPhrases = [
  "Dinheiro bem gasto!",
  "Anotado, chefe!",
  "Esse não escapou!",
  "Missão cumprida!",
  "Para a posteridade!",
  "Registrado com sucesso, mestre das finanças!",
  "Até o próximo salário!",
  "Esse foi pro livro!",
  "Gasto registrado, continue arrasando!",
  "Feito! O dinheiro não volta, mas a memória fica!",
  "Gasto anotado, agora é só aproveitar o que sobrou!",
  "Tá salvo, pode gastar sem culpa (mas com controle)!",
  "Tá gastando mas tá feliz, né? Anotado aqui!",
  "Fico me pergutando se seu dinheiro não tem fim kkk",
];

const getRandomFunnyPhrase = () => funnySuccessPhrases[Math.floor(Math.random() * funnySuccessPhrases.length)];

// Generate a number of '$' symbols with random properties for the rain effect
const renderMoneyRain = (count: number) => {
  const moneySymbols = [];
  for (let i = 0; i < count; i++) {
    const delay = Math.random() * 10; // seconds
    const duration = 5 + Math.random() * 5; // seconds
    const left = Math.random() * 100; // percentage
    const size = 15 + Math.random() * 15; // px
    const opacity = 0.5 + Math.random() * 0.5; // 0.5 to 1

    moneySymbols.push(
      <span
        key={i}
        style={{
          position: 'absolute',
          left: `${left}vw`,
          top: `-${size}px`, // Start above the screen
          fontSize: `${size}px`,
          opacity: opacity,
          color: '#4CAF50', // Green for money
          animation: `moneyFall ${duration}s linear ${delay}s infinite`,
          zIndex: 1, // Above main container background
          pointerEvents: 'none', // Don't block interactions
        }}
      >
        $
      </span>
    );
  }
  return moneySymbols;
};

// --- Main Page Component ---

export default function VoiceGastoPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Clique no microfone para começar');
  const [apiKey, setApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [moneyRain, setMoneyRain] = useState<React.ReactNode>(null);
  const recognitionRef = useRef<any>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load API key and user name, and render money rain only on client
  useEffect(() => {
    setMoneyRain(renderMoneyRain(50));
    
    const storedApiKey = localStorage.getItem('gastos_api_key');
    const storedUserName = localStorage.getItem('gastos_user_name');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      if (storedUserName) setUserName(storedUserName);
      setShowSettings(false);
    } else {
      setShowSettings(true);
      setStatus('Bem-vindo! Por favor, configure sua senha.');
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.interimResults = false;
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setStatus('Ouvindo...');
        };

        recognitionRef.current.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          setStatus('Confirme o texto reconhecido.');
          setAwaitingConfirmation(true);
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsRecording(false);
          setStatus(`Erro: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setStatus('Reconhecimento de fala não é suportado neste navegador.');
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const handleMicButtonClick = () => {
    if (!apiKey) {
      setStatus('Configure sua senha nas configurações.');
      setShowSettings(true);
      return;
    }
    if (recognitionRef.current && !isRecording) {
      setTranscript('');
      setStatus('');
      setAwaitingConfirmation(false);
      recognitionRef.current.start();
    }
  };

  const sendGastoToApi = async () => {
    if (!transcript) return;
    setStatus('Enviando...');
    setAwaitingConfirmation(false);

    // Clear any existing timeout
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    try {
      const response = await fetch('/api/gasto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus(`Salvo: ${data.event?.amountBRL} em ${data.event?.description}`);

        statusTimeoutRef.current = setTimeout(() => {
          setStatus(getRandomFunnyPhrase());
        }, 2000);

      } else {
        setStatus(`Erro: ${data.error || response.statusText}`);
      }
    } catch (error: any) {
      setStatus(`Erro de rede: ${error.message}`);
    } finally {
      setTranscript('');
      statusTimeoutRef.current = setTimeout(() => {
        setStatus('Clique no microfone para começar');
      }, 5000);
    }
  };

  const handleCancel = () => {
    setTranscript('');
    setStatus('Clique no microfone para começar');
    setAwaitingConfirmation(false);
  }

  const handleApiKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('gastos_api_key', newKey);

    setUserName('');
    localStorage.removeItem('gastos_user_name');

    if (newKey) {
      setStatus('Verificando senha...');
      try {
        const response = await fetch('/api/user', {
          headers: { 'x-api-key': newKey },
        });
        const data = await response.json();
        if (response.ok && data.user?.name) {
          setUserName(data.user.name);
          localStorage.setItem('gastos_user_name', data.user.name);
          setStatus(`Bem-vindo, ${data.user.name}!`);
        } else {
          setStatus('Senha inválida. Por favor, tente novamente.');
          setUserName('');
        }
      } catch (error) {
        setStatus('Erro ao verificar senha.');
        setUserName('');
      }
    } else {
      setStatus('Por favor, insira sua senha.');
    }
  };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      backgroundColor: '#121212',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100vh',
      padding: '2rem',
      boxSizing: 'border-box',
      overflow: 'hidden', // Prevent scrollbars due to money rain
      position: 'relative', // For z-index context
    },
    header: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      textAlign: 'left',
      zIndex: 10, // Above money rain
      position: 'relative', // For z-index context
    },
    headerTitle: { fontSize: '1.2rem', color: '#888', margin: '0 0 0.5rem 0' },
    welcomeMessage: { fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', margin: 0 },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      zIndex: 10, // Above money rain
      position: 'relative', // For z-index context
    },
    micButton: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      backgroundColor: isRecording ? '#333' : '#007aff',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: isRecording ? '0 0 0 10px rgba(255, 82, 82, 0.5), 0 0 0 20px rgba(255, 82, 82, 0.3)' : '0 4px 15px rgba(0, 122, 255, 0.4)',
    },
    statusText: { marginTop: '2rem', fontSize: '1.4rem', minHeight: '2em', color: '#ffffff', fontWeight: 'bold' },
    transcript: { fontSize: '1.8rem', fontWeight: '500', minHeight: '2.5em', color: '#fff', padding: '0 1rem' },
    confirmationButtons: { marginTop: '1.5rem', display: 'flex', gap: '1rem' },
    button: { padding: '0.9rem 1.6rem', fontSize: '1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'opacity 0.2s' },
    confirmButton: { backgroundColor: '#4CAF50', color: 'white' },
    cancelButton: { backgroundColor: '#6c757d', color: 'white' },
    settingsButton: { background: 'none', border: 'none', color: '#888', cursor: 'pointer' },
    settingsPanel: { backgroundColor: '#1c1c1e', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxSizing: 'border-box', textAlign: 'left', zIndex: 10, position: 'relative' },
    input: { width: '100%', padding: '0.8rem', border: '1px solid #444', borderRadius: '8px', backgroundColor: '#333', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' }
  };

  return (
    <div style={styles.container}>
      {/* CSS Keyframes for money rain */}
      <style jsx global>{`
        @keyframes moneyFall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {moneyRain}

      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Registro de gastos</h1>
          {userName && <p style={styles.welcomeMessage}>Bem-vindo, {userName}!</p>}
        </div>
        <button onClick={() => setShowSettings(!showSettings)} style={styles.settingsButton} aria-label="Configurações">
          <SettingsIcon />
        </button>
      </header>

      {showSettings && (
        <div style={styles.settingsPanel}>
          <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Senha:
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Sua senha secreta"
            style={styles.input}
          />
        </div>
      )}

      <main style={styles.mainContent}>
        <p style={styles.transcript}>{transcript}</p>
        <p style={styles.statusText}>{status}</p>

        {!awaitingConfirmation ? (
          <button
            onClick={handleMicButtonClick}
            disabled={!recognitionRef.current || isRecording}
            style={styles.micButton}
            aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
          >
            <MicIcon recording={isRecording} />
          </button>
        ) : (
          <div style={styles.confirmationButtons}>
            <button onClick={sendGastoToApi} style={{ ...styles.button, ...styles.confirmButton }}>
              Confirmar
            </button>
            <button onClick={handleCancel} style={{ ...styles.button, ...styles.cancelButton }}>
              Tentar Novamente
            </button>
          </div>
        )}
      </main>

      <footer style={{ height: '50px' }}></footer>
    </div>
  );
}
