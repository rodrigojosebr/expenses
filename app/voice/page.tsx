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

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
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
  "Agora é só aproveitar o que sobrou!",
  "Tá salvo, pode gastar sem culpa (mas com controle)!",
  "Tá gastando mas tá feliz, né? Anotado aqui!",
  "Nossa, seu dinheiro não tem fim kkk",
  "Adeus, dinheirinho!",
  "Lá se vai mais um...",
  "O cartão chora, mas a gente sorri!",
  "Economizar pra quê, né?",
  "Mais um pra conta do prejuízo!",
  "Rico por 5 minutos!",
  "O boleto que lute!",
  "Ostentação (ou não) registrada!",
  "O importante é ter saúde!",
  "Saldo diminuindo em 3, 2, 1...",
];

const getRandomFunnyPhrase = () => funnySuccessPhrases[Math.floor(Math.random() * funnySuccessPhrases.length)];

// Generate a number of '$' symbols with random properties for the rain effect
const renderMoneyRain = (count: number) => {
  const moneySymbols = [];
  for (let i = 0; i < count; i++) {
    const delay = Math.random() * 10;
    const duration = 5 + Math.random() * 5;
    const left = Math.random() * 100;
    const size = 15 + Math.random() * 15;
    const opacity = 0.5 + Math.random() * 0.5;

    moneySymbols.push(
      <span
        key={i}
        style={{
          position: 'absolute',
          left: `${left}vw`,
          top: `-${size}px`,
          fontSize: `${size}px`,
          opacity: opacity,
          color: '#4CAF50',
          animation: `moneyFall ${duration}s linear ${delay}s infinite`,
          zIndex: 1,
          pointerEvents: 'none',
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordPreFilled, setIsPasswordPreFilled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Load API key and user name, and render money rain only on client
  useEffect(() => {
    setMoneyRain(renderMoneyRain(50));

    const storedApiKey = localStorage.getItem('gastos_api_key');
    const storedUserName = localStorage.getItem('gastos_user_name');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsPasswordPreFilled(true);
      if (storedUserName) setUserName(storedUserName);
      setShowSettings(false);
    } else {
      setShowSettings(true);
      setStatus('Bem-vindo! Por favor, configure sua senha.');
    }
  }, []);

  // Close settings when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSettings &&
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showSettings]);

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

    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    try {
      const response = await fetch('/api/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
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
      }, 6000);
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
        const response = await fetch('/api/user', { headers: { 'x-api-key': newKey } });
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

  const [exportMode, setExportMode] = useState<'current' | 'previous' | 'custom'>('current');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Generate last 24 months for the dropdown
  const last24Months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  useEffect(() => {
    // Set default custom range to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCustomFrom(currentMonth);
    setCustomTo(currentMonth);
  }, []);

  const downloadCsv = () => {
    if (!apiKey) return;

    let from = '';
    let to = '';
    const now = new Date();

    if (exportMode === 'current') {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      to = from;
    } else if (exportMode === 'previous') {
      now.setMonth(now.getMonth() - 1);
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      to = from;
    } else {
      from = customFrom;
      to = customTo;
    }

    if (!from || !to) return;

    // Basic validation for custom range (simple check, backend does more)
    if (exportMode === 'custom' && from > to) {
      alert('A data de início deve ser anterior ou igual à data de fim.');
      return;
    }

    const url = `/api/export.csv?key=${apiKey}&from=${from}&to=${to}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos-${from}-ate-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      minHeight: '100vh',
      padding: '2rem',
      boxSizing: 'border-box',
      overflowY: 'auto',
      position: 'relative',
    },
    settingsPanel: {
      backgroundColor: '#1c1c1e',
      padding: '1.5rem',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      boxSizing: 'border-box',
      textAlign: 'left',
      zIndex: 10,
      position: 'relative',
      marginTop: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      flexShrink: 0,
    },
    header: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      textAlign: 'left',
      zIndex: 10,
      position: 'relative',
      flexShrink: 0,
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
      zIndex: 10,
      position: 'relative',
      width: '100%',
      marginTop: showSettings ? '0' : '2rem',
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
    inputContainer: { position: 'relative', width: '100%' },
    input: {
      width: '100%',
      padding: '0.8rem 2.5rem 0.8rem 0.8rem',
      border: '1px solid #444',
      borderRadius: '8px',
      backgroundColor: '#333',
      color: '#fff',
      fontSize: '1rem',
      boxSizing: 'border-box',
    },
    eyeButton: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#888',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <style jsx global>{`
        @keyframes moneyFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {moneyRain}

      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Registro de gastos</h1>
          {userName && <p style={styles.welcomeMessage}>Bem-vindo, {userName}!</p>}
        </div>
        <button 
          ref={settingsButtonRef}
          onClick={() => setShowSettings(!showSettings)} 
          style={styles.settingsButton} 
          aria-label="Configurações"
        >
          <SettingsIcon />
        </button>
      </header>

      {showSettings && (
        <div ref={settingsPanelRef} style={styles.settingsPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configurações</h2>
            <button 
              onClick={() => setShowSettings(false)} 
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '5px' }}
              aria-label="Fechar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Senha:
          </label>
          <div style={styles.inputContainer}>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              id="apiKey"
              value={isPasswordPreFilled ? '' : apiKey}
              onChange={(e) => {
                setIsPasswordPreFilled(false);
                handleApiKeyChange(e);
              }}
              placeholder={isPasswordPreFilled ? "Senha já configurada. Digite para alterar." : "Sua senha secreta"}
              style={styles.input}
            />
            <button
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.eyeButton}
              aria-label={isPasswordVisible ? 'Esconder senha' : 'Mostrar senha'}
            >
              {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <hr style={{ borderColor: '#444', margin: '1.5rem 0 1rem 0' }} />

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Exportar dados:
          </label>
          
          <div style={{ display: 'flex', marginBottom: '1rem', backgroundColor: '#333', borderRadius: '8px', padding: '0.2rem' }}>
             <button
                onClick={() => setExportMode('current')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: exportMode === 'current' ? '#007aff' : 'transparent',
                  color: exportMode === 'current' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
             >
               Mês Atual
             </button>
             <button
                onClick={() => setExportMode('previous')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: exportMode === 'previous' ? '#007aff' : 'transparent',
                  color: exportMode === 'previous' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
             >
               Mês Anterior
             </button>
             <button
                onClick={() => setExportMode('custom')}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: exportMode === 'custom' ? '#007aff' : 'transparent',
                  color: exportMode === 'custom' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
             >
               Personalizado
             </button>
          </div>

          {exportMode === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <select
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {last24Months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span style={{ color: '#888' }}>até</span>
              <select
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  backgroundColor: '#333',
                  color: '#fff',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {last24Months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={downloadCsv}
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: '#217346',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Baixar CSV {exportMode === 'custom' ? '(Período)' : exportMode === 'previous' ? '(Mês Anterior)' : '(Mês Atual)'}
          </button>
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
