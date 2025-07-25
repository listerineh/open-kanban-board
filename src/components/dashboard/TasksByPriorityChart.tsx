'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Task } from '@/types/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TasksByPriorityChartProps = {
  tasks: Task[];
};

const COLORS = {
  Urgent: 'hsl(var(--destructive))',
  High: 'hsl(var(--warning))',
  Medium: 'hsl(var(--primary))',
  Low: 'hsl(var(--muted-foreground))',
};

const priorities: Task['priority'][] = ['Urgent', 'High', 'Medium', 'Low'];

export function TasksByPriorityChart({ tasks }: TasksByPriorityChartProps) {
  const chartData = useMemo(() => {
    const priorityCounts = tasks.reduce(
      (acc, task) => {
        const priority = task.priority || 'Medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return priorities
      .map((p) => ({
        name: p!,
        value: priorityCounts[p!] || 0,
      }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No tasks with priorities to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Priority</CardTitle>
        <CardDescription>Breakdown of tasks by their assigned priority level.</CardDescription>
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
                outerRadius={80}
                stroke="hsl(var(--background))"
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
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
