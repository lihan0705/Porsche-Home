// Vite 的 `?raw` 导入：把文件内容当作字符串内联进来（dev 与 build 行为一致）。
// 用法见 app/engine-brokendown/route.ts。
declare module "*?raw" {
  const content: string;
  export default content;
}
