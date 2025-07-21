/**
 * PDF查看器组件 - 通用配置和类型定义
 */

// PDF查看器配置选项
export const DEFAULT_VIEWER_OPTIONS = {
  enableDownload: true,
  enablePrint: true,
  enableFullscreen: true,
  enableZoom: true,
  enableSearch: true,
  enableHighlight: true,
  enableNavigation: true,
  debugger: false,
  initialPage: 1,
  viewerPath: "/build/generic/web/viewer.html",
  timeout: 15000,
  responsive: true,
  theme: "light", // 'light' | 'dark'
};

// 侧边栏面板类型
export const SIDEBAR_PANELS = {
  NAVIGATION: "navigation",
  SEARCH: "search",
  HIGHLIGHTS: "highlights",
  INFO: "info",
  CUSTOM: "custom",
};

// 事件类型定义
export const PDF_EVENTS = {
  // 查看器生命周期
  VIEWER_READY: "viewer-ready",
  DOCUMENT_LOADED: "document-loaded",
  DOCUMENT_ERROR: "document-error",

  // 页面相关
  PAGE_CHANGED: "page-changed",
  ZOOM_CHANGED: "zoom-changed",

  // 高亮相关
  HIGHLIGHT_CREATED: "highlight-created",
  HIGHLIGHT_REMOVED: "highlight-removed",
  HIGHLIGHT_UPDATED: "highlight-updated",
  HIGHLIGHTS_CHANGED: "highlights-changed",

  // 搜索相关
  SEARCH_STARTED: "search-started",
  SEARCH_FOUND: "search-found",
  SEARCH_NOT_FOUND: "search-not-found",

  // 交互相关
  TEXT_SELECTED: "text-selected",
  ANNOTATION_CREATED: "annotation-created",

  // 状态变化
  LOADING_STATE_CHANGED: "loading-state-changed",
  ERROR_OCCURRED: "error-occurred",
};

// 组件尺寸预设
export const SIZE_PRESETS = {
  SMALL: { width: 800, height: 600 },
  MEDIUM: { width: 1200, height: 800 },
  LARGE: { width: 1600, height: 1000 },
  FULLSCREEN: { width: "100vw", height: "100vh" },
};

// 主题配置
export const THEME_CONFIG = {
  light: {
    token: {
      colorPrimary: "#1890ff",
      colorSuccess: "#52c41a",
      colorWarning: "#faad14",
      colorError: "#f5222d",
      colorInfo: "#1890ff",
      borderRadius: 6,
      wireframe: false,
    },
  },
  dark: {
    algorithm: "darkAlgorithm",
    token: {
      colorPrimary: "#1890ff",
      colorBgContainer: "#141414",
      colorBgElevated: "#1f1f1f",
      colorText: "#ffffff",
      colorTextSecondary: "#a6a6a6",
    },
  },
};
