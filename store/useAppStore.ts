import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";

const storage = createMMKV();

// ============ Interfaces ============
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: number;
  createdAt: number;
  priority?: "low" | "medium" | "high";
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  streak: number;
  lastCompletedDate?: number;
  createdAt: number;
  frequency?: "daily" | "weekly" | "monthly";
  color?: string;
  priority?: "low" | "medium" | "high";
}

interface AppState {
  mode: "study" | "coding";
  toggleMode: () => void;
  selectDay: number;
  setSelectDay: (day: number) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  getTodayTasks: () => Task[];

  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  completeHabit: (id: string) => void;
  resetHabitStreak: (id: string) => void;
}

const today = new Date().getDate();

const loadFromStorage = <T>(key: string): T[] => {
  const data = storage.getString(key);
  if (!data) return [];
  try {
    return JSON.parse(data) as T[];
  } catch {
    return [];
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  mode: (storage.getString("app_mode") as "study" | "coding") || "study",
  toggleMode: () =>
    set((state) => {
      const nextMode = state.mode === "study" ? "coding" : "study";
      storage.set("app_mode", nextMode);
      return { mode: nextMode };
    }),
  selectDay: today,
  setSelectDay: (day: number) => {
    storage.set("select_day", day);
    set({ selectDay: day });
  },

  // ============ Tasks Management ============
  tasks: loadFromStorage<Task>("tasks"),
  addTask: (task) =>
    set((state) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      const updatedTasks = [...state.tasks, newTask];
      storage.set("tasks", JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    }),
  removeTask: (id: string) =>
    set((state) => {
      const updatedTasks = state.tasks.filter((task) => task.id !== id);
      storage.set("tasks", JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    }),
  updateTask: (id: string, updates: Partial<Task>) =>
    set((state) => {
      const updatedTasks = state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      );
      storage.set("tasks", JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    }),
  toggleTaskComplete: (id: string) =>
    set((state) => {
      const updatedTasks = state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      );
      storage.set("tasks", JSON.stringify(updatedTasks));
      return { tasks: updatedTasks };
    }),
  getTodayTasks: () => {
    const { tasks } = get();
    return tasks.filter((task) => !task.completed);
  },

  // ============ Habits Management ============
  habits: loadFromStorage<Habit>("habits"),
  addHabit: (habit) =>
    set((state) => {
      const newHabit: Habit = {
        ...habit,
        id: Date.now().toString(),
        createdAt: Date.now(),
        streak: 0,
        priority: habit.priority || "medium",
      };
      const updatedHabits = [...state.habits, newHabit];
      storage.set("habits", JSON.stringify(updatedHabits));
      return { habits: updatedHabits };
    }),
  removeHabit: (id: string) =>
    set((state) => {
      const updatedHabits = state.habits.filter((habit) => habit.id !== id);
      storage.set("habits", JSON.stringify(updatedHabits));
      return { habits: updatedHabits };
    }),
  updateHabit: (id: string, updates: Partial<Habit>) =>
    set((state) => {
      const updatedHabits = state.habits.map((habit) =>
        habit.id === id ? { ...habit, ...updates } : habit,
      );
      storage.set("habits", JSON.stringify(updatedHabits));
      return { habits: updatedHabits };
    }),
  completeHabit: (id: string) =>
    set((state) => {
      const updatedHabits = state.habits.map((habit) => {
        if (habit.id === id) {
          const today = new Date().toDateString();
          const lastCompleted = habit.lastCompletedDate
            ? new Date(habit.lastCompletedDate).toDateString()
            : null;

          return {
            ...habit,
            streak: lastCompleted === today ? habit.streak : habit.streak + 1,
            lastCompletedDate: Date.now(),
          };
        }
        return habit;
      });
      storage.set("habits", JSON.stringify(updatedHabits));
      return { habits: updatedHabits };
    }),
  resetHabitStreak: (id: string) =>
    set((state) => {
      const updatedHabits = state.habits.map((habit) =>
        habit.id === id
          ? { ...habit, streak: 0, lastCompletedDate: undefined }
          : habit,
      );
      storage.set("habits", JSON.stringify(updatedHabits));
      return { habits: updatedHabits };
    }),
}));
