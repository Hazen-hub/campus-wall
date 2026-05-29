import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 填充种子数据...\n");

  const demoPassword = await bcrypt.hash("demo123", 12);

  // 管理员
  await prisma.user.upsert({
    where: { email: "admin@campus.com" },
    update: {},
    create: { username: "禺山管理员", email: "admin@campus.com", password: await bcrypt.hash("admin123", 12), role: "admin", grade: "教师", className: "校务处", mustChangePassword: true },
  });

  // 演示用户（带年级班级）
  const users = [
    { username: "高一二班小林", email: "xiaolin@demo.com", grade: "高一", className: "2班" },
    { username: "高三学霸", email: "xueba@demo.com", grade: "高三", className: "1班" },
    { username: "文艺少年", email: "wenyi@demo.com", grade: "高二", className: "5班" },
    { username: "理科小王子", email: "like@demo.com", grade: "高二", className: "3班" },
    { username: "篮球队长", email: "lanqiu@demo.com", grade: "高三", className: "7班" },
    { username: "美术生小陈", email: "meishu@demo.com", grade: "高一", className: "8班" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: demoPassword, role: "user" },
    });
  }
  console.log(`✅ ${users.length} 个演示用户`);

  // 演示帖子（带分类）
  const posts = [
    { content: "📢 本周五下午3点操场举行校园文化节开幕式！社团表演+美食摊位，欢迎来玩 🎉", category: "general", isAnonymous: false },
    { content: "分享今天的校园晚霞🌅 橙红色天空太美了，跑步的同学变成剪影，这就是青春啊", category: "general", isAnonymous: false },
    { content: "捡到一张学生卡！姓名张小明，学号20230156，请失主联系我领取 🙏", category: "lostfound", isAnonymous: false },
    { content: "数学压轴题解题思路分享：1.审题 2.画图 3.多角度思考 4.检查合理性。一起加油💪", category: "ask", isAnonymous: false },
    { content: "食堂今天麻辣香锅太好吃了！阿姨说以后每周三都有🌶️", category: "joke", isAnonymous: true },
    { content: "有没有人一起拼单买数学五三？三人成团便宜20块", category: "trade", isAnonymous: false },
    { content: "偷偷表白图书馆经常坐窗边的那个穿白衬衫的男生...希望你看到了这个帖子 💕", category: "love", isAnonymous: true },
    { content: "高二物理期中考试范围是到第几章啊？求告知😭", category: "ask", isAnonymous: true },
    { content: "出二手羽毛球拍一副，九成新，50块，高一二班自取 🏸", category: "trade", isAnonymous: false },
    { content: "作业写到凌晨一点还没写完，老师你们商量过作业量吗 😂", category: "joke", isAnonymous: true },
  ];

  const allUsers = await prisma.user.findMany({ where: { role: "user" } });
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    await prisma.post.create({
      data: {
        content: post.content,
        category: post.category,
        isAnonymous: post.isAnonymous,
        authorId: allUsers[i % allUsers.length].id,
      },
    });
  }
  console.log(`✅ ${posts.length} 个演示帖子（含各分类和匿名帖）`);

  // 敏感词
  const words = ["傻逼", "fuck", "shit", "cnm", "艹你妈", "草泥马", "sb", "妈的", "他妈的"];
  for (const w of words) {
    await prisma.sensitiveWord.upsert({ where: { word: w }, update: {}, create: { word: w } });
  }
  console.log(`✅ ${words.length} 个敏感词`);

  console.log("\n🎉 完成！管理员: admin@campus.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
