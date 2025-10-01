"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  CheckCircle, 
  TrendingUp, 
  Star, 
  ShoppingBag,
  AlertCircle,
  XCircle,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationCenterProps {
  userId: string;
}

const notificationIcons: Record<string, any> = {
  MISSION_COMPLETED: CheckCircle,
  RANK_UP: TrendingUp,
  NEW_MISSION_AVAILABLE: Sparkles,
  PURCHASE_SUCCESS: ShoppingBag,
  MISSION_APPROVED: Star,
  MISSION_REJECTED: XCircle
};

const notificationColors: Record<string, string> = {
  MISSION_COMPLETED: "text-emerald-400 bg-emerald-500/10 border-emerald-400/20",
  RANK_UP: "text-yellow-400 bg-yellow-500/10 border-yellow-400/20",
  NEW_MISSION_AVAILABLE: "text-indigo-400 bg-indigo-500/10 border-indigo-400/20",
  PURCHASE_SUCCESS: "text-purple-400 bg-purple-500/10 border-purple-400/20",
  MISSION_APPROVED: "text-green-400 bg-green-500/10 border-green-400/20",
  MISSION_REJECTED: "text-red-400 bg-red-500/10 border-red-400/20"
};

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true })
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5 text-indigo-200" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#0b0924] border-l border-white/10 z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Уведомления
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-indigo-200" />
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Загрузка..." : "Отметить все прочитанными"}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto custom-scroll">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <AlertCircle className="w-12 h-12 text-indigo-300/50 mb-3" />
                    <p className="text-indigo-200/70">Нет уведомлений</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      const colorClass = notificationColors[notification.type] || "text-indigo-400 bg-indigo-500/10 border-indigo-400/20";

                      return (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            notification.isRead
                              ? "bg-white/5 border-white/10 hover:bg-white/10"
                              : `${colorClass} hover:brightness-110`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${notification.isRead ? "bg-white/10" : "bg-white/20"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-medium ${notification.isRead ? "text-indigo-100" : "text-white"}`}>
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${notification.isRead ? "text-indigo-200/60" : "text-indigo-100/80"}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-indigo-200/50 mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { 
                                  addSuffix: true, 
                                  locale: ru 
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

