
import { Appointment } from '../types';

/**
 * 📢 操作說明：
 * 1. 在 GAS 部署後，將得到的網址貼在下方的 GAS_URL
 * 2. 範例：https://script.google.com/macros/s/AKfycb...你的ID.../exec
 */
const GAS_URL = ''; // <--- 在這裡貼上您的 Google Apps Script 網址

export const bookingService = {
  isConfigured(): boolean {
    return GAS_URL.startsWith('https://script.google.com');
  },

  async fetchAppointments(): Promise<Appointment[]> {
    try {
      if (!this.isConfigured()) return [];
      
      const res = await fetch(`${GAS_URL}?action=getAppointments`);
      if (!res.ok) throw new Error('連線失敗');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('取得預約失敗', e);
      return [];
    }
  },

  async createAppointment(appointment: Appointment): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('GAS_URL 未設定，目前為模擬模式');
        return true;
      }

      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          data: appointment
        })
      });
      return true; 
    } catch (e) {
      console.error('建立預約失敗', e);
      return false;
    }
  },

  async cancelAppointment(id: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) return true;
      
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          id: id
        })
      });
      return true;
    } catch (e) {
      console.error('取消預約失敗', e);
      return false;
    }
  }
};
