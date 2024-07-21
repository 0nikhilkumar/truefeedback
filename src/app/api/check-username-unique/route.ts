import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User.model";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

const UsernameQuerySchema = z.object({
    username: usernameValidation
});

export async function GET(request: Request) {

    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const queryParam = {
            username: searchParams.get('username'),
        }

        // validation with zod

        const result = UsernameQuerySchema.safeParse(queryParam);

        if(!result.success){
            const usernameErrors = result.error.format().username?._errors || [];
            return Response.json(
              {
                success: false,
                message:
                  usernameErrors?.length > 0
                    ? usernameErrors.join(', ')
                    : "Invalid query parameters",
              },
              { status: 400 }
            );
        }

        const { username } = result.data;

        const existingVerifiedUser = await UserModel.findOne({username, isVerified: true});
        if(existingVerifiedUser){
            return Response.json({
                success: false,
                message: 'Username is already taken'
            }, {status: 200});
        }

        return Response.json({
            success: true,
            message: 'Username is Unique'
        }, {status: 200});

    } catch (error: any) {
        console.error("Error while checking username: ", error);
        return Response.json({
            success: false,
            message: "Checking username failed"
        }, {status: 500});
    }
}