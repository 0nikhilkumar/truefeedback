import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User.model";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerficationEmail";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest){
    await dbConnect();

    try {
        const reqBody = await request.json();
        const { email, username, password } = reqBody;

        if (!email || !username || !password)
          return NextResponse.json(
            { message: "Please fill all the fields" },
            { status: 401 }
          );

          const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true,
          });
  
          if(existingUserVerifiedByUsername){
              return NextResponse.json({
                  success: false,
                  message: "Username is already taken",
              }, {status: 400});
          }

          //! Method 1 -> 
          // const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

          //! Method 2 ->
          const verifyCode = crypto.randomInt(100000,999999).toString();
          const existingUserByEmail = await UserModel.findOne({email});

          if(existingUserByEmail){
            if(existingUserByEmail.isVerified){
              return NextResponse.json({
                success: false,
                message: "User already exist with this email"
              }, {status: 400});
            }
            else{
              const hashedPassowd = await bcrypt.hash(password, 10);
              existingUserByEmail.password = hashedPassowd;
              existingUserByEmail.verifyCode = verifyCode;
              existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
              await existingUserByEmail.save();
            }
          }
          else{
            const hashedPassowd = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours()  + 1);

            const newUser = new UserModel({
              username,
              email,
              password: hashedPassowd,
              verifyCode,
              verifyCodeExpiry: expiryDate,
              isVerified: false,
              isAcceptingMessage: true,
              messages: [],
            });

            await newUser.save();
          }

          // send verification email
          const emailResponse = await sendVerificationEmail(email, username, verifyCode);

          if(!emailResponse.success){
            return NextResponse.json({
              success: false,
              message: emailResponse.message
            }, {status: 500});
          }

          return NextResponse.json({
            success: true,
            message: "User registerd successfully. Please verify your email"
          }, {status: 201});

    } catch (error) {
        console.error('Error registering user: ', error);
        return NextResponse.json(
          { success: false, message: "Error registering user" },
          { status: 500 }
        );
    }
}