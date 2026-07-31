# 再等等 · Not Yet — Design System

> 视觉方向：**纸上冷静 / Paper Pause**
> 本文件是全局设计规则。若 `pages/` 中存在页面级规则，则页面规则只覆盖明确列出的部分。

## 1. 产品气质

“再等等”不是电商，也不是说教式节流工具。界面应像一本安静、可信、可以反复翻看的购买决策手册：

- 克制，但不寡淡；
- 有编辑感，而不是通用 SaaS 模板；
- 有纸张、印刷和手写批注的温度；
- 强调留白、时间和真实感受；
- 任何视觉都不能制造消费焦虑或羞耻。

## 2. 核心视觉语言

| 元素 | 规则 |
| --- | --- |
| 页面 | 暖纸色画布，细颗粒纹理，宽松非对称栅格 |
| 标题 | 中文宋体展示字，较大字号，紧凑行高 |
| 正文 | 现代中文无衬线字体，16px 起，清晰而轻 |
| 品牌装置 | 圆形冷静期纸盘、购物袋轮廓、柿子红指针 |
| 卡片 | 索引卡/纸张，不使用悬浮玻璃或厚重阴影 |
| 图标 | 统一使用 Lucide 线性图标，1.4–1.8px 描边 |
| 强调 | 墨绿承担主要操作；柿子红只做指针、标签和重点 |

## 3. 色彩令牌

| 角色 | Hex | CSS token |
| --- | --- | --- |
| Canvas / 暖纸 | `#F4F0E6` | `--canvas` |
| Paper / 主纸面 | `#FCF8EE` | `--surface` |
| Soft paper | `#EDE6D7` | `--surface-soft` |
| Sage paper | `#E5ECE4` | `--surface-green` |
| Display ink | `#123A31` | `--ink` |
| Body ink | `#293D37` | `--text` |
| Secondary text | `#5F706A` | `--muted` |
| Quiet text | `#6F7D78` | `--faint` |
| Hairline | `#D7CDBB` | `--line` |
| Strong line | `#B7AC99` | `--line-strong` |
| Primary green | `#153D35` | `--primary` |
| Primary hover | `#0E3029` | `--primary-hover` |
| Sage tint | `#DCE7DF` | `--primary-soft` |
| Persimmon | `#D9643F` | `--terracotta` |
| Persimmon tint | `#F1DDD0` | `--terracotta-soft` |
| Danger | `#963F36` | `--danger` |
| Focus | `#C85434` | `--focus` |

所有正文对画布或纸面的对比度至少达到 WCAG AA 4.5:1。颜色不能独立表达状态，必须同时保留图标或文字。

## 4. 字体

```css
--font-display:
  "Songti SC", "STSong", "Noto Serif CJK SC",
  "Source Han Serif SC", "SimSun", serif;

--font-sans:
  -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
  "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
```

- Hero：`clamp(3.25rem, 7vw, 6.75rem)`，行高 0.98–1.05。
- 页面标题：`clamp(2.25rem, 5vw, 4rem)`。
- 区块标题：24–34px。
- 正文：16–18px，行高 1.65–1.8。
- 标签与元数据：12–13px，不低于 12px。
- 价格、时间、计数使用 tabular numerals。

不依赖远程字体，优先使用系统中文字体，避免 FOIT 和隐私额外请求。

## 5. 布局

- 桌面最大外壳：1280px。
- 内容页阅读宽度：760px。
- 首页：12 栏或两列非对称栅格，Hero 文案约 46%，视觉装置约 54%。
- 栅格间距：8 / 12 / 16 / 24 / 32 / 48 / 72 / 96。
- 桌面首屏保持大量负空间；移动端优先展示标题、CTA、倒计时。
- 断点：375 / 768 / 1024 / 1440。
- 禁止横向滚动；固定元素必须考虑 `safe-area-inset-bottom`。

## 6. 组件

### Button

- 主按钮为深墨绿实底，纸白文字，圆角 8–10px。
- 高度至少 48px；小按钮的触控区域也必须达到 44px。
- Hover：颜色加深、向上 1px；Pressed：`scale(.985)`。
- Focus：3px 柿子红混白轮廓，不移除系统可见焦点。

### Record card

- 像一张纸质索引卡，1px 发丝边框，6–10px 小圆角。
- 卡片内部包含：状态、标题、线稿图标、价格、剩余时间/决定结果。
- Hover：阴影轻微加深、上移 3px、箭头平移 3px。
- 不使用整片彩色背景表达状态；状态文字必须保留。

### Form

- 标签始终可见；placeholder 仅作示例。
- 输入框使用纸白底、1px 边框、8px 圆角。
- Focus 由墨绿边框和柔和 focus ring 共同表达。
- 高级字段继续使用渐进披露。
- 错误就近显示并使用 `role="alert"`。

### Tabs / choices

- Tabs 采用编辑索引式文字导航和底部墨绿指示线。
- 必须支持方向键、Home、End 和 roving tabIndex。
- Radiogroup 保留文字、图标、`aria-checked` 与键盘方向键。

### Dialog / toast

- Dialog 像居中的纸张面板；backdrop 只用于隔离前景，不作装饰。
- 打开：180–220ms 淡入和轻微上移。
- Toast：右下/移动端底部进入，保留撤销按钮和倒计时文本。

## 7. 动效

| 场景 | 时长 | 方式 |
| --- | --- | --- |
| Hover / pressed | 140–180ms | transform + color |
| Tab / 状态切换 | 160–220ms | opacity + underline |
| Card 进入 | 220–320ms | opacity + translateY |
| Dialog | 180–220ms | opacity + translateY + scale |
| 倒计时装置 | 6–8s | 极轻微漂浮，仅装饰 |

- 动画不得阻塞点击。
- 不动画 width/height 造成布局抖动；进度条例外，控制在 220ms。
- `prefers-reduced-motion: reduce` 时关闭所有非必要动画和 smooth scroll。

## 8. 页面原则

### 首页

- 大标题：“想买的，先放一放。”
- 唯一主 CTA：“记下想买的东西”。
- 冷静期纸盘必须成为首屏记忆点，并优先显示真实记录的剩余时间。
- 状态筛选置于记录区上沿。
- 商品卡片使用真实数据，空状态仍需保留呼吸感。

### 详情、复盘和表单

- 复用同一纸张、墨绿和柿子红系统。
- 内容页保持 760px 内的舒适阅读宽度。
- 每屏只有一个主操作。
- 删除与危险操作必须与正常操作分区。

## 9. 禁止模式

- 通用仪表盘、侧边栏和密集统计图；
- 玻璃拟态、霓虹、紫蓝渐变；
- 大量白色圆角卡片平铺；
- 厚重 3D、黏土图标和夸张阴影；
- emoji 充当结构图标；
- 随机英文小字、不可读的装饰微文案；
- Hover 导致布局跳动；
- 低对比灰字、不可见焦点、低于 44px 的触控目标。

## 10. 发布前检查

- [ ] 375 / 768 / 1024 / 1440 无横向滚动
- [ ] 所有触控目标至少 44×44px
- [ ] 正文对比度至少 4.5:1
- [ ] 键盘可完成筛选、表单、决定和弹窗操作
- [ ] `prefers-reduced-motion` 生效
- [ ] 状态不只依赖颜色
- [ ] 固定 CTA、sticky action 与撤销 toast 不重叠
- [ ] 页面使用真实产品文案与真实业务数据
