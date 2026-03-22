import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from loguru import logger


async def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send an email via SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def _otp_email_html(name: str, otp: str, purpose: str) -> str:
    purpose_text = {
        "email_verification": "verify your email address",
        "password_reset": "reset your password",
    }.get(purpose, "complete your request")

    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body {{ font-family: Georgia, serif; background: #FAF6F0; margin: 0; padding: 0; }}
    .container {{ max-width: 560px; margin: 40px auto; background: white; border: 1px solid #E8D5A3; }}
    .header {{ background: #1A0E05; padding: 32px; text-align: center; }}
    .header h1 {{ color: #C9A96E; font-size: 22px; letter-spacing: 4px; margin: 0; }}
    .header p {{ color: #E8D5A3; font-size: 11px; letter-spacing: 2px; margin: 6px 0 0; }}
    .body {{ padding: 40px; }}
    .body h2 {{ color: #3D2314; font-size: 20px; margin-bottom: 16px; }}
    .body p {{ color: #7A6355; line-height: 1.7; margin-bottom: 16px; }}
    .otp-box {{ background: #FAF6F0; border: 2px solid #C9A96E; text-align: center;
               padding: 24px; margin: 28px 0; border-radius: 2px; }}
    .otp-code {{ font-size: 40px; font-weight: bold; color: #1A0E05; letter-spacing: 12px;
                font-family: 'Courier New', monospace; }}
    .otp-note {{ font-size: 12px; color: #7A6355; margin-top: 8px; }}
    .footer {{ background: #FAF6F0; padding: 20px; text-align: center; border-top: 1px solid #E8D5A3; }}
    .footer p {{ font-size: 11px; color: #7A6355; margin: 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RATNAMAYURI</h1>
      <p>LUXURY JEWELLERY &amp; SILK SAREES</p>
    </div>
    <div class="body">
      <h2>Hello, {name} 🙏</h2>
      <p>You requested to {purpose_text}. Use the OTP below to proceed:</p>
      <div class="otp-box">
        <div class="otp-code">{otp}</div>
        <p class="otp-note">Valid for {settings.OTP_EXPIRE_MINUTES} minutes. Do not share this with anyone.</p>
      </div>
      <p>If you did not request this, please ignore this email or contact our support team immediately.</p>
    </div>
    <div class="footer">
      <p>© 2025 Ratnamayuri · Made with ♡ in India</p>
    </div>
  </div>
</body>
</html>
"""


def _order_confirmation_html(order_number: str, name: str, items: list, total: float) -> str:
    items_html = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #E8D5A3'>{i['name']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #E8D5A3;text-align:center'>{i['qty']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #E8D5A3;text-align:right'>₹{i['price']:,.0f}</td></tr>"
        for i in items
    )
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body {{ font-family: Georgia, serif; background: #FAF6F0; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E8D5A3; }}
    .header {{ background: #1A0E05; padding: 32px; text-align: center; }}
    .header h1 {{ color: #C9A96E; font-size: 22px; letter-spacing: 4px; margin: 0; }}
    .body {{ padding: 40px; }}
    .order-num {{ color: #C9A96E; font-size: 13px; letter-spacing: 2px; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    th {{ background: #FAF6F0; padding: 10px 8px; text-align: left; color: #3D2314;
          font-size: 11px; letter-spacing: 2px; border-bottom: 2px solid #C9A96E; }}
    .total-row {{ font-weight: bold; color: #1A0E05; font-size: 16px; }}
    .footer {{ background: #FAF6F0; padding: 20px; text-align: center; border-top: 1px solid #E8D5A3; }}
    .footer p {{ font-size: 11px; color: #7A6355; margin: 4px 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RATNAMAYURI</h1>
    </div>
    <div class="body">
      <h2 style="color:#3D2314">Order Confirmed! 🎉</h2>
      <p class="order-num">ORDER #{order_number}</p>
      <p style="color:#7A6355">Dear {name}, thank you for your order. We will process it shortly.</p>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>{items_html}</tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2" style="padding:12px 8px">Total</td>
            <td style="padding:12px 8px;text-align:right">₹{total:,.0f}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color:#7A6355">You can track your order from your account dashboard.</p>
    </div>
    <div class="footer">
      <p>© 2025 Ratnamayuri · Made with ♡ in India</p>
      <p>Questions? Reply to this email or contact support@ratnamayuri.live</p>
    </div>
  </div>
</body>
</html>
"""


async def send_otp_email(email: str, name: str, otp: str, purpose: str = "email_verification") -> bool:
    subject_map = {
        "email_verification": "Verify your Ratnamayuri account",
        "password_reset": "Reset your Ratnamayuri password",
    }
    subject = subject_map.get(purpose, "Your Ratnamayuri OTP")
    html = _otp_email_html(name, otp, purpose)
    text = f"Your OTP is: {otp}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes."
    return await send_email(email, subject, html, text)


async def send_order_confirmation_email(
    email: str, name: str, order_number: str, items: list, total: float
) -> bool:
    subject = f"Order Confirmed — #{order_number} | Ratnamayuri"
    html = _order_confirmation_html(order_number, name, items, total)
    text = f"Your order #{order_number} has been confirmed. Total: ₹{total:,.0f}"
    return await send_email(email, subject, html, text)
