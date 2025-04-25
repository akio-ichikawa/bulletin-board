import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'パスワードリセットのご案内',
    text: `
パスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：
${resetUrl}

このリンクは1時間後に無効となります。

このメールに心当たりがない場合は、無視してください。
    `,
    html: `
      <h1>パスワードリセットのご案内</h1>
      <p>パスワードリセットのリクエストを受け付けました。</p>
      <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>このリンクは1時間後に無効となります。</p>
      <p>このメールに心当たりがない場合は、無視してください。</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('メールの送信に失敗しました');
  }
}; 