"use client";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

import { useState, useRef, useEffect } from 'react';
import { css } from '../../styled-system/css';

// Layout
import { Container } from '../../components/layout/Container';
import { Header } from '../../components/layout/Header';
import { MainContent } from '../../components/layout/MainContent';

// UI
import { MicIcon } from '../../components/ui/MicIcon';
import { SettingsIcon } from '../../components/ui/SettingsIcon';
import { EyeIcon, EyeOffIcon } from '../../components/ui/EyeIcons';
import { ActionButton } from '../../components/ui/ActionButton';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';

// Features
import { MoneyRain } from '../../components/features/MoneyRain';
import { SettingsPanel } from '../../components/features/SettingsPanel';
import { MicButton } from '../../components/features/MicButton';

const funnySuccessPhrases = [
  "💸 Mais um pra conta, {name}! Dinheiro é pra circular mesmo (eu acho).",
  "🫡 Anotado, {name}! Deixa que o Serasa que lute com a gente.",
  "🥷 Rapaz, {name}... esse não escapou do nosso radar!",
  "✅ Missão cumprida! O Pix não falha, né {name}?",
  "📜 Para a posteridade, {name}! (e pro desespero do final do mês).",
  "🧙‍♂️ Magia feita, {name}! Gasto registrado com sucesso.",
  "🐢 {name}, força na peruca porque até o próximo salário ainda falta...",
  "📖 Mais um capítulo escrito no livro das lamentações, {name}!",
  "✨ Tá lá! Continue arrasando, {name} (mas com moderação, por favor).",
  "🪦 Feito, {name}! O dinheiro não volta, mas pelo menos a lembrança fica.",
  "🍿 Agora é só aproveitar, {name}... se sobrou algo na conta, claro.",
  "😌 Pode respirar fundo, {name}. Tá salvo! Gaste sem culpa.",
  "🥳 Gastar dá uma felicidade, né {name}? Já anotei aqui!",
  "🤑 Meu Deus do céu, {name}! Seu dinheiro parece que não tem fim kkk",
  "👋 Adeus, suado dinheirinho do {name}... foi bom enquanto durou.",
  "🪽 E lá se vai mais um... {name}, seu dinheiro criou asas!",
  "💳 Olha {name}... o cartão chora, mas a gente sorri!",
  "🤡 Economizar pra quê, {name}? A gente só vive uma vez mesmo!",
  "📉 Lá vamos nós, {name}... mais umzinho pra conta do prejuízo!",
  "👑 É {name}, a gente se sente rico só por 5 minutos após o salário, né?",
  "🥊 O boleto que lute, {name}! O importante é a gente viver a vida.",
  "💅 Anotadíssimo! Essa ostentação foi registrada com sucesso, {name}!",
  "🏥 Como a gente sempre diz, {name}: o importante é ter saúde!",
  "⏳ Atenção, {name}: Saldo diminuindo em 3, 2, 1...",
  "🍷 Fino senhores! {name} fazendo mais um gasto chique por aqui.",
  "🛸 É, {name}... e lá se foi o dinheiro pro espaço sideral...",
];

const getRandomFunnyPhrase = (name: string) => {
  const phrase = funnySuccessPhrases[Math.floor(Math.random() * funnySuccessPhrases.length)];
  return phrase.replace(/{name}/g, name || 'chefe');
};

