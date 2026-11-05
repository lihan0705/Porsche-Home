import { Play } from 'lucide-react';

const media = 'https://a.storyblok.com/f/322327';
const front = `${media}/7680x3840/e9b34cf231/mission-s-stage.jpg/m/1600x800/filters:format(webp)`;
const profile = `${media}/7680x3296/b401f0972d/mission-s-exterior.jpg/m/1280x549/filters:format(webp)`;

export default function MissionShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <figure className="mission-showcase">
      <img src={compact ? profile : front} alt={compact ? '保时捷 Mission S 概念车外观' : '保时捷 Mission S 概念车正面'} fetchPriority={compact ? 'auto' : 'high'} />
      <figcaption className="mission-media-caption">
        <span>01 / VISION MODEL</span>
        <a href="https://youtu.be/axeNSZBf8sE" target="_blank" rel="noreferrer">
          <Play size={13} aria-hidden="true" /> 观看官方影片
        </a>
      </figcaption>
    </figure>
  );
}
