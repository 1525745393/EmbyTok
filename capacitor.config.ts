import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.embytok.app',
  appName: 'EmbyTok',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // 关键：在电视端尝试使用 http 方案以匹配大多数内网服务器
    allowNavigation: ['*'], // 允许访问所有域名
  },
  plugins: {
    CapacitorHttp: {
      enabled: false, // 暂时禁用，改用原生 Web Fetch 以提高视频流兼容性
    },
  },
};

export default config;
