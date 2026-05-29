import nodemailer from "nodemailer";

// 创建邮件发送器（支持 QQ邮箱、163邮箱、Gmail 等）
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.qq.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  // 检测占位符或空值
  const isPlaceholder =
    !user ||
    !pass ||
    user.includes("your-email") ||
    user.includes("your-email@qq.com") ||
    pass.includes("your-auth-code");

  const isConfigured = user && !isPlaceholder && pass && !pass.includes("your-auth-code");

  if (!isConfigured) {
    console.error("❌ 邮件服务未配置！请在 .env 中设置真实的 SMTP_USER 和 SMTP_PASS");
    return null; // 返回 null，调用方应处理此情况
  }

  // 国内邮箱（QQ/126/163/yeah/sina/sohu等）统一需要额外 TLS 配置
  const domesticHosts = [
    "qq.com", "126.com", "163.com", "yeah.net",
    "sina.com", "sina.cn", "sohu.com", "foxmail.com",
    "aliyun.com",
  ];
  const isDomestic = domesticHosts.some((d) => host.includes(d));

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...(isDomestic
      ? {
          tls: { rejectUnauthorized: false },
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      : {}),
  });
}

// 发送验证码邮件
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ success: boolean; sent: boolean; error?: string }> {
  const transporter = createTransporter();

  // 如果未配置邮件服务，验证码仅输出到控制台（开发模式）
  if (!transporter) {
    console.log(`\n📧 [开发模式] 验证码: ${to} → ${code}\n`);
    return { success: true, sent: false }; // 成功但未实际发送邮件
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    to,
    subject: "【禺山高级中学校园墙】邮箱验证码",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;">
        <div style="background: linear-gradient(135deg, #6366f1, #818cf8); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 8px;">🎓</div>
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">禺山高级中学校园墙</h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0;">邮箱验证码</p>
        </div>
        <div style="background: #fff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
            你正在注册禺山高级中学校园墙账号，验证码如下：
          </p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6366f1; font-family: 'SF Mono', 'Consolas', 'Courier New', monospace;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.6;">
            验证码 5 分钟内有效，请勿泄露给他人。<br/>
            如非本人操作，请忽略此邮件。
          </p>
        </div>
        <div style="text-align: center; padding: 16px;">
          <p style="color: #cbd5e1; font-size: 11px; margin: 0;">禺山高级中学校园墙 · 分享校园生活</p>
        </div>
      </div>
    `,
    text: `【禺山高级中学校园墙】\n\n你的验证码是：${code}\n\n验证码 5 分钟内有效，请勿泄露给他人。\n如非本人操作，请忽略此邮件。`,
  };

  try {
    await transporter.verify();
    await transporter.sendMail(mailOptions);
    console.log(`📧 验证码已发送到 ${to}`);
    return { success: true, sent: true };
  } catch (error: any) {
    console.error(`❌ 发送验证码到 ${to} 失败:`, error.message);
    return {
      success: false,
      sent: false,
      error: `邮件发送失败: ${error.message}`,
    };
  }
}
