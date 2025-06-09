# WebDFT

Mobile web app to calculate DFT and iDFT with directions.

### License

Licensed under the [MIT License](LICENSE). Copyright 2025 @cdelaof26.

_MIT License only applies to WebDFT v0.0.4 and newer._


### Versioning

#### v0.0.5 DFT logic improvements
- Improved `X(k)` polynomial simplification by 
  using nicolewhite's [algebra.js](https://github.com/nicolewhite/algebra.js)
- Updated limit to `DFT-200`
- Improved directions screen design

#### v0.0.4 Improvements
- Moved DFT logic over a worker
  - This fixes app unresponsiveness when 
    calculating a big DFT
  - However, this doesn't speed up the process
- Added spinning icon to every step
- Limited to `DFT-30` 

#### v0.0.3 Directions screen

#### v0.0.2 DFT calculator

#### v0.0.1 Initial project
