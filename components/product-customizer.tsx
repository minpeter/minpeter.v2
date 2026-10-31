"use client";

import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
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

import { getSpinLoader } from "@/shared/product-spin-loader";
import { useKeyboardCustomizationQuery } from "@/shared/use-keyboard-customization-query";

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

function retailOptionHint(
  housing: SelectionHousingId,
  keycaps: SelectionKeycapId
) {
  if (isUnsupportedPersonalPair(housing, keycaps)) {
    return "switchToRetail";
  }
  return getValidatedCombination(housing, keycaps)
    ? "renderReady"
    : "renderPending";
}

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
      <>
        <p
          className="store-label store-custom-note"
          data-testid="personal-showcase-notice"
        >
          {t("showcaseNote")}
        </p>
        <ProductGallery
          {...gallery}
          initialAngle={angle}
          onAngleChange={onAngleChange}
        />
      </>
    );
  }
  if (combination && !unsupported) {
    return (
      <ValidatedPreview
        combination={combination}
        initialAngle={angle}
        key={`${combination.id}:${combination.sourceDigest}`}
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
        {!unsupported && <p className="store-label">{t("kitQA")}</p>}
      </div>
    </div>
  );
}

/** Personal and retail appearances share selectors, never interchangeable renders. */
export function ProductCustomizer(props: ProductGalleryProps) {
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
  const retailState = unsupported ? "unsupported" : "retail";
  const selectedLabel = t("selected", {
    housing: t(`housingNames.${selectedHousing.id}`),
    keycaps: selectedKeycaps.name,
  });
  return (
    <div
      className="store-customizer"
      data-configuration={personal ? "personal" : retailState}
      data-orderable="false"
      data-testid="product-customizer"
    >
      <p className="store-custom-note store-prose">{t("configurationNote")}</p>
      <h2 className="store-label store-custom-selection">{selectedLabel}</h2>
      <SelectionPreview
        angle={angleRef.current}
        combination={combination}
        gallery={props}
        onAngleChange={rememberAngle}
        personal={personal}
        unsupported={unsupported}
      />
      <div className="store-custom-controls">
        {pairing?.signature === `${selection.housing}:${selection.keycaps}` ? (
          <p
            aria-live="polite"
            className="store-prose store-custom-pairing"
            data-testid="customization-pairing-notice"
            role="status"
          >
            {pairing.message}
          </p>
        ) : null}
        <fieldset>
          <legend className="store-label">{t("housing")}</legend>
          {selection.housing === "white-marble" ? (
            <p className="store-prose store-custom-note">{t("marbleNote")}</p>
          ) : null}
          {selection.housing === "transparent" ? (
            <p className="store-prose store-custom-note">
              {t("transparentNote")}
            </p>
          ) : null}
          <div className="store-custom-swatches">
            {SELECTION_HOUSING_OPTIONS.map((option) => (
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
                  data-transparent={option.id === "transparent"}
                  style={{ backgroundColor: option.hex }}
                />
                <span>
                  {t(`housingNames.${option.id}`)}
                  <small>
                    {option.id === "transparent"
                      ? t("personalHousing")
                      : `${option.material} · ${option.sku}`}
                  </small>
                  <small>
                    {option.id === "transparent"
                      ? t("personalOnly")
                      : t(retailOptionHint(option.id, selection.keycaps))}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="store-label">{t("keycaps")}</legend>
          <div className="store-custom-kits">
            {SELECTION_KEYCAP_OPTIONS.map((option) => (
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
                  <small>
                    {t(
                      option.id === "inventor"
                        ? "inventorNote"
                        : "fullRetailSet"
                    )}
                  </small>
                  <small>
                    {option.id === "inventor"
                      ? t("personalOnly")
                      : t(retailOptionHint(selection.housing, option.id))}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="store-prose">{t("approximation")}</p>
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
    </div>
  );
}
