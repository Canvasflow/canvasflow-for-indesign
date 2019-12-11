# Canvasflow for InDesign

## Getting Started

### Installation

#### macOS
1. Open the `Terminal` app
	- From `Applications`
		1. Open `Finder`
		2. Go to `Applications`
		3. Open the directory  `Utilities`
		4. Double click the `Terminal`x
	- Shortcut
		1. Press `Command-Space`
		2. Writer `Terminal`
		3. Press `Enter`
2. Run `curl https://raw.githubusercontent.com/Canvasflow/canvasflow-for-indesign/master/scripts/install.sh | bash`
3. Restart `InDesign`

#### Windows
See [Installing the InDesign Plugin (Windows)](https://docs.canvasflow.io/article/243-installing-the-indesign-plugin-windows)

## Supported Image Link Files
The plugin will try to use the original image and try to create an optimize version if the image link is one of the following extensions:
- `jpg`
- `jpeg`
- `eps`
- `tiff`
- `tif`
- `png`
- `gif`
- `jp2`
- `pict`
- `bmp`
- `qtif`
- `psd`
- `sgi`
- `tea`
- `pdf`

If the image link is another extension that is not in this list, the plugin will use the image representation of the image that `InDesign` provides.
