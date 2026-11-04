export type HomeConfig = {
  architecture: 'courtyard' | 'pavilion' | 'alpine';
  plants: 'pine' | 'olive' | 'cypress';
  time: 'day' | 'sunset' | 'night';
  weather: 'clear' | 'rain';
  carColor: string;
  wheels: 'silver' | 'black';
};
export const DEFAULT_CONFIG: HomeConfig = {
  architecture: 'courtyard', plants: 'olive', time: 'sunset',
  weather: 'clear', carColor: '#b9c0ba', wheels: 'silver',
};
export type Postcard = { id: string; name: string; message: string; theme: string; createdAt: number };
export type HomeData = {
  id: string | null; title: string; ownerName: string; story: string;
  config: HomeConfig; postcards: Postcard[]; isOwner: boolean; updatedAt: number | null;
};
export const DEMO_HOME: HomeData = {
  id: null, title: '山野之间，我的归处', ownerName: '车主',
  story: '最喜欢的时刻，是沿着山路回到家，把车停好，再为远道而来的朋友留一盏灯。',
  config: DEFAULT_CONFIG, postcards: [], isOwner: true, updatedAt: null,
};
