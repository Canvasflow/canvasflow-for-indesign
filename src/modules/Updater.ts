class Updater {
	private api: CanvasflowApi;
	private version: string;
	private filePath: string;
	public latestVersion: string;

	constructor(api: CanvasflowApi, version: string, filePath?: string) {
		this.api = api;
		this.version = version;
		this.filePath = filePath;
	}

	getLatestVersion() {
		let response = this.api.getVersion();
		this.latestVersion = response.version;

		return this.latestVersion;
	}

	isUpdateRequired = () => this.getLatestVersion() !== this.version;

	update() {
		let dataFile = new File(this.filePath);
		if (!dataFile.exists) {
			throw new Error(`Error \nThe update file ${this.filePath} do not exist \nPlease re-install the plugin`);
		}

		dataFile.execute();
	}
}
