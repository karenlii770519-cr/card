import { Appointment } from '../types';

/**
 * 📢 操作說明：
 * 1. 在 GAS 部署後，將得到的網址貼在下方的 GAS_URL
 */
const GAS_URL = 'https://script.google.com/macros/s/AKfycby6mKSsfT3Ci-Rc97cbcMAU6t6tV1QNDrJ1ONv_X7uOsLt9L-mQQ9uT_6uSzwXfl4w/exec'; // <--- 拿到第一步的網址後，請貼在這裡

export const bookingService = {
  isConfigured(): boolean {
    return typeof GAS_URL === 'string' && GAS_URL.length > 20 && GAS_URL.startsWith('https://script.google.com/macros/s/AKfycby6mKSsfT3Ci-Rc97cbcMAU6t6tV1QNDrJ1ONv_X7uOsLt9L-mQQ9uT_6uSzwXfl4w/exec');
  },

  async fetchAppointments(): Promise<Appointment[]> {
    try {
      if (!this.isConfigured()) {
        console.warn('GAS_URL 未設定或格式錯誤，目前為模擬模式');
        return [];
      }
      
      const res = await fetch(`${GAS_URL}?action=getAppointments`);
      if (!res.ok) return [];
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
        console.warn('GAS_URL 未設定，模擬預約成功');
        return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
      }

      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
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
          'Content-Type': 'text/plain',
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
