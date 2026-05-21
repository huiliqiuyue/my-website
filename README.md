<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
<img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite" alt="Vite 7">
<img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind 4">
<img src="https://img.shields.io/badge/Supabase-FFDG03?logo=supabase" alt="Supabase">
<img src="https://img.shields.io/badge/GitHub_Pages-Free-222222?logo=github" alt="GitHub Pages">

# 🏠 个人网站

一个功能丰富的个人网站 —— 博客 · 游戏 · 音乐 · 作品展 · 用户管理

[**🌐 在线访问**](https://huiliqiuyue.github.io/my-website/) &nbsp;|&nbsp; [GitHub](https://github.com/huiliqiuyue/my-website)

</div>

---

## ✨ 功能一览

| 📝 **博客** | 🎮 **游戏** | 🎵 **音乐** | 🤖 **AI 陪伴** |
|:---:|:---:|:---:|:---:|
| Markdown 编辑 | 贪吃蛇 | 播放/暂停 | 角色扮演 |
| 代码高亮 | 2048 | 进度拖拽 | 场景联动 |
| 分类 & 标签 | 扫雷 | 音量调节 | 沉浸全屏 |
| 搜索 & 评论 | 无限跑酷 | 文件上传 | 装扮商店 |

| 🐱 **桌面宠物** | 👤 **用户系统** |
|:---:|:---:|
| 3D 立体猫娘 | 邮箱注册/登录 |
| 拖拽移动 | 三级角色 |
| 点击聊天 | 个人资料（头像） |
| 表情动画 | 封禁/VIP/管理 |
| 🎨 **作品展** | 🛡️ **权限** |
| 上传 HTML | 管理员全权限 |
| 安全沙盒 | VIP可封禁 |
| 全屏预览 | 用户发文章 |

---

## 🎯 快速开始

```bash
git clone https://github.com/huiliqiuyue/my-website.git
cd my-website
npm install
cp .env.example .env   # 编辑填入 Supabase 凭据
npm run dev             # http://localhost:5173
```

---

## 🗄️ Supabase 配置

<details>
<summary><b>📌 点击展开完整配置步骤</b></summary>

### 1️⃣ 创建项目

注册 [supabase.com](https://supabase.com) → 新建项目 → **Settings → API** 中复制 `URL` 和 `anon key`

### 2️⃣ 环境变量

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=你的key
VITE_DEEPSEEK_KEY=sk-你的DeepSeek密钥  # AI 桌面宠物 + AI 聊天
```

### 3️⃣ 初始化数据库

在 Supabase **SQL Editor** 中依次运行：

**步骤 A：** 运行 [`supabase-schema.sql`](./supabase-schema.sql)（核心表结构 + 默认管理员）

> 🔑 默认管理员：`huiliqiuyue@gmail.com` / `1234567890`

**步骤 B：** 运行以下完整 SQL（扩展功能）：

```sql
-- 🖼️ 头像字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 🗂️ 头像存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "anyone_view_avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "auth_upload_avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 🎵 音乐存储桶 & 表
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "anyone_view_music" ON storage.objects FOR SELECT USING (bucket_id = 'music');
CREATE POLICY "auth_upload_music" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music' AND auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, artist TEXT DEFAULT '未知', url TEXT NOT NULL,
  added_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_music_table" ON music FOR SELECT USING (true);
CREATE POLICY "admin_vip_add_music" ON music FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vip'))
);
CREATE POLICY "admin_vip_delete_music" ON music FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vip'))
);

-- 💬 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT NOT NULL, author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_comments" ON comments FOR SELECT USING (true);
CREATE POLICY "auth_create_comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "own_or_admin_delete_comments" ON comments FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 🎨 HTML 作品表
CREATE TABLE IF NOT EXISTS html_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT DEFAULT '', author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE html_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_view_projects" ON html_projects FOR SELECT USING (true);
CREATE POLICY "auth_create_projects" ON html_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "own_or_admin_update_projects" ON html_projects FOR UPDATE USING (
  auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "own_or_admin_delete_projects" ON html_projects FOR DELETE USING (
  auth.uid() = author_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 🚫 封禁功能
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- 🔑 管理员/VIP 更新其他用户
CREATE POLICY "admin_vip_update_profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vip'))
);

-- ⭐ VIP 角色
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'vip', 'user'));

-- 📝 关于页字段
ALTER TABLE about_content ADD COLUMN IF NOT EXISTS github TEXT DEFAULT '';
ALTER TABLE about_content ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- 👤 注册时插入 profile
CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 4️⃣ 关闭邮箱验证

Supabase → **Authentication → Settings** → 关闭 **Confirm email** → Save

</details>

---

## 🔐 角色权限

