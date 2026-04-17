// Disabled shadcn chart wrapper — using recharts directly in this project.
export type ChartConfig = Record<string, { label?: string; color?: string }>;
export const ChartContainer = (() => null) as unknown as React.FC<{ children?: React.ReactNode }>;
export const ChartTooltip = (() => null) as unknown as React.FC;
export const ChartTooltipContent = (() => null) as unknown as React.FC;
export const ChartLegend = (() => null) as unknown as React.FC;
export const ChartLegendContent = (() => null) as unknown as React.FC;
export const ChartStyle = (() => null) as unknown as React.FC;
import * as React from "react";
