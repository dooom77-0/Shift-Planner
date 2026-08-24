import "../global.css";
import "../i18next/i18n";
import { Stack, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect, useState } from "react";
import { useColorScheme } from "nativewind";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/supabase";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import CustomSplashScreen from "../components/SplashScreen";
import { storage, STORAGE_KEYS } from "@/src/services/storage";
import {
  setupNotificationChannels,
  requestExactAlarmIfNeeded,
} from "@/src/services/notificationService";

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const { isDarkMode, checkAndResetDailyHabits, cancelPastDueNotifications } = useAppStore();
  const [appIsReady, setAppIsReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // ✅ حالة انتهاء فحص المصادقة

  useEffect(() => {
    async function handleSplashAndReady() {
      try {
        await SplashScreen.preventAutoHideAsync();
        
        checkAndResetDailyHabits();
        cancelPastDueNotifications();

        setupNotificationChannels().catch((e) =>
          console.warn("Channel setup failed:", e)
        );
        requestExactAlarmIfNeeded().catch((e) =>
          console.warn("Exact alarm check failed:", e)
        );
        
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
     
    handleSplashAndReady();
  }, [checkAndResetDailyHabits, cancelPastDueNotifications]);

  useEffect(() => {
    setColorScheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode, setColorScheme]);

  // ───── Auth session → store binding ─────
  useEffect(() => {
    let active = true;
    const applySessionUser = (session: Session | null) => {
      if (!active) return;
      const user = session?.user;
      if (user) {
        useAppStore.getState().setUser({
          id: user.id,
          email: user.email ?? undefined,
          username: (user.user_metadata?.username as string) ?? undefined,
          fullName: (user.user_metadata?.full_name as string) ?? undefined,
          avatarUrl: (user.user_metadata?.avatar_url as string) ?? undefined,
        });
      } else {
        useAppStore.getState().setUser(null);
      }
    };

    // Restore the persisted session on app start
    supabase.auth
      .getSession()
      .then(({ data }) => {
        applySessionUser(data.session);
        useAppStore.getState().refreshProfileFromServer();
      })
      .catch((e) => console.warn("Failed to restore auth session:", e))
      .finally(() => {
        if (active) setIsAuthLoading(false); // ✅ اكتمل فحص الجلسة بنجاح
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySessionUser(session);
        if (session?.user) {
          useAppStore.getState().refreshProfileFromServer();
          useAppStore.getState().syncPendingProfile();
        }
      }
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ───── Auth & Onboarding Routing Guard ─────
useEffect(() => {
  // 1. انتظر حتى يجهز التطبيق وتنتهي عملية الفحص الأولية للمصادقة
  if (!appIsReady || isAuthLoading) return;

  const user = useAppStore.getState().user;
  const hasSeenOnboarding = storage.getBoolean(STORAGE_KEYS.hasSeenOnboarding);

  // 2. إذا لم يشاهد الأونبوردنج
  if (!hasSeenOnboarding) {
    router.replace("/onboarding/StuScreen");
    return;
  }

  // 3. التوجيه الذكي بناءً على حالة تسجيل الدخول
  if (!user) {
    router.replace("/Auth/Login");
  } else {
    router.replace("/");
  }
}, [appIsReady, isAuthLoading]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response.notification.request.content.data as any;
          if (data?.itemId) {
            const mode: "study" | "coding" | "faith" =
              data.mode === "coding"
                ? "coding"
                : data.mode === "faith"
                  ? "faith"
                  : "study";
            const type = data.notificationType === "habit" ? "habit" : "task";
            useAppStore.getState().setMode(mode);
            useAppStore
              .getState()
              .setPendingOpenItem({ id: data.itemId, type });
            router.replace("/");
          }
        } catch (e) {
          console.warn("Notification response handling error:", e);
        }
      }
    );
    return () => sub.remove();
  }, []);

  // 🛑 إبقاء شاشة التحميل حتى تكتمل جميع الفحوصات
  if (!appIsReady || isAuthLoading) {
    return <CustomSplashScreen onFinish={() => setAppIsReady(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}