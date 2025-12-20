import { Service, Stylist } from './types';

export const SERVICES: Service[] = [
  // Hand
  { id: 'h1', name: '單色 / 跳色', category: 'hand', price: 500, durationMinutes: 60 },
  { id: 'h2', name: '漸層 / 貓眼', category: 'hand', price: 600, durationMinutes: 90 },
  { id: 'h3', name: '暈染 / 亮粉等', category: 'hand', price: 700, durationMinutes: 90 },
  { id: 'h4', name: '法式', category: 'hand', price: 700, durationMinutes: 120 },
  { id: 'h5', name: '自帶圖片設計', category: 'hand', price: 'quote', durationMinutes: 150 },
  // Foot
  { id: 'f1', name: '足部單色/貓眼/跳色', category: 'foot', price: 600, durationMinutes: 60 },
  // Care
  { id: 'c1', name: '手部保養', category: 'care', price: 400, durationMinutes: 45 },
  { id: 'c2', name: '甲片延甲 (10指)', category: 'care', price: 1000, durationMinutes: 60 },
  { id: 'c3', name: '甲片延甲 (5指以下)', category: 'care', price: 500, durationMinutes: 30 },
  // Removal
  { id: 'r1', name: '手/足單卸甲', category: 'removal', price: 300, durationMinutes: 30 },
  { id: 'r2', name: '延甲卸甲', category: 'removal', price: 500, durationMinutes: 60 },
  // Combos
  { id: 'cb1', name: '手部卸甲 + 光療', category: 'combo', price: 800, durationMinutes: 90 },
  { id: 'cb2', name: '手部卸甲 + 光療 + 保養', category: 'combo', price: 1100, durationMinutes: 135 },
  { id: 'cb3', name: '手足卸甲 + 手足光療', category: 'combo', price: 1500, durationMinutes: 180 },
];

export const STYLISTS: Stylist[] = [
  { 
    id: 's1', 
    name: '虹', 
    specialty: '', 
    greeting: '',
    image: 'https://www.dropbox.com/scl/fi/p5yp0ff6r36hyv5314hqu/p1.jpg?rlkey=2r9l80w2q1ljzn2utoyev9gux&st=vjzu6w4h&raw=1' 
  },
  { 
    id: 's2', 
    name: '敬', 
    specialty: '', 
    greeting: '',
    image: 'https://www.dropbox.com/scl/fi/70tckw1bxps5sjph2ht27/p2.jpg?rlkey=js9dm1zc1h7yduwzha40trtvk&st=zmfv5fb2&raw=1' 
  },
  { 
    id: 's3', 
    name: '芮綺', 
    specialty: '', 
    greeting: '',
    image: 'https://www.dropbox.com/scl/fi/fyonnvr9fhc2bni36ro22/p3.jpg?rlkey=06u8rsnb4n2pik7nnrdhfaqdb&st=bwzev9h4&raw=1' 
  },
];

export const CATEGORY_LABELS = {
  hand: '手部光療 / 美甲',
  foot: '足部光療 / 美甲',
  care: '保養與延甲',
  removal: '卸甲服務',
  combo: '常見組合'
};