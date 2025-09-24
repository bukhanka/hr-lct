import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import Link from "next/link";

export const metadata = {
  title: "Войти | Алабуга: Командный Центр",
};

export default function SignInPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-3xl border border-white/10 bg-black/30 p-10 text-white shadow-2xl">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Выберите роль для входа
          </h1>
          <p className="text-sm text-indigo-100/75">
            Это мок-аутентификация без базы данных. Сессия заполняется в зависимости от выбранной роли.
          </p>
        </div>
        <RoleSwitcher />
        <p className="text-center text-xs text-indigo-100/60">
          Вернуться на <Link href="/" className="underline">главную</Link>
        </p>
      </div>
    </main>
  );
}

