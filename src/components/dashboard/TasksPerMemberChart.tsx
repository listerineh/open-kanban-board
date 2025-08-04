'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Task, KanbanUser } from '@/types/kanban';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type TasksPerMemberChartProps = {
  tasks: Task[];
  members: KanbanUser[];
};

export function TasksPerMemberChart({ tasks, members }: TasksPerMemberChartProps) {
  const chartData = useMemo(() => {
    const memberTaskCounts: Record<string, number> = {};

    tasks.forEach((task) => {
      const assigneeIds = task.assigneeIds || (task.assignee ? [task.assignee] : []);
      if (assigneeIds.length > 0) {
        assigneeIds.forEach((assigneeId) => {
          memberTaskCounts[assigneeId] = (memberTaskCounts[assigneeId] || 0) + 1;
        });
      } else {
        memberTaskCounts.unassigned = (memberTaskCounts.unassigned || 0) + 1;
      }
    });

    return members
      .map((member) => ({
        name: member.displayName?.split(' ')[0] ?? member.email,
        tasks: memberTaskCounts[member.uid] || 0,
      }))
      .concat(memberTaskCounts.unassigned > 0 ? [{ name: 'Unassigned', tasks: memberTaskCounts.unassigned }] : [])
      .filter((d) => d.tasks > 0);
  }, [tasks, members]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks per Member</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No assigned tasks to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks per Member</CardTitle>
        <CardDescription>Total number of tasks assigned to each project member.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
              <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
