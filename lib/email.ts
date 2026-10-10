import { Resend } from "resend"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Simulating email send to:", to)
    console.log("Email content:", html)
    return { success: true }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    const { data, error } = await resend.emails.send({
      from: "EventHub <onboarding@resend.dev>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend error:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Failed to send email:", err)
    return { success: false, error: err }
  }
}
