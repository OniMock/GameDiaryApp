import { useEffect, useState, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '../hooks/use-language';
import { useMemo, useRef } from 'react';
import Logo from '../assets/logo.svg?react';
import clsx from 'clsx';

const MoonSVG = ({ size = 90 }) => (
  <svg
    height={size}
    width={size}
    version="1.1"
    id="Layer_1"
    viewBox="0 0 499.6 499.6"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="translate(-59.66263,-40.603047)">
      <g transform="translate(46.431227,36.525898)">
        <ellipse style={{ fill: '#dcf9f6' }} cx="133.60001" cy="425.20001" rx="2.4000001" ry="21.6" />
        <ellipse style={{ fill: '#dcf9f6' }} cx="133.60001" cy="426" rx="21.6" ry="2.4000001" />
        <ellipse
          transform="matrix(0.7054,-0.7088,0.7088,0.7054,18.6212,346.765)"
          style={{ fill: '#dcf9f6' }}
          cx="426.474"
          cy="150.981"
          rx="21.6"
          ry="2.4000001"
        />
        <ellipse
          transform="matrix(0.7054,0.7088,-0.7088,0.7054,232.7671,-257.5539)"
          style={{ fill: '#dcf9f6' }}
          cx="426.22501"
          cy="151.245"
          rx="21.6"
          ry="2.4000001"
        />
        <ellipse style={{ fill: '#dcf9f6' }} cx="366.39999" cy="84.400002" rx="0.80000001" ry="9.6000004" />
        <ellipse style={{ fill: '#dcf9f6' }} cx="366.39999" cy="84.400002" rx="9.6000004" ry="0.80000001" />
        <ellipse
          transform="matrix(-0.7107,-0.7035,0.7035,-0.7107,232.771,301.5383)"
          style={{ fill: '#dcf9f6' }}
          cx="178.38699"
          cy="102.907"
          rx="10.4"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.7107,-0.7035,0.7035,0.7107,-20.6411,155.2913)"
          style={{ fill: '#dcf9f6' }}
          cx="178.491"
          cy="102.742"
          rx="10.4"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(-0.7089,-0.7053,0.7053,-0.7089,-92.7171,692.6153)"
          style={{ fill: '#dcf9f6' }}
          cx="96.570999"
          cy="365.44101"
          rx="10.4"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.7089,-0.7053,0.7053,0.7089,-229.2989,174.8202)"
          style={{ fill: '#dcf9f6' }}
          cx="97.139"
          cy="365.198"
          rx="10.4"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.6999,-0.7143,0.7143,0.6999,37.5702,239.1812)"
          style={{ fill: '#dcf9f6' }}
          cx="303.39499"
          cy="74.884003"
          rx="4.8000002"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.6999,0.7143,-0.7143,0.6999,144.8238,-194.2028)"
          style={{ fill: '#dcf9f6' }}
          cx="303.50101"
          cy="75.230003"
          rx="4.8000002"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.6998,-0.7144,0.7144,0.6998,-254.4496,288.0746)"
          style={{ fill: '#dcf9f6' }}
          cx="215.498"
          cy="446.75601"
          rx="4.8000002"
          ry="0.80000001"
        />
        <ellipse
          transform="matrix(0.6998,0.7144,-0.7144,0.6998,384.246,-19.8844)"
          style={{ fill: '#dcf9f6' }}
          cx="215.78"
          cy="447.19501"
          rx="4.8000002"
          ry="0.80000001"
        />
        <circle style={{ fill: '#dcf9f6' }} cx="249.60001" cy="250" r="160" />
      </g>
      <path
        style={{ fill: '#95bfb9' }}
        d="m 432.03123,286.5259 c 0,88 -48,160 -136,160 -88,0 -160,-72 -160,-160 0,-88 72,-160 160,-160 88,0 136,72 136,160 z"
      />
      <g transform="translate(46.431227,36.525898)">
        <circle style={{ fill: '#78a8a0' }} cx="138.39999" cy="165.2" r="9.6000004" />
        <circle style={{ fill: '#78a8a0' }} cx="124.8" cy="201.2" r="1.6" />
        <circle style={{ fill: '#78a8a0' }} cx="189.60001" cy="222" r="29.6" />
        <circle style={{ fill: '#78a8a0' }} cx="202.39999" cy="157.2" r="8" />
        <circle style={{ fill: '#78a8a0' }} cx="257.60001" cy="153.2" r="2.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="278.39999" cy="126" r="2.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="201.60001" cy="127.6" r="4" />
        <circle style={{ fill: '#78a8a0' }} cx="233.60001" cy="114" r="1.6" />
        <circle style={{ fill: '#78a8a0' }} cx="270.39999" cy="206" r="6.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="318.39999" cy="202" r="4" />
        <circle style={{ fill: '#78a8a0' }} cx="328.79999" cy="156.39999" r="6.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="300.79999" cy="285.20001" r="17.6" />
        <circle style={{ fill: '#78a8a0' }} cx="156" cy="295.60001" r="5.5999999" />
        <circle style={{ fill: '#78a8a0' }} cx="213.60001" cy="271.60001" r="2.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="241.60001" cy="331.60001" r="9.6000004" />
        <circle style={{ fill: '#78a8a0' }} cx="124.8" cy="254.8" r="6.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="267.20001" cy="250.8" r="1.6" />
        <circle style={{ fill: '#78a8a0' }} cx="344" cy="254" r="4" />
        <circle style={{ fill: '#78a8a0' }} cx="174.39999" cy="339.60001" r="9.6000004" />
        <circle style={{ fill: '#78a8a0' }} cx="193.60001" cy="305.20001" r="3.2" />
        <circle style={{ fill: '#78a8a0' }} cx="292.79999" cy="342.79999" r="3.2" />
        <circle style={{ fill: '#78a8a0' }} cx="241.60001" cy="369.20001" r="2.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="201.60001" cy="365.20001" r="1.6" />
        <circle style={{ fill: '#78a8a0' }} cx="332.79999" cy="328.39999" r="6.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="284" cy="375.60001" r="4" />
        <circle style={{ fill: '#78a8a0' }} cx="245.60001" cy="289.20001" r="3.2" />
        <circle style={{ fill: '#78a8a0' }} cx="353.60001" cy="300.39999" r="6.4000001" />
        <circle style={{ fill: '#78a8a0' }} cx="134.39999" cy="323.60001" r="5.5999999" />
        <circle style={{ fill: '#78a8a0' }} cx="309.60001" cy="241.2" r="7.1999998" />
      </g>
    </g>
  </svg>
);


