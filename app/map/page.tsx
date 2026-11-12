import type { Metadata } from 'next';
import { Home, Map, Wrench } from 'lucide-react';
import FriendsMap from '@/components/FriendsMap';

export const metadata: Metadata = { title: '好友地图 · Porsche Home' };

export default function MapPage() {
  return <main className="home-app is-map">
    <FriendsMap />
    <nav className="bottom-nav valley-nav" aria-label="空间导航">
      <a href="./map" className="active" aria-current="page"><Map size={17} strokeWidth={1.6}/><span>地图</span></a>
      <a href="./?view=home"><Home size={17} strokeWidth={1.6}/><span>归处</span></a>
      <a href="./?view=workshop"><Wrench size={17} strokeWidth={1.6}/><span>车库</span></a>
    </nav>
  </main>;
}
