import { z } from "zod";

export const signInVerification = z.object({
    email: z.string().email({message: "Invalid email address"}),
    password: z.string(),
})