const MoonSVG2 = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="moonGrad" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#ede9fe" />
        <stop offset="60%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </radialGradient>
      <radialGradient id="craterGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
      </radialGradient>
    </defs>
    {/* Lua principal */}
    <ellipse cx="28" cy="28" rx="25" ry="24" fill="url(#moonGrad)" stroke="#7c3aed" strokeWidth="2.5" />
    {/* Destaque de luz */}
    <ellipse cx="20" cy="18" rx="7" ry="3.5" fill="#ede9fe" fillOpacity="0.7" />
    {/* Crateras com sombra */}
    <ellipse cx="38" cy="18" rx="4" ry="2.5" fill="url(#craterGrad)" stroke="#7c3aed" strokeWidth="1.1" />
    <ellipse cx="20" cy="34" rx="2.5" ry="1.5" fill="url(#craterGrad)" stroke="#a78bfa" strokeWidth="0.9" />
    <ellipse cx="30" cy="38" rx="1.5" ry="1" fill="url(#craterGrad)" stroke="#a78bfa" strokeWidth="0.7" />
    <ellipse cx="40" cy="32" rx="1.2" ry="0.8" fill="url(#craterGrad)" stroke="#a78bfa" strokeWidth="0.6" />
    <ellipse cx="24" cy="20" rx="1.8" ry="1.1" fill="url(#craterGrad)" stroke="#a78bfa" strokeWidth="0.6" />
    {/* Olhos cartoon */}
    <ellipse cx="25" cy="27" rx="1.5" ry="2.2" fill="#6d28d9" />
    <ellipse cx="32" cy="27" rx="1.5" ry="2.2" fill="#6d28d9" />
    {/* Brilho nos olhos */}
    <ellipse cx="25.5" cy="26.2" rx="0.4" ry="0.7" fill="#fff" fillOpacity="0.7" />
    <ellipse cx="32.5" cy="26.2" rx="0.4" ry="0.7" fill="#fff" fillOpacity="0.7" />
    {/* Sorriso simpático */}
    <path d="M24 34 Q28 38 32 34" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const STAR_COUNT = 38;
