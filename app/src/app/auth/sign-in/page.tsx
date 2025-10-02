import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import Link from "next/link";

export const metadata = {
  title: "Войти | Алабуга: Командный Центр",
};

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-3xl border border-white/10 bg-black/30 p-8 text-white shadow-2xl backdrop-blur-sm lg:p-12">
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
              Выберите пользователя для входа
            </h1>
            <p className="text-sm text-indigo-100/75 lg:text-base">
              Мок-аутентификация для тестирования. Выберите любого пользователя из seed данных.
            </p>
            <p className="text-xs text-indigo-200/60">
              💡 Пользователи сгруппированы по статусу активности и типу кампании
            </p>
          </div>
          <RoleSwitcher />
          <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-6">
            <p className="text-center text-xs text-indigo-100/60">
              Вернуться на <Link href="/" className="underline hover:text-white">главную</Link>
            </p>
            <span className="text-indigo-300/30">•</span>
            <p className="text-xs text-indigo-200/40">
              Всего пользователей: 17 тестовых + 110 в базе
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

