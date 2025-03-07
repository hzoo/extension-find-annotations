import { DisplayMode } from "@/lib/pushMode";

export const sidebarClasses = {
  // Push mode specific styles
  mode: {
    overlay: "fixed top-0 right-0 z-[9999] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md",
    push: "sticky top-0 self-start z-[10000]"
  },
  
  header: {
    wrapper: "sticky top-0 z-10 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800",
    container: "flex items-center justify-between",
    title: "text-lg font-semibold text-gray-900 dark:text-gray-100",
    buttons: "flex gap-2",
    button: "p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
  },

  collapsed: {
    button: "fixed top-1/2 right-4 -translate-y-1/2 bg-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-[9999]"
  }
}; 