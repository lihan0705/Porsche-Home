'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Play } from 'lucide-react';

const media = 'https://a.storyblok.com/f/322327';
const front = `${media}/7680x3840/e9b34cf231/mission-s-stage.jpg/m/1600x800/filters:format(webp)`;
const profile = `${media}/7680x3296/b401f0972d/mission-s-exterior.jpg/m/1280x549/filters:format(webp)`;

function IgnitionGauge({ progress }: { progress: number }) {
  return (
    <div className="mission-gauge" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" fill="#111819" fillOpacity=".83" stroke="#e4e8e4" strokeOpacity=".38" />
        {Array.from({ length: 21 }, (_, index) => (
          <line key={index} x1="50" x2="50" y1="12" y2={index % 5 === 0 ? 20 : 16}
            transform={`rotate(${index * 13 - 130} 50 50)`}
            stroke={index >= 17 ? '#ee6972' : '#f4f4ee'} strokeWidth={index % 5 === 0 ? 1.8 : 1} />
        ))}
        <g className="mission-gauge-needle" style={{ transform: `rotate(${progress * 2.6 - 130}deg)` }}>
          <path d="M48.5 52 50 21 51.5 52Z" fill="#ff5d70" />
        </g>
        <circle cx="50" cy="50" r="3.5" fill="#d4d8d5" />
        <text x="50" y="70" textAnchor="middle" fill="white" fontSize="12">{progress}%</text>
        <text x="50" y="83" textAnchor="middle" fill="#d4d8d5" fontSize="5.8" letterSpacing="1">{progress === 100 ? 'READY' : 'LOADING'}</text>
      </svg>
    </div>
  );
}

export default function MissionShowcase({ compact = false, progress }: { compact?: boolean; progress?: number }) {
  const [imageReady, setImageReady] = useState(false);
  const photo = useRef<HTMLImageElement>(null);
  const bloomId = useId();
  useEffect(() => {
    if (photo.current?.complete && photo.current.naturalWidth > 0) setImageReady(true);
  }, []);
  const lamps = compact
    ? [{ x: 344, y: 155, rx: 24, ry: 11 }, { x: 635, y: 180, rx: 31, ry: 17 }]
    : [{ x: 567, y: 435, rx: 42, ry: 36 }, { x: 1067, y: 451, rx: 42, ry: 36 }];
  return (
    <figure className="mission-showcase">
      <img ref={photo} src={compact ? profile : front} alt={compact ? '保时捷 Mission S 概念车外观' : '保时捷 Mission S 概念车正面'}
        fetchPriority={compact ? 'auto' : 'high'} onLoad={() => setImageReady(true)} />
      {imageReady && (
        <svg className="mission-ignition" viewBox={compact ? '0 0 1280 549' : '0 0 1600 800'}
          preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id={`${bloomId}-shade`}>
              <stop stopColor="#141d21" stopOpacity=".89" />
              <stop offset=".65" stopColor="#141d21" stopOpacity=".45" />
              <stop offset="1" stopColor="#141d21" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={bloomId}>
              <stop stopColor="#f7fdff" stopOpacity=".92" />
              <stop offset=".34" stopColor="#d3edff" stopOpacity=".48" />
              <stop offset="1" stopColor="#9bcfff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {lamps.map(({ x, y, rx, ry }, index) => (
            <ellipse key={`shade-${x}`} className={`mission-lamp-shade mission-lamp-${index}`} cx={x} cy={y} rx={rx} ry={ry}
              fill={`url(#${bloomId}-shade)`} />
          ))}
          {lamps.map(({ x, y, rx, ry }, index) => (
            <ellipse key={x} className={`mission-lamp mission-lamp-${index}`} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${bloomId})`} />
          ))}
          {!compact && <g className="mission-running-lights">
            <path d="M500 477 Q523 493 563 512 M1064 540 Q1100 523 1118 502" />
          </g>}
        </svg>
      )}
      {progress !== undefined && <IgnitionGauge progress={progress} />}
      <figcaption className="mission-media-caption">
        <span>01 / VISION MODEL</span>
        <a href="https://youtu.be/axeNSZBf8sE" target="_blank" rel="noreferrer">
          <Play size={13} aria-hidden="true" /> 观看官方影片
        </a>
      </figcaption>
    </figure>
  );
}
