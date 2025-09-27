"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Trophy, ShoppingCart, Check, AlertCircle, Zap } from "lucide-react";

interface Notification {
  id: string;
  type: "MISSION_COMPLETED" | "RANK_UP" | "NEW_MISSION_AVAILABLE" | "PURCHASE_SUCCESS" | "MISSION_APPROVED" | "MISSION_REJECTED";
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationToastProps {
  userId: string;
}

const NOTIFICATION_ICONS = {
  MISSION_COMPLETED: Check,
  RANK_UP: Trophy,
  NEW_MISSION_AVAILABLE: Bell,
  PURCHASE_SUCCESS: ShoppingCart,
  MISSION_APPROVED: Check,
  MISSION_REJECTED: AlertCircle
};

const NOTIFICATION_COLORS = {
  MISSION_COMPLETED: "from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-300",
  RANK_UP: "from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-300",
  NEW_MISSION_AVAILABLE: "from-blue-500/20 to-indigo-500/20 border-blue-400/30 text-blue-300",
  PURCHASE_SUCCESS: "from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-300",
  MISSION_APPROVED: "from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-300",
  MISSION_REJECTED: "from-red-500/20 to-orange-500/20 border-red-400/30 text-red-300"
};

export function NotificationToast({ userId }: NotificationToastProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications?unread=true&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications;
        
        // Show any new notifications that weren't shown before
        const newToShow = newNotifications.filter((n: Notification) => 
          !notifications.find(existing => existing.id === n.id)
        );
        
        if (newToShow.length > 0) {
          setVisibleNotifications(prev => [...prev, ...newToShow]);
          // Auto-hide after 5 seconds
          newToShow.forEach((notification: Notification) => {
            setTimeout(() => {
              removeNotification(notification.id);
            }, 5000);
          });
        }
        
        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const removeNotification = (notificationId: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/users/${userId}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });
      removeNotification(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => {
          const Icon = NOTIFICATION_ICONS[notification.type];
          const colors = NOTIFICATION_COLORS[notification.type];
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{ zIndex: 1000 - index }}
              className={`
                w-80 p-4 rounded-2xl border backdrop-blur-lg pointer-events-auto
                bg-gradient-to-r ${colors}
                shadow-lg shadow-black/20
              `}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-white/80 text-xs leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {/* Special content for rank up */}
                  {notification.type === "RANK_UP" && notification.metadata?.rewards && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                      {notification.metadata.rewards.mana && (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span className="text-xs">+{notification.metadata.rewards.mana} маны</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => markAsRead(notification.id)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Отметить как прочитанное"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
