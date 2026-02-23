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
      const fetchPromise = fetch('/api/gasto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
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

            <ActionButton onClick={downloadCsv} width="100%">
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
            </ActionButton>
          </SettingsPanel>
        </div>
      )}

      <MainContent pushDown={showSettings}>
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
      </MainContent>

      <footer style={{ height: '50px' }}></footer>
    </Container>
  );
}
