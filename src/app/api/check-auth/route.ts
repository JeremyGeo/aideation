import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";


export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (userId) {

      return NextResponse.json({ authenticated: true });
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
