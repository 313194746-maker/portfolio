# 李吴鹏个人作品集

静态作品集页面，无需构建工具，直接通过本地静态服务器或部署平台访问 `index.html`。

## 目录结构

```text
.
├── index.html              # 主作品集入口
├── prism.html              # React/Tailwind 视觉实验页
├── favicon.svg
├── assets/                 # 图片、PDF、图标等静态资源
│   ├── backgrounds/
│   ├── hero/
│   ├── projects/
│   ├── resume/
│   └── tools/
├── src/                    # 页面源码
│   ├── components/         # prism.html 使用的 JSX 组件
│   ├── scripts/main.js     # 主作品集交互逻辑
│   └── styles/main.css     # 主作品集样式
└── vendor/                 # 本地第三方依赖
```

## 开发说明

- 主页面样式入口：`src/styles/main.css`
- 主页面脚本入口：`src/scripts/main.js`
- 新增图片或 PDF 放入 `assets/` 对应分类目录
- 第三方库文件放入 `vendor/`，不要混入业务源码目录
