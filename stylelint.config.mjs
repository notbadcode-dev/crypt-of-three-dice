export default {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "custom-property-pattern": null,
    "selector-class-pattern": null,
    "selector-id-pattern": null,
    "no-descending-specificity": null,
    "import-notation": null,
    "property-no-vendor-prefix": [true, { ignoreProperties: ["-webkit-user-select", "-webkit-backdrop-filter"] }],
    "scale-unlimited/declaration-strict-value": null,
    "value-keyword-case": [
      "lower",
      { ignoreProperties: ["/^font$/", "/^font-family$/", "/^--font/"] }
    ],
    "rule-empty-line-before": null,
    "at-rule-empty-line-before": null,
    "comment-empty-line-before": null,
    "declaration-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "declaration-block-single-line-max-declarations": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "media-feature-name-allowed-list": [
      "width",
      "height",
      "prefers-reduced-motion",
      "min-width",
      "max-width",
      "max-height"
    ],
    "media-feature-name-value-allowed-list": {
      "width": ["540px", "760px", "840px", "1100px", "1101px", "1320px"],
      "height": ["850px"]
    },
    "media-feature-name-unit-allowed-list": {
      "width": ["px"],
      "height": ["px"]
    },
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,
    "declaration-block-no-duplicate-properties": null,
    "no-duplicate-selectors": null,
    "media-feature-range-notation": null,
    "shorthand-property-no-redundant-values": null
  }
};