const STAR_MIN_SIZE = 1.2;
const STAR_MAX_SIZE = 4.2;
const STAR_FIELD_RADIUS = 120; // distância máxima das estrelas ao centro

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// Gera posições fixas para as estrelas (mantém estável entre renders)
function useStarField(count: number, radius: number) {
  const [stars] = useState(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = randomBetween(0, 2 * Math.PI);
      const dist = randomBetween(radius * 0.45, radius * 1.0);
      const size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE) * (i % 2 === 0 ? 1 : 1.5);
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * randomBetween(0.7, 1.1),
        size,
        opacity: randomBetween(0.45, 0.95),
        twinkle: Math.random() > 0.7,
      };
    });
  });
  return stars;
}

// Substitua o hook useStarField por uma versão que usa a tela toda:
function useStarFieldFullScreenSVG(count: number) {
  // Gera as estrelas uma única vez por montagem
  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth * 1.5,
    height: window.innerHeight * 1.5,
  }));
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 1.5,
        height: window.innerHeight * 1.5,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const stars = useMemo(() => {
    // Metade das estrelas serão bem pequenas
    const smallCount = Math.floor(count * 0.5);
    const normalCount = count - smallCount;
    const smallStars = Array.from({ length: smallCount }, (_, i) => ({
      cx: Math.random() * dimensions.width,
      cy: Math.random() * dimensions.height,
      r: randomBetween(0.5, 1.5),
      opacity: randomBetween(0.25, 0.7),
      twinkle: Math.random() > 0.8,
    }));
    const normalStars = Array.from({ length: normalCount }, (_, i) => ({
      cx: Math.random() * dimensions.width,
      cy: Math.random() * dimensions.height,
      r: randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE) * (i % 2 === 0 ? 1 : 1.5),
      opacity: randomBetween(0.45, 0.95),
      twinkle: Math.random() > 0.7,
    }));
    return [...smallStars, ...normalStars];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, dimensions.width, dimensions.height]);
  return { stars, width: dimensions.width, height: dimensions.height };
}

