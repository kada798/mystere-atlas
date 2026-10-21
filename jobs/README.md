# Background jobs

`sync.ts` 提供 `npm run data:sync` 和 `npm run data:watch`。目前导入巴黎官方活动、Open Library、Wikidata 和 IMDb 官方非商业子集。详情见 `docs/data-sources.md`；本机循环进程不等同于云端任务调度。
