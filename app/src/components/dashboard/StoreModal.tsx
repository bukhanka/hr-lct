"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Star, Zap, Package, Award, User, Check, AlertTriangle } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: "MERCH" | "BONUS" | "BADGE" | "AVATAR";
  imageUrl?: string;
  isAvailable: boolean;
}

interface UserPurchase {
  id: string;
  itemId: string;
  purchasedAt: string;
  item: StoreItem;
}

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userMana: number;
  onPurchaseSuccess: (newManaBalance: number) => void;
}

const CATEGORY_ICONS = {
  MERCH: Package,
  BONUS: Zap,
  BADGE: Award,
  AVATAR: User
};

const CATEGORY_LABELS = {
  MERCH: "Мерч",
  BONUS: "Бонусы", 
  BADGE: "Бейджи",
  AVATAR: "Аватары"
};

export function StoreModal({ isOpen, onClose, userId, userMana, onPurchaseSuccess }: StoreModalProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadStoreData();
    }
  }, [isOpen, userId]);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      // Load store items
      const itemsResponse = await fetch("/api/store/items?available=true");
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      }

      // Load user purchases
      const purchasesResponse = await fetch(`/api/users/${userId}/purchases`);
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        setPurchases(purchasesData);
      }
    } catch (error) {
      console.error("Failed to load store data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (itemId: string) => {
    setPurchasingItemId(itemId);
    try {
      const response = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Покупка успешно завершена!" });
        onPurchaseSuccess(result.remainingMana);
        // Refresh purchases
        const purchasesResponse = await fetch(`/api/users/${userId}/purchases`);
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData);
        }
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка при покупке" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Произошла ошибка при покупке" });
    } finally {
      setPurchasingItemId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const isItemOwned = (itemId: string) => {
    return purchases.some(p => p.itemId === itemId);
  };

  const canAffordItem = (price: number) => {
    return userMana >= price;
  };

  const filteredItems = selectedCategory === "ALL" 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const categories = ["ALL", ...Object.keys(CATEGORY_LABELS)];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0b2e] rounded-[24px] border border-indigo-300/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-indigo-300/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Космический магазин</h2>
                  <p className="text-sm text-indigo-200/70">
                    Доступно маны: <span className="font-semibold text-blue-300">{userMana.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mx-6 mt-4 p-3 rounded-lg border ${
                message.type === "success" 
                  ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                  : "bg-red-500/10 border-red-400/30 text-red-300"
              }`}>
                <div className="flex items-center gap-2">
                  {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span className="text-sm">{message.text}</span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {/* Category Tabs */}
              <div className="flex gap-2 p-6 pb-0">
                {categories.map(category => {
                  const Icon = category === "ALL" ? Star : CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                  const label = category === "ALL" ? "Все" : CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                          : "bg-white/5 text-indigo-300/70 hover:bg-white/10 hover:text-indigo-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Items Grid */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map(item => {
                      const Icon = CATEGORY_ICONS[item.category];
                      const owned = isItemOwned(item.id);
                      const canAfford = canAffordItem(item.price);
                      const isPurchasing = purchasingItemId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 transition-all ${
                            owned 
                              ? "bg-emerald-500/10 border-emerald-400/30"
                              : "bg-white/5 border-indigo-300/20 hover:border-indigo-300/40"
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              owned ? "bg-emerald-500/20" : "bg-indigo-500/20"
                            }`}>
                              <Icon className={`w-5 h-5 ${owned ? "text-emerald-400" : "text-indigo-400"}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-white text-sm">{item.name}</h3>
                              <p className="text-xs text-indigo-200/70 mt-1">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-blue-400" />
                              <span className="font-semibold text-white">{item.price}</span>
                            </div>

                            {owned ? (
                              <div className="flex items-center gap-1 text-emerald-300 text-sm">
                                <Check className="w-4 h-4" />
                                <span>Куплено</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePurchase(item.id)}
                                disabled={!canAfford || isPurchasing}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  canAfford
                                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {isPurchasing ? "..." : canAfford ? "Купить" : "Нет маны"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isLoading && filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-indigo-300/50 mx-auto mb-3" />
                    <p className="text-indigo-200/70">В этой категории пока нет товаров</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
