import OpengraphImage, {
  alt as opengraphAlt,
  contentType as opengraphContentType,
  size as opengraphSize,
} from "./opengraph-image";

export const alt = opengraphAlt;
export const contentType = opengraphContentType;
export const size = {
  height: opengraphSize.height,
  width: opengraphSize.width,
};

export default function TwitterImage(
  props: Parameters<typeof OpengraphImage>[0]
) {
  return OpengraphImage(props);
}
