"use client";

import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { KeycapThumbnail } from "@/components/keycap-thumbnail";
import type { ProductGalleryProps } from "@/components/product-gallery";
import { ProductSpin } from "@/components/product-spin";
import {
  combinationToSpin,
  getValidatedCombination,
  type HousingId,
  isPersonalConfiguration,
  isUnsupportedPersonalPair,
  type KeycapId,
  SELECTION_HOUSING_OPTIONS,
  SELECTION_KEYCAP_OPTIONS,
  type SelectionHousingId,
  type SelectionKeycapId,
  type ValidatedCombination,
} from "@/shared/keyboard-customization";

import retailSilhouettes from "@/shared/maru60-retail-silhouettes.json";
import spinSilhouettes from "@/shared/maru60-spin-silhouettes.json";

import { getSpinLoader } from "@/shared/product-spin-loader";
import { useKeyboardCustomizationQuery } from "@/shared/use-keyboard-customization-query";

const RETAIL_OUTLINES = Object.values(retailSilhouettes);
const SPIN_OUTLINES = Object.values(spinSilhouettes);

function geometryRevision(
  personal: boolean,
  combination: ValidatedCombination | null,
  personalSpin?: ProductGalleryProps["spin"]
) {
  if (personal && personalSpin?.geometryRevision) {
    return personalSpin.geometryRevision;
  }
  if (combination) {
    return "assembled-draft";
  }
  return personal || combination ? "previous" : undefined;
}

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
    <div
      className="store-custom-preview"
      data-combination={combination.id}
      data-geometry-revision={geometryRevision(false, combination)}
    >
      <div className="store-media-stage">
        <ProductSpin
          alt={t("previewLabel")}
          initialAngle={angleRef.current}
          loadingOutlines={RETAIL_OUTLINES}
          onAngleChange={rememberAngle}
          onLoadStateChange={setLoadState}
          resetOnLeave={false}
          sizes="(min-width: 64rem) 60vw, 92vw"
          spin={spin}
        />
        <div className="store-custom-feedback">
          <p
            aria-live="polite"
            className={
              loadState === "ready" || loadState === "loading"
                ? "sr-only"
                : "store-label"
            }
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
      </div>
    </div>
  );
}

const KEYCAP_LABELS: Record<SelectionKeycapId, string> = {
  inventor: "Inventor",
  "nicepbt-bow-retail": "NicePBT BoW",
  "nicepbt-noel-latin-retail": "Noel",
  "nicepbt-purple-chonkers-retail": "Purple Chonkers",
  "pbtfans-wob-retail": "PBTfans WoB",
  "retro-programmer-retail": "Retro Programmer",
};

function SelectionPreview({
  personal,
  unsupported,
  combination,
  gallery,
  angle,
  onAngleChange,
}: {
  personal: boolean;
  unsupported: boolean;
  combination: ValidatedCombination | null;
  gallery: ProductGalleryProps;
  angle: number;
  onAngleChange: (angle: number) => void;
}) {
  const t = useTranslations("products.customization");
  if (personal) {
    return (
      <section
        aria-label={gallery.labels.media}
        className="store-media store-custom-personal"
      >
        <div className="store-media-stage">
          <ProductSpin
            alt={gallery.labels.spin}
            initialAngle={angle}
            loadingOutlines={
              gallery.spin.geometryRevision ? SPIN_OUTLINES : undefined
            }
            onAngleChange={onAngleChange}
            sizes="(min-width: 64rem) 60vw, 92vw"
            spin={gallery.spin}
          />
        </div>
      </section>
    );
  }
  if (combination && !unsupported) {
    return (
      <ValidatedPreview
        combination={combination}
        initialAngle={angle}
        key={`${combination.id}:${combination.frames.map((frame) => frame.sha256).join(":")}`}
        onAngleChange={onAngleChange}
      />
    );
  }
  return (
    <div
      className="store-media-stage store-custom-pending"
      data-testid={
        unsupported ? "customization-unavailable" : "customization-pending"
      }
    >
      <div aria-live="polite" role="status">
        <p className="store-label">
          {t(unsupported ? "unsupported" : "pending")}
        </p>
        <p className="store-prose">
          {t(unsupported ? "unsupportedDetail" : "pendingDetail")}
        </p>
      </div>
    </div>
  );
}