const LogoWithMoonOrbit = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoSize = 156;
  const moonSize = logoSize * 1.2;
  const [scrollY, setScrollY] = useState(window.scrollY);
  const [angle, setAngle] = useState(0);
  const [moonRot, setMoonRot] = useState(0);
  const [starRot, setStarRot] = useState(0);
  const stars = useStarField(STAR_COUNT, STAR_FIELD_RADIUS);

  // Suavização dos ângulos (lerp)
  useEffect(() => {
    let animationFrame: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const update = () => {
      // Ângulo alvo baseado no scroll
      const targetAngle = (scrollY * 0.5) % 360;
      setAngle(prev => lerp(prev, targetAngle, 0.15));
      // Rotação da lua no próprio eixo (profundidade)
      const targetMoonRot = (scrollY * 1.2) % 360;
      setMoonRot(prev => lerp(prev, targetMoonRot, 0.12));
      // Rotação do campo de estrelas (bem sutil)
      const targetStarRot = (scrollY * 0.18) % 360;
      setStarRot(prev => lerp(prev, targetStarRot, 0.09));
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [scrollY]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Órbita: 90% da lua para fora do logo
  const moonRadius = moonSize / 2;
  const logoRadius = logoSize / 2;
  const orbitRadius = logoRadius + moonRadius * 0.4;
  const rx = orbitRadius;
  const ry = orbitRadius * 0.7;
  const rad = (angle * Math.PI) / 180;
  const moonX = rx * Math.cos(rad);
  const moonY = ry * Math.sin(rad);

  // Rotação do campo de estrelas
  const starFieldStyle = {
    transform: `translate(-50%, -50%) rotate(${starRot}deg)`
  };

  return (
    <div ref={containerRef} className="relative flex justify-center items-center my-16 select-none" style={{ minHeight: logoSize }}>
      {/* Campo de estrelas - ATRÁS de tudo */}
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none z-0"
        style={{ width: logoSize * 3, height: logoSize * 3, ...starFieldStyle }}
      >
        {stars.map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${star.x}px)` ,
              top: `calc(50% + ${star.y}px)` ,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff 60%, #a78bfa 100%)`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2.5}px #fff8`,
              filter: star.twinkle ? 'blur(0.5px)' : undefined,
              transition: 'opacity 0.7s',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      {/* Lua cartoon (SVG) - ATRÁS do logo */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${moonX}px, ${moonY}px) rotate(${moonRot}deg)`,
          zIndex: 1,
          pointerEvents: 'none',
          transition: 'filter 0.2s',
          filter: 'drop-shadow(0 2px 16px #a78bfa33)',
        }}
      >
        <MoonSVG size={moonSize} />
      </div>
      {/* Logo */}
      <div className="relative z-10 flex items-center justify-center" style={{ width: logoSize, height: logoSize }}>
        <Logo width={logoSize} height={logoSize} />
      </div>
    </div>
  );
};

const InifinityMoonTitle = () => {
  const [t, setT] = useState(0);
  const moonSize = 38;
  const textRef = useRef<HTMLSpanElement>(null);
  const [a, setA] = useState(60); // amplitude inicial

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setT(prev => (prev + 0.012) % 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Medir largura do texto e ajustar amplitude do infinito
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.offsetWidth;
      setA((width + 20) / 2.1); // 10px para cada lado, 2.1 para compensar a fórmula do infinito
    }
  }, []);

  // Lemniscata (símbolo do infinito)
  const theta = t * 2 * Math.PI;
  const denom = 1 + Math.pow(Math.sin(theta), 2);
  const x = a * Math.cos(theta) / denom;
  const y = a * Math.sin(theta) * Math.cos(theta) / denom;

  return (
    <div className="relative flex justify-center items-center mb-6" style={{ height: 80 }}>
      {/* Lua animada */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          zIndex: y > 0 ? 2 : 0, // lua na frente quando y > 0
          filter: y > 0 ? 'drop-shadow(0 2px 8px #ffe06688)' : 'blur(0.5px)',
          transition: 'z-index 0.2s',
        }}
      >
        <MoonSVG2 size={moonSize} />
      </div>
      {/* Texto OniMock */}
      <h1 className="text-6xl md:text-8xl font-bold mb-0 relative z-10">
        <span className="text-gradient" ref={textRef}>OniMock</span>
      </h1>
    </div>
  );
};

const Hero = () => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useLanguage();
  const [showDesc, setShowDesc] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const titles = useMemo(
    () => [
      t('hero.titles.0'),
      t('hero.titles.1'),
      t('hero.titles.2'),
      t('hero.titles.3'),
      t('hero.titles.4'),
      t('hero.titles.5'),
    ],
    [t]
  );

  // Typewriter + fade nas letras
  useEffect(() => {
    const currentTitle = titles[currentIndex];
    const nextIndex = (currentIndex + 1) % titles.length;
    const nextTitle = titles[nextIndex];

    const getCommonPrefix = (a, b) => {
      let i = 0;
      while (i < a.length && i < b.length && a[i] === b[i]) i++;
      return a.slice(0, i);
    };

    const commonPrefix = getCommonPrefix(currentTitle, nextTitle);
    const speed = isDeleting ? 35 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentTitle.length) {
          setDisplayText(currentTitle.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1200);
        }
      } else {
        if (displayText.length > commonPrefix.length) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex(nextIndex);
        }
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [displayText, currentIndex, isDeleting, titles]);

  // Fade-in/out para descrição e botões
  useEffect(() => {
    const descTimer = setTimeout(() => setShowDesc(true), 400);
    const btnTimer = setTimeout(() => setShowButtons(true), 900);
    return () => {
      clearTimeout(descTimer);
      clearTimeout(btnTimer);
    };
  }, []);

  // Campo de estrelas tela toda (SVG otimizado)
  const [starRot, setStarRot] = useState(0);
  const { stars, width: starFieldWidth, height: starFieldHeight } = useStarFieldFullScreenSVG(160);
  useEffect(() => {
    let animationFrame: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const update = () => {
      const targetStarRot = (window.scrollY * 0.18) % 360;
      setStarRot(prev => lerp(prev, targetStarRot, 0.09));
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Image - Tech/Crypto themed */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="Blockchain and cryptocurrency technology background"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/90"></div>
      </div>

      {/* Additional Tech Overlay */}
      <div className="absolute inset-0 z-5">
        <img
          src="https://images.pexels.com/photos/6764234/pexels-photo-6764234.jpeg?auto=format&fit=crop&w=2000&q=80"
          alt="Programming code background"
          className="w-full h-full object-cover opacity-5 mix-blend-overlay"
        />
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div className="container mx-auto px-6 text-center z-20 relative">
        <div className="animate-fade-in">
          <InifinityMoonTitle />

          {/* Typewriter com fade nas letras */}
          <div className="h-20 flex items-center justify-center mb-8">
            <span className="text-2xl md:text-3xl font-light text-gray-300">
              {displayText.split('').map((char, i) => (
                <span
                  key={i}
                  className={clsx(
                    'inline-block transition-opacity duration-300',
                    i === displayText.length - 1 && !isDeleting ? 'opacity-100' : 'opacity-80',
                    isDeleting && i >= displayText.length - 2 ? 'opacity-40' : ''
                  )}
                  style={{ transitionDelay: `${i * 12}ms` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              <span className="animate-pulse text-purple-400">|</span>
            </span>
          </div>

          {/* Fade-in/out descrição */}
          <p
            className={clsx(
              'text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-opacity duration-700',
              showDesc ? 'opacity-100' : 'opacity-0'
            )}
          >
            {t('hero.description')}
          </p>

          {/* Botões com animação de entrada e hover tech */}
          <div className={clsx(
            'flex gap-6 justify-center flex-wrap transition-all duration-700',
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}>
            <a
              href="#projects"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[0_0_16px_4px_rgba(124,58,237,0.25)] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              style={{ boxShadow: '0 2px 16px 0 #a78bfa44' }}
            >
              {t('hero.viewProjects')}
            </a>
            <a
              href="#about"
              className="px-8 py-4 glass-card hover:bg-white/10 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[0_0_16px_4px_rgba(168,139,250,0.18)] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              style={{ boxShadow: '0 2px 16px 0 #a78bfa33' }}
            >
              {t('hero.aboutMe')}
            </a>
          </div>

          {/* Seta animada entre botões e logo */}
          <div className="flex justify-center my-4">
            <ArrowDown className="w-7 h-7 text-purple-400 animate-bounce animate-pulse drop-shadow-[0_0_8px_rgba(168,139,250,0.5)]" />
          </div>

          {/* Animação do Logo + Lua Orbitando */}
          <LogoWithMoonOrbit />

          {/* Campo de estrelas tela toda (SVG otimizado) */}
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              width: starFieldWidth,
              height: starFieldHeight,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${starRot}deg)`,
              position: 'fixed',
              overflow: 'hidden',
              willChange: 'transform',
            }}
          >
            <svg width={starFieldWidth} height={starFieldHeight} style={{ display: 'block' }}>
              <defs>
                <radialGradient id="starGrad" cx="50%" cy="50%" r="100%">
                  <stop offset="60%" stopColor="#fff" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </radialGradient>
                <filter id="blur">
                  <feGaussianBlur stdDeviation="0.5" />
                </filter>
              </defs>
              {stars.map((star, i) => (
                <circle
                  key={i}
                  cx={star.cx}
                  cy={star.cy}
                  r={star.r}
                  fill="url(#starGrad)"
                  opacity={star.opacity}
                  filter={star.twinkle ? 'url(#blur)' : undefined}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
