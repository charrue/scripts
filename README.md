## 介绍

`petros`是一个在项目各个流程中增强开发的命令行工具。



## 功能

- 本地预览HTML，一般用于预览生产构建产物。

## 下载

```bash
npm install @charrue/petros
```



## 命令

### preview
用于预览打包后的文件，功能类似于`vite`的`vite preview`。
可通过`petros preview foo`来修改预览的目录，默认是`dist`


**port**
- 默认值: `5555`
- 用法: `petros preview --port=3000`
  指定开发服务器端口。注意：如果端口已经被使用，会自动尝试下一个可用的端口。



**host**
- 默认值: `127.0.0.1`
- 用法: `petros preview --host`
  指定服务器应该监听哪个 IP 地址。 如果将此设置为 `0.0.0.0` 或者 `true` 将监听所有地址，包括局域网和公网地址。



**base**
- 默认值: `/`
- 用法: `petros preview --base=/foo/`
  开发或生产环境服务的公共基础路径。合法的值包括以下几种：
  - 绝对 URL 路径名，例如 `/foo/`
  - 完整的 URL，例如 `https://foo.com/`
  - 空字符串或 `./`（用于开发环境）



**open**
- 默认值: `false`
- 用法: `petros preview  --open`
  自动在浏览器中打开应用程序



**strictPort**
- 默认值: `false`
- 用法: `petros preview  --strictPort`
  设为 `true` 时若端口已被占用则会直接退出，而不是尝试下一个可用端口。