/** Personal and retail appearances share selectors, never interchangeable renders. */
export function ProductCustomizer(
  props: ProductGalleryProps & { intro?: ReactNode; details?: ReactNode }
) {
  const t = useTranslations("products.customization");
  const [selection, setSelection] = useKeyboardCustomizationQuery();
  const lastRetail = useRef<{ housing: HousingId; keycaps: KeycapId }>({
    housing: "ice-blue",
    keycaps: "retro-programmer-retail",
  });
  useEffect(() => {
    if (selection.housing !== "transparent") {
      lastRetail.current.housing = selection.housing;
    }
    if (selection.keycaps !== "inventor") {
      lastRetail.current.keycaps = selection.keycaps;
    }
  }, [selection.housing, selection.keycaps]);
  const [pairing, setPairing] = useState<
    { signature: string; message: string } | undefined
  >(undefined);
  const applySelection = useCallback(
    (
      housing: SelectionHousingId,
      keycaps: SelectionKeycapId,
      paired: boolean
    ) => {
      setSelection({ housing, keycaps });
      setPairing(
        paired
          ? {
              message: isPersonalConfiguration(housing, keycaps)
                ? t("pairedPersonal")
                : t("pairedRetail", {
                    housing: t(`housingNames.${housing}`),
                    keycaps:
                      SELECTION_KEYCAP_OPTIONS.find(
                        (option) => option.id === keycaps
                      )?.name ?? keycaps,
                  }),
              signature: `${housing}:${keycaps}`,
            }
          : undefined
      );
    },
    [setSelection, t]
  );
  const changeHousing = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const housing = event.currentTarget.value as SelectionHousingId;
      let { keycaps } = selection;
      if (housing === "transparent") {
        keycaps = "inventor";
      } else if (keycaps === "inventor") {
        ({ keycaps } = lastRetail.current);
      }
      applySelection(housing, keycaps, keycaps !== selection.keycaps);
    },
    [applySelection, selection]
  );
  const changeKeycaps = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const keycaps = event.currentTarget.value as SelectionKeycapId;
      let { housing } = selection;
      if (keycaps === "inventor") {
        housing = "transparent";
      } else if (housing === "transparent") {
        ({ housing } = lastRetail.current);
      }
      applySelection(housing, keycaps, housing !== selection.housing);
    },
    [applySelection, selection]
  );
  const angleRef = useRef(0);
  const rememberAngle = useCallback((angle: number) => {
    angleRef.current = angle;
  }, []);
  const personal = isPersonalConfiguration(
    selection.housing,
    selection.keycaps
  );
  const unsupported = isUnsupportedPersonalPair(
    selection.housing,
    selection.keycaps
  );
  const combination = getValidatedCombination(
    selection.housing,
    selection.keycaps
  );
  const selectedHousing =
    SELECTION_HOUSING_OPTIONS.find(
      (option) => option.id === selection.housing
    ) ?? SELECTION_HOUSING_OPTIONS[0];
  const selectedKeycaps =
    SELECTION_KEYCAP_OPTIONS.find(
      (option) => option.id === selection.keycaps
    ) ?? SELECTION_KEYCAP_OPTIONS[0];
  const revision = geometryRevision(personal, combination, props.spin);
  const retailState = unsupported ? "unsupported" : "retail";
  const selectedLabel = t("selected", {
    housing: t(`housingNames.${selectedHousing.id}`),
    keycaps: selectedKeycaps.name,
  });
  return (
    <div
      className="store-customizer"
      data-configuration={personal ? "personal" : retailState}
      data-geometry-revision={revision}
      data-orderable="false"
      data-testid="product-customizer"
    >
      <h2 className="store-custom-selection sr-only">{selectedLabel}</h2>
      <div className="store-custom-visual">
        <SelectionPreview
          angle={angleRef.current}
          combination={combination}
          gallery={props}
          onAngleChange={rememberAngle}
          personal={personal}
          unsupported={unsupported}
        />
      </div>
      <div className="store-custom-sidebar">
        {props.intro}
        <div className="store-custom-controls">
          {pairing?.signature ===
          `${selection.housing}:${selection.keycaps}` ? (
            <p
              aria-live="polite"
              className="sr-only"
              data-testid="customization-pairing-notice"
              role="status"
            >
              {pairing.message}
            </p>
          ) : null}
          <fieldset>
            <legend className="store-label">
              {t("housing")}{" "}
              <span className="store-custom-selected-name">
                {t(`housingNames.${selectedHousing.id}`)}
              </span>
            </legend>
            <div className="store-custom-swatches">
              {SELECTION_HOUSING_OPTIONS.map((option) => (
                <label
                  className="store-custom-option store-custom-color"
                  data-selected={selection.housing === option.id}
                  key={option.id}
                  title={t(`housingNames.${option.id}`)}
                >
                  <input
                    aria-label={t(`housingNames.${option.id}`)}
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
                    data-transparent={option.id === "transparent"}
                    style={{ backgroundColor: option.hex }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="store-label">{t("keycaps")}</legend>
            <div className="store-custom-kits">
              {SELECTION_KEYCAP_OPTIONS.map((option) => (
                <label
                  className="store-custom-option store-custom-kit"
                  data-selected={selection.keycaps === option.id}
                  key={option.id}
                  title={KEYCAP_LABELS[option.id]}
                >
                  <input
                    aria-label={KEYCAP_LABELS[option.id]}
                    checked={selection.keycaps === option.id}
                    className="sr-only"
                    name="keycaps"
                    onChange={changeKeycaps}
                    type="radio"
                    value={option.id}
                  />
                  <KeycapThumbnail id={option.id} />
                </label>
              ))}
            </div>
          </fieldset>
          <details
            className="store-custom-details"
            data-testid="customization-details"
          >
            <summary className="store-label">{t("detailsLabel")}</summary>
            <div className="store-custom-details-body store-prose">
              <p>{t("configurationNote")}</p>
              <dl>
                <div>
                  <dt>{t("housing")}</dt>
                  <dd>
                    {t(`housingNames.${selectedHousing.id}`)} ·{" "}
                    {selectedHousing.id === "transparent"
                      ? t("personalHousing")
                      : `${selectedHousing.material} · ${selectedHousing.sku}`}
                  </dd>
                </div>
                <div>
                  <dt>{t("keycaps")}</dt>
                  <dd>
                    {selectedKeycaps.name}
                    <br />
                    {t(
                      selectedKeycaps.id === "inventor"
                        ? "inventorNote"
                        : "fullRetailSet"
                    )}
                  </dd>
                </div>
              </dl>
              {selection.housing === "white-marble" ? (
                <p>{t("marbleNote")}</p>
              ) : null}
              {selection.housing === "transparent" ? (
                <p>{t("transparentNote")}</p>
              ) : null}
              <p>{t("approximation")}</p>
              {revision ? (
                <p>
                  {t(
                    revision === "assembled-draft"
                      ? "geometryAssembled"
                      : "geometryPrevious"
                  )}
                </p>
              ) : null}

              <div className="store-custom-sources store-label">
                {"sourceUrl" in selectedHousing ? (
                  <a
                    href={selectedHousing.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("materialSource")}
                  </a>
                ) : null}
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
          </details>
        </div>
        {props.details}
      </div>
    </div>
  );
}
