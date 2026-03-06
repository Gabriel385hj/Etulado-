import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Gamepad2, Monitor, Volume2, Settings, Library, Plus, Play, X, Cpu,
  Smartphone, HardDrive, Menu, Languages, Layers, Keyboard,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as jsnes from 'jsnes';
import { WasmBoy } from 'wasmboy';

type Tab = 'library' | 'graphics' | 'audio' | 'controls' | 'system';
type Language = 'en' | 'pt-br' | 'es' | 'fr' | 'jp';

interface Game {
  id: string;
  name: string;
  size: string;
  dateAdded: string;
  type: 'GBA' | 'NES' | 'GBC';
  data?: Uint8Array;
}

const translations = {
  en: {
    library: 'Games Library', graphics: 'Graphics', audio: 'Audio', controls: 'Controls', system: 'System',
    install: 'Install ROM', noGames: 'No games installed', noGamesSub: 'Click "Install ROM" to add a game.',
    renderer: 'Renderer API', gpuDriver: 'GPU Driver', maliNote: 'Optimized for Mali GPUs',
    resolution: 'Resolution', vsync: 'VSync', vsyncSub: 'Sync framerate with display',
    audioBackend: 'Audio Backend', masterVolume: 'Volume', inputDevice: 'Input Device',
    mapButtons: 'Map Buttons', architecture: 'Architecture', language: 'Language',
    clearCache: 'Clear Cache', booting: 'Booting', loading: 'Loading ROM...',
    simulatedNote: 'NES and GBC are functional. GBA is currently in compatibility mode.',
    driverActive: 'Driver Active', maliOptimized: 'Mali Optimized', kbConfig: 'Keyboard Config',
    pressKey: 'Press a key for', save: 'Save', cancel: 'Cancel', audioEnabled: 'Enable Audio',
    onScreenControls: 'On-Screen Controls', onScreenControlsSub: 'Display virtual buttons while playing'
  },
  'pt-br': {
    library: 'Biblioteca', graphics: 'Gráficos', audio: 'Áudio', controls: 'Controles', system: 'Sistema',
    install: 'Instalar ROM', noGames: 'Nenhum jogo', noGamesSub: 'Clique em "Instalar ROM" para adicionar.',
    renderer: 'API de Renderização', gpuDriver: 'Driver de GPU', maliNote: 'Otimizado para GPUs Mali',
    resolution: 'Resolução', vsync: 'Sincronização Vertical', vsyncSub: 'Sincronizar com a tela',
    audioBackend: 'Backend de Áudio', masterVolume: 'Volume', inputDevice: 'Dispositivo',
    mapButtons: 'Mapear Botões', architecture: 'Arquitetura', language: 'Idioma',
    clearCache: 'Limpar Cache', booting: 'Iniciando', loading: 'Carregando ROM...',
    simulatedNote: 'NES e GBC estão funcionais. GBA está em modo de compatibilidade.',
    driverActive: 'Driver Ativo', maliOptimized: 'Mali Otimizado', kbConfig: 'Config. Teclado',
    pressKey: 'Pressione uma tecla para', save: 'Salvar', cancel: 'Cancelar', audioEnabled: 'Ativar Áudio',
    onScreenControls: 'Controles na Tela', onScreenControlsSub: 'Exibir botões virtuais ao jogar'
  },
  es: {
    library: 'Biblioteca', graphics: 'Gráficos', audio: 'Audio', controls: 'Controles', system: 'Sistema',
    install: 'Instalar ROM', noGames: 'Sin juegos', noGamesSub: 'Haz clic en "Instalar ROM".',
    renderer: 'API de Renderizado', gpuDriver: 'Controlador GPU', maliNote: 'Optimizado para Mali',
    resolution: 'Resolución', vsync: 'VSync', vsyncSub: 'Sincronizar con pantalla',
    audioBackend: 'Backend de Audio', masterVolume: 'Volumen', inputDevice: 'Dispositivo',
    mapButtons: 'Mapear Botones', architecture: 'Arquitectura', language: 'Idioma',
    clearCache: 'Limpar Cache', booting: 'Iniciando', loading: 'Cargando ROM...',
    simulatedNote: 'NES y GBC son funcionales. GBA está en modo de compatibilidad.',
    driverActive: 'Driver Activo', maliOptimized: 'Mali Optimizado', kbConfig: 'Config. Teclado',
    pressKey: 'Presiona una tecla para', save: 'Guardar', cancel: 'Cancelar', audioEnabled: 'Activar Audio',
    onScreenControls: 'Controles en Pantalla', onScreenControlsSub: 'Mostrar botones virtuales al jugar'
  },
  fr: {
    library: 'Bibliothèque', graphics: 'Graphismes', audio: 'Audio', controls: 'Controles', system: 'Système',
    install: 'Installer ROM', noGames: 'Aucun jeu', noGamesSub: 'Cliquez sur "Installer ROM".',
    renderer: 'API de Rendu', gpuDriver: 'Pilote GPU', maliNote: 'Optimisé pour Mali',
    resolution: 'Résolution', vsync: 'VSync', vsyncSub: 'Synchroniser avec l\'écran',
    audioBackend: 'Backend Audio', masterVolume: 'Volume', inputDevice: 'Dispositif',
    mapButtons: 'Mapper Boutons', architecture: 'Architecture', language: 'Langue',
    clearCache: 'Vider le Cache', booting: 'Démarrage', loading: 'Chargement ROM...',
    simulatedNote: 'NES et GBC sont fonctionnels. GBA est en mode compatibilité.',
    driverActive: 'Pilote Actif', maliOptimized: 'Mali Optimisé', kbConfig: 'Config. Clavier',
    pressKey: 'Appuyez sur une touche pour', save: 'Sauvegardar', cancel: 'Annuler', audioEnabled: 'Activer l\'audio',
    onScreenControls: 'Contrôles à l\'écran', onScreenControlsSub: 'Afficher les boutons virtuels en jouant'
  },
  jp: {
    library: 'ライブラリ', graphics: 'グラフィック', audio: 'オーディオ', controls: 'コントロール', system: 'システム',
    install: 'ROMをインストール', noGames: 'ゲームがありません', noGamesSub: 'ROMをインストールしてください。',
    renderer: 'レンダラーAPI', gpuDriver: 'GPUドライバー', maliNote: 'Mali GPUに最適化',
    resolution: '解像度', vsync: '垂直同期', vsyncSub: '画面と同期',
    audioBackend: 'オーディオ', masterVolume: '音量', inputDevice: 'デバイス',
    mapButtons: 'ボタン配置', architecture: 'アーキテクチャ', language: '言語',
    clearCache: 'キャッシュクリア', booting: '起動中', loading: '読み込み中...',
    simulatedNote: 'NESとGBCは動作します。GBAは互換モードです。',
    driverActive: 'ドライバー有効', maliOptimized: 'Mali最適化', kbConfig: 'キーボード設定',
    pressKey: 'キーを押してください:', save: '保存', cancel: 'キャンセル', audioEnabled: 'オーディオを有効にする',
    onScreenControls: '画面上のコントロール', onScreenControlsSub: 'プレイ中に仮想ボタンを表示する'
  }
};

