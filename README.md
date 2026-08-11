# FolderManager

一个本地资料管理器原型：资料列表只显示名称和播放按钮，点击名称进入 PDF 阅读页，阅读页展示浏览量，并悬浮当前资料的音频播放按钮。

## 最省事免费部署

推荐用 Vercel 部署前端，Supabase 继续负责登录和云同步。Vercel 会自动提供免费 HTTPS 域名，例如 `https://folder-manager.vercel.app`。

1. 把项目推到 GitHub。
2. 打开 Vercel，选择 `Add New...` -> `Project`。
3. 导入这个 GitHub 仓库。
4. 构建配置使用：

```text
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
```

5. 如果使用 Supabase 和远程资料资源，在 Vercel 的 Environment Variables 中加入 `.env.local` 里的变量：

```text
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon public key
VITE_MATERIALS_BASE_URL=https://你的资源域名/materials
```

6. 部署成功后，把 Vercel 给你的正式地址加入 Supabase 控制台：

```text
Authentication -> URL Configuration -> Site URL
Authentication -> URL Configuration -> Redirect URLs
```

例如：

```text
https://folder-manager.vercel.app
```

项目根目录的 `vercel.json` 已配置 SPA 回退，直接刷新阅读页、收藏页、历史页不会 404。

## 资料资源托管

PDF 和音频不建议提交到 GitHub。项目会通过 `VITE_MATERIALS_BASE_URL` 生成资源地址：

```text
${VITE_MATERIALS_BASE_URL}/<资料 id>/document.pdf
${VITE_MATERIALS_BASE_URL}/<资料 id>/audio.mp3
```

推荐免费渠道：

- Cloudflare R2：适合公开静态资源，免费额度通常足够这个项目。
- Firebase Storage：适合已有 Google/Firebase 项目时使用。
- Backblaze B2：S3 兼容，免费存储额度也能覆盖当前资料量。

上传时保持现有目录结构，例如：

```text
materials/
  session5/
    wwg-0101-a329738b/
      document.pdf
      audio.mp3
  thinking/
    wwg-0318-f20ce040/
      document.pdf
      audio.mp3
```

本地开发（`npm run dev`）固定读取 `public/materials/`，不会访问远程对象存储，即使配置了 `VITE_MATERIALS_BASE_URL` 也一样。部署到 Vercel 后才会读取 `VITE_MATERIALS_BASE_URL`；未配置时默认使用项目当前的阿里云 OSS 地址：

```text
VITE_MATERIALS_BASE_URL=https://wwg-5.oss-cn-qingdao.aliyuncs.com/materials
```

新增第五季资料时更新 `src/data/materials.ts`；新增“现代思维100讲”资料时更新 `src/data/thinkingMaterials.ts`。文件需按上面的分集目录结构上传到对象存储。

收藏、历史、浏览量和学习状态默认保存在当前浏览器的 `localStorage`，配置 Supabase 后会自动同步到当前登录账号，供多设备使用。

## 免费云同步

项目使用 Supabase 免费档同步收藏和历史。未配置 Supabase 时，应用仍会按本地模式工作。

1. 在 Supabase 控制台打开项目。
2. 在 Authentication 中启用 Email 登录。
3. 在 Authentication 的 URL/Redirect URL 设置中加入本地登录地址，例如 `http://127.0.0.1:5173/login`。
4. 复制 `.env.example` 为 `.env.local`，填入 Supabase Project URL 和 Publishable/anon public key。
5. 在 SQL Editor 中执行下面 SQL：

```sql
create table if not exists public.user_sync_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  state_key text not null check (state_key in ('favorites', 'history', 'stats', 'learning')),
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);

alter table public.user_sync_state
drop constraint if exists user_sync_state_state_key_check;

alter table public.user_sync_state
add constraint user_sync_state_state_key_check
check (state_key in ('favorites', 'history', 'stats', 'learning'));

alter table public.user_sync_state enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on table public.user_sync_state to authenticated;

drop policy if exists "Users can read their own sync state" on public.user_sync_state;
drop policy if exists "Users can insert their own sync state" on public.user_sync_state;
drop policy if exists "Users can update their own sync state" on public.user_sync_state;

create policy "Users can read their own sync state"
on public.user_sync_state
for select
using (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can insert their own sync state"
on public.user_sync_state
for insert
with check (auth.uid() is not null and auth.uid() = user_id);

create policy "Users can update their own sync state"
on public.user_sync_state
for update
using (auth.uid() is not null and auth.uid() = user_id)
with check (auth.uid() is not null and auth.uid() = user_id);
```

同步数据：

- `user_sync_state` 表中 `state_key = 'favorites'`
- `user_sync_state` 表中 `state_key = 'history'`
- `user_sync_state` 表中 `state_key = 'stats'`
- `user_sync_state` 表中 `state_key = 'learning'`
