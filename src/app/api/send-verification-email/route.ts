// app/api/send-verification-email/route.ts

import { VerifyEmailTemplate } from "@/components/EmailTemplates/verify-email";
import { Resend } from "resend";
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: Request) {
  const { firstName, email, verificationUrl } = await request.json();

  try {
    const { data, error } = await resend.emails.send({
      from: "ProteinBind <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your email",
      react: await VerifyEmailTemplate({ firstName, verificationUrl }),
    });

    if (error) {
      console.log(error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.log(error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
