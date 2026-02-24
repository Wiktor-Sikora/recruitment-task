'use client'

import React, { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Treemap, ComposedChart, Bar
} from 'recharts';

import data from '../data.json';

interface TreemapTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: {
            name: string;
            size: number;
        };
        value: number;
    }>;
}

const TreemapTooltip: React.FC<TreemapTooltipProps> = ({active, payload}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-200 shadow rounded text-sm will-change-transform">
                <p className="font-bold">{payload[0].payload.name}</p>
                <p>Revenue: {payload[0].value.toFixed(2)} €</p>
            </div>
        );
    }
    return null;
};

export default function AnalyticsDashboard() {
    const { lineData, treeData, countryData } = useMemo(() => {
        const dailyStats: Record<string, { revenue: number; itemsSold: number }> = {};
        const categoryStats: Record<string, { revenue: number }> = {};
        const countryStats: Record<string, { revenue: number; totalDays: number; count: number }> = {};

        data.orders.forEach(order => {
            const date = order.timestamp.split('T')[0];
            const revenue = order.quantity * order.unitPrice;

            if (!dailyStats[date]) dailyStats[date] = { revenue: 0, itemsSold: 0 };
            dailyStats[date].revenue += revenue;
            dailyStats[date].itemsSold += order.quantity;

            if (!categoryStats[order.category]) categoryStats[order.category] = { revenue: 0 };
            categoryStats[order.category].revenue += revenue;

            if (!countryStats[order.country]) {
                countryStats[order.country] = { revenue: 0, totalDays: 0, count: 0 };
            }
            countryStats[order.country].revenue += revenue;
            countryStats[order.country].totalDays += order.deliveryDays;
            countryStats[order.country].count += 1;
        });

        return {
            lineData: Object.keys(dailyStats).sort().map(date => ({
                date,
                revenue: Number(dailyStats[date].revenue.toFixed(2)),
                itemsSold: dailyStats[date].itemsSold
            })),
            treeData: Object.keys(categoryStats).map(cat => ({
                name: cat,
                size: Number(categoryStats[cat].revenue.toFixed(2))
            })),
            countryData: Object.keys(countryStats).map(country => ({
                country,
                revenue: Number(countryStats[country].revenue.toFixed(2)),
                avgDelivery: Number((countryStats[country].totalDays / countryStats[country].count).toFixed(1))
            })).sort((a, b) => b.revenue - a.revenue)
        };
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
                <p className="text-gray-500">Currency: {data.meta.currency} | Last Updated: {data.meta.generatedAt}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fill: '#6B7280' }} tickMargin={10} />
                                <YAxis tick={{ fill: '#6B7280' }} tickFormatter={(val) => `${val}€`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value, name, props) => [
                                        `${value}€ (Sold: ${props.payload.itemsSold})`,
                                        'Revenue'
                                    ]}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                    name="Revenue (EUR)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={treeData}
                                dataKey="size"
                                aspectRatio={4 / 3}
                                stroke="#fff"
                                fill="#10B981"
                            >
                                <Tooltip content={<TreemapTooltip />} />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Market Performance by Country</h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={countryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="country" />
                                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" tickFormatter={(val) => `€${val}`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Total Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="avgDelivery" name="Avg Delivery (Days)" stroke="#F59E0B" strokeWidth={3} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}