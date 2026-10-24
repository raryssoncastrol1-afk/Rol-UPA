import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { UpaLogo } from './UpaLogo';

interface LoginScreenProps {
  onAdminLogin: (password: string) => Promise<boolean> | boolean;
  onVoterLogin: (pin: string) => Promise<{ success: boolean; error?: string }> | void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onAdminLogin, 
  onVoterLogin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'voter_pin' | 'admin_login'>('voter_pin');
  const [pin, setPin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  // Efeito Elástico Invertido ("Puxar"): o card segue a puxada do usuário com resistência física
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Não captura se o clique/toque for em campos de texto ou botões interativos
    const target = e.target as HTMLElement;
    if (target.closest('input, button, a')) return;

    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    const card = cardRef.current;
    if (card) {
      card.style.transition = 'none'; // Resposta tátil imediata enquanto puxa
      try {
        card.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const card = cardRef.current;
    if (!card) return;

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      // Resistência elástica suave (amortecimento logarítmico para não sair da tela)
      const pullX = deltaX * 0.22;
      const pullY = deltaY * 0.22;

      // Inversão 3D: a borda puxada vem para a frente (rotateX / rotateY seguem o vetor da puxada)
      const rotY = Math.min(Math.max(pullX * 0.5, -14), 14);
      const rotX = Math.min(Math.max(-pullY * 0.5, -14), 14);

      card.style.transform = `perspective(1000px) translate3d(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px, 0) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const card = cardRef.current;
    if (!card) return;

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    try {
      card.releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Efeito elástico elétrico que retorna o card exatamente ao centro
    card.style.transition = 'transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    card.style.transform = 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Erro ao alternar modo tela cheia:', err);
    }
  }, []);

  // Background WebGL Dot Matrix Shader
  useEffect(() => {
    let active = true;
    let renderer: any, scene: any, camera: any, material: any, geometry: any, animId: number;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) },
        u_opacities: { value: [0.25, 0.25, 0.3, 0.45, 0.45, 0.5, 0.7, 0.7, 0.8, 0.95] },
        u_colors: {
          value: [
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(1, 1, 1),
          ],
        },
        u_total_size: { value: 20 },
        u_dot_size: { value: 6 },
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;
          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
            vec2 st = fragCoord.xy;
            st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
            st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

            float opacity = step(0.0, st.x) * step(0.0, st.y);
            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];
            float animation_speed_factor = 3.0;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);
            float current_timing_offset = dist_from_center * 0.01 + (random(st2) * 0.15);

            opacity *= step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        transparent: true,
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, material));

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!renderer) return;
        const pr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pr);
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * pr, window.innerHeight * pr);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    };

    if ((window as any).THREE) {
      const cleanup = initThree((window as any).THREE);
      return () => {
        active = false;
        cleanup && cleanup();
        cancelAnimationFrame(animId);
        renderer?.dispose();
        geometry?.dispose();
        material?.dispose();
      };
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = () => (window as any).THREE && initThree((window as any).THREE);
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      cancelAnimationFrame(animId);
      renderer?.dispose();
      geometry?.dispose();
      material?.dispose();
    };
  }, []);

  const handleVoterSubmitPIN = async () => {
    if (pin.trim().length < 4) {
      setErrorMsg('Seu PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await onVoterLogin(pin.trim());
      if (res && !res.success) {
        setErrorMsg(res.error || 'PIN não encontrado ou inválido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async () => {
    if (!adminPassword.trim()) {
      setErrorMsg('Digite a senha de administrador.');
      return;
    }
    const success = await onAdminLogin(adminPassword);
    if (!success) {
      setErrorMsg('Senha incorreta. Verifique e tente novamente.');
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-6 md:px-8 bg-black text-white font-sans selection:bg-white/20">
      {/* Background Animated WebGL Matrix */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full" />

      {/* Dynamic Ambient Fluid/Liquid Glow Orbs (UPA Theme) */}
      <div className="fixed w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] -top-16 -left-16 sm:-top-24 sm:-left-20 bg-[radial-gradient(circle,rgba(29,66,104,0.25)_0%,rgba(22,50,79,0.14)_50%,transparent_75%)] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="fixed w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] -bottom-16 -right-16 sm:-bottom-24 sm:-right-20 bg-[radial-gradient(circle,rgba(184,74,20,0.16)_0%,rgba(166,64,19,0.08)_50%,transparent_75%)] rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      {/* Transparent Liquid Glass Card com Puxada Elástica Invertida */}
      <div 
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative z-10 w-full max-w-[430px] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 bg-transparent backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.45),inset_0_1px_1px_0_rgba(255,255,255,0.4),inset_0_-1px_1px_0_rgba(255,255,255,0.1)] flex flex-col items-center overflow-hidden my-auto will-change-transform select-none touch-none"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Fullscreen Quick Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da Tela Cheia" : "Ficar em Tela Cheia"}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-300 hover:text-white text-[11px] font-medium backdrop-blur-md transition-all cursor-pointer"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xs:inline">Restaurar</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Tela Cheia</span>
            </>
          )}
        </button>

        {/* Prismatic edge reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />

        {/* Emblema Oficial UPA em Alta Resolução (Retina Display) */}
        <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/[0.04] border border-white/25 flex items-center justify-center p-2 mb-4 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_24px_rgba(0,0,0,0.4)]">
          <img 
            src="/upa-logo.png" 
            alt="Logotipo Oficial UPA"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Título Principal com fonte Jersey M54 */}
        <h1 
          className="relative z-10 text-3xl sm:text-4xl tracking-[0.05em] mb-1 text-white text-center drop-shadow-md"
          style={{ fontFamily: "'Jersey M54', sans-serif" }}
        >
          UPA 3ª IPBV
        </h1>

        {/* Subtítulo Institucional */}
        <p className="relative z-10 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 text-sky-400 text-center drop-shadow-sm">
          União Presbiteriana de Adolescentes
        </p>

        {/* Lema Oficial da UPA */}
        <p className="relative z-10 text-[11px] italic font-serif leading-snug mb-6 px-2 text-neutral-300 text-center drop-shadow-sm">
          “Alegres na esperança, fortes na fé, dedicados no amor, unidos no trabalho.” <span className="not-italic text-[10px] font-sans font-bold text-neutral-400">(Rm 12:12)</span>
        </p>

        {/* Mensagem de Erro com Glass Rose */}
        {errorMsg && (
          <div className="relative z-10 w-full mb-4 bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs px-3.5 py-2.5 rounded-xl text-center font-medium backdrop-blur-sm shadow-sm animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* MODO 1: Digitação do PIN de Eleitor (Padrão) */}
        {mode === 'voter_pin' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVoterSubmitPIN();
            }}
            className="relative z-10 w-full flex flex-col gap-3 text-left"
          >
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white mb-0.5">
                Identificação do Eleitor
              </h3>
              <p className="text-xs text-neutral-400">
                Informe seu PIN de 4 dígitos para receber sua cédula
              </p>
            </div>

            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="0000"
              maxLength={6}
              autoFocus
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-neutral-500 text-2xl font-mono text-center tracking-[0.8em] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] focus:border-white/50 focus:bg-white/10 transition duration-200"
            />

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition duration-200 mt-1 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_28px_rgba(255,255,255,0.5)] active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Verificando...' : 'Acessar Urna de Votação (UPA)'}
            </button>
          </form>
        )}

        {/* MODO 2: Login de Administração (Mesa Diretora) */}
        {mode === 'admin_login' && (
          <div className="relative z-10 w-full flex flex-col gap-3 text-left">
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-white mb-0.5">
                Acesso Administrativo
              </h3>
              <p className="text-xs text-neutral-400">
                Mesa Diretora e Escrutinadores
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-neutral-300">
                Senha de Acesso
              </label>
              <input 
                type="password" 
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminSubmit();
                }}
                placeholder="••••••••"
                autoFocus
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-neutral-500 text-sm outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] focus:border-white/50 focus:bg-white/10 transition duration-200"
              />
            </div>

            <button 
              type="button"
              onClick={handleAdminSubmit}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition duration-200 mt-1 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_28px_rgba(255,255,255,0.5)] active:scale-[0.98]"
            >
              Entrar na Mesa Eleitoral
            </button>

            <div className="flex justify-center items-center text-xs mt-2">
              <button 
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('voter_pin');
                }}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer hover:underline"
              >
                ← Voltar para Acesso do Eleitor (PIN)
              </button>
            </div>
          </div>
        )}

        {/* Liquid Glass Divider */}
        <div className="relative z-10 w-full flex items-center justify-center my-5">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Rodapé Institucional com Acesso Discreto */}
        <div className="relative z-10 w-full flex flex-col items-center gap-2">
          {mode === 'voter_pin' && (
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setMode('admin_login');
              }}
              className="text-xs text-sky-400/90 hover:text-sky-300 transition-colors cursor-pointer hover:underline flex items-center gap-1.5"
            >
              <span>🔒</span> Acesso da Mesa Diretora / Administração
            </button>
          )}

          <p className="text-[11px] font-medium tracking-wide text-neutral-400">
            Sessão Presidida • 3ª IPBV
          </p>
        </div>
      </div>
    </main>
  );
};
