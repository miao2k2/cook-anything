import "server-only";

/**
 * Gửi mã xác nhận qua email.
 *
 * Nếu có RESEND_API_KEY thì dùng Resend, ngược lại mã được in ra console
 * để tiện trong môi trường dev/test.
 */

type SendResult = { devCode?: string };

export async function sendLoginCode({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(
      `[planner] Mã xác nhận cho ${to}: ${code} (chưa cấu hình RESEND_API_KEY)`,
    );
    return { devCode: code };
  }

  const from = process.env.MAIL_FROM || "Planner <no-reply@example.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Mã xác nhận đăng nhập Planner",
        text: `Mã xác nhận 6 số của bạn là: ${code}\nMã có hiệu lực trong 10 phút.`,
        html: `<p>Mã xác nhận 6 số của bạn là:</p>
<p style="font-size:28px;font-weight:800;letter-spacing:6px">${code}</p>
<p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p>`,
      }),
    });

    if (!res.ok) {
      console.error("[planner] Gửi email thất bại:", await res.text());
      return { devCode: code };
    }
  } catch (error) {
    console.error("[planner] Lỗi gửi email:", error);
  }

  return {};
}
