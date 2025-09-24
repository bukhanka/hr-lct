import { MetricCard, Section, Table } from "./widgets";

const approvalQueue = [
  ["Кадет А. Вектор", "Экспедиция · Периметр", "QR подтвержден", "Одобрить"],
  ["Кадет С. Шунт", "Лекция · Навигация", "Фото загружено", "Проверка"],
  ["Кадет Л. Квазар", "Тест · Симулятор", "Оценка 78%", "Отправить на пересдачу"],
];

export function OfficerOverview() {
  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">
          Панель офицера миссий
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Сменa · 6 офлайн событий · 24 подтверждения
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Ожидают подтверждения" value="11" description="+3 новые заявки" />
        <MetricCard title="Выполнено сегодня" value="28" description="Среднее время: 2 мин" />
        <MetricCard title="Инциденты" value="0" description="Все проверки прошли успешно" />
      </div>

      <Section title="Очередь заявок">
        <Table
          columns={["Кадет", "Миссия", "Подтверждение", "Действие"]}
          rows={approvalQueue.map((row, index) =>
            row.map((cell, idx) => (
              <span
                key={`${index}-${idx}`}
                className={idx === 3 ? "text-indigo-300" : undefined}
              >
                {cell}
              </span>
            ))
          )}
        />
      </Section>

      <Section title="Активные мероприятия">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Лекция · Навигация</p>
            <p className="mt-3 text-white">Аудитория 3D-05 · 14:00</p>
            <p className="mt-3 text-xs text-indigo-100/70">
              QR-код активен. Назначено 2 офицера. Нагрузка: 32 кадета.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Экспедиция · Периметр</p>
            <p className="mt-3 text-white">Полевой лагерь · 18:00</p>
            <p className="mt-3 text-xs text-indigo-100/70">
              Подтверждение через QR + фото. 12 заявок ожидают проверки.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

