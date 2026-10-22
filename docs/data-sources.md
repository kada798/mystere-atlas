# 数据来源与巴黎活动

## 已运行的导入

`npm run data:sync` 从以下真实来源获取一批资料，写入项目根目录的 `.data/snapshot.json`。页面只读本地快照，不在用户打开页面时抓取外部网站。新克隆的项目需先运行此命令；没有快照时保持真实空状态。

| 来源                         | 本轮接入方式               | 范围                                                                     |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| 巴黎市政府 Que Faire à Paris | 官方开放数据 API           | 悬疑关键词筛选、巴黎市内邮编、最多 300 条候选；来源为 ODbL               |
| Open Library                 | 公开 Search API            | 三种语言偏好下的 Mystery 书目、作者与能核实的版本                        |
| Wikidata                     | SPARQL 与实体 API          | Mystery film 类作品、多语言名称与描述、主创、外部标识符；CC0             |
| IMDb                         | 官方 `title.basics.tsv.gz` | 1970 年起的 Mystery 电影／剧集，有界流式读取，最多 36 条、35 MB 解压数据 |

IMDb 导入仅用于本机个人与非商业试验，不是公开作品库或商业使用许可，也不是最新全站榜单。下载记录不进入 Pages 的公开快照；公开影视记录来自 Wikidata，IMDb 只作为外部链接。参见 [IMDb 数据使用限制](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)。当前不抓取用户评论或评分，也不下载整个大文件。

## 用户提到的其他站点

- Meetup 官方 API 需要 Pro 与 OAuth 授权。本轮没有该授权，未自动导入 Meetup 活动；巴黎页提供原站关键词搜索链接。
- Letterboxd API 申请制且限制用途。本轮没有直接导入其数据。Wikidata 中已有的 Letterboxd 标识符用于生成原站关联链接。
- 豆瓣尚无本项目可用的授权数据源；其搜索路径在 robots 中禁止抓取，本轮不通过登录、验证码、代理或非公开端点绕过。Wikidata 中已有的豆瓣电影标识符用于生成关联链接。
- “实际资料来源”和“关联站点链接”分开存储和展示，不把链接误报为直接采集。

后续获得适用授权或明确可用的公开来源后，再实现相应适配器。不要仅填入一个密钥就把未实现的适配器标为已连接。

## 活动范围与语义

- 仅巴黎市内：地点名称与 75 开头邮编交叉校验；排除 Puteaux、Boulogne 等郊区。
- 地图使用 Leaflet 与 OpenStreetMap 标准瓦片，显示可见署名；不批量预取瓦片，不请求用户定位。
- 只有符合巴黎范围的真实坐标生成标记；缺少坐标的活动仍可显示列表。
- 数据按 polar、policier、murder、escape、énigme、mystère、Sherlock、thriller、Agatha 等词发现，再检查标题和介绍，避免词片段误匹配。
- 关键词匹配表示相关候选，尚未替代人工编辑。文化游览、演出和儿童解谜可能包含其中。
- 日期按 Europe/Paris 展示。来源给出日期范围时，不据此编造具体场次，报名链接转原站。
- 介绍语言不等于现场语言；原站没有明确说明时标为未知。
- 报名在外部主办方完成；网站没有模拟站内报名成功。

## 更新与失败恢复

```powershell
npm.cmd run data:sync
npm.cmd run data:sync -- --source=paris
npm.cmd run data:watch
```

watch 模式每 6 小时尝试一次。它是本机进程，电脑关机或进程停止后不会继续；生产部署需要单独配置任务调度和持久存储。不要把本机进程当作已部署的云端自动任务。

每个来源单独记录本次状态、上次成功时间及数量。失败时保留旧资料，不用空结果覆盖；成功数据以临时文件加原子重命名写入。作品按真实来源 ID 去重，合并不同站点的确定标识；不凭相似名称把不同作品强行合并。人工标记的作品不被导入覆盖。

`.data/` 中的快照、任务日志和进程号不提交 Git。真实凭据也不能提交。数据移到数据库后，保留相同的规范化和来源边界。

## 参考

- [巴黎活动开放数据](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/)
- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Wikidata 数据访问](https://www.wikidata.org/wiki/Wikidata:Data_access)
- [IMDb 非商业数据集](https://data.imdb.com/non-commercial-datasets/)
- [Meetup API 授权](https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API)
- [Letterboxd API 申请](https://letterboxd.com/api-beta/)
- [豆瓣 robots](https://www.douban.com/robots.txt)
- [OpenStreetMap 瓦片政策](https://operations.osmfoundation.org/policies/tiles/)
