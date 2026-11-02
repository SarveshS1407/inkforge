export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    url?: string;
    cleartext?: boolean;
    androidScheme?: string;
  };
  android?: {
    allowMixedContent?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: "com.inkforge.app",
  appName: "INKFORGE",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://inkforge-sigma.vercel.app",
    cleartext: true,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
