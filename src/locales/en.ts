export default {
  videoCard: {
    deleteVideo: "Delete Video",
    deleteWarning: "⚠️ Warning: This will delete the original file from the media library!",
    deleteConfirm: "Are you sure you want to delete this video?",
    cancel: "Cancel",
    confirmDelete: "Delete",
    mediaType: "Video",
    noOverview: "No overview",
    autoPlayOn: "Auto-play enabled",
    doubleSpeed: "2x Speed",
    videoLoadError: "Failed to load video"
  },
  login: {
    serverAddress: "Server Address",
    username: "Username",
    password: "Password",
    plexToken: "X-Plex-Token",
    plexTokenPlaceholder: "Plex Token",
    submit: "Connect Now",
    embyError: "Connection failed, please check username and password",
    plexError: "Plex login failed",
    language: "Language",
    chinese: "中文",
    english: "English"
  },
  standardRoot: {
    favorites: "Favorites",
    random: "Random",
    latest: "Latest",
    discover: "Discover",
    deleteFailed: "Deletion failed, please check permissions"
  },
  tvRoot: {
    discover: "Home",
    settings: "Settings",
    logout: "Logout",
    latest: "Latest",
    favorites: "Favorites",
    random: "Random"
  },
  librarySelect: {
    title: "Libraries",
    settings: "Settings",
    about: "About",
    all: "All Media",
    display: "Content Filter",
    vertical: "Vertical",
    horizontal: "Horizontal",
    both: "Both",
    account: "Account",
    logout: "Logout",
    visibility: "Library Visibility",
    language: "Language",
    langName: "English",
    tvMode: "Switch to TV Mode",
    tvDesc: "Layout optimized for remote control",
    version: (v: string) => `V ${v}`,
    sponsor: "Support Us",
    sponsorPage: "Sponsorship",
    sponsorText: "If you find this project helpful, consider buying the developer a coffee! Your support will help the project continue to improve and maintain, allowing more people to enjoy a better Emby browsing experience.",
    sponsorThanks: "Thank you for your support! Every contribution will be used for the development and maintenance of the project.",
    back: "Back",
    aboutDesc: "A vertical video browsing client designed for Emby media server, providing a TikTok-like experience that allows users to browse their personal media library in a more modern and convenient way.",
    feature1: "TikTok-style vertical video browsing experience",
    feature2: "Multi-view switching (feed view/grid view)",
    feature3: "Infinite playback + pure mode",
    feature4: "Smart orientation adaptation (vertical/horizontal)",
    feature5: "Enhanced gesture control and 2x speed playback",
    feature6: "TV mode, layout designed for remote control",
    feature7: "TV APK download (Gitee release)",
    sponsorPoint1: "💰 A cup of coffee = Developer motivation",
    sponsorPoint2: "🚀 Your support = Project future",
    sponsorPoint3: "🎉 Every contribution is appreciated",
    projectLink: "Project Link"
  },
  videoFeed: {
    noVideos: "No videos found",
    refresh: "Refresh",
    autoPlayOn: "Auto-play enabled",
    shuffle: "Shuffle"
  },
  tvSettings: {
    account: "Account",
    libs: "Libraries",
    display: "Display",
    about: "About",
    logout: "Logout",
    lang: "Language",
    switch: "Standard",
    currentLang: (lang: string) => `Current: ${lang}`,
    vertical: "Vertical",
    horizontal: "Horizontal",
    both: "Both",
    tvDesc: "Ultimate big-screen media experience. Deep pixel optimization for smart TVs and large displays."
  },
  tvDashboard: {
    libs: "My Libraries",
    added: "Recently Added",
    enter: "Enter"
  },
  tvVideoPlayer: {
    desc: "No description",
    loading: "Loading",
    resume: "Resume",
    favorited: "Favorited",
    favorite: "Favorite",
    muted: "Muted",
    sound: "Sound",
    infinity: "Infinity",
    single: "Single"
  },
  mobileRoot: {
    discover: "Discover",
    deleteFailed: "Deletion failed, please check permissions"
  }
};
