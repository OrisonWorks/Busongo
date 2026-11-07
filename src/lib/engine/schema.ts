import { z } from "zod";
import { INDICATORS, type IndicatorId } from "./series";

const ids = INDICATORS.map((i) => i.id) as [IndicatorId, ...IndicatorId[]];
export const operandSchema = z.object({ ind: z.enum(ids), period: z.number().int().min(1).max(1000).optional(), value: z.number().optional(), shift: z.number().int().min(0).max(250).optional() });
export const condSchema = z.object({ left: operandSchema, op: z.enum(["gt", "lt", "gte", "lte", "crossAbove", "crossBelow"]), right: operandSchema });
