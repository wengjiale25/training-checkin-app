# 训练打卡 Web App

这是一个手机优先的本地训练打卡 PWA。数据保存在当前浏览器，不需要账号或后端。

主要体验：

- 推A、拉A、腿A、推B、拉B、腿B按工作日连续循环
- 周六休息或轻松游，周日至少保留一个完整休息日
- 每次力量训练后安排有氧，腿日自动使用更轻的版本
- 晚间游泳独立打卡，不计入当天必做进度
- 当天可以临时添加力量动作、有氧或游泳，也可以跳过练不了的动作
- 当前动作自动展开，完成后自动进入下一项
- 每组单独打卡，误触后可在7秒内撤销，也可再点一次取消
- 独立“重量”页对比上次记录，并直接修改每个动作的常用重量和次数
- 哑铃动作默认使用 kg，其他力量器械默认使用磅
- 力量训练后自动开始组间休息计时
- 训练总计时可手动开始、暂停、继续和结束，结束或重置均可撤销
- 可记录重量、次数、动作备注和当天总结
- 每个动作带起始/收缩示意、训练肌群、步骤、要领和常见错误
- 训练循环、历史进度与离线使用

## 本地运行

在这个目录启动一个静态服务器：

```powershell
python -m http.server 4173
```

然后打开：

```text
http://localhost:4173
```

手机预览时，让电脑和手机连接同一个 Wi-Fi，使用电脑的局域网 IP 替换 localhost。

## 部署

这是纯静态项目，可以部署到任意静态托管服务：

- Vercel：导入本目录，框架选择 Other，输出目录留空。
- Netlify：拖拽本目录或连接仓库，发布目录选择项目根目录。
- GitHub Pages：把本目录内容推到仓库并启用 Pages。

PWA 安装需要 HTTPS 或 localhost。部署到 Vercel、Netlify、GitHub Pages 后即可在手机浏览器里安装。

## 动作资料来源

- 动作插图：[RepDB Free Exercise Dataset](https://repdb.co/free-exercise-dataset)
- 部分动作与跑步机示意：[Free Exercise DB](https://github.com/yuhonas/free-exercise-db)
- 蛙泳动画：[Wikimedia Commons，作者 fxqf](https://commons.wikimedia.org/wiki/File:Breaststroke.gif)
- 肌肉高亮图：[Anatome](https://anatome.dev)

来源信息也会显示在每个动作教学页底部。所有图片均保存在本地并加入 PWA 离线缓存。
