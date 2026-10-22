# Background jobs

`sync.ts` 提供 `npm run data:sync` 和 `npm run data:watch`。目前导入巴黎官方活动、Open Library、Wikidata 和 IMDb 官方非商业子集。详情见 `docs/data-sources.md`；本机循环进程不等同于云端任务调度。

`enrich.ts` 提供 `npm run data:enrich`，按精确来源 ID 补全现有作品的介绍和封面元数据；默认为本机快照。`--snapshot=deployment/public-snapshot.json` 可更新待审核的公开快照。外部失败保留旧资料，不修改人工维护的作品。
