import { View, TouchableOpacity, Image } from "react-native";
import Text from "@/src/components/ScaledText";
import React from "react";
import { router } from "expo-router";
import { useAppStore } from "../../store/useAppStore";
import { useTranslation } from "react-i18next";

const StuScreen = () => {
    const { isDarkMode } = useAppStore();

  const handleNext = () => {
    router.push("/Auth/Register");
  }; 

  const { t } = useTranslation();
 
  return (
    <View className={"flex-1" + (isDarkMode ? " bg-screen-dark" : " bg-screen-light")}>

      <View className="flex-1 justify-center items-center px-8">
        {/* App Icon , switch on study mode */}
        <Image
          source={require("../../assets/images/AI Quran.png")}
          className="w-56 h-56 rounded-[30px]"
          resizeMode="contain"
         />

        {/* PLACE YOUR TITLE TEXT STYLES HERE */}
        <Text className={"text-2xl text-center font-bold mt-6" + (isDarkMode ? " text-faith-dark-interactive" : " text-study-header")}>
          {t("onboarding.FaithTitle")}
        </Text>

        {/* PLACE YOUR DESCRIPTION TEXT STYLES HERE */}
        <Text className={"text-base text-center mt-3 " + (isDarkMode ? " text-faith-dark-interactive/70" : " text-study-header/70")}>
          {t("onboarding.FaithDesc")}
        </Text>

        {/* PLACE YOUR PAGE INDICATOR / DOTS HERE */}
        <View className="flex-row mt-8">
          <View className={"w-6 h-2 rounded-full mx-1" + (isDarkMode ? " bg-faith-dark-interactive" : " bg-study-header")} />
          <View className={"w-2 h-2 rounded-full mx-1" + (isDarkMode ? " bg-white" : " bg-black")} />
          <View className={"w-2 h-2 rounded-full mx-1" + (isDarkMode ? " bg-white" : " bg-black")} />
        </View>

        {/* PLACE YOUR NEXT BUTTON STYLES HERE */}
        <TouchableOpacity
          onPress={handleNext}
          className={"mt-12 py-4 px-12 rounded-full w-full items-center" + (isDarkMode ? " bg-faith-dark-interactive" : " bg-faith-header")}
        >
          <Text className={" text-lg font-bold" + (isDarkMode ? " text-study-header" : " text-white")}>{t("onboarding.GetStarted")}</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

export default StuScreen;