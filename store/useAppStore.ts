import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

interface   AppState {
  mode: 'study' | 'coding';
  toggleMode: () => void; // دالة لتبديل الوضع بين الدراسة والبرمجة
  selectDay: number; // اليوم المحدد
  setSelectDay: (day: number) => void; // دالة لتحديث اليوم المحدد
}
const today = new Date().getDate();

export const useAppStore = create<AppState>((set) => ({
  mode: (storage.getString('app_mode') as 'study' | 'coding') || 'study',
  toggleMode: () => set((state) => {
    const nextMode = state.mode === 'study' ? 'coding' : 'study';
    storage.set('app_mode', nextMode);
    return { mode: nextMode };
  }),
  selectDay: today,
  setSelectDay: (day: number) => {
    storage.set('select_day', day);
    set({ selectDay: day });
  },
}));