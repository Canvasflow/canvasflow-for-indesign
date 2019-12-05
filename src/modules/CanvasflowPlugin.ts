class CanvasflowPlugin {
	private title: string;
	private os: string;
	private version: string;	
	private logFilePath: string;	
	private settingsFilePath: string;
	private resizeCommandFilePath: string;
	private convertCommandFilePath: string;
	
	constructor(os: string, version: string, logFilePath: string, settingsFilePath: string, resizeCommandFilePath: string, convertCommandFilePath: string) {
		this.title = 'Canvasflow';
		this.version = version;
		this.os = os;
		this.logFilePath = logFilePath;
		this.settingsFilePath = settingsFilePath;
		this.resizeCommandFilePath = resizeCommandFilePath;
		this.convertCommandFilePath = convertCommandFilePath;
	}

	install() {
		try {
			app.menus
				.item('$ID/Main')
				.submenus.item(this.title)
				.remove();
		} catch (e) {}

		// @ts-ignore
		let canvasflowScriptActionSettings = app.scriptMenuActions.add('&Settings');
		canvasflowScriptActionSettings.eventListeners.add('onInvoke', () => {
			let settingsFile = new File(this.settingsFilePath);
			if (!settingsFile.parent.exists) {
				alert('Please run the Install command, help please refer to the help documentation');
				return;
			}

			let logger: Logger;
			try {
				logger = new Logger(this.logFilePath, this.os, this.version);
				logger.start('Settings');
				let settingsDialog = new SettingsDialog(
					this.settingsFilePath,
					isInternal,
					logger
				);
				settingsDialog.show();
				logger.end();
			} catch (e) {
				logger.end(e);
				alert(e.message);
			}
		});

		// @ts-ignore
		let canvasflowScriptActionPublish = app.scriptMenuActions.add('&Publish');
		canvasflowScriptActionPublish.eventListeners.add('onInvoke', () => {
			let settingsFile = new File(this.settingsFilePath);
			if (!settingsFile.exists) {
				alert('Please open Settings first and register the api key');
				return;
			}
			const logger = new Logger(this.logFilePath, this.os, this.version);
			try {
				settingsFile.open('r');
				// @ts-ignore
				let settingsData = JSON.parse(settingsFile.read());

				if (!settingsData.endpoint) {
					alert('Please select an endpoint');
					return;
				}

				if (!settingsData.apiKey) {
					alert('Please register the api key in Settings');
					return;
				}

				if (!settingsData.PublicationID) {
					alert('Please select a publication in Settings');
					return;
				}

				if (!!app.activeDocument) {
					let settings = new Settings(this.settingsFilePath);
					let builder = new Builder(
						settings,
						this.resizeCommandFilePath,
						this.convertCommandFilePath,
						this.os,
						logger
					);
					let canvasflowApi = new CanvasflowApi(`http://${settingsData.endpoint}/v2`);
					let publisher = new Publisher(
						settings,
						settingsData.endpoint,
						builder,
						canvasflowApi,
						logger
					);

					logger.start('Publish', app.activeDocument);
					publisher.publish();
					logger.end();
				} else {
					alert('Please select an article to Publish');
				}
			} catch (e) {
				logger.end(e);
				alert(e.message);
			}
		});

		// @ts-ignore
		let canvasflowScriptActionBuild = app.scriptMenuActions.add('&Build');
		canvasflowScriptActionBuild.eventListeners.add('onInvoke', () => {
			let logger = new Logger(this.logFilePath, this.os, this.version);
			try {
				if (app.documents.length != 0) {
					let response = confirm('Do you wish to proceed? \nThis will generate the deliverable ZIP file, but will NOT publish to Canvasflow.\n\nPlease do this only if instructed by a member of the Canvasflow support team.');
					if (response) {
						let settings = new Settings(this.settingsFilePath);
						let builder = new Builder(
							settings,
							this.resizeCommandFilePath,
							this.convertCommandFilePath,
							this.os,
							logger
						);
						logger.start('Build', app.activeDocument);
						let buildFile = new File(builder.build());
						logger.end();

						if (builder.isBuildSuccess) {
							alert(`Build Completed\n${buildFile.displayName}`);
							buildFile.parent.execute();
						} else {
							alert('Build cancelled');
						}
					}
				} else {
					alert('Please select an article to build');
				}
			} catch (e) {
				logger.end(e);
				alert(e.message);
			}
		});

		// @ts-ignore
		let canvasflowScriptActionAbout = app.scriptMenuActions.add('&About');
		canvasflowScriptActionAbout.eventListeners.add('onInvoke', () => {
			try {
				let aboutDialog = new AboutDialog(this.version);
				aboutDialog.show();
			} catch (e) {
				alert(e.message);
			}
		});

		// @ts-ignore
		let canvasflowScriptActionLogs = app.scriptMenuActions.add('&Logs');
		canvasflowScriptActionLogs.eventListeners.add('onInvoke', () => {
			try {
				let logDialog = new LogDialog(this.logFilePath);
				logDialog.show();
			} catch (e) {
				alert(e.message);
			}
		});

		let canvasflowScriptMenu = null;
		try {
			canvasflowScriptMenu = app.menus
				.item('$ID/Main')
				.submenus.item(this.title);
			canvasflowScriptMenu.title;
		} catch (e) {
			canvasflowScriptMenu = app.menus
				.item('$ID/Main')
				.submenus.add(this.title);
		}

		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionPublish);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionSettings);
		canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionBuild);
		canvasflowScriptMenu.menuSeparators.add(LocationOptions.AT_END);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionLogs);
		canvasflowScriptMenu.menuItems.add(canvasflowScriptActionAbout);
	}
}

// @ts-ignore
let canvasflowPlugin = new CanvasflowPlugin(os, version, logFilePath, settingsFilePath, resizeCommandFilePath, convertCommandFilePath);
canvasflowPlugin.install();
