class AboutDialog {
	private version: string;

	constructor(version: string) {
		this.version = version;
	}

	show() {
		// @ts-ignore
		let dialog = new Window('dialog', 'Canvasflow');
		dialog.orientation = 'column';
		dialog.alignment = 'right';
		dialog.preferredSize = [300, 100];
		let labelWidth = 100;
		let valueWidth = 200;

		let title = dialog.add('statictext', undefined, 'InDesign to Canvasflow');
		title.alignment = 'left';

		let fields = [
			{
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
			}
		];

		for(let field of fields) {
			let group = dialog.add('group');
			group.orientation = 'row';

			group.add('statictext', [0, 0, labelWidth, 20], field.label);
			group.add('statictext', [0, 0, valueWidth, 20], field.value);
		}

		dialog.add('statictext', [0, 0, labelWidth, 0], '');
		let copyright = dialog.add('statictext', undefined, '\u00A9 2015-2019 Canvasflow Ltd');
		copyright.alignment = 'left';

		dialog.buttonsBarGroup = dialog.add('group', undefined, 'buttons');
		dialog.buttonsBarGroup.closeBtn = dialog.add('button', undefined, 'Close');
		dialog.buttonsBarGroup.closeBtn.alignment = 'bottom';
		dialog.buttonsBarGroup.closeBtn.onClick = () => dialog.close();
		dialog.show();
	}
}
