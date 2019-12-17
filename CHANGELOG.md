# Changelog
## [0.16.0] - 2019-12-17
- Send `os` and plugin `version` on publish for debugging
- Take `env` variable `CF_USER_BASE_PATH` into account when `installing/updating` with `install.sh`
- Fix 🐛 when `publishing` with non-raw page number

## [0.15.1] - 2019-12-11
- Fix 🐛 when processing the latest version when is a fresh install
  
## [0.15.0] - 2019-12-11
- Add `README`
- Add `LICENSE`
- Add `Update` functionality in `About` dialog
- Fix bug on `Windows` when processing `psd` and `pdf` inside `graphics`
- Improve `install` process on `macOS`
  
## [0.14.4] - 2019-12-05
- Enable support for `pdf` image link
- Add support for image link without a file path
- Include install shell script

## [0.14.3] - 2019-12-05
- Fix bug when building and publishing on `Windows`
  
## [0.14.2] - 2019-12-04
- Keep track of `InDesign version` in the log file 
- Keep track of `ExtendedScript Version` in the log file
  
## [0.14.1] - 2019-12-04
- `try/catch` inside `cleanSubstringContent` so it returns the original `substring` if `replace` fails

## [0.14.0] - 2019-12-03
- Add `MissingImagesDialog` to support missing images link
- Add support for `Typescript` components