import "../global.css";
import "../i18next/i18n";
import { Stack, router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useEffect, useState, useRef } from "react";
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

// إبقاء السبلاش التابع للنظام ظاهراً حتى يجهز التطبيق
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const { isDarkMode, checkAndResetDailyHabits, cancelPastDueNotifications } =
    useAppStore();

  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isMounted = useRef(false);

  // 1. التهيئة الأولية وتغيير الثيم
  useEffect(() => {
    setColorScheme(isDarkMode ? "dark" : "light");
  }, [isDarkMode, setColorScheme]);

  useEffect(() => {
    try {
      checkAndResetDailyHabits();
      cancelPastDueNotifications();

      setupNotificationChannels().catch((e) =>
        console.warn("Channel setup failed:", e),
      );
      requestExactAlarmIfNeeded().catch((e) =>
        console.warn("Exact alarm check failed:", e),
      );
    } catch (e) {
      console.warn("Init error:", e);
    }
  }, [checkAndResetDailyHabits, cancelPastDueNotifications]);

  // 2. فحص المصادقة (Auth Session)
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

    supabase.auth
      .getSession()
      .then(({ data }) => {
        applySessionUser(data.session);
        useAppStore.getState().refreshProfileFromServer();
      })
      .catch((e) => console.warn("Failed to restore auth session:", e))
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionUser(session);
      if (session?.user) {
        useAppStore.getState().refreshProfileFromServer();
        useAppStore.getState().syncPendingProfile();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. التوجيه (Guard & Router) بعد انتهاء السبلاش والمصادقة
  useEffect(() => {
    // لا تنفذ التوجيه إلا إذا ركبت الـ Component وانتهى فحص المصادقة والـ Splash
    if (!isSplashAnimationDone || isAuthLoading) return;

    const user = useAppStore.getState().user;
    const hasSeenOnboarding = storage.getBoolean(
      STORAGE_KEYS.hasSeenOnboarding,
    );

    if (!hasSeenOnboarding) {
      router.replace("/onboarding/StuScreen");
    } else if (!user) {
      router.replace("/Auth/Login");
    } else {
      router.replace("/");
    }
  }, [isSplashAnimationDone, isAuthLoading]);

  // 4. الإشعارات
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
      },
    );
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {/* نضمن رندر الـ Stack دائماً في الشجرة */}
        <Stack screenOptions={{ headerShown: false }} />

        {/* عرض السبلاش المخصص فوق الـ Stack حتى ينتهي */}
        {(!isSplashAnimationDone || isAuthLoading) && (
          <CustomSplashScreen
            onFinish={() => {
              SplashScreen.hideAsync().catch(() => {});
              setIsSplashAnimationDone(true);
            }}
          />
        )}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
