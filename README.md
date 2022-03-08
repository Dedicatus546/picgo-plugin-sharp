# picgo-plugin-sharp

**`picgo` 插件，上传前压缩你的图像**

原项目地址 [picgo-plugin-sharp - imbillow](https://github.com/imbillow/picgo-plugin-sharp)

原项目使用的依赖版本比较老了，而且支持的格式比较少，所以二次开发一下。

## 功能

- 支持 `avif` , `jpeg` , `png` , `gif` , `webp` , `heif` 格式压缩
- 支持对上面的格式进行压缩配置，使用 `sharp` 提供的配置参数，相关配置地址：
  - [outputOptions](https://sharp.pixelplumbing.com/api-output)
  - [inputOptions](https://sharp.pixelplumbing.com/api-constructor)
- 提供 `GUI` 供切换压缩格式
  ![](https://cdn.jsdelivr.net/gh/Dedicatus546/image@main/202203081443571.avif)
- 通过修改 `data.json` 来修改压缩配置

```json5
{
  // ... 其他配置
  "sharp": {
    // 输出配置
    "outputOptions": {
      // 每一种格式都是一个对象
      "avif": {
        "effort": 9,
        "chromaSubsampling": "4:2:0"
      },
      // 其他格式 ...
    },
    // 输入配置
    "inputOptions": {
      // 每一种格式都是一个对象
      "gif": {
        "animated": true
      }
    }
  }
}
```

## 使用

`pnpm install` 安装依赖。

`pnpm run build` 打包生成 `dist`。

`picgo` 选择导入本地插件，将 `picgo-plugin-sharp` 导入，然后重启 `picgo` 即可。