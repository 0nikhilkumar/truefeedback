import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User.model";
import { z } from "zod";
import { verifySchema } from "@/schemas/verifySchema";

// const verifyCodeWithZod = z.object({
//     verifyCode: verifySchema
// });

export async function POST(request: Request){
    await dbConnect();

    try {
        const { username, code } = await request.json();
        const decodedUsername = decodeURIComponent(username);
        // Validation with zod
        // const result = verifyCodeWithZod.safeParse(code);
        // if(!result.success){
        //     const verifyCodeErrors = result.error.format().verifyCode?._errors || [];
        //     return Response.json({
        //         success: false,
        //         message: verifyCodeErrors.length > 0 ? verifyCodeErrors.join(',') : 'Invalid verifyCode'
        //     }, {status: 400});
        // }

        const user = await UserModel.findOne({username: decodedUsername});

        if(!user){
            return Response.json({
                success: false,
                Error: "User not found"
            }, {status: 400});
        }

        const isCodeValid = user.verifyCode === code;
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

        if(isCodeValid && isCodeNotExpired){
            user.isVerified = true;
            await user.save();
            return Response.json({
                success: true,
                Error: "Account verified successfully"
            }, {status: 200});
        }
        else if(!isCodeNotExpired){
            return Response.json({
                success: false,
                Error: "Verification as expired please sign up again"
            }, {status: 400});
        }
        else {
            return Response.json({
                success: false,
                Error: "Incorrect Verification code"
            }, {status: 400});
        }

    } catch (error: any) {
        console.error("Verifying Code Error: ", error);
        return Response.json({
            success: false,
            Error: "Verify Code Error"
        }, {status: 500});
    }
}