
export interface Service {
  id: string;
  name: string;
  category: 'hand' | 'foot' | 'care' | 'removal' | 'combo';
  price: number | 'quote';
  durationMinutes: number;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  greeting: string;
  image: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  stylistId: string;
  date: string; // ISO format
  time: string; // HH:mm format
  durationMinutes: number;
  userName: string;
}

export enum BookingStep {
  SERVICE = 1,
  STYLIST = 2,
  DATE = 3,
  TIME = 4,
  CONFIRM = 5,
  SUCCESS = 6
}
