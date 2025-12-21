import React, { useState, useEffect, useMemo } from 'react';
import { BookingStep, Service, Stylist, Appointment } from './types';
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

const StylistCard: React.FC<{ stylist: Stylist | null, selected: boolean, onClick: () => void }> = ({ stylist, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer flex items-center mb-4 ${
      selected 
        ? 'border-[#D86B76] bg-white scale-[1.02] shadow-lg ring-4 ring-[#D86B76]/5' 
        : 'border-white bg-white/80 hover:border-pink-100 shadow-soft'
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
      <h4 className={`font-bold text-xl ${selected ? 'text-[#8F2C2F]' : 'text-gray-700'}`}>{stylist?.name || '不指定美甲老師'}</h4>
      <p className="text-xs text-gray-400 mt-1">{stylist ? (stylist.greeting || '專業美甲服務') : '安心交給我們，為您安排最合適的人選'}</p>
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
  const [isLoading, setIsLoading] = useState(true);
  const [lineUser, setLineUser] = useState<{ name: string; picture?: string } | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // 1. LIFF Initialization
      try {
        if (window.liff) {
          // 如果您有 LIFF ID，請填入此處；若僅在 LINE 內開發可略過 ID
          await window.liff.init({ liffId: "2006935798-e4bVvax4" }); 
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile();
            setLineUser({ name: profile.displayName, picture: profile.pictureUrl });
          }
        }
      } catch (err) {
        console.warn('LIFF init failed', err);
      }

      // 2. Fetch Data
      try {
        const data = await bookingService.fetchAppointments();
        setAppointments(data || []);
      } catch (e) {
        console.error('Fetch error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const currentStylist = useMemo(() => STYLISTS.find(s => s.id === selectedStylistId) || null, [selectedStylistId]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 10; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 20) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const checkSlotAvailability = (time: string) => {
    if (!selectedService) return false;
    
    const checkForStylist = (sid: string) => {
      const stylistBookings = appointments.filter(a => a.stylistId === sid && a.date === selectedDate);
      const requestedStart = parseInt(time.replace(':', ''));
      const duration = selectedService.durationMinutes;
      let endH = parseInt(time.split(':')[0]) + Math.floor((parseInt(time.split(':')[1]) + duration) / 60);
      let endM = (parseInt(time.split(':')[1]) + duration) % 60;
      const requestedEnd = endH * 100 + endM;

      return !stylistBookings.some(b => {
        const bStart = parseInt(b.time.replace(':', ''));
        const bDuration = b.durationMinutes || 60;
        const bEndH = parseInt(b.time.split(':')[0]) + Math.floor((parseInt(b.time.split(':')[1]) + bDuration) / 60);
        const bEndM = (parseInt(b.time.split(':')[1]) + bDuration) % 60;
        const bEnd = bEndH * 100 + bEndM;
        return (requestedStart < bEnd && requestedEnd > bStart);
      });
    };
    
    if (selectedStylistId === 'any') {
      return STYLISTS.some(s => checkForStylist(s.id));
    }
    return checkForStylist(selectedStylistId);
  };

  const handleBookingConfirm = async () => {
    if (!selectedService || !selectedTime) return;
    setIsLoading(true);
    
    let finalStylistId = selectedStylistId;
    if (finalStylistId === 'any') {
      const availableStylist = STYLISTS.find(s => {
        const stylistBookings = appointments.filter(a => a.stylistId === s.id && a.date === selectedDate);
        const requestedStart = parseInt(selectedTime.replace(':', ''));
        const duration = selectedService.durationMinutes;
        let endH = parseInt(selectedTime.split(':')[0]) + Math.floor((parseInt(selectedTime.split(':')[1]) + duration) / 60);
        let endM = (parseInt(selectedTime.split(':')[1]) + duration) % 60;
        const requestedEnd = endH * 100 + endM;
        return !stylistBookings.some(b => {
          const bStart = parseInt(b.time.replace(':', ''));
          const bDuration = b.durationMinutes || 60;
          const bEndH = parseInt(b.time.split(':')[0]) + Math.floor((parseInt(b.time.split(':')[1]) + bDuration) / 60);
          const bEndM = (parseInt(b.time.split(':')[1]) + bDuration) % 60;
          const bEnd = bEndH * 100 + bEndM;
          return (requestedStart < bEnd && requestedEnd > bStart);
        });
      });
      finalStylistId = availableStylist ? availableStylist.id : STYLISTS[0].id;
    }

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: selectedService.id,
      stylistId: finalStylistId,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: selectedService.durationMinutes,
      userName: lineUser?.name || 'LINE訪客'
    };

    try {
      const success = await bookingService.createAppointment(newAppointment);
      if (success) {
        setAppointments(prev => [...prev, newAppointment]);
        setStep(BookingStep.SUCCESS);
      } else {
        alert('預約失敗，時段可能已被搶先一步預約，請重新選擇。');
      }
    } catch (e) {
      alert('系統異常，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && step !== BookingStep.SUCCESS) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-cream-pink">
        <div className="w-12 h-12 border-4 border-pink-100 border-t-[#D86B76] rounded-full animate-spin mb-4"></div>
        <p className="text-[#D86B76] font-bold text-sm tracking-widest">指要妳預約系統準備中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen px-6 py-12 relative">
      {/* Decorative Blobs */}
      <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -top-24 -right-24 w-64 h-64 bg-orange-100/20 rounded-full blur-3xl -z-10"></div>

      <header className="flex justify-between items-center mb-10 animate-slide-up">
        <div className="text-left">
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">指要妳</h1>
          <p className="text-[10px] font-black text-[#D86B76] mt-1 tracking-[0.3em] uppercase opacity-70">Nail Appointment</p>
        </div>
        <div className="flex items-center gap-3">
          {lineUser && (
            <img src={lineUser.picture} className="w-8 h-8 rounded-full border border-pink-200 shadow-sm" alt="profile" />
          )}
          <button 
            onClick={() => setShowMyBookings(!showMyBookings)}
            className="text-xs font-bold px-5 py-2.5 rounded-full bg-white shadow-soft text-[#8F2C2F] active:scale-95 transition-all"
          >
            {showMyBookings ? '返回' : '我的紀錄'}
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {showMyBookings ? (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-black text-gray-800 mb-8 px-1 text-left">您的預約紀錄</h2>
            {appointments.length === 0 ? (
              <div className="text-center py-24 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-pink-100">
                <p className="text-gray-400 italic font-medium">尚無預約資料</p>
              </div>
            ) : (
              appointments.map(appt => (
                <div key={appt.id} className="bg-white p-6 rounded-3xl shadow-soft mb-5 border border-pink-50 flex justify-between items-center">
                  <div className="text-left">
                    <h3 className="font-bold text-[#8F2C2F] mb-1">{SERVICES.find(s => s.id === appt.serviceId)?.name}</h3>
                    <p className="text-xs text-gray-400">📅 {appt.date} <span className="mx-2 opacity-30">|</span> ⏰ {appt.time}</p>
                    <p className="text-[10px] text-gray-400 mt-1">美甲師：{STYLISTS.find(s => s.id === appt.stylistId)?.name || '未指定'}</p>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 bg-green-50 text-green-500 rounded-full uppercase">已確認</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="animate-slide-up">
            {step !== BookingStep.SUCCESS && <ProgressBar step={step} />}

            {step === BookingStep.SERVICE && (
              <div className="space-y-10 pb-24 text-left">
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <div key={catKey}>
                    <h3 className="text-[11px] font-black text-[#D86B76] mb-5 px-1 tracking-[0.2em] uppercase">{label}</h3>
                    {SERVICES.filter(s => s.category === catKey).map(service => (
                      <ServiceCard 
                        key={service.id} 
                        service={service} 
                        selected={selectedService?.id === service.id}
                        onClick={() => setSelectedService(service)}
                      />
                    ))}
                  </div>
                ))}
                <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-20">
                  <button 
                    disabled={!selectedService}
                    onClick={handleNext}
                    className={`w-full py-6 rounded-[2rem] font-black text-white shadow-xl transition-all ${
                      selectedService ? 'bg-gradient-ig active:scale-95' : 'bg-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    下一步：選擇美甲師
                  </button>
                </div>
              </div>
            )}

            {step === BookingStep.STYLIST && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-800 mb-8 px-1 text-left">選擇美甲老師</h2>
                <StylistCard stylist={null} selected={selectedStylistId === 'any'} onClick={() => setSelectedStylistId('any')} />
                {STYLISTS.map(stylist => (
                  <StylistCard key={stylist.id} stylist={stylist} selected={selectedStylistId === stylist.id} onClick={() => setSelectedStylistId(stylist.id)} />
                ))}
                <div className="pt-10 flex gap-4">
                  <button onClick={handleBack} className="flex-1 py-6 rounded-[2rem] font-black text-gray-400 bg-white shadow-soft active:scale-95">返回</button>
                  <button onClick={handleNext} className="flex-[2] py-6 rounded-[2rem] font-black text-white bg-gradient-ig shadow-xl active:scale-95 transition-all">選擇日期</button>
                </div>
              </div>
            )}

            {step === BookingStep.DATE && (
              <div className="space-y-8 text-center">
                <h2 className="text-2xl font-black text-gray-800 mb-8 px-1 text-left">選擇預約日期</h2>
                <div className="bg-white rounded-[3rem] p-12 shadow-soft border border-pink-50">
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-center text-3xl font-black text-[#8F2C2F] outline-none bg-transparent cursor-pointer w-full"
                  />
                </div>
                <div className="pt-10 flex gap-4">
                  <button onClick={handleBack} className="flex-1 py-6 rounded-[2rem] font-black text-gray-400 bg-white shadow-soft active:scale-95">返回</button>
                  <button onClick={handleNext} className="flex-[2] py-6 rounded-[2rem] font-black text-white bg-gradient-ig shadow-xl active:scale-95 transition-all">選擇時段</button>
                </div>
              </div>
            )}

            {step === BookingStep.TIME && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black text-gray-800 mb-8 px-1 text-left">選擇可預約時段</h2>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map(time => {
                    const available = checkSlotAvailability(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className={`py-5 rounded-2xl text-sm font-black transition-all ${
                          isSelected 
                            ? 'bg-gradient-ig text-white shadow-lg scale-105' 
                            : available 
                              ? 'bg-white text-[#8F2C2F] shadow-soft border-2 border-pink-50' 
                              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-10 flex gap-4">
                  <button onClick={handleBack} className="flex-1 py-6 rounded-[2rem] font-black text-gray-400 bg-white shadow-soft active:scale-95">返回</button>
                  <button 
                    disabled={!selectedTime}
                    onClick={handleNext} 
                    className={`flex-[2] py-6 rounded-[2rem] font-black text-white shadow-xl transition-all ${
                      selectedTime ? 'bg-gradient-ig active:scale-95' : 'bg-gray-200 cursor-not-allowed opacity-50'
                    }`}
                  >
                    最後確認
                  </button>
                </div>
              </div>
            )}

            {step === BookingStep.CONFIRM && (
              <div className="space-y-8">
                <h2 className="text-2xl font-black text-gray-800 mb-8 px-1 text-left">確認預約明細</h2>
                <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-pink-50 space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">服務項目</span>
                    <span className="text-[#8F2C2F] font-black text-right max-w-[60%]">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">美甲老師</span>
                    <span className="text-gray-700 font-bold">{currentStylist?.name || '現場分配'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">預約時間</span>
                    <span className="text-gray-700 font-bold underline decoration-pink-200 underline-offset-4">{selectedDate} {selectedTime}</span>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">預計費用</span>
                    <span className="text-3xl font-black text-[#D86B76]">
                       {selectedService?.price === 'quote' ? '現場報價' : `$${selectedService?.price}`}
                    </span>
                  </div>
                </div>
                <div className="pt-10 flex gap-4">
                  <button onClick={handleBack} className="flex-1 py-6 rounded-[2rem] font-black text-gray-400 bg-white shadow-soft active:scale-95">修改</button>
                  <button onClick={handleBookingConfirm} className="flex-[2] py-6 rounded-[2rem] font-black text-white bg-gradient-ig shadow-xl active:scale-95 transition-all">送出預約</button>
                </div>
              </div>
            )}

            {step === BookingStep.SUCCESS && (
              <div className="text-center py-10 animate-slide-up">
                <div className="w-28 h-28 bg-gradient-ig rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-10 shadow-2xl ring-8 ring-pink-50">✓</div>
                <h2 className="text-3xl font-black text-gray-800 mb-4">預約完成！</h2>
                <p className="text-gray-400 mb-12 px-10">您的預約已提交，期待與您見面。您可以隨時在「我的紀錄」查看細節。</p>
                <div className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-pink-50 mb-12 text-left">
                  <p className="text-[#D86B76] font-black text-xl mb-1">{selectedService?.name}</p>
                  <p className="text-gray-600 font-bold text-lg">{selectedDate} {selectedTime}</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-6 rounded-[2rem] font-black text-[#8F2C2F] bg-white border-2 border-pink-50 shadow-soft active:scale-95 transition-all"
                >
                  回首頁
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
