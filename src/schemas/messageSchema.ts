import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(10, { message: "Content Must be at least 10 characters" })
    .max(300, { message: "Content not more than 300 characters" }),
});
