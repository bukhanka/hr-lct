"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FunnelData {
  id: string;
  name: string;
  users_started: number;
  users_completed: number;
  users_in_progress: number;
  users_pending: number;
  completion_rate: number;
  avg_completion_hours?: number;
}

interface FunnelChartProps {
  data: FunnelData[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    fullName: item.name,
    started: item.users_started,
    completed: item.users_completed,
    rate: item.completion_rate,
    color: COLORS[index % COLORS.length]
  }));

  const pieData = data.map((item, index) => ({
    name: item.name,
    value: item.users_completed,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Bar Chart */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Конверсия по миссиям
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="#a5b4fc" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#a5b4fc" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any, name: string) => [
                  value,
                  name === 'started' ? 'Начали' : name === 'completed' ? 'Завершили' : 'Конверсия'
                ]}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="started" fill="#6366f1" name="started" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" name="completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Распределение завершений
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => 
                  percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any) => [value, 'Завершений']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-indigo-100/80 truncate">
                {entry.name}
              </span>
              <span className="text-white ml-auto">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
