
import { Appointment } from '../types';

/**
 * 📢 操作說明：
 * 1. 在 GAS 點擊「部署」 -> 「新部署」
 * 2. 選擇「網頁應用程式」，誰可以存取選「所有人」
 * 3. 部署後，將得到的網址貼在下方的 GAS_URL
 */
const GAS_URL = ''; // <--- 在這裡貼上你的 https://script.google.com/macros/s/.../exec

export const bookingService = {
  isConfigured(): boolean {
    return GAS_URL.startsWith('https://script.google.com');
  },

  async fetchAppointments(): Promise<Appointment[]> {
    try {
      if (!this.isConfigured()) return [];
      
      const res = await fetch(`${GAS_URL}?action=getAppointments`);
      if (!res.ok) throw new Error('連線失敗');
      return await res.json();
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