export default function VoiceGastoPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Clique no microfone para começar');
  const [apiKey, setApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordPreFilled, setIsPasswordPreFilled] = useState(false);
  const [analyzeBeforeExport, setAnalyzeBeforeExport] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Load API key and user name
  useEffect(() => {
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

  // Close settings when clicking outside
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Close settings on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setStatus('Ouvindo... (pode falar no seu tempo)');
        };

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);

          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

          silenceTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
          }, 2000); // 2 segundos de silêncio encerram a gravação
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsRecording(false);
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          setStatus(`Erro: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          setStatus('Confirme o texto reconhecido.');
          setAwaitingConfirmation(true);
        };
      } else {
        setStatus('Reconhecimento de fala não é suportado neste navegador.');
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  const handleMicButtonClick = () => {
    if (!apiKey) {
      setStatus('Configure sua senha nas configurações.');
      setShowSettings(true);
      return;
    }
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
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

    const loadingPhrases = [
      "👛 Abrindo a carteira...",
      "📝 Anotando no caderninho...",
      "🧮 Fazendo as contas...",
      "🧐 Analisando a compra...",
      "☁️ Guardando na nuvem..."
    ];
    setStatus(loadingPhrases[0]);
    setAwaitingConfirmation(false);

    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);

    const displayPhrasesPromise = new Promise((resolve) => {
      let phraseIndex = 0;
      loadingIntervalRef.current = setInterval(() => {
        phraseIndex++;
        if (phraseIndex < loadingPhrases.length) {
          setStatus(loadingPhrases[phraseIndex]);
        } else {
          if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
          resolve(true);
        }
      }, 1000); // 1 segundo por frase
    });

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const fetchPromise = fetch('/api/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'x-timezone': timeZone },
        body: JSON.stringify({ text: transcript }),
      }).catch(err => { throw err; });

      // Espera tanto a animação terminar (mínimo de 5 segundos) quanto o servidor responder
      const [_, response] = await Promise.all([displayPhrasesPromise, fetchPromise]);

      const data = await response.json();
      if (response.ok) {
        setStatus(`✅ Salvo: ${data.event?.amountBRL} em ${data.event?.description}`);
        statusTimeoutRef.current = setTimeout(() => {
          const total = data.monthlyTotalBRL || '0,00';
          setStatus(`Este mês você já gastou R$ ${total}\n${getRandomFunnyPhrase(userName)}`);
        }, 2000);
      } else {
        setStatus(`❌ Erro: ${data.error || response.statusText}`);
      }
    } catch (error: any) {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setStatus(`⚠️ Erro de rede: ${error.message}`);
    } finally {
      setTranscript('');
      statusTimeoutRef.current = setTimeout(() => {
        setStatus('Clique no microfone para começar');
      }, 12000);
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
          setStatus(`✅ Bem-vindo(a), ${data.user.name}!`);

          // Fecha o painel imediatamente após o sucesso
          setShowSettings(false);

          // Restaura a mensagem principal após um breve momento
          setTimeout(() => {
            setStatus('Clique no microfone para começar');
          }, 2500);
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

  const executeDownload = (from: string, to: string) => {
    const url = `/api/export.csv?key=${apiKey}&from=${from}&to=${to}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos-${from}-ate-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAction = async () => {
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

    if (exportMode === 'custom' && from > to) {
      alert('A data de início deve ser anterior ou igual à data de fim.');
      return;
    }

    if (analyzeBeforeExport) {
      setIsAnalyzing(true);
      setShowSettings(false); // Esconde painel de config pra focar no modal
      setAnalyzeBeforeExport(false); // Reseta para falso para que na próxima vez esteja desmarcado

      const loadingPhrases = [
        "🧐 Reunindo os comprovantes...",
        "🧮 Fazendo as contas...",
        `💡 Gente, como você gasta ${userName ? userName : ''}...`,
        `💸 O Gastão tá chocado ${userName ? userName : ''} com tanta compra...`,
        "🔎 Procurando padrões...",
        "📝 Escrevendo o relatório..."
      ];

      let phraseIndex = 0;
      setAnalysisResult(loadingPhrases[0]);

      const phraseInterval = setInterval(() => {
        phraseIndex++;
        if (phraseIndex < loadingPhrases.length) {
          setAnalysisResult(loadingPhrases[phraseIndex]);
        }
      }, 2000);
      try {
        const response = await fetch(`/api/analyze?key=${apiKey}&from=${from}&to=${to}`);

        if (!response.ok) {
          clearInterval(phraseInterval);
          const data = await response.json().catch(() => ({}));
          alert(`Erro na análise: ${data.error || 'Erro desconhecido'}`);
          setAnalysisResult(null);
          setIsAnalyzing(false);
          return;
        }

        clearInterval(phraseInterval);

        // Handling the streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          setAnalysisResult(''); // Limpa as frases e prepara para o stream
          let done = false;
          let fullText = '';
          let displayedText = '';
          let isError = false;

          // Efeito "Máquina de Escrever" do ChatGPT
          const typeInterval = setInterval(() => {
            if (isError) {
              clearInterval(typeInterval);
              return;
            }
            if (displayedText.length < fullText.length) {
              const diff = fullText.length - displayedText.length;
              const charsToAdd = diff > 40 ? 4 : (diff > 15 ? 2 : 1);
              displayedText += fullText.slice(displayedText.length, displayedText.length + charsToAdd);
              setAnalysisResult(displayedText + ' ▋'); // Cursor pulsante
            } else if (done && displayedText.length === fullText.length) {
              setAnalysisResult(displayedText); // Remove o cursor
              clearInterval(typeInterval);
            }
          }, 20);

          try {
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) {
                fullText += decoder.decode(value, { stream: true });
              }
            }
          } catch (e) {
            isError = true;
            throw e;
          }
        } else {
          // Fallback just in case stream is not available
          const text = await response.text();
          setAnalysisResult(text);
        }

      } catch (err) {
        clearInterval(phraseInterval);
        alert('Erro ao se comunicar com a IA para análise.');
        setAnalysisResult(null);
      } finally {
        setIsAnalyzing(false);
      }

      // O CSV será baixado via botão no modal gerado pelo analysisResult
      setCustomFrom(from);
      setCustomTo(to);
    } else {
      executeDownload(from, to);
    }
  };

  const formatAnalysisText = (text: string | null) => {
    if (!text) return null;

    // Separa pelo marcador de negrito **
    const parts = text.split(/(\*\*.*?\*\*)/);

    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={j} style={{ color: '#fff', fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
  };

  return (
    <Container>
      <MoneyRain count={50} />

      <Header>
        <div className={css({ display: 'flex', flexDirection: 'column', gap: '0.2rem' })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '0.6rem' })}>
            <img src="/logo.svg" alt="Gast.ai Logo" className={css({ width: '32px', height: '32px' })} />
            <h1
              className={css({
                fontSize: '1.6rem',
                color: '#fff',
                fontWeight: '900',
                margin: 0,
                letterSpacing: '-0.05em'
              })}
            >
              Gast.ai
            </h1>
          </div>
          {userName && (
            <p
              className={css({
                fontSize: '1.1rem',
                color: '#fff',
                fontWeight: 'bold',
                margin: 0,
              })}
            >
              Bem-vindo, {userName}!
            </p>
          )}
        </div>
        <button
          ref={settingsButtonRef}
          onClick={() => setShowSettings(!showSettings)}
          className={css({
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
          })}
          aria-label="Configurações"
        >
          <SettingsIcon />
        </button>
      </Header>

      {showSettings && (
        <div ref={settingsPanelRef} className={css({ animation: 'slideDown 0.3s ease-out' })}>
          <SettingsPanel>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configurações</h2>
              <button
                onClick={() => setShowSettings(false)}
                className={css({
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '5px',
                })}
                aria-label="Fechar"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <label
              htmlFor="apiKey"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
              }}
            >
              Senha:
            </label>
            <div className={css({ position: 'relative', width: '100%' })}>
              <TextInput
                type={isPasswordVisible ? 'text' : 'password'}
                id="apiKey"
                value={isPasswordPreFilled ? '' : apiKey}
                onChange={(e) => {
                  setIsPasswordPreFilled(false);
                  handleApiKeyChange(e);
                }}
                placeholder={
                  isPasswordPreFilled
                    ? 'Senha já configurada. Digite para alterar.'
                    : 'Sua senha secreta'
                }
              />
              <button
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className={css({
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                })}
                aria-label={isPasswordVisible ? 'Esconder senha' : 'Mostrar senha'}
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <hr
              style={{ borderColor: '#444', margin: '1.5rem 0 1rem 0' }}
            />

            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
              }}
            >
              Exportar dados:
            </label>

            <div
              style={{
                display: 'flex',
                marginBottom: '1rem',
                backgroundColor: '#333',
                borderRadius: '8px',
                padding: '0.2rem',
              }}
            >
              <button
                onClick={() => setExportMode('current')}
                className={css({
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor:
                    exportMode === 'current' ? '#007aff' : 'transparent',
                  color: exportMode === 'current' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                })}
              >
                Mês Atual
              </button>
              <button
                onClick={() => setExportMode('previous')}
                className={css({
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor:
                    exportMode === 'previous' ? '#007aff' : 'transparent',
                  color: exportMode === 'previous' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                })}
              >
                Mês Anterior
              </button>
              <button
                onClick={() => setExportMode('custom')}
                className={css({
                  flex: 1,
                  padding: '0.6rem',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor:
                    exportMode === 'custom' ? '#007aff' : 'transparent',
                  color: exportMode === 'custom' ? 'white' : '#aaa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                })}
              >
                Personalizado
              </button>
            </div>

            {exportMode === 'custom' && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  alignItems: 'center',
                }}
              >
                <SelectInput
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                >
                  {last24Months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </SelectInput>
                <span style={{ color: '#888' }}>até</span>
                <SelectInput
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                >
                  {last24Months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </SelectInput>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="checkbox"
                id="analyzeCheckbox"
                checked={analyzeBeforeExport}
                onChange={(e) => setAnalyzeBeforeExport(e.target.checked)}
                style={{ width: '32px', height: '32px', cursor: 'pointer' }}
              />
              <label htmlFor="analyzeCheckbox" style={{ cursor: 'pointer', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: '500', width: '100%', justifyContent: 'space-between' }}>
                <span>Quer ver uma análise? O Gastão pode ajudar!</span>
                <div style={{
                  backgroundColor: 'rgba(0, 122, 255, 0.15)',
                  padding: '6px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 122, 255, 0.3)',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#007aff' }}>
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                    <path d="M20 3v4"></path>
                    <path d="M22 5h-4"></path>
                    <path d="M4 17v2"></path>
                    <path d="M5 18H3"></path>
                  </svg>
                </div>
              </label>                                                </div>            <ActionButton onClick={handleExportAction} width="100%" disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={css({ animation: 'spin 2s linear infinite' })}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                  Analisando...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Baixar CSV{' '}
                  {exportMode === 'custom'
                    ? '(Período)'
                    : exportMode === 'previous'
                      ? '(Mês Anterior)'
                      : '(Mês Atual)'}
                </>
              )}
            </ActionButton>
          </SettingsPanel>
        </div>
      )}

      <MainContent pushDown={showSettings}>
        {analysisResult ? (
          <div className={css({
            padding: '1.5rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            color: '#fff',
            marginBottom: '2rem',
            animation: 'fadeIn 0.5s ease-out',
            textAlign: 'left',
            width: '85%',         // 85% em telas menores
            maxWidth: '768px',    // Máximo de 768px em desktop
            margin: '0 auto 2rem auto', // Centraliza horizontalmente
            overflowX: 'hidden',
            minHeight: '300px',
            maxHeight: '70vh',    // Aumentado para 70% da altura da tela para aproveitar melhor o espaço
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'   // Para posicionar o "X"
          })}>
            <button
              onClick={() => setAnalysisResult(null)}
              className={css({
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '5px',
                _hover: { color: '#fff' }
              })}
              aria-label="Fechar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#007aff', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '2rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
                Análise dos Seus Gastos
              </h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.05rem', color: '#e0e0e0' }}>
                {formatAnalysisText(analysisResult)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-start' }}>
              <ActionButton onClick={() => { executeDownload(customFrom, customTo); setAnalysisResult(null); }} variant="success">
                Baixar CSV
              </ActionButton>
              <ActionButton onClick={() => setAnalysisResult(null)} variant="secondary">
                Fechar
              </ActionButton>
            </div>
          </div>
        ) : (
          <>
            <p
              className={css({
                fontSize: '1.4rem',
                fontWeight: '400',
                minHeight: '3em',
                color: '#888',
                padding: '0 1rem',
                lineHeight: '1.4',
              })}
            >
              {transcript}
            </p>
            <p
              key={status} // O React recria o elemento quando a key muda, disparando a animação
              className={css({
                marginTop: '3rem',
                marginBottom: '2rem',
                fontSize: '1.8rem',
                minHeight: '2em',
                color: '#ffffff',
                fontWeight: 'bold',
                animation: 'fadeIn 0.5s ease-out',
                whiteSpace: 'pre-line',
              })}
            >
              {status}
            </p>

            {!awaitingConfirmation ? (
              <MicButton
                onClick={handleMicButtonClick}
                disabled={!recognitionRef.current || isRecording}
                recording={isRecording}
              >
                <MicIcon recording={isRecording} />
              </MicButton>
            ) : (
              <div
                className={css({
                  marginTop: '1.5rem',
                  display: 'flex',
                  gap: '1rem',
                })}
              >
                <ActionButton onClick={sendGastoToApi} variant="success">
                  Confirmar
                </ActionButton>
                <ActionButton onClick={handleCancel} variant="secondary">
                  Tentar Novamente
                </ActionButton>
              </div>
            )}
          </>
        )}
      </MainContent>

      <footer style={{ height: '50px' }}></footer>
    </Container>
  );
}
