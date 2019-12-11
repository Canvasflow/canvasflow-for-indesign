class AboutDialog {
	private updateCommandFilePath: string;
	private api: CanvasflowApi;
	private version: string;
	private os: string;
	private dialog: any;
	private latestVersion: any;
	private updater: Updater;

	constructor(version: string, os: string, settingsFilePath?: string, updateCommandFilePath?: string) {
		this.version = version;
		this.os = os;
		if(!!settingsFilePath) {
			const settings = new Settings(settingsFilePath);
			const data = settings.getSavedSettings();
			this.api = new CanvasflowApi(`http://${data.endpoint}/v2`);
			this.updateCommandFilePath = updateCommandFilePath;
			this.updater = new Updater(this.api, this.version, this.updateCommandFilePath)
		}
	}

	show() {
		// @ts-ignore
		this.dialog = new Window('dialog', 'InDesign to Canvasflow');
		this.dialog.orientation = 'column';
		this.dialog.alignment = 'right';
		this.dialog.preferredSize = [350, 50];
		let labelWidth = 150;
		let valueWidth = 200;

		let fields = [];
		this.displayUpdateMessage(fields);

		fields.push({
			label: 'Version',
			value: this.version
		},
		{
			label: 'Install path',
			value: getBasePath()
		},
		{
			label: 'Support',
			value: 'support@canvasflow.io'
		},
		{
			label: 'Website',
			value: 'https://canvasflow.io'
		})

		for(let field of fields) {
			let group = this.dialog.add('group');
			group.orientation = 'row';

			group.add('statictext', [0, 0, labelWidth, 20], field.label);
			group.add('statictext', [0, 0, valueWidth, 20], field.value);
		}

		this.dialog.add('statictext', [0, 0, labelWidth, 0], '');
		let copyright = this.dialog.add('statictext', undefined, '\u00A9 2015-2019 Canvasflow Ltd');
		copyright.alignment = 'left';	

		this.dialog.buttonsBarGroup = this.dialog.add('group', undefined, 'buttons');
		this.dialog.buttonsBarGroup.orientation = 'row';

		// Close Button
		this.dialog.buttonsBarGroup.closeBtn = this.dialog.buttonsBarGroup.add('button', undefined, 'Close');
		this.dialog.buttonsBarGroup.closeBtn.onClick = () => this.dialog.close();

		// Update Button
		this.showUpdateButton()

		this.dialog.show();
	}

	displayUpdateMessage(fields: Array<any>) {
		try {
			if(!this.updater.isUpdateRequired()) return;
			this.latestVersion = this.updater.latestVersion;
			
			const message = this.dialog.add('statictext', undefined, 'UPDATE AVAILABLE');
			message.alignment = 'center';
			message.graphics.foregroundColor = message.graphics.newPen (this.dialog.graphics.PenType.SOLID_COLOR, [0.54,0.77,0.56], 1);
			
			fields.push({
				label: 'Latest version',
				value: this.latestVersion
			});
		} catch(e) {
			this.latestVersion = null;
		}
	}

	showUpdateButton() {
		if(this.os === 'unix' && !!this.updater && !!this.updateCommandFilePath && !!this.latestVersion) {
			try {
				if(!this.updater.isUpdateRequired()) return;

				this.dialog.buttonsBarGroup.updateBtn = this.dialog.buttonsBarGroup.add('button', undefined, 'Update');
				this.dialog.buttonsBarGroup.updateBtn.onClick = () => this.updater.update();
			} catch(e) {
				alert(e.message);
			}
		}	
	}
}
