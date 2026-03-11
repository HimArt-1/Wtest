import { getSiteSettings } from "@/app/actions/settings";
import LinkClient from "./LinkClient";

export const metadata = {
  title: "وشّى | روابط التواصل",
  description: "جميع روابط وحسابات منصة وشّى في مكان واحد.",
};

export default async function LinkPage() {
  const settings = await getSiteSettings();
  
  const config = settings.brand_assets || {
    social_instagram: "@wusha.art",
    social_twitter: "@wusha_art",
    social_tiktok: "@wusha.art",
    social_snapchat: "@wusha.art",
    social_whatsapp: "+966532235005"
  };

  return <LinkClient config={config} />;
}
