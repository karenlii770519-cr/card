import React, { useState, useEffect, useMemo } from 'react';
import { BookingStep, Service, Stylist, Appointment, Leave } from './types';
import { SERVICES, STYLISTS, CATEGORY_LABELS } from './constants';
import { bookingService } from './services/api';

declare global {
  interface Window {
    liff: any;
  }
}

const ProgressBar: React.FC<{ step: BookingStep }> = ({ step }) => {
  const percentage = (step / 5) * 100;
  return (
    <div className="w-full bg-white/50 h-1.5 rounded-full mb-8 overflow-hidden backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-ig transition-all duration-1000 ease-out" 
        style={{ width: `${Math.min(percentage, 100)}%` }} 
      />
    </div>
  );
};

const ServiceCard: React.FC<{ service: Service, selected: boolean, onClick: () => void }> = ({ service, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex justify-between items-center mb-4 ${
      selected 
        ? 'border-[#D86B76] bg-white scale-[1.02] shadow-lg ring-4 ring-[#D86B76]/5' 
        : 'border-white bg-white/80 hover:border-pink-100 shadow-soft'
    }`}
  >
    <div className="flex-1 text-left">
      <h4 className={`font-bold text-lg ${selected ? 'text-[#8F2C2F]' : 'text-gray-700'}`}>{service.name}</h4>
      <p className="text-xs text-gray-400 mt-1">預計時長：{service.durationMinutes} 分鐘</p>
    </div>
    <div className={`font-black text-lg ${selected ? 'text-[#D86B76]' : 'text-[#8F2C2F]'}`}>
      {service.price === 'quote' ? '現場報價' : `$${service.price}`}
    </div>
  </div>
);

const StylistCard: React.FC<{ stylist: Stylist | null, selected: boolean, onClick: () => void, isOnLeave?: boolean }> = ({ stylist, selected, onClick, isOnLeave }) => (
  <div 
    onClick={isOnLeave ? undefined : onClick}
    className={`p-5 rounded-[2rem] border-2 transition-all duration-300 flex items-center mb-4 relative ${
      isOnLeave ? 'opacity-40 grayscale cursor-not-allowed bg-gray-100 border-transparent' : 
      selected 
        ? 'border-[#D86B76] bg-white scale-[1.02] shadow-lg ring-4 ring-[#D86B76]/5 cursor-pointer' 
        : 'border-white bg-white/80 hover:border-pink-100 shadow-soft cursor-pointer'
    }`}
  >
    <div className={`w-16 h-16 rounded-full flex-shrink-0 mr-5 overflow-hidden border-2 p-0.5 ${selected ? 'border-[#D86B76]' : 'border-gray-100'}`}>
      {stylist ? (
        <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <div className="w-full h-full bg-gradient-ig flex items-center justify-center text-white font-bold text-[10px] text-center leading-tight">不指定<br/>老師</div>
      )}
    </div>
    <div className="flex-1 text-left">
      <div className="flex items-center justify-between">
        <h4 className={`font-bold text-xl ${selected ? 'text-[#8F2C2F]' : 'text-gray-700'}`}>
          {stylist?.name || '不指定美甲老師'}
          {isOnLeave && <span className="ml-2 text-xs text-red-400 font-normal">(休假中)</span>}
        </h4>
        {stylist && (
          <span className="text-[9px] text-gray-300 font-mono tracking-tighter">ID: {stylist.id}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">{stylist ? (stylist.greeting || '專業美甲服務') : '安心交給我們，為您安排當前最合適的人選'}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('any'); 
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lineUser, setLineUser] = useState<{ name: string; picture?: string } | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (window.liff) {
          await window.liff.init({ liffId: "2006935798-e4bVvax4" }); 
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile();
            setLineUser({ name: profile.displayName, picture: profile.pictureUrl });
          }
        }
      } catch (err) { 
        console.warn('LIFF 初始化失敗', err); 
      }

      try {
        const data = await bookingService.fetchInitialData();
        setAppointments(data.appointments || []);
        setLeaves(data.leaves || []);
      } catch (e) { 
        console.error('資料載入錯誤', e); 
      } finally { 
        setIsLoading(false); 
      }
    };
    initializeApp();
  }, []);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const isShopClosed = useMemo(() => {
    const isWed = new Date(selectedDate).getDay() === 3;
    const isSpecialLeave = leaves.some(l => (l.stylistId === "" || l.stylistId === "undefined" || l.stylistId === "null") && l.date === selectedDate);
    return isWed || isSpecialLeave;
  }, [selectedDate, leaves]);

  const timeSlots = useMemo(() => {
    if (isShopClosed) return [];
    const slots = [];
    for (let h = 11; h <= 19; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 19) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [isShopClosed]);

  const checkSlotAvailability = (time: string) => {
    if (!selectedService || isShopClosed) return false;
    
    const isStylistAvailable = (sid: string) => {
      const onLeave = leaves.some(l => l.stylistId === sid && l.date === selectedDate);
      if (onLeave) return false;

      const stylistBookings = appointments.filter(a => a.stylistId === sid && a.date === selectedDate);
      const requestedStart = parseInt(time.replace(':', ''));
      const duration = selectedService.durationMinutes;
      const endH = parseInt(time.split(':')[0]) + Math.floor((parseInt(time.split(':')[1]) + duration) / 60);
      const endM = (parseInt(time.split(':')[1]) + duration) % 60;
      const requestedEnd = endH * 100 + endM;

      return !stylistBookings.some(b => {
        const start = parseInt(b.time.replace(':', ''));
        const bDuration = b.durationMinutes || 60;
        const bEndH = parseInt(b.time.split(':')[0]) + Math.floor((parseInt(b.time.split(':')[1]) + bDuration) / 60);
        const bEndM = (parseInt(b.time.split(':')[1]) + bDuration) % 60;
        const bEnd = bEndH * 100 + bEndM;
        return (requestedStart < bEnd && requestedEnd > start);
      });
    };

    if (selectedStylistId === 'any') {
      return STYLISTS.some(s => isStylistAvailable(s.id));
    }
    return isStylistAvailable(selectedStylistId);
  };

  const handleBookingConfirm = async () => {
    if (!selectedService || !selectedTime) return;
    setIsLoading(true);
    
    let finalStylistId = selectedStylistId;
    if (finalStylistId === 'any') {
      const availableStylist = STYLISTS.find(s => {
        const onLeave = leaves.some(l => l.stylistId === s.id && l.date === selectedDate);
        if (onLeave) return false;
        
        const stylistBookings = appointments.filter(a => a.stylistId === s.id && a.date === selectedDate);
        const requestedStart = parseInt(selectedTime.replace(':', ''));
        const duration = selectedService.durationMinutes;
        const endH = parseInt(selectedTime.split(':')[0]) + Math.floor((parseInt(selectedTime.split(':')[1]) + duration) / 60);
        const endM = (parseInt(selectedTime.split(':')[1]) + duration) % 60;
        const requestedEnd = endH * 100 + endM;
        return !stylistBookings.some(b => {
          const start = parseInt(b.time.replace(':', ''));
          const bDuration = b.durationMinutes || 60;
          const bEndH = parseInt(b.time.split(':')[0]) + Math.floor((parseInt(b.time.split(':')[1]) + bDuration) / 60);
          const bEndM = (parseInt(b.time.split(':')[1]) + bDuration) % 60;
          const end = bEndH * 100 + bEndM;
          return (requestedStart < end && requestedEnd > start);
        });
      });
      finalStylistId = availableStylist?.id || STYLISTS[0].id;
    }

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: selectedService.id,
      stylistId: finalStylistId,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: selectedService.durationMinutes,
      userName: lineUser?.name || '訪客預約'
    };

    try {
      const success = await bookingService.createAppointment(newAppointment);
      if (success) {
        setAppointments(prev => [...prev, newAppointment]);
        setStep(BookingStep.SUCCESS);
      } else { alert('預約失敗，請重試。'); }
    } catch (e) { alert('系統忙碌中'); } finally { setIsLoading(false); }
  };

  if (isLoading && step !== BookingStep.SUCCESS) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-cream-pink">
        <div className="w-10 h-10 border-4 border-pink-100 border-t-[#D86B76] rounded-full animate-spin mb-4"></div>
        <p className="text-[#D86B76] font-bold text-xs tracking-widest">載入中...</p>
      </div>
    );
  }

  const currentStylist = STYLISTS.find(s => s.id === selectedStylistId) || null;

  return (
    <div className="max-w-md mx-auto min-h-screen px-6 py-12 relative flex flex-col text-left">
      <header className="flex justify-between items-center mb-10 animate-slide-up">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">指要妳</h1>
          <p className="text-[10px] font-black text-[#D86B76] mt-1 tracking-[0.2em] uppercase opacity-70">Nail Salon</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMyBookings(!showMyBookings)} className="text-[10px] font-bold px-4 py-2 rounded-full bg-white shadow-soft text-[#8F2C2F]">
            {showMyBookings ? '返回' : '我的紀錄'}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {showMyBookings ? (
          <div className="animate-slide-up">
            <h2 className="text-xl font-black text-gray-800 mb-6 px-1">預約清單</h2>
            {appointments.length === 0 ? <div className="text-center py-20 italic text-gray-400">目前尚無預約資料</div> : 
              appointments.map(appt => (
                <div key={appt.id} className="bg-white p-5 rounded-3xl shadow-soft mb-4 border border-pink-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[#8F2C2F] text-sm mb-1">{SERVICES.find(s => s.id === appt.serviceId)?.name}</h3>
                    <p className="text-[10px] text-gray-400">📅 {appt.date} | ⏰ {appt.time}</p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 bg-green-50 text-green-500 rounded-lg">已確認</span>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="animate-slide-up">
            {step !== BookingStep.SUCCESS && <ProgressBar step={step} />}

            {step === BookingStep.SERVICE && (
              <div className="space-y-8 pb-24">
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <div key={catKey}>
                    <h3 className="text-[10px] font-black text-[#D86B76] mb-4 px-1 tracking-widest uppercase">{label}</h3>
                    {SERVICES.filter(s => s.category === catKey).map(service => (
                      <ServiceCard key={service.id} service={service} selected={selectedService?.id === service.id} onClick={() => { setSelectedService(service); handleNext(); }} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {step === BookingStep.STYLIST && (
              <div className="space-y-4">
                <h2 className="text-xl font-black text-gray-800 mb-6 px-1">選擇老師</h2>
                <StylistCard stylist={null} selected={selectedStylistId === 'any'} onClick={() => { setSelectedStylistId('any'); handleNext(); }} />
                {STYLISTS.map(stylist => (
                  <StylistCard 
                    key={stylist.id} 
                    stylist={stylist} 
                    selected={selectedStylistId === stylist.id} 
                    isOnLeave={leaves.some(l => l.stylistId === stylist.id && l.date === selectedDate)}
                    onClick={() => { setSelectedStylistId(stylist.id); handleNext(); }} 
                  />
                ))}
              </div>
            )}

            {step === BookingStep.DATE && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 mb-6 px-1">選擇日期</h2>
                <div className="bg-white rounded-[2rem] p-10 shadow-soft border border-pink-50">
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-center text-2xl font-black text-[#8F2C2F] outline-none bg-transparent cursor-pointer w-full" />
                </div>
                <button onClick={handleNext} className="w-full py-5 rounded-2xl font-black text-white bg-gradient-ig shadow-xl mt-8">下一步：選擇時段</button>
              </div>
            )}

            {step === BookingStep.TIME && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 mb-6 px-1">選擇時段 {isShopClosed && <span className="text-red-400 ml-2">(公休)</span>}</h2>
                {isShopClosed ? (
                   <div className="py-20 text-center bg-white/50 rounded-3xl border border-dashed border-red-100 text-red-400 font-bold px-8">
                     很抱歉，此日期為公休日或國定假日。<br/>請切換其他日期預約。
                   </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(time => {
                      const available = checkSlotAvailability(time);
                      return (
                        <button key={time} disabled={!available} onClick={() => { setSelectedTime(time); handleNext(); }} className={`py-4 rounded-xl text-xs font-black transition-all ${selectedTime === time ? 'bg-gradient-ig text-white shadow-lg' : available ? 'bg-white text-[#8F2C2F] border border-pink-50' : 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'}`}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
                {isShopClosed && <button onClick={handleBack} className="w-full py-4 text-sm font-bold text-gray-400">返回修改日期</button>}
              </div>
            )}

            {step === BookingStep.CONFIRM && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-800 mb-6 px-1">預約確認</h2>
                <div className="bg-white rounded-3xl p-8 shadow-soft border border-pink-50 space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50"><span className="text-gray-400 font-bold">服務</span><span className="text-[#8F2C2F] font-black">{selectedService?.name}</span></div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50"><span className="text-gray-400 font-bold">老師</span><span className="text-gray-700 font-bold">{currentStylist?.name || '不指定 (現場分配)'}</span></div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50"><span className="text-gray-400 font-bold">時間</span><span className="text-gray-700 font-bold underline underline-offset-4 decoration-pink-300">{selectedDate} {selectedTime}</span></div>
                  <div className="pt-2 flex justify-between items-center"><span className="text-gray-400 font-bold">金額</span><span className="text-2xl font-black text-[#D86B76]">{selectedService?.price === 'quote' ? '現場報價' : `$${selectedService?.price}`}</span></div>
                </div>
                <button onClick={handleBookingConfirm} className="w-full py-5 rounded-2xl font-black text-white bg-gradient-ig shadow-xl active:scale-95 transition-all mt-6">送出預約</button>
              </div>
            )}

            {step === BookingStep.SUCCESS && (
              <div className="text-center py-6 animate-slide-up">
                <div className="w-20 h-20 bg-gradient-ig rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-8 shadow-2xl">✓</div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">預約成功</h2>
                <p className="text-gray-400 text-sm mb-10 px-6">我們已收到您的預約，<br/>期待您的光臨！✨</p>
                <button onClick={() => window.location.reload()} className="w-full py-5 rounded-2xl font-black text-[#8F2C2F] bg-white border border-pink-100 shadow-soft">回首頁</button>
              </div>
            )}
          </div>
        )}
      </main>
      
      {step > 1 && step < 6 && !showMyBookings && <button onClick={handleBack} className="mt-4 text-xs font-bold text-gray-300 hover:text-[#D86B76] transition-colors">← 返回上一步</button>}
    </div>
  );
};

export default App;
