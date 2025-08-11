'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Project, Task } from '@/types/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants';

type TaskStatusChartProps = {
  project: Project;
  tasks: Task[];
};

export function TaskStatusChart({ project, tasks }: TaskStatusChartProps) {
  const chartData = useMemo(() => {
    return project.columns.map((column) => ({
      name: column.title,
      value: tasks.filter((t) => t.columnId === column.id).length,
    }));
  }, [project, tasks]);

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
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