const DEFAULT_KEYS = {
  UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight',
  A: 'z', B: 'x', SELECT: 'Shift', START: 'Enter'
};

const NES_SCREEN_WIDTH = 256;
const NES_SCREEN_HEIGHT = 240;

const navItems: { id: Tab; label: string; icon: any }[] = [
  { id: 'library', label: 'library', icon: Library },
  { id: 'graphics', label: 'graphics', icon: Monitor },
  { id: 'audio', label: 'audio', icon: Volume2 },
  { id: 'controls', label: 'controls', icon: Gamepad2 },
  { id: 'system', label: 'system', icon: Cpu },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [lang, setLang] = useState<Language>('pt-br');
  const [games, setGames] = useState<Game[]>([]);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [isBooting, setIsBooting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [kbConfig, setKbConfig] = useState(DEFAULT_KEYS);
  const [mappingKey, setMappingKey] = useState<keyof typeof DEFAULT_KEYS | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showOnScreenControls, setShowOnScreenControls] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nesRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang] || translations.en;

  // Update nav labels based on translation
  const localizedNavItems = navItems.map(item => ({
    ...item,
    label: t[item.id as keyof typeof t] || item.label
  }));

  const handlePlay = (game: Game) => {
    setPlayingGame(game);
    setIsBooting(true);
    setTimeout(() => setIsBooting(false), 1500);
  };

  const handleInstallROM = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: Game['type'] = 'GBA';
      if (ext === 'nes') type = 'NES';
      if (ext === 'gbc') type = 'GBC';

      const newGame: Game = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name.replace(/\.(gba|nes|gbc)$/i, ''),
        size: (file.size / 1024).toFixed(2) + ' KB',
        dateAdded: new Date().toLocaleDateString(),
        type,
        data: new Uint8Array(buffer)
      };
      setGames([...games, newGame]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const audioEnabledRef = useRef(audioEnabled);
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const startNes = useCallback((gameData: Uint8Array) => {
    if (!canvasRef.current) return;

    // Validate iNES header
    if (gameData[0] !== 0x4E || gameData[1] !== 0x45 || gameData[2] !== 0x53 || gameData[3] !== 0x1A) {
      console.error("Invalid NES ROM: Missing iNES header");
      alert("Invalid NES ROM: Missing iNES header. Please ensure you are loading a valid .nes file.");
      setPlayingGame(null);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(NES_SCREEN_WIDTH, NES_SCREEN_HEIGHT);
    const buffer = new Uint32Array(imageData.data.buffer);

    const nes = new jsnes.NES({
      onFrame: (frameBuffer: any) => {
        for (let i = 0; i < 256 * 240; i++) buffer[i] = 0xFF000000 | frameBuffer[i];
        ctx.putImageData(imageData, 0, 0);
      },
      onAudioSample: (left: number, right: number) => {
        if (!audioEnabledRef.current) return;
        // Audio handling will be set up below, this callback just pushes to the buffer
        // defined in the closure if we move the setup here.
        // However, since we need the buffer variables, we should define them before.
      }
    });

    // Audio Setup
    let audioBuffer: Float32Array;
    let writeIndex = 0;
    let readIndex = 0;
    const BUFFER_SIZE = 8192;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const scriptNode = audioCtx.createScriptProcessor(1024, 0, 2);
      audioBuffer = new Float32Array(BUFFER_SIZE);
      
      scriptNode.onaudioprocess = (e) => {
        const outputLeft = e.outputBuffer.getChannelData(0);
        const outputRight = e.outputBuffer.getChannelData(1);
        
        for (let i = 0; i < 1024; i++) {
          if (readIndex !== writeIndex) {
            const val = audioBuffer[readIndex];
            outputLeft[i] = val;
            outputRight[i] = val;
            readIndex = (readIndex + 1) % BUFFER_SIZE;
          } else {
            outputLeft[i] = 0;
            outputRight[i] = 0;
          }
        }
      };
      
      scriptNode.connect(audioCtx.destination);
      
      // Override the onAudioSample to actually push data
      nes.opts.onAudioSample = (left: number, right: number) => {
        if (!audioEnabledRef.current) return;
        audioBuffer[writeIndex] = left; // Using left channel for mono, or mix: (left + right) * 0.5
        writeIndex = (writeIndex + 1) % BUFFER_SIZE;
        // If we hit the read pointer, bump it (overwrite old data)
        if (writeIndex === readIndex) {
            readIndex = (readIndex + 1) % BUFFER_SIZE;
        }
      };
    }

    // Use a more robust binary string conversion
    // We use a loop to avoid stack overflow on large ROMs and encoding issues
    let romData = "";
    for (let i = 0; i < gameData.length; i++) {
      romData += String.fromCharCode(gameData[i]);
    }
    
    try {
      nes.loadROM(romData);
      nesRef.current = nes;
    } catch (err) {
      console.error("NES Load Error:", err);
      alert("Failed to load NES ROM. The file might be corrupted or unsupported.");
      setPlayingGame(null);
      return;
    }

    const frame = () => {
      // Only continue if this specific NES instance is still the active one
      if (nesRef.current === nes) {
        try {
          nes.frame();
          requestAnimationFrame(frame);
        } catch (err) {
          console.error("NES Execution Error:", err);
          if (nesRef.current === nes) {
            nesRef.current = null;
            setPlayingGame(null);
          }
        }
      }
    };
    requestAnimationFrame(frame);
  }, []); // No longer depends on audioEnabled

  const startGbc = useCallback(async (gameData: Uint8Array) => {
    if (!canvasRef.current) return;
    try {
      await WasmBoy.setCanvas(canvasRef.current);
      await WasmBoy.loadROM(gameData);
      if (audioEnabledRef.current) {
        await WasmBoy.enableAudio();
      } else {
        await WasmBoy.disableAudio();
      }
      await WasmBoy.play();
    } catch (err) {
      console.error("WasmBoy error:", err);
      alert("Failed to load GBC ROM. The file might be corrupted or unsupported.");
      setPlayingGame(null);
    }
  }, []);

  useEffect(() => {
    if (!isBooting && playingGame?.data) {
      if (playingGame.type === 'NES') {
        startNes(playingGame.data);
      } else if (playingGame.type === 'GBC') {
        startGbc(playingGame.data);
      }
    }
    return () => { 
      nesRef.current = null; 
      if (playingGame?.type === 'GBC') {
        WasmBoy.pause();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [playingGame, isBooting, startNes, startGbc]);

  const handleKeyDown = useCallback((e: KeyboardEvent | { key: string }) => {
    if (mappingKey && 'key' in e) {
      setKbConfig(prev => ({ ...prev, [mappingKey]: e.key }));
      setMappingKey(null);
      return;
    }
    
    const keyMap: any = {
      [kbConfig.UP]: jsnes.Controller.BUTTON_UP,
      [kbConfig.DOWN]: jsnes.Controller.BUTTON_DOWN,
      [kbConfig.LEFT]: jsnes.Controller.BUTTON_LEFT,
      [kbConfig.RIGHT]: jsnes.Controller.BUTTON_RIGHT,
      [kbConfig.A]: jsnes.Controller.BUTTON_A,
      [kbConfig.B]: jsnes.Controller.BUTTON_B,
      [kbConfig.SELECT]: jsnes.Controller.BUTTON_SELECT,
      [kbConfig.START]: jsnes.Controller.BUTTON_START,
    };

    const mappedBtn = keyMap[e.key];
    if (mappedBtn !== undefined) {
      if (nesRef.current) nesRef.current.buttonDown(1, mappedBtn);
      if (playingGame?.type === 'GBC') {
        const wasmBtnMap: any = {
          [jsnes.Controller.BUTTON_UP]: 'UP',
          [jsnes.Controller.BUTTON_DOWN]: 'DOWN',
          [jsnes.Controller.BUTTON_LEFT]: 'LEFT',
          [jsnes.Controller.BUTTON_RIGHT]: 'RIGHT',
          [jsnes.Controller.BUTTON_A]: 'A',
          [jsnes.Controller.BUTTON_B]: 'B',
          [jsnes.Controller.BUTTON_SELECT]: 'SELECT',
          [jsnes.Controller.BUTTON_START]: 'START',
        };
        WasmBoy.setJoypadState({ [wasmBtnMap[mappedBtn]]: true });
      }
    }
  }, [kbConfig, mappingKey, playingGame]);

  const handleKeyUp = useCallback((e: KeyboardEvent | { key: string }) => {
    const keyMap: any = {
      [kbConfig.UP]: jsnes.Controller.BUTTON_UP,
      [kbConfig.DOWN]: jsnes.Controller.BUTTON_DOWN,
      [kbConfig.LEFT]: jsnes.Controller.BUTTON_LEFT,
      [kbConfig.RIGHT]: jsnes.Controller.BUTTON_RIGHT,
      [kbConfig.A]: jsnes.Controller.BUTTON_A,
      [kbConfig.B]: jsnes.Controller.BUTTON_B,
      [kbConfig.SELECT]: jsnes.Controller.BUTTON_SELECT,
      [kbConfig.START]: jsnes.Controller.BUTTON_START,
    };

    const mappedBtn = keyMap[e.key];
    if (mappedBtn !== undefined) {
      if (nesRef.current) nesRef.current.buttonUp(1, mappedBtn);
      if (playingGame?.type === 'GBC') {
        const wasmBtnMap: any = {
          [jsnes.Controller.BUTTON_UP]: 'UP',
          [jsnes.Controller.BUTTON_DOWN]: 'DOWN',
          [jsnes.Controller.BUTTON_LEFT]: 'LEFT',
          [jsnes.Controller.BUTTON_RIGHT]: 'RIGHT',
          [jsnes.Controller.BUTTON_A]: 'A',
          [jsnes.Controller.BUTTON_B]: 'B',
          [jsnes.Controller.BUTTON_SELECT]: 'SELECT',
          [jsnes.Controller.BUTTON_START]: 'START',
        };
        WasmBoy.setJoypadState({ [wasmBtnMap[mappedBtn]]: false });
      }
    }
  }, [kbConfig, playingGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => handleKeyUp(e);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 z-20">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-lg">Retro<span className="text-indigo-500">Web</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-6 h-6" /></button>
      </div>

      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-10 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-zinc-800/50">
          <Layers className="w-8 h-8 text-indigo-500" />
          <span className="font-bold text-xl">Retro<span className="text-indigo-500">Web</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {localizedNavItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === item.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-800/50">
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            <div className="text-xs"><p className="text-zinc-300 font-medium">Mali GPU Driver</p><p className="text-zinc-500">{t.maliOptimized}</p></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto bg-zinc-950 p-4 md:p-8">
        {activeTab === 'library' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3"><Library className="text-indigo-500" /> {t.library}</h2>
              <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md flex items-center gap-2"><Plus className="w-5 h-5" /> {t.install}</button>
              <input type="file" accept=".gba,.nes,.gbc" ref={fileInputRef} onChange={handleInstallROM} className="hidden" />
            </div>
            {games.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500">
                <HardDrive className="w-12 h-12 mb-4 opacity-30" /> <p>{t.noGames}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {games.map(game => (
                  <div key={game.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                    <div className="h-40 bg-zinc-950 flex items-center justify-center relative">
                      <div className="absolute top-2 right-2 bg-indigo-500 text-[10px] font-bold px-2 py-0.5 rounded">{game.type}</div>
                      <Gamepad2 className="w-16 h-16 text-zinc-800 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handlePlay(game)} className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center"><Play className="ml-1" /></button>
                      </div>
                    </div>
                    <div className="p-4"><h3 className="font-bold truncate">{game.name}</h3><div className="flex justify-between mt-2 text-xs text-zinc-500"><span>{game.size}</span><span>{game.dateAdded}</span></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'graphics' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-zinc-800 pb-4"><Monitor className="text-indigo-500" /> {t.graphics}</h2>
            <div className="space-y-4">
              <div><label className="text-sm text-zinc-400">{t.renderer}</label><select className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg"><option>Vulkan (Mali Optimized)</option><option>OpenGL ES 3.0</option></select></div>
              <div><label className="text-sm text-zinc-400">{t.gpuDriver}</label><select className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg"><option>System Default (Mali-Gxx)</option><option>Mali Optimized</option></select></div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-zinc-800 pb-4"><Volume2 className="text-indigo-500" /> {t.audio}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <div>
                  <p className="font-medium">{t.audioEnabled}</p>
                  <p className="text-xs text-zinc-500">Enable or disable emulator sound</p>
                </div>
                <button 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${audioEnabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${audioEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div>
                <label className="text-sm text-zinc-400">{t.masterVolume}</label>
                <input type="range" className="w-full accent-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-zinc-800 pb-4"><Gamepad2 className="text-indigo-500" /> {t.controls}</h2>
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.onScreenControls}</p>
                  <p className="text-xs text-zinc-500">{t.onScreenControlsSub}</p>
                </div>
                <button 
                  onClick={() => setShowOnScreenControls(!showOnScreenControls)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${showOnScreenControls ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showOnScreenControls ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><Keyboard className="w-5 h-5" /> {t.kbConfig}</h3>
                <button 
                  onClick={() => setKbConfig(DEFAULT_KEYS)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(kbConfig).map(([btn, key]) => (
                  <div key={btn} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <span className="text-sm font-medium text-zinc-400">{btn}</span>
                    <button onClick={() => setMappingKey(btn as any)} className={`px-3 py-1 rounded text-xs font-mono border ${mappingKey === btn ? 'border-indigo-500 text-indigo-400 animate-pulse' : 'border-zinc-700 text-zinc-300'}`}>
                      {mappingKey === btn ? '...' : key}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold flex items-center gap-3 border-b border-zinc-800 pb-4"><Cpu className="text-indigo-500" /> {t.system}</h2>
            <div>
              <label className="text-sm text-zinc-400 flex items-center gap-2"><Languages className="w-4 h-4" /> {t.language}</label>
              <select value={lang} onChange={(e) => setLang(e.target.value as Language)} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg mt-2">
                <option value="pt-br">Português (Brasil)</option><option value="en">English (US)</option><option value="es">Español</option><option value="fr">Français</option><option value="jp">日本語</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Game Player Overlay */}
      {playingGame && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
          <div className="p-4 flex justify-between items-center bg-black/80">
            <div className="text-xs opacity-50 flex gap-4"><span>RetroWeb Core</span></div>
            <button onClick={() => setPlayingGame(null)} className="p-2 bg-zinc-900 hover:bg-red-500 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 flex items-center justify-center bg-zinc-950 relative overflow-hidden">
            {isBooting ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold">{t.booting} {playingGame.name}...</h2>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {playingGame.type === 'NES' || playingGame.type === 'GBC' ? (
                  <canvas ref={canvasRef} width={playingGame.type === 'NES' ? NES_SCREEN_WIDTH : 160} height={playingGame.type === 'NES' ? NES_SCREEN_HEIGHT : 144} className="max-w-full max-h-[80vh] image-render-pixel shadow-2xl border-4 border-zinc-800" style={{ imageRendering: 'pixelated' }} />
                ) : (
                  <div className="text-center max-w-md p-8 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <Gamepad2 className="w-20 h-20 text-indigo-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4">{playingGame.name}</h1>
                    <p className="text-zinc-400 text-sm">{t.simulatedNote}</p>
                  </div>
                )}
                
                {/* On-Screen Controls */}
                {showOnScreenControls && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* D-PAD */}
                    <div className="absolute bottom-12 left-8 w-32 h-32 pointer-events-auto flex items-center justify-center">
                      <div className="grid grid-cols-3 grid-rows-3 gap-1">
                        <div />
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.UP } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.UP } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.UP } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.UP } as any); }}
                          className="w-10 h-10 bg-zinc-800/80 rounded active:bg-indigo-500 flex items-center justify-center border border-white/10"
                        >
                          <ChevronUp className="w-6 h-6" />
                        </button>
                        <div />
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.LEFT } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.LEFT } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.LEFT } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.LEFT } as any); }}
                          className="w-10 h-10 bg-zinc-800/80 rounded active:bg-indigo-500 flex items-center justify-center border border-white/10"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="w-10 h-10 bg-zinc-900/50" />
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.RIGHT } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.RIGHT } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.RIGHT } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.RIGHT } as any); }}
                          className="w-10 h-10 bg-zinc-800/80 rounded active:bg-indigo-500 flex items-center justify-center border border-white/10"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div />
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.DOWN } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.DOWN } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.DOWN } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.DOWN } as any); }}
                          className="w-10 h-10 bg-zinc-800/80 rounded active:bg-indigo-500 flex items-center justify-center border border-white/10"
                        >
                          <ChevronDown className="w-6 h-6" />
                        </button>
                        <div />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-12 right-8 flex gap-6 pointer-events-auto">
                      <div className="flex flex-col gap-4">
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.B } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.B } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.B } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.B } as any); }}
                          className="w-16 h-16 bg-red-600/80 rounded-full active:bg-red-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 shadow-lg"
                        >
                          B
                        </button>
                        <div className="h-4" />
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="h-4" />
                        <button 
                          onMouseDown={() => handleKeyDown({ key: kbConfig.A } as any)}
                          onMouseUp={() => handleKeyUp({ key: kbConfig.A } as any)}
                          onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.A } as any); }}
                          onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.A } as any); }}
                          className="w-16 h-16 bg-red-600/80 rounded-full active:bg-red-500 flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 shadow-lg"
                        >
                          A
                        </button>
                      </div>
                    </div>

                    {/* Start/Select */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-auto">
                      <button 
                        onMouseDown={() => handleKeyDown({ key: kbConfig.SELECT } as any)}
                        onMouseUp={() => handleKeyUp({ key: kbConfig.SELECT } as any)}
                        onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.SELECT } as any); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.SELECT } as any); }}
                        className="px-4 py-1 bg-zinc-800/80 rounded-full active:bg-zinc-700 text-[10px] font-bold text-zinc-400 border border-white/10"
                      >
                        SELECT
                      </button>
                      <button 
                        onMouseDown={() => handleKeyDown({ key: kbConfig.START } as any)}
                        onMouseUp={() => handleKeyUp({ key: kbConfig.START } as any)}
                        onTouchStart={(e) => { e.preventDefault(); handleKeyDown({ key: kbConfig.START } as any); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleKeyUp({ key: kbConfig.START } as any); }}
                        className="px-4 py-1 bg-zinc-800/80 rounded-full active:bg-zinc-700 text-[10px] font-bold text-zinc-400 border border-white/10"
                      >
                        START
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
