'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

export function OverviewLineChart({ data }: ChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            activeDot={{ r: 8 }}
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EventBarChart({ data }: ChartProps) {
  const COLORS = ['#6366F1', '#F59E0B', '#EC4899', '#F97316', '#10B981', '#8B5CF6', '#06B6D4'];

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="event"
            type="category"
            width={100}
            tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentPieChart({ data }: ChartProps) {
  const COLORS = {
    verified: '#10B981', // green
    pending: '#F59E0B', // amber
    rejected: '#EF4444', // red
  };

  const STATUS_LABELS = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface LegendEntry {
    payload?: {
      status?: string;
    };
  }
  // ... (wait, I should just remove it if it's unused, or prefix with _ if I want to keep it. The user said it is unused. I will just remove it.)

  const RADIAN = Math.PI / 180;

  interface LabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: LabelProps) => {
    const rInner = innerRadius || 0;
    const rOuter = outerRadius || 0;
    const mAngle = midAngle || 0;
    const cX = cx || 0;
    const cY = cy || 0;
    const pct = percent || 0;

    const radius = rInner + (rOuter - rInner) * 0.5;
    const x = cX + radius * Math.cos(-mAngle * RADIAN);
    const y = cY + radius * Math.sin(-mAngle * RADIAN);

    return pct > 0 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cX ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(pct * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status as keyof typeof COLORS] || '#9CA3AF'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value, entry: any) => {
              const status = entry.payload?.status;
              return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
