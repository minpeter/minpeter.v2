"use client";

import { useTranslations } from "next-intl";
import { parseAsBoolean, parseAsStringLiteral, useQueryStates } from "nuqs";
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ProductGallery,
  type ProductGalleryProps,
} from "@/components/product-gallery";
import { ProductSpin } from "@/components/product-spin";
import {
  combinationToSpin,
  getValidatedCombination,
  HOUSING_OPTIONS,
  type HousingId,
  KEYCAP_OPTIONS,
  type KeycapId,
  type ValidatedCombination,
} from "@/shared/keyboard-customization";

import { getSpinLoader } from "@/shared/product-spin-loader";

const HOUSING_IDS = HOUSING_OPTIONS.map((option) => option.id);
const KEYCAP_IDS = KEYCAP_OPTIONS.map((option) => option.id);
const QUERY = {
  customize: parseAsBoolean.withDefault(false),
  housing: parseAsStringLiteral(HOUSING_IDS).withDefault("bone-white"),
  keycaps: parseAsStringLiteral(KEYCAP_IDS).withDefault(
    "retro-programmer-retail"
  ),
};

function ValidatedPreview({
  combination,
  initialAngle,
  onAngleChange,
}: {
  combination: ValidatedCombination;
  initialAngle: number;
  onAngleChange: (angle: number) => void;
}) {
  const t = useTranslations("products.customization");
  const spin = useMemo(() => combinationToSpin(combination), [combination]);
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "partial" | "error"
  >("loading");
  const angleRef = useRef(initialAngle);
  const rememberAngle = useCallback(
    (angle: number) => {
      angleRef.current = angle;
      onAngleChange(angle);
    },
    [onAngleChange]
  );
  const retry = useCallback(() => {
    getSpinLoader(spin).retry();
    setLoadState("loading");
  }, [spin]);
  const statusKey = {
    error: "loadError",
    loading: "loading",
    partial: "partial",
    ready: "ready",
  } as const;
  return (
    <div className="store-custom-preview" data-combination={combination.id}>
      <div className="store-media-stage">
        <ProductSpin
          alt={t("previewLabel")}
          initialAngle={angleRef.current}
          onAngleChange={rememberAngle}
          onLoadStateChange={setLoadState}
          resetOnLeave={false}
          sizes="(min-width: 64rem) 60vw, 92vw"
          spin={spin}
        />
      </div>
      <p
        aria-live="polite"
        className="store-label store-custom-status"
        role="status"
      >
        {t(statusKey[loadState])}
      </p>
      {loadState === "error" || loadState === "partial" ? (
        <button
          className="store-button store-label"
          onClick={retry}
          type="button"
        >
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}

/** The personal logo-key board is an immutable showcase, never a retail configuration. */
export function ProductCustomizer(props: ProductGalleryProps) {
  const t = useTranslations("products.customization");
  const [selection, setSelection] = useQueryStates(QUERY, {
    history: "push",
    shallow: true,
  });
  const showPersonal = useCallback(() => {
    setSelection({ customize: false });
  }, [setSelection]);
  const showCustom = useCallback(() => {
    setSelection({ customize: true });
  }, [setSelection]);
  const changeHousing = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSelection({ housing: event.currentTarget.value as HousingId });
    },
    [setSelection]
  );
  const changeKeycaps = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSelection({ keycaps: event.currentTarget.value as KeycapId });
    },
    [setSelection]
  );
  const angleRef = useRef(0);
  const rememberAngle = useCallback((angle: number) => {
    angleRef.current = angle;
  }, []);
  const combination = getValidatedCombination(
    selection.housing,
    selection.keycaps
  );
  const selectedHousing =
    HOUSING_OPTIONS.find((option) => option.id === selection.housing) ??
    HOUSING_OPTIONS[0];
  const selectedKeycaps =
    KEYCAP_OPTIONS.find((option) => option.id === selection.keycaps) ??
    KEYCAP_OPTIONS[0];
  const selectedLabel = t("selected", {
    housing: t(`housingNames.${selectedHousing.id}`),
    keycaps: selectedKeycaps.name,
  });

  return (
    <div className="store-customizer" data-testid="product-customizer">
      <fieldset aria-label={t("modeLabel")} className="store-custom-modes">
        <button
          aria-pressed={!selection.customize}
          className="store-button store-label"
          onClick={showPersonal}
          type="button"
        >
          {t("showcase")}
        </button>
        <button
          aria-pressed={selection.customize}
          className="store-button store-label"
          onClick={showCustom}
          type="button"
        >
          {t("customize")}
        </button>
      </fieldset>
      {selection.customize ? (
        <>
          <p className="store-custom-note store-prose">
            {t("configurationNote")}
          </p>
          <h2 className="store-label store-custom-selection">
            {selectedLabel}
          </h2>
          {combination ? (
            <ValidatedPreview
              combination={combination}
              initialAngle={angleRef.current}
              key={`${combination.id}:${combination.sourceDigest}`}
              onAngleChange={rememberAngle}
            />
          ) : (
            <div
              className="store-media-stage store-custom-pending"
              data-testid="customization-pending"
            >
              <div aria-live="polite" role="status">
                <p className="store-label">{t("pending")}</p>
                <p className="store-prose">{t("pendingDetail")}</p>
                <p className="store-label">{t("kitQA")}</p>
              </div>
            </div>
          )}
          <div className="store-custom-controls">
            <fieldset>
              <legend className="store-label">{t("housing")}</legend>
              {selection.housing === "white-marble" ? (
                <p className="store-prose store-custom-note">
                  {t("marbleNote")}
                </p>
              ) : null}
              <div className="store-custom-swatches">
                {HOUSING_OPTIONS.map((option) => (
                  <label
                    className="store-custom-option"
                    data-selected={selection.housing === option.id}
                    key={option.id}
                  >
                    <input
                      checked={selection.housing === option.id}
                      className="sr-only"
                      name="housing"
                      onChange={changeHousing}
                      type="radio"
                      value={option.id}
                    />
                    <span
                      aria-hidden="true"
                      className="store-custom-swatch"
                      style={{ backgroundColor: option.hex }}
                    />
                    <span>
                      {t(`housingNames.${option.id}`)}
                      <small>
                        {option.material} · {option.sku}
                      </small>
                      <small>
                        {t(
                          getValidatedCombination(option.id, selection.keycaps)
                            ? "renderReady"
                            : "renderPending"
                        )}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="store-label">{t("keycaps")}</legend>
              <div className="store-custom-kits">
                {KEYCAP_OPTIONS.map((option) => (
                  <label
                    className="store-custom-option"
                    data-selected={selection.keycaps === option.id}
                    key={option.id}
                  >
                    <input
                      checked={selection.keycaps === option.id}
                      className="sr-only"
                      name="keycaps"
                      onChange={changeKeycaps}
                      type="radio"
                      value={option.id}
                    />
                    <span>
                      {option.name}
                      <small>{t("fullRetailSet")}</small>
                      <small>
                        {t(
                          getValidatedCombination(selection.housing, option.id)
                            ? "renderReady"
                            : "renderPending"
                        )}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="store-prose">{t("approximation")}</p>
            <div className="store-custom-sources store-label">
              <a
                href={selectedHousing.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t("materialSource")}
              </a>
              {"sourceUrl" in selectedKeycaps ? (
                <a
                  href={selectedKeycaps.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("keycapSource")}
                </a>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <>
          <p
            className="store-label store-custom-note"
            data-testid="personal-showcase-notice"
          >
            {t("showcaseNote")}
          </p>
          <ProductGallery
            {...props}
            initialAngle={angleRef.current}
            onAngleChange={rememberAngle}
          />
        </>
      )}
    </div>
  );
}
