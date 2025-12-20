
import React, { useState, useEffect, useMemo } from 'react';
import { BookingStep, Service, Stylist, Appointment } from './types';
import { SERVICES, STYLISTS, CATEGORY_LABELS } from './constants';
import { bookingService } from './services/api';

// --- Sub-components ---

const ProgressBar: React.FC<{ step: BookingStep }> = ({ step }) => {
  const percentage = (step / 5) * 100;
  return (
    <div className="w-full bg-white h-1.5 rounded-full mb-6 overflow-hidden shadow-sm">
      <div 
        className="h-full bg-[#ea5548] transition-all duration-500 ease-out" 
        style={{ width: `${Math.min(percentage, 100)}%` }} 
      />
    </div>
  );
};

const ServiceCard: React.FC<{ service: Service, selected: boolean, onClick: () => void }> = ({ service, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center mb-3 ${
      selected ? 'border-[#ea5548] bg-white shadow-md scale-[1.02]' : 'border-white bg-white hover:border-gray-200'
    }`}
  >
    <div>
      <h4 className="font-bold text-gray-700">{service.name}</h4>
      <p className="text-xs text-gray-400 mt-1">預計時長：{service.durationMinutes} 分鐘</p>
    </div>
    <div className="text-[#8F2C2F] font-bold">
      {typeof service.price === 'number' ? `$${service.price}` : '現場報價'}
    </div>
  </div>
);

const StylistCard: React.FC<{ stylist: Stylist | null, selected: boolean, onClick: () => void }> = ({ stylist, selected, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center mb-3 ${
      selected ? 'border-[#ea5548] bg-white shadow-md scale-[1.02]' : 'border-white bg-white hover:border-gray-200'
    }`}
  >
    <div className={`w-14 h-14 rounded-full flex-shrink-0 mr-4 overflow-hidden border-2 ${selected ? 'border-[#ea5548]' : 'border-gray-100'}`}>
      {stylist ? (
        <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#ea5548] flex items-center justify-center text-white font-bold text-xs text-center p-1">不指定</div>
      )}
    </div>
    <div>
      <h4 className="font-bold text-gray-700 text-lg">{stylist?.name || '不指定美甲老師'}</h4>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [step, setStep] = useState<BookingStep>(BookingStep.SERVICE);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('any'); 
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);

  useEffect(() => {
    if (bookingService.isConfigured()) {
      bookingService.fetchAppointments().then(setAppointments);
    }
  }, []);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 6));
  const handleBack = () => {
    if (step === BookingStep.SERVICE) return;
    setStep(prev => prev - 1);
  };

  const currentStylist = useMemo(() => {
    return STYLISTS.find(s => s.id === selectedStylistId) || null;
  }, [selectedStylistId]);

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
    
    const startTime = time;
    const duration = selectedService.durationMinutes;
    
    const checkAvailabilityForStylist = (sid: string) => {
      const stylistBookings = appointments.filter(a => a.stylistId === sid && a.date === selectedDate);
      const requestedStart = parseInt(startTime.replace(':', ''));
      const durationHours = Math.floor(duration / 60);
      const durationMins = duration % 60;
      let endH = parseInt(startTime.split(':')[0]) + durationHours;
      let endM = parseInt(startTime.split(':')[1]) + durationMins;
      if (endM >= 60) { endH += 1; endM -= 60; }
      const requestedEnd = endH * 100 + endM;

      return !stylistBookings.some(b => {
        const bStart = parseInt(b.time.replace(':', ''));
        const bDuration = b.durationMinutes;
        let bEndH = parseInt(b.time.split(':')[0]) + Math.floor(bDuration / 60);
        let bEndM = parseInt(b.time.split(':')[1]) + (bDuration % 60);
        if (bEndM >= 60) { bEndH += 1; bEndM -= 60; }
        const bEnd = bEndH * 100 + bEndM;
        return requestedStart < bEnd && requestedEnd > bStart;
      });
    };

    if (selectedStylistId === 'any') {
      return STYLISTS.some(s => checkAvailabilityForStylist(s.id));
    } else {
      return checkAvailabilityForStylist(selectedStylistId);
    }
  };

  const handleBookingConfirm = async () => {
    if (!selectedService || !selectedTime) return;
    setIsLoading(true);
    
    let finalStylistId = selectedStylistId;
    if (selectedStylistId === 'any') {
      const available = STYLISTS.find(s => {
        const stylistBookings = appointments.filter(a => a.stylistId === s.id && a.date === selectedDate);
        return !stylistBookings.some(b => b.time === selectedTime); 
      });
      finalStylistId = available?.id || STYLISTS[0].id;
    }

    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: selectedService.id,
      stylistId: finalStylistId,
      date: selectedDate,
      time: selectedTime,
      durationMinutes: selectedService.durationMinutes,
      userName: '林小姐'
    };

    const success = await bookingService.createAppointment(newAppointment);
    if (success) {
      setAppointments(prev => [...prev, newAppointment]);
      setStep(BookingStep.SUCCESS);
    } else {
      alert('預約失敗，該時段可能剛剛被訂走了，請重新選擇時段。');
      setStep(BookingStep.TIME);
    }
    setIsLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('確定要取消此預約嗎？')) return;
    setIsLoading(true);
    await bookingService.cancelAppointment(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    setIsLoading(false);
  };

  const resetBooking = () => {
    setStep(BookingStep.SERVICE);
    setSelectedService(null);
    setSelectedStylistId('any');
    setSelectedTime(null);
  };

  return (
    <div className="min-h-screen app-bg-gray pb-12 px-4 pt-6">
      {/* Configuration Alert */}
      {!bookingService.isConfigured() && (
        <div className="max-w-md mx-auto mb-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded shadow-sm animate-pulse" role="alert">
          <p className="font-bold">⚠️ 系統尚未連線</p>
          <p className="text-xs">請在 <code className="bg-white px-1">api.ts</code> 中貼上您的 GAS 部署網址，否則預約功能將無法運作。</p>
        </div>
      )}

      {/* Header */}
      <header className="max-w-md mx-auto flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">指要妳 <span className="text-[#ea5548]">Just ForYou Nail salon</span></h1>
          <p className="text-xs text-gray-500">預約您的專屬美麗時段</p>
        </div>
        <button 
          onClick={() => setShowMyBookings(!showMyBookings)}
          className="text-xs font-bold px-4 py-2 rounded-full border border-gray-200 text-[#8F2C2F] bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          {showMyBookings ? '返回預約' : '我的預約'}
        </button>
      </header>

      <main className="max-w-md mx-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-3xl backdrop-blur-[2px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ea5548] mx-auto"></div>
              <p className="mt-4 text-[#8F2C2F] font-bold">處理中，請稍候...</p>
            </div>
          </div>
        )}

        {showMyBookings ? (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
              <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
              我的預約記錄
            </h2>
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                <p className="text-gray-400 italic">目前沒有預約記錄</p>
                <button 
                  onClick={() => setShowMyBookings(false)}
                  className="mt-4 text-[#ea5548] font-bold underline"
                >
                  現在就去預約吧！
                </button>
              </div>
            ) : (
              appointments.map(appt => {
                const svc = SERVICES.find(s => s.id === appt.serviceId);
                const sty = STYLISTS.find(s => s.id === appt.stylistId);
                return (
                  <div key={appt.id} className="bg-white p-5 rounded-3xl shadow-sm mb-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs bg-gray-50 text-[#8F2C2F] px-2 py-1 rounded-lg font-bold">預約成功</span>
                        <h3 className="font-bold text-gray-700 mt-2 text-lg">{svc?.name}</h3>
                      </div>
                      <button 
                        onClick={() => handleCancel(appt.id)}
                        className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                      >
                        取消預約
                      </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-4">
                      <div className="flex items-center">日期: {appt.date}</div>
                      <div className="flex items-center">時間: {appt.time}</div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-600">
                      <img src={sty?.image} className="w-6 h-6 rounded-full mr-2 border border-gray-100" />
                      老師：{sty?.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="pb-8">
            {step !== BookingStep.SUCCESS && <ProgressBar step={step} />}

            {step === BookingStep.SERVICE && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
                  選擇服務項目
                </h2>
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <div key={catKey} className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 mb-3 px-1 tracking-wider">{label}</h3>
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
                
                <div className="mt-8">
                  <button 
                    disabled={!selectedService}
                    onClick={handleNext}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                      selectedService ? 'bg-[#ea5548] active:bg-[#fbdac8] active:scale-95' : 'bg-gray-300'
                    }`}
                  >
                    下一步：選擇老師
                  </button>
                </div>
              </div>
            )}

            {step === BookingStep.STYLIST && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
                  選擇美甲老師
                </h2>
                <StylistCard 
                  stylist={null} 
                  selected={selectedStylistId === 'any'}
                  onClick={() => setSelectedStylistId('any')}
                />
                <div className="h-4"></div>
                {STYLISTS.map(stylist => (
                  <StylistCard 
                    key={stylist.id} 
                    stylist={stylist} 
                    selected={selectedStylistId === stylist.id}
                    onClick={() => setSelectedStylistId(stylist.id)}
                  />
                ))}
                
                <div className="mt-8 flex gap-3">
                  <button onClick={handleBack} className="w-1/3 py-4 rounded-2xl font-bold text-gray-400 bg-white border border-gray-100 shadow-sm">返回</button>
                  <button onClick={handleNext} className="flex-1 py-4 rounded-2xl font-bold text-white bg-[#ea5548] active:bg-[#fbdac8] shadow-lg active:scale-95">下一步：日期</button>
                </div>
              </div>
            )}

            {step === BookingStep.DATE && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
                  選擇預約日期
                </h2>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6 text-center">
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-center text-2xl font-bold text-[#8F2C2F] outline-none bg-transparent"
                  />
                </div>
                <div className="text-center text-gray-400 text-sm bg-white/50 py-4 rounded-2xl">
                  <p>您選擇的老師是：<span className="text-[#ea5548] font-bold">{currentStylist?.name || '不指定'}</span></p>
                  <p className="mt-1">服務項目：<span className="text-[#ea5548] font-bold">{selectedService?.name}</span></p>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={handleBack} className="w-1/3 py-4 rounded-2xl font-bold text-gray-400 bg-white border border-gray-100 shadow-sm">返回</button>
                  <button onClick={handleNext} className="flex-1 py-4 rounded-2xl font-bold text-white bg-[#ea5548] active:bg-[#fbdac8] shadow-lg active:scale-95">下一步：時段</button>
                </div>
              </div>
            )}

            {step === BookingStep.TIME && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
                  選擇預約時段
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {timeSlots.map(time => {
                    const available = checkSlotAvailability(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                          isSelected 
                            ? 'bg-[#ea5548] text-white border-transparent shadow-md' 
                            : available 
                              ? 'bg-white text-[#ea5548] border-gray-100 hover:border-[#ea5548]' 
                              : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {time}
                        {!available && <div className="text-[10px] font-normal">已額滿</div>}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button onClick={handleBack} className="w-1/3 py-4 rounded-2xl font-bold text-gray-400 bg-white border border-gray-100 shadow-sm">返回</button>
                  <button 
                    disabled={!selectedTime}
                    onClick={handleNext} 
                    className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                      selectedTime ? 'bg-[#ea5548] active:bg-[#fbdac8] active:scale-95' : 'bg-gray-300'
                    }`}
                  >
                    下一步：最後確認
                  </button>
                </div>
              </div>
            )}

            {step === BookingStep.CONFIRM && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-[#8F2C2F] rounded-full mr-3"></span>
                  預約明細確認
                </h2>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  {[
                    ['預約人', '林小姐 (LINE 用戶)', 'text-gray-700'],
                    ['服務項目', selectedService?.name, 'text-gray-700 font-bold'],
                    ['美甲老師', currentStylist?.name || '不指定 (現場分配)', 'text-[#8F2C2F] font-bold'],
                    ['預約日期', selectedDate, 'text-gray-700'],
                    ['預約時間', selectedTime, 'text-gray-700'],
                  ].map(([label, value, valueClass], idx) => (
                    <div key={idx} className="flex justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <span className="text-gray-400 text-sm">{label}</span>
                      <span className={valueClass}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 border-t border-gray-100">
                    <span className="text-gray-400">預估費用</span>
                    <span className="font-bold text-[#8F2C2F] text-xl">
                      {typeof selectedService?.price === 'number' ? `$${selectedService.price}` : '依現場報價'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 px-4 text-[10px] text-gray-400 text-center leading-relaxed">
                  點擊確認預約即代表同意美甲店服務條款。<br/>
                  如需取消請於預約時間前 24 小時於系統內操作。
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={handleBack} className="w-1/3 py-4 rounded-2xl font-bold text-gray-400 bg-white border border-gray-100 shadow-sm">返回修改</button>
                  <button onClick={handleBookingConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-[#ea5548] active:bg-[#fbdac8] shadow-lg active:scale-95">確認送出預約</button>
                </div>
              </div>
            )}

            {step === BookingStep.SUCCESS && (
              <div className="animate-fade-in text-center py-10">
                <div className="w-24 h-24 bg-gray-50 text-[#ea5548] rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner border border-gray-100">
                  OK
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">預約完成！</h2>
                <p className="text-gray-500 mb-8 px-8 text-sm">
                  我們已收到您的預約申請，系統已自動為您保留時段。期待與您見面！
                </p>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 text-left max-w-xs mx-auto">
                  <div className="text-[10px] text-gray-300 mb-2">預約編號: #{Math.floor(Math.random()*100000)}</div>
                  <div className="font-bold text-gray-700">{selectedService?.name}</div>
                  <div className="text-[#ea5548] mt-1 font-bold">{selectedDate} {selectedTime}</div>
                </div>
                <button 
                  onClick={resetBooking}
                  className="w-full max-w-xs py-4 rounded-2xl font-bold text-[#8F2C2F] border-2 border-gray-100 hover:bg-gray-50 transition-all active:bg-gray-100"
                >
                  回首頁
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-md mx-auto mt-12 text-center text-gray-300 text-[10px] pb-10">
        &copy; 2024 指要妳 Just ForYou Nail salon. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
