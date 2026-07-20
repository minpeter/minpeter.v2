import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

import { getOgTitleSize, getOgTitleVisualWidth, getTitleTokens } from "./og-title";

export const ogImageSize = {
  height: 630,
  width: 1200,
};

const fusionPixelFontUrls = {
  ja: new URL(
    "font.AritaBuri/FusionPixel10Proportional-ja.woff",
    import.meta.url
  ),
  ko: new URL(
    "font.AritaBuri/FusionPixel10Proportional-ko.woff",
    import.meta.url
  ),
};

const catPaths = {
  eyes: "M22.7919 35.2729C14.9079 35.2729 5.30376 45.0204 5.16041 59.6417C5.01706 74.2629 12.7577 77.9899 18.4915 77.9899C27.5223 78.1333 36.2664 68.2424 36.5531 55.0546C36.8398 41.8668 30.5326 35.1296 22.7919 35.2729ZM65.2222 46.7406C54.6146 46.7406 43.577 56.6314 43.577 70.5359C43.7204 82.4336 51.6044 93.0412 63.7888 93.0412C75.9731 93.0412 84.5739 81.8602 84.5739 70.5359C84.7172 58.0649 76.9765 46.7406 65.2222 46.7406Z",
  face: "M117.4 41.5801C115.68 36.9931 109.659 34.4129 104.069 31.8326C98.0484 28.9657 89.591 27.5323 81.8503 27.3889C76.6899 23.3753 69.5226 18.7882 60.6352 16.4947C58.915 10.1875 56.6215 6.31713 52.6078 2.01676C50.7443 .153267 49.4542 -.276769 46.5873 .153268C41.4269 1.01334 39.8501 2.4468 36.6965 4.45364C28.3824 9.0407 15.1946 20.6517 6.45055 36.8497C2.72357 44.3037 0 52.0444 0 60.3584C0 81.1435 17.6315 102.645 52.3211 103.075C70.6694 103.075 81.5636 95.7648 89.0176 84.0104C97.905 77.7032 109.373 66.6656 116.11 53.4778C118.26 48.8908 118.403 43.8737 117.4 41.5801Z",
};

const getOgFontData = (locale: string) =>
  readFile(locale === "ja" ? fusionPixelFontUrls.ja : fusionPixelFontUrls.ko);

const CatMark = () => (
  <svg
    height={104}
    viewBox="0 0 118 104"
    width={118}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={catPaths.face} fill="#f7f7f2" />
    <path d={catPaths.eyes} fill="#050505" />
  </svg>
);

const OgImage = ({
  detail,
  title,
  titleSize,
}: {
  detail: string;
  title: string;
  titleSize: number;
}) => (
  <div
    style={{
      background: "#050505",
      color: "#f7f7f2",
      display: "flex",
      fontFamily: "Fusion Pixel",
      height: "100%",
      overflow: "hidden",
      position: "relative",
      width: "100%",
    }}
  >
    {[90, 180, 270, 360, 450, 540].map((top) => (
      <div
        key={top}
        style={{
          borderTop: "1px solid rgba(255,255,255,0.035)",
          display: "flex",
          left: 0,
          position: "absolute",
          top,
          width: 1200,
        }}
      />
    ))}

    <div
      style={{
        color: "#777773",
        display: "flex",
        fontSize: 20,
        justifyContent: "space-between",
        left: 44,
        letterSpacing: 0,
        position: "absolute",
        right: 44,
        top: 38,
      }}
    >
      <span>SYS://MINPETER/OG</span>
      <span>1200X630</span>
    </div>

    <div
      style={{
        alignItems: "center",
        display: "flex",
        left: 68,
        position: "absolute",
        right: 44,
        top: 232,
      }}
    >
      <CatMark />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          marginLeft: 28,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 0,
            lineHeight: 1,
            marginBottom: 9,
          }}
        >
          MINPETER.COM // {detail}
        </div>
        <div
          style={{
            alignContent: "flex-start",
            alignItems: "baseline",
            display: "flex",
            flexWrap: "wrap",
            fontSize: titleSize,
            letterSpacing: 0,
            lineHeight: 1.1,
            maxHeight: 104,
            overflow: "hidden",
            overflowWrap: "break-word",
            width: "100%",
          }}
        >
          {getTitleTokens(title).map((token, index) => (
            <span
              key={`${token.text}-${index}`}
              style={{
                fontSize: token.isCjk
                  ? Math.round(titleSize * 0.78)
                  : titleSize,
                transform: token.isCjk
                  ? `translateY(-${Math.round(titleSize * 0.13)}px)`
                  : "translateY(0px)",
                whiteSpace: "pre",
              }}
            >
              {token.text}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div
      style={{
        alignItems: "center",
        bottom: 38,
        color: "#8d8d87",
        display: "flex",
        fontSize: 20,
        left: 44,
        letterSpacing: 0,
        position: "absolute",
        right: 44,
      }}
    >
      <span>INDEPENDENT WEB PUBLISHING SYSTEM</span>
      <div
        style={{
          display: "flex",
          height: 12,
          marginLeft: "auto",
        }}
      >
        {[8, 3, 14, 5, 22, 4, 10, 18, 3, 12].map((width, index) => (
          <div
            key={`${width}-${index}`}
            style={{
              background: index % 2 === 0 ? "#f7f7f2" : "#333330",
              display: "flex",
              height: 12,
              marginLeft: 4,
              width,
            }}
          />
        ))}
      </div>
    </div>

    <div
      style={{
        border: "1px solid #2b2b29",
        bottom: 24,
        display: "flex",
        left: 24,
        position: "absolute",
        right: 24,
        top: 24,
      }}
    />
  </div>
);

export const createOgImageResponse = async ({
  detail = "WWW",
  locale,
  title,
  titleSize,
}: {
  detail?: string;
  locale: string;
  title: string;
  titleSize?: number;
}) => {
  const localizedTitle = title.toLocaleUpperCase(locale);
  const resolvedTitleSize =
    titleSize ?? getOgTitleSize(getOgTitleVisualWidth(localizedTitle));
  const fusionPixelFontData = await getOgFontData(locale);

  return new ImageResponse(
    <OgImage
      detail={detail}
      title={localizedTitle}
      titleSize={resolvedTitleSize}
    />,
    {
      ...ogImageSize,
      fonts: [
        {
          data: fusionPixelFontData,
          name: "Fusion Pixel",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
};
