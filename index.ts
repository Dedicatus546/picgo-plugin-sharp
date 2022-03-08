import {readFile} from "fs-extra";
import {imageSize} from "image-size";
import {basename, extname} from "path";
import {IPicGo, IPluginConfig} from "picgo";
import {Response} from "request";

import sharp, {
  AvifOptions,
  GifOptions,
  HeifOptions,
  JpegOptions,
  PngOptions,
  WebpOptions,
  SharpOptions
} from "sharp";

const PLUGIN_NAME = "picgo-plugin-sharp";

const fetch = async (ctx: IPicGo, url: string): Promise<Buffer> => {
  return ctx
    .request({method: "Get", url, encoding: null})
    .on("response", (response: Response) => {
      const contentType = response.headers["content-type"];
      if (!contentType.includes("image")) {
        ctx.log.error("headers:\n" + JSON.stringify(response.headers, null, 2));
        throw new Error(
          `${url} isn't a image, resp header ${response.headers}`
        );
      }
    });
};

const realBaseName = (url: string): string => {
  const _ = url.split("?")[0];
  return basename(_, extname(_));
};

const transformTypeList: TransformType[] = [
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heif",
];

type Configs = {
  outputType?: TransformType;
};
type SharpConfigs = {
  outputOptions?: TransformOptions;
  inputOptions: SharpOptions;
}
type TransformType = "jpeg" | "png" | "gif" | "webp" | "avif" | "heif";
type TransformOptions =
  | JpegOptions
  | PngOptions
  | GifOptions
  | WebpOptions
  | AvifOptions
  | HeifOptions;

const createTransformFn = (type: TransformType) => {
  return async (buffer: Buffer, outputOptions: TransformOptions, inputOptions: SharpOptions) => {
    return await sharp(buffer, inputOptions)[type](outputOptions).toBuffer();
  };
};

const transformFnMap: Record<TransformType,
  (buffer: Buffer, outputOptions: TransformOptions, inputOptions: SharpOptions) => Promise<Buffer>> = {
  jpeg: createTransformFn("jpeg"),
  png: createTransformFn("png"),
  gif: createTransformFn("gif"),
  webp: createTransformFn("webp"),
  avif: createTransformFn("avif"),
  heif: createTransformFn("heif"),
};

const handle = async (ctx: IPicGo): Promise<any> => {
  const cfg = ctx.getConfig<Configs>(PLUGIN_NAME);
  const sharpCfg = ctx.getConfig <SharpConfigs>("sharp");
  const outputType: TransformType = cfg?.outputType ?? "webp";
  const outputOptions = sharpCfg?.outputOptions?.[outputType];
  const inputOptions = sharpCfg?.inputOptions?.[outputType];
  ctx.log.info(`use outputType: ${outputType}`);
  ctx.log.info(`use inputOptions: ${JSON.stringify(inputOptions)}`);
  ctx.log.info(`use outputOptions: ${JSON.stringify(outputOptions)}`);

  const transformFn = transformFnMap[outputType];

  await Promise.all(
    ctx.input.map(async (item) => {
      try {
        const originBuffer: Buffer = /https?:\/\//.test(item)
          ? await fetch(ctx, item)
          : await readFile(item);
        let transformBuffer = originBuffer;
        try {
          transformBuffer = await transformFn(originBuffer, outputOptions, inputOptions);
          ctx.log.success(`${item} convert to ${outputType} successful`);
        } catch (e) {
          ctx.log.error(`can't convert file ${item}`);
          throw new Error(e);
        }

        const name: string = realBaseName(item);
        const extname: string = "." + outputType;
        const {width, height} = imageSize(originBuffer);
        ctx.output.push({
          buffer: transformBuffer,
          fileName: name + extname,
          width: width,
          height: height,
          extname: extname,
        });
      } catch (e) {
        ctx.log.error(e);
      }
    })
  );
};

const config = (ctx: IPicGo): IPluginConfig[] => {
  const pluginConfig = ctx.getConfig<Configs>(PLUGIN_NAME);
  const {outputType = "avif"} = pluginConfig ?? {};
  return [
    {
      alias: "压缩格式",
      name: "outputType",
      type: "list",
      choices: transformTypeList,
      default: outputType,
      required: true,
    },
  ];
};

export = (ctx: IPicGo) => {
  return {
    register: () => {
      ctx.helper.transformer.register("sharp", {
        handle,
        config,
      });
    },
    transformer: "sharp",
    config,
  };
};