| 功能 | 👤 用户 | ⭐ VIP | 🛡️ 管理员 |
|:---|---:|:---:|:---:|
| 浏览博客 / 游戏 / 音乐 | ● | ● | ● |
| 写文章 / 评论 | ● | ● | ● |
| 上传 HTML 作品 | ● | ● | ● |
| 修改个人资料（头像） | ● | ● | ● |
| 添加 / 删除音乐 | ○ | ● | ● |
| 封禁 / 解封普通用户 | ○ | ● | ● |
| 设置用户为 VIP | ○ | ○ | ● |
| 编辑「关于我」 | ○ | ○ | ● |
| 管理所有文章 | ○ | ○ | ● |

> ● 可用 &nbsp;&nbsp; ○ 不可用

---

## 🎵 B站音频导入（可选）

部署 Cloudflare Worker 代理以支持 B站 音频直链解析：

```bash
npx wrangler deploy worker-bili.js --name bili-proxy --compatibility-date 2026-05-21
```

在 `.env` 中添加 Worker 地址：

```env
VITE_BILI_PROXY=https://bili-proxy.你的账号.workers.dev
```

---

## 🚀 部署

项目配置了 GitHub Actions 自动部署。

1. 仓库 **Settings → Pages** → Source → **GitHub Actions**
2. 推送 `main` 分支 → 自动构建部署

---

## 📂 项目结构

```
📁 Blog/
 ├── 📁 .github/workflows/    → CI/CD 自动部署
 ├── 📁 public/               → 静态资源
 ├── 📁 src/
 │   ├── 📁 components/       → 通用组件
 │   │   ├── AuthGuard.jsx       路由守卫
 │   │   ├── BlogCard.jsx        文章卡片
 │   │   ├── CommentSection.jsx  评论区
 │   │   ├── FloatingPet.jsx     桌面猫娘宠物
 │   │   ├── Footer.jsx          页脚
 │   │   ├── Layout.jsx          布局壳
 │   │   └── Navbar.jsx          导航栏 + 用户菜单
 │   ├── 📁 contexts/
 │   │   └── AuthContext.jsx     认证上下文
 │   ├── 📁 games/            → 游戏引擎（纯函数）
 │   │   ├── 2048/engine.js
 │   │   ├── minesweeper/engine.js
 │   │   └── snake/engine.js
 │   ├── 📁 hooks/
 │   │   └── usePosts.js         文章数据
 │   ├── 📁 lib/
 │   │   └── supabase.js         Supabase 客户端
 │   ├── 📁 pages/            → 页面
 │   │   ├── About.jsx           关于我（管理员可编辑）
 │   │   ├── AdminUsers.jsx      用户管理（封禁/VIP）
 │   │   ├── BlogEditor.jsx      文章编辑器
 │   │   ├── BlogList.jsx        文章列表
 │   │   ├── BlogPost.jsx        文章详情 + 评论
 │   │   ├── Game2048.jsx        2048 游戏
 │   │   ├── GamesHub.jsx        游戏中心
 │   │   ├── Home.jsx            首页
 │   │   ├── HtmlProjectEditor.jsx  HTML 编辑器
 │   │   ├── HtmlProjectView.jsx  HTML 作品查看
 │   │   ├── HtmlShowcase.jsx    作品展示
 │   │   ├── Login.jsx           登录 / 注册
 │   │   ├── MinesweeperGame.jsx 扫雷
 │   │   ├── MusicPlayer.jsx     音乐播放器
 │   │   ├── NotFound.jsx        404
 │   │   ├── ProfileSettings.jsx 个人资料（头像）
 │   │   └── SnakeGame.jsx       贪吃蛇
 │   ├── 📁 utils/
 │   │   └── readingTime.js      阅读时间
 │   ├── App.jsx                 路由配置
 │   ├── index.css               全局样式 + Tailwind
 │   └── main.jsx                入口
 ├── supabase-schema.sql        核心数据库结构
 ├── worker-bili.js              Cloudflare Worker
 ├── vite.config.js              Vite 配置
 └── README.md
```

---

## 🛠️ 技术栈

| 分类 | 技术 |
|:---|:---|
| 🏗️ 框架 | React 19、Vite 7 |
| 🎨 样式 | Tailwind CSS 4、highlight.js |
| 🧭 路由 | React Router 7 (HashRouter) |
| 📝 内容 | react-markdown、remark-gfm、rehype-highlight |
| 🗄️ 后端 | Supabase（认证 + PG 数据库 + 存储） |
| 🚀 部署 | GitHub Pages + GitHub Actions |
| 🌐 代理 | Cloudflare Worker（B站 音频） |

---

<div align="center">
Made with ❤️ &nbsp;|&nbsp; <a href="https://github.com/huiliqiuyue/my-website">GitHub</a>
</div>
