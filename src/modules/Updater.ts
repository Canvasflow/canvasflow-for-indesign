class Updater {
	private api: CanvasflowApi;
	private version: string;
	private filePath: string;

	constructor(api: CanvasflowApi, version: string, filePath: string) {
		this.api = api;
		this.version = version;
		this.filePath = filePath;
	}

	run() {
		if (this.api.getHealth() === null) return;

		let response = this.api.getVersion();
		//@ts-ignore
		const latestVersion = response.version;
		if (this.version !== latestVersion) return; // FIXME Need to change the direction of the boolean

		const message = `New Version Available \nThere is a new version available ${latestVersion}\nDo you wish to install?`;
		response = confirm(message);
		if (!response) return;

		let dataFile = new File(this.filePath);
		if (!dataFile.exists) {
			throw new Error(`Error \nThe update file ${this.filePath} do not exist \nPlease re-install the plugin`);
		}

		dataFile.execute();
	}
}
