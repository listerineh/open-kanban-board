'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Project } from '@/types/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TaskStatusChartProps = {
  project: Project;
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
];

export function TaskStatusChart({ project }: TaskStatusChartProps) {
  const chartData = useMemo(() => {
    return project.columns.map((column) => ({
      name: column.title,
      value: column.tasks.length,
    }));
  }, [project]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Distribution by Status</CardTitle>
        <CardDescription>Number of tasks in each column of the board.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                stroke="hsl(var(--background))"
                fill="hsl(var(--primary))"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                itemStyle={{
                  color: 'white',
                }}
              />
              <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
